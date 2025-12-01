import { NextResponse } from "next/server";
import { fetchCitationShare } from "@/lib/server/repositories/bigquery-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topic_id") ?? searchParams.get("topicId");
  const brandId = searchParams.get("brand_id") ?? searchParams.get("brandId");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const data = await fetchCitationShare({
    topicId,
    brandId,
    limit,
  });

  return NextResponse.json({ data });
}

