import { useEffect, useState } from "react";
import { loadCurrentHarmMethodologyDefinition, type HarmMethodologyDefinition } from "@/lib/vigilHarmMethodology";
import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";
import { HarmImpactMatrix } from "@/components/vigil/HarmImpactMatrix";
import { VigilObservatoryMasthead } from "@/components/vigil/VigilObservatoryMasthead";
import { VIGIL_MASTHEAD_ARTWORK } from "@/lib/vigilMastheadArtwork";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";

const methodologyReferences = [
  {
    id: "VIGIL-REF-000001",
    title: "AI Incident Tracker: Harm Taxonomy",
    publisher: "MIT FutureTech",
    url: "https://airisk.mit.edu/ai-incident-tracker/harm-taxonomy",
  },
  {
    id: "VIGIL-REF-000002",
    title: "AI Incident Tracker",
    publisher: "MIT FutureTech",
    url: "https://airisk.mit.edu/ai-incident-tracker",
  },
  {
    id: "VIGIL-REF-000003",
    title: "AI Incident Tracker June 2026 Update",
    publisher: "MIT FutureTech",
    url: "https://airisk.mit.edu/blog/ai-incident-tracker-june-2026-update",
  },
  {
    id: "VIGIL-REF-000004",
    title: "Adding Structure to AI Harm: An Introduction to CSET's AI Harm Framework",
    publisher: "Center for Security and Emerging Technology, Georgetown University",
    url: "https://cset.georgetown.edu/wp-content/uploads/20230022-Adding-structure-to-AI-Harm-FINAL.pdf",
  },
  {
    id: "VIGIL-REF-000005",
    title: "Federal Incident Notification Guidelines",
    publisher: "Cybersecurity and Infrastructure Security Agency",
    url: "https://www.cisa.gov/federal-incident-notification-guidelines",
  },
  {
    id: "VIGIL-REF-000006",
    title: "CISA National Cyber Incident Scoring System",
    publisher: "Cybersecurity and Infrastructure Security Agency",
    url: "https://www.cisa.gov/news-events/news/cisa-national-cyber-incident-scoring-system-nciss",
  },
  {
    id: "VIGIL-REF-000007",
    title: "Contingency Planning Guide for Federal Information Systems (SP 800-34 Rev. 1)",
    publisher: "National Institute of Standards and Technology",
    url: "https://csrc.nist.gov/pubs/sp/800/34/r1/final",
  },
  {
    id: "VIGIL-REF-000008",
    title: "Commission Implementing Regulation (EU) 2024/2690",
    publisher: "European Commission",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202402690",
  },
  {
    id: "VIGIL-REF-000009",
    title: "Commission Delegated Regulation (EU) 2024/1772",
    publisher: "European Commission",
    url: "https://eur-lex.europa.eu/eli/reg_del/2024/1772/oj/eng",
  },
  {
    id: "VIGIL-REF-000010",
    title: "Cyber Incident Management Arrangements for Australian Governments",
    publisher: "Australian Signals Directorate, Australian Cyber Security Centre",
    url: "https://www.cyber.gov.au/business-government/detecting-responding-to-threats/cyber-security-incident-response/cyber-incident-management-arrangements-for-australian-governments",
  },
  {
    id: "VIGIL-REF-000011",
    title: "Prioritization of Risks from Artificial Intelligence: A Delphi Study of 272 International Experts",
    publisher: "MIT FutureTech",
    url: "https://futuretech.mit.edu/publication/prioritization-of-risks-from-artificial-intelligence-a-delphi-study-of-272-international-experts",
  },
] as const;

const harmImpactRail = [
  { href: "#matrix", label: "Reference matrix" },
  { href: "#method", label: "Method" },
  { href: "#proposed-him", label: "Proposed HIM 1.1.0" },
  { href: "#references", label: "References" },
];

