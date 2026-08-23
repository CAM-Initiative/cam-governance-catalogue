import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Library, Network } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { loadVigilRegistryRecords } from "@/lib/vigilRegistry";
import { loadExternalRequirements, loadExternalSources } from "@/lib/vigilExternalKnowledge";

type HubState = {
  lessons?: number;
  requirements?: number;
  sources?: number;
  requirementsAvailable?: boolean;
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
      .then(([registry, requirements, sources]) => {
        if (cancelled) return;
        setState({
          lessons: registry.records.filter((record) => isLearnRecord(record)).length,
          requirements: requirements.status === "ready" ? requirements.data.length : undefined,
          sources: sources.status === "ready" ? sources.data.length : undefined,
          requirementsAvailable: requirements.status === "ready",
          sourcesAvailable: sources.status === "ready",
        });
      })
      .catch(() => !cancelled && setState({}));
    return () => { cancelled = true; };
  }, []);

  const baselineStatus = state.sourcesAvailable
    ? `${state.sources ?? 0} source versions${state.requirementsAvailable ? ` · ${(state.requirements ?? 0).toLocaleString()} extracted requirements` : ""}`
    : "Dataset unavailable";

  return (
    <Shell>
      <VigilObservatoryNav />
      <main className="vigil-knowledge-hub-page">
        <div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
          <header className="vigil-simple-hero">
            <p className="vigil-library-kicker">VIGIL public knowledge</p>
            <h1>Knowledge Base</h1>
            <p>Browse reusable governance lessons, the curated external-governance baseline and the evolving VIGIL governance failure taxonomy.</p>
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
              title="External Governance Baseline"
              description="A curated external-authority baseline selected for its relevance to AI-governance decisions. Sources are included where they directly govern AI systems, provide bounded authority for material governance questions, or supply necessary context; open each source to inspect the requirements extracted from it."
              status={baselineStatus}
              beta
              actionLabel="Browse sources & requirements"
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
