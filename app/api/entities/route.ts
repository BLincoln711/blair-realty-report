import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createEntityRecord,
  listEntities,
} from "@/lib/server/repositories/firestore-data";
import { EntityRecord } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const data = await listEntities();
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as EntityRecord;
  const entity: EntityRecord = {
    ...payload,
    entityId: payload.entityId ?? randomUUID(),
    domains: payload.domains ?? [],
    synonyms: payload.synonyms ?? [],
    status: payload.status ?? "active",
  };
  const saved = await createEntityRecord(entity);
  return NextResponse.json({ data: saved }, { status: 201 });
}

