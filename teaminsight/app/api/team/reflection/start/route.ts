import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

import { connectDB } from "@/lib/db";
import { verifyTeamSession } from "@/lib/teamSession";

import ReflectionChatSession from "@/models/ReflectionChatSession";
import ReflectionSubmission from "@/models/ReflectionSubmission";

import { runReflectionController, runReflectionInterviewer } from "@/lib/ai/cerebras";

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

    let session = await ReflectionChatSession.findOne({
      teamId,
      status: { $in: ["in_progress", "ready_to_submit"] },
    });

    if (!session) {
      session = await ReflectionChatSession.create({
        teamId,
        sessionId: crypto.randomUUID(),
        status: "in_progress",
        currentIndex: 0,
        clarifyCount: 0,
        messages: [],
        answers: [],
        aiSummary: "",
      });
    }

    // if already has messages, just return
    if (session.messages.length > 0) {
      return NextResponse.json({
        ok: true,
        sessionId: session.sessionId,
        status: session.status,
        messages: session.messages,
        runningSummary: session.aiSummary || "",
        summary: session.status === "ready_to_submit" ? (session.aiSummary || "") : "",
      });
    }

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

    const assistantText = await runReflectionInterviewer({
      messages: session.messages,
      nextIntent: controller.nextIntent,
    });

    session.messages.push({ role: "assistant", text: assistantText });
    session.aiSummary = controller.runningSummary;
    session.answers = controller.answers;
    session.clarifyCount = controller.clarifyCount;
    session.currentIndex = controller.turnCount;
    await session.save();

    return NextResponse.json({
      ok: true,
      sessionId: session.sessionId,
      status: session.status,
      messages: session.messages,
      runningSummary: session.aiSummary || "",
      summary: "",
    });
  } catch (err: any) {
    console.error("reflection/start error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
