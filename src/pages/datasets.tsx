import { useEffect, useState } from "react";
import { ArrowRight, Database, Download, Library, Scale } from "lucide-react";
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
}: {
  title: string;
  description: string;
  status: string;
  browseHref: string;
  browseLabel: string;
  downloadHref?: string;
}) {
  return <article className="cam-parchment-card flex h-full flex-col rounded-2xl border border-cam-gold/30 p-6 shadow-sm">
    <div className="flex items-start gap-4">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cam-gold/35 bg-background text-cam-gold" aria-hidden="true"><Database className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold">{status}</p>
        <h2 className="mt-2 font-serif text-2xl leading-tight text-foreground">{title}</h2>
      </div>
    </div>
    <p className="mt-4 flex-1 text-[17px] leading-relaxed text-muted-foreground">{description}</p>
    <div className="mt-5 flex flex-wrap gap-3 border-t border-border/70 pt-4">
      <Link href={browseHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cam-gold/35 bg-background px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-cam-gold transition hover:bg-secondary">
        {browseLabel}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
      {downloadHref ? <a href={downloadHref} target="_blank" rel="noreferrer" download className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cam-gold/35 bg-background px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-cam-gold transition hover:bg-secondary">
        Download JSON<Download className="h-3.5 w-3.5" aria-hidden="true" />
      </a> : null}
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
    <main className="bg-background">
      <section className="border-b border-border/70">
        <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-cam-gold">CAM Initiative public data</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground md:text-5xl">Datasets</h1>
          <p className="mt-5 max-w-4xl text-lg leading-relaxed text-muted-foreground">
            Download and inspect machine-readable public governance reference data maintained through VIGIL. These datasets preserve external source identity and requirement semantics; inclusion does not assert CAM applicability, compliance, conformance, alignment or adoption.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14" aria-label="Available public datasets">
        <div className="grid gap-5 md:grid-cols-2">
          <DatasetCard
            title="External Governance Sources"
            description="Registered laws, standards, frameworks and technical sources with publisher identity, canonical identifier, jurisdiction, source class, version and lifecycle state."
            status={!state.loaded ? "Loading canonical VIGIL data" : state.sourcesCount === undefined ? "Canonical dataset unavailable" : `${state.sourcesCount} published source versions`}
            browseHref="/observatory/knowledge-base/standards-sources"
            browseLabel="Browse standards & sources"
            downloadHref={state.sourcesUrl}
          />
          <DatasetCard
            title="External AI-Governance Requirements"
            description="Clause and control-level requirement records preserving requirement posture, normative force, applicable actors, governance concepts and downstream claim vocabulary."
            status={!state.loaded ? "Loading canonical VIGIL data" : state.requirementsCount === undefined ? "Awaiting publication to VIGIL main" : `${state.requirementsCount.toLocaleString()} published requirements`}
            browseHref="/observatory/knowledge-base/external-requirements"
            browseLabel="Browse requirements"
            downloadHref={state.requirementsUrl}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-border/80 bg-card/35 p-5 text-base leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-3"><Library className="mt-0.5 h-5 w-5 shrink-0 text-cam-gold" aria-hidden="true" /><p><strong className="text-foreground">Publication boundary.</strong> The website consumes canonical VIGIL <code>main</code>. Active working-branch material is not silently promoted into the public dataset before it is merged and published.</p></div>
          <div className="mt-4 flex items-start gap-3"><Scale className="mt-0.5 h-5 w-5 shrink-0 text-cam-gold" aria-hidden="true" /><p><strong className="text-foreground">Authority boundary.</strong> Requirement posture and normative force describe the external source. They do not determine whether an instrument applies to CAM or whether CAM satisfies it.</p></div>
        </div>
      </section>
    </main>
  </Shell>;
}
