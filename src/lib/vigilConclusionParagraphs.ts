/**
 * Presentation-only paragraph grouping for canonical VIGIL analytical prose.
 *
 * Never generates summaries, bullets, headings, or new claims. Canonical fields
 * remain untouched, and joining the returned paragraphs with spaces recovers
 * the original wording of ordinary single-spaced Incident records.
 *
 * Paragraph boundaries follow completed sentences, with preference for
 * explicitly signalled enumeration and contrast in the source prose.
 */
const TRANSITION = /^(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Separately|However|Finally|Nevertheless|Conversely|Taken together|In contrast|By contrast)(?:[,.:]|\b)/i;
const SENTENCE_BOUNDARY = /(?<=[.!?])\s+(?=[A-Z“"‘])/g;

export function splitConclusionParagraphs(text: string): string[] {
  const source = text.trim();
  if (!source) return [];

  // Very short conclusions must remain one uninterrupted paragraph.
  if (source.length <= 480) return [source];

  const sentences = source.split(SENTENCE_BOUNDARY);
  const paragraphs: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (!sentence) continue;
    const beginsNewThought = TRANSITION.test(sentence);
    const shouldGroup = current.length >= 280 &&
      current.length + 1 + sentence.length > 565;

    if (current && (beginsNewThought || shouldGroup)) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}
