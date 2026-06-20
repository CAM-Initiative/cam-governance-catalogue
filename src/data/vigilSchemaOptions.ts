// Reporting form options are intentionally narrow and sourced from VIGIL registry/schema-observed values.
// TODO: replace this fallback with a build-time extractor from https://github.com/CAM-Initiative/Vigil/blob/main/vigil/VIGIL.Schema.json when network access is available in CI.
export const vigilSchemaOptions = {
  record_type: ["observation", "failure_mode", "proposal", "patch"],
  evidence_confidence: ["anecdotal", "corroborated", "documented", "emerging", "observed", "unknown", "unverified", "user-reported", "verified"],
  source_type: ["first-party user report", "follow-up-observation", "governance-note", "governance-observation", "governance-text-amendment", "linked-failure-mode", "linked-observation", "linked-patch-note", "linked-proposal", "news-report", "official-source", "other", "platform-behaviour-observation", "platform-documentation", "platform-status-context", "platform-status-page", "repository-observation", "repository-source", "social-platform-observation"],
  platform_or_vendor: ["CAM Initiative", "Multi Vendor", "OpenAI", "Other", "X", "xAI"],
  product_or_service: ["Other"],
  canonical_failure_group: ["arbitration", "economic-legitimacy", "execution", "governance", "infrastructure-continuity", "relational", "state-context"],
  repair_status: ["unrepaired", "partial", "in-progress", "repaired", "unknown"],
  proposal_resolution_status: ["proposed", "under-review", "deferred", "accepted", "rejected", "implemented"],
  source_url_status: ["live", "archived", "paywalled", "removed", "unknown"],
} as const;
