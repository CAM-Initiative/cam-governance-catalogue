import type { UnknownRecord } from "@/lib/vigilRegistry";

export type CorpusProvision = {
  instrumentId?: string;
  instrumentTitle?: string;
  canonicalPath?: string;
  section?: string;
  heading?: string;
  action?: string;
  relationship?: string;
  finalWording?: string;
  previousWording?: string;
  implementedDate?: string;
  verifiedAgainst?: string;
  verificationStatus?: string;
  currentStatus?: string;
  canonicalUrl?: string;
  implementationUrl?: string;
  complete: boolean;
};

export type RecordChain = {
  observations: string[];
  failureModes: string[];
  proposals: string[];
  patches: string[];
};

export type PatchDisplayContractStatus =
  | "complete-amendment"
  | "complete-no-corpus-change"
  | "incomplete"
  | "not-applicable";

export type PublicRecordDisplay = {
  finding?: string;
  dates: {
    firstObserved?: string;
    published?: string;
    lastUpdated?: string;
    implemented?: string;
  };
  domains: string[];
  systems: string[];
  chain: RecordChain;
  corpusProvisions: CorpusProvision[];
  observation?: {
    observed?: string;
    context?: string;
    interpretation?: string;
    sourceModality: string[];
    publicAccess?: string;
  };
  failure?: {
    definition?: string;
    triggers: string[];
    manifestations: string[];
    significance?: string;
    affectedParties: string[];
    corpusRelationship?: string;
    repairStatus?: string;
    repairNextAction?: string;
  };
  proposal?: {
    problem?: string;
    proposedOutcome?: string;
    proposedWording?: string;
    decisionStatus?: string;
    resultingPatches: string[];
  };
  patch?: {
    outcome: "corpus-amendment" | "pre-existing-control" | "non-corpus-repair" | "unknown";
    explicitNoCorpusTextChange: boolean;
    noCorpusChangeExplanation?: string;
    repairSummary?: string;
    implementationDate?: string;
    verificationStatus?: string;
    verifiedAgainst?: string;
    residualMonitoring: string[];
    contractStatus: PatchDisplayContractStatus;
    contractMessage?: string;
    withholdActionedStatus: boolean;
  };
  lifecycleLabel?: string;
  repairState?: string;
  principalRepair?: string;
  searchTokens: string[];
};

const VIGIL_ID_PATTERN = /VIGIL-\d{4}-(?:OBS|FM|PROP|PATCH)-\d+/gi;

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueAt(record: UnknownRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (Array.isArray(current) && /^\d+$/.test(part)) return current[Number(part)];
    return isObject(current) ? current[part] : undefined;
  }, record);
}

function firstValue(record: UnknownRecord, paths: string[]): unknown {
  for (const path of paths) {
    const value = valueAt(record, path);
    if (hasValue(value)) return value;
  }
  return undefined;
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasValue);
  if (isObject(value)) return Object.values(value).some(hasValue);
  return true;
}

function displayText(value: unknown, separator = "\n\n"): string | undefined {
  if (!hasValue(value)) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const values = value.map((item) => displayText(item, separator)).filter((item): item is string => Boolean(item));
    return values.length ? values.join(separator) : undefined;
  }
  if (isObject(value)) {
    const values = Object.entries(value)
      .map(([key, item]) => {
        const text = displayText(item, separator);
        return text ? `${humanize(key)}: ${text}` : undefined;
      })
      .filter((item): item is string => Boolean(item));
    return values.length ? values.join(separator) : undefined;
  }
  return undefined;
}

function firstText(record: UnknownRecord, paths: string[]): string | undefined {
  return displayText(firstValue(record, paths));
}

function listFrom(value: unknown): string[] {
  if (!hasValue(value)) return [];
  const values = Array.isArray(value) ? value : [value];
  return unique(values.flatMap((item) => {
    if (typeof item === "string") {
      return item.split(/\s*\|\s*|\s*;\s*/).map((entry) => entry.trim()).filter(Boolean);
    }
    const text = displayText(item, "; ");
    return text ? [text] : [];
  }));
}

function collectLists(record: UnknownRecord, paths: string[]) {
  return unique(paths.flatMap((path) => listFrom(valueAt(record, path))));
}

