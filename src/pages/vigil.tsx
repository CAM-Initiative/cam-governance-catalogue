import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";

type UnknownRecord = Record<string, unknown>;

type VigilRecord = {
  raw: UnknownRecord;
  id: string;
  summary: string;
  recordType: string;
  status: string;
  evidenceConfidence: string;
  dateRecorded: string;
  possibleCamMapping: string;
  nextAction: string;
  sources: UnknownRecord[];
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

const missingValue = "TODO";
const missingSourceValue = "Source details pending";

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function textFrom(value: unknown, fallback = missingValue): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) {
    const values = value.map((item) => textFrom(item, "")).filter(Boolean);
    return values.length ? values.join("; ") : fallback;
  }
  if (isObject(value)) {
    const values = Object.entries(value)
      .map(([key, item]) => `${key}: ${textFrom(item, "")}`)
      .filter((entry) => !entry.endsWith(": "));
    return values.length ? values.join("; ") : fallback;
  }
  return String(value);
}

function getField(record: UnknownRecord, names: string[], fallback = missingValue): string {
  for (const name of names) {
    if (record[name] !== undefined && record[name] !== null && record[name] !== "") {
      return textFrom(record[name], fallback);
    }
  }
  return fallback;
}

function getNestedSourceField(source: UnknownRecord, names: string[]): string {
  return getField(source, names, missingSourceValue);
}

function normalizeSources(record: UnknownRecord): UnknownRecord[] {
  const sourceValues = [
    record.sources,
    record.source_records,
    record.sourceRecords,
    record.source_context,
    record.sourceContext,
    record.source,
    record.evidence_sources,
    record.evidenceSources,
  ];

  for (const value of sourceValues) {
    if (Array.isArray(value)) {
      return value.map((item) => (isObject(item) ? item : { title: item })).filter(isObject);
    }
    if (isObject(value)) return [value];
    if (typeof value === "string" && value.trim()) return [{ title: value }];
  }

  return [];
}

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase() === "proposal" ? "open" : status;
}

function normalizeRecord(record: UnknownRecord, index: number): VigilRecord {
  return {
    raw: record,
    id: getField(record, ["id", "record_id", "recordId", "ID"], `VIGIL-${index + 1}`),
    summary: getField(record, ["summary", "title", "description", "observation", "signal"]),
    recordType: getField(record, ["record_type", "recordType", "type", "category"]),
    status: normalizeStatus(getField(record, ["status", "state"])),
    evidenceConfidence: getField(record, ["evidence_confidence", "evidenceConfidence", "confidence", "confidence_state"]),
    dateRecorded: getField(record, ["date_recorded", "dateRecorded", "recorded_date", "recordedDate", "date"]),
    possibleCamMapping: getField(record, ["possible_CAM_mapping", "possible_cam_mapping", "possibleCamMapping", "cam_mapping", "camMapping", "CAM_mapping"]),
    nextAction: getField(record, ["next_action", "nextAction", "action", "recommended_next_action"]),
    sources: normalizeSources(record),
  };
}

function normalizeRecords(data: unknown): VigilRecord[] {
  const items = Array.isArray(data)
    ? data
    : isObject(data) && Array.isArray(data.records)
      ? data.records
      : isObject(data) && Array.isArray(data.items)
        ? data.items
        : [];

  return items.map((item, index) => normalizeRecord(isObject(item) ? item : { summary: item }, index));
}

function uniqueWithPreferred(values: string[], preferred: string[]) {
  const present = new Set(values.filter(Boolean));
  return [...preferred.filter((value) => present.has(value)), ...[...present].filter((value) => !preferred.includes(value)).sort()];
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{value || missingValue}</p>
    </div>
  );
}

function SourceField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">{label}</p>
      {value.startsWith("http://") || value.startsWith("https://") ? (
        <a href={value} target="_blank" rel="noreferrer" className="mt-1 block break-words text-sm">
          {value}
        </a>
      ) : (
        <p className="mt-1 break-words text-sm text-foreground">{value || missingSourceValue}</p>
      )}
    </div>
  );
}

export default function Vigil() {
  const [records, setRecords] = useState<VigilRecord[]>([]);
  const [status, setStatus] = useState("open");
  const [recordType, setRecordType] = useState("");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}vigil/VIGIL.Records.json`)
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
  const typeOptions = useMemo(() => uniqueWithPreferred(records.map((record) => record.recordType), preferredRecordTypes), [records]);

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        const statusOk = !status || record.status === status;
        const typeOk = !recordType || record.recordType === recordType;
        return statusOk && typeOk;
      }),
    [records, recordType, status],
  );

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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select
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
              className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={recordType}
              onChange={(event) => setRecordType(event.target.value)}
            >
              <option value="">All record types</option>
              {typeOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
            Showing {filtered.length} of {records.length} records
          </p>
        </div>

        {loadState === "loading" && (
          <div className="cam-parchment-card rounded-2xl p-6 text-base text-muted-foreground shadow-sm">Loading VIGIL records…</div>
        )}

        {loadState === "error" && (
          <div className="cam-parchment-card rounded-2xl p-6 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-700">Records unavailable</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              VIGIL records could not be loaded from <code>vigil/VIGIL.Records.json</code>. {errorMessage}
            </p>
          </div>
        )}

        {loadState === "ready" && records.length === 0 && (
          <div className="cam-parchment-card rounded-2xl p-6 text-base text-muted-foreground shadow-sm">
            No VIGIL records are currently published in <code>vigil/VIGIL.Records.json</code>.
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
                  <span className="rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{record.recordType}</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Evidence confidence" value={record.evidenceConfidence} />
                <Field label="Date recorded" value={record.dateRecorded} />
                <Field label="Possible CAM mapping" value={record.possibleCamMapping} />
                <Field label="Next action" value={record.nextAction} />
              </div>

              <details className="mt-5 rounded-xl border border-border bg-background/40 p-4">
                <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.16em] text-cam-gold">
                  Source context ({record.sources.length || "details pending"})
                </summary>
                {record.sources.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {record.sources.map((source, sourceIndex) => (
                      <div key={sourceIndex} className="rounded-xl border border-border bg-card/70 p-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <SourceField label="Title" value={getNestedSourceField(source, ["title", "name", "headline"])} />
                          <SourceField label="Author or publisher" value={getNestedSourceField(source, ["author", "publisher", "author_or_publisher", "authorOrPublisher"])} />
                          <SourceField label="Source date" value={getNestedSourceField(source, ["source_date", "sourceDate", "date", "published_date", "publishedDate"])} />
                          <SourceField label="URL or retrieval path" value={getNestedSourceField(source, ["url", "URL", "retrieval_path", "retrievalPath", "path"])} />
                          <SourceField label="Retrieved date" value={getNestedSourceField(source, ["retrieved_date", "retrievedDate", "retrieval_date", "retrievalDate"])} />
                          <SourceField label="Relevance note" value={getNestedSourceField(source, ["relevance_note", "relevanceNote", "relevance", "note"])} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-border bg-card/70 p-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <SourceField label="Title" value={missingSourceValue} />
                      <SourceField label="Author or publisher" value={missingSourceValue} />
                      <SourceField label="Source date" value={missingSourceValue} />
                      <SourceField label="URL or retrieval path" value={missingSourceValue} />
                      <SourceField label="Retrieved date" value={missingSourceValue} />
                      <SourceField label="Relevance note" value={missingSourceValue} />
                    </div>
                  </div>
                )}
              </details>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}
