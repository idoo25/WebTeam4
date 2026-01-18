import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import {
  apiHandler,
  jsonError,
  jsonSuccess,
  validateRequired,
  parseRequestBody,
} from "@/lib/utils/apiHelpers";
import { isValidTeamStatus, isValidEmail } from "@/lib/utils/validation";

export async function GET(request: Request) {
  return apiHandler(async () => {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "teamId";
    const order =
      (searchParams.get("order") || "asc").toLowerCase() === "desc" ? -1 : 1;

    const allowed = new Set(["teamId", "projectName", "status", "createdAt"]);
    const sortField = allowed.has(sortBy) ? sortBy : "teamId";

    const teams = await Team.find({})
      .select("teamId projectName status contactEmail members createdAt")
      .sort({ [sortField]: order })
      .lean();

    return jsonSuccess({ ok: true, teams });
  })(request);
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const { data: body, error: parseError } = await parseRequestBody(request);
    if (parseError) return parseError;

    const validationError = validateRequired(body, [
      "teamId",
      "projectName",
      "accessCode",
      "contactEmail",
    ]);
    if (validationError) return validationError;

    const {
      teamId,
      projectName,
      accessCode,
      contactEmail,
      members = [],
      status = "green",
    } = body;

    if (!isValidEmail(contactEmail)) {
      return jsonError(400, "Invalid email format");
    }

    if (status && !isValidTeamStatus(status)) {
      return jsonError(
        400,
        "Invalid status",
        "Status must be green, yellow, or red"
      );
    }

    const exists = await Team.exists({ teamId });
    if (exists) {
      return jsonError(409, "teamId already exists");
    }

    const created = await Team.create({
      teamId,
      projectName,
      accessCode,
      contactEmail,
      members,
      status,
    });

    return jsonSuccess({ ok: true, teamId: created.teamId }, 201);
  })(request);
}
