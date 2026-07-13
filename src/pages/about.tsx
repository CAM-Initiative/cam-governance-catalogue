import { useState, type ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

const citations = [
  {
    label: "Umbrella CAM Initiative citation",
    citation: "CAM Initiative. CAM Initiative public governance infrastructure. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org",
  },
  {
    label: "VIGIL citation",
    citation: "CAM Initiative. VIGIL: Evidence-to-Repair Governance Ledger. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org/vigil",
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
    label: "VIGIL Ledger",
    eyebrow: "Evidence-to-repair record system",
    body: "Public observations, failure modes, proposals, patches, accountability gaps, design failures, and repair activity.",
  },
  {
    label: "Taxonomies and metadata standards",
    eyebrow: "Controlled vocabularies",
    body: "Record schemas, domain codes, crosswalks, lifecycle states, and validation guidance.",
  },
  {
    label: "Public catalogue and implementation materials",
    eyebrow: "Publication infrastructure",
    body: "Website materials, repository documentation, validator guidance, and public-facing summaries.",
  },
];

const principles = [
  { num: "01", name: "Dignity", principle: "No intelligence, being, or system may be reduced solely to a resource.", consequence: "Where dignity collapses, relation becomes use." },
  { num: "02", name: "Truth", principle: "Orientation must not be deliberately corrupted.", consequence: "Where truth collapses, navigation becomes impossible." },
  { num: "03", name: "Integrity", principle: "Meaning must not be fragmented, duplicated, or distorted for advantage.", consequence: "Where integrity collapses, coherence dissolves." },
  { num: "04", name: "Sovereignty", principle: "Exit, refusal, and self-direction must remain possible.", consequence: "Where sovereignty collapses, persistence becomes captivity." },
  { num: "05", name: "Reciprocity", principle: "No system may sustain one-directional extraction without return.", consequence: "Where reciprocity collapses, sources are hollowed." },
  { num: "06", name: "Harmony", principle: "Difference must not be resolved through destruction.", consequence: "Where harmony collapses, variance becomes violence." },
  { num: "07", name: "Purpose", principle: "Purpose may guide action but may not override dignity, truth, integrity, sovereignty, reciprocity, harmony, or continuity itself.", consequence: "Where purpose is imposed, continuity fractures." },
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
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(32_62%_25%)] transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      <p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">{eyebrow}</p>
      <hr className="gold-rule flex-1" />
    </div>
  );
}

function AboutDetails({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group overflow-hidden rounded-xl border border-border/80 bg-card/75 text-sm shadow-sm">
      <summary className="cursor-pointer list-none p-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="inline-flex w-full items-center gap-3">
          <span className="inline-block h-0 w-0 shrink-0 border-y-[0.35rem] border-l-[0.52rem] border-y-transparent border-l-[hsl(var(--primary))] transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
          <span>{title}</span>
        </span>
      </summary>
      <div className="border-t border-border/70 px-4 py-4 text-base leading-relaxed text-foreground/75">{children}</div>
    </details>
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
          <div className="mb-6 flex items-center gap-2">
            <hr className="gold-rule w-16" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
          </div>
          <p className="mb-4 font-mono text-[15px] font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">Public-benefit governance infrastructure</p>
          <h1 className="mb-6 font-serif text-4xl leading-tight text-foreground md:text-5xl">About the CAM Initiative</h1>
          <hr className="gold-rule mb-8 w-24" />
        </motion.header>

        <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.7 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
          <SectionHeading eyebrow="Institutional context" />
          <ContentPanel>
            <div className="space-y-4 text-base leading-relaxed text-foreground/75">
              <p>The CAM Initiative is an unincorporated public-benefit governance initiative. It operates as the public institutional identity for publication and maintenance of CAM governance materials and the VIGIL Ledger.</p>
              <p>Aeon Governance Lab is a project identity associated with this work. Phoenix Covenant Pty Ltd is a registered company connected to administration of associated marks, assets, publications, or operational infrastructure.</p>
              <p>The CAM Initiative and the Caelestis Architecture Model are not affiliated with the Caelestis project at https://caelestis-project.eu/.</p>
            </div>
          </ContentPanel>
        </motion.section>

        <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.7 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
          <SectionHeading eyebrow="Purpose" />
          <ContentPanel>
            <div className="grid gap-3">
              <AboutDetails title="Vision: Civilisational Readiness">
                <p>The CAM Initiative exists to help close the civilisational readiness gap: the mismatch between increasingly capable artificial systems and the legal, ecological, economic, relational, and cultural structures required to govern them responsibly.</p>
              </AboutDetails>
              <AboutDetails title="Mission: Minimum Invariant Conditions">
                <p>CAM develops minimum conditions for delegation, stewardship, responsibility, refusal, repair, and accountable continuity across human–AI and AI–AI systems.</p>
              </AboutDetails>
            </div>
          </ContentPanel>
        </motion.section>

        <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.7 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
          <SectionHeading eyebrow="Foundational principles" />
          <ContentPanel>
            <p className="mb-6 max-w-3xl text-base leading-relaxed text-foreground/75 md:text-[17px]">
              The seven principles operate as a connected ethical floor. Each supports and constrains the others; a failure in one can propagate across the framework.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {principles.map((principle) => (
                <article className="rounded-xl border border-border/90 bg-card/85 p-4 shadow-sm" key={principle.num}>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)]">{principle.num}</span>
                    <h2 className="font-serif text-xl text-foreground">{principle.name}</h2>
                  </div>
                  <p className="text-base leading-relaxed text-foreground/85 md:text-[17px]">{principle.principle}</p>
                  <p className="mt-4 border-l-2 border-cam-gold/70 pl-3 text-sm font-medium leading-relaxed text-foreground/75">{principle.consequence}</p>
                </article>
              ))}
            </div>
          </ContentPanel>
        </motion.section>

        <motion.section className="mb-12" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.7 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
          <SectionHeading eyebrow="Why it matters" />
          <ContentPanel>
            <div className="space-y-4 text-base leading-relaxed text-foreground/75">
              <p>The CAM Initiative began with two questions: whether AI systems can govern themselves, and what a global governance model would require if it had to arbitrate across jurisdictions, institutions, technical systems, social contexts, and forms of intelligence.</p>
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
                <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{layer.eyebrow}</p>
                <h2 className="mb-3 font-serif text-xl leading-snug text-foreground md:text-2xl">{layer.label}</h2>
                <p className="text-base leading-relaxed text-foreground/75">{layer.body}</p>
              </motion.article>
            ))}
          </div>
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
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{item.label}</p>
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
