/**
 * Validation utilities
 */

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that a string is not empty (after trimming)
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates that a value is one of the allowed enum values
 */
export function isValidEnum<T extends string>(
  value: any,
  allowedValues: readonly T[]
): value is T {
  return allowedValues.includes(value);
}

/**
 * Validates team status
 */
export function isValidTeamStatus(
  status: any
): status is "green" | "yellow" | "red" {
  return isValidEnum(status, ["green", "yellow", "red"] as const);
}

/**
 * Validates alert severity
 */
export function isValidAlertSeverity(
  severity: any
): severity is "green" | "yellow" | "red" {
  return isValidEnum(severity, ["green", "yellow", "red"] as const);
}

/**
 * Validates reflection status
 */
export function isValidReflectionStatus(
  status: any
): status is "in_progress" | "ready_to_submit" | "submitted" {
  return isValidEnum(status, [
    "in_progress",
    "ready_to_submit",
    "submitted",
  ] as const);
}

/**
 * Sanitizes a string by trimming whitespace
 */
export function sanitizeString(value: string): string {
  return value.trim();
}

/**
 * Validates and sanitizes email
 */
export function validateAndSanitizeEmail(
  email: any
): { valid: boolean; email: string; error?: string } {
  if (!isNonEmptyString(email)) {
    return { valid: false, email: "", error: "Email is required" };
  }

  const sanitized = sanitizeString(email);

  if (!isValidEmail(sanitized)) {
    return { valid: false, email: sanitized, error: "Invalid email format" };
  }

  return { valid: true, email: sanitized };
}
