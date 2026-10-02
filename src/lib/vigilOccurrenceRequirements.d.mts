export const REQUIREMENT_ASSESSMENT_INTRO: string;
export type RequirementRow = { key: string; applicable: boolean; title: string; summary: string; url?: string; normativeForce?: string; applicability: string; finding?: string; applicabilityBasis?: string; findingBasis?: string; evidence: Array<{title: string; url?: string}> };
export function occurrenceRequirementRows(raw: Record<string, unknown>, requirements?: Array<unknown>): RequirementRow[];
