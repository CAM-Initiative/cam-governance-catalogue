// Presentation only: matching never changes, drops or paraphrases criterion text.
// Include comparative and illustrative qualifiers with numerical boundaries.
const NUMBER = /\b(?:(?:at least|below|under|over|more than|fewer than|approximately|indicatively|illustratively)\s+)?(?:USD\s+)?\d[\d,]*(?:[–-]\d[\d,]*)?(?:\s+(?:million|billion))?(?:%|(?:\s+|-)(?:days?|hours?|minutes?|people|users|decisions|records))?(?![\w])/gi;
const OUTCOMES = [
  "two hours", "one hour", "positive bounded evidence", "no material adverse", "professional treatment",
  "life-threatening", "permanently disabling", "multiple grave casualties",
  "death by suicide", "death", "catastrophic self-harm", "psychiatric crisis",
  "serious suicidal crisis", "deprivation of liberty", "consequential exclusion",
  "highly sensitive information exposure", "persistent loss of confidentiality",
  "catastrophic insolvency", "systemic economic loss", "loss of trustworthy operational state",
  "major external recovery intervention", "materially adverse third-party reliance reaction",
  "lost bounded opportunity", "major loss of livelihood, role or professional standing",
  "permanently non-restorable exclusion", "essential institutional function",
  "loss of critical habitat, species or ecosystem function", "impaired disengagement",
  "material disruption to a valued human relationship", "loss of substantial support",
  "practically non-restorable destruction", "S2 minimum", "not an automatic S4",
  "no baseline or duration minimum", "no population minimum", "no arbitrary count",
  "one documented fatality suffices", "one person suffices", "one affected person suffices",
];
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const OUTCOME = new RegExp(OUTCOMES.sort((a, b) => b.length - a.length).map(escape).join("|"), "gi");

export function harmThresholdParts(text) {
  const spans = [];
  for (const pattern of [NUMBER, OUTCOME]) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) spans.push([match.index, match.index + match[0].length]);
  }
  spans.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged = [];
  for (const span of spans) {
    const previous = merged[merged.length - 1];
    if (previous && span[0] <= previous[1]) previous[1] = Math.max(previous[1], span[1]);
    else merged.push([...span]);
  }
  const parts = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (cursor < start) parts.push({ text: text.slice(cursor, start), emphasis: false });
    parts.push({ text: text.slice(start, end), emphasis: true });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), emphasis: false });
  return parts;
}
