import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";
import { VigilAlignmentLegend } from "@/components/vigil/CaseTaxonomyClassification";
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

const CASE_FILE_STAGES = [
  {
    number: "01",
    label: "Incident",
    description: "Record what happened, the affected systems and the public evidence supporting the occurrence.",
  },
  {
    number: "02",
    label: "Assessment",
    description: "Assess governance significance, interpret taxonomy-relevant source clauses, review external assessments where available, and separately assess real-world materialised harm and severity under VIGIL-HIM.",
  },
  {
    number: "03",
    label: "Classification",
    description: "Map the evidence to the VIGIL Alignment Taxonomy and record whether each boundary failed, held or remains unresolved.",
  },
  {
    number: "04",
    label: "Repair",
    description: "Surface the governing class invariants for mappings where failure is evidenced or the boundary remains unresolved; invariant-held mappings create no Repair requirement.",
  },
  {
    number: "05",
    label: "Conclusion",
    description: "Integrate the evidence, harm assessment, taxonomy relationships and repair implications into a bounded VIGIL interpretation.",
  },
  {
    number: "06",
    label: "References",
    description: "Preserve the evidence sources, taxonomy records, methodology references and canonical Incident supporting the analysis.",
  },
] as const;

const CASE_FILE_INDEX_CLASSIFICATIONS = [
  {
    key: "failure",
    label: "Failure evidenced",
    description: "The Incident has one or more failure-occurrence mappings and no unresolved or invariant-held combination that changes the whole-record summary.",
  },
  {
    key: "exemplar",
    label: "Invariant held",
    description: "The mapped governance boundary or boundaries held under pressure and no failure occurrence is evidenced. These Case Files act as alignment exemplars.",
  },
  {
    key: "mixed",
    label: "Mixed alignment",
    description: "The Incident contains both failure and invariant-held mappings, or an unresolved boundary, so a single aligned or misaligned label would hide material differences.",
  },
  {
    key: "disputed",
    label: "Disputed",
    description: "The taxonomy classification is explicitly disputed. The public index preserves that state rather than forcing a settled outcome.",
  },
  {
    key: "unclassified",
    label: "Unclassified",
    description: "The available evidence does not yet support a defensible taxonomy classification for the Incident.",
  },
] as const;

