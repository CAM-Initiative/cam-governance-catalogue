import { useEffect, useState } from "react";
import { ArrowRight, Download, Library, Scale } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { loadExternalRequirements, loadExternalSources } from "@/lib/vigilExternalKnowledge";

type DatasetState = {
  sourcesCount?: number;
  sourcesUrl?: string;
  requirementsCount?: number;
  requirementsUrl?: string;
  loaded: boolean;
};

function DatasetCard({
  title,
  description,
  status,
  browseHref,
  browseLabel,
  downloadHref,
  icon,
}: {
  title: string;
  description: string;
  status: string;
  browseHref: string;
  browseLabel: string;
  downloadHref?: string;
  icon: React.ReactNode;
}) {
  return <article className="vigil-knowledge-collection">
    <div className="vigil-knowledge-icon" aria-hidden="true">{icon}</div>
    <div className="vigil-knowledge-copy">
      <p className="vigil-library-kicker">{status}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="vigil-knowledge-actions">
        <Link href={browseHref}>{browseLabel}<ArrowRight aria-hidden="true" /></Link>
        {downloadHref ? <a href={downloadHref} target="_blank" rel="noreferrer" download>Download JSON<Download aria-hidden="true" /></a> : null}
      </div>
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
        requirementsUrl: requirements.status === "ready" ? requirements.attemptedUrl : undefined,
      });
    });
    return () => { cancelled = true; };
  }, []);

  return <Shell>
    <main className="vigil-knowledge-hub-page">
      <div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
        <header className="vigil-simple-hero">
          <p className="vigil-library-kicker">VIGIL public data</p>
          <h1>Datasets</h1>
          <p>Download the machine-readable forms of the same external governance reference collections available through the VIGIL Knowledge Base.</p>
        </header>

        <section className="vigil-knowledge-grid vigil-dataset-grid" aria-label="Available public datasets">
          <DatasetCard
            title="Standards & Sources"
            description="Registered laws, standards, frameworks and technical sources with publisher identity, identifier, jurisdiction, source class, version and lifecycle state."
            status={!state.loaded ? "Loading dataset" : state.sourcesCount === undefined ? "Dataset unavailable" : `${state.sourcesCount} published source versions`}
            browseHref="/observatory/knowledge-base/standards-sources"
            browseLabel="Browse collection"
            downloadHref={state.sourcesUrl}
            icon={<Library />}
          />
          <DatasetCard
            title="External Requirements"
            description="Clause- and control-level governance requirements preserving requirement posture, authority type, applicable actors and governance concepts."
            status={!state.loaded ? "Loading dataset" : state.requirementsCount === undefined ? "Dataset unavailable" : `${state.requirementsCount.toLocaleString()} published requirements`}
            browseHref="/observatory/knowledge-base/external-requirements"
            browseLabel="Browse collection"
            downloadHref={state.requirementsUrl}
            icon={<Scale />}
          />
        </section>
      </div>
    </main>
  </Shell>;
}