function unique(values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values.filter((value): value is string => {
    const cleaned = value?.trim();
    if (!cleaned) return false;
    const key = cleaned.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bCam\b/g, "CAM")
    .replace(/\bVigil\b/g, "VIGIL")
    .replace(/\bAi\b/g, "AI");
}

function normalizedKey(value?: string) {
  return String(value ?? "").trim().toLocaleLowerCase().replace(/[_\s]+/g, "-");
}

function recordIdsFrom(value: unknown): string[] {
  if (!hasValue(value)) return [];
  if (typeof value === "string") return unique(value.match(VIGIL_ID_PATTERN) ?? []);
  if (Array.isArray(value)) return unique(value.flatMap(recordIdsFrom));
  if (isObject(value)) {
    const ownId = displayText(value.id ?? value.record_id);
    return unique([
      ...(ownId?.match(VIGIL_ID_PATTERN) ?? []),
      ...Object.values(value).flatMap(recordIdsFrom),
    ]);
  }
  return [];
}

function addRecordIds(target: string[], value: unknown) {
  target.push(...recordIdsFrom(value));
}

function distributeRecordIds(chain: RecordChain, ids: string[]) {
  for (const id of ids) {
    if (/-OBS-/i.test(id)) chain.observations.push(id);
    else if (/-FM-/i.test(id)) chain.failureModes.push(id);
    else if (/-PROP-/i.test(id)) chain.proposals.push(id);
    else if (/-PATCH-/i.test(id)) chain.patches.push(id);
  }
}

function deriveRecordChain(record: UnknownRecord, recordType: string, id: string): RecordChain {
  const chain: RecordChain = { observations: [], failureModes: [], proposals: [], patches: [] };
  const linkedSources = [
    record,
    record.linked_records,
    record.record_chain,
    valueAt(record, "public_display.record_chain"),
  ].filter(isObject);

  for (const linked of linkedSources) {
    for (const key of ["related_observations", "source_observations", "observations"]) addRecordIds(chain.observations, linked[key]);
    for (const key of ["related_failure_modes", "linked_failure_modes", "failure_modes", "target_failure_record"]) addRecordIds(chain.failureModes, linked[key]);
    for (const key of ["related_proposals", "linked_proposals", "proposals"]) addRecordIds(chain.proposals, linked[key]);
    for (const key of ["related_patch_notes", "related_patches", "resulting_patches", "patches"]) addRecordIds(chain.patches, linked[key]);
  }

  distributeRecordIds(chain, recordIdsFrom(firstValue(record, [
    "predecessor_records",
    "linked_records.predecessor_records",
    "linked_records.potential_child_records",
    "linked_records.potential_patch_records",
  ])));

  if (recordType === "observation") chain.observations.push(id);
  if (recordType === "failure_mode") chain.failureModes.push(id);
  if (recordType === "proposal") chain.proposals.push(id);
  if (recordType === "patch_note" || recordType === "patch") chain.patches.push(id);

  chain.observations = unique(chain.observations);
  chain.failureModes = unique(chain.failureModes);
  chain.proposals = unique(chain.proposals);
  chain.patches = unique(chain.patches);
  return chain;
}

function parseProvisionString(value: string): UnknownRecord {
  const instrument = value.match(/\bCAM-[A-Z0-9-]+\b/i)?.[0];
  const section = value.match(/§\s*[A-Za-z0-9.()[\]-]+/)?.[0];
  const heading = section ? value.split(section)[1]?.replace(/^[\s—–:-]+/, "").trim() : undefined;
  return {
    instrument_id: instrument,
    section,
    section_heading: heading,
    relationship: value,
  };
}

function provisionObject(value: unknown): UnknownRecord | undefined {
  if (typeof value === "string") return parseProvisionString(value);
  return isObject(value) ? value : undefined;
}

function expandProvisionItem(value: unknown): UnknownRecord[] {
  const item = provisionObject(value);
  if (!item) return [];

  const nestedSections = item.sections ?? item.relevant_sections;
  if (!Array.isArray(nestedSections) || nestedSections.length === 0 || hasValue(item.section ?? item.section_number)) return [item];

  return nestedSections.flatMap((section) => {
    if (isObject(section)) return [{ ...item, ...section, sections: undefined, relevant_sections: undefined }];
    const sectionText = displayText(section);
    return sectionText ? [{ ...item, section: sectionText, sections: undefined, relevant_sections: undefined }] : [];
  });
}

function provisionFromObject(item: UnknownRecord, defaults: Partial<CorpusProvision> = {}): CorpusProvision {
  const instrumentId = firstText(item, ["instrument_id", "instrument_code", "instrument", "code"]) ?? defaults.instrumentId;
  const instrumentTitle = firstText(item, ["instrument_title", "document_title", "title"]) ?? defaults.instrumentTitle;
  const canonicalPath = firstText(item, ["canonical_file_path", "canonical_path", "file_path", "path"]) ?? defaults.canonicalPath;
  const section = firstText(item, ["section", "section_number", "clause", "relevant_section", "field"]) ?? defaults.section;
  const heading = firstText(item, ["section_heading", "section_title", "heading", "clause_heading"]) ?? defaults.heading;
  const action = firstText(item, ["action", "change_kind", "amendment_type", "change_type", "coverage_type"]) ?? defaults.action;
  const relationship = firstText(item, ["relationship_to_failure", "relationship", "relevance", "failure_relevance", "description"]) ?? defaults.relationship;
  const finalWording = firstText(item, [
    "final_adopted_wording",
    "implemented_text",
    "adopted_wording",
    "final_wording",
    "literal_wording",
    "exact_text",
    "wording",
    "clause_text",
    "implemented_value",
    "value",
  ]) ?? defaults.finalWording;
  const previousWording = firstText(item, ["previous_wording", "prior_wording", "removed_wording", "before_text"]) ?? defaults.previousWording;
  const implementedDate = firstText(item, ["implemented_date", "date_implemented", "effective_date"]) ?? defaults.implementedDate;
  const verifiedAgainst = firstText(item, ["verified_against", "corpus_commit", "commit_sha", "version"]) ?? defaults.verifiedAgainst;
  const verificationStatus = firstText(item, ["verification_status", "verification_state", "verified"]) ?? defaults.verificationStatus;
  const currentStatus = firstText(item, ["current_status", "provision_status", "status"]) ?? defaults.currentStatus;
  const canonicalUrl = firstText(item, ["canonical_source_url", "canonical_url", "corpus_url", "source_url"]) ?? defaults.canonicalUrl;
  const implementationUrl = firstText(item, ["implementation_record_url", "implementation_commit_url", "commit_url", "amendment_url"]) ?? defaults.implementationUrl;
  const exactRepair = finalWording || (normalizedKey(action).includes("repeal") ? previousWording : undefined);

  return {
    instrumentId,
    instrumentTitle,
    canonicalPath,
    section,
    heading,
    action,
    relationship,
    finalWording,
    previousWording,
    implementedDate,
    verifiedAgainst,
    verificationStatus,
    currentStatus,
    canonicalUrl,
    implementationUrl,
    complete: Boolean(instrumentId && section && action && exactRepair && (canonicalPath || canonicalUrl)),
  };
}

function mergeProvision(target: CorpusProvision, source: CorpusProvision): CorpusProvision {
  const merged = Object.fromEntries(
    Object.keys({ ...target, ...source }).map((key) => {
      const typedKey = key as keyof CorpusProvision;
      return [key, target[typedKey] || source[typedKey]];
    }),
  ) as CorpusProvision;
  merged.complete = provisionFromObject({
    instrument_id: merged.instrumentId,
    instrument_title: merged.instrumentTitle,
    canonical_file_path: merged.canonicalPath,
    section: merged.section,
    section_heading: merged.heading,
    action: merged.action,
    relationship: merged.relationship,
    final_adopted_wording: merged.finalWording,
    previous_wording: merged.previousWording,
    implemented_date: merged.implementedDate,
    verified_against: merged.verifiedAgainst,
    verification_status: merged.verificationStatus,
    current_status: merged.currentStatus,
    canonical_source_url: merged.canonicalUrl,
    implementation_record_url: merged.implementationUrl,
  }).complete;
  return merged;
}

function deriveCorpusProvisions(record: UnknownRecord): CorpusProvision[] {
  const provisions: CorpusProvision[] = [];
  const structuredPaths = [
    "corpus_implementation.amendments",
    "corpus_implementation.corpus_amendments",
    "corpus_implementation.applied_repairs",
    "applied_corpus_repairs",
    "relevant_corpus_provisions",
    "corpus_basis",
    "proposed_amendments",
    "proposed_corpus_amendments",
    "proposal_details.target_provisions",
    "cam_internal.target_instruments",
    "existing_cam_coverage",
    "repair_provenance.coverage_origin",
  ];

  for (const path of structuredPaths) {
    const value = valueAt(record, path);
    const items = Array.isArray(value) ? value : hasValue(value) ? [value] : [];
    for (const item of items.flatMap(expandProvisionItem)) provisions.push(provisionFromObject(item));
  }

  const implementedChanges = valueAt(record, "change_details.implemented_changes");
  const changedInstruments = collectLists(record, [
    "change_details.changed_instruments",
    "change_details.changed_files_or_instruments",
    "cam_internal.changed_instruments",
    "repair_provenance.instruments_amended",
  ]);
  if (Array.isArray(implementedChanges)) {
    const defaultInstrument = changedInstruments.length === 1 ? changedInstruments[0].match(/\bCAM-[A-Z0-9-]+\b/i)?.[0] ?? changedInstruments[0] : undefined;
    for (const item of implementedChanges.flatMap(expandProvisionItem)) {
      provisions.push(provisionFromObject(item, { instrumentId: defaultInstrument, action: "amended" }));
    }
  }

  const changedComponents = collectLists(record, ["change_details.changed_components"]);
  for (const component of changedComponents) {
    if (component.match(/\bCAM-[A-Z0-9-]+\b/i) || component.includes("§")) {
      provisions.push(provisionFromObject(parseProvisionString(component)));
    }
  }

  const merged = new Map<string, CorpusProvision>();
  for (const provision of provisions) {
    if (!hasValue(provision.instrumentId) && !hasValue(provision.section) && !hasValue(provision.relationship)) continue;
    const key = [
      normalizedKey(provision.instrumentId),
      normalizedKey(provision.section) || normalizedKey(provision.heading) || normalizedKey(provision.relationship),
    ].join("|");
    const existing = merged.get(key);
    merged.set(key, existing ? mergeProvision(existing, provision) : provision);
  }
  return [...merged.values()];
}

function lifecycleLabel(status?: string) {
  const key = normalizedKey(status);
  const labels: Record<string, string> = {
    active: "Active",
    open: "Active",
    triage: "Active",
    routed: "Active",
    watching: "Monitoring",
    monitoring: "Monitoring",
    "closed-actioned": "Closed—actioned",
    implemented: "Closed—actioned",
    closed: "Closed",
    inactive: "Closed",
    "closed-no-action": "Closed—no action",
    deferred: "Deferred",
    superseded: "Superseded",
  };
  return labels[key] ?? (status ? humanize(status) : undefined);
}

function explicitBoolean(record: UnknownRecord, paths: string[]) {
  for (const path of paths) {
    const value = valueAt(record, path);
    if (typeof value === "boolean") return value;
    if (typeof value === "string" && ["true", "yes"].includes(value.trim().toLocaleLowerCase())) return true;
    if (typeof value === "string" && ["false", "no"].includes(value.trim().toLocaleLowerCase())) return false;
  }
  return undefined;
}

function derivePatchDisplay(
  record: UnknownRecord,
  provisions: CorpusProvision[],
  recordState?: string,
): PublicRecordDisplay["patch"] {
  const outcomeText = firstText(record, [
    "corpus_implementation.implementation_outcome",
    "corpus_implementation.outcome",
    "corpus_implementation.change_class",
    "change_classification.doctrine_amendment_status",
    "change_classification.implementation_level",
    "repair_provenance.doctrine_change",
  ]);
  const outcomeKey = normalizedKey(outcomeText);
  const projectedContractStatus = normalizedKey(firstText(record, [
    "display_contract_status",
    "public_display.display_contract_status",
  ]));
  const retrospective = explicitBoolean(record, ["repair_provenance.retrospective_synthesis"]) === true;
  const amendedInstruments = collectLists(record, [
    "corpus_implementation.instruments_amended",
    "repair_provenance.instruments_amended",
    "change_details.changed_instruments",
    "cam_internal.changed_instruments",
  ]);
  const reliedUpon = collectLists(record, [
    "corpus_implementation.instruments_relied_upon_without_amendment",
    "repair_provenance.instruments_relied_upon_without_amendment",
  ]);
  const explicitNoChangeFlag = explicitBoolean(record, [
    "corpus_implementation.no_corpus_text_changed",
    "no_corpus_text_changed",
  ]);
  const noChangeOutcome = [
    "no-corpus-change",
    "no-corpus-text-change",
    "relied-upon-without-amendment",
  ].some((value) => outcomeKey.includes(value));
  const explicitNoCorpusTextChange = explicitNoChangeFlag === true
    || noChangeOutcome
    || projectedContractStatus === "complete-no-corpus-change"
    || (retrospective && amendedInstruments.length === 0 && reliedUpon.length > 0);

  let outcome: NonNullable<PublicRecordDisplay["patch"]>["outcome"] = "unknown";
  if (explicitNoCorpusTextChange && (retrospective || reliedUpon.length > 0 || outcomeKey.includes("pre-existing"))) outcome = "pre-existing-control";
  else if (explicitNoCorpusTextChange) outcome = "non-corpus-repair";
  else if (
    amendedInstruments.length > 0
    || provisions.some((provision) => provision.action && !normalizedKey(provision.action).includes("relied"))
    || ["substantive", "amendment", "corpus-change"].some((value) => outcomeKey.includes(value))
  ) outcome = "corpus-amendment";

  const amendmentProvisions = provisions.filter((provision) => {
    const action = normalizedKey(provision.action);
    return !["relied-upon", "pre-existing", "coverage"].some((value) => action.includes(value));
  });
  const completeAmendment = projectedContractStatus === "complete-amendment" || (outcome === "corpus-amendment"
    && amendmentProvisions.length > 0
    && amendmentProvisions.every((provision) => provision.complete));
  const contractStatus: PatchDisplayContractStatus = completeAmendment
    ? "complete-amendment"
    : explicitNoCorpusTextChange || projectedContractStatus === "complete-no-corpus-change"
      ? "complete-no-corpus-change"
      : "incomplete";
  const actioned = ["closed-actioned", "implemented"].includes(normalizedKey(recordState));
  const withholdActionedStatus = actioned && contractStatus === "incomplete";

  return {
    outcome,
    explicitNoCorpusTextChange,
    noCorpusChangeExplanation: firstText(record, [
      "corpus_implementation.no_corpus_change_explanation",
      "corpus_implementation.repair_description",
      "repair_provenance.repair_basis",
      "change_details.doctrine_change",
    ]),
    repairSummary: firstText(record, [
      "corpus_implementation.repair_summary",
      "change_details.implemented_change",
      "change_details.change_summary",
      "summary",
    ]),
    implementationDate: firstText(record, [
      "corpus_implementation.date_implemented",
      "date_implemented",
    ]),
    verificationStatus: firstText(record, [
      "corpus_implementation.verification.verification_status",
      "corpus_implementation.verification_status",
      "implementation_verification.verification_status",
      "verification_status",
    ]),
    verifiedAgainst: firstText(record, [
      "corpus_implementation.verification.verified_against",
      "corpus_implementation.verified_against",
      "implementation_verification.verification_method",
      "implementation_verification.evidence",
    ]),
    residualMonitoring: collectLists(record, [
      "corpus_implementation.residual_monitoring",
      "remaining_work.monitoring_notes",
      "remaining_work.open_items",
      "remaining_work.items",
      "remaining_work",
    ]),
    contractStatus,
    contractMessage: contractStatus === "incomplete"
      ? "This PATCH does not yet contain complete, traceable corpus implementation details and does not explicitly declare that no corpus text changed."
      : undefined,
    withholdActionedStatus,
  };
}

function deriveRepairState(
  recordType: string,
  recordState: string | undefined,
  chain: RecordChain,
  patch: PublicRecordDisplay["patch"],
  record: UnknownRecord,
) {
  if (patch) {
    if (patch.withholdActionedStatus) return "Actioned status withheld";
    if (patch.contractStatus === "complete-amendment") return "Corpus repair documented";
    if (patch.contractStatus === "complete-no-corpus-change") return "No corpus text changed";
    return "Implementation details incomplete";
  }
  const projectedRepairState = firstText(record, ["repair_state", "public_display.repair_state"]);
  if (projectedRepairState) return humanize(projectedRepairState);
  const lifecycleKey = normalizedKey(recordState);
  if (lifecycleKey === "closed-no-action") return "No action required";
  if (lifecycleKey === "deferred") return "Deferred";
  if (lifecycleKey === "superseded") return "Superseded";
  if (recordType === "failure_mode") {
    const explicit = firstText(record, ["repair_status.status", "repair_status.state", "triage.mitigation_status", "mitigation_status"]);
    if (explicit) return humanize(explicit);
    if (chain.patches.length) return "Repair linked";
    if (["closed-actioned", "implemented"].includes(normalizedKey(recordState))) return "Repair stated; PATCH not linked";
    return "No implemented repair linked";
  }
  if (recordType === "proposal") return chain.patches.length ? "Implemented through PATCH" : "Not yet implemented";
  if (recordType === "observation") return chain.failureModes.length ? "Failure mode linked" : "Awaiting failure classification";
  return undefined;
}

function principalRepair(provisions: CorpusProvision[]) {
  const values = provisions.slice(0, 3).map((provision) => {
    const instrument = provision.instrumentId ?? provision.instrumentTitle;
    return [instrument, provision.section].filter(Boolean).join(" ");
  }).filter(Boolean);
  return values.length ? values.join("; ") : undefined;
}

export function deriveVigilPublicDisplay(
  record: UnknownRecord,
  options: { recordType: string; id: string; recordState?: string },
): PublicRecordDisplay {
  const { recordType, id, recordState } = options;
  const chain = deriveRecordChain(record, recordType, id);
  const corpusProvisions = deriveCorpusProvisions(record);
  const domains = collectLists(record, [
    "public_display.relevant_domains",
    "relevant_domains",
    "affected_domains",
    "cam_internal.affected_domains",
    "cam_internal.changed_domains",
    "cam_summary.changed_domains",
    "cam_summary.target_domains",
    "change_details.changed_domains",
    "target_domains",
    "proposal_summary.cam_domains",
  ]);
  const systems = unique([
    firstText(record, ["system_context.platform_or_vendor", "platform_or_vendor", "observed_vendor", "platform_label"]),
    firstText(record, ["system_context.product_or_service", "system_context.specific_model_or_runtime", "product_or_service", "observed_product"]),
  ]);
  const patch = ["patch_note", "patch"].includes(recordType)
    ? derivePatchDisplay(record, corpusProvisions, recordState)
    : undefined;
  const sourceLifecycleLabel = lifecycleLabel(recordState);
  const displayedLifecycleLabel = patch?.withholdActionedStatus ? "Actioned status withheld" : sourceLifecycleLabel;

  const observation = recordType === "observation" ? {
    observed: firstText(record, [
      "direct_observation",
      "observation.observed",
      "observation_summary",
      "observed_behaviour",
      "observed_behavior",
      "distinguishing_observations",
      "summary",
    ]),
    context: firstText(record, ["observation_context", "system_context.deployment_context", "system_context.interface_surface", "context"]),
    interpretation: firstText(record, [
      "interpretation",
      "governance_interpretation",
      "why_it_matters_to_CAM",
      "analysis",
    ]),
    sourceModality: collectLists(record, [
      "source_modality",
      "source_modalities",
      "source_summary.primary_source_type",
      "source_records.0.source_type",
    ]),
    publicAccess: firstText(record, [
      "public_access_status",
      "source_summary.public_access_status",
      "source_records.0.public_access_status",
      "source_records.0.access_status",
      "source_records.0.source_url_status",
    ]),
  } : undefined;

  const failure = recordType === "failure_mode" ? {
    definition: firstText(record, ["failure_mode_definition", "definition", "summary"]),
    triggers: collectLists(record, [
      "triggering_conditions",
      "failure_threshold",
      "failure_classification.triggering_conditions",
      "failure_classification.failure_threshold",
    ]),
    manifestations: collectLists(record, [
      "observed_manifestations",
      "manifestations",
      "distinguishing_observations",
      "cam_internal.cam_observed_failure",
    ]),
    significance: firstText(record, [
      "governance_significance",
      "why_it_matters_to_CAM",
      "governance_gap",
      "cam_internal.cam_internal_failure_statement",
    ]),
    affectedParties: collectLists(record, [
      "affected_parties",
      "system_context.affected_population",
      "failure_classification.affected_rights_or_interests",
      "user_impact",
    ]),
    corpusRelationship: firstText(record, [
      "corpus_failure_relationship",
      "cam_internal.cam_failure_type",
      "cam_internal.cam_compliance_status",
      "governance_gap_type",
    ]),
    repairStatus: firstText(record, [
      "repair_status.status",
      "repair_status.state",
      "triage.mitigation_status",
      "mitigation_status",
    ]),
    repairNextAction: firstText(record, [
      "repair_status.next_action",
      "triage.recommended_next_step",
      "recommended_next_step",
    ]),
  } : undefined;

  const proposal = recordType === "proposal" ? {
    problem: firstText(record, [
      "problem_being_addressed",
      "problem_statement",
      "proposal_summary.problem",
      "proposal_rationale",
      "summary",
    ]),
    proposedOutcome: firstText(record, [
      "proposed_governance_outcome",
      "proposed_outcome",
      "proposal_summary.proposed_outcome",
      "proposal_summary.scope_summary",
      "proposal_scope",
      "recommended_controls",
    ]),
    proposedWording: firstText(record, [
      "proposed_wording",
      "draft_wording",
      "proposed_amendment.wording",
      "proposal_details.proposed_wording",
    ]),
    decisionStatus: firstText(record, [
      "decision_status",
      "proposal_summary.decision_status",
      "proposal_summary.drafting_status",
      "resolution_status",
      "proposal_resolution",
      "cam_internal.drafting_status",
      "drafting_status",
      "record_state",
    ]),
    resultingPatches: chain.patches,
  } : undefined;

  const finding = firstText(record, [
    "public_display.public_finding",
    "public_finding",
    "record_identity.public_finding",
    "finding",
    "summary",
    "failure_mode_definition",
  ]);
  const repairState = deriveRepairState(recordType, recordState, chain, patch, record);
  const projectedInstruments = collectLists(record, ["principal_instruments", "principal_instrument"]);
  const projectedSections = collectLists(record, ["principal_sections", "principal_section"]);
  const projectedPrincipal = projectedInstruments.length
    ? projectedInstruments.slice(0, 3).map((instrument, index) => [instrument, projectedSections[index] ?? (projectedInstruments.length === 1 ? projectedSections.join(", ") : undefined)].filter(Boolean).join(" ")).join("; ")
    : undefined;
  const principal = principalRepair(corpusProvisions)
    ?? firstText(record, ["principal_repair"])
    ?? projectedPrincipal;
  const searchTokens = unique([
    id,
    finding,
    recordState,
    displayedLifecycleLabel,
    repairState,
    principal,
    ...domains,
    ...systems,
    ...chain.observations,
    ...chain.failureModes,
    ...chain.proposals,
    ...chain.patches,
    ...collectLists(record, ["corpus_search_terms", "principal_instruments", "principal_sections"]),
    ...corpusProvisions.flatMap((provision) => [
      provision.instrumentId,
      provision.instrumentTitle,
      provision.canonicalPath,
      provision.section,
      provision.heading,
      provision.action,
      provision.relationship,
    ]),
  ]);

  return {
    finding,
    dates: {
      firstObserved: firstText(record, [
        "public_display.first_observed",
        "first_observed",
        "date_first_observed",
        "date_observed",
        "observation_date",
        "source_records.0.source_date",
      ]),
      published: firstText(record, [
        "public_display.published",
        "date_published",
        "published_at",
        "record_identity.published",
        "record_identity.created",
        "date_recorded",
      ]),
      lastUpdated: firstText(record, [
        "public_display.last_updated",
        "last_updated",
        "updated_at",
        "record_identity.updated",
        "date_updated",
      ]),
      implemented: firstText(record, ["date_implemented", "corpus_implementation.date_implemented"]),
    },
    domains,
    systems,
    chain,
    corpusProvisions,
    observation,
    failure,
    proposal,
    patch,
    lifecycleLabel: displayedLifecycleLabel,
    repairState,
    principalRepair: principal,
    searchTokens,
  };
}

export function matchesVigilSearch(searchText: string, query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  return terms.every((term) => searchText.includes(term));
}
