const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const MULTISPACE = /\s+/g;
const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const SAFE_IMAGE_PROTOCOLS = new Set(["http:", "https:", "blob:"]);

export function sanitizeText(value: unknown, maxLength = 240): string {
  return String(value ?? "")
    .replace(CONTROL_CHARS, " ")
    .replace(MULTISPACE, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUrl(value: unknown): string {
  const cleaned = sanitizeText(value, 500);
  if (!cleaned) return "";

  const normalized = /^[a-z][a-z0-9+.-]*:/i.test(cleaned) ? cleaned : `https://${cleaned}`;

  try {
    const url = new URL(normalized);
    return SAFE_URL_PROTOCOLS.has(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

export function sanitizeImageUrl(value: unknown): string {
  const cleaned = sanitizeText(value, 1000);
  if (!cleaned) return "";

  if (cleaned.startsWith("data:image/")) {
    return cleaned;
  }

  try {
    const url = new URL(cleaned);
    return SAFE_IMAGE_PROTOCOLS.has(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

export function sanitizeOptionalText(value: unknown, maxLength = 240): string | null {
  const cleaned = sanitizeText(value, maxLength);
  return cleaned || null;
}
