import { randomUUID } from "node:crypto";
import { getBigQueryClient } from "@/lib/server/google-clients";
import {
  serverEnv,
  isBigQueryConfigured,
} from "@/lib/env";
import { mockData } from "@/lib/mock-data";
import {
  Citation,
  CitationSharePoint,
  CompetitorMetric,
  EngineBreakdown,
  EngineId,
} from "@/types";

type CitationFilters = {
  topicId?: string | null;
  brandId?: string | null;
  engine?: string | null;
  limit?: number;
};

const MAX_CITATIONS = 150;

type RawCitationRow = {
  id?: string;
  topic_id?: string;
  brand_id?: string;
  engine?: string;
  answer_text?: string;
  captured_at?: string;
  citations?: Array<{ title?: string; url?: string; domain?: string }>;
};

function buildTable(table: string) {
  return `\`${serverEnv.gcpProjectId}.${serverEnv.bigQueryDataset}.${table}\``;
}

function applyMockCitationFilters(filters: CitationFilters) {
  let data = [...mockData.citations];
  if (filters.topicId) {
    data = data.filter((item) => item.topicId === filters.topicId);
  }
  if (filters.brandId) {
    data = data.filter((item) => item.brandId === filters.brandId);
  }
  if (filters.engine) {
    data = data.filter((item) => item.engine === filters.engine);
  }
  return data.slice(0, filters.limit ?? MAX_CITATIONS);
}

export async function fetchCitations(filters: CitationFilters): Promise<Citation[]> {
  if (!isBigQueryConfigured()) {
    return applyMockCitationFilters(filters);
  }

  const bigquery = getBigQueryClient();
  if (!bigquery || !serverEnv.bigQueryDataset) {
    return applyMockCitationFilters(filters);
  }

  const table = buildTable(serverEnv.bigQueryRawTable);
  const query = `
    SELECT
      id,
      topic_id,
      brand_id,
      engine,
      answer_text,
      captured_at,
      citations
    FROM ${table}
    WHERE (@topicId IS NULL OR topic_id = @topicId)
      AND (@brandId IS NULL OR brand_id = @brandId)
      AND (@engine IS NULL OR engine = @engine)
    ORDER BY captured_at DESC
    LIMIT @limit
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: {
        topicId: filters.topicId ?? null,
        brandId: filters.brandId ?? null,
        engine: filters.engine ?? null,
        limit: filters.limit ?? MAX_CITATIONS,
      },
    });

    return (rows as RawCitationRow[]).map((row) => {
      const citationsArray = Array.isArray(row.citations) ? row.citations : [];
      const primary = citationsArray[0];

      return {
        id: row.id ?? randomUUID(),
        topicId: row.topic_id ?? filters.topicId ?? "unknown-topic",
        brandId: row.brand_id ?? filters.brandId ?? "unknown-brand",
        brandName: row.brand_id ?? "Unknown brand",
        engine: (row.engine as EngineId) ?? "google_ai_overview",
        answerText: row.answer_text ?? "",
        title: primary?.title ?? "AI answer",
        domain: primary?.domain ?? "unknown",
        url: primary?.url ?? "",
        mentionType: citationsArray.length > 0 ? "explicit" : "implicit",
        capturedAt: row.captured_at ?? new Date().toISOString(),
      } satisfies Citation;
    });
  } catch (error) {
    console.error("[citia.ai] Failed to query BigQuery citations", error);
    return applyMockCitationFilters(filters);
  }
}

type ShareFilters = {
  topicId?: string | null;
  brandId?: string | null;
  limit?: number;
};

type RawShareRow = {
  date?: string;
  topic_id?: string;
  engine?: string;
  entity_id?: string;
  entity_name?: string;
  mention_count?: number | string;
  total_mentions?: number | string;
  citation_share?: number | string;
};

function applyMockShareFilters(filters: ShareFilters) {
  let data = [...mockData.citationShare];
  if (filters.topicId) {
    data = data.filter((item) => item.topicId === filters.topicId);
  }
  if (filters.brandId) {
    data = data.filter((item) => item.entityId === filters.brandId);
  }
  return data.slice(0, filters.limit ?? 90);
}

export async function fetchCitationShare(
  filters: ShareFilters
): Promise<CitationSharePoint[]> {
  if (!isBigQueryConfigured()) {
    return applyMockShareFilters(filters);
  }

  const bigquery = getBigQueryClient();
  if (!bigquery || !serverEnv.bigQueryDataset) {
    return applyMockShareFilters(filters);
  }

  const table = buildTable(serverEnv.bigQueryShareTable);
  const query = `
    SELECT
      date,
      topic_id,
      engine,
      entity_id,
      mention_count,
      total_mentions,
      citation_share
    FROM ${table}
    WHERE (@topicId IS NULL OR topic_id = @topicId)
      AND (@brandId IS NULL OR entity_id = @brandId)
    ORDER BY date DESC
    LIMIT @limit
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: {
        topicId: filters.topicId ?? null,
        brandId: filters.brandId ?? null,
        limit: filters.limit ?? 90,
      },
    });

    return (rows as RawShareRow[]).map((row) => ({
      date: row.date ?? new Date().toISOString().slice(0, 10),
      topicId: row.topic_id ?? filters.topicId ?? "unknown-topic",
      engine: (row.engine as EngineId) ?? "google_ai_overview",
      entityId: row.entity_id ?? "unknown-entity",
      entityName: row.entity_name ?? row.entity_id ?? "Unknown entity",
      mentionCount: Number(row.mention_count ?? 0),
      totalMentions: Number(row.total_mentions ?? 0),
      citationShare: Number(row.citation_share ?? 0),
    }));
  } catch (error) {
    console.error("[citia.ai] Failed to query BigQuery citation share", error);
    return applyMockShareFilters(filters);
  }
}

