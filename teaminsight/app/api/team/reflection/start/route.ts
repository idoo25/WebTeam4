import { NextResponse } from "next/server";
import crypto from "crypto";
import { getTeamAuth, isAuthError, jsonError, daysAgo } from "@/lib/apiUtils";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import { runReflectionController, runReflectionInterviewer } from "@/lib/ai/gemini";
import { getEffectiveReflectionPolicy } from "@/lib/reflection/policy";

export const runtime = "nodejs";

type Msg = { role: "user" | "model"; text: string };

async function getRecentSummaries(teamId: string): Promise<string[]> {
  const recent = await ReflectionChatSession.find({
    teamId,
    status: "submitted",
    updatedAt: { $gte: daysAgo(14) },
  })
    .sort({ updatedAt: -1 })
    .limit(3)
    .select({ aiSummary: 1 })
    .lean();

  return recent.map((r: any) => r?.aiSummary).filter((s: any) => typeof s === "string" && s.trim().length > 0);
}

export async function POST() {
  try {
    const auth = await getTeamAuth();
    if (isAuthError(auth)) return auth.error;
    const { teamId } = auth;

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

    // Fix legacy sessions
    const currentKey = (session.profileKey || "").trim();
    if (!currentKey || currentKey === "default") {
      session.profileKey = effective.profileKey || "default";
    }
    if (!session.weeklyInstructionsSnapshot?.trim()) {
      session.weeklyInstructionsSnapshot = effective.weeklyInstructions || "";
    }

    const recentSummaries = await getRecentSummaries(teamId);

    const policy = {
      profile: {
        key: effective.profile.key,
        title: effective.profile.title,
        controllerAddendum: effective.profile.controllerAddendum,
      },
      weeklyInstructions: session.weeklyInstructionsSnapshot || "",
    };

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
