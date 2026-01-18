import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import { getTeamIdFromSession } from "@/lib/reflection/utils";
import { jsonError } from "@/lib/utils/apiHelpers";

export const runtime = "nodejs";

export async function POST() {
  try {
    await connectDB();

    const teamId = await getTeamIdFromSession();
    if (!teamId) {
      return jsonError(401, "Unauthorized", "Missing/invalid team_session cookie or payload.teamId");
    }

    await ReflectionChatSession.deleteMany({
      teamId,
      status: { $in: ["in_progress", "ready_to_submit"] },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("reflection/reset error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
