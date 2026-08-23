import { useState, type ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

const citations = [
  {
    label: "Umbrella CAM Initiative citation",
    citation: "CAM Initiative. CAM Initiative public governance infrastructure. 2026. https://www.cam-initiative.org",
  },
  {
    label: "VIGIL citation",
    citation: "CAM Initiative. VIGIL: Evidence-to-Repair Governance Ledger. 2026. https://www.cam-initiative.org/vigil",
  },
  {
    label: "CAM governance corpus citation",
    citation: "O’Rourke, M. V. (2026). Caelestis Architecture Model / CAM governance corpus. Zenodo. https://zenodo.org/records/20686316",
  },
];

const maintainedLayers = [
  {
    label: "Global governance architecture",
    eyebrow: "CAM governance corpus",
    body: "Constitutional instruments, domain instruments, annexes, schedules, supplements, taxonomies, and governance doctrine.",
  },
  {
    label: "VIGIL evidence-to-repair system",
    eyebrow: "Evidence, diagnosis and repair",
    body: "Public observations, failure modes, proposals, patches, accountability gaps, design failures, and traceable repair activity.",
  },
  {
    label: "Public datasets",
    eyebrow: "Machine-readable governance reference data",
    body: "Downloadable governance-source, external-requirement and developing failure-taxonomy datasets maintained through VIGIL for research, comparison, audit, and independent analysis.",
  },
  {
    label: "Taxonomies and metadata standards",
    eyebrow: "Controlled vocabularies",
    body: "Record schemas, failure classifications, domain codes, crosswalks, lifecycle states, and validation guidance.",
  },
  {
    label: "Public catalogue and implementation materials",
    eyebrow: "Publication infrastructure",
    body: "Website materials, repository documentation, validator guidance, and public-facing summaries.",
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

  return (
    <button
      aria-label="Copy citation"
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={handleCopy}
      type="button"
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SectionHeading({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-cam-gold">{eyebrow}</p>
      <hr className="gold-rule flex-1" />
    </div>
  );
}

function ContentPanel({ children }: { children: ReactNode }) {
  return <article className="rounded-2xl border border-border/80 bg-background/30 p-6 shadow-sm">{children}</article>;
}

export default function About() {
  return (
    <Shell>
      <main className="container mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
        <motion.header animate={{ opacity: 1, y: 0 }} className="mb-14" initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.7 }}>
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Public-benefit governance infrastructure</p>
          <h1 className="mb-3 font-serif text-4xl leading-tight text-foreground md:text-5xl">About the CAM Initiative</h1>
          <hr className="gold-rule mb-8 w-24" />
        </motion.header>

        <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.7 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
          <SectionHeading eyebrow="Institutional context" />
          <ContentPanel>
            <div className="space-y-4 text-base leading-relaxed text-foreground/75">
              <p>
                The CAM Initiative is an independent Australian, unincorporated public-benefit AI governance initiative founded and led by Dr Michelle Vivian O’Rourke. It provides the public institutional identity through which the CAELESTIS Architecture Model, VIGIL, associated governance datasets, and policy materials are developed, maintained and published.
              </p>
              <p>
                The CAM Initiative and the Caelestis Architecture Model are not affiliated with the separate Caelestis project at{" "}
                <a className="text-cam-gold underline decoration-cam-gold/40 underline-offset-4 hover:text-foreground" href="https://caelestis-project.eu/" rel="noreferrer" target="_blank">
                  caelestis-project.eu
                </a>
                .
              </p>
            </div>
          </ContentPanel>
        </motion.section>

        <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.7 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
          <SectionHeading eyebrow="Purpose" />
          <ContentPanel>
            <div className="space-y-4 text-base leading-relaxed text-foreground/75">
              <p>
                The CAM Initiative develops open governance architecture for increasingly capable AI systems and the institutions responsible for them. Its work connects constitutional and operational controls, external governance requirements, evidence-to-repair methods, machine-readable reference data, and public policy analysis.
              </p>
              <p>
                VIGIL provides the empirical feedback layer: observed failures and governance evidence can be recorded, classified, traced to affected controls, and used to support review, repair and verification.
              </p>
            </div>
          </ContentPanel>
        </motion.section>

        <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.7 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
          <SectionHeading eyebrow="Why it matters" />
          <ContentPanel>
            <div className="space-y-4 text-base leading-relaxed text-foreground/75">
              <p>The CAM Initiative began from the question of how increasingly capable AI systems can be governed at runtime across conflicting instructions, jurisdictions, institutions, technical environments, and social contexts.</p>
              <p>CAM treats governance as an architecture rather than a policy statement alone: a constraint model, an arbitration structure, and a runtime-facing language for responsibility.</p>
              <p>VIGIL records what happens in practice so observed failures can become reviewable evidence and accountable repair.</p>
            </div>
          </ContentPanel>
        </motion.section>

        <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.7 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
          <SectionHeading eyebrow="What the CAM Initiative maintains" />
          <div className="grid gap-4 md:grid-cols-2">
            {maintainedLayers.map((layer, index) => (
              <motion.article className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm" initial={{ opacity: 0, y: 8 }} key={layer.label} transition={{ duration: 0.45, delay: index * 0.06 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
                <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">{layer.eyebrow}</p>
                <h2 className="mb-3 font-serif text-xl leading-snug text-foreground md:text-2xl">{layer.label}</h2>
                <p className="text-base leading-relaxed text-foreground/75">{layer.body}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.7 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
          <SectionHeading eyebrow="Privacy and public access" />
          <ContentPanel>
            <div className="flex flex-col gap-5 text-base leading-relaxed text-foreground/75 md:flex-row md:items-center md:justify-between">
              <p className="max-w-3xl">The public site does not provide user accounts or a private upload portal. The privacy policy explains what information may be received through ordinary website access and direct email contact.</p>
              <a className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-card/85 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/privacy">
                Read the privacy policy
              </a>
            </div>
          </ContentPanel>
        </motion.section>

        <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.7 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
          <div id="citations" className="scroll-mt-24"><SectionHeading eyebrow="Citation / public access" /></div>
          <ContentPanel>
            <div className="mb-5 space-y-3 text-base leading-relaxed text-foreground/75">
              <p>CAM materials are publicly accessible for reference, governance development, research, and public-interest use.</p>
              <p>Public access does not waive citation, copyright, trademark, attribution, or applicable licence requirements. Cite the relevant CAM instrument or VIGIL record directly where possible.</p>
            </div>
            <div className="space-y-4">
              {citations.map((item) => (
                <div className="rounded-xl border border-border/90 bg-card/85 p-4" key={item.label}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">{item.label}</p>
                    <CopyButton text={item.citation} />
                  </div>
                  <blockquote className="border-l-2 border-cam-gold/70 pl-4 font-mono text-sm leading-relaxed text-foreground md:text-[15px]">{item.citation}</blockquote>
                </div>
              ))}
            </div>
          </ContentPanel>
        </motion.section>
      </main>
    </Shell>
  );
}