export async function fetchCompetitors(topicId?: string): Promise<CompetitorMetric[]> {
  if (!isBigQueryConfigured()) {
    return mockData.competitors;
  }

  type RawCompetitorRow = {
    entity_id?: string;
    share?: number | string;
    mentions?: number | string;
  };

  const bigquery = getBigQueryClient();
  if (!bigquery || !serverEnv.bigQueryDataset) {
    return mockData.competitors;
  }

  const table = buildTable(serverEnv.bigQueryShareTable);
  const query = `
    WITH latest_date AS (
      SELECT MAX(date) AS max_date
      FROM ${table}
      WHERE (@topicId IS NULL OR topic_id = @topicId)
    )
    SELECT
      entity_id,
      AVG(citation_share) AS share,
      SUM(mention_count) AS mentions
    FROM ${table}, latest_date
    WHERE date = latest_date.max_date
      AND (@topicId IS NULL OR topic_id = @topicId)
    GROUP BY entity_id
    ORDER BY share DESC
    LIMIT 8
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { topicId: topicId ?? null },
    });

    return (rows as RawCompetitorRow[]).map((row) => ({
      entityId: row.entity_id ?? "unknown-entity",
      entityName: row.entity_id ?? "Unknown entity",
      share: Number(row.share ?? 0),
      delta: 0,
      mentions: Number(row.mentions ?? 0),
    }));
  } catch (error) {
    console.error("[citia.ai] Failed to query BigQuery competitors", error);
    return mockData.competitors;
  }
}

export async function fetchEngineBreakdown(topicId?: string): Promise<EngineBreakdown[]> {
  if (!isBigQueryConfigured()) {
    return mockData.engineBreakdown;
  }

  type RawEngineRow = {
    engine?: string;
    share?: number | string;
    total_mentions?: number | string;
  };

  const bigquery = getBigQueryClient();
  if (!bigquery || !serverEnv.bigQueryDataset) {
    return mockData.engineBreakdown;
  }

  const table = buildTable(serverEnv.bigQueryShareTable);
  const query = `
    SELECT
      engine,
      SAFE_DIVIDE(SUM(mention_count), SUM(total_mentions)) AS share,
      SUM(mention_count) AS total_mentions
    FROM ${table}
    WHERE (@topicId IS NULL OR topic_id = @topicId)
    GROUP BY engine
    ORDER BY share DESC
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { topicId: topicId ?? null },
    });

    return (rows as RawEngineRow[]).map((row) => ({
      engine: (row.engine as EngineId) ?? "google_ai_overview",
      share: Number(row.share ?? 0),
      change: 0,
      totalMentions: Number(row.total_mentions ?? 0),
    }));
  } catch (error) {
    console.error("[citia.ai] Failed to query BigQuery engine breakdown", error);
    return mockData.engineBreakdown;
  }
}

