import { titleizeValue } from "@/lib/vigilPresentation";

function toneFor(value: string) {
  const key = value.trim().toLocaleLowerCase();
  if (/\bs5\b|critical|catastrophic/.test(key)) return "critical";
  if (/\bs4\b|\bhigh\b|severe/.test(key)) return "high";
  if (/\bs3\b|moderate|medium/.test(key)) return "moderate";
  if (/\bs1\b|\bs2\b|low|minimal|negligible/.test(key)) return "low";
  if (/exemplar|successful invariant|system worked/.test(key)) return "success";
  return "neutral";
}

export function VigilStatusChip({ value, prefix }: { value?: string; prefix?: string }) {
  if (!value) return null;
  return (
    <span className="vigil-status-chip" data-tone={toneFor(value)}>
      {[prefix, titleizeValue(value)].filter(Boolean).join(" ")}
    </span>
  );
}
