import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import { runReflectionSummary } from "@/lib/ai/gemini";

export const runtime = "nodejs";

type Answer = {
  questionId: string;
  prompt: string;
  answer: string;
  createdAt?: Date;
};

async function getTeamIdFromMe(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  url.pathname = "/api/team/me";
  url.search = "";

  const cookie = req.headers.get("cookie") ?? "";
  const res = await fetch(url, { method: "GET", headers: { cookie } });
  const data = await res.json().catch(() => ({}));

  return data?.team?.teamId ?? data?.ok?.team?.teamId ?? null;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("team_session")?.value;
  if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = await getTeamIdFromMe(req);
  if (!teamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  await connectDB();

  const doc = await ReflectionChatSession.findOne({ teamId, sessionId });
  if (!doc) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (!doc.aiSummary && doc.answers.length > 0) {
    doc.aiSummary = await runReflectionSummary((doc.answers as Answer[]).map((a) => ({ prompt: a.prompt, answer: a.answer })));
  }

  doc.status = "submitted";
  await doc.save();

  return NextResponse.json({ ok: true, status: doc.status, aiSummary: doc.aiSummary ?? "" });
}
