import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { loadVigilIncidentRecords } from "@/lib/vigilRegistry";
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

const knowledgeRail = [
  { href: "#overview", label: "Overview" },
  { href: "#standards", label: "AI Governance Standards" },
  { href: "#cases", label: "Case Files" },
  { href: "#taxonomy", label: "Alignment Taxonomy" },
  { href: "#harm-impact", label: "Harm Impact Assessment" },
  { href: "#datasets", label: "Datasets" },
  { href: "#policy", label: "Policy" },
  { href: "#architecture", label: "CAELESTIS Architecture Model" },
];

export default function VigilKnowledgeHub() {
  const [state, setState] = useState<HubState>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadVigilIncidentRecords(), loadExternalRequirements(), loadExternalSources(), loadFailureTaxonomyIndex()])
      .then(([incidents, clauses, sources, taxonomy]) => {
        if (cancelled) return;
        setState({
          caseFiles: incidents.records.length,
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
    ? `${state.sources ?? 0} sources${state.clausesAvailable ? ` · ${(state.clauses ?? 0).toLocaleString()} clauses represented` : ""}`
    : "Source and clause counts unavailable";

  const caseFilesMeta = state.caseFiles === undefined
    ? "AI Incident investigations"
    : `${state.caseFiles} case ${state.caseFiles === 1 ? "file" : "files"}`;

  const taxonomyMeta = state.taxonomyAvailable
    ? `${state.taxonomyFamilies ?? 0} families · ${state.taxonomyClasses ?? 0} fidelity classes`
    : "Taxonomy counts unavailable";

  return (
    <Shell>
      <VigilObservatoryNav />
      <main className="vigil-about-page vigil-knowledge-hub-page home-menu-page document-page">
        <div className="document-layout document-layout--wide">
          <DocumentRail title="Knowledge Base" items={knowledgeRail} ariaLabel="VIGIL Observatory Knowledge Base sections" />

          <article className="document-content vigil-knowledge-document">
            <header id="overview" className="document-hero">
              <p className="vigil-library-kicker">VIGIL Observatory</p>
              <h1>Knowledge Base</h1>
              <p>Reference material supporting the Observatory: AI governance standards, Case Files, the VIGIL Observatory Alignment Taxonomy, the Harm Impact Assessment methodology, public datasets and policy material.</p>
            </header>

            <section id="standards" className="document-section vigil-about-section" aria-labelledby="knowledge-standards-heading">
              <div className="document-section-heading">
                <p>AI Governance Standards <span className="cam-beta-chip">Beta</span></p>
                <h2 id="knowledge-standards-heading">Browse the external governance sources VIGIL uses as reference material.</h2>
              </div>
              <div className="document-reading">
                <p>A curated library of laws, standards, frameworks and technical guidance selected because each source contributes to a specific AI-governance question. Open a source to review its governance relevance, represented clauses and review provenance.</p>
                <p className="vigil-knowledge-meta">{baselineMeta}</p>
              </div>
              <div className="cam-action-row">
                <Link className="cam-action cam-action-secondary" href="/observatory/knowledge-base/standards-sources/">Browse AI Governance Standards <ArrowRight aria-hidden="true" /></Link>
              </div>
            </section>

            <section id="cases" className="document-section vigil-about-section" aria-labelledby="knowledge-cases-heading">
              <div className="document-section-heading">
                <p>Case Files</p>
                <h2 id="knowledge-cases-heading">Incident evidence organised into a repeatable public assessment structure.</h2>
              </div>
              <div className="document-reading">
                <p>VIGIL Observatory Case Files document AI Incidents through Incident, Assessment, Classification, Repair, Conclusion and References, keeping factual evidence distinct from VIGIL&apos;s analytical judgment.</p>
                <p className="vigil-knowledge-meta">{caseFilesMeta}</p>
              </div>
              <div className="cam-action-row">
                <Link className="cam-action cam-action-secondary" href="/observatory/cases/">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
              </div>
            </section>

            <section id="taxonomy" className="document-section vigil-about-section" aria-labelledby="knowledge-taxonomy-heading">
              <div className="document-section-heading">
                <p>VIGIL Observatory Alignment Taxonomy <span className="cam-beta-chip">Beta</span></p>
                <h2 id="knowledge-taxonomy-heading">A maintained reference for recurring AI governance boundaries.</h2>
              </div>
              <div className="document-reading">
                <p>The taxonomy classifies evidence against governing invariants and records whether each mapped boundary failed, held or remains unresolved. Stable Fidelity Family and Fidelity Class identifiers preserve continuity as the reference evolves.</p>
                <p className="vigil-knowledge-meta">{taxonomyMeta}</p>
              </div>
              <div className="cam-action-row">
                <Link className="cam-action cam-action-secondary" href="/observatory/knowledge-base/failure-taxonomy/">Browse the Alignment Taxonomy <ArrowRight aria-hidden="true" /></Link>
              </div>
            </section>

            <section id="harm-impact" className="document-section vigil-about-section" aria-labelledby="knowledge-harm-heading">
              <div className="document-section-heading">
                <p>Harm Impact Assessment</p>
                <h2 id="knowledge-harm-heading">The VIGIL-HIM reference for materialised consequence and severity.</h2>
              </div>
              <div className="document-reading">
                <p>VIGIL-HIM defines the harm dimensions, evidence states and S1–S5 thresholds used in Case Files. Harm assessment is deliberately separate from alignment classification: one describes materialised consequence; the other describes governance-boundary behaviour.</p>
                <p className="vigil-knowledge-meta">VIGIL-HIM 1.0.0 · methodology reference</p>
              </div>
              <div className="cam-action-row">
                <Link className="cam-action cam-action-secondary" href="/observatory/severity-methodology/">Open Harm Impact Assessment <ArrowRight aria-hidden="true" /></Link>
              </div>
            </section>

            <section id="datasets" className="document-section vigil-about-section" aria-labelledby="knowledge-datasets-heading">
              <div className="document-section-heading">
                <p>Datasets</p>
                <h2 id="knowledge-datasets-heading">Machine-readable publications for independent analysis and reuse.</h2>
              </div>
              <div className="document-reading">
                <p>Download the public Case File index, AI Governance Standards data, VIGIL-HIM matrix and Alignment Taxonomy publication in machine-readable formats.</p>
              </div>
              <div className="cam-action-row">
                <Link className="cam-action cam-action-secondary" href="/datasets/">Open datasets <ArrowRight aria-hidden="true" /></Link>
              </div>
            </section>

            <section id="policy" className="document-section vigil-about-section" aria-labelledby="knowledge-policy-heading">
              <div className="document-section-heading">
                <p>Policy</p>
                <h2 id="knowledge-policy-heading">Public-interest proposals and submissions informed by CAM governance work.</h2>
              </div>
              <div className="document-reading">
                <p>CAM Initiative policy papers and consultation submissions translate governance analysis into practical institutional, legal and regulatory proposals.</p>
              </div>
              <div className="cam-action-row">
                <Link className="cam-action cam-action-secondary" href="/observatory/knowledge-base/policy/">Browse policy <ArrowRight aria-hidden="true" /></Link>
              </div>
            </section>

            <section id="architecture" className="document-section vigil-about-section" aria-labelledby="knowledge-architecture-heading">
              <div className="document-section-heading">
                <p>CAELESTIS Architecture Model</p>
                <h2 id="knowledge-architecture-heading">Governance architecture for advanced AI systems.</h2>
              </div>
              <div className="document-reading">
                <p>The public CAELESTIS architecture reference is undergoing a substantive refactor. It will return to the Knowledge Base when its structure, source material and presentation are ready for publication.</p>
              </div>
            </section>
          </article>
        </div>
      </main>
    </Shell>
  );
}
