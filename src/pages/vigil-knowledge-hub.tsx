import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Library, Scale } from "lucide-react";
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

function CollectionCard({ href, icon, title, description, status }: { href: string; icon: ReactNode; title: string; description: string; status: string }) {
  return (
    <article className="vigil-knowledge-collection">
      <div className="vigil-knowledge-icon" aria-hidden="true">{icon}</div>
      <div className="vigil-knowledge-copy">
        <p className="vigil-library-kicker">{status}</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <Link href={href}>Browse collection <ArrowRight aria-hidden="true" /></Link>
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

  return (
    <Shell>
      <VigilObservatoryNav />
      <main className="vigil-knowledge-hub-page">
        <div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
          <header className="vigil-simple-hero">
            <p className="vigil-library-kicker">VIGIL accumulated knowledge</p>
            <h1>Knowledge Base</h1>
            <p>Search durable governance lessons and authoritative external reference material without collapsing their different evidentiary roles or record classes.</p>
          </header>

          <section className="vigil-knowledge-grid" aria-label="Knowledge Base collections">
            <CollectionCard
              href="/observatory/knowledge-base/governance-lessons"
              icon={<BookOpen />}
              title="Governance Lessons"
              description="Published LEARN records: what happened, the governance misconception, the bounded lesson and how it should inform future decisions."
              status={state.lessons === undefined ? "Published LEARN records" : `${state.lessons} published learning records`}
            />
            <CollectionCard
              href="/observatory/knowledge-base/external-requirements"
              icon={<Scale />}
              title="External Requirements"
              description="Requirement-level reference data extracted from authoritative AI-governance laws, frameworks and technical specifications."
              status={state.requirementsAvailable ? `${state.requirements ?? 0} canonical requirements` : "Awaiting canonical VIGIL publication"}
            />
            <CollectionCard
              href="/observatory/knowledge-base/standards-sources"
              icon={<Library />}
              title="Standards & Sources"
              description="The authoritative source/version register used to monitor external governance instruments, publisher identifiers and lifecycle state."
              status={state.sourcesAvailable ? `${state.sources ?? 0} registered source versions` : "Canonical source register unavailable"}
            />
          </section>

          <aside className="vigil-knowledge-boundary">
            <strong>Why these remain separate:</strong> LEARN is a VIGIL learning record class. External requirements are maintained reference data. Standards & Sources records source identity and version provenance. The public Knowledge Base brings them together for discovery without turning them into the same kind of record.
          </aside>
        </div>
      </main>
    </Shell>
  );
}
