import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import ReflectionProfile from "@/models/ReflectionProfile";
import Team from "@/models/Team";
import { runReflectionFinalSummary, runReflectionEvaluation } from "@/lib/ai/gemini";
import { getTeamIdFromSession } from "@/lib/reflection/utils";
import { jsonError } from "@/lib/utils/apiHelpers";

export const runtime = "nodejs";

function computeScore(evalRes: { quality: number; risk: number; compliance: number }) {
  const score =
    (evalRes.quality * 0.45 + (10 - evalRes.risk) * 0.4 + evalRes.compliance * 0.15) * 10;
  return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreToColor(score: number, greenMin: number, redMax: number) {
  if (score >= greenMin) return "green" as const;
  if (score <= redMax) return "red" as const;
  return "yellow" as const;
}

export async function POST() {
  try {
    await connectDB();

    const teamId = await getTeamIdFromSession();
    if (!teamId) {
      return jsonError(401, "Unauthorized", "Missing/invalid team_session cookie or payload.teamId");
    }

    const session = await ReflectionChatSession.findOne({
      teamId,
      status: "ready_to_submit",
    });

    if (!session) return jsonError(409, "Nothing to confirm");

    // Load the exact profile used by this session
    const profileKey = (session.profileKey || "default").trim() || "default";
    const profile =
      (await ReflectionProfile.findOne({ key: profileKey }).lean()) ||
      (await ReflectionProfile.findOne({ key: "default" }).lean());

    if (!profile) return jsonError(500, "Missing ReflectionProfile", "No default profile found");

    // 1) Final summary (stored, not returned to student)
    const finalSummary = await runReflectionFinalSummary({
      answers: session.answers,
      runningSummary: session.aiSummary || "",
    });

    // 2) Evaluation
    const evalRes = await runReflectionEvaluation({
      summary: finalSummary,
      answers: session.answers,
      policy: {
        profile: { key: profile.key, evaluatorAddendum: profile.evaluatorAddendum || "" },
        weeklyInstructions: session.weeklyInstructionsSnapshot || "",
      },
    });

    // 3) Score + color
    const score = computeScore(evalRes);
    const color = scoreToColor(score, Number(profile.greenMin ?? 75), Number(profile.redMax ?? 45));

    // 4) Save on session
    session.aiSummary = finalSummary;
    session.reflectionScore = score;
    session.reflectionColor = color;
    session.reflectionReasons = (evalRes.reasons || []).slice(0, 5);

    session.status = "submitted";
    session.submittedAt = new Date();
    await session.save();

    // 5) Update Team.status
    await Team.updateOne(
      { teamId },
      {
        $set: {
          status: color,
          reflectionScore: score,
          reflectionUpdatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ ok: true, submissionId: String(session._id) });
  } catch (err: any) {
    console.error("reflection/confirm error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
