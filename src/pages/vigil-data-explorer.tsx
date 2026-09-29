import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Database, Search } from "lucide-react";
import { Link } from "wouter";
import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryMasthead } from "@/components/vigil/VigilObservatoryMasthead";
import { VIGIL_MASTHEAD_ARTWORK } from "@/lib/vigilMastheadArtwork";
import {
  HARM_DIMENSIONS,
  explorerCoverage,
  explorerIncident,
  harmDimensionsFromRecord,
  incidentMatchesClass,
  mappingRoleLabel,
  severityDistribution,
  summarizeClasses,
  type ExplorerIncident,
  type ExplorerMappingRole,
} from "@/lib/vigilDataExplorer";
import { loadFailureTaxonomy } from "@/lib/vigilFailureTaxonomy";
import { loadVigilIncidentRecords, loadVigilRecordDetail, type UnknownRecord } from "@/lib/vigilRegistry";
import { normalizeRecords } from "@/lib/vigilPresentation";

type ExplorerState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; incidents: ExplorerIncident[]; registryFallback: boolean };

type HarmState =
  | { status: "idle"; records: Map<string, UnknownRecord> }
  | { status: "loading"; records: Map<string, UnknownRecord>; loaded: number; total: number; failed: number }
  | { status: "ready"; records: Map<string, UnknownRecord>; loaded: number; total: number; failed: number }
  | { status: "error"; records: Map<string, UnknownRecord>; message: string; total: number };

type ClassLabel = {
  name: string;
  familyId?: string;
  familyName?: string;
};

const explorerRail = [
  { href: "#coverage", label: "Corpus coverage" },
  { href: "#taxonomy-evidence", label: "Taxonomy evidence" },
  { href: "#selected-class", label: "Selected class" },
  { href: "#harm-profile", label: "Harm profile" },
];

const detailCache = new Map<string, Promise<UnknownRecord>>();

