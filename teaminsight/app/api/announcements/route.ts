import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Announcement from "@/models/Announcement";
import {
  apiHandler,
  jsonError,
  jsonSuccess,
  validateRequired,
  parseRequestBody,
} from "@/lib/utils/apiHelpers";

export async function POST(request: Request) {
  return apiHandler(async () => {
    const { data: body, error: parseError } = await parseRequestBody(request);
    if (parseError) return parseError;

    const validationError = validateRequired(body, ["title", "body", "targetTeams"]);
    if (validationError) return validationError;

    const { title, body: announcementBody, targetTeams } = body;

    const created = await Announcement.create({
      title,
      body: announcementBody,
      targetTeams,
    });

    return jsonSuccess({ ok: true, announcementId: created._id }, 201);
  })(request);
}

export async function GET(request: Request) {
  return apiHandler(async () => {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    // If teamId provided: return announcements targeting "all" OR that teamId
    const filter = teamId
      ? {
          $or: [
            { targetTeams: "all" },
            { targetTeams: teamId },
            { targetTeams: { $in: [teamId] } },
          ],
        }
      : {}; // lecturer view: all

    const announcements = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return jsonSuccess({ ok: true, announcements });
  })(request);
}
