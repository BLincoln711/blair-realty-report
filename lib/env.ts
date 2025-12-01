import { Buffer } from "node:buffer";

type ServerEnv = {
  gcpProjectId?: string;
  gcpServiceAccount?: string;
  gcpLocation?: string;
  bigQueryDataset?: string;
  bigQueryRawTable: string;
  bigQueryMentionsTable: string;
  bigQueryShareTable: string;
  firestoreTopicsCollection: string;
  firestoreEntitiesCollection: string;
  firestoreAlertsCollection: string;
};

const toOptional = (value?: string) => value?.trim() || undefined;

export const serverEnv: ServerEnv = {
  gcpProjectId: toOptional(process.env.GCP_PROJECT_ID),
  gcpServiceAccount: toOptional(
    process.env.GCP_SERVICE_ACCOUNT ?? process.env.GCP_SERVICE_ACCOUNT_B64
  ),
  gcpLocation: toOptional(process.env.GCP_LOCATION),
  bigQueryDataset: toOptional(process.env.BIGQUERY_DATASET),
  bigQueryRawTable: toOptional(process.env.BIGQUERY_TABLE_RAW) ?? "ai_raw_answers",
  bigQueryMentionsTable:
    toOptional(process.env.BIGQUERY_TABLE_MENTIONS) ?? "ai_mentions_normalized",
  bigQueryShareTable:
    toOptional(process.env.BIGQUERY_TABLE_SHARE) ?? "citation_share_scores",
  firestoreTopicsCollection:
    toOptional(process.env.FIRESTORE_TOPICS_COLLECTION) ?? "topics",
  firestoreEntitiesCollection:
    toOptional(process.env.FIRESTORE_ENTITIES_COLLECTION) ?? "entities",
  firestoreAlertsCollection:
    toOptional(process.env.FIRESTORE_ALERTS_COLLECTION) ?? "alerts",
};

export function isBigQueryConfigured() {
  return Boolean(
    serverEnv.gcpProjectId && serverEnv.gcpServiceAccount && serverEnv.bigQueryDataset
  );
}

export function isFirestoreConfigured() {
  return Boolean(serverEnv.gcpProjectId && serverEnv.gcpServiceAccount);
}

export function decodeServiceAccount() {
  if (!serverEnv.gcpServiceAccount) {
    return null;
  }

  const raw = serverEnv.gcpServiceAccount.trim();
  const json =
    raw.startsWith("{") || raw.startsWith("[")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");

  const parsed = JSON.parse(json);
  if (typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed;
}



