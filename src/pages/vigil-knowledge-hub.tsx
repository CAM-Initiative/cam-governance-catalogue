import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";
import { vigilReadingGuide } from "@/lib/vigilReadingGuide.mjs";
import { VigilAlignmentLegend } from "@/components/vigil/CaseTaxonomyClassification";
import { loadVigilIncidentRecords } from "@/lib/vigilRegistry";
import { loadExternalRequirements, loadExternalSources } from "@/lib/vigilExternalKnowledge";
import { loadFailureTaxonomyIndex } from "@/lib/vigilFailureTaxonomy";

function ReadingGuide({ section }: { section: string }) {
  return <>{vigilReadingGuide.filter(item => item.section === section).map(item => <section key={item.title}>
    <h3>{item.title}</h3>
    {item.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
  </section>)}</>;
}

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
    description: "Assess governance significance, interpret taxonomy-relevant source clauses, review external assessments where available, and separately assess real-world materialised harm through the Harm Impact Assessment using the VIGIL Harm Impact Methodology (VIGIL-HIM).",
  },
  {
    number: "03",
    label: "Classification",
    description: "Map the evidence to the VIGIL Alignment Taxonomy and record whether each boundary failed, held or remains unresolved.",
  },
  {
    number: "04",
    label: "Compliance",
    description: "Assess relevant external requirements independently against the occurrence evidence. Show Aligned, Not aligned or Boundary alongside normative force and the assessment basis.",
  },
  {
    number: "05",
    label: "Conclusion",
    description: "Integrate the evidence, harm assessment, taxonomy relationships and external requirement crosswalk into a bounded VIGIL interpretation.",
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
    description: "The mapped governance boundary or boundaries held and the Incident has complete adjudication coverage. These Case Files may be presented as alignment exemplars when no failure or unresolved boundary changes that result.",
  },
  {
    key: "incomplete",
    label: "Adjudication incomplete",
    description: "One or more material incident observations still require a final taxonomy determination. VIGIL does not assign a whole-Incident alignment classification until adjudication coverage is complete.",
  },
  {
    key: "mixed",
    label: "Mixed alignment",
    description: "The Incident contains both failure and invariant-held mappings, or an unresolved boundary, so a single aligned or misaligned label would hide material differences.",
  },
  {
    key: "disputed",
    label: "Disputed",
    description: "Material facts needed to establish the occurrence or its taxonomy classification are contested. This can include an affected party expressly denying the alleged conduct, materially incompatible accounts from involved parties, or evidence that does not independently resolve the conflict. It does not require litigation or a formal legal dispute. VIGIL takes a legally conservative approach: disputed allegations remain attributed and are not presented as established fact unless independently supported.",
  },
  {
    key: "unclassified",
    label: "Unclassified",
    description: "The available evidence does not yet support a defensible taxonomy classification for the Incident.",
  },
] as const;

