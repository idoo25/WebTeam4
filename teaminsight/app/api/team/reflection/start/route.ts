import { NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import { runReflectionController, runReflectionInterviewer } from "@/lib/ai/gemini";
import { getEffectiveReflectionPolicy } from "@/lib/reflection/policy";
import {
  getTeamIdFromSession,
  getRecentSubmittedSummaries,
  getSessionPolicy,
  ensureSessionHasPolicy,
} from "@/lib/reflection/utils";
import { jsonError } from "@/lib/utils/apiHelpers";

export const runtime = "nodejs";

type Msg = { role: "user" | "model"; text: string };

export async function POST() {
  try {
    await connectDB();

    const teamId = await getTeamIdFromSession();
    if (!teamId) {
      return jsonError(401, "Unauthorized", "Missing/invalid team_session cookie or payload.teamId");
    }

    let session = await ReflectionChatSession.findOne({
      teamId,
      status: { $in: ["in_progress", "ready_to_submit"] },
    });

    const effective = await getEffectiveReflectionPolicy();

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
        submittedAt: null,
        profileKey: effective.profileKey || "default",
        weeklyInstructionsSnapshot: effective.weeklyInstructions || "",
        reflectionScore: null,
        reflectionColor: null,
        reflectionReasons: [],
      });
    }

    // Return existing session if already started
    if ((session.messages || []).length > 0) {
      return NextResponse.json({
        ok: true,
        sessionId: session.sessionId,
        status: session.status,
        messages: session.messages as Msg[],
        runningSummary: "",
        summary: "",
      });
    }

    // Ensure session has policy snapshot
    await ensureSessionHasPolicy(session);

    const recentSummaries = await getRecentSubmittedSummaries(teamId);
    const policy = await getSessionPolicy(session);

    const controller = await runReflectionController({
      messages: session.messages,
      answers: session.answers,
      runningSummary: session.aiSummary || "",
      clarifyCount: session.clarifyCount || 0,
      turnCount: session.currentIndex || 0,
      maxTurns: 16,
      recentSummaries,
      policy,
    });

    const assistantText = await runReflectionInterviewer({
      messages: session.messages,
      nextIntent: controller.nextIntent,
    });

    session.messages.push({ role: "model", text: assistantText });
    session.aiSummary = controller.runningSummary;
    session.answers = controller.answers;
    session.clarifyCount = controller.clarifyCount;
    session.currentIndex = controller.turnCount;

    await session.save();

    return NextResponse.json({
      ok: true,
      sessionId: session.sessionId,
      status: session.status,
      messages: session.messages as Msg[],
      runningSummary: "",
      summary: "",
    });
  } catch (err: any) {
    console.error("reflection/start error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
