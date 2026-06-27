import crypto from "crypto";

/**
 * Constant-time verification of the scanner PIN.
 *
 * - Normalizes both sides with String().trim() so callers behave identically.
 * - Denies access if SCANNER_PIN is not configured (never allow an empty PIN).
 * - Uses timingSafeEqual to avoid leaking the PIN via response timing.
 */
export function verifyScannerPin(pin: unknown): boolean {
  const expected = String(process.env.SCANNER_PIN ?? "").trim();
  if (!expected) return false; // not configured → deny

  const provided = String(pin ?? "").trim();
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