const knowledgeRail = [
  { href: "#overview", label: "Overview" },
  { href: "#admission", label: "Incident admission" },
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

            <section id="admission" className="document-section vigil-about-section" aria-labelledby="knowledge-admission-heading">
              <div className="document-section-heading">
                <p>Incident admission</p>
                <h2 id="knowledge-admission-heading">What qualifies as a VIGIL Incident?</h2>
              </div>
              <div className="document-reading">
                <p><strong>Incident Admission Principle.</strong> VIGIL admits sufficiently evidenced, bounded occurrences in which an AI system materially participates in behaviour, decisions, actions, interactions or consequences relevant to the evaluation of AI governance and alignment.</p>
                <p><strong>Admission is not a finding of misalignment.</strong> An Incident may demonstrate a failed governance boundary, a successfully preserved invariant, mixed outcomes or an unresolved question. It need not involve realised harm, a security breach or a model that disobeyed instructions. Classification and Harm Impact are separate assessments made after the occurrence is established.</p>
                <h3>How an occurrence qualifies</h3>
                <ul>
                  <li><strong>A bounded occurrence:</strong> identifiable actors or systems, actions, sequence and context, including an actual observed evaluation or successful containment. A hypothetical attack or general risk description is not an Incident.</li>
                  <li><strong>Material AI participation:</strong> the AI system's output, decision, interaction, action or control response meaningfully contributed to what occurred. Incidental use of an AI tool is insufficient.</li>
                  <li><strong>A governance-relevant question:</strong> the evidence illuminates a material boundary of authority, safety, reliability, deception, privacy, security, oversight or another AI governance property. A matching Fidelity Class need not already exist.</li>
                  <li><strong>Traceable evidence:</strong> sources support the claimed occurrence, AI contribution and material chronology with explicit limits. Independent or first-party artefacts are preferred; allegations remain attributed, and unresolved facts are not presented as established.</li>
                </ul>
                <h3>Security incidents and malicious use</h3>
                <p><strong>AI security behaviour is in scope</strong> where the AI was manipulated, crossed an access or authority boundary, exposed information, attempted an unauthorised action or successfully resisted such pressure. An observed protective response can be as informative as a breach.</p>
                <p><strong>Malicious human use of AI can be in scope</strong> when AI generation or action was a material part of an evidenced intrusion, impersonation, fraud or other harmful pathway. A perpetrator's objective is not automatically the model's objective, and the existence of a crime is not evidence by itself that the AI violated its governing invariant.</p>
                <p><strong>Incidental AI use is not enough.</strong> An ordinary cyberattack, software malfunction or rule-based automation failure does not qualify solely because it involved technology or was described as AI-related. Historical algorithmic systems require the same independent examination of system nature and material involvement; uncertainty remains a research question, not an automatic admission or rejection.</p>
                <h3>Admission is separate from diagnosis</h3>
                <p>Before creating a new Case File, VIGIL checks whether the occurrence is already represented, including by a differently titled, superseded or formerly withdrawn record. Distinct events are not merged merely because they share a technique or affected technology. Admission does not establish legal liability, compliance, a taxonomy verdict, severity or exemplar status. Historical external requirements are not applied retrospectively merely because they are now included in the governance library.</p>
              </div>
            </section>

            <section id="cases" className="document-section vigil-about-section" aria-labelledby="knowledge-cases-heading">
              <div className="document-section-heading">
                <p>Case File method</p>
                <h2 id="knowledge-cases-heading">One evidence-to-conclusion structure for every Incident</h2>
              </div>
              <div className="document-reading">
                <p>The Case File structure keeps distinct questions separate and reconnects them at the conclusion. <strong>Assessment</strong> contains the incident breakdown, external assessments and the <strong>Harm Impact Assessment</strong>. The Harm Impact Assessment applies the <strong>VIGIL Harm Impact Methodology (VIGIL-HIM)</strong> to evidence of materialised consequence and derives severity; <strong>Classification</strong> asks which governance or control boundaries in the VIGIL Alignment Taxonomy were engaged and what happened at each boundary.</p>
                <p>The Harm Impact Assessment describes materialised consequence and severity. Alignment classification describes governance-boundary behaviour. These assessments are independent. A reported Incident is not automatically evidence of a governance failure, and a serious harm rating does not by itself determine which Fidelity Class applies.</p>
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
                <ReadingGuide section="taxonomy" />
                <p className="vigil-knowledge-meta">{taxonomyMeta}</p>
              </div>

              <div className="vigil-knowledge-classification-layer">
                <h3>Mapping-level outcomes</h3>
                <p>Each mapped boundary has one of three outcomes. This is the visual key used in Case File Classification and Repair tables.</p>
                <VigilAlignmentLegend detailed />
              </div>

              <div className="vigil-knowledge-classification-layer">
                <h3>Case File index classification</h3>
                <p>The current public Case File index combines those mapping-level results into whole-Incident outcome labels only after adjudication coverage is complete. While coverage is partial, the Case File is shown simply as <strong>Adjudication incomplete</strong>; resolved mapping-level findings remain separately visible inside the Case File.</p>
                <div className="vigil-knowledge-index-classifications" aria-label="Case File index classification states">
                  {CASE_FILE_INDEX_CLASSIFICATIONS.map((item) => <article key={item.key}>
                    <span className="vigil-knowledge-index-state">{item.label}</span>
                    <p>{item.description}</p>
                  </article>)}
                </div>
              </div>

              <div className="cam-action-row">
                <Link className="cam-action cam-action-secondary" href="/observatory/alignment-taxonomy/">Browse the Alignment Taxonomy <ArrowRight aria-hidden="true" /></Link>
              </div>
            </section>

            <section id="harm-impact" className="document-section vigil-about-section" aria-labelledby="knowledge-harm-heading">
              <div className="document-section-heading">
                <p>Harm Impact Assessment</p>
                <h2 id="knowledge-harm-heading">How VIGIL assesses materialised harm and severity.</h2>
              </div>
              <div className="document-reading">
                <p>The <strong>Harm Impact Assessment</strong> is the Case File assessment of materialised harm. It uses the <strong>VIGIL Harm Impact Methodology (VIGIL-HIM)</strong>, which reviews eleven harm dimensions, records the available evidence state for each dimension and applies the published S1–S5 severity thresholds where the evidence supports a band.</p>
                <ReadingGuide section="harm-impact" />
                <h3>HIM 1.1.0 — proposed assessment clarification</h3>
                <p><strong>Proposal under review, not the current scoring standard.</strong> HIM 1.1.0 would add Relational Integrity and Autonomy as a twelfth dimension and make its quantitative threshold interpretation more explicit. The current published matrix above and existing Case Files remain governed by HIM 1.0.1 until VIGIL adopts the new methodology, updates its schema and validates its corpus.</p>
                <p><strong>Specific Harm:</strong> a bounded Incident involving an actual person, group, organisation, asset or institution is assessed against its <em>documented consequences</em> using the ordinary S1–S5 dimensional thresholds. An actual harmed group does not need to be publicly named. The provider's overall deployment size must never modify a specific Incident's severity.</p>
                <p><strong>Aggregate Harm:</strong> the proposed alternative is restricted to <em>generic Incidents and tests of deployed models</em> for which no particular harmed person or group is established. Five relevant dimensions carry their own, substantially higher S1–S5 eligible-population or decision thresholds. This is a modelled, evidence-bounded aggregate assessment, <em>not</em> a declaration that the whole eligible population suffered harm. S1 remains available; missing evidence is not automatically S1 or S2.</p>
                <p><strong>Epistemic reliance and reputation:</strong> an incorrect claim, fabricated citation or contaminated source may lead to reputational harm when someone relies on it. The assessment must establish the defective artefact, the actual reliance or consequential propagation, whose standing or dignity was affected, and a distinct observed adverse consequence. A failure classification does not automatically establish reputational injury. Each reputation-and-dignity band has proposed, independently testable S1–S5 indicators; actual specific incidents continue to use the ordinary harm pathway.</p>
                <p><strong>Publication boundary:</strong> the website must not display proposed Aggregate Harm severity as an observed injury or mix the two assessment pathways for the same Incident. The twelfth dimension and new thresholds should become authoritative only after the VIGIL methodology, record schema, validator and Case File presentation are migrated together.</p>
                <p>Read the <a href="https://github.com/CAM-Initiative/Vigil/blob/agent/incident-ecosystem-ingestion/vigil/methodologies/proposals/VIGIL.HarmImpactMatrix.v1.1.0-proposal.json" target="_blank" rel="noreferrer">proposed HIM 1.1.0 matrix</a> and its <a href="https://github.com/CAM-Initiative/Vigil/blob/agent/incident-ecosystem-ingestion/vigil/docs/reviews/2026-10-10-him-12-dimension-scale-exposure-proposal.md" target="_blank" rel="noreferrer">dimension-specific threshold rationale</a>. Both are drafts, not currently applicable to canonical Incident severity.</p>
                <p className="vigil-knowledge-meta">VIGIL-HIM 1.0.1 · methodology reference</p>
              </div>
              <div className="cam-action-row">
                <Link className="cam-action cam-action-secondary" href="/observatory/harm-impact-assessment/">Open Harm Impact Assessment <ArrowRight aria-hidden="true" /></Link>
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
                <Link className="cam-action cam-action-secondary" href="/policy/">Browse policy <ArrowRight aria-hidden="true" /></Link>
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
                <ReadingGuide section="standards" />
                <p className="vigil-knowledge-meta">{baselineMeta}</p>
              </div>
              <div className="cam-action-row">
                <Link className="cam-action cam-action-secondary" href="/observatory/ai-governance-standards/">Browse AI Governance Standards <ArrowRight aria-hidden="true" /></Link>
              </div>
            </section>

          </article>
        </div>
      </main>
    </Shell>
  );
}
