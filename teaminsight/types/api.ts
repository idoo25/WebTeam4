/**
 * API response type definitions
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
  details?: string;
}

export interface ApiSuccessResponse<T = any> {
  ok: true;
  data: T;
}

// Legacy response types (used in existing API routes)
export interface LegacyApiResponse {
  error?: string;
  details?: string;
  [key: string]: any;
}
