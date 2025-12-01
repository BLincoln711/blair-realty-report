import {
  AlertRecord,
  Citation,
  CitationSharePoint,
  CompetitorMetric,
  EngineBreakdown,
  EntityRecord,
  TopicSummary,
} from "@/types";

type ApiResponse<T> = {
  data: T;
};

const baseUrl =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
    : "";

const withBaseUrl = (path: string) => `${baseUrl}${path}`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(withBaseUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed request to ${path}`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

const toQuery = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const api = {
  getCitations: (params: {
    topicId?: string;
    brandId?: string;
    engine?: string;
  }) =>
    request<Citation[]>(
      `/api/citations${toQuery({
        topicId: params.topicId,
        brandId: params.brandId,
        engine: params.engine,
      })}`
    ),
  getCitationShare: (params: { topicId?: string; brandId?: string }) =>
    request<CitationSharePoint[]>(
      `/api/citation-share${toQuery({
        topicId: params.topicId,
        brandId: params.brandId,
      })}`
    ),
  getCompetitors: (topicId?: string) =>
    request<CompetitorMetric[]>(
      `/api/competitors${toQuery({ topicId })}`
    ),
  getEngineBreakdown: () =>
    request<EngineBreakdown[]>("/api/engine-breakdown"),
  getTopics: () => request<TopicSummary[]>("/api/topics"),
  getEntities: () => request<EntityRecord[]>("/api/entities"),
  getAlerts: () => request<AlertRecord[]>("/api/alerts"),
  createTopic: (payload: TopicSummary) =>
    request<TopicSummary>("/api/topics", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createEntity: (payload: EntityRecord) =>
    request<EntityRecord>("/api/entities", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createAlert: (payload: AlertRecord) =>
    request<AlertRecord>("/api/alerts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

