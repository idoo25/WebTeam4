import { NextResponse } from "next/server";
import { getTeamAuth, isAuthError, jsonError, scoreToColor, computeLegacyScore } from "@/lib/apiUtils";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import ReflectionProfile from "@/models/ReflectionProfile";
import Team from "@/models/Team";
import { runReflectionFinalSummary, runReflectionEvaluation } from "@/lib/ai/gemini";

export const runtime = "nodejs";

function extractTasksFromSummary(summary: string): string[] {
  const tasksMatch = summary.match(/##.*משימות.*\n([\s\S]*?)(?=\n---|\n##|$)/i);
  if (!tasksMatch) return [];

  return tasksMatch[1]
    .split("\n")
    .filter((line) => /^(\d+[\.\)]|\*|-|###)\s/.test(line.trim()))
    .map((line) => line.replace(/^(\d+[\.\)]|\*|-|###)\s*\**/, "").trim())
    .filter((line) => line.length > 5 && !line.startsWith("מה לעשות") && !line.startsWith("מי אחראי") && !line.startsWith("עד מתי"))
    .slice(0, 3);
}

export async function POST() {
  try {
    const auth = await getTeamAuth();
    if (isAuthError(auth)) return auth.error;
    const { teamId } = auth;

    const session = await ReflectionChatSession.findOne({ teamId, status: "ready_to_submit" });
    if (!session) return jsonError(409, "Nothing to confirm");

    const profileKey = (session.profileKey || "default").trim() || "default";
    const profile = (await ReflectionProfile.findOne({ key: profileKey }).lean()) ||
      (await ReflectionProfile.findOne({ key: "default" }).lean());

    if (!profile) return jsonError(500, "Missing ReflectionProfile", "No default profile found");

    const finalSummary = await runReflectionFinalSummary({
      answers: session.answers,
      runningSummary: session.aiSummary || "",
      messages: session.messages,
    });

    const evalRes = await runReflectionEvaluation({
      summary: finalSummary,
      answers: session.answers,
      messages: session.messages,
      policy: {
        profile: { key: profile.key, evaluatorAddendum: profile.evaluatorAddendum || "" },
        weeklyInstructions: session.weeklyInstructionsSnapshot || "",
      },
    });

    const thsScore = evalRes.teamHealthScore || 0;
    const legacyScore = computeLegacyScore(evalRes);
    const finalScore = thsScore > 0 ? thsScore : legacyScore;
    const color = scoreToColor(finalScore, Number(profile.greenMin ?? 75), Number(profile.redMax ?? 45));

    // Update session
    Object.assign(session, {
      aiSummary: finalSummary,
      teamHealthScore: evalRes.teamHealthScore,
      thsComponents: evalRes.components,
      tuckmanStage: evalRes.tuckmanStage,
      tuckmanExplanation: evalRes.tuckmanExplanation || "",
      riskLevel: evalRes.riskLevel,
      riskExplanation: evalRes.riskExplanation || "",
      anomalyFlags: evalRes.anomalyFlags || [],
      strengths: evalRes.strengths || [],
      concerns: evalRes.concerns || [],
      recommendations: evalRes.recommendations || [],
      reflectionScore: finalScore,
      reflectionColor: color,
      reflectionReasons: (evalRes.reasons || []).slice(0, 5),
      qualityBreakdown: evalRes.qualityBreakdown || "",
      riskBreakdown: evalRes.riskBreakdown || "",
      complianceBreakdown: evalRes.complianceBreakdown || "",
      status: "submitted",
      submittedAt: new Date(),
    });
    await session.save();

    await Team.updateOne({ teamId }, {
      $set: {
        status: color,
        reflectionScore: finalScore,
        teamHealthScore: evalRes.teamHealthScore,
        tuckmanStage: evalRes.tuckmanStage,
        riskLevel: evalRes.riskLevel,
        anomalyFlags: evalRes.anomalyFlags || [],
        reflectionUpdatedAt: new Date(),
      },
    });

    let studentTasks = extractTasksFromSummary(finalSummary);
    if (studentTasks.length === 0 && evalRes.recommendations?.length > 0) {
      studentTasks = evalRes.recommendations.slice(0, 3);
    }

    return NextResponse.json({
      ok: true,
      submissionId: String(session._id),
      teamHealthScore: evalRes.teamHealthScore,
      tuckmanStage: evalRes.tuckmanStage,
      tasks: studentTasks,
      strengths: (evalRes.strengths || []).slice(0, 2),
    });
  } catch (err: any) {
    console.error("reflection/confirm error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
