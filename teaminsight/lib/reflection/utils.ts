/**
 * Reflection route utilities
 * Common functions used across reflection API routes
 */

import { cookies } from "next/headers";
import { verifyTeamSession } from "@/lib/teamSession";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import { getEffectiveReflectionPolicy } from "./policy";

/**
 * Gets team ID from session cookie
 * Returns null if unauthorized
 */
export async function getTeamIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("team_session")?.value;
  const payload = token ? verifyTeamSession(token) : null;
  return payload?.teamId || null;
}

/**
 * Fetches recent submitted reflection summaries (last 14 days)
 */
export async function getRecentSubmittedSummaries(
  teamId: string,
  limit: number = 3
): Promise<string[]> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  const recentSubmitted = await ReflectionChatSession.find({
    teamId,
    status: "submitted",
    updatedAt: { $gte: fourteenDaysAgo },
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select({ aiSummary: 1 })
    .lean();

  return recentSubmitted
    .map((r: any) => r?.aiSummary)
    .filter((s: any) => typeof s === "string" && s.trim().length > 0);
}

/**
 * Gets effective reflection policy for a session
 * Uses snapshot from session if available, otherwise fetches current policy
 */
export async function getSessionPolicy(session: any) {
  const effective = await getEffectiveReflectionPolicy();
  
  return {
    profile: {
      key: session.profileKey || effective.profileKey || "default",
      title: effective.profile.title,
      controllerAddendum: effective.profile.controllerAddendum,
    },
    weeklyInstructions: session.weeklyInstructionsSnapshot || effective.weeklyInstructions || "",
  };
}

/**
 * Ensures session has policy snapshot
 * Updates session with current policy if missing
 */
export async function ensureSessionHasPolicy(session: any): Promise<void> {
  if (!session.profileKey || typeof session.weeklyInstructionsSnapshot !== "string") {
    const effective = await getEffectiveReflectionPolicy();
    session.profileKey = session.profileKey || effective.profileKey || "default";
    session.weeklyInstructionsSnapshot = 
      session.weeklyInstructionsSnapshot || effective.weeklyInstructions || "";
  }
}

/**
 * Formats team object for API response
 * Ensures consistent team data structure across endpoints
 */
export function formatTeamResponse(team: any) {
  return {
    teamId: team.teamId,
    projectName: team.projectName,
    status: team.status,
    members: team.members,
    contactEmail: team.contactEmail,
  };
}

