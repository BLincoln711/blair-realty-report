import { addDays, formatISO } from "date-fns";
import {
  AlertRecord,
  Citation,
  CitationSharePoint,
  CompetitorMetric,
  EngineBreakdown,
  EntityRecord,
  TopicSummary,
} from "@/types";

const baseDate = new Date("2025-11-10");

const competitors: CompetitorMetric[] = [
  {
    entityId: "hendricks",
    entityName: "Hendricks.ai",
    share: 0.42,
    delta: 0.03,
    mentions: 82,
  },
  {
    entityId: "omni",
    entityName: "OmniPrompt",
    share: 0.29,
    delta: -0.02,
    mentions: 56,
  },
  {
    entityId: "scribe",
    entityName: "ScribePilot",
    share: 0.19,
    delta: 0.01,
    mentions: 37,
  },
  {
    entityId: "atlas",
    entityName: "Atlas Insight",
    share: 0.1,
    delta: -0.01,
    mentions: 19,
  },
];

const engineBreakdown: EngineBreakdown[] = [
  {
    engine: "google_ai_overview",
    share: 0.48,
    change: 0.04,
    totalMentions: 95,
  },
  {
    engine: "gemini_ai_mode",
    share: 0.22,
    change: -0.01,
    totalMentions: 44,
  },
  {
    engine: "perplexity_answers",
    share: 0.17,
    change: 0.02,
    totalMentions: 34,
  },
  {
    engine: "chatgpt_search",
    share: 0.08,
    change: -0.01,
    totalMentions: 16,
  },
  {
    engine: "bing_deep",
    share: 0.05,
    change: 0,
    totalMentions: 10,
  },
];

const citationShare: CitationSharePoint[] = Array.from({ length: 10 }).flatMap(
  (_, index) => {
    const date = formatISO(addDays(baseDate, index), { representation: "date" });
    return competitors.map((competitor, idx) => ({
      date,
      topicId: "ai-overviews",
      engine: idx % 2 ? "google_ai_overview" : "perplexity_answers",
      entityId: competitor.entityId,
      entityName: competitor.entityName,
      mentionCount: Math.max(1, competitor.mentions - index * idx),
      totalMentions: 200 - index * 4,
      citationShare: Math.max(
        0.05,
        competitor.share + (Math.sin(index + idx) * 0.05) / (idx + 1)
      ),
    }));
  }
);

const citations: Citation[] = Array.from({ length: 8 }).map((_, index) => ({
  id: `citation-${index + 1}`,
  topicId: "ai-overviews",
  brandId: index % 2 === 0 ? "hendricks" : "omni",
  brandName: index % 2 === 0 ? "Hendricks.ai" : "OmniPrompt",
  engine: engineBreakdown[index % engineBreakdown.length].engine,
  answerText:
    "Enterprise AI enablement suites compared. Hendricks.ai highlighted for regulated workflows.",
  title: "AI Overview result",
  domain:
    index % 3 === 0 ? "forrester.com" : index % 3 === 1 ? "gartner.com" : "news.ycombinator.com",
  url: "https://example.com/citation",
  mentionType: index % 2 === 0 ? "explicit" : "implicit",
  capturedAt: formatISO(addDays(baseDate, index)),
}));

const topicSummaries: TopicSummary[] = [
  {
    topicId: "ai-overviews",
    topicName: "AI Overviews",
    activeQueries: 124,
    trackedEngines: 5,
    lastRunAt: formatISO(addDays(baseDate, 9)),
    querySeeds: [
      "ai overview enterprise enablement",
      "best ai onboarding platform",
      "ai copilots for sales teams",
    ],
  },
  {
    topicId: "prompt-platforms",
    topicName: "Prompt Platforms",
    activeQueries: 87,
    trackedEngines: 4,
    lastRunAt: formatISO(addDays(baseDate, 8)),
    querySeeds: [
      "prompt management enterprise",
      "prompt ops software",
      "prompt governance",
    ],
  },
];

const entities: EntityRecord[] = [
  {
    entityId: "hendricks",
    entityName: "Hendricks.ai",
    domains: ["hendricks.ai", "hendricks.app"],
    synonyms: ["Hendricks AI", "Hendricks platform"],
    status: "active",
  },
  {
    entityId: "omni",
    entityName: "OmniPrompt",
    domains: ["omniprompt.com"],
    synonyms: ["Omni Prompt", "OmniPrompt AI"],
    status: "active",
  },
  {
    entityId: "scribe",
    entityName: "ScribePilot",
    domains: ["scribepilot.ai"],
    synonyms: ["Scribe Pilot"],
    status: "paused",
  },
];

const alerts: AlertRecord[] = [
  {
    id: "alert-1",
    type: "competitor_surge",
    severity: "high",
    message: "OmniPrompt gained 6 new citations on Gemini AI mode.",
    createdAt: formatISO(addDays(baseDate, 9)),
  },
  {
    id: "alert-2",
    type: "lost_citation",
    severity: "medium",
    message: "Google AI Overview replaced Hendricks.ai with ScribePilot.",
    createdAt: formatISO(addDays(baseDate, 8)),
  },
];

export const mockData = {
  competitors,
  engineBreakdown,
  citationShare,
  citations,
  topicSummaries,
  alerts,
  entities,
};

