/** wa.me link for an E.164 number, or null when the number is missing. Phase 4 adds templates. */
export function waMeUrl(phoneE164: string, text?: string): string | null {
  const digits = phoneE164.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
