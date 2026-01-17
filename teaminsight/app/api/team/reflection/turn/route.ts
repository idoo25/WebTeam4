import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import { verifyTeamSession } from "@/lib/teamSession";

import ReflectionChatSession from "@/models/ReflectionChatSession";
import ReflectionSubmission from "@/models/ReflectionSubmission";

import { runReflectionController, runReflectionInterviewer } from "@/lib/ai/cerebras";

export const runtime = "nodejs";

type TurnBody = { text: string };

function jsonError(status: number, error: string, details?: string) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status });
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("team_session")?.value;

    const payload = token ? verifyTeamSession(token) : null;
    const teamId = payload?.teamId;
    if (!teamId) return jsonError(401, "Unauthorized", "Missing/invalid team_session cookie or payload.teamId");

    const body = (await req.json().catch(() => null)) as TurnBody | null;
    const userText = (body?.text || "").trim();
    if (!userText) return jsonError(400, "Missing text");

    const session = await ReflectionChatSession.findOne({
      teamId,
      status: "in_progress",
    });

    if (!session) return jsonError(409, "No active reflection session. Call /start first.");

    session.messages.push({ role: "user", text: userText });
    session.currentIndex = (session.currentIndex || 0) + 1;

    const recent = await ReflectionSubmission.find({
      teamId,
      submittedAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    })
      .sort({ submittedAt: -1 })
      .limit(3)
      .lean();

    const recentSummaries = recent
      .map((r: any) => r?.summary)
      .filter((s: any) => typeof s === "string" && s.trim().length > 0);

    const controller = await runReflectionController({
      messages: session.messages,
      answers: session.answers,
      runningSummary: session.aiSummary || "",
      clarifyCount: session.clarifyCount || 0,
      turnCount: session.currentIndex || 0,
      maxTurns: 16,
      recentSummaries,
    });

    session.aiSummary = controller.runningSummary;
    session.answers = controller.answers;
    session.clarifyCount = controller.clarifyCount;
    session.currentIndex = controller.turnCount;

    const assistantText = await runReflectionInterviewer({
      messages: session.messages,
      nextIntent: controller.nextIntent,
    });

    session.messages.push({ role: "assistant", text: assistantText });
    await session.save();

    return NextResponse.json({
      ok: true,
      assistantText,
      readyToSubmit: controller.readyToSubmit === true,
      status: session.status,
      runningSummary: session.aiSummary || "",
    });
  } catch (err: any) {
    console.error("reflection/turn error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
