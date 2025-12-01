export type EngineId =
  | "google_ai_overview"
  | "gemini_ai_mode"
  | "perplexity_answers"
  | "chatgpt_search"
  | "bing_deep";

export type MentionType = "explicit" | "implicit";

export type CompetitorMetric = {
  entityId: string;
  entityName: string;
  share: number;
  delta: number;
  mentions: number;
};

export type EngineBreakdown = {
  engine: EngineId;
  share: number;
  change: number;
  totalMentions: number;
};

export type CitationSharePoint = {
  date: string;
  topicId: string;
  engine: EngineId;
  entityId: string;
  entityName: string;
  mentionCount: number;
  totalMentions: number;
  citationShare: number;
};

export type Citation = {
  id: string;
  topicId: string;
  brandId: string;
  brandName: string;
  engine: EngineId;
  answerText: string;
  title: string;
  domain: string;
  url: string;
  mentionType: MentionType;
  capturedAt: string;
};

export type TopicSummary = {
  topicId: string;
  topicName: string;
  activeQueries: number;
  trackedEngines: number;
  lastRunAt: string;
  querySeeds?: string[];
};

export type EntityRecord = {
  entityId: string;
  entityName: string;
  domains: string[];
  synonyms: string[];
  status: "active" | "paused";
};

export type AlertSeverity = "low" | "medium" | "high";
export type AlertType =
  | "lost_citation"
  | "competitor_surge"
  | "answer_change"
  | "topic_created";

export type AlertRecord = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  createdAt: string;
};