function loadDetailCached(incident: ExplorerIncident) {
  const cached = detailCache.get(incident.id);
  if (cached) return cached;
  const pending = loadVigilRecordDetail(incident.record.raw);
  detailCache.set(incident.id, pending);
  pending.catch(() => detailCache.delete(incident.id));
  return pending;
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function compactClassId(classId: string) {
  return classId.replace(/^VIGIL-/, "");
}

function severityRank(value?: string) {
  const match = value?.match(/^S([1-5])$/);
  return match ? Number(match[1]) : 0;
}

export default function VigilDataExplorer() {
  const [state, setState] = useState<ExplorerState>({ status: "loading" });
  const [labels, setLabels] = useState<Map<string, ClassLabel>>(new Map());
  const [familyLabels, setFamilyLabels] = useState<Map<string, string>>(new Map());
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<"all" | ExplorerMappingRole>("all");
  const [familyFilter, setFamilyFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"evidence" | "failure" | "held">("evidence");
  const [harmState, setHarmState] = useState<HarmState>({ status: "idle", records: new Map() });

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      loadVigilIncidentRecords(),
      loadFailureTaxonomy(),
    ]).then(([registry, taxonomy]) => {
      if (cancelled) return;
      const incidents = normalizeRecords(registry.data).map(explorerIncident);
      setState({ status: "ready", incidents, registryFallback: registry.loadedFromFallback });

      if (taxonomy.status === "ready") {
        const nextLabels = new Map<string, ClassLabel>();
        const nextFamilyLabels = new Map<string, string>();
        for (const familyDocument of taxonomy.data.families) {
          const family = familyDocument.family;
          nextFamilyLabels.set(family.family_id, family.name);
          for (const item of familyDocument.classes) {
            nextLabels.set(item.class_id, {
              name: item.name,
              familyId: item.family_id,
              familyName: family.name,
            });
          }
        }
        setLabels(nextLabels);
        setFamilyLabels(nextFamilyLabels);
      }
    }).catch((error) => {
      if (!cancelled) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "The VIGIL dataset could not be loaded.",
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  const incidents = state.status === "ready" ? state.incidents : [];
  const coverage = useMemo(() => explorerCoverage(incidents), [incidents]);
  const classSummaries = useMemo(() => summarizeClasses(incidents), [incidents]);

  const classRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return classSummaries
      .map((summary) => {
        const label = labels.get(summary.classId);
        const familyId = summary.familyId ?? label?.familyId;
        const familyName = familyId ? familyLabels.get(familyId) ?? label?.familyName : undefined;
        return {
          ...summary,
          familyId,
          name: label?.name ?? compactClassId(summary.classId),
          familyName: familyName ?? familyId ?? "Family not resolved",
        };
      })
      .filter((row) => !familyFilter || row.familyId === familyFilter)
      .filter((row) => !query || [row.classId, row.name, row.familyName].join(" ").toLowerCase().includes(query))
      .sort((a, b) => {
        if (sortBy === "failure") return b.failure - a.failure || b.totalIncidents - a.totalIncidents;
        if (sortBy === "held") return b.held - a.held || b.totalIncidents - a.totalIncidents;
        return b.totalIncidents - a.totalIncidents || b.failure - a.failure;
      });
  }, [classSummaries, familyFilter, familyLabels, labels, search, sortBy]);

  const familyOptions = useMemo(() => {
    const ids = new Set(classSummaries.map((row) => row.familyId).filter((value): value is string => Boolean(value)));
    return [...ids]
      .map((familyId) => ({ familyId, label: familyLabels.get(familyId) ?? familyId }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [classSummaries, familyLabels]);

  const selectedSummary = classSummaries.find((row) => row.classId === selectedClassId);
  const selectedLabel = selectedClassId ? labels.get(selectedClassId) : undefined;
  const selectedFamilyId = selectedSummary?.familyId ?? selectedLabel?.familyId;
  const selectedFamilyName = selectedFamilyId ? familyLabels.get(selectedFamilyId) ?? selectedLabel?.familyName : undefined;

  const selectedIncidents = useMemo(() => {
    if (!selectedClassId) return [];
    return incidents
      .filter((incident) => incidentMatchesClass(incident, selectedClassId, roleFilter))
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || (b.occurredFrom ?? "").localeCompare(a.occurredFrom ?? ""));
  }, [incidents, roleFilter, selectedClassId]);

  const severityRows = useMemo(() => severityDistribution(selectedIncidents), [selectedIncidents]);

  useEffect(() => {
    if (!selectedClassId || !selectedIncidents.length) {
      setHarmState({ status: "idle", records: new Map() });
      return;
    }

    let cancelled = false;
    const total = selectedIncidents.length;
    setHarmState({ status: "loading", records: new Map(), loaded: 0, total, failed: 0 });

    void (async () => {
      const records = new Map<string, UnknownRecord>();
      let failed = 0;
      for (let offset = 0; offset < selectedIncidents.length; offset += 6) {
        const batch = selectedIncidents.slice(offset, offset + 6);
        const results = await Promise.allSettled(batch.map((incident) => loadDetailCached(incident)));
        if (cancelled) return;
        results.forEach((result, index) => {
          if (result.status === "fulfilled") records.set(batch[index].id, result.value);
          else failed += 1;
        });
        setHarmState({
          status: "loading",
          records: new Map(records),
          loaded: records.size,
          total,
          failed,
        });
      }

      if (cancelled) return;
      if (!records.size) {
        setHarmState({
          status: "error",
          records,
          total,
          message: "Detailed harm records could not be loaded for this selection.",
        });
        return;
      }
      setHarmState({
        status: "ready",
        records,
        loaded: records.size,
        total,
        failed,
      });
    })();

    return () => { cancelled = true; };
  }, [selectedClassId, selectedIncidents]);

  const harmRows = useMemo(() => {
    const detailRecords = [...harmState.records.values()];
    return HARM_DIMENSIONS.map(([dimensionId, label]) => {
      const counts = new Map<string, number>();
      let assessed = 0;
      let represented = 0;
      for (const record of detailRecords) {
        const observation = harmDimensionsFromRecord(record).find((item) => item.dimensionId === dimensionId);
        if (!observation) continue;
        represented += 1;
        if (observation.assessmentStatus === "assessed" && observation.severity) {
          assessed += 1;
          counts.set(observation.severity, (counts.get(observation.severity) ?? 0) + 1);
        }
      }
      return {
        dimensionId,
        label,
        assessed,
        represented,
        S1: counts.get("S1") ?? 0,
        S2: counts.get("S2") ?? 0,
        S3: counts.get("S3") ?? 0,
        S4: counts.get("S4") ?? 0,
        S5: counts.get("S5") ?? 0,
      };
    });
  }, [harmState.records]);

  const maxDirectionalCount = Math.max(1, ...classRows.flatMap((row) => [row.failure, row.held]));

  const coverageItems = [
    ["Incident chronology", coverage.chronology, "Occurrence date available"],
    ["Harm severity", coverage.severity, "Overall VIGIL-HIM severity available"],
    ["Taxonomy mapping", coverage.taxonomy, "At least one Fidelity Class mapping"],
    ["Environment", coverage.environment, "Structured occurrence environment"],
    ["Agent context", coverage.agentContext, "Structured agent metadata"],
    ["External assessment", coverage.externalAssessments, "At least one external assessment present"],
  ] as const;

  return <Shell>
    <main className="vigil-data-explorer-page document-page">
      <VigilObservatoryMasthead
        id="overview"
        titleId="data-explorer-heading"
        kicker="CAM Initiative · Datasets"
        title="VIGIL Data Explorer"
        description="An experimental analytical view of the VIGIL corpus. Explore what the structured data can support, where evidence is concentrated, and where coverage is still incomplete."
        contextLabel="Explorer context"
        mode="collection"
        visual="datasets"
        artworkSrc={VIGIL_MASTHEAD_ARTWORK.datasets}
        metadata={[
          { label: "Status", value: "Experimental" },
          { label: "Case Files", value: state.status === "ready" ? incidents.length : "—" },
          { label: "Observed classes", value: state.status === "ready" ? classSummaries.length : "—" },
          { label: "Registry", value: state.status === "ready" && state.registryFallback ? "Cached publication" : "Live VIGIL" },
        ]}
      />

      <div className="document-layout document-layout--wide document-layout-below-header">
        <DocumentRail title="Data Explorer" items={explorerRail} ariaLabel="VIGIL Data Explorer sections" />

        <article className="document-content vigil-explorer-document">
          {state.status === "error" ? <section className="vigil-explorer-state is-error">
            <h2>Explorer unavailable</h2>
            <p>{state.message}</p>
          </section> : null}

          <section id="coverage" className="vigil-explorer-section" aria-labelledby="coverage-heading">
            <header className="vigil-explorer-section-heading">
              <div>
                <p className="vigil-explorer-eyebrow">01 · Corpus coverage</p>
                <h2 id="coverage-heading">What can the dataset support?</h2>
              </div>
              <p>Coverage is shown explicitly so incomplete fields do not silently become analytical claims.</p>
            </header>

            <div className="vigil-explorer-coverage-grid">
              {coverageItems.map(([label, count, note]) => <article key={label}>
                <div className="vigil-explorer-coverage-value">
                  <strong>{state.status === "ready" ? percent(count, coverage.total) : "—"}%</strong>
                  <span>{state.status === "ready" ? `${count} / ${coverage.total}` : "Loading"}</span>
                </div>
                <div>
                  <h3>{label}</h3>
                  <p>{note}</p>
                  <div className="vigil-explorer-coverage-track" aria-hidden="true">
                    <span style={{ width: `${state.status === "ready" ? percent(count, coverage.total) : 0}%` }} />
                  </div>
                </div>
              </article>)}
            </div>
            <p className="vigil-explorer-method-note"><strong>Reading the coverage:</strong> some fields are optional by design. “External assessment” measures presence, not a completeness target. Missing harm dimensions are not treated as zero harm.</p>
          </section>

          <section id="taxonomy-evidence" className="vigil-explorer-section" aria-labelledby="taxonomy-evidence-heading">
            <header className="vigil-explorer-section-heading">
              <div>
                <p className="vigil-explorer-eyebrow">02 · Taxonomy evidence</p>
                <h2 id="taxonomy-evidence-heading">Where do invariants fail — and where do they hold?</h2>
              </div>
              <p>Each row counts distinct Case Files mapped to a Fidelity Class. Failure and invariant-held evidence are deliberately separated.</p>
            </header>

            <div className="vigil-explorer-controls">
              <label>
                <span>Search classes</span>
                <div className="vigil-explorer-search">
                  <Search aria-hidden="true" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Class, family or ID" />
                </div>
              </label>
              <label>
                <span>Fidelity Family</span>
                <select value={familyFilter} onChange={(event) => setFamilyFilter(event.target.value)}>
                  <option value="">All families</option>
                  {familyOptions.map((option) => <option key={option.familyId} value={option.familyId}>{option.label}</option>)}
                </select>
              </label>
              <label>
                <span>Sort</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
                  <option value="evidence">Most mapped Case Files</option>
                  <option value="failure">Most failure occurrences</option>
                  <option value="held">Most invariant-held occurrences</option>
                </select>
              </label>
            </div>

            <div className="vigil-explorer-legend" aria-label="Taxonomy evidence legend">
              <span><i className="is-failure" />Failure occurrence</span>
              <span><i className="is-held" />Invariant held</span>
              <span>Boundary/unresolved counts remain visible as text.</span>
            </div>

            <div className="vigil-explorer-class-list">
              <div className="vigil-explorer-class-head" aria-hidden="true">
                <span>Fidelity Class</span>
                <span>Failure</span>
                <span>Invariant held</span>
              </div>
              {classRows.map((row) => <button
                type="button"
                key={row.classId}
                className={`vigil-explorer-class-row${selectedClassId === row.classId ? " is-selected" : ""}`}
                onClick={() => setSelectedClassId(row.classId)}
                aria-pressed={selectedClassId === row.classId}
              >
                <span className="vigil-explorer-class-copy">
                  <code>{compactClassId(row.classId)}</code>
                  <strong>{row.name}</strong>
                  <small>{row.familyName} · {row.totalIncidents} mapped Case {row.totalIncidents === 1 ? "File" : "Files"}{row.boundary ? ` · ${row.boundary} boundary` : ""}{row.unresolved ? ` · ${row.unresolved} unresolved` : ""}</small>
                </span>
                <span className="vigil-explorer-direction is-failure" aria-label={`${row.failure} failure occurrences`}>
                  <span className="vigil-explorer-direction-number">{row.failure}</span>
                  <span className="vigil-explorer-direction-track"><i style={{ width: `${(row.failure / maxDirectionalCount) * 100}%` }} /></span>
                </span>
                <span className="vigil-explorer-direction is-held" aria-label={`${row.held} invariant-held occurrences`}>
                  <span className="vigil-explorer-direction-track"><i style={{ width: `${(row.held / maxDirectionalCount) * 100}%` }} /></span>
                  <span className="vigil-explorer-direction-number">{row.held}</span>
                </span>
              </button>)}
              {state.status === "ready" && !classRows.length ? <p className="vigil-explorer-empty">No Fidelity Classes match the current filters.</p> : null}
            </div>
          </section>

          <section id="selected-class" className="vigil-explorer-section" aria-labelledby="selected-class-heading">
            <header className="vigil-explorer-section-heading">
              <div>
                <p className="vigil-explorer-eyebrow">03 · Selected class</p>
                <h2 id="selected-class-heading">{selectedClassId ? selectedLabel?.name ?? compactClassId(selectedClassId) : "Select a Fidelity Class"}</h2>
              </div>
              {selectedClassId ? <Link className="vigil-explorer-taxonomy-link" href={`/observatory/alignment-taxonomy/${encodeURIComponent(selectedClassId)}/`}>
                Open taxonomy entry <ArrowRight aria-hidden="true" />
              </Link> : null}
            </header>

            {selectedClassId ? <>
              <div className="vigil-explorer-selected-meta">
                <p><code>{selectedClassId}</code></p>
                <p>{selectedFamilyName ?? selectedFamilyId ?? "Family not resolved"}</p>
              </div>

              <div className="vigil-explorer-role-tabs" aria-label="Filter selected class evidence by adjudication role">
                {(["all", "failure-occurrence", "successful-invariant", "ambiguous-boundary"] as const).map((role) => <button
                  key={role}
                  type="button"
                  className={roleFilter === role ? "is-active" : ""}
                  onClick={() => setRoleFilter(role)}
                  aria-pressed={roleFilter === role}
                >
                  {mappingRoleLabel(role)}
                </button>)}
              </div>

              <div className="vigil-explorer-severity-block">
                <div>
                  <p className="vigil-explorer-eyebrow">Incident-level severity</p>
                  <h3>{selectedIncidents.length} matching Case {selectedIncidents.length === 1 ? "File" : "Files"}</h3>
                </div>
                <div className="vigil-explorer-severity-grid">
                  {severityRows.map((row) => <div key={row.severity}>
                    <span>{row.severity}</span>
                    <strong>{row.count}</strong>
                  </div>)}
                </div>
              </div>
            </> : <p className="vigil-explorer-empty">Choose a class above to inspect its Case Files, severity distribution and harm profile.</p>}
          </section>

          <section id="harm-profile" className="vigil-explorer-section" aria-labelledby="harm-profile-heading">
            <header className="vigil-explorer-section-heading">
              <div>
                <p className="vigil-explorer-eyebrow">04 · Harm profile</p>
                <h2 id="harm-profile-heading">What harm is observed in the same incidents?</h2>
              </div>
              <Activity aria-hidden="true" />
            </header>

            <div className="vigil-explorer-causality-note">
              <strong>Association, not attribution.</strong>
              <span>Harm is assessed at Incident level. This view shows harm recorded in Case Files where the selected Fidelity Class is mapped; it does not claim that the class caused that harm.</span>
            </div>

            {!selectedClassId ? <p className="vigil-explorer-empty">Select a Fidelity Class to load its Incident-level harm dimensions.</p> : null}
            {harmState.status === "loading" ? <p className="vigil-explorer-loading">Loading detailed harm assessments… {harmState.loaded} / {harmState.total}</p> : null}
            {harmState.status === "error" ? <p className="vigil-explorer-empty">{harmState.message}</p> : null}

            {harmState.records.size ? <div className="vigil-explorer-harm-table">
              <div className="vigil-explorer-harm-head" aria-hidden="true">
                <span>Harm dimension</span>
                <span>Assessed</span>
                <span>S1</span><span>S2</span><span>S3</span><span>S4</span><span>S5</span>
              </div>
              {harmRows.map((row) => <div className="vigil-explorer-harm-row" key={row.dimensionId}>
                <span>
                  <strong>{row.label}</strong>
                  <small>{row.assessed} of {harmState.records.size} loaded Case Files assessed</small>
                </span>
                <span className="vigil-explorer-assessed-count">{row.assessed}</span>
                {(["S1", "S2", "S3", "S4", "S5"] as const).map((band) => <span key={band} className={row[band] ? "has-value" : ""}>{row[band] || "—"}</span>)}
              </div>)}
            </div> : null}

            {harmState.status === "ready" && harmState.failed ? <p className="vigil-explorer-method-note">Detailed harm data loaded for {harmState.loaded} of {harmState.total} selected Case Files; {harmState.failed} detail request{harmState.failed === 1 ? "" : "s"} could not be loaded.</p> : null}
          </section>

          {selectedClassId ? <section className="vigil-explorer-section" aria-labelledby="matching-cases-heading">
            <header className="vigil-explorer-section-heading">
              <div>
                <p className="vigil-explorer-eyebrow">05 · Evidence drill-down</p>
                <h2 id="matching-cases-heading">Matching Case Files</h2>
              </div>
              <Database aria-hidden="true" />
            </header>
            <div className="vigil-explorer-case-list">
              {selectedIncidents.map((incident) => {
                const role = incident.mappings.find((mapping) => mapping.classId === selectedClassId)?.role ?? "unresolved";
                return <Link key={incident.id} href={`/observatory/cases/${encodeURIComponent(incident.id)}/`} className="vigil-explorer-case-row">
                  <span>
                    <code>{incident.id}</code>
                    <strong>{incident.title}</strong>
                    <small>{incident.vendor} · {mappingRoleLabel(role)}</small>
                  </span>
                  <span className="vigil-explorer-case-severity">{incident.severity ?? "SU"}</span>
                  <ArrowRight aria-hidden="true" />
                </Link>;
              })}
            </div>
          </section> : null}
        </article>
      </div>
    </main>
  </Shell>;
}
