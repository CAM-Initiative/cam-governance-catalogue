import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";

type UnknownRecord = Record<string, unknown>;

type VigilIndexRecord = {
  id: string;
  record_type: string;
  status: string;
  date_recorded: string;
  affected_domains?: string[];
  affected_instruments?: string[];
  candidate_amendment_id?: string;
  path?: string;
  summary: string;
  evidence_confidence?: string;
  source_types?: string[];
};

const preferredStatuses = [
  "open",
  "watching",
  "clustered",
  "routed",
  "deferred",
  "closed-no-action",
  "closed-actioned",
];

const preferredRecordTypes = [
  "emerging-tech-signal",
  "failure-mode-observation",
  "proposal-development-expansion",
  "cluster",
];

const sourceRecordBaseUrl = "https://github.com/CAM-Initiative/Vigil/blob/main/";
const exportNotice = "Filtered VIGIL index export from the CAM Interface. Canonical records remain in CAM-Initiative/VIGIL.";

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function textFrom(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (Array.isArray(value)) {
    const values = value.map((item) => textFrom(item)).filter(Boolean);
    return values.length ? values.join("; ") : undefined;
  }
  if (isObject(value)) {
    const values = Object.entries(value)
      .map(([key, item]) => {
        const text = textFrom(item);
        return text ? `${key}: ${text}` : undefined;
      })
      .filter(Boolean);
    return values.length ? values.join("; ") : undefined;
  }
  return String(value);
}

function getOptionalField(record: UnknownRecord, names: string[]): string | undefined {
  for (const name of names) {
    const value = textFrom(record[name]);
    if (value) return value;
  }
  return undefined;
}

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase() === "proposal" ? "open" : status.trim();
}

function stringArrayFrom(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map((item) => textFrom(item)?.trim()).filter((item): item is string => Boolean(item));
  return values.length ? values : undefined;
}

function normalizeIndexRecord(record: UnknownRecord, index: number): VigilIndexRecord {
  return {
    id: getOptionalField(record, ["id", "record_id", "recordId", "ID"]) ?? `VIGIL-${index + 1}`,
    record_type: getOptionalField(record, ["record_type", "recordType", "type", "category"]) ?? "unclassified",
    status: normalizeStatus(getOptionalField(record, ["status", "state"]) ?? "unclassified"),
    date_recorded: getOptionalField(record, ["date_recorded", "dateRecorded", "recorded_date", "recordedDate", "date"]) ?? "Date not recorded",
    affected_domains: stringArrayFrom(record.affected_domains ?? record.affectedDomains),
    affected_instruments: stringArrayFrom(record.affected_instruments ?? record.affectedInstruments),
    candidate_amendment_id: getOptionalField(record, ["candidate_amendment_id", "candidateAmendmentId"]),
    path: getOptionalField(record, ["path"]),
    summary: getOptionalField(record, ["summary", "title", "description", "observation", "signal"]) ?? "Summary not provided.",
    evidence_confidence: getOptionalField(record, ["evidence_confidence", "evidenceConfidence"]),
    source_types: stringArrayFrom(record.source_types ?? record.sourceTypes),
  };
}

function normalizeRecords(data: unknown): VigilIndexRecord[] {
  const items = Array.isArray(data)
    ? data
    : isObject(data) && Array.isArray(data.records)
      ? data.records
      : isObject(data) && Array.isArray(data.items)
        ? data.items
        : [];

  return items.map((item, index) => normalizeIndexRecord(isObject(item) ? item : { summary: item }, index));
}

