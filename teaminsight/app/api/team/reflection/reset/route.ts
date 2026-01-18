import { NextResponse } from "next/server";
import { getTeamAuth, isAuthError, jsonError } from "@/lib/apiUtils";
import ReflectionChatSession from "@/models/ReflectionChatSession";

export const runtime = "nodejs";

export async function POST() {
  try {
    const auth = await getTeamAuth();
    if (isAuthError(auth)) return auth.error;

    await ReflectionChatSession.deleteMany({
      teamId: auth.teamId,
      status: { $in: ["in_progress", "ready_to_submit"] },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("reflection/reset error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
