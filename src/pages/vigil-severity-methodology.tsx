import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { HarmImpactMatrix } from "@/components/vigil/HarmImpactMatrix";

export default function VigilSeverityMethodology() {
  return <Shell>
    <main className="vigil-about-page vigil-severity-methodology-page">
      <div className="container mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
        <header className="vigil-about-hero">
          <p className="vigil-library-kicker">VIGIL Observatory · VIGIL-HIM 1.0.0</p>
          <h1>Harm & Severity Methodology</h1>
          <p>VIGIL severity is an occurrence-level assessment of supported materialised consequence. It is deliberately separate from taxonomy classification, source prestige, workflow priority and hypothetical worst-case harm.</p>
        </header>

        <article className="vigil-severity-methodology-document">
          <section className="vigil-severity-methodology-section" aria-labelledby="severity-principles-heading">
            <header>
              <p className="vigil-library-kicker">Method</p>
              <h2 id="severity-principles-heading">How the overall severity band is derived</h2>
            </header>
            <div className="vigil-severity-principles">
              <div><h3>Evidence state first</h3><p>Each harm dimension is recorded as assessed, unreported, insufficient evidence or not applicable. Missing publication evidence is not converted into S1.</p></div>
              <div><h3>Highest supported harm</h3><p>The highest defensible materialised-harm threshold controls the overall severity. Dimensions are not averaged, summed or increased because an Incident has several taxonomy classifications.</p></div>
              <div><h3>SU remains unassessed</h3><p>SU is used when the evidence cannot support a defensible overall band. It is an evidence state, not a sixth severity band.</p></div>
            </div>
          </section>

          <section className="vigil-severity-methodology-section" aria-labelledby="severity-matrix-heading">
            <header>
              <p className="vigil-library-kicker">Reference matrix</p>
              <h2 id="severity-matrix-heading">VIGIL Harm Impact Matrix</h2>
            </header>
            <p>The matrix below publishes the threshold criteria for every VIGIL harm dimension and each S1–S5 band. Bold text marks quantitative or grave-consequence thresholds that are especially useful when scanning the table; the full wording of each cell remains controlling.</p>
            <p className="vigil-severity-alignment"><strong>External alignment.</strong> VIGIL aligns the direction of its five-level scale with established AI harm-assessment practice: the <a href="https://airisk.mit.edu/ai-incident-tracker/harm-taxonomy">MIT AI Incident Tracker harm-severity scale</a> runs from 1 (Negligible) to 5 (Catastrophic) and uses harm categories based on the <a href="https://cset.georgetown.edu/wp-content/uploads/20230022-Adding-structure-to-AI-Harm-FINAL.pdf">CSET AI Harm Framework</a>. VIGIL also adapts functional-impact and recoverability concepts from CISA, NIST, NIS2, DORA and ASD. These sources inform VIGIL; their scales are not interchangeable with VIGIL-HIM.</p>
            <HarmImpactMatrix />
          </section>

          <section className="vigil-severity-methodology-section" aria-labelledby="severity-case-files-heading">
            <header>
              <p className="vigil-library-kicker">Case Files</p>
              <h2 id="severity-case-files-heading">The Incident view shows only the assessment that was actually made</h2>
            </header>
            <p>Individual Case Files do not repeat this entire reference matrix. They show the occurrence-specific evidence state, supported band, threshold ID and assessment basis for each relevant dimension, together with any observed quantitative values and the dimension or dimensions controlling the overall severity.</p>
            <Link className="vigil-about-action" href="/observatory/cases">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
          </section>
        </article>
      </div>
    </main>
  </Shell>;
}
