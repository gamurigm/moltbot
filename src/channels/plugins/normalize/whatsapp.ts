import { normalizeWhatsAppTarget } from "../../../whatsapp/normalize.js";
import { looksLikeHandleOrPhoneTarget, trimMessagingTarget } from "./shared.js";

export function normalizeWhatsAppMessagingTarget(raw: string): string | undefined {
  const trimmed = trimMessagingTarget(raw);
  if (!trimmed) {
    return undefined;
  }
  return normalizeWhatsAppTarget(trimmed) ?? undefined;
}

<<<<<<< Updated upstream
export function normalizeWhatsAppAllowFromEntries(allowFrom: Array<string | number>): string[] {
  return allowFrom
    .map((entry) => String(entry).trim())
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => (entry === "*" ? entry : normalizeWhatsAppTarget(entry)))
    .filter((entry): entry is string => Boolean(entry));
}

export function looksLikeWhatsAppTargetId(raw: string): boolean {
  return looksLikeHandleOrPhoneTarget({
    raw,
    prefixPattern: /^whatsapp:/i,
  });
=======
export function looksLikeWhatsAppTargetId(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }
  if (/^whatsapp:/i.test(trimmed)) {
    return true;
  }
  if (trimmed.includes("@")) {
    return true;
  }
  // Allow phone numbers with spaces, dashes, or parentheses
  if (/^\+?[\d\s-.()]{7,}$/.test(trimmed)) {
    return true;
  }
  return /^\+?\d{3,}$/.test(trimmed);
>>>>>>> Stashed changes
}
