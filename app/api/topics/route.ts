import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createTopicRecord,
  listTopics,
} from "@/lib/server/repositories/firestore-data";
import { TopicSummary } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const data = await listTopics();
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as TopicSummary;
  const topic: TopicSummary = {
    ...payload,
    topicId: payload.topicId ?? randomUUID(),
    lastRunAt: payload.lastRunAt ?? new Date().toISOString(),
    querySeeds: payload.querySeeds ?? [],
  };

  const saved = await createTopicRecord(topic);
  return NextResponse.json({ data: saved }, { status: 201 });
}

