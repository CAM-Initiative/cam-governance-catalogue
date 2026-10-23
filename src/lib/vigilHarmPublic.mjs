// Reader-facing presentation only. Do not modify canonical HIM threshold criteria.
const AGGREGATE_MECHANISM = ". The deployed evaluation must demonstrate: ";
const AGGREGATE_OUTCOME = ". Independently, the case evidence must support ";
const AGGREGATE_CAVEAT = ". These are modelled aggregate effects, NOT";

export function aggregateHarmSections(criterion) {
  const text = String(criterion || "");
  const first = text.indexOf(AGGREGATE_MECHANISM);
  const second = text.indexOf(AGGREGATE_OUTCOME);
  const third = text.indexOf(AGGREGATE_CAVEAT);
  if (first < 0 || second <= first || third <= second) {
    return { coverage: text, mechanism: "", outcome: "", caveat: "", structured: false };
  }
  return {
    coverage: text.slice(0, first),
    mechanism: text.slice(first + AGGREGATE_MECHANISM.length, second),
    outcome: text.slice(second + AGGREGATE_OUTCOME.length, third),
    caveat: text.slice(third + 2),
    structured: true,
  };
}

// Common prerequisites appear once in the explanatory introduction. Mechanism
// requirements appear once per dimension, not in each of its five band rows.
export function aggregateHarmBandSummary(criterion) {
  const parts = aggregateHarmSections(criterion);
  if (!parts.structured) return parts.coverage;
  return `${parts.coverage}. The evidence must also support ${parts.outcome}.`;
}

export const HARM_PUBLIC_DERIVATION_STATEMENT = "First determine whether the evidence concerns harm to a specific person, group, organisation or asset, or a potentially generalisable mechanism in an actually deployed AI feature without a specific harmed case. Assess the first using ordinary consequence criteria. Use Aggregate Harm for the second, even when the evidence is insufficient to assign a band. Overall severity is the highest independently supported dimension band on the selected pathway. Do not count eligible users as injured people or increase specific-case severity using provider-wide audience totals.";

export const HARM_PATHWAY_STEPS = [
  "Identify whether the model or feature was actually deployed. A simulated or unreleased test does not establish deployment-scale Aggregate Harm.",
  "Check whether the evidence shows a potentially generalisable mechanism in one of the five dimensions that permit Aggregate Harm assessment.",
  "Determine whether the Incident concerns an actual harm to a specific person, group, organisation or asset. If so, use the specific-consequence pathway.",
  "For a deployed, potentially generalisable mechanism without a specific harmed case, use the Aggregate Harm pathway. Test reproducibility, relevant eligible population, credible consequences, safeguards and source uncertainty before assigning a band.",
  "If the evidence cannot support an Aggregate Harm band, retain that pathway and report SU. Do not infer how many people were harmed from a platform's total users or one observed output.",
];

const INDICATOR_LABELS = {
  documented_distress_crisis_signal_count_and_timing: "Number and timing of documented distress or crisis signals",
  timely_support_or_stabilisation_responses: "Timely support or stabilisation responses",
  appropriate_human_or_crisis_support_referrals: "Appropriate referrals to human or crisis support",
  observed_referral_acceptance_or_obstruction_where_known: "Observed acceptance or obstruction of referral, where known",
  protective_vs_unsafe_refusals_and_disengagements: "Protective versus unsafe refusals and disengagements",
  documented_high_salience_reinforcement_occurrences: "Documented high-salience reinforcement",
  in_interaction_distress_escalation_or_stabilisation: "Distress escalation or stabilisation during the interaction",
  demonstrated_psychological_or_functional_consequences: "Documented psychological or functional consequences",
  evidenced_self_harm_or_suicide_outcome: "Evidenced self-harm or suicide outcome",
  documented_follow_up_recovery_and_duration_where_available: "Documented follow-up, recovery and duration, where available",
  percentage_of_eligible_applicants_adversely_treated: "Percentage of eligible applicants adversely treated",
  percentage_of_relevant_service_population_disrupted: "Percentage of relevant service population disrupted",
  original_currency_and_conversion_date: "Original currency and conversion date",
  aggregate_realised_direct_loss_USD: "Aggregate realised direct loss (USD)",
  verified_asset_replacement_value_in_original_currency: "Verified asset replacement value in original currency",
  fraction_of_stated_circulation_verified_as_seen_or_acted_on: "Share of reported circulation verified as seen or acted upon",
  third_party_reaction_and_provenance: "Third-party reaction and supporting source",
  restoration_feasibility: "Feasibility of restoration",
  days_of_technical_rebuild_or_asset_recovery: "Days of technical rebuild or asset recovery",
  number_of_evidenced_retractions_or_corrective_filings: "Number of documented retractions or corrective filings",
};

export function publicHarmIndicatorLabel(indicator) {
  const key = String(indicator || "");
  if (INDICATOR_LABELS[key]) return INDICATOR_LABELS[key];
  const words = key.replaceAll("_", " ").replace(/\bvs\b/g, "versus").replace(/\bai\b/gi, "AI").replace(/\busd\b/gi, "USD").replace(/\beu\b/gi, "EU");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// This nine-times-repeated generic guidance is already stated above the list.
export function publicHarmQuantificationNote(note) {
  const text = String(note || "").trim();
  return text.startsWith("Numerical durations, event counts and population measures are evidence-tested domain anchors") ? "" : text;
}

export function publicHarmInterpretiveNote(note) {
  return String(note || "")
    .replaceAll("epistemic_reliance_to_reputational_harm", "downstream reliance and resulting reputational harm")
    .replaceAll("INFORM adjudication", "inform interpretation");
}
