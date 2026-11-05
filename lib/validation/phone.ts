import { AsYouType, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';

// `min` metadata (~80 kB) on both client and server: isValid() checks length + country,
// which is enough for a call-back form, and the same check runs on both sides (rule 6).
export const DEFAULT_PHONE_COUNTRY: CountryCode = 'AE';

/** E.164 for a valid number, otherwise null. National input is read as `country` (UAE by default). */
export function toE164(input: string, country: CountryCode = DEFAULT_PHONE_COUNTRY): string | null {
  const parsed = parsePhoneNumberFromString(input.trim(), country);
  return parsed?.isValid() ? parsed.number : null;
}

export const isValidPhone = (input: string, country?: CountryCode): boolean =>
  toE164(input, country) !== null;

/** Formatted text plus the E.164 typed so far ('' when empty); used by <PhoneInput>. */
export function formatAsYouType(
  input: string,
  country: CountryCode = DEFAULT_PHONE_COUNTRY,
): { text: string; e164: string } {
  const formatter = new AsYouType(country);
  const text = formatter.input(input);
  return { text, e164: formatter.getNumberValue() ?? '' };
}

/** International format for display (`+971 50 123 4567`); unknown input is returned as is. */
export function formatPhoneForDisplay(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}
