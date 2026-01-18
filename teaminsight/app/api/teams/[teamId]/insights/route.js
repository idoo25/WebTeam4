// app/api/teams/[teamId]/insights/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Alert from "@/models/Alert";
import ReflectionChatSession from "@/models/ReflectionChatSession";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { teamId } = params;

    const team = await Team.findOne({ teamId }).lean();
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const alertsCount = await Alert.countDocuments({ teamId });
    const reflectionsCount = await ReflectionChatSession.countDocuments({ teamId });

    const strengths = [];
    const risks = [];

    if (team.status === "green") {
      strengths.push("Good collaboration and stable progress");
    }
    if (team.status === "yellow") {
      risks.push("Some coordination or workload imbalance detected");
    }
    if (team.status === "red") {
      risks.push("High risk: intervention recommended");
    }
    if (alertsCount > 0) {
      risks.push("Alerts were raised for this team");
    }
    if (reflectionsCount === 0) {
      risks.push("No reflections submitted yet");
    }

    return NextResponse.json({
      ok: true,
      teamId,
      insights: {
        status: team.status,
        strengths,
        risks,
        metrics: {
          alertsCount,
          reflectionsCount,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
