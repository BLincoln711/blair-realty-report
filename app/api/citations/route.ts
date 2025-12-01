import { NextResponse } from "next/server";
import { fetchCitations } from "@/lib/server/repositories/bigquery-data";
import { Citation } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topic_id") ?? searchParams.get("topicId");
  const brandId = searchParams.get("brand_id") ?? searchParams.get("brandId");
  const engine = searchParams.get("engine");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const data = await fetchCitations({
    topicId,
    brandId,
    engine,
    limit,
  });

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const citation = (await request.json()) as Citation;
  return NextResponse.json({ data: citation }, { status: 201 });
}

