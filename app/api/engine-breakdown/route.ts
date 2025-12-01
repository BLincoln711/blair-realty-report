import { NextResponse } from "next/server";
import { fetchEngineBreakdown } from "@/lib/server/repositories/bigquery-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topic_id") ?? searchParams.get("topicId");
  const data = await fetchEngineBreakdown(topicId ?? undefined);
  return NextResponse.json({ data });
}

