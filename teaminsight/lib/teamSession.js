import crypto from "crypto";

/**
 * Encode a buffer or string to base64url format (URL-safe base64)
 * @param {Buffer|string} input - The input to encode
 * @returns {string} Base64url encoded string
 */
function base64urlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Decode a base64url string to UTF-8
 * @param {string} input - Base64url encoded string
 * @returns {string} Decoded UTF-8 string
 */
function base64urlDecode(input) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

/**
 * Create HMAC-SHA256 signature in base64 format
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key for signing
 * @returns {string} Base64 encoded signature
 */
function hmacSHA256Base64(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64");
}

/**
 * Convert standard base64 to base64url format
 * @param {string} b64 - Base64 encoded string
 * @returns {string} Base64url encoded string
 */
function base64ToBase64url(b64) {
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Sign a team session payload and create a secure token
 * Creates a token with the format: base64url(payload).base64url(signature)
 * 
 * @param {Object} payload - The session data to sign (e.g., {teamId: "TEAM-01"})
 * @param {Object} options - Options for token generation
 * @param {number} [options.maxAgeSeconds=604800] - Token expiration time in seconds (default: 7 days)
 * @returns {string} Signed session token
 * @throws {Error} If TEAM_SESSION_SECRET environment variable is not set
 */
export function signTeamSession(payload, { maxAgeSeconds = 60 * 60 * 24 * 7 } = {}) {
  const secret = process.env.TEAM_SESSION_SECRET;
  if (!secret) throw new Error("Missing TEAM_SESSION_SECRET");

  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + maxAgeSeconds };

  const encodedPayload = base64urlEncode(JSON.stringify(body));
  const signature = base64ToBase64url(hmacSHA256Base64(encodedPayload, secret));

  return `${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a team session token
 * Validates the signature and checks expiration
 * 
 * @param {string} token - The session token to verify
 * @returns {Object|null} Decoded payload if valid, null if invalid or expired
 * @throws {Error} If TEAM_SESSION_SECRET environment variable is not set
 */
export function verifyTeamSession(token) {
  const secret = process.env.TEAM_SESSION_SECRET;
  if (!secret) throw new Error("Missing TEAM_SESSION_SECRET");
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expected = base64ToBase64url(hmacSHA256Base64(encodedPayload, secret));
  if (signature !== expected) return null;

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(encodedPayload));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || now > payload.exp) return null;

  return payload;
}
