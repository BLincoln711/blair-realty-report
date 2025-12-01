import { Timestamp, type DocumentData } from "@google-cloud/firestore";
import { getFirestoreClient } from "@/lib/server/google-clients";
import { isFirestoreConfigured, serverEnv } from "@/lib/env";
import { mockData } from "@/lib/mock-data";
import { AlertRecord, EntityRecord, TopicSummary } from "@/types";

function normalizeTimestamp(
  value: Timestamp | string | Date | undefined | null
): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return new Date().toISOString();
}

export async function listTopics(): Promise<TopicSummary[]> {
  if (!isFirestoreConfigured()) {
    return mockData.topicSummaries;
  }

  const firestore = getFirestoreClient();
  if (!firestore) {
    return mockData.topicSummaries;
  }

  const snapshot = await firestore
    .collection(serverEnv.firestoreTopicsCollection)
    .orderBy("topicName")
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data() as DocumentData;
    return {
      topicId: doc.id,
      topicName: data.topicName ?? data.name ?? doc.id,
      activeQueries: data.activeQueries ?? data.queryCount ?? 0,
      trackedEngines: data.trackedEngines ?? 0,
      lastRunAt: normalizeTimestamp(data.lastRunAt ?? data.updatedAt),
      querySeeds: data.querySeeds ?? [],
    } satisfies TopicSummary;
  });
}

export async function createTopicRecord(topic: TopicSummary): Promise<TopicSummary> {
  const payload = {
    topicName: topic.topicName,
    activeQueries: topic.activeQueries,
    trackedEngines: topic.trackedEngines,
    lastRunAt: topic.lastRunAt,
    querySeeds: topic.querySeeds ?? [],
  };

  if (!isFirestoreConfigured()) {
    return topic;
  }

  const firestore = getFirestoreClient();
  if (!firestore) {
    return topic;
  }

  await firestore
    .collection(serverEnv.firestoreTopicsCollection)
    .doc(topic.topicId)
    .set(payload, { merge: true });

  return topic;
}

export async function listEntities(): Promise<EntityRecord[]> {
  if (!isFirestoreConfigured()) {
    return mockData.entities;
  }

  const firestore = getFirestoreClient();
  if (!firestore) {
    return mockData.entities;
  }

  const snapshot = await firestore
    .collection(serverEnv.firestoreEntitiesCollection)
    .orderBy("entityName")
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data() as DocumentData;
    return {
      entityId: doc.id,
      entityName: data.entityName ?? data.name ?? doc.id,
      domains: data.domains ?? [],
      synonyms: data.synonyms ?? [],
      status: data.status === "paused" ? "paused" : "active",
    } satisfies EntityRecord;
  });
}

export async function createEntityRecord(entity: EntityRecord): Promise<EntityRecord> {
  const payload = {
    entityName: entity.entityName,
    domains: entity.domains,
    synonyms: entity.synonyms,
    status: entity.status,
  };

  if (!isFirestoreConfigured()) {
    return entity;
  }

  const firestore = getFirestoreClient();
  if (!firestore) {
    return entity;
  }

  await firestore
    .collection(serverEnv.firestoreEntitiesCollection)
    .doc(entity.entityId)
    .set(payload, { merge: true });

  return entity;
}

export async function listAlerts(): Promise<AlertRecord[]> {
  if (!isFirestoreConfigured()) {
    return mockData.alerts;
  }

  const firestore = getFirestoreClient();
  if (!firestore) {
    return mockData.alerts;
  }

  const snapshot = await firestore
    .collection(serverEnv.firestoreAlertsCollection)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data() as DocumentData;
    return {
      id: doc.id,
      type: data.type ?? "answer_change",
      severity: data.severity ?? "medium",
      message: data.message ?? "Alert",
      createdAt: normalizeTimestamp(data.createdAt),
    } satisfies AlertRecord;
  });
}

export async function createAlertRecord(alert: AlertRecord): Promise<AlertRecord> {
  const payload = {
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    createdAt: alert.createdAt,
  };

  if (!isFirestoreConfigured()) {
    return alert;
  }

  const firestore = getFirestoreClient();
  if (!firestore) {
    return alert;
  }

  await firestore
    .collection(serverEnv.firestoreAlertsCollection)
    .doc(alert.id)
    .set(payload, { merge: true });

  return alert;
}

