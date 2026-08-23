export const VIGIL_EVIDENCE_REPAIR_SECTIONS = [
  {
    id: "observe",
    number: "01",
    label: "Observation",
    description: "Establish what happened or what was found, which systems are affected, what the available evidence supports, and where the evidentiary boundary sits.",
  },
  {
    id: "record",
    number: "02",
    label: "Record",
    description: "Preserve the authoritative VIGIL record chain, record identity, source relationships, workflow state, and relevant context without collapsing distinct record roles.",
  },
  {
    id: "classify",
    number: "03",
    label: "Classification",
    description: "Identify the repeatable failure mode, severity, canonical taxonomy position, and classification boundary.",
  },
  {
    id: "diagnose",
    number: "04",
    label: "Diagnosis",
    description: "Identify the governance weakness, existing coverage, control gap, and response that may be required.",
  },
  {
    id: "repair",
    number: "05",
    label: "Repair",
    description: "Record the implemented or relied-upon governance response, where it sits, how it was verified, and what remains unresolved.",
  },
  {
    id: "learn",
    number: "06",
    label: "Learn",
    description: "Preserve corrected governance reasoning, reusable lessons, future applications, limitations, and recurrence risk.",
  },
] as const;

export const VIGIL_REFERENCES_SECTION = {
  id: "references",
  number: "07",
  label: "References",
  description: "Provide the external evidence, canonical VIGIL record citations, and repair provenance needed to audit the case and trace its conclusions.",
} as const;

export const VIGIL_PUBLIC_REPORT_SECTIONS = [
  ...VIGIL_EVIDENCE_REPAIR_SECTIONS,
  VIGIL_REFERENCES_SECTION,
] as const;

export type VigilEvidenceRepairSectionId = typeof VIGIL_EVIDENCE_REPAIR_SECTIONS[number]["id"];
export type VigilPublicReportSectionId = typeof VIGIL_PUBLIC_REPORT_SECTIONS[number]["id"];
