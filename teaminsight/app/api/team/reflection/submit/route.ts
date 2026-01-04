import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import { runReflectionSummary } from "@/lib/ai/gemini";
import { getTeamIdFromSession } from "@/lib/auth";
import type { ReflectionAnswer } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("team_session")?.value;
  if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = await getTeamIdFromSession(req);
  if (!teamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  await connectDB();

  const doc = await ReflectionChatSession.findOne({ teamId, sessionId });
  if (!doc) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (!doc.aiSummary && doc.answers.length > 0) {
    doc.aiSummary = await runReflectionSummary((doc.answers as ReflectionAnswer[]).map((a) => ({ prompt: a.prompt, answer: a.answer })));
  }

  doc.status = "submitted";
  await doc.save();

  return NextResponse.json({ ok: true, status: doc.status, aiSummary: doc.aiSummary ?? "" });
}
