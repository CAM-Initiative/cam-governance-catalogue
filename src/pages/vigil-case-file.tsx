import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { EvidenceCard } from "@/components/vigil/EvidenceCard";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";
import { loadVigilRecordDetail, loadVigilRegistryRecords, type UnknownRecord } from "@/lib/vigilRegistry";
import {
  normalizeFailureFamilyLabel,
  normalizeRecords,
  normalizeVigilRecord,
  titleizeValue,
  type VigilIndexRecord,
} from "@/lib/vigilPresentation";
import { deriveFailureModePublicDetail } from "@/lib/vigilPublicDisplay";

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
  raw: UnknownRecord;
  githubUrl?: string;
};

type CaseState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sourceId: string; anchorFailureIds: string[]; records: VigilIndexRecord[]; learns: LearnItem[]; chain: CaseChain };

type ExternalEvidence = {
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
};

const VIGIL_ID = /VIGIL-\d{4}-(?:OBS|RESEARCH|FM|PROP|PATCH|LEARN)-\d{4}/gi;
const LEARN_ID = /^VIGIL-\d{4}-LEARN-\d{4}$/i;

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function textList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  return values.flatMap((item) => text(item) ? [text(item)!] : []);
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

function normalizeLearn(raw: UnknownRecord): LearnItem | undefined {
  const id = recordId(raw);
  if (!id || !LEARN_ID.test(id)) return undefined;
  return {
    id,
    title: text(raw.report_title ?? raw.title ?? (isObject(raw.record_identity) ? raw.record_identity.title : undefined)) ?? id,
    summary: text(raw.summary),
    abstractedLearning: text(raw.abstracted_learning),
    whatHappened: textList(raw.what_happened),
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
  try { return normalizeLearn({ ...raw, ...await loadVigilRecordDetail(raw) }) ?? fallback; }
  catch { return fallback; }
}

function failureAnchors(sourceId: string, sourceRecord: VigilIndexRecord | undefined, records: VigilIndexRecord[], rawRecords: UnknownRecord[]) {
  const anchors: string[] = [];
  if (sourceRecord?.record_type === "failure_mode") anchors.push(sourceRecord.id);
  if (sourceRecord) anchors.push(...sourceRecord.publicDisplay.chain.failureModes);

  if (anchors.length === 0) {
    for (const record of records) {
      if (record.record_type !== "failure_mode") continue;
      const linked = new Set([...record.publicDisplay.chain.observations, ...referencedIds(record.raw)].map((id) => id.toUpperCase()));
      if (linked.has(sourceId.toUpperCase())) anchors.push(record.id);
    }
  }

  if (anchors.length === 0) {
    for (const raw of rawRecords) {
      const ids = referencedIds(raw);
      if (!ids.some((id) => id.toUpperCase() === sourceId.toUpperCase())) continue;
      anchors.push(...ids.filter((id) => /-FM-/i.test(id)));
    }
  }
  return unique(anchors);
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
      if (record.record_type === "learn") continue;
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

    chain = normalizeChain(chain);
    const after = chainIds(chain).map((id) => id.toUpperCase()).sort().join("|");
    if (after === before) break;
  }
  return chain;
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
      description: text(source.source_context ?? source.description ?? source.relevance_note),
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

function Field({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return <div className="vigil-case-field"><dt>{label}</dt><dd className={mono ? "is-mono" : undefined}>{value}</dd></div>;
}

function Section({ id, number, title, description, children }: { id: string; number: string; title: string; description: string; children: ReactNode }) {
  return <section id={id} className="vigil-case-section" aria-labelledby={`${id}-heading`}>
    <header><span>{number}</span><div><h2 id={`${id}-heading`}>{title}</h2><p>{description}</p></div></header>
    <div className="vigil-case-section-body">{children}</div>
  </section>;
}

function recordLink(record: VigilIndexRecord) {
  return record.github_blob_url ?? record.raw_url;
}

function ImplementationProvenance({ record }: { record: VigilIndexRecord }) {
  const provenance = isObject(record.raw.corpus_release_provenance) ? record.raw.corpus_release_provenance : undefined;
  if (!provenance) return null;
  const implementation = isObject(provenance.implementation_corpus_state) ? provenance.implementation_corpus_state : undefined;
  const canonical = isObject(provenance.canonical_corpus_state) ? provenance.canonical_corpus_state : undefined;
  const release = isObject(provenance.published_release_at_implementation) ? provenance.published_release_at_implementation : undefined;
  const implementationCommit = text(implementation?.commit);
  const canonicalCommit = text(canonical?.commit);
  const targetRelease = text(provenance.target_release ?? provenance.target_version ?? provenance.intended_release ?? provenance.release_target) ?? "Unreleased working corpus";
  const publishedVersion = text(release?.version);
  const verificationState = canonicalCommit
    ? implementationCommit === canonicalCommit
      ? "Implementation and canonical corpus state recorded at the same commit"
      : "Implementation and canonical corpus states recorded separately"
    : text(provenance.provenance_mode) ?? "Canonical corpus state not separately declared";

  return <aside className="vigil-implementation-provenance">
    <p className="vigil-library-kicker">Implementation provenance</p>
    <h3>Governance corpus state</h3>
    <dl>
      <Field label="Target release" value={targetRelease} />
      <Field label="Published release at implementation" value={publishedVersion ? `Version ${publishedVersion}` : text(release?.status)} />
      <Field label="Verification state" value={verificationState} />
      <Field label="Implementation date" value={text(implementation?.date)} />
    </dl>
    <div className="vigil-commit-links">
      {implementationCommit && <a href={`https://github.com/CAM-Initiative/Caelestis/commit/${implementationCommit}`} target="_blank" rel="noreferrer">Implementation commit <code>{implementationCommit.slice(0, 12)}</code> <ExternalLink aria-hidden="true" /></a>}
      {canonicalCommit && canonicalCommit !== implementationCommit && <a href={`https://github.com/CAM-Initiative/Caelestis/commit/${canonicalCommit}`} target="_blank" rel="noreferrer">Canonical commit <code>{canonicalCommit.slice(0, 12)}</code> <ExternalLink aria-hidden="true" /></a>}
    </div>
    {Array.isArray(provenance.limitations) && provenance.limitations.length > 0 && <p className="vigil-provenance-note">{provenance.limitations.map(String).join(" ")}</p>}
  </aside>;
}

export default function VigilCaseFile() {
  const [, caseParams] = useRoute("/observatory/cases/:recordId");
  const [, failureParams] = useRoute("/observatory/failure-modes/:recordId");
  const [, reportParams] = useRoute("/observatory/reports/:recordId");
  const [, vigilParams] = useRoute("/vigil/:recordId");
  const sourceId = decodeURIComponent(caseParams?.recordId ?? failureParams?.recordId ?? reportParams?.recordId ?? vigilParams?.recordId ?? "").trim().replace(/\.md$/i, "");
  const [state, setState] = useState<CaseState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const registry = await loadVigilRegistryRecords();
        const normalized = normalizeRecords(registry.records);
        const indexById = new Map(normalized.map((record) => [record.id, record]));
        const rawById = new Map(registry.records.map((raw) => [recordId(raw), raw]).filter((entry): entry is [string, UnknownRecord] => Boolean(entry[0])));
        const sourceIndex = indexById.get(sourceId);
        const sourceRaw = rawById.get(sourceId);
        if (!sourceIndex && !sourceRaw) throw new Error(`The canonical VIGIL registry does not contain ${sourceId}.`);

        const sourceRecord = sourceIndex ? await detailedRecord(sourceIndex) : undefined;
        const anchorFailureIds = failureAnchors(sourceId, sourceRecord, normalized, registry.records);
        const chain = reconstructCaseChain(sourceId, sourceRecord, anchorFailureIds, normalized, registry.records);

        const recordDetails: VigilIndexRecord[] = [];
        for (const id of [...chain.observations, ...chain.failureModes, ...chain.proposals, ...chain.patches]) {
          const index = indexById.get(id);
          if (index) recordDetails.push(id === sourceRecord?.id ? sourceRecord : await detailedRecord(index));
        }
        const learns = (await Promise.all(chain.learns.map((id) => rawById.get(id)).filter((raw): raw is UnknownRecord => Boolean(raw)).map(detailedLearn))).filter((item): item is LearnItem => Boolean(item));
        if (!cancelled) setState({ status: "ready", sourceId, anchorFailureIds, records: recordDetails, learns, chain });
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
    ? failures.find((record) => state.anchorFailureIds.some((id) => id.toUpperCase() === record.id.toUpperCase())) ?? failures[0]
    : undefined;
  const failureDetail = useMemo(() => failure ? deriveFailureModePublicDetail(failure.raw, failure.publicDisplay) : undefined, [failure]);
  const externalSources = useMemo(() => state.status === "ready" ? dedupeEvidence([...observations, ...failures].flatMap(externalEvidenceFor)) : [], [failures, observations, state]);
  const structuredEvidenceTitles = useMemo(() => new Set((failureDetail?.evidence ?? []).map((evidence) => evidence.title.toLowerCase())), [failureDetail]);
  const additionalSources = useMemo(() => externalSources.filter((source) => !structuredEvidenceTitles.has(source.title.toLowerCase())), [externalSources, structuredEvidenceTitles]);

  if (state.status === "loading") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 text-muted-foreground sm:px-6 md:px-10">Preparing VIGIL Case File…</main></Shell>;
  if (state.status === "error") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 md:px-10"><div className="vigil-reference-state"><h1>Case File unavailable</h1><p>{state.message}</p><Link href="/observatory/cases">Return to Case Files →</Link></div></main></Shell>;

  const sourceRecord = byId.get(state.sourceId);
  const title = failure?.title ?? state.learns[0]?.title ?? sourceRecord?.title ?? "VIGIL Case File";
  const summary = failureDetail?.definition ?? failure?.publicDisplay.finding ?? sourceRecord?.publicDisplay.finding ?? sourceRecord?.summary;
  const family = failure ? normalizeFailureFamilyLabel(failure.failure_family)?.replace(/\s+Failures$/i, "") ?? failure.failure_family : undefined;
  const updated = failure?.record_last_updated ?? failure?.publicDisplay.dates.lastUpdated;
  const evidenceConfidence = failure?.evidence_confidence;

  return <Shell><VigilObservatoryNav /><main className="vigil-case-file-page"><div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10">
    <Link href="/observatory/cases" className="vigil-back-link"><ArrowLeft aria-hidden="true" /> Case Files</Link>

    <header className="vigil-case-file-hero vigil-case-file-hero-v3">
      <div>
        <p className="vigil-library-kicker">VIGIL Case File · AI failure mode investigation</p>
        <div className="vigil-case-identity-line">
          {failure && <span>{failure.id.replace(/^VIGIL-\d{4}-/i, "")}</span>}
          {family && <span>{family}</span>}
        </div>
        <h1>{title}</h1>
        {summary && <p>{summary}</p>}
        <div className="vigil-case-plain-meta">
          {evidenceConfidence && <span><strong>Evidence:</strong> {titleizeValue(evidenceConfidence)}</span>}
          {updated && <span><strong>Updated:</strong> {updated}</span>}
        </div>
      </div>
      {failure?.severity && <div className="vigil-case-severity"><VigilStatusChip value={failure.severity} /></div>}
    </header>

    {failureDetail && <section className="vigil-investigation-overview" aria-label="Failure mode overview">
      <div className="vigil-overview-definition">
        <p className="vigil-library-kicker">Failure definition</p>
        <p>{failureDetail.definition ?? summary}</p>
      </div>
      <div className="vigil-overview-grid">
        <div><p className="vigil-library-kicker">Recognition threshold</p><h2>This failure is present when…</h2><p>{failureDetail.recognitionThreshold ?? "A separate recognition threshold is not yet stated in the canonical record."}</p></div>
        <div><p className="vigil-library-kicker">Governance significance</p><h2>Why it matters</h2><p>{failureDetail.significance ?? "Governance significance is not yet separately stated in the canonical record."}</p></div>
      </div>
    </section>}

    <nav className="vigil-case-stage-nav" aria-label="Case File sections">
      <a href="#case-evidence"><span>01</span>Evidence</a>
      <a href="#case-classify"><span>02</span>Classify</a>
      <a href="#case-diagnose"><span>03</span>Diagnose</a>
      <a href="#case-respond"><span>04</span>Respond</a>
      <a href="#case-learn"><span>05</span>Learn</a>
      <a href="#case-provenance"><span>06</span>Provenance</a>
    </nav>

    <div className="vigil-case-sections">
      <Section id="case-evidence" number="01" title="Evidence" description="What happened, what the available sources establish, and where the evidentiary boundary sits.">
        {observations.length > 0 && <div className="vigil-observation-list">{observations.map((record) => <article key={record.id} className="vigil-case-record vigil-observation-record">
          <div className="vigil-case-record-heading"><span>{record.id}</span><h3>{record.title}</h3></div>
          <p>{record.publicDisplay.observation?.observed ?? record.publicDisplay.finding ?? record.summary}</p>
          {(record.publicDisplay.observation?.context || record.publicDisplay.observation?.interpretation) && <div className="vigil-observation-context">
            {record.publicDisplay.observation?.context && <div><strong>Context</strong><p>{record.publicDisplay.observation.context}</p></div>}
            {record.publicDisplay.observation?.interpretation && <div><strong>VIGIL interpretation</strong><p>{record.publicDisplay.observation.interpretation}</p></div>}
          </div>}
        </article>)}</div>}
        {failureDetail?.evidence.length ? <div className="vigil-evidence-list">{failureDetail.evidence.map((evidence, index) => <EvidenceCard key={`${evidence.title}-${index}`} evidence={evidence} />)}</div> : null}
        {additionalSources.length > 0 && <div className="vigil-case-source-preview">{additionalSources.map((source, index) => <article key={`${source.title}-${source.url}-${index}`}><span>[{index + 1}]</span><div><strong>{source.title}</strong>{(source.publisher || source.date) && <p>{[source.publisher, source.date].filter(Boolean).join(" · ")}</p>}{source.description && <p>{source.description}</p>}</div></article>)}</div>}
        {observations.length === 0 && !failureDetail?.evidence.length && additionalSources.length === 0 && <p className="vigil-case-empty">No structured evidence is available in the current public projection.</p>}
      </Section>

      <Section id="case-classify" number="02" title="Classify" description="How the evidence maps to a repeatable failure pattern and the threshold used to recognise it.">
        {failures.length > 0 ? failures.map((record) => {
          const detail = deriveFailureModePublicDetail(record.raw, record.publicDisplay);
          const recordFamily = normalizeFailureFamilyLabel(record.failure_family)?.replace(/\s+Failures$/i, "") ?? record.failure_family;
          return <article key={record.id} className="vigil-case-record vigil-classification-record">
            <div className="vigil-case-record-heading"><span>{record.id}</span><h3>{record.title}</h3></div>
            <dl className="vigil-classification-grid">
              <Field label="Failure family" value={recordFamily} />
              <Field label="Failure subtype" value={record.failure_subtype} />
              <Field label="Evidence confidence" value={record.evidence_confidence ? titleizeValue(record.evidence_confidence) : undefined} />
              {record.severity && <div className="vigil-case-field"><dt>Severity</dt><dd><VigilStatusChip value={record.severity} /></dd></div>}
            </dl>
            {detail.recognitionThreshold && <div className="vigil-case-callout"><strong>Classification basis</strong><p>{detail.recognitionThreshold}</p></div>}
          </article>;
        }) : <p className="vigil-case-empty">No failure mode classification is linked yet.</p>}
      </Section>

      <Section id="case-diagnose" number="03" title="Diagnose" description="The governance weakness identified from the classified failure and the response VIGIL proposes.">
        {proposals.length > 0 ? proposals.map((record) => <article key={record.id} className="vigil-case-record">
          <div className="vigil-case-record-heading"><span>{record.id}</span><h3>{record.title}</h3></div>
          <div className="vigil-case-narrative"><strong>Governance weakness</strong><p>{record.publicDisplay.proposal?.problem ?? record.publicDisplay.finding ?? record.summary}</p></div>
          {record.publicDisplay.proposal?.proposedOutcome && <div className="vigil-case-callout"><strong>Required governance capability</strong><p>{record.publicDisplay.proposal.proposedOutcome}</p></div>}
        </article>) : <p className="vigil-case-empty">No proposal is linked yet. The investigation may still be in diagnosis or monitoring.</p>}
      </Section>

      <Section id="case-respond" number="04" title="Respond" description="What governance response was implemented or relied upon, and the corpus state against which it was verified.">
        {patches.length > 0 ? patches.map((record) => <article key={record.id} className="vigil-case-record vigil-case-repair-record">
          <div className="vigil-case-record-heading"><span>{record.id}</span><h3>{record.title}</h3></div>
          <div className="vigil-case-narrative"><strong>Response summary</strong><p>{record.publicDisplay.patch?.repairSummary ?? record.publicDisplay.finding ?? record.summary}</p></div>
          {(record.publicDisplay.patch?.verificationStatus || record.publicDisplay.patch?.implementationDate) && <p className="vigil-response-meta">{[
            record.publicDisplay.patch?.implementationDate ? `Implemented ${record.publicDisplay.patch.implementationDate}` : undefined,
            record.publicDisplay.patch?.verificationStatus ? `Verification: ${record.publicDisplay.patch.verificationStatus}` : undefined,
          ].filter(Boolean).join(" · ")}</p>}
          {record.publicDisplay.corpusProvisions.length > 0 && <div className="vigil-case-provision-list">{record.publicDisplay.corpusProvisions.map((provision, index) => <div key={`${provision.instrumentId}-${provision.section}-${index}`}><strong>{[provision.instrumentId, provision.section].filter(Boolean).join(" · ")}</strong>{provision.heading && <span>{provision.heading}</span>}{provision.relationship && <p>{provision.relationship}</p>}</div>)}</div>}
          <ImplementationProvenance record={record} />
        </article>) : <p className="vigil-case-empty">No PATCH is linked yet. A governance response may still be in development.</p>}
      </Section>

      <Section id="case-learn" number="05" title="Learn" description="Durable, bounded governance knowledge preserved after the evidence-to-response chain.">
        {state.learns.length > 0 ? state.learns.map((learn) => <article key={learn.id} className="vigil-case-record">
          <div className="vigil-case-record-heading"><span>{learn.id}</span><h3>{learn.title}</h3></div>
          <div className="vigil-case-narrative"><strong>What governance should remember</strong><p>{learn.abstractedLearning ?? learn.summary}</p></div>
          {learn.whatHappened.length > 0 && <ol>{learn.whatHappened.map((item) => <li key={item}>{item}</li>)}</ol>}
          <Link href={`/observatory/knowledge-base/${encodeURIComponent(learn.id)}`}>Open governance lesson →</Link>
        </article>) : <p className="vigil-case-empty">No published LEARN record is linked. The investigation remains useful while learning closure is incomplete.</p>}
      </Section>

      <Section id="case-provenance" number="06" title="Provenance" description="External evidence citations, VIGIL record provenance and corpus implementation provenance remain distinct.">
        {externalSources.length > 0 && <div className="vigil-case-citations"><h3>External evidence sources</h3><ol>{externalSources.map((source, index) => <li key={`${source.title}-${source.url}-${index}`}><span>[{index + 1}]</span><div><strong>{source.title}</strong>{(source.publisher || source.date) && <p>{[source.publisher, source.date].filter(Boolean).join(" · ")}</p>}{source.url && <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>}</div></li>)}</ol></div>}
        <div className="vigil-record-provenance"><h3>VIGIL record provenance</h3><div>{state.records.map((record) => <article key={record.id}><span>{record.id}</span><strong>{record.title}</strong>{recordLink(record) && <a href={recordLink(record)} target="_blank" rel="noreferrer">Canonical record <ExternalLink aria-hidden="true" /></a>}</article>)}{state.learns.map((learn) => <article key={learn.id}><span>{learn.id}</span><strong>{learn.title}</strong>{learn.githubUrl && <a href={learn.githubUrl} target="_blank" rel="noreferrer">Canonical record <ExternalLink aria-hidden="true" /></a>}</article>)}</div></div>
      </Section>
    </div>
  </div></main></Shell>;
}
