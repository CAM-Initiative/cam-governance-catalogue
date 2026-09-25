import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";
import {
  downloadExternalGovernanceDataset,
  loadExternalRequirements,
  loadExternalSources,
} from "@/lib/vigilExternalKnowledge";
import { loadVigilIncidentRecords, VIGIL_INCIDENT_REGISTRY_URL } from "@/lib/vigilRegistry";
import { loadFailureTaxonomyIndex } from "@/lib/vigilFailureTaxonomy";

const VIGIL_TAXONOMY_PDF_NAME = "VIGIL-Alignment-Taxonomy-Full-Reference.pdf";
const VIGIL_TAXONOMY_PDF_URLS = [
  "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/taxonomy/generated/VIGIL.Observatory.AlignmentTaxonomy.FullReference.pdf",
  "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/taxonomy/generated/VIGIL.Observatory.FailureTaxonomy.FullReference.pdf",
];
const VIGIL_HARM_IMPACT_MATRIX_JSON = "https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/methodologies/VIGIL.HarmImpactMatrix.v1.0.0.json";

type DatasetState = {
  caseFilesCount?: number;
  sourcesCount?: number;
  clausesCount?: number;
  taxonomyVersion?: string;
  taxonomyPublicationDate?: string;
  loaded: boolean;
};

const datasetRail = [
  { href: "#case-files", label: "Case Files" },
  { href: "#harm-impact", label: "Harm Impact Matrix" },
  { href: "#taxonomy", label: "Alignment Taxonomy" },
  { href: "#standards", label: "AI Governance Standards" },
  { href: "#caelestis", label: "CAELESTIS archive" },
];