function uniqueWithPreferred(values: string[], preferred: string[] = []) {
  const present = new Set(values.filter(Boolean));
  return [...preferred.filter((value) => present.has(value)), ...[...present].filter((value) => !preferred.includes(value)).sort()];
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function RecordListField({ label, values }: { label: string; values?: string[] }) {
  if (!values?.length) return null;

  return <Field label={label} value={values.join("; ")} />;
}

function sourceRecordUrl(path: string) {
  return `${sourceRecordBaseUrl}${path}`;
}

function exportFileName(status: string) {
  const date = new Date().toISOString().slice(0, 10);
  const statusPart = (status || "all").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  return `vigil-current-view-${statusPart}-${date}.json`;
}

export default function Vigil() {
  const [records, setRecords] = useState<VigilIndexRecord[]>([]);
  const [status, setStatus] = useState("open");
  const [recordType, setRecordType] = useState("");
  const [domain, setDomain] = useState("");
  const [evidenceConfidence, setEvidenceConfidence] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [search, setSearch] = useState("");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}vigil/VIGIL.Records.Index.json`)
      .then((response) => {
        if (response.status === 404) {
          return [];
        }
        if (!response.ok) {
          throw new Error(`Unable to load VIGIL records (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        setRecords(normalizeRecords(data));
        setLoadState("ready");
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
        setRecords([]);
        setLoadState("error");
      });
  }, []);

  const statusOptions = useMemo(() => uniqueWithPreferred(records.map((record) => record.status), preferredStatuses), [records]);
  const typeOptions = useMemo(() => uniqueWithPreferred(records.map((record) => record.record_type), preferredRecordTypes), [records]);
  const domainOptions = useMemo(
    () => uniqueWithPreferred(records.flatMap((record) => record.affected_domains ?? [])),
    [records],
  );
  const evidenceOptions = useMemo(
    () => uniqueWithPreferred(records.map((record) => record.evidence_confidence ?? "")),
    [records],
  );
  const sourceTypeOptions = useMemo(
    () => uniqueWithPreferred(records.flatMap((record) => record.source_types ?? [])),
    [records],
  );

  const filters = useMemo(
    () => ({
      status,
      record_type: recordType,
      affected_domain: domain,
      evidence_confidence: evidenceConfidence,
      source_type: sourceType,
      search,
    }),
    [domain, evidenceConfidence, recordType, search, sourceType, status],
  );

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        const searchText = [
          record.id,
          record.status,
          record.record_type,
          record.date_recorded,
          record.summary,
          record.candidate_amendment_id,
          record.path,
          record.evidence_confidence,
          ...(record.affected_domains ?? []),
          ...(record.affected_instruments ?? []),
          ...(record.source_types ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const searchOk = !search.trim() || searchText.includes(search.trim().toLowerCase());
        const statusOk = !status || record.status === status;
        const typeOk = !recordType || record.record_type === recordType;
        const domainOk = !domain || record.affected_domains?.includes(domain);
        const evidenceOk = !evidenceConfidence || record.evidence_confidence === evidenceConfidence;
        const sourceTypeOk = !sourceType || record.source_types?.includes(sourceType);
        return statusOk && typeOk && domainOk && evidenceOk && sourceTypeOk && searchOk;
      }),
    [domain, evidenceConfidence, recordType, records, search, sourceType, status],
  );

  function exportCurrentView() {
    const payload = {
      export_notice: exportNotice,
      exported_at_utc: new Date().toISOString(),
      source: "VIGIL.Records.Index.json",
      filters,
      record_count: filtered.length,
      records: filtered,
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName(status);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell>
      <div className="container mx-auto max-w-6xl px-6 py-10 md:px-10">
        <div className="mb-6">
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">
            AI Governance Observatory
          </p>
          <h1 className="mb-3 font-serif text-4xl text-foreground">VIGIL — Digital Ecosystem Health Register</h1>
          <p className="max-w-4xl text-base leading-relaxed text-muted-foreground">
            VIGIL is CAM’s public AI governance observatory and digital ecosystem health register. It records emerging governance issues, failure-mode observations, unresolved questions, clusters, and development proposals across the digital ecosystem. It preserves what has been observed, why it may matter, how it is being classified, and what review pathway may follow.
          </p>
        </div>

        <details className="cam-parchment-card mb-6 rounded-2xl p-4 shadow-sm">
          <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">About VIGIL</summary>
          <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">
            <p>
              VIGIL is a public observatory and routing layer for digital ecosystem health signals. It allows observations to be logged, searched, clustered, deferred, routed, actioned, or closed.
            </p>
            <p>
              VIGIL does not create binding CAM doctrine, amend adopted instruments, determine liability, or verify final factual truth. It preserves observations, source context, confidence state, CAM relevance, clustering relationships, and next actions for later review under CAM governance processes.
            </p>
            <p>
              Multiple observations may form one cluster. A cluster may later become one proposal, one candidate amendment, one taxonomy expansion, or no action after review.
            </p>
          </div>
        </details>

        <div className="cam-parchment-card mb-6 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <select
              aria-label="Filter by status"
              className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {statusOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              aria-label="Filter by record type"
              className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={recordType}
              onChange={(event) => setRecordType(event.target.value)}
            >
              <option value="">All record types</option>
              {typeOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              aria-label="Filter by affected domain"
              className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
            >
              <option value="">All affected domains</option>
              {domainOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              aria-label="Filter by evidence confidence"
              className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={evidenceConfidence}
              onChange={(event) => setEvidenceConfidence(event.target.value)}
            >
              <option value="">All evidence confidence values</option>
              {evidenceOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              aria-label="Filter by source type"
              className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value)}
            >
              <option value="">All source types</option>
              {sourceTypeOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <input
              aria-label="Search VIGIL records"
              className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records"
            />
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
                Showing {filtered.length} of {records.length} records
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Exports the filtered index view. Canonical records remain in the VIGIL repository.
              </p>
            </div>
            <button
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={exportCurrentView}
              disabled={loadState !== "ready" || filtered.length === 0}
            >
              Export current view
            </button>
          </div>
        </div>

        {loadState === "loading" && (
          <div className="cam-parchment-card rounded-2xl p-6 text-base text-muted-foreground shadow-sm">Loading VIGIL records…</div>
        )}

        {loadState === "error" && (
          <div className="cam-parchment-card rounded-2xl p-6 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-700">Records unavailable</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              VIGIL records could not be loaded from <code>vigil/VIGIL.Records.Index.json</code>. {errorMessage}
            </p>
          </div>
        )}

        {loadState === "ready" && records.length === 0 && (
          <div className="cam-parchment-card rounded-2xl p-6 text-base text-muted-foreground shadow-sm">
            No VIGIL records are currently published in <code>vigil/VIGIL.Records.Index.json</code>.
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((record, index) => (
            <article key={`${record.id}-${index}`} className="cam-parchment-card rounded-2xl p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="font-mono text-sm text-cam-gold">{record.id}</h2>
                  <p className="mt-1 font-serif text-xl text-foreground">{record.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <span className="rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{record.status}</span>
                  <span className="rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{record.record_type}</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Date recorded" value={record.date_recorded} />
                <RecordListField label="Affected domains" values={record.affected_domains} />
                <RecordListField label="Affected instruments" values={record.affected_instruments} />
                <Field label="Candidate amendment ID" value={record.candidate_amendment_id} />
                <Field label="Evidence confidence" value={record.evidence_confidence} />
                <RecordListField label="Source types" values={record.source_types} />
              </div>

              {record.path && (
                <div className="mt-5 flex flex-col gap-2 rounded-xl border border-border bg-background/40 p-4 md:flex-row md:items-center md:justify-between">
                  <p className="break-words font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    Source record: {record.path}
                  </p>
                  <a
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background/80"
                    href={sourceRecordUrl(record.path)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open source record →
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}
