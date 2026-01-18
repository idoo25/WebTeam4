import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import { runReflectionController, runReflectionInterviewer } from "@/lib/ai/gemini";
import {
  getTeamIdFromSession,
  getRecentSubmittedSummaries,
  getSessionPolicy,
  ensureSessionHasPolicy,
} from "@/lib/reflection/utils";
import { jsonError } from "@/lib/utils/apiHelpers";

export const runtime = "nodejs";

type TurnBody = { text: string };

export async function POST(req: Request) {
  try {
    await connectDB();

    const teamId = await getTeamIdFromSession();
    if (!teamId) {
      return jsonError(401, "Unauthorized", "Missing/invalid team_session cookie or payload.teamId");
    }

    const body = (await req.json().catch(() => null)) as TurnBody | null;
    const userText = (body?.text || "").trim();
    if (!userText) return jsonError(400, "Missing text");

    const session = await ReflectionChatSession.findOne({ teamId, status: "in_progress" });
    if (!session) {
      const ready = await ReflectionChatSession.findOne({ teamId, status: "ready_to_submit" }).select({ _id: 1 });
      if (ready) {
        return jsonError(409, "Reflection is ready to submit", "Use /confirm to submit or /reset to start over.");
      }
      return jsonError(409, "No active reflection session. Call /start first.");
    }

    session.messages.push({ role: "user", text: userText });
    session.currentIndex = (session.currentIndex || 0) + 1;

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

    session.aiSummary = controller.runningSummary;
    session.answers = controller.answers;
    session.clarifyCount = controller.clarifyCount;
    session.currentIndex = controller.turnCount;

    let assistantText = "";

    if (controller.readyToSubmit === true) {
      session.status = "ready_to_submit";
      assistantText =
        "סיימנו ✅ יש לי את כל מה שצריך לרפלקציה. עכשיו אפשר להגיש או לבטל ולהתחיל מחדש דרך הכפתורים למעלה.";
    } else {
      assistantText = await runReflectionInterviewer({
        messages: session.messages,
        nextIntent: controller.nextIntent,
      });
    }

    session.messages.push({ role: "model", text: assistantText });
    await session.save();

    return NextResponse.json({
      ok: true,
      assistantText,
      readyToSubmit: controller.readyToSubmit === true,
      status: session.status,
      runningSummary: "",
    });
  } catch (err: any) {
    console.error("reflection/turn error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
