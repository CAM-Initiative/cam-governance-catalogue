import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { EvidenceCard } from "@/components/vigil/EvidenceCard";
import { CaseTaxonomyClassification } from "@/components/vigil/CaseTaxonomyClassification";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VIGIL_EVIDENCE_REPAIR_SECTIONS } from "@/lib/vigilEvidenceRepair";
import { loadVigilIncidentRecords, loadVigilRecordDetail, type UnknownRecord } from "@/lib/vigilRegistry";
import {
  normalizeRecords,
  normalizeVigilRecord,
  titleizeValue,
  type VigilIndexRecord,
} from "@/lib/vigilPresentation";
import { deriveFailureModePublicDetail } from "@/lib/vigilPublicDisplay";
import {
  loadTaxonomyReferenceTargets,
  taxonomyFailureTypeLabel,
  type TaxonomyReferenceTarget,
} from "@/lib/vigilTaxonomyClassification";

type CaseChain = {
  observations: string[];
  failureModes: string[];
  proposals: string[];
  patches: string[];
  learns: string[];
};

type LearnItem = {
  id: string;
  title: string;
  summary?: string;
  abstractedLearning?: string;
  whatHappened: string[];
  governanceMisconception: string[];
  integratedLearning: string[];
  riskIfNotIntegrated: string[];
  futureApplication: string[];
  generalisationBoundary?: string;
  primaryFailureMode?: string;
  primaryFailureFamilyCode?: string;
  canonicalFailureName?: string;
  taxonomyReference?: string;
  raw: UnknownRecord;
  githubUrl?: string;
};

type CaseState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sourceId: string; anchorFailureIds: string[]; records: VigilIndexRecord[]; learns: LearnItem[]; chain: CaseChain; generatedAt: string };

type ExternalEvidence = {
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
};

type AffectedSystem = {
  recordId: string;
  provider?: string;
  product?: string;
  model?: string;
  systemType?: string;
  interfaceSurface?: string;
  deploymentContext?: string;
};

type DiagnosticProvenance = {
  method?: string;
  diagnosticDate?: string;
  humanRole?: string;
  aiRole?: string;
  aiPlatform?: string;
  aiModel?: string;
  attributionBasis?: string;
  reviewStatus?: string;
  authorityBoundary?: string;
};

type ImplementationEntry = {
  instrumentId?: string;
  section?: string;
  heading?: string;
  resultingText?: string;
  verification?: string;
  sourceUrl?: string;
};

const VIGIL_ID = /VIGIL-\d{4}-(?:OBS|RESEARCH|FM|PROP|PATCH|LEARN)-\d{4}/gi;
const LEARN_ID = /^VIGIL-\d{4}-LEARN-\d{4}$/i;
const CASE_VIEWS = VIGIL_EVIDENCE_REPAIR_SECTIONS;

type StageId = typeof CASE_VIEWS[number]["id"];

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueAt(record: UnknownRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => isObject(current) ? current[part] : undefined, record);
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function firstText(record: UnknownRecord, paths: string[]) {
  for (const path of paths) {
    const value = text(valueAt(record, path));
    if (value) return value;
  }
  return undefined;
}

function textList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const seen = new Set<string>();
  return values.flatMap((item) => text(item) ? [text(item)!] : []).filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function firstTextList(record: UnknownRecord, paths: string[]) {
  for (const path of paths) {
    const values = textList(valueAt(record, path));
    if (values.length) return values;
  }
  return [];
}

