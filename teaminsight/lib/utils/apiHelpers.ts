/**
 * Common API utilities for Next.js route handlers
 */

import { NextResponse } from "next/server";
import connectDB from "../db";

/**
 * Creates a standardized JSON error response
 */
export function jsonError(
  status: number,
  error: string,
  details?: string | unknown
): NextResponse {
  return NextResponse.json(
    {
      error,
      details: typeof details === "string" ? details : String(details || ""),
    },
    { status }
  );
}

/**
 * Creates a standardized JSON success response
 */
export function jsonSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Higher-order function that wraps API route handlers with common functionality:
 * - Database connection
 * - Error handling
 * - Standardized error responses
 */
export function apiHandler<T = any>(
  handler: (req: Request, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      await connectDB();
      return await handler(req, context);
    } catch (err: any) {
      console.error("API Handler Error:", err);
      return jsonError(500, "Server error", err?.message || String(err));
    }
  };
}

/**
 * Validates that required fields exist in an object
 * Returns an error response if validation fails, or null if all fields are present
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): NextResponse | null {
  const missing = requiredFields.filter((field) => !data[field]);
  if (missing.length > 0) {
    return jsonError(
      400,
      "Missing required fields",
      `Required: ${missing.join(", ")}`
    );
  }
  return null;
}

/**
 * Safely parses JSON from request body
 * Returns parsed data or an error response
 */
export async function parseRequestBody<T = any>(
  req: Request
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const data = await req.json();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: jsonError(400, "Invalid JSON in request body"),
    };
  }
}
