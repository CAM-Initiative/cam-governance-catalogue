// Presentation only: retain every sentence and authored paragraph in source order.
export function assessmentParagraphs(value) {
  if (typeof value !== "string" || !value.trim()) return [];
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("en-AU", { granularity: "sentence" })
    : undefined;
  return value.split(/\n\s*\n/).flatMap(paragraph => {
    if (!segmenter) return [paragraph];
    const sentences = Array.from(segmenter.segment(paragraph), item => item.segment);
    const groups = [];
    for (let index = 0; index < sentences.length; index += 2) {
      groups.push(sentences.slice(index, index + 2).join(""));
    }
    return groups;
  });
}

// Only an explicitly separated Discussion heading is structural. Inline labels,
// source quotations and ordinary colon-bearing prose remain paragraphs.
export function assessmentBlocks(value) {
  if (typeof value !== "string" || !value.trim()) return [];
  return value.split(/\n\s*\n/).flatMap(block => {
    const text = block.trim();
    if (/^Discussion — [^:\n]+$/.test(text)) return [{ kind: "heading", text }];
    return assessmentParagraphs(block).map(text => ({ kind: "paragraph", text }));
  });
}
