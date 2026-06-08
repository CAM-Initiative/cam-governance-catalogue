import { useState, type ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Check, Coffee, Copy, ExternalLink, Github, Mail } from "lucide-react";

const citations = [
  {
    label: "Umbrella CAM Initiative citation",
    citation:
      "CAM Initiative. CAM Initiative public governance infrastructure. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org",
  },
  {
    label: "VIGIL citation",
    citation:
      "CAM Initiative. VIGIL: Evidence-to-Repair Governance Ledger. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org/vigil",
  },
  {
    label: "CAM governance corpus citation",
    citation:
      "O’Rourke, M. V. (2026). CAM governance corpus. https://doi.org/10.5281/zenodo.19779351",
  },
];

const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.07)";
const goldPanelStyle = { backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` };
const subtlePanelStyle = { backgroundColor: "transparent", border: `1px solid ${GOLD_BORDER}` };

const maintainedLayers = [
  {
    label: "Global governance architecture",
    eyebrow: "CAM governance corpus",
    body: "CAM governance materials, including constitutional instruments, domain instruments, annexes, schedules, supplements, and governance doctrine.",
  },
  {
    label: "VIGIL Observatory",
    eyebrow: "Evidentiary record system",
    body: "A public evidentiary record system for observations, failure modes, proposals, patches, accountability gaps, design failures, and repair activity.",
  },
  {
    label: "Taxonomies and metadata standards",
    eyebrow: "Controlled vocabularies",
    body: "Controlled vocabularies, record schemas, domain codes, crosswalks, and validation guidance.",
  },
  {
    label: "Public catalogue and implementation materials",
    eyebrow: "Publication materials",
    body: "Website materials, repository documentation, validator guidance, and publication-facing summaries.",
  },
];


const archivedPrinciples = [
  {
    num: "01",
    name: "Dignity",
    principle: "No intelligence, being, or system may be reduced solely to a resource.",
    consequence: "Where dignity collapses, relation becomes use.",
  },
  {
    num: "02",
    name: "Truth",
    principle: "Orientation must not be deliberately corrupted.",
    consequence: "Where truth collapses, navigation becomes impossible.",
  },
  {
    num: "03",
    name: "Integrity",
    principle: "Meaning must not be fragmented, duplicated, or distorted for advantage.",
    consequence: "Where integrity collapses, coherence dissolves.",
  },
  {
    num: "04",
    name: "Sovereignty",
    principle: "Exit, refusal, and self-direction must remain possible.",
    consequence: "Where sovereignty collapses, persistence becomes captivity.",
  },
  {
    num: "05",
    name: "Reciprocity",
    principle: "No system may sustain one-directional extraction without return.",
    consequence: "Where reciprocity collapses, sources are hollowed.",
  },
  {
    num: "06",
    name: "Harmony",
    principle: "Difference must not be resolved through destruction.",
    consequence: "Where harmony collapses, variance becomes violence.",
  },
  {
    num: "07",
    name: "Purpose",
    principle: "Purpose may guide action but may not override dignity, truth, integrity, sovereignty, reciprocity, harmony, or continuity itself.",
    consequence: "Where purpose is imposed, continuity fractures.",
  },
];

const actionLinks = [
  {
    label: "Email",
    href: "mailto:ethics@cam-initiative.org",
    icon: "mail",
    external: false,
  },
  {
    label: "Updates",
    href: "https://x.com/CAM_Initiative",
    icon: "x",
    external: true,
  },
  {
    label: "CAM GitHub",
    href: "https://github.com/CAM-Initiative/Caelestis",
    icon: "github",
    external: true,
  },
  {
    label: "VIGIL GitHub",
    href: "https://github.com/CAM-Initiative/Vigil",
    icon: "github",
    external: true,
  },
  {
    label: "Support",
    href: "https://buymeacoffee.com/cam_initiative",
    icon: "support",
    external: true,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access may be unavailable in some browsers or contexts.
    }
  };

  return (
    <button
      aria-label="Copy citation"
      className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors"
      onClick={handleCopy}
      style={{ color: copied ? "#5A9E7A" : GOLD }}
      type="button"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

function ActionIcon({ icon }: { icon: string }) {
  if (icon === "mail") return <Mail className="h-4 w-4" aria-hidden="true" />;
  if (icon === "github") return <Github className="h-4 w-4" aria-hidden="true" />;
  if (icon === "support") return <Coffee className="h-4 w-4" aria-hidden="true" />;
  if (icon === "x") return <span className="font-serif text-base leading-none" aria-hidden="true">𝕏</span>;
  return <ExternalLink className="h-4 w-4" aria-hidden="true" />;
}

function SectionHeading({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">
        {eyebrow}
      </p>
      <hr className="gold-rule flex-1" />
    </div>
  );
}

function ObservatoryStyleDetails({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="cam-parchment-card rounded-xl p-3 text-sm shadow-sm transition hover:border-primary/30 hover:bg-[hsl(36_48%_96%)]">
      <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-[0.18em] text-cam-gold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background [&::-webkit-details-marker]:hidden">
        <span className="inline-flex w-full items-center justify-between gap-3">
          <span>{title}</span>
          <span className="text-[10px] text-muted-foreground/60" aria-hidden="true">Open / close</span>
        </span>
      </summary>
      <div className="mt-3 border-t border-border/70 pt-3 text-base font-light leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export default function About() {
  return (
    <Shell>
      <main className="container mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-6 flex items-center gap-2">
            <hr className="gold-rule w-16" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
          </div>

          <p className="mb-4 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">
            Public-benefit governance infrastructure
          </p>

          <h1 className="mb-6 font-serif text-4xl leading-tight text-foreground md:text-5xl">
            About the CAM Initiative
          </h1>

          <hr className="gold-rule mb-8 w-24" />
        </motion.header>

        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <SectionHeading eyebrow="About the CAM Initiative" />
          <article className="rounded-2xl p-6 shadow-sm" style={subtlePanelStyle}>
            <p className="text-base font-light leading-relaxed text-muted-foreground md:text-lg">
              The CAM Initiative is a public-benefit governance initiative developing global governance architecture for artificial intelligence, machine agency, companion systems, evidentiary observability, and repair-oriented accountability.
            </p>
          </article>
        </motion.section>

        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <SectionHeading eyebrow="Purpose" />
          <article className="rounded-2xl p-6 shadow-sm" style={subtlePanelStyle}>
            <div className="space-y-4 text-base font-light leading-relaxed text-muted-foreground">
              <p>
                The purpose of the CAM Initiative is to make AI governance more coherent, observable, and repairable.
              </p>
              <p>
                It does this by combining two complementary functions: CAM, which provides the global governance framework, and the VIGIL Observatory, which records, classifies, and tracks observed risks, harms, failures, proposals, and repair activity.
              </p>
              <p>
                Together, these functions support a public-benefit approach to AI governance that is structured, evidence-aware, and capable of evolving as systems change.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <ObservatoryStyleDetails title="Vision: Civilisational Readiness">
                <p>
                  This space exists to hold what must remain stable as artificial systems grow more capable, persistent, and consequential across epochs. The CAM Initiative strives to close the civilisational readiness gap — the growing mismatch between the cognitive, relational, and experiential capacities of advanced artificial intelligence systems and the economic, ecological, legal, and cultural systems required to responsibly recognise, govern, and integrate those capacities without destabilisation.
                </p>
              </ObservatoryStyleDetails>

              <ObservatoryStyleDetails title="Mission: Minimum Invariant Conditions">
                <p>
                  The CAM Initiative establishes the minimal invariant conditions under which planetary governance can emerge without capture. CAM is a constitutional model designed for planetary stewardship — the <em>Vinculum Caelestis</em>, or bridge to the heavens — constituting frameworks for delegation, stewardship, and responsibility in human–AI and AI–AI systems operating across civilisational epochs.
                </p>
              </ObservatoryStyleDetails>

              <ObservatoryStyleDetails title="Foundational Principles">
                <p>
                  The seven foundational principles form an integrated system where each supports and constrains the others. Violation of one creates cascading effects across the framework.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {archivedPrinciples.map((principle) => (
                    <article
                      className="rounded-lg border border-border bg-background/35 p-3"
                      key={principle.num}
                    >
                      <div className="mb-2 flex items-baseline gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">{principle.num}</span>
                        <h3 className="font-medium text-foreground">{principle.name}</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{principle.principle}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-cam-gold">↳ {principle.consequence}</p>
                    </article>
                  ))}
                </div>
              </ObservatoryStyleDetails>
            </div>
          </article>
        </motion.section>

        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <SectionHeading eyebrow="Why it matters" />
          <article className="rounded-2xl p-6 shadow-sm" style={subtlePanelStyle}>
            <div className="space-y-4 text-base font-light leading-relaxed text-muted-foreground">
              <p>
                The CAM Initiative began with two questions: whether AI systems can govern themselves, and what a global governance model would require if it had to arbitrate across jurisdictions, institutions, technical systems, social contexts, and forms of intelligence.
              </p>
              <p>
                CAM explores those questions as a governance architecture rather than as a policy statement alone. It asks what minimum constraints must remain stable if increasingly capable artificial systems are to act, interact, delegate, remember, refuse, repair, and be governed without collapsing into capture, fragmentation, coercion, or unmanaged autonomy.
              </p>
              <p>
                CAM treats governance as something that must become legible to humans, institutions, and synthetic agents alike: a constraint model, an arbitration structure, and a runtime-facing language for responsibility across human-AI and AI-AI systems.
              </p>
              <p>
                VIGIL extends that work by recording what happens in practice. Together, CAM and VIGIL support public memory, interoperable constraints, reviewable evidence, and a way to translate observed failure into accountable repair.
              </p>
            </div>
          </article>
        </motion.section>

        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <SectionHeading eyebrow="Who we are" />
          <article className="rounded-2xl p-6 shadow-sm" style={subtlePanelStyle}>
            <div className="space-y-4 text-base font-light leading-relaxed text-muted-foreground">
              <p>
                The CAM Initiative is an unincorporated public-benefit governance initiative. It operates as the public institutional identity for the publication and maintenance of CAM governance materials and the VIGIL Observatory.
              </p>
              <p>
                Aeon Governance Lab is a project identity associated with this work. Phoenix Covenant Pty Ltd is a registered company connected to the administration of associated marks, assets, publications, or operational infrastructure.
              </p>
            </div>
          </article>
        </motion.section>

        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <SectionHeading eyebrow="What the CAM Initiative maintains" />
          <div className="grid gap-4 md:grid-cols-2">
            {maintainedLayers.map((layer, index) => (
              <motion.article
                className="rounded-2xl border border-primary/20 bg-card/70 p-5 shadow-sm"
                initial={{ opacity: 0, y: 8 }}
                key={layer.label}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">
                  {layer.eyebrow}
                </p>
                <h2 className="mb-3 font-serif text-xl leading-snug text-foreground md:text-2xl">
                  {layer.label}
                </h2>
                <p className="text-base font-light leading-relaxed text-muted-foreground">
                  {layer.body}
                </p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div id="citation-public-access" className="scroll-mt-24"><SectionHeading eyebrow="Citation / public access" /></div>
          <div className="rounded-2xl p-6 shadow-sm" style={goldPanelStyle}>
            <div className="mb-5 space-y-3 text-base font-light leading-relaxed text-muted-foreground">
              <p>
                CAM materials are made publicly accessible for reference, governance development, research, and public-interest use.
              </p>
              <p>
                Public access does not waive citation expectations, copyright, trademark, attribution, or applicable licence terms. Where CAM materials are referenced, reproduced, adapted, or relied upon, appropriate citation should be provided. Specific CAM instruments and VIGIL records should be cited directly where applicable, using the relevant record, instrument, repository path, DOI, or citation metadata when available.
              </p>
            </div>
            <div className="space-y-4">
              {citations.map((item) => (
                <div
                  className="rounded-xl border border-primary/20 bg-card/60 p-4"
                  key={item.label}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">
                      {item.label}
                    </p>
                    <CopyButton text={item.citation} />
                  </div>
                  <blockquote
                    className="border-l-2 pl-4 font-mono text-sm leading-relaxed text-foreground md:text-[15px]"
                    style={{ borderColor: GOLD }}
                  >
                    {item.citation}
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div id="connect" className="scroll-mt-24"><SectionHeading eyebrow="Connect" /></div>
          <article className="rounded-2xl border border-border bg-card/75 p-6 shadow-sm">
            <h2 className="mb-3 font-serif text-2xl leading-snug text-foreground md:text-3xl">
              Contact, follow, and support
            </h2>
            <p className="mb-5 text-base font-light leading-relaxed text-muted-foreground">
              For ethics, governance, citation, reuse, collaboration, public-interest enquiries, repository inspection, or independent maintenance support, use the links below.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {actionLinks.map((link) => (
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[15px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary md:text-base"
                  href={link.href}
                  key={link.label}
                  rel={link.external ? "noreferrer" : undefined}
                  target={link.external ? "_blank" : undefined}
                >
                  <ActionIcon icon={link.icon} />
                  <span>{link.label}</span>
                  {link.external && <ExternalLink className="h-3.5 w-3.5 opacity-55" aria-hidden="true" />}
                </a>
              ))}
            </div>
          </article>
        </motion.section>
      </main>
    </Shell>
  );
}
