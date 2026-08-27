import { useEffect, useState } from "react";
import { Download, Library } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import {
  downloadExternalGovernanceDataset,
  loadExternalRequirements,
  loadExternalSources,
} from "@/lib/vigilExternalKnowledge";

const VIGIL_TAXONOMY_HTML = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/taxonomy/generated/VIGIL.FailureTaxonomy.FullReference.html";

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
  onDownload,
  downloadHref,
  downloadLabel = "Download dataset",
  downloading,
  icon,
}: {
  title: string;
  description: string;
  status: string;
  beta?: boolean;
  onDownload?: () => void;
  downloadHref?: string;
  downloadLabel?: string;
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
          {downloading ? "Preparing dataset…" : downloadLabel}<Download aria-hidden="true" />
        </button> : null}
        {!onDownload && downloadHref ? <a className="vigil-baseline-download shrink-0" href={downloadHref} target="_blank" rel="noreferrer">
          {downloadLabel}<Download aria-hidden="true" />
        </a> : null}
      </div>
      <p>{description}</p>
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
    <main className="vigil-knowledge-hub-page vigil-datasets-page">
      <div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
        <header className="vigil-simple-hero">
          <div className="vigil-development-kicker-row">
            <p className="vigil-library-kicker">VIGIL Observatory</p>
            <span className="cam-development-status">Beta datasets · active development</span>
          </div>
          <h1>Datasets</h1>
          <p>Downloadable governance reference datasets and archival releases maintained by the CAM Initiative.</p>
        </header>

        <section className="vigil-knowledge-grid vigil-dataset-grid" aria-label="Available public datasets">
          <DatasetCard
            title="AI Governance Standards"
            description="The machine-readable version of the curated AI-governance standards library: the selected source register plus the clause-level records represented from those sources."
            status={status}
            beta
            onDownload={downloadDataset}
            downloading={downloadState === "working"}
            icon={<Library />}
          />
          {downloadState === "error" ? <p className="vigil-baseline-download-error">The complete dataset could not be downloaded. Please try again.</p> : null}

          <DatasetCard
            title="VIGIL AI Governance Failure Taxonomy"
            description="Human-readable generated reference for the canonical VIGIL failure taxonomy, including current failure families, failure classes, recognition criteria, exclusions, relationships and linked Case File classifications. The canonical machine-readable taxonomy remains maintained in VIGIL."
            status="Generated reference · VIGIL"
            beta
            downloadHref={VIGIL_TAXONOMY_HTML}
            downloadLabel="Download HTML reference"
            icon={<Library />}
          />

          <DatasetCard
            title="CAELESTIS Architecture Model"
            description="Archived public release of the CAELESTIS Architecture Model governance corpus. The current downloadable release is version 1.1.0, preserved through Zenodo with a persistent DOI."
            status="Version 1.1.0 · Zenodo"
            downloadHref="https://doi.org/10.5281/zenodo.20686316"
            downloadLabel="Open Zenodo archive"
            icon={<Library />}
          />
        </section>
      </div>
    </main>
  </Shell>;
}
