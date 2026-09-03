export const VIGIL_INCIDENT_CASE_SECTIONS = [
  {
    id: "observe",
    number: "01",
    label: "Observation",
    description: "What happened, which systems were affected, and what the evidence establishes.",
  },
  {
    id: "diagnose",
    number: "02",
    label: "Diagnosis",
    description: "The occurrence-level governance analysis, including materialised severity and evidentiary limits.",
  },
  {
    id: "classify",
    number: "03",
    label: "Classification",
    description: "How the diagnosed failure maps to the current VIGIL Failure Taxonomy.",
  },
  {
    id: "references",
    number: "04",
    label: "References",
    description: "Sources, taxonomy records and the canonical Incident cited in this Case File.",
  },
] as const;

export type VigilIncidentCaseSectionId = typeof VIGIL_INCIDENT_CASE_SECTIONS[number]["id"];
