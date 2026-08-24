import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Library, Network } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { loadVigilRegistryRecords } from "@/lib/vigilRegistry";
import { loadExternalRequirements, loadExternalSources } from "@/lib/vigilExternalKnowledge";

type HubState = {
  lessons?: number;
  clauses?: number;
  sources?: number;
  clausesAvailable?: boolean;
  sourcesAvailable?: boolean;
};

function isLearnRecord(record: Record<string, unknown>) {
  const id = String(record.id ?? record.record_id ?? "");
  const type = String(record.record_type ?? "").toLowerCase();
  return /^VIGIL-\d{4}-LEARN-\d{4}$/i.test(id) || type === "learn";
}

function CollectionCard({ href, icon, title, description, status, beta = false, actionLabel = "Browse collection" }: { href?: string; icon: React.ReactNode; title: string; description: string; status: string; beta?: boolean; actionLabel?: string }) {
  return (
    <article className="vigil-knowledge-collection">
      <div className="vigil-knowledge-icon" aria-hidden="true">{icon}</div>
      <div className="vigil-knowledge-copy">
        <div className="vigil-development-kicker-row">
          <p className="vigil-library-kicker">{status}</p>
          {beta ? <span className="cam-beta-chip">Beta</span> : null}
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
        {href ? <div className="vigil-knowledge-actions">
          <Link href={href}>{actionLabel} <ArrowRight aria-hidden="true" /></Link>
        </div> : null}
      </div>
    </article>
  );
}

export default function VigilKnowledgeHub() {
  const [state, setState] = useState<HubState>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadVigilRegistryRecords(), loadExternalRequirements(), loadExternalSources()])
      .then(([registry, clauses, sources]) => {
        if (cancelled) return;
        setState({
          lessons: registry.records.filter((record) => isLearnRecord(record)).length,
          clauses: clauses.status === "ready" ? clauses.data.length : undefined,
          sources: sources.status === "ready"
            ? new Set(sources.data.map((source) => source.external_source_id || source.vigil_source_id)).size
            : undefined,
          clausesAvailable: clauses.status === "ready",
          sourcesAvailable: sources.status === "ready",
        });
      })
      .catch(() => !cancelled && setState({}));
    return () => { cancelled = true; };
  }, []);

  const baselineStatus = state.sourcesAvailable
    ? `${state.sources ?? 0} AI-governance sources${state.clausesAvailable ? ` · ${(state.clauses ?? 0).toLocaleString()} clauses` : ""}`
    : "Dataset unavailable";

  return (
    <Shell>
      <VigilObservatoryNav />
      <main className="vigil-knowledge-hub-page">
        <div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
          <header className="vigil-simple-hero">
            <p className="vigil-library-kicker">VIGIL public knowledge</p>
            <h1>Knowledge Base</h1>
            <p>Browse reusable governance lessons, the curated AI Governance Standards Baseline and the evolving VIGIL governance failure taxonomy.</p>
          </header>

          <section className="vigil-knowledge-grid" aria-label="Knowledge Base collections">
            <CollectionCard
              href="/observatory/lessons"
              icon={<BookOpen />}
              title="Governance Lessons"
              description="Published LEARN records showing what happened, the governance misconception, the bounded lesson and how it should inform future decisions."
              status={state.lessons === undefined ? "Published learning records" : `${state.lessons} published learning records`}
            />
            <CollectionCard
              href="/observatory/knowledge-base/standards-sources"
              icon={<Library />}
              title="AI Governance Standards Baseline"
              description="A curated reference set of laws, standards, frameworks and technical guidance selected because each source contributes to a specific AI-governance question. Browse the sources, then open the clauses represented from each one."
              status={baselineStatus}
              beta
              actionLabel="Browse sources & clauses"
            />
            <CollectionCard
              icon={<Network />}
              title="Governance Failure Taxonomy"
              description="Internally developed interpretive standard for classifying recurring AI runtime and governance failure mechanisms. The taxonomy is in public beta while its dedicated browsing surface continues to develop."
              status="Internal standard"
              beta
            />
          </section>
        </div>
      </main>
    </Shell>
  );
}