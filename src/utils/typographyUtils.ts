export const KBELIA_ACRONYMS = new Set([
  'SSM',
  'MARA',
  'TEKUN',
  'B2B',
  'F&B',
  'PDF',
  'QR',
  'KPI',
  'SOP',
  'SME',
  'ICT',
  'UMK',
  'KBELIA',
  'PKP',
  'URL',
  'POS',
  'ROI',
  'SST',
  'ROI',
  'FAQ',
  'MYR',
  'ATM',
  'JPN',
  'JKM',
  'PUNB',
  'MDEC',
  'MPKB'
]);

const ACRONYM_SPLIT_REGEX = /(\b(?:F&B|[A-Z0-9]{2,8})\b)/g;

/**
 * Splits prose into plain text and recognized official acronyms so
 * <AcronymText /> can render acronyms with authentic small-caps styling.
 */
export function splitAcronymTokens(input: string): Array<{ text: string; isAcronym: boolean }> {
  if (!input) return [];
  const curly = toCurlyQuotes(input);
  const parts = curly.split(ACRONYM_SPLIT_REGEX);
  const result: Array<{ text: string; isAcronym: boolean }> = [];

  for (const part of parts) {
    if (!part) continue;
    if (KBELIA_ACRONYMS.has(part)) {
      result.push({ text: part, isAcronym: true });
    } else {
      result.push({ text: part, isAcronym: false });
    }
  }
  return result;
}

/**
 * Middle-truncates long reference codes, SSM numbers, and filenames while keeping
 * both the identifying prefix and unique trailing characters intact.
 */
export function middleTruncate(
  value: string,
  startChars = 10,
  endChars = 6
): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= startChars + endChars + 3) {
    return trimmed;
  }
  return `${trimmed.slice(0, startChars)}…${trimmed.slice(-endChars)}`;
}

/**
 * Converts straight ASCII quotes into typographic curly quotes in editorial copy
 * while preserving ordinary Malay/English apostrophes inside words (e.g. Jum'at, don't).
 */
export function toCurlyQuotes(input: string): string {
  if (!input) return '';
  return input
    // Double quotes: opening at start or after whitespace/punctuation, closing elsewhere
    .replace(/(^|[\s(\[{—–-])"([^\s"])/g, '$1“$2')
    .replace(/"/g, '”')
    // Single quotes around phrases (avoid breaking Dato' or in-word apostrophes)
    .replace(/(^|[\s(\[{—–-])'([^\s'])/g, '$1‘$2')
    .replace(/([^\s'])'(?=([\s).,!?;:\]}]|$))/g, '$1’');
}
