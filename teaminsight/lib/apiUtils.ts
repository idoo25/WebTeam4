import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyTeamSession } from "@/lib/teamSession";

// ============================================================================
// JSON RESPONSE HELPERS
// ============================================================================

export function jsonError(status: number, error: string, details?: string) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status });
}

export function jsonOk<T extends object>(data: T) {
  return NextResponse.json({ ok: true, ...data });
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

type AuthResult = { teamId: string } | { error: NextResponse };

export async function getTeamAuth(): Promise<AuthResult> {
  await connectDB();
  const cookieStore = await cookies();
  const token = cookieStore.get("team_session")?.value;
  const payload = token ? verifyTeamSession(token) : null;
  const teamId = payload?.teamId;

  if (!teamId) {
    return { error: jsonError(401, "Unauthorized", "Missing/invalid team_session cookie") };
  }
  return { teamId };
}

export function isAuthError(result: AuthResult): result is { error: NextResponse } {
  return "error" in result;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateEnum<T extends string>(
  value: unknown,
  validValues: readonly T[],
  fallback: T
): T {
  return validValues.includes(value as T) ? (value as T) : fallback;
}

export function validateNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function validateString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function validateArray<T>(
  value: unknown,
  validator: (item: unknown) => item is T,
  maxItems = 10
): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter(validator).slice(0, maxItems);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

// ============================================================================
// DATE HELPERS
// ============================================================================

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ============================================================================
// SCORE HELPERS
// ============================================================================

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scoreToColor(
  score: number,
  greenMin: number,
  redMax: number
): "green" | "yellow" | "red" {
  if (score >= greenMin) return "green";
  if (score <= redMax) return "red";
  return "yellow";
}

export function computeLegacyScore(evalRes: {
  quality: number;
  risk: number;
  compliance: number;
}): number {
  const score = (evalRes.quality * 0.45 + (10 - evalRes.risk) * 0.4 + evalRes.compliance * 0.15) * 10;
  return Math.round(clamp(score, 0, 100));
}
