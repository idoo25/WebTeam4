/**
 * Authentication utilities for API routes
 */

/**
 * Extract team ID from the team session cookie by calling the /api/team/me endpoint
 * This is used in API routes that need to verify team authentication
 * 
 * @param req - The incoming request object
 * @returns The team ID if authenticated, null otherwise
 */
export async function getTeamIdFromSession(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  url.pathname = "/api/team/me";
  url.search = "";

  const cookie = req.headers.get("cookie") ?? "";
  const res = await fetch(url, { method: "GET", headers: { cookie } });
  const data = await res.json().catch(() => ({}));

  return data?.team?.teamId ?? data?.ok?.team?.teamId ?? null;
}

/**
 * Type guard for validating chat messages
 */
export function isValidChatMessage(
  m: unknown
): m is { role: "user" | "model"; text: string } {
  return (
    typeof m === "object" &&
    m !== null &&
    "role" in m &&
    "text" in m &&
    (m.role === "user" || m.role === "model") &&
    typeof m.text === "string"
  );
}
