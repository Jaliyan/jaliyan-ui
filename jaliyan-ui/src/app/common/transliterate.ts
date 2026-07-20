/**
 * Lightweight Gujarati -> Latin transliteration used ONLY as a search aid.
 *
 * Padyatri names are stored in Gujarati, but insurance policies arrive with the
 * name written in English. This helper produces an approximate roman spelling of
 * a Gujarati string so the organizer can find a padyatri by typing the English
 * name printed on the insurance cover. It is intentionally lenient (not linguistically
 * perfect) because it is only used for "contains" matching, never as stored data.
 */

const CONSONANTS: { [key: string]: string } = {
  'ક': 'k', 'ખ': 'kh', 'ગ': 'g', 'ઘ': 'gh', 'ઙ': 'ng',
  'ચ': 'ch', 'છ': 'chh', 'જ': 'j', 'ઝ': 'jh', 'ઞ': 'ny',
  'ટ': 't', 'ઠ': 'th', 'ડ': 'd', 'ઢ': 'dh', 'ણ': 'n',
  'ત': 't', 'થ': 'th', 'દ': 'd', 'ધ': 'dh', 'ન': 'n',
  'પ': 'p', 'ફ': 'ph', 'બ': 'b', 'ભ': 'bh', 'મ': 'm',
  'ય': 'y', 'ર': 'r', 'લ': 'l', 'ળ': 'l', 'વ': 'v',
  'શ': 'sh', 'ષ': 'sh', 'સ': 's', 'હ': 'h'
};

const INDEPENDENT_VOWELS: { [key: string]: string } = {
  'અ': 'a', 'આ': 'a', 'ઇ': 'i', 'ઈ': 'i', 'ઉ': 'u', 'ઊ': 'u',
  'ઋ': 'ru', 'એ': 'e', 'ઐ': 'ai', 'ઓ': 'o', 'ઔ': 'au'
};

const MATRAS: { [key: string]: string } = {
  'ા': 'a', 'િ': 'i', 'ી': 'i', 'ુ': 'u', 'ૂ': 'u',
  'ૃ': 'ru', 'ે': 'e', 'ૈ': 'ai', 'ો': 'o', 'ૌ': 'au'
};

const NASALS: { [key: string]: string } = {
  'ં': 'n', 'ઃ': 'h', 'ઁ': 'n'
};

const VIRAMA = '્';

/**
 * Transliterate a Gujarati string to an approximate lowercase Latin form.
 * Any non-Gujarati characters (already-Latin text, spaces, digits) pass through.
 */
export function transliterateGujarati(text: string): string {
  if (!text) {
    return '';
  }

  const chars = Array.from(text);
  let result = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (CONSONANTS[ch]) {
      result += CONSONANTS[ch];
      // A consonant carries an inherent "a" unless it is immediately followed
      // by a dependent vowel sign (matra) or a virama (which suppresses it).
      const next = chars[i + 1];
      const suppressesInherent = !!next && (!!MATRAS[next] || next === VIRAMA);
      if (!suppressesInherent) {
        result += 'a';
      }
    } else if (MATRAS[ch]) {
      result += MATRAS[ch];
    } else if (INDEPENDENT_VOWELS[ch]) {
      result += INDEPENDENT_VOWELS[ch];
    } else if (NASALS[ch]) {
      result += NASALS[ch];
    } else if (ch === VIRAMA) {
      // Inherent vowel already suppressed above; emit nothing.
    } else {
      result += ch;
    }
  }

  return result.toLowerCase();
}
