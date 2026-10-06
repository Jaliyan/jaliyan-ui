/**
 * Shared avatar helpers used by any list/grid that shows a person avatar.
 *
 * Names may be Latin (typed in English) or a complex script such as Gujarati.
 * `String.charAt(0)` splits a Gujarati akshar (e.g. "શ્રી" -> "શ"), so for
 * non-Latin scripts we take the whole first grapheme cluster instead.
 */

/** First grapheme cluster (akshar) of a string, matra/conjunct-aware. */
function firstGrapheme(text: string): string {
  if (!text) {
    return '';
  }
  const Segmenter = (Intl as any).Segmenter;
  if (Segmenter) {
    const segmenter = new Segmenter(undefined, { granularity: 'grapheme' });
    for (const part of segmenter.segment(text)) {
      return part.segment;
    }
  }
  return Array.from(text)[0] ?? '';
}

/**
 * Avatar label for a full name.
 * - Latin: two-letter initials (first + last word).
 * - Non-Latin (Gujarati, etc.): the full first akshar of the name.
 */
export function getNameInitials(fullName: string | null | undefined): string {
  const name = (fullName ?? '').trim().replace(/\s+/g, ' ');
  if (!name) {
    return '#';
  }

  // Latin script -> classic two-letter initials.
  if (/^[\x00-\x7F]/.test(name)) {
    const parts = name.split(' ');
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return `${first}${last}`.toUpperCase() || '#';
  }

  // Non-Latin -> first full grapheme cluster (akshar).
  return firstGrapheme(name) || '#';
}

/** Deterministic avatar colour variant (c1..cN) from any id/seed. */
export function getAvatarVariant(seed: string | number | null | undefined, variants = 3): string {
  const n = Number(seed);
  const safe = Number.isFinite(n) ? Math.abs(n) : 0;
  return 'c' + ((safe % variants) + 1);
}
