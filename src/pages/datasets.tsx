import { useEffect, useState } from "react";
import { ArrowRight, Download, Library } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import {
  downloadExternalGovernanceDataset,
  loadExternalRequirements,
  loadExternalSources,
} from "@/lib/vigilExternalKnowledge";

type DatasetState = {
  sourcesCount?: number;
  clausesCount?: number;
  loaded: boolean;
};

function DatasetCard({
  title,
  description,
  status,
  beta = false,
  browseHref,
  browseLabel,
  onDownload,
  downloading,
  icon,
}: {
  title: string;
  description: string;
  status: string;
  beta?: boolean;
  browseHref?: string;
  browseLabel?: string;
  onDownload?: () => void;
  downloading?: boolean;
  icon: React.ReactNode;
}) {
  return <article className="vigil-knowledge-collection vigil-dataset-collection-wide">
    <div className="vigil-knowledge-icon" aria-hidden="true">{icon}</div>
    <div className="vigil-knowledge-copy">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="vigil-development-kicker-row">
            <p className="vigil-library-kicker">{status}</p>
            {beta ? <span className="cam-beta-chip">Beta</span> : null}
          </div>
          <h2>{title}</h2>
        </div>
        {onDownload ? <button type="button" className="vigil-baseline-download shrink-0" onClick={onDownload} disabled={downloading}>
          {downloading ? "Preparing dataset…" : "Download dataset"}<Download aria-hidden="true" />
        </button> : null}
      </div>
      <p>{description}</p>
      {browseHref && browseLabel ? <div className="vigil-knowledge-actions">
        <Link href={browseHref}>{browseLabel}<ArrowRight aria-hidden="true" /></Link>
      </div> : null}
    </div>
  </article>;
}

export default function Datasets() {
  const [state, setState] = useState<DatasetState>({ loaded: false });
  const [downloadState, setDownloadState] = useState<"idle" | "working" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadExternalSources(), loadExternalRequirements()]).then(([sources, clauses]) => {
      if (cancelled) return;
      setState({
        loaded: true,
        sourcesCount: sources.status === "ready"
          ? new Set(sources.data.map((source) => source.external_source_id || source.vigil_source_id)).size
          : undefined,
        clausesCount: clauses.status === "ready" ? clauses.data.length : undefined,
      });
    });
    return () => { cancelled = true; };
  }, []);

  const status = !state.loaded
    ? "Loading dataset"
    : state.sourcesCount === undefined
      ? "Dataset unavailable"
      : `${state.sourcesCount} AI-governance sources${state.clausesCount === undefined ? "" : ` · ${state.clausesCount.toLocaleString()} clauses`}`;

  async function downloadDataset() {
    setDownloadState("working");
    try {
      await downloadExternalGovernanceDataset();
      setDownloadState("idle");
    } catch {
      setDownloadState("error");
    }
  }

  return <Shell>
    <main className="vigil-knowledge-hub-page">
      <div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
        <header className="vigil-simple-hero">
          <div className="vigil-development-kicker-row">
            <p className="vigil-library-kicker">VIGIL public data</p>
            <span className="cam-development-status">Beta datasets · active development</span>
          </div>
          <h1>Datasets</h1>
          <p>Machine-readable files behind VIGIL's AI Governance Standards Baseline. One download provides the source register and the full clause records that sit underneath those sources.</p>
        </header>

        <section className="vigil-knowledge-grid vigil-dataset-grid" aria-label="Available public datasets">
          <DatasetCard
            title="AI Governance Standards Baseline"
            description="The machine-readable version of the curated AI-governance standards library: the selected source register plus the clause-level records represented from those sources. The source register preserves why each authority is in scope; the clause records preserve what each source says in structured form."
            status={status}
            beta
            browseHref="/observatory/knowledge-base/standards-sources"
            browseLabel="Browse sources & clauses"
            onDownload={downloadDataset}
            downloading={downloadState === "working"}
            icon={<Library />}
          />
          {downloadState === "error" ? <p className="vigil-baseline-download-error">The complete dataset could not be downloaded. Please try again.</p> : null}
        </section>
      </div>
    </main>
  </Shell>;
}