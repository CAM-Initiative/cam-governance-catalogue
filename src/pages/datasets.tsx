import { useEffect, useState } from "react";
import { ArrowRight, Download, Library } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import {
  VIGIL_EXTERNAL_REQUIREMENTS_FULL_URL,
  loadExternalRequirements,
  loadExternalSources,
} from "@/lib/vigilExternalKnowledge";

type DatasetState = {
  sourcesCount?: number;
  sourcesUrl?: string;
  requirementsCount?: number;
  loaded: boolean;
};

type DownloadAction = {
  href: string;
  label: string;
};

function DatasetCard({
  title,
  description,
  status,
  beta = false,
  browseHref,
  browseLabel,
  downloads = [],
  icon,
}: {
  title: string;
  description: string;
  status: string;
  beta?: boolean;
  browseHref?: string;
  browseLabel?: string;
  downloads?: DownloadAction[];
  icon: React.ReactNode;
}) {
  const hasActions = Boolean((browseHref && browseLabel) || downloads.length);

  return <article className="vigil-knowledge-collection vigil-dataset-collection-wide">
    <div className="vigil-knowledge-icon" aria-hidden="true">{icon}</div>
    <div className="vigil-knowledge-copy">
      <div className="vigil-development-kicker-row">
        <p className="vigil-library-kicker">{status}</p>
        {beta ? <span className="cam-beta-chip">Beta</span> : null}
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {hasActions ? <div className="vigil-knowledge-actions">
        {browseHref && browseLabel ? <Link href={browseHref}>{browseLabel}<ArrowRight aria-hidden="true" /></Link> : null}
        {downloads.map((download) => <a key={download.href} href={download.href} target="_blank" rel="noreferrer" download>{download.label}<Download aria-hidden="true" /></a>)}
      </div> : null}
    </div>
  </article>;
}

export default function Datasets() {
  const [state, setState] = useState<DatasetState>({ loaded: false });

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadExternalSources(), loadExternalRequirements()]).then(([sources, requirements]) => {
      if (cancelled) return;
      setState({
        loaded: true,
        sourcesCount: sources.status === "ready" ? sources.data.length : undefined,
        sourcesUrl: sources.status === "ready" ? sources.attemptedUrl : undefined,
        requirementsCount: requirements.status === "ready" ? requirements.data.length : undefined,
      });
    });
    return () => { cancelled = true; };
  }, []);

  const status = !state.loaded
    ? "Loading dataset"
    : state.sourcesCount === undefined
      ? "Dataset unavailable"
      : `${state.sourcesCount} source versions${state.requirementsCount === undefined ? "" : ` · ${state.requirementsCount.toLocaleString()} extracted requirements`}`;

  const downloads: DownloadAction[] = [
    ...(state.sourcesUrl ? [{ href: state.sourcesUrl, label: "Source register JSON" }] : []),
    { href: VIGIL_EXTERNAL_REQUIREMENTS_FULL_URL, label: "Full requirement records JSON" },
  ];

  return <Shell>
    <main className="vigil-knowledge-hub-page">
      <div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
        <header className="vigil-simple-hero">
          <div className="vigil-development-kicker-row">
            <p className="vigil-library-kicker">VIGIL public data</p>
            <span className="cam-development-status">Beta datasets · active development</span>
          </div>
          <h1>Datasets</h1>
          <p>Machine-readable public outputs behind VIGIL's external-governance reference baseline. The source register records which authorities are in scope; the requirement corpus records the clause- and control-level expectations extracted from those sources.</p>
        </header>

        <section className="vigil-knowledge-grid vigil-dataset-grid" aria-label="Available public datasets">
          <DatasetCard
            title="External Governance Baseline"
            description="A curated set of external authorities selected because they directly govern AI systems, provide bounded authority for material AI-governance questions, or supply necessary context. The downloadable source register and full requirement records preserve both the selection boundary and the requirements extracted from the selected sources."
            status={status}
            beta
            browseHref="/observatory/knowledge-base/standards-sources"
            browseLabel="Browse sources & requirements"
            downloads={downloads}
            icon={<Library />}
          />
        </section>
      </div>
    </main>
  </Shell>;
}
