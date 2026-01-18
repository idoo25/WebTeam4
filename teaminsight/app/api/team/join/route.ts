import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import { signTeamSession } from "@/lib/teamSession";
import { formatTeamResponse } from "@/lib/reflection/utils";
import { jsonError, validateRequired, parseRequestBody } from "@/lib/utils/apiHelpers";

const COOKIE_NAME = "team_session";

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const { data: body, error: parseError } = await parseRequestBody(request);
    if (parseError) return parseError;

    const validationError = validateRequired(body, ["teamId", "accessCode"]);
    if (validationError) return validationError;

    const { teamId, accessCode } = body;

    const team = await Team.findOne({ teamId, accessCode }).lean();
    if (!team) {
      return jsonError(401, "Invalid teamId/accessCode");
    }

    const token = signTeamSession(
      { teamId: team.teamId },
      { maxAgeSeconds: 60 * 60 * 24 * 7 }
    );

    const res = NextResponse.json({
      ok: true,
      team: formatTeamResponse(team),
    });

    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    console.error("team/join error:", err);
    return jsonError(500, "Server error", err?.message || String(err));
  }
}
