import { titleizeValue } from "@/lib/vigilPresentation";

function toneFor(value: string) {
  const key = value.trim().toLocaleLowerCase();
  if (/\bs0\b|critical|catastrophic/.test(key)) return "critical";
  if (/\bs1\b|\bhigh\b|severe/.test(key)) return "high";
  if (/\bs2\b|moderate|medium/.test(key)) return "moderate";
  if (/\bs3\b|\bs4\b|low|negligible/.test(key)) return "low";
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
