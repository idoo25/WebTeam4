import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Alert from "@/models/Alert";
import Team from "@/models/Team";
import Lecturer from "@/models/Lecturer";
import { sendMail } from "@/lib/mailer";
import {
  apiHandler,
  jsonError,
  jsonSuccess,
  validateRequired,
  parseRequestBody,
} from "@/lib/utils/apiHelpers";
import { isValidAlertSeverity } from "@/lib/utils/validation";

export async function GET(request: Request) {
  return apiHandler(async () => {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    const filter = teamId ? { teamId } : {};
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).lean();

    return jsonSuccess({ ok: true, alerts });
  })(request);
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const { data: body, error: parseError } = await parseRequestBody(request);
    if (parseError) return parseError;

    const validationError = validateRequired(body, [
      "teamId",
      "severity",
      "message",
    ]);
    if (validationError) return validationError;

    const { teamId, severity, message } = body;

    if (!isValidAlertSeverity(severity)) {
      return jsonError(
        400,
        "Invalid severity",
        "Severity must be green, yellow, or red"
      );
    }

    const teamExists = await Team.exists({ teamId });
    if (!teamExists) {
      return jsonError(404, "Team not found");
    }

    const lecturer = await Lecturer.findOne().lean();
    const emailTo = lecturer?.email || "";

    const created = await Alert.create({
      teamId,
      severity,
      message,
      emailTo,
      emailStatus: "pending",
    });

    if (severity === "red" && emailTo) {
      try {
        await sendMail(
          emailTo,
          `Critical alert for team ${teamId}`,
          message
        );
        await Alert.findByIdAndUpdate(created._id, {
          emailStatus: "sent",
        });
      } catch (emailErr: any) {
        console.error(
          `Failed to send email for alert ${created._id}:`,
          emailErr
        );
        await Alert.findByIdAndUpdate(created._id, {
          emailStatus: "failed",
        });
      }
    }

    return jsonSuccess({ ok: true, alertId: created._id }, 201);
  })(request);
}
