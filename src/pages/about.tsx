import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { ExploreGovernanceRail } from "@/components/ExploreGovernanceRail";

const citations = [
  {
    label: "CAM Initiative",
    citation: "CAM Initiative. CAM Initiative public governance infrastructure. 2026. https://www.cam-initiative.org",
  },
  {
    label: "VIGIL",
    citation: "CAM Initiative. VIGIL: Evidence-to-Repair Governance Ledger. 2026. https://www.cam-initiative.org/vigil",
  },
  {
    label: "CAELESTIS Architecture Model",
    citation: "O’Rourke, M. V. (2026). Caelestis Architecture Model / CAM governance corpus. Zenodo. https://zenodo.org/records/20686316",
  },
];

const maintainedLayers = [
  {
    label: "VIGIL Observatory",
    eyebrow: "Evidence and diagnosis",
    body: "Public Case Files, evidence-to-repair records, review provenance and traceable governance learning.",
  },
  {
    label: "VIGIL AI Governance Failure Taxonomy",
    eyebrow: "Failure classification",
    body: "A structured classification reference for recurring AI governance failure mechanisms, organised into broad failure families and more precise failure classes with recognition criteria and exclusion boundaries.",
  },
  {
    label: "AI Governance Standards",
    eyebrow: "Compliance baseline",
    body: "A curated source and requirement reference for laws, standards, frameworks and technical guidance relevant to AI governance.",
  },
  {
    label: "Public datasets",
    eyebrow: "Machine-readable reference data",
    body: "Downloadable standards, source, requirement and emerging failure-taxonomy datasets for research, comparison and independent analysis.",
  },
  {
    label: "Policy",
    eyebrow: "Public-interest governance",
    body: "Policy papers and submissions that translate governance analysis, evidence and emerging technology risks into practical institutional proposals.",
  },
  {
    label: "CAELESTIS Architecture Model",
    eyebrow: "Governance architecture · refactoring",
    body: "The underlying governance architecture remains in active refactoring. The current public archival release is preserved through Zenodo while the website reference surface is being rebuilt.",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return <button className="public-reference-copy" type="button" onClick={handleCopy} aria-label="Copy citation">
    {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    {copied ? "Copied" : "Copy"}
  </button>;
}

function ReferenceSection({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: string; children: ReactNode }) {
  return <section className="public-reference-section">
    <header className="public-reference-section-heading">
      <span>{number}</span>
      <div><p>{eyebrow}</p><h2>{title}</h2></div>
    </header>
    <div className="public-reference-section-body">{children}</div>
  </section>;
}

export default function About() {
  return <Shell>
    <main className="public-reference-page">
      <div className="public-reference-layout container mx-auto px-4 py-8 sm:px-6 md:px-10 md:py-12">
        <div className="home-sticky-governance public-reference-governance-rail">
          <ExploreGovernanceRail />
        </div>

        <article className="public-reference-document">
          <header className="public-reference-hero">
            <p className="public-reference-kicker">CAM Initiative</p>
            <h1>About the CAM Initiative</h1>
            <p>The CAM Initiative is an independent Australian public-benefit AI governance initiative developing open governance infrastructure for understanding systems, diagnosing failures, supporting compliance and translating evidence into accountable repair.</p>
          </header>

          <ReferenceSection number="01" eyebrow="Institutional context" title="Independent public-interest governance work">
            <div className="public-reference-reading">
              <p>The CAM Initiative is founded and led by Dr Michelle Vivian O’Rourke. It provides the public institutional identity through which VIGIL, the CAELESTIS Architecture Model, governance datasets and policy materials are developed, maintained and published.</p>
              <p>The current public website deliberately concentrates on the surfaces that are mature enough to support public use. VIGIL, datasets and policy remain public; the CAELESTIS reference surface is being refactored rather than presented as settled architecture.</p>
            </div>
          </ReferenceSection>

          <ReferenceSection number="02" eyebrow="Purpose" title="Make governance obligations and system failure easier to see">
            <div className="public-reference-reading">
              <p>The Initiative connects AI governance architecture, external governance requirements, evidence-to-repair methods, machine-readable reference data and public policy analysis.</p>
              <p>VIGIL provides the empirical feedback layer: observed failures can be preserved as evidence, classified by mechanism, traced through governance response and revisited as systems and external requirements change.</p>
            </div>
          </ReferenceSection>

          <ReferenceSection number="03" eyebrow="Public work" title="What the CAM Initiative maintains">
            <div className="public-reference-list">
              {maintainedLayers.map((layer) => <article key={layer.label}>
                <div><p>{layer.eyebrow}</p><h3>{layer.label}</h3></div>
                <p>{layer.body}</p>
              </article>)}
            </div>
          </ReferenceSection>

          <ReferenceSection number="04" eyebrow="Access and independence" title="Public access without pretending everything is finished">
            <div className="public-reference-reading">
              <p>The public site does not provide user accounts or a private upload portal. Public materials are made available for reference, governance development, research and public-interest use, subject to the applicable citation, copyright, trademark and licence conditions.</p>
              <p>The CAM Initiative and the CAELESTIS Architecture Model are not affiliated with the separate Caelestis project at <a href="https://caelestis-project.eu/" target="_blank" rel="noreferrer">caelestis-project.eu</a>.</p>
              <p><a href="/privacy">Read the privacy policy →</a></p>
            </div>
          </ReferenceSection>

          <ReferenceSection number="05" eyebrow="Citation" title="How to cite the public work">
            <div className="public-reference-citations">
              {citations.map((item) => <article key={item.label}>
                <div className="public-reference-citation-heading"><h3>{item.label}</h3><CopyButton text={item.citation} /></div>
                <p>{item.citation}</p>
              </article>)}
            </div>
          </ReferenceSection>
        </article>
      </div>
    </main>
  </Shell>;
}
