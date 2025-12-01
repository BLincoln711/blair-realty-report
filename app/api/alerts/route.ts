import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createAlertRecord,
  listAlerts,
} from "@/lib/server/repositories/firestore-data";
import { AlertRecord } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const data = await listAlerts();
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AlertRecord;
  const alert: AlertRecord = {
    ...payload,
    id: payload.id ?? randomUUID(),
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };

  const saved = await createAlertRecord(alert);
  return NextResponse.json({ data: saved }, { status: 201 });
}

