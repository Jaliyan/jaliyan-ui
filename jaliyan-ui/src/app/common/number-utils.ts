export const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
export const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function gujaratiToEnglishDigits(input: string | number): string {
  if (input == null) return '';
  const str = input.toString(); // ✅ Always convert to string
  return str.replace(/[૦-૯]/g, (d) => englishDigits[gujaratiDigits.indexOf(d)]);
}

export function englishToGujaratiDigits(input: string | number): string {
  if (input == null) return '';
  const str = input.toString(); // ✅ Always convert to string
  return str.replace(/[0-9]/g, (d) => gujaratiDigits[englishDigits.indexOf(d)]);
}

/** Gujarati month names, indexed 0 (January) .. 11 (December). */
export const gujaratiMonths = [
  'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
  'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
];

/**
 * Formats a date as a Gujarati string, e.g. "૧૭ ડિસેમ્બર ૨૦૨૬".
 * Accepts an ISO string, a Date, or null/undefined.
 */
export function formatGujaratiDate(input: string | Date | null | undefined): string {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  const day = englishToGujaratiDigits(d.getDate());
  const month = gujaratiMonths[d.getMonth()];
  const year = englishToGujaratiDigits(d.getFullYear());
  return `${day} ${month} ${year}`;
}
