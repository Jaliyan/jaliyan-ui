/**
 * Shared "search by name or batch id" helper used by every padyatri list/filter
 * screen (padyatri list, attendance/QR scan, reports, insurance mapping).
 *
 * Padyatri names are stored in Gujarati while the organizer may type in either
 * Gujarati or English (and batch ids may be typed in either digit script). This
 * helper normalizes both the row data and the query into a script-agnostic form
 * so a single "contains" match works regardless of the language used.
 */
import { englishToGujaratiDigits, gujaratiToEnglishDigits } from './number-utils';
import { transliterateGujarati } from './transliterate';

export interface PadyatriSearchFields {
  /** Full name of the padyatri (first + last, or fullName). */
  name?: string | null;
  /** Batch id (number or string). */
  batchId?: string | number | null;
  /** Optional mobile number. */
  mobile?: string | null;
}

/**
 * A table row that can be searched. Different screens expose the name either as
 * a single `fullName` or as separate `firstName`/`lastName` fields.
 */
export interface PadyatriSearchRow {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  batchId?: string | number | null;
  mobile?: string | null;
}

/**
 * Resolve a display/searchable full name from a row, supporting both the
 * `fullName` and `firstName`/`lastName` shapes.
 */
export function getPadyatriFullName(row: PadyatriSearchRow): string {
  if (row?.fullName) {
    return row.fullName;
  }
  return `${row?.firstName ?? ''} ${row?.lastName ?? ''}`.trim();
}

/**
 * Ready-to-use `MatTableDataSource.filterPredicate` that searches any padyatri
 * row by name or batch id in English/Gujarati. Screens can assign it directly
 * instead of re-mapping fields inline.
 */
export function padyatriSearchPredicate(row: PadyatriSearchRow, filter: string): boolean {
  return matchesPadyatriSearch(
    { name: getPadyatriFullName(row), batchId: row?.batchId, mobile: row?.mobile },
    filter
  );
}

/**
 * Returns true when the given row matches the free-text query by name or batch id
 * in either English or Gujarati. An empty query matches everything.
 */
export function matchesPadyatriSearch(fields: PadyatriSearchFields, query: string): boolean {
  const normalizedQuery = (query ?? '').trim();
  if (!normalizedQuery) {
    return true;
  }

  const name = fields.name ?? '';
  const batch = fields.batchId != null ? fields.batchId.toString() : '';
  const mobile = fields.mobile ?? '';

  // Build a haystack that is searchable by name and batch id, in both scripts.
  const haystack = [
    name,
    transliterateGujarati(name),
    gujaratiToEnglishDigits(batch),
    englishToGujaratiDigits(batch),
    mobile
  ]
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, '');

  // The query may itself be typed in English or Gujarati.
  const queryVariants = [
    normalizedQuery,
    transliterateGujarati(normalizedQuery),
    gujaratiToEnglishDigits(normalizedQuery)
  ].map(v => v.toLowerCase().replace(/\s+/g, ''));

  if (queryVariants.some(v => v && haystack.includes(v))) {
    return true;
  }

  // Fuzzy name match. Gujarati names transliterate approximately, so an
  // English spelling can differ from the romanized form even though they sound
  // alike (e.g. "Prince" vs the transliterated "prinsa": soft "c" -> "s" and a
  // trailing inherent vowel). Compare vowel-stripped consonant skeletons so the
  // spelling of the vowels/soft-consonants no longer has to match exactly.
  const nameSkeleton = consonantSkeleton(name);
  if (nameSkeleton) {
    const querySkeletons = buildQuerySkeletons(normalizedQuery);
    if (querySkeletons.some(k => k.length >= 3 && nameSkeleton.includes(k))) {
      return true;
    }
  }

  return false;
}

/**
 * Reduce a name to a lowercase, vowel-free consonant skeleton of its romanized
 * form. Used only to make name search tolerant of imperfect transliteration.
 */
function consonantSkeleton(text: string): string {
  return transliterateGujarati(text ?? '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/[aeiou]/g, '');
}

/**
 * Build consonant skeletons for the query. English "c" is ambiguous (soft "s"
 * vs hard "k") and never appears bare in the Gujarati romanization, so we emit a
 * variant for each interpretation and match if any of them fits.
 */
function buildQuerySkeletons(query: string): string[] {
  const roman = transliterateGujarati(query).toLowerCase();
  return [roman, roman.replace(/c/g, 's'), roman.replace(/c/g, 'k')]
    .map(v => v.replace(/[^a-z]/g, '').replace(/[aeiou]/g, ''));
}
