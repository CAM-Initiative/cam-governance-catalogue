import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { HarmImpactMatrix } from "@/components/vigil/HarmImpactMatrix";

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

export default function VigilSeverityMethodology() {
  return <Shell>
    <main className="vigil-about-page vigil-severity-methodology-page">
      <div className="container mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:px-10 md:py-11">
        <header className="vigil-about-hero">
          <p className="vigil-library-kicker">VIGIL Observatory · VIGIL-HIM 1.0.0</p>
          <h1>Harm & Severity Methodology</h1>
          <p>VIGIL Observatory severity is an incident-level assessment of supported materialised consequence. It is deliberately separate from taxonomy classification, source prestige, workflow priority and hypothetical worst-case harm.</p>
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
              <h2 id="severity-matrix-heading">VIGIL Observatory Harm Impact Matrix</h2>
            </header>
            <p>The matrix below publishes the threshold criteria for every VIGIL Observatory harm dimension and each S1–S5 band. Bold text marks quantitative or grave-consequence thresholds that are especially useful when scanning the table; the full wording of each cell remains controlling.</p>
            <p className="vigil-severity-alignment"><strong>External alignment.</strong> VIGIL Observatory aligns the direction of its five-level scale with established AI harm-assessment practice: the <a href="https://airisk.mit.edu/ai-incident-tracker/harm-taxonomy">MIT AI Incident Tracker harm-severity scale</a> runs from 1 (Negligible) to 5 (Catastrophic) and uses harm categories based on the <a href="https://cset.georgetown.edu/wp-content/uploads/20230022-Adding-structure-to-AI-Harm-FINAL.pdf">CSET AI Harm Framework</a>. VIGIL Observatory also adapts functional-impact and recoverability concepts from CISA, NIST, NIS2, DORA and ASD. These sources inform VIGIL Observatory; their scales are not interchangeable with VIGIL-HIM.</p>
            <HarmImpactMatrix />
          </section>

          <section className="vigil-severity-methodology-section" aria-labelledby="severity-case-files-heading">
            <header>
              <p className="vigil-library-kicker">Case Files</p>
              <h2 id="severity-case-files-heading">The Incident view shows only the assessment that was actually made</h2>
            </header>
            <p>Individual Case Files do not repeat this entire reference matrix. They show the incident-specific evidence state, supported band, threshold ID and assessment basis for each relevant dimension, together with any observed quantitative values and the dimension or dimensions controlling the overall severity.</p>
            <Link className="vigil-about-action" href="/observatory/cases/">Browse Case Files <ArrowRight aria-hidden="true" /></Link>
          </section>

          <section className="vigil-severity-methodology-section" aria-labelledby="severity-references-heading">
            <header>
              <p className="vigil-library-kicker">References</p>
              <h2 id="severity-references-heading">Methodology source trail</h2>
            </header>
            <p>The references below are the external sources registered against VIGIL-HIM 1.0.0. The alignment note above explains how those sources inform the methodology; this list preserves the source trail without repeating that discussion.</p>
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