function objectList(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function firstObjectList(record: UnknownRecord, paths: string[]) {
  for (const path of paths) {
    const values = objectList(valueAt(record, path));
    if (values.length) return values;
  }
  return [];
}

function recordId(raw: UnknownRecord) {
  return text(raw.id ?? raw.record_id ?? (isObject(raw.record_identity) ? raw.record_identity.record_id : undefined));
}

function unique(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function referencedIds(raw: UnknownRecord) {
  return unique(JSON.stringify(raw).match(VIGIL_ID) ?? []);
}

function emptyChain(): CaseChain {
  return { observations: [], failureModes: [], proposals: [], patches: [], learns: [] };
}

function addId(chain: CaseChain, id: string, anchorFailureIds?: string[]) {
  if (/-OBS-|-RESEARCH-/i.test(id)) chain.observations.push(id);
  else if (/-FM-/i.test(id)) {
    if (!anchorFailureIds || anchorFailureIds.length === 0 || anchorFailureIds.some((anchor) => anchor.toUpperCase() === id.toUpperCase())) chain.failureModes.push(id);
  }
  else if (/-PROP-/i.test(id)) chain.proposals.push(id);
  else if (/-PATCH-/i.test(id)) chain.patches.push(id);
  else if (/-LEARN-/i.test(id)) chain.learns.push(id);
}

function normalizeChain(chain: CaseChain): CaseChain {
  return {
    observations: unique(chain.observations),
    failureModes: unique(chain.failureModes),
    proposals: unique(chain.proposals),
    patches: unique(chain.patches),
    learns: unique(chain.learns),
  };
}

function mergeChain(target: CaseChain, source: CaseChain, anchorFailureIds?: string[]) {
  for (const id of [...source.observations, ...source.failureModes, ...source.proposals, ...source.patches, ...source.learns]) addId(target, id, anchorFailureIds);
  return normalizeChain(target);
}

function chainIds(chain: CaseChain) {
  return [...chain.observations, ...chain.failureModes, ...chain.proposals, ...chain.patches, ...chain.learns];
}

function chainFromRecord(record: VigilIndexRecord): CaseChain {
  const publicChain = record.publicDisplay.chain;
  const chain: CaseChain = {
    observations: [...publicChain.observations],
    failureModes: [...publicChain.failureModes],
    proposals: [...publicChain.proposals],
    patches: [...publicChain.patches],
    learns: [],
  };
  addId(chain, record.id);
  return normalizeChain(chain);
}

function taxonomyLink(raw: UnknownRecord) {
  const links = raw.failure_taxonomy_links;
  return Array.isArray(links) && isObject(links[0]) ? links[0] : undefined;
}

function normalizeLearn(raw: UnknownRecord): LearnItem | undefined {
  const id = recordId(raw);
  if (!id || !LEARN_ID.test(id)) return undefined;
  const taxonomy = taxonomyLink(raw);
  return {
    id,
    title: text(raw.report_title ?? raw.title ?? (isObject(raw.record_identity) ? raw.record_identity.title : undefined)) ?? id,
    summary: text(raw.summary),
    abstractedLearning: text(raw.abstracted_learning),
    whatHappened: textList(raw.what_happened),
    governanceMisconception: textList(raw.governance_misconception),
    integratedLearning: textList(raw.integrated_learning ?? raw.must_not_be_forgotten),
    riskIfNotIntegrated: textList(raw.risk_if_not_integrated),
    futureApplication: textList(raw.future_application),
    generalisationBoundary: text(raw.generalisation_boundary),
    primaryFailureMode: text(raw.primary_failure_mode) ?? text(taxonomy?.primary_failure_mode),
    primaryFailureFamilyCode: text(raw.primary_failure_family_code) ?? text(taxonomy?.primary_failure_family_code),
    canonicalFailureName: text(raw.canonical_failure_name) ?? text(taxonomy?.canonical_failure_name),
    taxonomyReference: text(raw.taxonomy_reference) ?? text(taxonomy?.taxonomy_reference),
    raw,
    githubUrl: text(raw.github_blob_url ?? raw.raw_url),
  };
}

function mergeRecordDetail(indexRecord: VigilIndexRecord, detail: UnknownRecord) {
  return normalizeVigilRecord({
    ...detail,
    path: detail.path ?? indexRecord.path,
    github_blob_url: detail.github_blob_url ?? indexRecord.github_blob_url,
    raw_url: detail.raw_url ?? indexRecord.raw_url,
    source_registry: detail.source_registry ?? indexRecord.source_registry,
  });
}

async function detailedRecord(indexRecord: VigilIndexRecord) {
  try { return mergeRecordDetail(indexRecord, await loadVigilRecordDetail(indexRecord.raw)); }
  catch { return indexRecord; }
}

async function detailedLearn(raw: UnknownRecord) {
  const fallback = normalizeLearn(raw);
  if (!fallback) return undefined;
  try { return normalizeLearn({ ...raw, ...await loadVigilRecordDetail(raw) }) ?? fallback;
  } catch { return fallback; }
}

function failureAnchors(sourceId: string, sourceRecord: VigilIndexRecord | undefined, records: VigilIndexRecord[], rawRecords: UnknownRecord[]) {
  if (sourceRecord?.record_type === "failure_mode") return [sourceRecord.id];
  if (sourceRecord?.publicDisplay.chain.failureModes.length) return [sourceRecord.publicDisplay.chain.failureModes[0]];

  const directlyLinked = records
    .filter((record) => record.record_type === "failure_mode")
    .filter((record) => {
      const linked = new Set([...record.publicDisplay.chain.observations, ...referencedIds(record.raw)].map((id) => id.toUpperCase()));
      return linked.has(sourceId.toUpperCase());
    })
    .map((record) => record.id)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (directlyLinked.length) return [directlyLinked[0]];

  const referenced = rawRecords.flatMap((raw) => {
    const ids = referencedIds(raw);
    return ids.some((id) => id.toUpperCase() === sourceId.toUpperCase()) ? ids.filter((id) => /-FM-/i.test(id)) : [];
  }).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return referenced.length ? [referenced[0]] : [];
}

function intersects(values: string[], targets: Set<string>) {
  return values.some((value) => targets.has(value.toUpperCase()));
}

function reconstructCaseChain(
  sourceId: string,
  sourceRecord: VigilIndexRecord | undefined,
  anchorFailureIds: string[],
  records: VigilIndexRecord[],
  rawRecords: UnknownRecord[],
) {
  let chain = emptyChain();
  if (sourceRecord) chain = mergeChain(chain, chainFromRecord(sourceRecord), anchorFailureIds);
  addId(chain, sourceId, anchorFailureIds);
  for (const anchorId of anchorFailureIds) addId(chain, anchorId, anchorFailureIds);

  for (const anchorId of anchorFailureIds) {
    const anchor = records.find((record) => record.id.toUpperCase() === anchorId.toUpperCase());
    if (anchor) chain = mergeChain(chain, chainFromRecord(anchor), anchorFailureIds);
  }

  for (let pass = 0; pass < 4; pass += 1) {
    const before = chainIds(chain).map((id) => id.toUpperCase()).sort().join("|");
    const known = new Set(chainIds(chain).map((id) => id.toUpperCase()));
    const anchors = new Set(anchorFailureIds.map((id) => id.toUpperCase()));
    const knownProposals = new Set(chain.proposals.map((id) => id.toUpperCase()));

    for (const record of records) {
      if (record.record_type === "learn" || record.record_type === "failure_mode" && !anchors.has(record.id.toUpperCase())) continue;
      const rawRefs = referencedIds(record.raw);
      const recordFailureLinks = record.publicDisplay.chain.failureModes.map((id) => id.toUpperCase());
      const directlyKnown = known.has(record.id.toUpperCase());
      const tiedToAnchor = recordFailureLinks.some((id) => anchors.has(id)) || intersects(rawRefs, anchors);
      const tiedToProposal = record.publicDisplay.chain.proposals.some((id) => knownProposals.has(id.toUpperCase())) || intersects(rawRefs, knownProposals);
      if (!directlyKnown && !tiedToAnchor && !tiedToProposal) continue;
      addId(chain, record.id, anchorFailureIds);
      chain = mergeChain(chain, chainFromRecord(record), anchorFailureIds);
    }

    const expandedKnown = new Set(chainIds(chain).map((id) => id.toUpperCase()));
    for (const raw of rawRecords) {
      const id = recordId(raw);
      if (!id || !LEARN_ID.test(id)) continue;
      const refs = referencedIds(raw);
      if (id.toUpperCase() !== sourceId.toUpperCase() && !intersects(refs, expandedKnown) && !intersects(refs, anchors)) continue;
      addId(chain, id, anchorFailureIds);
      for (const linkedId of refs) addId(chain, linkedId, anchorFailureIds);
    }

    chain.failureModes = [...anchorFailureIds];
    chain = normalizeChain(chain);
    const after = chainIds(chain).map((id) => id.toUpperCase()).sort().join("|");
    if (after === before) break;
  }
  chain.failureModes = [...anchorFailureIds];
  return normalizeChain(chain);
}

function externalEvidenceFor(record: VigilIndexRecord): ExternalEvidence[] {
  const sources = [record.raw.source_records, record.raw.sources, record.raw.evidence_sources].find(Array.isArray);
  if (!Array.isArray(sources)) return [];
  return sources.flatMap((source) => {
    if (typeof source === "string") return [{ title: source, url: /^https?:\/\//i.test(source) ? source : undefined }];
    if (!isObject(source)) return [];
    const residence = text(source.source_residence)?.toLowerCase();
    if (residence === "cam-internal" || residence === "internal") return [];
    const title = text(source.source_title ?? source.title ?? source.name);
    if (!title) return [];
    return [{
      title,
      publisher: text(source.author_or_publisher ?? source.publisher ?? source.source_platform),
      date: text(source.source_date ?? source.date ?? source.published_date),
      url: text(source.source_url ?? source.url ?? source.archive_url),
    }];
  });
}

function dedupeEvidence(evidence: ExternalEvidence[]) {
  const seen = new Set<string>();
  return evidence.filter((source) => {
    const key = `${source.title.toLowerCase()}|${source.url ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function affectedSystemFor(record: VigilIndexRecord): AffectedSystem | undefined {
  const context = isObject(record.raw.system_context) ? record.raw.system_context : {};
  const provider = text(context.platform_or_vendor) ?? record.affected_platform_label ?? record.platform_label;
  const product = text(context.product_or_service ?? context.model_or_product);
  const modelRaw = text(context.specific_model_or_runtime);
  const model = modelRaw && !/^not applicable$/i.test(modelRaw) ? modelRaw : undefined;
  const systemType = text(context.system_type);
  const interfaceSurface = text(context.interface_surface);
  const deploymentContext = text(context.deployment_context);
  if (![provider, product, model, systemType, interfaceSurface, deploymentContext].some(Boolean)) return undefined;
  return { recordId: record.id, provider, product, model, systemType, interfaceSurface, deploymentContext };
}

function dedupeSystems(records: VigilIndexRecord[]) {
  const seen = new Set<string>();
  return records.flatMap((record) => affectedSystemFor(record) ?? []).filter((system) => {
    const key = [system.provider, system.product, system.model, system.interfaceSurface].filter(Boolean).join("|").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function diagnosticProvenance(record?: VigilIndexRecord): DiagnosticProvenance | undefined {
  if (!record || !isObject(record.raw.diagnostic_provenance)) return undefined;
  const provenance = record.raw.diagnostic_provenance;
  return {
    method: text(provenance.method),
    diagnosticDate: text(provenance.diagnostic_date),
    humanRole: text(provenance.human_role),
    aiRole: text(provenance.ai_role),
    aiPlatform: text(provenance.ai_platform),
    aiModel: text(provenance.ai_model),
    attributionBasis: text(provenance.model_attribution_basis),
    reviewStatus: text(provenance.review_status),
    authorityBoundary: text(provenance.authority_boundary),
  };
}

function diagnosticMethodLabel(value?: string) {
  if (!value) return undefined;
  if (value === "human-ai-collaborative-analysis") return "Human–AI collaborative analysis";
  return titleizeValue(value);
}

function reviewStatusLabel(value?: string) {
  if (!value) return undefined;
  if (value === "human-reviewed-and-approved") return "Human reviewed and approved";
  return titleizeValue(value);
}

function coverageItems(record?: VigilIndexRecord) {
  if (!record) return [];
  return firstObjectList(record.raw, ["existing_cam_coverage", "existing_coverage"]).map((item, index) => ({
    key: `${text(item.instrument ?? item.instrument_id) ?? "coverage"}-${index}`,
    instrument: text(item.instrument ?? item.instrument_id),
    section: text(item.section ?? item.provision),
    coverageType: text(item.coverage_type ?? item.relationship),
    relevance: text(item.relevance ?? item.coverage_summary),
    internalFailure: text(item.internal_failure),
  }));
}

function proposalTargets(record: VigilIndexRecord) {
  return unique([
    ...textList(valueAt(record.raw, "proposal_scope.cam_instruments")),
    ...textList(valueAt(record.raw, "cam_internal.target_instruments")),
    ...textList(valueAt(record.raw, "implementation_notes.suggested_insertion_points")),
  ]);
}

function proposalRequiredChange(record: VigilIndexRecord) {
  return record.publicDisplay.proposal?.proposedOutcome
    ?? firstText(record.raw, ["proposal_scope.scope_summary", "proposal_rationale"])
    ?? record.publicDisplay.finding
    ?? record.summary;
}

function implementationEntries(record: VigilIndexRecord): ImplementationEntry[] {
  return firstObjectList(record.raw, ["corpus_implementation.entries"]).map((entry) => {
    const verification = isObject(entry.verification) ? entry.verification : {};
    const source = isObject(entry.source) ? entry.source : {};
    return {
      instrumentId: text(entry.instrument_id ?? entry.instrument),
      section: text(entry.section),
      heading: text(entry.section_heading ?? entry.heading),
      resultingText: text(entry.resulting_text ?? entry.final_wording),
      verification: text(verification.status ?? entry.verification_status ?? entry.current_status),
      sourceUrl: text(source.direct_url ?? entry.canonical_url),
    };
  });
}

function patchResponseSummary(record: VigilIndexRecord) {
  return firstText(record.raw, ["corpus_implementation.implementation_outcome"])
    ?? record.publicDisplay.patch?.repairSummary
    ?? record.publicDisplay.finding
    ?? record.summary;
}

function implementationState(record: VigilIndexRecord) {
  return firstText(record.raw, ["corpus_implementation.canonical_state", "coverage_reconciliation.status"])
    ?? record.publicDisplay.patch?.verificationStatus;
}

function remainingScope(record: VigilIndexRecord) {
  return firstTextList(record.raw, ["coverage_reconciliation.remaining_scope", "corpus_implementation.remaining_scope", "remaining_scope"]);
}

function compactId(id: string) {
  return id.replace(/^VIGIL-(?:\d{4}-)?/i, "");
}

function severityDisplay(value?: string) {
  const raw = value?.trim();
  if (!raw) return "Not assessed";
  const code = raw.toUpperCase();
  const labels: Record<string, string> = {
    S0: "Critical",
    S1: "High",
    S2: "Moderate",
    S3: "Low",
    S4: "Negligible",
    SU: "To be assessed",
  };
  return labels[code] ? `${code} · ${labels[code]}` : titleizeValue(raw);
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

function Field({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return <div className="vigil-case-field"><dt>{label}</dt><dd className={mono ? "is-mono" : undefined}>{value}</dd></div>;
}

function Section({ id, number, title, description, children }: { id: string; number?: string; title: string; description: string; children: ReactNode }) {
  return <section id={id} className="vigil-case-section" aria-labelledby={`${id}-heading`}>
    <header>{number ? <span>{number}</span> : null}<div><h2 id={`${id}-heading`}>{title}</h2><p>{description}</p></div></header>
    <div className="vigil-case-section-body">{children}</div>
  </section>;
}

function LearningList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return <ul className="vigil-learning-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function TextList({ items }: { items: string[] }) {
  if (!items.length) return null;
  if (items.length === 1) return <p>{items[0]}</p>;
  return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function recordLink(record: VigilIndexRecord) {
  return record.github_blob_url ?? record.raw_url;
}

function taxonomyRelationshipLabel(reference: TaxonomyReferenceTarget) {
  if (reference.relationship === "primary") return "Primary taxonomy classification";
  if (reference.relationship === "secondary") return "Secondary taxonomy classification";
  return "Family-only taxonomy classification";
}

export default function VigilCaseFile() {
  const [, caseParams] = useRoute("/observatory/cases/:recordId");
  const [, incidentParams] = useRoute("/observatory/incidents/:recordId");
  const [, failureParams] = useRoute("/observatory/failure-modes/:recordId");
  const [, vigilParams] = useRoute("/vigil/:recordId");
  const sourceId = decodeURIComponent(caseParams?.recordId ?? incidentParams?.recordId ?? failureParams?.recordId ?? vigilParams?.recordId ?? "").trim().replace(/\.md$/i, "");
  const [state, setState] = useState<CaseState>({ status: "loading" });
  const [activeStage, setActiveStage] = useState<StageId>("observe");
  const [taxonomyReferences, setTaxonomyReferences] = useState<TaxonomyReferenceTarget[]>([]);

  useEffect(() => setActiveStage("observe"), [sourceId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const registry = await loadVigilIncidentRecords();
        const normalized = normalizeRecords(registry.records);
        const indexById = new Map(normalized.map((record) => [record.id, record]));
        const sourceIndex = indexById.get(sourceId);
        if (!sourceIndex || sourceIndex.record_type !== "incident") throw new Error(`The canonical VIGIL Incident registry does not contain ${sourceId}.`);

        const incident = await detailedRecord(sourceIndex);
        const chain: CaseChain = { observations: [], failureModes: [incident.id], proposals: [], patches: [], learns: [] };
        if (!cancelled) setState({
          status: "ready",
          sourceId,
          anchorFailureIds: [incident.id],
          records: [incident],
          learns: [],
          chain,
          generatedAt: new Date().toISOString(),
        });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: (error as Error).message });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [sourceId]);

  const byId = useMemo(() => new Map(state.status === "ready" ? state.records.map((record) => [record.id, record]) : []), [state]);
  const observations = state.status === "ready" ? state.chain.observations.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record)) : [];
  const failures = state.status === "ready" ? state.chain.failureModes.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record)) : [];
  const proposals = state.status === "ready" ? state.chain.proposals.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record)) : [];
  const patches = state.status === "ready" ? state.chain.patches.map((id) => byId.get(id)).filter((record): record is VigilIndexRecord => Boolean(record)) : [];
  const failure = state.status === "ready"
    ? failures.find((record) => state.anchorFailureIds[0]?.toUpperCase() === record.id.toUpperCase()) ?? failures[0]
    : undefined;
  const failureDetail = useMemo(() => failure ? deriveFailureModePublicDetail(failure.raw, failure.publicDisplay) : undefined, [failure]);
  const externalSources = useMemo(() => state.status === "ready" && failure ? dedupeEvidence([failure, ...observations].flatMap(externalEvidenceFor)) : [], [failure, observations, state]);
  const affectedSystems = useMemo(() => failure ? dedupeSystems([failure, ...observations]) : dedupeSystems(observations), [failure, observations]);

  useEffect(() => {
    let cancelled = false;
    if (!failure) {
      setTaxonomyReferences([]);
      return () => { cancelled = true; };
    }
    void loadTaxonomyReferenceTargets(failure.raw)
      .then((references) => { if (!cancelled) setTaxonomyReferences(references); })
      .catch(() => { if (!cancelled) setTaxonomyReferences([]); });
    return () => { cancelled = true; };
  }, [failure]);

  if (state.status === "loading") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 text-muted-foreground sm:px-6 md:px-10">Preparing VIGIL Case File…</main></Shell>;
  if (state.status === "error") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 md:px-10"><div className="vigil-reference-state"><h1>Case File unavailable</h1><p>{state.message}</p><Link href="/observatory/cases">Return to Case Files →</Link></div></main></Shell>;

  const sourceRecord = byId.get(state.sourceId);
  const title = sourceRecord?.title ?? "VIGIL Case File";
  const summary = sourceRecord?.summary ?? sourceRecord?.publicDisplay.finding;
  const family = failure ? taxonomyFailureTypeLabel(failure.raw) : undefined;
  const updated = failure?.record_last_updated ?? failure?.publicDisplay.dates.lastUpdated ?? failure?.date_recorded;
  const recordCount = state.records.length + state.learns.length;
  const diagnostic = diagnosticProvenance(failure);
  const reportId = failure?.id ?? state.sourceId;

  const existingCoverage = coverageItems(failure);
  const governanceAssessment = failure ? firstText(failure.raw, ["vigil_assessment.governance_interpretation"]) : undefined;
  const factualBasis = failure ? firstText(failure.raw, ["vigil_assessment.factual_basis"]) : undefined;
  const governanceSignificance = failure ? firstText(failure.raw, ["vigil_assessment.significance_to_cam", "why_it_matters_to_CAM"]) : undefined;
  const assessmentBoundaries = failure ? firstTextList(failure.raw, ["vigil_assessment.assessment_boundaries"]) : [];
  const repairHypothesis = failure ? firstText(failure.raw, ["repair_hypothesis"]) : undefined;
  const requiredChanges = unique(proposals.map(proposalRequiredChange).filter((value): value is string => Boolean(value)));
  if (!requiredChanges.length && repairHypothesis) requiredChanges.push(repairHypothesis);
  const placementRationales = unique([
    ...patches.map((record) => firstText(record.raw, ["decision_trace.decision_summary"])),
    ...proposals.map((record) => firstText(record.raw, ["proposal_rationale"])),
  ].filter((value): value is string => Boolean(value)));
  const targetLocations = unique(proposals.flatMap(proposalTargets));

  const responseSummaries = unique(patches.map(patchResponseSummary).filter((value): value is string => Boolean(value)));
  const implementedControls = patches.flatMap(implementationEntries);
  const implementationStates = unique(patches.map(implementationState).filter((value): value is string => Boolean(value)));
  const remainingScopes = unique([...patches.flatMap(remainingScope), ...proposals.flatMap(remainingScope)]);
  const referenceCount = externalSources.length + taxonomyReferences.length + state.records.length + state.learns.length;

  const renderStageContent = (stageId: StageId): ReactNode => {
    if (stageId === "observe") return <>
      {affectedSystems.length > 0 && <section className="vigil-affected-systems" aria-labelledby="affected-systems-heading">
        <div className="vigil-case-subheading"><p className="vigil-library-kicker">Affected systems</p><h3 id="affected-systems-heading">Platforms, products and runtimes named in the evidence</h3></div>
        <div className="vigil-affected-system-grid">{affectedSystems.map((system, index) => <article key={`${system.recordId}-${index}`}>
          <span>{compactId(system.recordId)}</span>
          <dl>
            <Field label="Provider / platform" value={system.provider} />
            <Field label="Product / service" value={system.product} />
            <Field label="Model / runtime" value={system.model} />
            <Field label="System type" value={system.systemType} />
            <Field label="Interface" value={system.interfaceSurface} />
            <Field label="Deployment context" value={system.deploymentContext} />
          </dl>
        </article>)}</div>
      </section>}
      {observations.length > 0 && <div className="vigil-observation-list">{observations.map((record) => <article key={record.id} className="vigil-case-record vigil-observation-record">
        <div className="vigil-case-record-heading"><span>{record.id}</span><h3>{record.title}</h3></div>
        <p>{record.publicDisplay.observation?.observed ?? record.publicDisplay.finding ?? record.summary}</p>
        {(record.publicDisplay.observation?.context || record.publicDisplay.observation?.interpretation) && <div className="vigil-observation-context">
          {record.publicDisplay.observation?.context && <div><strong>Context</strong><p>{record.publicDisplay.observation.context}</p></div>}
          {record.publicDisplay.observation?.interpretation && <div><strong>VIGIL interpretation</strong><p>{record.publicDisplay.observation.interpretation}</p></div>}
        </div>}
      </article>)}</div>}
      {failureDetail?.evidence.length ? <div className="vigil-evidence-list">{failureDetail.evidence.map((evidence, index) => <EvidenceCard key={`${evidence.title}-${index}`} evidence={evidence} />)}</div> : null}
      {!failureDetail?.evidence.length && externalSources.length > 0 && <p className="vigil-case-empty">{externalSources.length} external evidence source{externalSources.length === 1 ? " is" : "s are"} recorded for this investigation. The full bibliography is available under References.</p>}
      {affectedSystems.length === 0 && observations.length === 0 && !failureDetail?.evidence.length && externalSources.length === 0 && <p className="vigil-case-empty">No structured evidence is available in the current public projection.</p>}
    </>;

    if (stageId === "classify") return <>
      {failure ? <CaseTaxonomyClassification failureId={failure.id} raw={failure.raw} severityLabel={severityDisplay(failure.severity)} /> : <p className="vigil-case-empty">No Incident is linked to this Case File, so no VIGIL taxonomy classification can be rendered.</p>}
    </>;

    if (stageId === "diagnose") return <>
      {(failure || existingCoverage.length > 0 || governanceAssessment || requiredChanges.length > 0 || placementRationales.length > 0 || targetLocations.length > 0) ? <article className="vigil-diagnosis-view">
        {failure && <div className="vigil-diagnosis-mechanism">
          <section className="vigil-diagnosis-definition">
            <p className="vigil-library-kicker">VIGIL governance assessment</p>
            <p>{governanceAssessment ?? failure.publicDisplay.finding ?? failure.summary}</p>
          </section>
          <div className="vigil-diagnosis-mechanism-pair">
            <section>
              <p className="vigil-library-kicker">Factual basis</p>
              <p>{factualBasis ?? "A separate factual-basis statement is not yet published for this Incident."}</p>
            </section>
            <section>
              <p className="vigil-library-kicker">Governance significance</p>
              <p>{governanceSignificance ?? "Governance significance is not yet separately stated in the canonical Incident."}</p>
            </section>
          </div>
        </div>}
        {(failure || existingCoverage.length > 0 || requiredChanges.length > 0 || placementRationales.length > 0) && <div className="vigil-diagnosis-grid">
          <section>
            <p className="vigil-library-kicker">Existing coverage</p>
            {existingCoverage.length > 0 ? <div className="vigil-coverage-list">{existingCoverage.map((coverage) => <div key={coverage.key}>
              <strong>{[coverage.instrument, coverage.section].filter(Boolean).join(" · ") || "Existing corpus coverage"}</strong>
              {coverage.coverageType && <span>{coverage.coverageType}</span>}
              {coverage.relevance && <p>{coverage.relevance}</p>}
              {coverage.internalFailure && <p>{coverage.internalFailure}</p>}
            </div>)}</div> : <p>No explicit existing-coverage assessment is stated in the current public record.</p>}
          </section>
          <section>
            <p className="vigil-library-kicker">Required governance change</p>
            {requiredChanges.length > 0 ? <TextList items={requiredChanges} /> : <p>No separate required-change statement is currently published.</p>}
          </section>
          <section>
            <p className="vigil-library-kicker">Placement / decision rationale</p>
            {placementRationales.length > 0 ? <TextList items={placementRationales} /> : <p>No separate placement rationale is currently published.</p>}
          </section>
        </div>}
        {assessmentBoundaries.length > 0 && <section className="vigil-diagnosis-targets"><p className="vigil-library-kicker">Assessment boundaries</p><TextList items={assessmentBoundaries} /></section>}
        {targetLocations.length > 0 && <section className="vigil-diagnosis-targets"><p className="vigil-library-kicker">Target instruments / insertion points</p><ul>{targetLocations.map((target) => <li key={target}>{target}</li>)}</ul></section>}
        {diagnostic && <section className="vigil-evidence-card" aria-labelledby="diagnostic-provenance-heading">
          <header className="vigil-evidence-header">
            <div className="vigil-evidence-title-row">
              <div>
                <p className="vigil-evidence-kicker">Diagnostic provenance</p>
                <h3 id="diagnostic-provenance-heading">{diagnosticMethodLabel(diagnostic.method) ?? "Diagnostic analysis"}</h3>
              </div>
            </div>
            <dl className="vigil-evidence-source-meta" aria-label="Diagnostic provenance details">
              {(diagnostic.aiPlatform || diagnostic.aiModel) && <div className="vigil-evidence-meta-field"><dt>AI collaborator</dt><dd>{[diagnostic.aiPlatform, diagnostic.aiModel].filter(Boolean).join(" ")}</dd></div>}
              {diagnostic.diagnosticDate && <div className="vigil-evidence-meta-field"><dt>Diagnosed</dt><dd>{diagnostic.diagnosticDate}</dd></div>}
              {diagnostic.reviewStatus && <div className="vigil-evidence-meta-field"><dt>Review status</dt><dd>{reviewStatusLabel(diagnostic.reviewStatus)}</dd></div>}
            </dl>
          </header>
          <div className="vigil-evidence-grid">
            {diagnostic.humanRole && <section className="vigil-evidence-column">
              <h4>Human contribution</h4>
              <p>{diagnostic.humanRole}</p>
            </section>}
            {diagnostic.aiRole && <section className="vigil-evidence-column vigil-evidence-interpretation">
              <h4>AI contribution</h4>
              <p>{diagnostic.aiRole}</p>
            </section>}
          </div>
          {(diagnostic.authorityBoundary || diagnostic.attributionBasis) && <details className="vigil-evidence-limitations">
            <summary>Authority and attribution</summary>
            <div className="vigil-evidence-boundary-list">
              {diagnostic.authorityBoundary && <p><strong>Authority boundary.</strong> {diagnostic.authorityBoundary}</p>}
              {diagnostic.attributionBasis && <p><strong>Model attribution.</strong> {diagnostic.attributionBasis}</p>}
            </div>
          </details>}
        </section>}
      </article> : <p className="vigil-case-empty">No structured governance assessment is linked yet. The investigation may still be in evidence gathering or diagnosis.</p>}
    </>;

    if (stageId === "repair") return <>
      {patches.length > 0 ? <article className="vigil-response-view">
        <section className="vigil-response-overview">
          <p className="vigil-library-kicker">Governance repair</p>
          {responseSummaries.length > 0 ? <TextList items={responseSummaries} /> : <p>The linked PATCH does not currently expose a concise public repair summary.</p>}
        </section>

        <section className="vigil-implemented-controls">
          <div className="vigil-case-subheading"><p className="vigil-library-kicker">Implemented controls</p><h3>Where the repair was placed in the governance corpus</h3></div>
          {implementedControls.length > 0 ? <div className="vigil-control-list">{implementedControls.map((entry, index) => <article key={`${entry.instrumentId}-${entry.section}-${index}`}>
            <div className="vigil-control-heading">
              <div><strong>{[entry.instrumentId, entry.section].filter(Boolean).join(" · ") || "Implemented control"}</strong>{entry.heading && <span>{entry.heading.replace(/^#+\s*/, "")}</span>}</div>
              {entry.verification && <small>{titleizeValue(entry.verification)}</small>}
            </div>
            {(entry.resultingText || entry.sourceUrl) && <details><summary>Implementation detail</summary>{entry.resultingText && <p>{entry.resultingText}</p>}{entry.sourceUrl && <a href={entry.sourceUrl} target="_blank" rel="noreferrer">Open canonical provision <ExternalLink aria-hidden="true" /></a>}</details>}
          </article>)}</div> : <div className="vigil-control-list">{patches.flatMap((record) => record.publicDisplay.corpusProvisions).map((provision, index) => <article key={`${provision.instrumentId}-${provision.section}-${index}`}><div className="vigil-control-heading"><div><strong>{[provision.instrumentId, provision.section].filter(Boolean).join(" · ") || "Corpus provision"}</strong>{provision.heading && <span>{provision.heading}</span>}</div></div>{provision.relationship && <p>{provision.relationship}</p>}</article>)}</div>}
        </section>

        <div className="vigil-response-state-grid">
          <section><p className="vigil-library-kicker">Current implementation state</p>{implementationStates.length > 0 ? <TextList items={implementationStates.map(titleizeValue)} /> : <p>No separate implementation-state value is currently published.</p>}</section>
          <section><p className="vigil-library-kicker">Remaining scope</p>{remainingScopes.length > 0 ? <TextList items={remainingScopes} /> : <p>No residual governance scope is recorded in the linked repair.</p>}</section>
        </div>
        <p className="vigil-stage-source-line">Repair derived from {patches.map((record) => compactId(record.id)).join(" · ")}</p>
      </article> : <p className="vigil-case-empty">No PATCH is linked yet. A governance repair may still be in development.</p>}
    </>;

    if (stageId === "learn") return <>
      {state.learns.length > 0 ? state.learns.map((learn) => <article key={learn.id} className="vigil-learning-view">
        <div className="vigil-learning-meta"><span>{compactId(learn.id)}</span><p>{learn.title}</p></div>
        <section className="vigil-learning-lead"><p className="vigil-library-kicker">Governance lesson</p><p>{learn.abstractedLearning ?? learn.summary ?? "No abstracted learning is stated."}</p></section>
        <div className="vigil-learning-sections">
          {learn.governanceMisconception.length > 0 && <section><p className="vigil-library-kicker">Governance misconception</p><LearningList items={learn.governanceMisconception} /></section>}
          {learn.integratedLearning.length > 0 && <section><p className="vigil-library-kicker">Key takeaways</p><LearningList items={learn.integratedLearning} /></section>}
          {learn.futureApplication.length > 0 && <section><p className="vigil-library-kicker">Future applications</p><LearningList items={learn.futureApplication} /></section>}
          {learn.riskIfNotIntegrated.length > 0 && <section className="is-risk"><p className="vigil-library-kicker">Risk if not integrated</p><LearningList items={learn.riskIfNotIntegrated} /></section>}
        </div>
        {learn.generalisationBoundary && <section className="vigil-learning-limit"><p className="vigil-library-kicker">Limitations / generalisation boundary</p><p>{learn.generalisationBoundary}</p></section>}
        <Link href={`/observatory/knowledge-base/${encodeURIComponent(learn.id)}`}>Open full governance lesson →</Link>
      </article>) : <p className="vigil-case-empty">No published LEARN record is linked. The investigation remains useful while learning closure is incomplete.</p>}
    </>;

    if (stageId === "references") return referenceCount > 0 ? <div className="vigil-case-citations vigil-case-bibliography">
      <ol>
        {externalSources.map((source, index) => <li key={`${source.title}-${source.url}-${index}`}>
          <span>[{index + 1}]</span>
          <div>
            <strong>{source.title}</strong>
            {(source.publisher || source.date) && <p>{[source.publisher, source.date].filter(Boolean).join(" · ")}</p>}
            {source.url && <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>}
          </div>
        </li>)}
        {taxonomyReferences.map((reference, index) => <li key={`${reference.relationship}-${reference.id}`}>
          <span>[{externalSources.length + index + 1}]</span>
          <div>
            <strong>{reference.id} — {reference.title}</strong>
            <p>VIGIL Failure Taxonomy · {taxonomyRelationshipLabel(reference)}</p>
            <a href={reference.url} target="_blank" rel="noreferrer">{reference.url}</a>
          </div>
        </li>)}
        {state.records.map((record, index) => <li key={record.id}>
          <span>[{externalSources.length + taxonomyReferences.length + index + 1}]</span>
          <div>
            <strong>{record.id} — {record.title}</strong>
            {recordLink(record) && <a href={recordLink(record)} target="_blank" rel="noreferrer">{recordLink(record)}</a>}
          </div>
        </li>)}
        {state.learns.map((learn, index) => <li key={learn.id}>
          <span>[{externalSources.length + taxonomyReferences.length + state.records.length + index + 1}]</span>
          <div>
            <strong>{learn.id} — {learn.title}</strong>
            {learn.githubUrl && <a href={learn.githubUrl} target="_blank" rel="noreferrer">{learn.githubUrl}</a>}
          </div>
        </li>)}
      </ol>
    </div> : <p className="vigil-case-empty">No references are currently available for this Case File.</p>;

    return null;
  };

  const activeDefinition = CASE_VIEWS.find((stage) => stage.id === activeStage) ?? CASE_VIEWS[0];
  const activeAriaLabel = `${activeDefinition.number} ${activeDefinition.label}`;

  return <Shell><VigilObservatoryNav /><main className="vigil-case-file-page"><div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10">
    <Link href="/observatory/cases" className="vigil-back-link"><ArrowLeft aria-hidden="true" /> Case Files</Link>

    <header className="vigil-case-file-hero vigil-case-file-hero-v4">
      <div className="vigil-case-file-title-block">
        <p className="vigil-library-kicker">VIGIL Case File · AI Incident investigation</p>
        <h1>{title}</h1>
        {summary && <p className="vigil-case-file-summary">{summary}</p>}
      </div>
      <aside className="vigil-case-meta-panel" aria-label="Case File metadata">
        <dl>
          <Field label="Incident" value={failure ? compactId(failure.id) : compactId(state.sourceId)} mono />
          <Field label="Failure type" value={family} />
          <Field label="Severity" value={severityDisplay(failure?.severity)} />
          <Field label="Updated" value={updated} mono />
          <Field label="Linked VIGIL records" value={String(recordCount)} />
          <Field label="Generated at (UTC)" value={formatGeneratedAt(state.generatedAt)} mono />
        </dl>
        <Link href={`/observatory/reports/${encodeURIComponent(reportId)}`} className="vigil-case-print-button"><FileText aria-hidden="true" /> Generate report / PDF</Link>
      </aside>
    </header>

    <nav className="vigil-case-stage-nav" aria-label="Case File evidence-to-repair sections">
      <div className="vigil-case-stage-tabs" role="tablist">
        {VIGIL_EVIDENCE_REPAIR_SECTIONS.map((stage) => <button
          key={stage.id}
          type="button"
          role="tab"
          aria-selected={activeStage === stage.id}
          aria-controls={`case-panel-${stage.id}`}
          className={activeStage === stage.id ? "is-active" : undefined}
          onClick={() => setActiveStage(stage.id)}
        ><span>{stage.number}</span>{stage.label}</button>)}
      </div>
    </nav>

    <div className="vigil-case-active-stage" role="tabpanel" id={`case-panel-${activeStage}`} aria-label={activeAriaLabel}>
      <Section id={`case-${activeStage}`} number={activeDefinition.number} title={activeDefinition.label} description={activeDefinition.description}>
        {renderStageContent(activeStage)}
      </Section>
    </div>
  </div></main></Shell>;
}
