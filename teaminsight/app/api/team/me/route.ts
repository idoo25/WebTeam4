import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import { getTeamIdFromSession, formatTeamResponse } from "@/lib/reflection/utils";
import { jsonError } from "@/lib/utils/apiHelpers";

export async function GET() {
  try {
    const teamId = await getTeamIdFromSession();
    
    if (!teamId) {
      return jsonError(401, "Unauthorized");
    }

    await connectDB();
    const team = await Team.findOne({ teamId }).lean();

    if (!team) {
      return jsonError(404, "Team not found");
    }

    return NextResponse.json({
      ok: true,
      team: formatTeamResponse(team),
    });
  } catch (err: any) {
    console.error("team/me error:", err);
    return jsonError(500, "Server error", err?.message || String(err));
  }
}