const knowledgeRail = [
  { href: "#overview", label: "Overview" },
  { href: "#cases", label: "Case File method" },
  { href: "#taxonomy", label: "Classification" },
  { href: "#harm-impact", label: "Harm Impact Assessment" },
  { href: "#datasets", label: "Datasets" },
  { href: "#policy", label: "Policy" },
  { href: "#architecture", label: "CAELESTIS Architecture Model" },
  { href: "#standards", label: "AI Governance Standards" },
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
      <main className="public-reference-page vigil-knowledge-hub-page home-menu-page document-page">
        <div className="document-layout document-layout--wide">
          <DocumentRail title="Knowledge Base" items={knowledgeRail} ariaLabel="CAM Initiative Knowledge Base sections" />

          <article className="document-content public-reference-document vigil-knowledge-document">
            <header id="overview" className="document-hero public-reference-hero">
              <p className="public-reference-kicker">CAM Initiative</p>
              <h1 id="knowledge-base-heading">Knowledge Base</h1>
              <p>Reference material across CAM Initiative: VIGIL Observatory Case Files and methods, AI governance standards, public datasets, policy material and the CAELESTIS Architecture Model.</p>
            </header>

            <section id="cases" className="document-section vigil-about-section" aria-labelledby="knowledge-cases-heading">
              <div className="document-section-heading">
                <p>Case File method</p>
                <h2 id="knowledge-cases-heading">One evidence-to-conclusion structure for every Incident</h2>
              </div>
              <div className="document-reading">
                <p>The Case File structure keeps distinct questions separate and reconnects them at the conclusion. <strong>Assessment</strong> contains distinct governance, external and real-world harm assessments. VIGIL-HIM assesses materialised consequence and derives severity; <strong>Classification</strong> asks which governance or control boundaries in the VIGIL Alignment Taxonomy were engaged and what happened at each boundary.</p>
                <p>Real-world harm assessment and alignment classification are deliberately independent: harm assessment describes materialised consequence and derives severity; alignment classification describes mechanism and boundary behaviour. A reported Incident is not automatically evidence of a governance failure, and a serious harm rating does not by itself determine which Fidelity Class applies.</p>
                <p className="vigil-knowledge-meta">{caseFilesMeta}</p>
              </div>
              <ol className="about-method-list" aria-label="VIGIL Observatory six-stage Incident Case File model">
                {CASE_FILE_STAGES.map((stage) => <li key={stage.number}>
                  <span className="about-method-number">{stage.number}</span>
                  <div>
                    <h3>{stage.label}</h3>
                    <p>{stage.description}</p>
                  </div>
                </li>)}
              </ol>
              <div className="cam-action-row">
                <Link className="cam-action cam-action-secondary" href="/observatory/cases/">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
              </div>
            </section>

            <section id="taxonomy" className="document-section vigil-about-section" aria-labelledby="knowledge-taxonomy-heading">
              <div className="document-section-heading">
                <p>Classification and Alignment Taxonomy <span className="cam-beta-chip">Beta</span></p>
                <h2 id="knowledge-taxonomy-heading">Mappings classify individual boundaries. The Case File index summarises the Incident.</h2>
              </div>
              <div className="document-reading">
                <p>The maintained VIGIL Observatory Alignment Taxonomy provides shared classification language for recurring AI governance boundaries. Broad <strong>Fidelity Families</strong> and individual <strong>Fidelity Classes</strong> retain stable FF/FC identifiers and define the repeatable mechanisms, recognition criteria, exclusions and governing invariants used in adjudication.</p>
                <p>Classification happens first at the <strong>mapping level</strong>. One Incident may engage several Fidelity Classes, and each relationship records what the evidence establishes at that particular governance boundary.</p>
                <p className="vigil-knowledge-meta">{taxonomyMeta}</p>
              </div>

              <div className="vigil-knowledge-classification-layer">
                <h3>Mapping-level outcomes</h3>
                <p>Each mapped boundary has one of three outcomes. This is the visual key used in Case File Classification and Repair tables.</p>
                <VigilAlignmentLegend detailed />
              </div>

              <div className="vigil-knowledge-classification-layer">
                <h3>Case File index classification</h3>
                <p>The current public Case File index combines those mapping-level results into one of five whole-Incident labels. These are summary states; the underlying mapping outcomes remain separately visible inside the Case File.</p>
                <div className="vigil-knowledge-index-classifications" aria-label="Case File index classification states">
                  {CASE_FILE_INDEX_CLASSIFICATIONS.map((item) => <article key={item.key}>
                    <span className="vigil-knowledge-index-state">{item.label}</span>
                    <p>{item.description}</p>
                  </article>)}
                </div>
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
                <p className="vigil-knowledge-meta">VIGIL-HIM 1.0.1 · methodology reference</p>
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
                <h2 id="knowledge-architecture-heading">Governance architecture for advanced AI systems</h2>
              </div>
              <div className="document-reading">
                <p>The CAELESTIS Architecture Model (CAM) is a publicly inspectable governance corpus for advanced AI systems, synthetic agents, relational AI environments and digital ecosystem accountability. It sets out constitutional architecture, charters, laws, schedules, registries, symbolic structures and supporting validation infrastructure for CAM-governed contexts.</p>
                <p>The public architecture reference and supporting source material are published through the CAELESTIS repository, with versioned releases preserved through Zenodo.</p>
                <p>The VIGIL Observatory Alignment Taxonomy uses the CAELESTIS Architecture Model as a source for taxonomy development and evaluation, alongside other evidence and governance sources. That source relationship does not merge the two systems: VIGIL documents and assesses Incidents independently, and a VIGIL assessment or taxonomy relationship does not create or amend CAELESTIS doctrine.</p>
              </div>
              <div className="cam-action-row">
                <a className="cam-action cam-action-secondary" href="https://doi.org/10.5281/zenodo.20686316" target="_blank" rel="noreferrer">Open archived release <ArrowRight aria-hidden="true" /></a>
                <a className="cam-action cam-action-secondary" href="https://github.com/CAM-Initiative/Caelestis" target="_blank" rel="noreferrer">CAELESTIS repository <ArrowRight aria-hidden="true" /></a>
              </div>
            </section>
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

          </article>
        </div>
      </main>
    </Shell>
  );
}
