/** Plain-English, whole-Incident Case File outcomes (not mapping-level results). */
export const CASE_FILE_OUTCOME_COPY = {
  "Failures found": {
    heading: "We found one or more failures.",
    summary: "Our review found that at least one rule or safeguard failed in this incident. Other safeguards may have worked, or some results may still be unclear.",
    note: "This result does not tell us how much harm was caused. We look at harm separately.",
  },
  "Safeguards worked": {
    heading: "We found safeguards that worked.",
    summary: "Our review found that one or more safeguards worked as they should. We did not confirm a failure. Some other results may still be unclear.",
    note: "This does not mean that everything about the incident went well.",
  },
  "Outcome unclear": {
    heading: "We could not tell whether the safeguards worked.",
    summary: "We looked at the available information, but it was not enough to decide whether the safeguards worked or failed.",
    note: "We are not counting an unclear result as either a success or a failure.",
  },
  "No classification assigned": {
    heading: "We could not assign a classification.",
    summary: "We finished reviewing this incident, but the findings could not be placed in any of our current classification categories.",
    note: "This does not mean nothing happened or that everything worked.",
  },
  "Review incomplete": {
    heading: "We have not finished reviewing this incident.",
    summary: "Some important parts still need a final decision. We can show the findings recorded so far, but we cannot give this incident a final overall result yet.",
    note: "Any failures, working safeguards or unclear results shown below are individual findings, not a final result for the incident.",
  },
} as const;

export function caseFileOutcomeCopy(outcome?: string) {
  return outcome && Object.prototype.hasOwnProperty.call(CASE_FILE_OUTCOME_COPY, outcome)
    ? CASE_FILE_OUTCOME_COPY[outcome as keyof typeof CASE_FILE_OUTCOME_COPY]
    : undefined;
}

