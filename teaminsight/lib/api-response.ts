/**
 * Standard API response types for consistent error handling
 */

export type ApiSuccessResponse<T = unknown> = {
  ok: true;
} & T;

export type ApiErrorResponse = {
  error: string;
  details?: string;
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Helper to create consistent success responses
 */
export function successResponse<T>(data: T, status = 200) {
  return Response.json({ ok: true, ...data }, { status });
}

/**
 * Helper to create consistent error responses
 */
export function errorResponse(error: string, status = 500, details?: string) {
  return Response.json({ error, ...(details && { details }) }, { status });
}
