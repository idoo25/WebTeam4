import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import { verifyTeamSession } from "@/lib/teamSession";

import ReflectionChatSession from "@/models/ReflectionChatSession";
import { runReflectionFinalSummary } from "@/lib/ai/cerebras";

export const runtime = "nodejs";

function jsonError(status: number, error: string, details?: string) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status });
}

export async function POST() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("team_session")?.value;

    const payload = token ? verifyTeamSession(token) : null;
    const teamId = payload?.teamId;
    if (!teamId) return jsonError(401, "Unauthorized", "Missing/invalid team_session cookie or payload.teamId");

    const session = await ReflectionChatSession.findOne({ teamId, status: "in_progress" });
    if (!session) return jsonError(409, "No active session");

    const summary = await runReflectionFinalSummary({
      answers: session.answers,
      runningSummary: session.aiSummary || "",
    });

    session.aiSummary = summary;
    session.status = "ready_to_submit";
    await session.save();

    return NextResponse.json({ ok: true, status: session.status, summary });
  } catch (err: any) {
    console.error("reflection/finish error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
