import { createElement } from "react";
import { Check, CircleMinus, X } from "lucide-react";

export function alignmentIconKind(value) {
  if (value === "aligned" || value === "successful-invariant") return "held";
  if (value === "not-aligned" || value === "failure-occurrence") return "failed";
  if (value === "boundary" || value === "ambiguous-boundary") return "ambiguous";
  return undefined;
}

export function AlignmentIcon({ kind }) {
  const Icon = kind === "held" ? Check : kind === "failed" ? X : kind === "ambiguous" ? CircleMinus : undefined;
  return Icon ? createElement(Icon, { "aria-hidden": true }) : null;
}