export default function VigilSeverityMethodology() {
  const [current, setCurrent] = useState<HarmMethodologyDefinition>();
  useEffect(() => {
    let cancelled = false;
    void loadCurrentHarmMethodologyDefinition().then((method) => {
      if (!cancelled) setCurrent(method);
    });
    return () => { cancelled = true; };
  }, []);
  const aggregateSupported = current?.dimensions.some((dimension) =>
    Object.values(dimension.thresholds).some((threshold) => !!threshold.aggregate_harm_threshold));
  return <Shell>
    <main className="vigil-about-page vigil-severity-methodology-page home-menu-page document-page">
      <VigilObservatoryMasthead
        id="overview"
        titleId="harm-impact-assessment-heading"
        kicker="VIGIL Observatory · Harm Impact Assessment"
        title="Harm Impact Assessment"
        description={aggregateSupported ? "Assessing Specific Harm and Aggregate Harm through the adopted VIGIL Harm Impact Methodology." : "Assessing supported materialised harm across eleven dimensions using the VIGIL Harm Impact Methodology."}
        artworkSrc={VIGIL_MASTHEAD_ARTWORK.harm}
        contextLabel="Methodology context"
        mode="reference"
        visual="harm"
        metadata={[
          { label: "Method", value: "VIGIL-HIM", mono: true },
          { label: "Version", value: current?.version ?? "1.0.1", mono: true },
          { label: "Dimensions", value: String(current?.dimensions.length ?? 11) },
          { label: "Severity bands", value: "S1–S5 · SU", mono: true },
        ]}
      />

      <div className="document-layout document-layout--wide document-layout-below-header">
        <DocumentRail title="Harm Impact Assessment" items={harmImpactRail} ariaLabel="Harm Impact Assessment sections" />

        <article className="document-content vigil-severity-methodology-document">
          <section id="matrix" className="document-section vigil-about-section vigil-severity-methodology-section" aria-labelledby="severity-matrix-heading">
            <div className="document-section-heading">
              <p>Reference matrix</p>
              <h2 id="severity-matrix-heading">VIGIL Observatory Harm Impact Matrix</h2>
            </div>
            <div className="document-reading">
              <p>The matrix below publishes the threshold criteria for every VIGIL Observatory harm dimension and each S1–S5 band from the <strong>currently adopted</strong> VIGIL Incident methodology. Bold text marks quantitative or grave-consequence thresholds that are especially useful when scanning the table; the full wording of each cell remains controlling. An unapproved proposal must never change the published reference matrix.</p>
              <p className="vigil-severity-alignment"><strong>External alignment.</strong> VIGIL Observatory aligns the direction of its five-level scale with established AI harm-assessment practice: the <a href="https://airisk.mit.edu/ai-incident-tracker/harm-taxonomy">MIT AI Incident Tracker harm-severity scale</a> runs from 1 (Negligible) to 5 (Catastrophic) and uses harm categories based on the <a href="https://cset.georgetown.edu/wp-content/uploads/20230022-Adding-structure-to-AI-Harm-FINAL.pdf">CSET AI Harm Framework</a>. VIGIL Observatory also adapts functional-impact and recoverability concepts from CISA, NIST, NIS2, DORA and ASD. These sources inform VIGIL Observatory; their scales are not interchangeable with VIGIL-HIM.</p>
            </div>
            <HarmImpactMatrix />
          </section>

          <section id="method" className="document-section vigil-about-section vigil-severity-methodology-section" aria-labelledby="severity-principles-heading">
            <div className="document-section-heading">
              <p>Method</p>
              <h2 id="severity-principles-heading">How the overall severity band is derived</h2>
            </div>
            <div className="vigil-severity-principles">
              <div className="vigil-severity-evidence-states">
                <h3>Evidence states</h3>
                <p>Each harm dimension is resolved to an evidence state before any overall severity is derived.</p>
                <dl>
                  <div><dt>Assessed</dt><dd>Evidence supports a materialised impact and a specific threshold band.</dd></div>
                  <div><dt>Unreported</dt><dd>The dimension is relevant, but published evidence does not report whether or how harm materialised. It is not S1.</dd></div>
                  <div><dt>Insufficient evidence</dt><dd>Some impact evidence exists, but it cannot distinguish a defensible severity band.</dd></div>
                  <div><dt>Not applicable</dt><dd>Affirmative context places the dimension outside the Incident’s bounded scope.</dd></div>
                </dl>
              </div>
            </div>

            <div className="vigil-severity-derivation-rows">
              <div className="vigil-severity-method-row">
                <h3>Severity display</h3>
                <div className="vigil-severity-method-copy">
                  <p>S1–S5 use the same flat yellow chip throughout VIGIL Case Files. The band label carries the severity level; colour is not an ordinal scale. SU — Unassessed remains visually neutral and is used when no defensible overall band can be derived because no dimension can be banded and the evidence does not positively establish bounded no-materialised-harm; SU is an evidence state, not a sixth severity band.</p>
                  <div className="vigil-severity-chip-key" aria-label="Severity band display examples">
                    {(["S1", "S2", "S3", "S4", "S5", "SU"] as const).map((band) => <VigilStatusChip key={band} value={band} />)}
                  </div>
                </div>
              </div>

              <div className="vigil-severity-method-row">
                <h3>Overall severity</h3>
                <p>Only dimensions with a defensible assessed band contribute to the overall severity. {aggregateSupported
                  ? <>Each Incident follows exactly one evidence pathway: Specific Harm uses actual observed consequences; a generic deployed-model benchmark without a particular harmed person or group may use adopted Aggregate Harm thresholds. The highest supported band within that pathway controls; dimensions are not summed and Aggregate Harm is not observed injury.</>
                  : <>The highest defensible materialised-harm threshold controls the overall severity; dimensions are not averaged, summed or increased because an Incident has several Alignment Taxonomy mappings.</>} Individual Case Files do not repeat this entire reference matrix. They show the incident-specific evidence state, supported band, threshold ID and assessment basis for each relevant dimension, together with any observed quantitative values and the dimension or dimensions controlling the overall severity.</p>
              </div>
            </div>
          </section>

          <section id="proposed-him" className="document-section vigil-about-section vigil-severity-methodology-section" aria-labelledby="severity-draft-heading">
            <div className="document-section-heading">
              <p>Methodology development · not yet adopted</p>
              <h2 id="severity-draft-heading">Proposed HIM 1.1.0 — pathways and thresholds</h2>
            </div>
            <div className="document-reading">
              <p><strong>Draft, not a published scoring standard.</strong> VIGIL is calibrating HIM 1.1.0 on its working branch. Until adoption and schema/validator migration, canonical Case Files retain their recorded methodology version and no proposed Aggregate Harm score is treated as observed injury.</p>
              <h3>Specific Harm</h3>
              <p>For an Incident with an actual person, group, organisation or other bounded affected subject, use the ordinary S1–S5 thresholds based on <em>documented consequences</em>. One person can experience S5 harm. The model provider's overall deployment size never modifies that Incident's score.</p>
              <h3>Aggregate Harm — generic deployed evaluations only</h3>
              <p>When a deployed-model benchmark or generic product-level Incident has no particular evidenced harmed person or group, the proposal uses higher, dimension-specific S1–S5 population or decision thresholds. They apply to psychological wellbeing; relational integrity and autonomy; rights and liberty; equal treatment; and societal and democratic impact. Source-backed feature-eligible cohorts, a demonstrated material failure and a credible consequence must all be established. S1 is available; neither an S2 minimum nor a post-hoc score discount applies.</p>
              <p>The two pathways are <strong>mutually exclusive</strong> within an Incident. Eligible active users are not a tally of injured people. A specific case never receives Aggregate Harm thresholds, even where the incident's consequences are uncertain.</p>
              <h3>Epistemic reliance and reputational harm</h3>
              <p>Epistemic failures become reputational consequences only where evidence connects a false or unsupported artefact to real downstream reliance, an identifiable reputation-bearing subject and an independently demonstrated adverse outcome. HIM 1.1.0 proposes specific S1–S5 thresholds for corrective burden, professional credibility, role/opportunity loss, persistence and reversibility. A taxonomy failure or citation error by itself does not automatically constitute reputational harm.</p>
              <h3>Release boundary</h3>
              <p>The adopted matrix above is sourced from the methodology version authorised in VIGIL's canonical Incident schema. HIM 1.0.1 currently governs 11 dimensions; the draft would add Relational Integrity and Autonomy as a twelfth. The website must keep draft thresholds clearly separate until VIGIL adopts HIM 1.1.0 and updates the Case File and validator contracts together.</p>
              <p>Review the <a href="https://github.com/CAM-Initiative/Vigil/blob/agent/incident-ecosystem-ingestion/vigil/methodologies/proposals/VIGIL.HarmImpactMatrix.v1.1.0-proposal.json" target="_blank" rel="noreferrer">draft matrix with all dimensional S1–S5 criteria</a> and the <a href="https://github.com/CAM-Initiative/Vigil/blob/agent/incident-ecosystem-ingestion/vigil/docs/reviews/2026-10-10-him-12-dimension-scale-exposure-proposal.md" target="_blank" rel="noreferrer">methodology calibration and Incident examples</a>.</p>
            </div>
          </section>

          <section id="references" className="document-section vigil-about-section vigil-severity-methodology-section" aria-labelledby="severity-references-heading">
            <div className="document-section-heading">
              <p>References</p>
              <h2 id="severity-references-heading">Methodology source trail</h2>
            </div>
            <div className="document-reading">
              <p>The references below are the external sources registered against VIGIL-HIM 1.0.1.</p>
            </div>
            <ol className="vigil-methodology-reference-list">
              {methodologyReferences.map((reference, index) => <li key={reference.id} className="vigil-methodology-reference-item">
                <span className="vigil-methodology-reference-number">[{index + 1}]</span>
                <span className="vigil-methodology-reference-copy">
                  <strong>{reference.title}</strong>
                  <span className="vigil-methodology-reference-meta"> — {reference.publisher} · {reference.id}</span>
                  <br />
                  <a href={reference.url} target="_blank" rel="noreferrer" className="vigil-methodology-reference-url">{reference.url}</a>
                </span>
              </li>)}
            </ol>
          </section>
        </article>
      </div>
    </main>
  </Shell>;
}