function DatasetSection({
  id,
  eyebrow,
  title,
  description,
  status,
  beta = false,
  onDownload,
  downloadHref,
  downloadLabel = "Download dataset",
  downloading,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  beta?: boolean;
  onDownload?: () => void;
  downloadHref?: string;
  downloadLabel?: string;
  downloading?: boolean;
}) {
  return <section id={id} className="document-section vigil-about-section vigil-dataset-section" aria-labelledby={`${id}-heading`}>
    <div className="document-section-heading">
      <p>{eyebrow}</p>
      <h2 id={`${id}-heading`}>{title}</h2>
    </div>
    <div className="document-reading">
      <p>{description}</p>
      <p className="vigil-dataset-status"><strong>{status}</strong>{beta ? <span className="cam-beta-chip">Beta</span> : null}</p>
    </div>
    <div className="cam-action-row">
      {onDownload ? <button type="button" className="cam-action cam-action-secondary" onClick={onDownload} disabled={downloading}>
        {downloading ? "Preparing download…" : downloadLabel}<Download aria-hidden="true" />
      </button> : null}
      {!onDownload && downloadHref ? <a className="cam-action cam-action-secondary" href={downloadHref} target="_blank" rel="noreferrer">
        {downloadLabel}<Download aria-hidden="true" />
      </a> : null}
    </div>
  </section>;
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
      loadFailureTaxonomyIndex(),
    ]).then(([incidents, sources, clauses, taxonomy]) => {
      if (cancelled) return;
      setState({
        loaded: true,
        caseFilesCount: incidents?.records.length,
        sourcesCount: sources.status === "ready"
          ? new Set(sources.data.map((source) => source.external_source_id || source.vigil_source_id)).size
          : undefined,
        clausesCount: clauses.status === "ready" ? clauses.data.length : undefined,
        taxonomyVersion: taxonomy.status === "ready" ? taxonomy.data.standard.version : undefined,
        taxonomyPublicationDate: taxonomy.status === "ready" ? taxonomy.data.standard.publication_date ?? undefined : undefined,
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

  const taxonomyStatus = state.taxonomyVersion
    ? `Version ${state.taxonomyVersion}${state.taxonomyPublicationDate ? ` · ${new Date(`${state.taxonomyPublicationDate}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}` : ""}`
    : "Technical reference";

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
    <main className="vigil-about-page vigil-datasets-page home-menu-page document-page">
      <header id="overview" className="vigil-taxonomy-header vigil-taxonomy-ticket vigil-datasets-ticket">
            <div className="vigil-taxonomy-ticket-title">
              <p className="vigil-library-kicker">CAM Initiative</p>
              <h1>Datasets</h1>
              <p className="vigil-library-description">Downloadable governance reference datasets and archival releases maintained by the CAM Initiative. Access and download do not imply unrestricted reuse; see <a href="/licensing/">Copyright &amp; Licence</a> for the applicable terms.</p>
            </div>
            <aside className="vigil-taxonomy-ticket-meta" aria-label="Dataset collection context">
              <p className="vigil-case-context-label">Collection context</p>
              <dl>
                <div><dt>Status</dt><dd>Beta</dd></div>
                <div><dt>Public resources</dt><dd>5</dd></div>
                <div><dt>Formats</dt><dd>JSON · PDF · Archive</dd></div>
                <div><dt>Maintainer</dt><dd>CAM Initiative</dd></div>
              </dl>
            </aside>
      </header>

      <div className="document-layout document-layout--wide document-layout-below-header">
        <DocumentRail title="Datasets" items={datasetRail} ariaLabel="CAM Initiative dataset sections" />

        <article className="document-content vigil-datasets-document">
          <DatasetSection
            id="case-files"
            eyebrow="VIGIL Observatory"
            title="Case Files"
            description="The canonical machine-readable Incident index behind the public VIGIL Observatory Case Files, including current incident metadata and pointers to the individual Incident records maintained in VIGIL Observatory."
            status={caseFilesStatus}
            downloadHref={VIGIL_INCIDENT_REGISTRY_URL}
            downloadLabel="Open JSON index"
          />

          <DatasetSection
            id="harm-impact"
            eyebrow="VIGIL Observatory"
            title="Harm Impact Matrix"
            description="The machine-readable VIGIL-HIM 1.0.0 methodology used to assess materialised harm across 11 dimensions and derive the overall S1–S5 or SU severity result for Case Files. It includes the evidence states, band definitions, threshold IDs and criteria represented on the public Harm Impact Assessment page."
            status="VIGIL-HIM 1.0.0 · 11 harm dimensions"
            downloadHref={VIGIL_HARM_IMPACT_MATRIX_JSON}
            downloadLabel="Open JSON matrix"
          />

          <DatasetSection
            id="taxonomy"
            eyebrow="VIGIL Observatory"
            title="Alignment Taxonomy"
            description="Generated full-reference PDF for the canonical VIGIL Observatory Alignment Taxonomy, including the stable Fidelity Families and Fidelity Classes used to classify evidence against governing invariants, their recognition criteria, exclusions, relationships and linked classifications."
            status={taxonomyStatus}
            beta
            onDownload={downloadTaxonomyPublication}
            downloading={taxonomyDownloadState === "working"}
            downloadLabel="Download PDF reference"
          />
          {taxonomyDownloadState === "error" ? <p className="vigil-baseline-download-error">The taxonomy reference PDF could not be downloaded. Please try again.</p> : null}

          <DatasetSection
            id="standards"
            eyebrow="Knowledge Base"
            title="AI Governance Standards"
            description="The machine-readable version of the curated AI-governance standards library: the selected source register plus the clause-level records represented from those sources."
            status={standardsStatus}
            beta
            onDownload={downloadDataset}
            downloading={downloadState === "working"}
          />
          {downloadState === "error" ? <p className="vigil-baseline-download-error">The complete dataset could not be downloaded. Please try again.</p> : null}

          <DatasetSection
            id="caelestis"
            eyebrow="CAELESTIS Architecture Model"
            title="Constitutional AI Runtime Safety Framework"
            description="Archived public release of the CAELESTIS Architecture Model governance corpus. The current downloadable release is version 1.1.0, preserved through Zenodo with a persistent DOI."
            status="Version 1.1.0 · Zenodo"
            downloadHref="https://doi.org/10.5281/zenodo.20686316"
            downloadLabel="Open Zenodo archive"
          />
        </article>
      </div>
    </main>
  </Shell>;
}
