import { useEffect, useState } from "react";
import { Download, Library } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import {
  downloadExternalGovernanceDataset,
  loadExternalRequirements,
  loadExternalSources,
} from "@/lib/vigilExternalKnowledge";
import { loadVigilIncidentRecords, VIGIL_INCIDENT_REGISTRY_URL } from "@/lib/vigilRegistry";

const VIGIL_TAXONOMY_PDF_NAME = "VIGIL-Observatory-AI-Governance-Failure-Taxonomy-Full-Reference.pdf";
const VIGIL_TAXONOMY_PDF_URLS = [
  "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/taxonomy/generated/VIGIL.Observatory.FailureTaxonomy.FullReference.pdf",
  // Working-branch fallback keeps catalogue previews testable until the canonical VIGIL publication commit is merged.
  "https://raw.githubusercontent.com/CAM-Initiative/Vigil/agent/hugging-face-authority-reconciliation/vigil/taxonomy/generated/VIGIL.Observatory.FailureTaxonomy.FullReference.pdf",
];

type DatasetState = {
  caseFilesCount?: number;
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
          {downloading ? "Preparing download…" : downloadLabel}<Download aria-hidden="true" />
        </button> : null}
        {!onDownload && downloadHref ? <a className="vigil-baseline-download shrink-0" href={downloadHref} target="_blank" rel="noreferrer">
          {downloadLabel}<Download aria-hidden="true" />
        </a> : null}
      </div>
      <p>{description}</p>
    </div>
  </article>;
}

async function downloadRemoteFile(urls: string[], filename: string) {
  let lastError: unknown;
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Download returned HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob.size) throw new Error("Downloaded publication was empty");
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("The publication could not be downloaded");
}

export default function Datasets() {
  const [state, setState] = useState<DatasetState>({ loaded: false });
  const [downloadState, setDownloadState] = useState<"idle" | "working" | "error">("idle");
  const [taxonomyDownloadState, setTaxonomyDownloadState] = useState<"idle" | "working" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadVigilIncidentRecords().catch(() => undefined),
      loadExternalSources(),
      loadExternalRequirements(),
    ]).then(([incidents, sources, clauses]) => {
      if (cancelled) return;
      setState({
        loaded: true,
        caseFilesCount: incidents?.records.length,
        sourcesCount: sources.status === "ready"
          ? new Set(sources.data.map((source) => source.external_source_id || source.vigil_source_id)).size
          : undefined,
        clausesCount: clauses.status === "ready" ? clauses.data.length : undefined,
      });
    });
    return () => { cancelled = true; };
  }, []);

  const caseFilesStatus = !state.loaded
    ? "Loading dataset"
    : state.caseFilesCount === undefined
      ? "Dataset unavailable"
      : `${state.caseFilesCount.toLocaleString()} Case Files`;

  const standardsStatus = !state.loaded
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

  async function downloadTaxonomyPublication() {
    setTaxonomyDownloadState("working");
    try {
      await downloadRemoteFile(VIGIL_TAXONOMY_PDF_URLS, VIGIL_TAXONOMY_PDF_NAME);
      setTaxonomyDownloadState("idle");
    } catch {
      setTaxonomyDownloadState("error");
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
            title="VIGIL Observatory Case Files"
            description="The canonical machine-readable Incident index behind the public VIGIL Case Files, including current incident metadata and pointers to the individual Incident records maintained in VIGIL."
            status={caseFilesStatus}
            beta
            downloadHref={VIGIL_INCIDENT_REGISTRY_URL}
            downloadLabel="Open JSON index"
            icon={<Library />}
          />

          <DatasetCard
            title="AI Governance Standards"
            description="The machine-readable version of the curated AI-governance standards library: the selected source register plus the clause-level records represented from those sources."
            status={standardsStatus}
            beta
            onDownload={downloadDataset}
            downloading={downloadState === "working"}
            icon={<Library />}
          />
          {downloadState === "error" ? <p className="vigil-baseline-download-error">The complete dataset could not be downloaded. Please try again.</p> : null}

          <DatasetCard
            title="VIGIL Observatory AI Governance Failure Taxonomy"
            description="Generated full-reference PDF for the canonical VIGIL Observatory failure taxonomy, including current failure families, failure classes, recognition criteria, exclusions, relationships and linked Case File classifications. The canonical machine-readable taxonomy remains maintained in VIGIL."
            status="Technical reference · VIGIL Observatory"
            beta
            onDownload={downloadTaxonomyPublication}
            downloading={taxonomyDownloadState === "working"}
            downloadLabel="Download PDF reference"
            icon={<Library />}
          />
          {taxonomyDownloadState === "error" ? <p className="vigil-baseline-download-error">The taxonomy reference PDF could not be downloaded. Please try again.</p> : null}

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
