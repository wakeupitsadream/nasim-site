// Instant answers for frequent questions (DECISIONS №55): a typed question that overlaps a FAQ
// closely enough is answered from the FAQ, without the model. Pure, so it is unit-tested and the
// client island only renders what it returns.

/** A FAQ as the widget receives it: picked for the locale, the answer already sanitised. */
export type FaqEntry = { id: string; question: string; answerHtml: string; lang: string };

const STOP = new Set([
  // en
  'the',
  'a',
  'an',
  'is',
  'it',
  'do',
  'i',
  'my',
  'in',
  'to',
  'of',
  'and',
  'or',
  'for',
  'how',
  'what',
  'can',
  'we',
  'you',
  'your',
  'does',
  'are',
  'be',
  'on',
  'at',
  'should',
  'need',
  'will',
  'with',
  'from',
  'this',
  'that',
  'there',
  'when',
  'where',
  'me',
  'us',
  'if',
  'about',
  'really',
  // ru
  'с',
  'в',
  'и',
  'на',
  'ли',
  'как',
  'что',
  'это',
  'мы',
  'вы',
  'я',
  'у',
  'к',
  'по',
  'не',
  'а',
  'но',
  'за',
  'из',
  'до',
  'ко',
  'мне',
  'нам',
  'вам',
  'ли',
  // ar
  'من',
  'في',
  'هل',
  'ما',
  'على',
  'و',
  'أن',
  'ان',
  'عن',
  'إلى',
  'الى',
  'هذا',
  'هذه',
  'مع',
  'أو',
  'او',
]);

/** Lower-cased word stems (first four letters of longer words), stop words dropped. */
export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter((w) => w.length >= 2 && !STOP.has(w))
    .map((w) => (w.length > 4 ? w.slice(0, 4) : w));
}

export type MatchOptions = { minScore?: number; minOverlap?: number };

/**
 * The FAQ whose question the text covers best: at least `minOverlap` of its stems and at least
 * `minScore` of them (share of the question's stems found in the text). Null when nothing is
 * close — then the text goes to the AI.
 */
export function matchFaq(
  text: string,
  faqs: readonly FaqEntry[],
  { minScore = 0.6, minOverlap = 2 }: MatchOptions = {},
): FaqEntry | null {
  const asked = new Set(tokens(text));
  if (asked.size === 0) return null;
  let best: { faq: FaqEntry; score: number; overlap: number } | null = null;
  for (const faq of faqs) {
    const stems = [...new Set(tokens(faq.question))];
    if (stems.length === 0) continue;
    const overlap = stems.filter((s) => asked.has(s)).length;
    const score = overlap / stems.length;
    if (overlap < minOverlap || score < minScore) continue;
    if (!best || score > best.score || (score === best.score && overlap > best.overlap)) {
      best = { faq, score, overlap };
    }
  }
  return best?.faq ?? null;
}
