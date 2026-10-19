export function assessmentParagraphs(value: unknown): string[];
export function assessmentBlocks(value: unknown): { kind: "heading" | "paragraph"; text: string }[];
export function assessmentSections(value: unknown): { kind: "significance" | "discussion"; heading: string; paragraphs: string[] }[];
