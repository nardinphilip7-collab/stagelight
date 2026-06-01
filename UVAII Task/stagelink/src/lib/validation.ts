// Shared form-validation helpers for profile edit + settings.
// Pure functions — safe to use in both input onChange guards and save-time gates.

export const AGE_MIN = 0;
export const AGE_MAX = 120;
export const YEAR_MIN = 1900;
export const YEAR_MAX = new Date().getFullYear() + 10;

// Text length caps (frontend-only guards mirroring the field-type spec).
export const STAGE_NAME_MAX = 80;
export const LEGAL_NAME_MAX = 120;
export const AGENCY_MAX = 120;
export const TAGLINE_MAX = 200;
export const BIO_MAX = 2000;

// Multi-select arrays: minItems 0, maxItems 50.
export const MAX_MULTI_ITEMS = 50;

/** Returns today's date as an ISO `YYYY-MM-DD` string (for <input type="date" max>). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Strip everything but digits, optionally capping length. */
export function sanitizeDigits(value: string, maxLen?: number): string {
  const digits = value.replace(/\D/g, "");
  return maxLen ? digits.slice(0, maxLen) : digits;
}

/** Clamp a string/number to an integer within [min, max]; empty stays empty. */
export function clampInt(value: string | number, min: number, max: number): string {
  const s = String(value).replace(/\D/g, "");
  if (s === "") return "";
  let n = parseInt(s, 10);
  if (Number.isNaN(n)) return "";
  if (n < min) n = min;
  if (n > max) n = max;
  return String(n);
}

/** True when the value is a 4-digit year within [min, max]. Empty/blank is allowed. */
export function isPlausibleYear(value: string | number | undefined | null, min = YEAR_MIN, max = YEAR_MAX): boolean {
  if (value === undefined || value === null || value === "") return true;
  const s = String(value).trim();
  if (!/^\d{4}$/.test(s)) return false;
  const n = parseInt(s, 10);
  return n >= min && n <= max;
}

/** True for a syntactically valid http(s) URL. Empty/blank is allowed. */
export function isValidHttpUrl(value: string | undefined | null): boolean {
  if (!value || !value.trim()) return true;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** True for a plausible email address. Empty/blank is allowed. */
export function isValidEmail(value: string | undefined | null): boolean {
  if (!value || !value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** True for a plausible phone number. Empty/blank is allowed. */
export function isValidPhone(value: string | undefined | null): boolean {
  if (!value || !value.trim()) return true;
  const v = value.trim();
  if (!/^[+\d().\-\s]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** True when a numeric value is strictly > 0. Empty/blank is allowed (optional fields). */
export function isPositiveNumber(value: string | number | undefined | null): boolean {
  if (value === undefined || value === null || String(value).trim() === "") return true;
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
}

/** True when an ISO date string is strictly after today. Empty/blank is not future. */
export function isFutureDate(iso: string | undefined | null): boolean {
  if (!iso || !iso.trim()) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > new Date(todayISO()).getTime();
}
