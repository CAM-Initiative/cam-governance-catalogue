import type { ReactElement } from "react";
export type AlignmentIconKind = "held" | "failed" | "ambiguous";
export function alignmentIconKind(value: unknown): AlignmentIconKind | undefined;
export function AlignmentIcon(props: { kind?: AlignmentIconKind }): ReactElement | null;
