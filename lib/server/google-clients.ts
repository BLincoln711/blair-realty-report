import { BigQuery } from "@google-cloud/bigquery";
import { Firestore } from "@google-cloud/firestore";
import {
  decodeServiceAccount,
  isBigQueryConfigured,
  isFirestoreConfigured,
  serverEnv,
} from "@/lib/env";

let bigQueryClient: BigQuery | null = null;
let firestoreClient: Firestore | null = null;

export function getBigQueryClient(): BigQuery | null {
  if (!isBigQueryConfigured()) {
    return null;
  }

  if (bigQueryClient) {
    return bigQueryClient;
  }

  const credentials = decodeServiceAccount();
  if (!credentials) {
    return null;
  }

  bigQueryClient = new BigQuery({
    projectId: serverEnv.gcpProjectId,
    credentials,
    location: serverEnv.gcpLocation,
  });

  return bigQueryClient;
}

export function getFirestoreClient(): Firestore | null {
  if (!isFirestoreConfigured()) {
    return null;
  }

  if (firestoreClient) {
    return firestoreClient;
  }

  const credentials = decodeServiceAccount();
  if (!credentials) {
    return null;
  }

  firestoreClient = new Firestore({
    projectId: serverEnv.gcpProjectId,
    credentials,
  });

  return firestoreClient;
}



