import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { loadVigilRegistryRecords } from "@/lib/vigilRegistry";
import { loadExternalRequirements, loadExternalSources } from "@/lib/vigilExternalKnowledge";
import { loadFailureTaxonomyIndex } from "@/lib/vigilFailureTaxonomy";

type HubState = {
  caseFiles?: number;
  clauses?: number;
  sources?: number;
  clausesAvailable?: boolean;
  sourcesAvailable?: boolean;
  taxonomyFamilies?: number;
  taxonomyClasses?: number;
  taxonomyAvailable?: boolean;
};

function isFailureModeRecord(record: Record<string, unknown>) {
  const id = String(record.id ?? record.record_id ?? "");
  const type = String(record.record_type ?? "").toLowerCase();
  return /^VIGIL-\d{4}-FM-\d{4}$/i.test(id) || type === "failure_mode";
}

function CollectionCard({
  href,
  title,
  subtitle,
  description,
  meta,
  chip,
  actionLabel = "Browse collection",
}: {
  href?: string;
  title: string;
  subtitle?: string;
  description: string;
  meta: string;
  chip?: string;
  actionLabel?: string;
}) {
  return (
    <article className="vigil-knowledge-collection">
      <div className="vigil-knowledge-copy">
        <div className="vigil-knowledge-title-row">
          <h2>{title}</h2>
          {chip ? <span className="cam-beta-chip">{chip}</span> : null}
        </div>
        {subtitle ? <p className="mt-1 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{subtitle}</p> : null}
        <p>{description}</p>
        <div className="vigil-knowledge-card-footer">
          <p className="vigil-knowledge-meta">{meta}</p>
          {href ? <div className="vigil-knowledge-actions">
            <Link href={href}>{actionLabel} <ArrowRight aria-hidden="true" /></Link>
          </div> : null}
        </div>
      </div>
    </article>
  );
}

export default function VigilKnowledgeHub() {
  const [state, setState] = useState<HubState>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadVigilRegistryRecords(), loadExternalRequirements(), loadExternalSources(), loadFailureTaxonomyIndex()])
      .then(([registry, clauses, sources, taxonomy]) => {
        if (cancelled) return;
        setState({
          caseFiles: registry.records.filter((record) => isFailureModeRecord(record)).length,
          clauses: clauses.status === "ready" ? clauses.data.length : undefined,
          sources: sources.status === "ready"
            ? new Set(sources.data.map((source) => source.external_source_id || source.vigil_source_id)).size
            : undefined,
          clausesAvailable: clauses.status === "ready",
          sourcesAvailable: sources.status === "ready",
          taxonomyFamilies: taxonomy.status === "ready" ? taxonomy.data.families.length : undefined,
          taxonomyClasses: taxonomy.status === "ready" ? taxonomy.data.families.reduce((sum, family) => sum + family.class_count, 0) : undefined,
          taxonomyAvailable: taxonomy.status === "ready",
        });
      })
      .catch(() => !cancelled && setState({}));
    return () => { cancelled = true; };
  }, []);

  const baselineMeta = state.sourcesAvailable
    ? `${state.sources ?? 0} sources${state.clausesAvailable ? ` · ${(state.clauses ?? 0).toLocaleString()} clauses` : ""}`
    : "Dataset unavailable";

  const caseFilesMeta = state.caseFiles === undefined
    ? "AI failure mode investigations"
    : `${state.caseFiles} case ${state.caseFiles === 1 ? "file" : "files"}`;

  const taxonomyMeta = state.taxonomyAvailable
    ? `${state.taxonomyFamilies ?? 0} families · ${state.taxonomyClasses ?? 0} failure classes`
    : "Internal standard";

  return (
    <Shell>
      <VigilObservatoryNav />
      <main className="vigil-knowledge-hub-page">
        <div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
          <header className="vigil-simple-hero">
            <p className="vigil-library-kicker">VIGIL Observatory</p>
            <h1>Knowledge Base</h1>
            <p>Browse AI governance standards, documented VIGIL Case Files, the governance failure taxonomy, policy materials, and the CAELESTIS Architecture Model as it returns from refactoring.</p>
          </header>

          <section className="vigil-knowledge-grid" aria-label="Knowledge Base collections">
            <CollectionCard
              href="/observatory/knowledge-base/standards-sources"
              title="AI Governance Standards"
              subtitle="Compliance Baseline"
              description="A curated reference set of laws, standards, frameworks and technical guidance selected because each source contributes to a specific AI-governance question. Browse the sources, then open the clauses represented from each one."
              meta={baselineMeta}
              chip="Beta"
              actionLabel="Browse sources & clauses"
            />
            <CollectionCard
              href="/observatory/cases"
              title="Case Files"
              description="Documented AI failure-mode investigations organised through Observation, Diagnosis, Classification, Repair, Learn and References, with record-local evidence and traceable governance repair."
              meta={caseFilesMeta}
              actionLabel="Browse case files"
            />
            <CollectionCard
              href="/observatory/knowledge-base/failure-taxonomy"
              title="Governance Failure Taxonomy"
              description="A structured reference for recurring AI governance failure mechanisms, organised into failure families and classes with recognition criteria, exclusions, examples and relationships."
              meta={taxonomyMeta}
              chip="Beta"
              actionLabel="Browse taxonomy"
            />
            <CollectionCard
              href="/observatory/knowledge-base/policy"
              title="Policy"
              description="CAM Initiative policy papers, submissions and public-interest governance proposals translating evidence and governance analysis into practical institutional and regulatory recommendations."
              meta="Public policy papers and submissions"
              actionLabel="Browse policy"
            />
            <CollectionCard
              title="CAELESTIS Architecture Model"
              description="The public architecture reference is undergoing a substantive refactor. It will return here when the structure, source material and presentation are ready for publication."
              meta="Coming Soon"
              chip="Refactoring"
            />
          </section>
        </div>
      </main>
    </Shell>
  );
}
