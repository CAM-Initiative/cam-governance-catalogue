import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";
import { loadVigilRecordDetail, loadVigilRegistryRecords, type UnknownRecord } from "@/lib/vigilRegistry";
import { normalizeRecords, normalizeVigilRecord, type VigilIndexRecord } from "@/lib/vigilPresentation";

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
  | { status: "ready"; sourceId: string; records: VigilIndexRecord[]; learns: LearnItem[]; chain: CaseChain };

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

function linkedIds(raw: UnknownRecord) {
  const linked = raw.linked_records ?? raw.failure_taxonomy_links ?? [];
  return unique(JSON.stringify(linked).match(VIGIL_ID) ?? []);
}

function emptyChain(): CaseChain {
  return { observations: [], failureModes: [], proposals: [], patches: [], learns: [] };
}

function addId(chain: CaseChain, id: string) {
  if (/-OBS-|-RESEARCH-/i.test(id)) chain.observations.push(id);
  else if (/-FM-/i.test(id)) chain.failureModes.push(id);
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

function Section({ id, number, title, description, children }: { id: string; number: string; title: string; description: string; children: React.ReactNode }) {
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
      {canonicalCommit && <a href={`https://github.com/CAM-Initiative/Caelestis/commit/${canonicalCommit}`} target="_blank" rel="noreferrer">Canonical commit <code>{canonicalCommit.slice(0, 12)}</code> <ExternalLink aria-hidden="true" /></a>}
    </div>
    {Array.isArray(provenance.limitations) && provenance.limitations.length > 0 && <p className="vigil-provenance-note">{provenance.limitations.map(String).join(" ")}</p>}
  </aside>;
}

export default function VigilCaseFile() {
  const [, caseParams] = useRoute("/observatory/cases/:recordId");
  const [, reportParams] = useRoute("/observatory/reports/:recordId");
  const sourceId = decodeURIComponent(caseParams?.recordId ?? reportParams?.recordId ?? "").trim().replace(/\.md$/i, "");
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
        let chain = sourceRecord ? chainFromRecord(sourceRecord) : emptyChain();
        if (!sourceRecord && sourceRaw) for (const id of linkedIds(sourceRaw)) addId(chain, id);
        addId(chain, sourceId);
        chain = normalizeChain(chain);

        const seedIds = new Set(chainIds(chain).map((id) => id.toUpperCase()));
        const learnRaw = registry.records.filter((raw) => {
          const id = recordId(raw);
          if (!id || !LEARN_ID.test(id)) return false;
          if (id.toUpperCase() === sourceId.toUpperCase()) return true;
          return linkedIds(raw).some((linked) => seedIds.has(linked.toUpperCase()));
        });
        for (const raw of learnRaw) {
          const id = recordId(raw);
          if (id) addId(chain, id);
          for (const linked of linkedIds(raw)) addId(chain, linked);
        }
        chain = normalizeChain(chain);

        const recordDetails: VigilIndexRecord[] = [];
        for (const id of [...chain.observations, ...chain.failureModes, ...chain.proposals, ...chain.patches]) {
          const index = indexById.get(id);
          if (index) recordDetails.push(id === sourceRecord?.id ? sourceRecord : await detailedRecord(index));
        }
        const learns = (await Promise.all(learnRaw.map(detailedLearn))).filter((item): item is LearnItem => Boolean(item));
        if (!cancelled) setState({ status: "ready", sourceId, records: recordDetails, learns, chain });
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
  const externalSources = useMemo(() => state.status === "ready" ? dedupeEvidence([...observations, ...failures].flatMap(externalEvidenceFor)) : [], [failures, observations, state]);

  if (state.status === "loading") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 text-muted-foreground sm:px-6 md:px-10">Preparing VIGIL Case File…</main></Shell>;
  if (state.status === "error") return <Shell><VigilObservatoryNav /><main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 md:px-10"><div className="vigil-reference-state"><h1>Case File unavailable</h1><p>{state.message}</p><Link href="/observatory/cases">Return to Cases →</Link></div></main></Shell>;

  const sourceRecord = byId.get(state.sourceId);
  const title = state.learns[0]?.title ?? failures[0]?.title ?? sourceRecord?.title ?? "VIGIL Case File";
  const summary = state.learns[0]?.abstractedLearning ?? sourceRecord?.publicDisplay.finding ?? sourceRecord?.summary ?? failures[0]?.publicDisplay.failure?.definition;
  const recordCount = state.records.length + state.learns.length;

  return <Shell><VigilObservatoryNav /><main className="vigil-case-file-page"><div className="container mx-auto max-w-[1360px] px-4 py-7 sm:px-6 md:px-10 md:py-10">
    <Link href="/observatory/cases" className="vigil-back-link"><ArrowLeft aria-hidden="true" /> Case Files</Link>
    <header className="vigil-case-file-hero">
      <div><p className="vigil-library-kicker">VIGIL Case File</p><h1>{title}</h1>{summary && <p>{summary}</p>}</div>
      <dl><Field label="Initiated from" value={state.sourceId} mono /><Field label="Linked VIGIL records" value={String(recordCount)} /><Field label="External evidence sources" value={String(externalSources.length)} /></dl>
    </header>

    <nav className="vigil-case-stage-nav" aria-label="Case File sections">
      <a href="#case-evidence"><span>01</span>Evidence</a>
      <a href="#case-failure"><span>02</span>Failure</a>
      <a href="#case-diagnosis"><span>03</span>Diagnosis</a>
      <a href="#case-repair"><span>04</span>Repair</a>
      <a href="#case-learning"><span>05</span>Learning</a>
      <a href="#case-provenance"><span>06</span>Provenance</a>
    </nav>

    <div className="vigil-case-sections">
      <Section id="case-evidence" number="01" title="Evidence" description="What happened and what the external sources actually establish.">
        {observations.length > 0 ? observations.map((record) => <article key={record.id} className="vigil-case-record"><div className="vigil-case-record-heading"><span>{record.id}</span><h3>{record.title}</h3></div><p>{record.publicDisplay.observation?.observed ?? record.publicDisplay.finding ?? record.summary}</p>{record.evidence_confidence && <VigilStatusChip value={record.evidence_confidence} prefix="Evidence" />}</article>) : <p className="vigil-case-empty">No separate observation or research record is linked; evidence may be embedded in the failure-mode record.</p>}
        {externalSources.length > 0 && <div className="vigil-case-source-preview">{externalSources.map((source, index) => <article key={`${source.title}-${source.url}-${index}`}><span>[{index + 1}]</span><div><strong>{source.title}</strong>{(source.publisher || source.date) && <p>{[source.publisher, source.date].filter(Boolean).join(" · ")}</p>}{source.description && <p>{source.description}</p>}</div></article>)}</div>}
      </Section>

      <Section id="case-failure" number="02" title="Failure" description="The repeatable failure pattern VIGIL identified from the evidence.">
        {failures.length > 0 ? failures.map((record) => <article key={record.id} className="vigil-case-record"><div className="vigil-case-record-heading"><span>{record.id}</span><h3>{record.title}</h3></div><p>{record.publicDisplay.failure?.definition ?? record.publicDisplay.finding ?? record.summary}</p><div className="vigil-case-record-status"><VigilStatusChip value={record.severity} /><VigilStatusChip value={record.evidence_confidence} prefix="Evidence" /></div><Link href={`/observatory/failure-modes/${encodeURIComponent(record.id)}`}>Open failure mode →</Link></article>) : <p className="vigil-case-empty">No failure mode is linked yet.</p>}
      </Section>

      <Section id="case-diagnosis" number="03" title="Diagnosis" description="The governance weakness, proposed response and decision pathway.">
        {proposals.length > 0 ? proposals.map((record) => <article key={record.id} className="vigil-case-record"><div className="vigil-case-record-heading"><span>{record.id}</span><h3>{record.title}</h3></div><p>{record.publicDisplay.proposal?.problem ?? record.publicDisplay.finding ?? record.summary}</p>{record.publicDisplay.proposal?.proposedOutcome && <div className="vigil-case-callout"><strong>Proposed outcome</strong><p>{record.publicDisplay.proposal.proposedOutcome}</p></div>}</article>) : <p className="vigil-case-empty">No proposal is linked yet. The case may still be in diagnosis or monitoring.</p>}
      </Section>

      <Section id="case-repair" number="04" title="Repair" description="What governance response was implemented or relied upon, and the corpus state against which it was verified.">
        {patches.length > 0 ? patches.map((record) => <article key={record.id} className="vigil-case-record vigil-case-repair-record"><div className="vigil-case-record-heading"><span>{record.id}</span><h3>{record.title}</h3></div><p>{record.publicDisplay.patch?.repairSummary ?? record.publicDisplay.finding ?? record.summary}</p>{record.publicDisplay.corpusProvisions.length > 0 && <div className="vigil-case-provision-list">{record.publicDisplay.corpusProvisions.map((provision, index) => <div key={`${provision.instrumentId}-${provision.section}-${index}`}><strong>{[provision.instrumentId, provision.section].filter(Boolean).join(" · ")}</strong>{provision.heading && <span>{provision.heading}</span>}{provision.relationship && <p>{provision.relationship}</p>}</div>)}</div>}<ImplementationProvenance record={record} /></article>) : <p className="vigil-case-empty">No PATCH is linked yet. A repair may still be in development.</p>}
      </Section>

      <Section id="case-learning" number="05" title="Learning" description="Durable, bounded governance knowledge preserved after the evidence-to-repair chain.">
        {state.learns.length > 0 ? state.learns.map((learn) => <article key={learn.id} className="vigil-case-record"><div className="vigil-case-record-heading"><span>{learn.id}</span><h3>{learn.title}</h3></div><p>{learn.abstractedLearning ?? learn.summary}</p>{learn.whatHappened.length > 0 && <ol>{learn.whatHappened.map((item) => <li key={item}>{item}</li>)}</ol>}<Link href={`/observatory/knowledge-base/${encodeURIComponent(learn.id)}`}>Open governance lesson →</Link></article>) : <p className="vigil-case-empty">No published LEARN record is linked. The case remains useful while learning closure is incomplete.</p>}
      </Section>

      <Section id="case-provenance" number="06" title="Provenance" description="External evidence citations and VIGIL record provenance are kept separate from corpus implementation provenance.">
        {externalSources.length > 0 && <div className="vigil-case-citations"><h3>External evidence sources</h3><ol>{externalSources.map((source, index) => <li key={`${source.title}-${source.url}-${index}`}><span>[{index + 1}]</span><div><strong>{source.title}</strong>{(source.publisher || source.date) && <p>{[source.publisher, source.date].filter(Boolean).join(" · ")}</p>}{source.url && <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>}</div></li>)}</ol></div>}
        <div className="vigil-record-provenance"><h3>VIGIL record provenance</h3><div>{state.records.map((record) => <article key={record.id}><span>{record.id}</span><strong>{record.title}</strong>{recordLink(record) && <a href={recordLink(record)} target="_blank" rel="noreferrer">Canonical record <ExternalLink aria-hidden="true" /></a>}</article>)}{state.learns.map((learn) => <article key={learn.id}><span>{learn.id}</span><strong>{learn.title}</strong>{learn.githubUrl && <a href={learn.githubUrl} target="_blank" rel="noreferrer">Canonical record <ExternalLink aria-hidden="true" /></a>}</article>)}</div></div>
      </Section>
    </div>
  </div></main></Shell>;
}
