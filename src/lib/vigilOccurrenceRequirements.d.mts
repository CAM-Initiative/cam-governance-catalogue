export const REQUIREMENT_ASSESSMENT_INTRO: string;
export type RequirementRow = {
  key: string;
  alignmentResult: "aligned" | "not-aligned" | "boundary";
  resultLabel: string;
  title: string;
  summary: string;
  url?: string;
  normativeForce?: string;
  assessmentBasis?: string;
  assessedOn?: string;
  evidence: Array<{ title: string; referenceNumber?: number; url?: string }>;
};
export function publicRequirementEvidenceSources(raw: Record<string, unknown>): Array<{ title: string; url?: string; publisher?: string; date?: string; sourceRecordRefs: string[]; referenceNumber: number; href: string }>;
export function occurrenceRequirementRows(raw: Record<string, unknown>, requirements?: Array<unknown>, sourceReferenceNumbers?: Record<string, number>): RequirementRow[];
