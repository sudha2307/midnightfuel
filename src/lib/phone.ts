/**
 * Phone Number Normalization & Validation Utility for Midnight Fuel
 * Ensures Indian phone numbers in various input formats (+91, 91, 0, spaces, dashes)
 * are mapped to a canonical 10-digit string to prevent duplicate customer records.
 */

export function normalizePhoneNumber(input: string | null | undefined): string {
  if (!input) return "";

  // 1. Strip all non-digit characters
  const digits = input.replace(/\D/g, "");

  // 2. Handle international prefix for India (91)
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  // 3. Handle leading 0 (STD code style)
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  // 4. If exact 10 digits
  if (digits.length === 10) {
    return digits;
  }

  // 5. If longer than 10 digits with unexpected prefix, take last 10 digits
  if (digits.length > 10) {
    return digits.slice(-10);
  }

  return digits;
}

export function isValidIndianPhone(phone: string | null | undefined): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Valid Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(normalized);
}

export function formatDisplayPhone(phone: string | null | undefined): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length === 10) {
    return `+91 ${normalized.slice(0, 5)} ${normalized.slice(5)}`;
  }
  return phone || "";
}
