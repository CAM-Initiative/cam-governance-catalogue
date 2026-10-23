import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";
import { HarmImpactMatrix, highlightedThreshold } from "@/components/vigil/HarmImpactMatrix";
import { VigilObservatoryMasthead } from "@/components/vigil/VigilObservatoryMasthead";
import { VIGIL_MASTHEAD_ARTWORK } from "@/lib/vigilMastheadArtwork";
import { HARM_PATHWAY_STEPS, aggregateHarmSections, aggregateHarmBandSummary } from "@/lib/vigilHarmPublic.mjs";

import { HARM_BANDS, harmDimensions, harmMethodology, harmMethodologyUrl, harmReferences as methodologyReferences } from "@/lib/vigilHarmReference";

const harmImpactRail = [
  { href: "#matrix", label: "Reference matrix" },
  { href: "#method", label: "Method" },
  { href: "#pathways", label: "Assessment pathways" },
  { href: "#aggregate", label: "Aggregate Harm" },
  { href: "#references", label: "References" },
];

export default function VigilSeverityMethodology() {
  return <Shell>
    <main className="vigil-about-page vigil-severity-methodology-page home-menu-page document-page">
      <VigilObservatoryMasthead
        id="overview"
        titleId="harm-impact-assessment-heading"
        kicker="VIGIL Observatory · Harm Impact Assessment"
        title="Harm Impact Assessment"
        description="Assessing supported materialised harm across twelve dimensions using the VIGIL Harm Impact Methodology."
        artworkSrc={VIGIL_MASTHEAD_ARTWORK.harm}
        contextLabel="Methodology context"
        mode="reference"
        visual="harm"
        metadata={[
          { label: "Method", value: "VIGIL-HIM", mono: true },
          { label: "Version", value: harmMethodology.version, mono: true },
          { label: "Dimensions", value: String(harmDimensions.length) },
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
              <p>The matrix below publishes the threshold criteria for every VIGIL Observatory harm dimension and each S1–S5 band. Bold text marks quantitative or grave-consequence thresholds that are especially useful when scanning the table; the full wording of each cell remains controlling.</p>
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
                <h3>Overall severity</h3>
                <p>Only dimensions with a defensible assessed band contribute to the overall severity. The highest defensible materialised-harm threshold controls the overall severity; dimensions are not averaged, summed or increased because an Incident has several Alignment Taxonomy mappings. For a modelled Aggregate Harm assessment, the highest supported aggregate dimension band controls instead. Never combine ordinary and aggregate bands within one assessment.</p>
                <p>SU — Unassessed applies when no harm dimension has a defensible band and the evidence does not positively establish no materialised downstream harm. SU is an evidence state, not a sixth severity band.</p>
              </div>
            </div>
          </section>

          <section id="pathways" className="document-section vigil-severity-methodology-section" aria-labelledby="harm-pathways-heading">
            <div className="document-section-heading"><p>Assessment pathways</p><h2 id="harm-pathways-heading">Select the pathway before scoring</h2></div>
            <div className="document-reading">
              <p><strong>Specific consequence.</strong> Assess materialised consequences to a bounded person, group, organisation or asset using the ordinary domain criteria above. One grave individual outcome can support a high band. Provider-wide user totals do not raise that score.</p>
              <p><strong>Aggregate Harm — modelled from deployed evaluation.</strong> Use this separate pathway when an actually deployed feature shows a potentially generalisable mechanism and the assessment does not concern a particular actual harmed person, group, organisation or asset. A single observed interaction may warrant this screening; it does not establish reproducibility, cohort size or injury.</p>
              <ol>{HARM_PATHWAY_STEPS.map(step => <li key={step}>{step}</li>)}</ol>
              <p>The highest supported harm band on the selected pathway determines overall severity. Ordinary and Aggregate Harm bands are not combined. If evidence does not support a band, the result is SU rather than a guess.</p>
            </div>
          </section>
          <section id="aggregate" className="document-section vigil-severity-methodology-section" aria-labelledby="harm-aggregate-heading">
            <div className="document-section-heading"><p>Aggregate Harm</p><h2 id="harm-aggregate-heading">Evidence gates and separate severity criteria</h2></div>
            <div className="document-reading">
              <p>Aggregate Harm is an explicitly labelled, modelled estimate. Source-backed feature-specific eligible users or real decision opportunities are not a count of injured people. Population size alone cannot establish a band. Reproducibility, a supported consequence pathway, safeguards and uncertainty must also be assessed.</p>
              <p>Five dimensions have Aggregate Harm criteria. Other dimensions retain their ordinary consequence criteria. If the correct aggregate pathway lacks the facts needed to score, retain that pathway and SU; do not switch pathways to obtain a score.</p>
              <p>Every band also requires evidenced collective consequences, not only a qualifying population or number of decisions. The effects are modelled; eligible users are not counted as injured people. These operational brackets are VIGIL-defined and are not externally validated clinical severity conversions. Recovery durations in the ordinary matrix are illustrative, not automatic cut-offs.</p>
              {harmDimensions.filter(dimension => HARM_BANDS.some(band => dimension.thresholds[band].aggregate_harm_threshold)).map(dimension => {
                const shared = aggregateHarmSections(dimension.thresholds.S1.aggregate_harm_threshold || "");
                return <details className="vigil-harm-guidance-detail" key={dimension.dimension_id}>
                  <summary>{dimension.label}</summary>
                  {shared.structured ? <p><strong>Evidence required for every band:</strong> {shared.mechanism}</p> : null}
                  <dl>{HARM_BANDS.map(band => <div key={band}><dt><strong>{band}</strong></dt><dd>{highlightedThreshold(aggregateHarmBandSummary(dimension.thresholds[band].aggregate_harm_threshold || ""))}</dd></div>)}</dl>
                </details>;
              })}
            </div>
          </section>
          <section id="references" className="document-section vigil-about-section vigil-severity-methodology-section" aria-labelledby="severity-references-heading">
            <div className="document-section-heading">
              <p>References</p>
              <h2 id="severity-references-heading">Methodology source trail</h2>
            </div>
            <div className="document-reading">
              <p>The references below are the external sources registered against VIGIL-HIM {harmMethodology.version}. Reference inclusion does not establish endorsement, equivalence or clinical validation.</p>
              <p><a href={harmMethodologyUrl} target="_blank" rel="noreferrer">Download the canonical VIGIL-HIM {harmMethodology.version} methodology (JSON)</a></p>
            </div>
            <ol className="vigil-methodology-reference-list">
              {methodologyReferences.map((reference, index) => <li key={reference.reference_id} className="vigil-methodology-reference-item">
                <span className="vigil-methodology-reference-number">[{index + 1}]</span>
                <span className="vigil-methodology-reference-copy">
                  <strong>{reference.title}</strong>
                  <span className="vigil-methodology-reference-meta"> — {reference.publisher}</span>
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
