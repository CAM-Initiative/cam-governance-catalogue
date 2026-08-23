import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Library, Network, Scale } from "lucide-react";
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

function CollectionCard({ href, icon, title, description, status, actionLabel = "Browse collection" }: { href?: string; icon: React.ReactNode; title: string; description: string; status: string; actionLabel?: string }) {
  return (
    <article className="vigil-knowledge-collection">
      <div className="vigil-knowledge-icon" aria-hidden="true">{icon}</div>
      <div className="vigil-knowledge-copy">
        <p className="vigil-library-kicker">{status}</p>
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

  return (
    <Shell>
      <VigilObservatoryNav />
      <main className="vigil-knowledge-hub-page">
        <div className="container mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
          <header className="vigil-simple-hero">
            <p className="vigil-library-kicker">VIGIL public knowledge</p>
            <h1>Knowledge Base</h1>
            <p>Browse reusable governance lessons, external governance reference collections and the evolving VIGIL governance failure taxonomy.</p>
          </header>

          <section className="vigil-knowledge-grid" aria-label="Knowledge Base collections">
            <CollectionCard
              href="/observatory/lessons"
              icon={<BookOpen />}
              title="Governance Lessons"
              description="Published LEARN records: what happened, the governance misconception, the bounded lesson and how it should inform future decisions."
              status={state.lessons === undefined ? "Published learning records" : `${state.lessons} published learning records`}
            />
            <CollectionCard
              href="/observatory/knowledge-base/external-requirements"
              icon={<Scale />}
              title="External Requirements"
              description="Clause- and control-level governance requirements preserving requirement posture, authority type, applicable actors and governance concepts."
              status={state.requirementsAvailable ? `Beta · ${state.requirements ?? 0} published requirements` : "Beta · dataset unavailable"}
            />
            <CollectionCard
              href="/observatory/knowledge-base/standards-sources"
              icon={<Library />}
              title="Standards & Sources"
              description="Registered laws, standards, frameworks and technical sources with publisher identity, identifier, jurisdiction, source class, version and lifecycle state."
              status={state.sourcesAvailable ? `${state.sources ?? 0} published source versions` : "Dataset unavailable"}
            />
            <CollectionCard
              icon={<Network />}
              title="Governance Failure Taxonomy"
              description="Internally developed interpretive standard for classifying AI runtime and governance failure mechanisms. The taxonomy is in public beta while its machine-readable projection and dedicated browsing surface continue to develop."
              status="Internal standard · beta"
            />
          </section>
        </div>
      </main>
    </Shell>
  );
}