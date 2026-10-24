import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";
import { HarmImpactMatrix, highlightedThreshold } from "@/components/vigil/HarmImpactMatrix";
import { VigilObservatoryMasthead } from "@/components/vigil/VigilObservatoryMasthead";
import { VIGIL_MASTHEAD_ARTWORK } from "@/lib/vigilMastheadArtwork";
import { HARM_PUBLIC_PATHWAY_COPY, HARM_PUBLIC_SEVERITY_LEVELS, aggregateHarmSections, aggregateHarmBandSummary } from "@/lib/vigilHarmPublic.mjs";
import { VigilStatusChip } from "@/components/vigil/VigilStatusChip";

import { HARM_BANDS, harmDimensions, harmMethodology, harmMethodologyUrl, harmReferences as methodologyReferences } from "@/lib/vigilHarmReference";

const harmImpactRail = [
  { href: "#matrix", label: "Reference matrix" },
  { href: "#severity", label: "Severity" },
  { href: "#method", label: "Evidence states" },
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

          <section id="severity" className="document-section vigil-severity-methodology-section" aria-labelledby="harm-severity-heading">
            <div className="document-section-heading">
              <p>Assessment scale</p>
              <h2 id="harm-severity-heading">Severity</h2>
            </div>
            <div className="document-reading">
              <p>VIGIL uses five severity bands. The highest band supported by the evidence within the selected assessment pathway determines the overall result. Different harm dimensions are not added or averaged, and taxonomy classifications do not increase a harm score.</p>
              <ul className="vigil-severity-band-list" aria-label="Severity bands S1 to S5">
                {HARM_PUBLIC_SEVERITY_LEVELS.map(level => <li key={level.code}>
                  <VigilStatusChip value={level.code} />
                  <span>{level.label}</span>
                </li>)}
              </ul>
              <div className="vigil-severity-unassessed">
                <VigilStatusChip value="SU" />
                <p><strong>Unassessed.</strong> SU applies when the evidence cannot support a defensible S1–S5 band and does not positively establish no materialised downstream harm. SU records uncertainty; it is <strong>not a sixth severity band</strong> or a finding that no harm occurred.</p>
              </div>
              <p>S1 also requires affirmative support for minimal or no materialised harm within the relevant evidence. Missing reports of harm do not, by themselves, justify S1.</p>
            </div>
          </section>

          <section id="method" className="document-section vigil-about-section vigil-severity-methodology-section" aria-labelledby="severity-principles-heading">
            <div className="document-section-heading">
              <p>Assessment method</p>
              <h2 id="severity-principles-heading">Evidence states</h2>
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

          </section>

          <section id="pathways" className="document-section vigil-severity-methodology-section" aria-labelledby="harm-pathways-heading">
            <div className="document-section-heading"><p>Assessment pathways</p><h2 id="harm-pathways-heading">Select the pathway before scoring</h2></div>
            <div className="document-reading">
              <p>{HARM_PUBLIC_PATHWAY_COPY.intro}</p>
              <div className="vigil-harm-pathway-comparison">
                <div>
                  <h3>Specific consequence</h3>
                  <p>{HARM_PUBLIC_PATHWAY_COPY.specific}</p>
                </div>
                <div>
                  <h3>Aggregate Harm — modelled</h3>
                  <p>{HARM_PUBLIC_PATHWAY_COPY.aggregate}</p>
                </div>
              </div>
              <h3>What makes an Aggregate Harm assessment appropriate?</h3>
              <p>{HARM_PUBLIC_PATHWAY_COPY.routing}</p>
              <p>{HARM_PUBLIC_PATHWAY_COPY.banding}</p>
              <p>{HARM_PUBLIC_PATHWAY_COPY.limits}</p>
            </div>
          </section>
          <section id="aggregate" className="document-section vigil-severity-methodology-section" aria-labelledby="harm-aggregate-heading">
            <div className="document-section-heading"><p>Aggregate Harm</p><h2 id="harm-aggregate-heading">Evidence gates and separate severity criteria</h2></div>
            <div className="document-reading">
              <p>For a qualifying deployed-feature finding, the tables below show the <strong>separate S1–S5 Aggregate Harm criteria</strong> available in five scale-sensitive dimensions. These thresholds describe what evidence would justify a modelled collective-impact band; they do not turn eligible users into confirmed victims.</p>
              <p>Each band requires both a relevant, source-backed feature-specific population or real-decision denominator and evidence supporting the stated consequences. An observed behaviour or a large audience alone cannot establish the result. Other harm dimensions retain the ordinary consequence criteria in the matrix.</p>
              <p>These operational brackets are defined by VIGIL and are <strong>not externally validated clinical severity conversions</strong>. Where the prerequisites for any band remain unproven, the aggregate assessment is SU. Ordinary recovery durations are illustrative rather than mandatory waiting periods.</p>
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
