'use client';

import { useMemo } from "react";
import {
  useAlerts,
  useCitationShare,
  useCitations,
  useCompetitors,
  useEngineBreakdown,
  useTopics,
  useEntities,
} from "@/hooks";
import { VisibilityScoreCard } from "@/components/dashboard/visibility-score-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CitationShareChart } from "@/components/dashboard/citation-share-chart";
import { EngineBreakdownCard } from "@/components/dashboard/engine-breakdown-card";
import { CompetitorGrid } from "@/components/dashboard/competitor-grid";
import { TopicsPanel } from "@/components/dashboard/topics-panel";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { CitationTable } from "@/components/dashboard/citation-table";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_TOPIC = process.env.NEXT_PUBLIC_DEFAULT_TOPIC ?? "ai-overviews";
const DEFAULT_BRAND = process.env.NEXT_PUBLIC_DEFAULT_BRAND ?? "hendricks";

export function DashboardShell() {
  const filters = useMemo(
    () => ({
      topicId: DEFAULT_TOPIC,
      brandId: DEFAULT_BRAND,
    }),
    []
  );

  const citationsQuery = useCitations(filters);
  const shareQuery = useCitationShare(filters);
  const competitorsQuery = useCompetitors(filters.topicId);
  const enginesQuery = useEngineBreakdown();
  const topicsQuery = useTopics();
  const alertsQuery = useAlerts();
  const entitiesQuery = useEntities();

  const isLoading =
    citationsQuery.isLoading ||
    shareQuery.isLoading ||
    competitorsQuery.isLoading ||
    enginesQuery.isLoading ||
    topicsQuery.isLoading ||
    alertsQuery.isLoading ||
    entitiesQuery.isLoading;

  const isError =
    citationsQuery.isError ||
    shareQuery.isError ||
    competitorsQuery.isError ||
    enginesQuery.isError ||
    topicsQuery.isError ||
    alertsQuery.isError ||
    entitiesQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        Failed to load dashboard data. Please refresh or check the API routes.
      </div>
    );
  }

  const citations = citationsQuery.data ?? [];
  const citationShare = shareQuery.data ?? [];
  const competitors = competitorsQuery.data ?? [];
  const engineBreakdown = enginesQuery.data ?? [];
  const topics = topicsQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];

  const mentionTotal = citations.length;
  const monitoredEngines = engineBreakdown.length;
  const benchDomains =
    entitiesQuery.data?.find((entity) => entity.entityId === filters.brandId)
      ?.domains ?? [];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VisibilityScoreCard
            score={72.1}
            percentile={88}
            change={4.3}
            benchmarks={[
              {
                label: "Primary domains",
                value: benchDomains.join(", ") || "hendricks.ai",
              },
              { label: "Mentions last 24h", value: mentionTotal.toString() },
            ]}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label="Net new citations"
            value={`+${Math.max(12, Math.round(mentionTotal * 0.15))}`}
            sublabel="Past 24h"
            trend={8.5}
            trendLabel="vs. prior period"
          />
          <MetricCard
            label="Engines monitored"
            value={monitoredEngines.toString()}
            sublabel="Google, Gemini, Perplexity, ChatGPT, Bing"
            trend={0}
            trendLabel="stable coverage"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <CitationShareChart data={citationShare} />
        <EngineBreakdownCard data={engineBreakdown} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <CompetitorGrid data={competitors} />
        <TopicsPanel topics={topics} />
        <AlertsPanel alerts={alerts} />
      </section>

      <CitationTable data={citations} />
    </div>
  );
}

