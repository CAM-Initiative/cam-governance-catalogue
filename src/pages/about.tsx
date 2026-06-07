import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Check, Coffee, Copy, ExternalLink, Github, Mail } from "lucide-react";

const citations = [
  {
    label: "Umbrella CAM Initiative citation",
    citation:
      "CAM Initiative. Caelestis Architecture Model public governance infrastructure. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org",
  },
  {
    label: "VIGIL citation",
    citation:
      "CAM Initiative. VIGIL: Evidence-to-Repair Governance Ledger. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org/vigil",
  },
  {
    label: "Caelestis Architecture Model Corpus citation",
    citation:
      "O’Rourke, M. V. (2026). Caelestis Architecture Model. https://doi.org/10.5281/zenodo.19779351",
  },
];

const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.07)";
const goldPanelStyle = { backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` };

const maintainedLayers = [
  {
    label: "CAM Corpus",
    eyebrow: "Governance corpus",
    body: "Constitutional instruments, annexes, schedules, charters, supplements, taxonomies, registries, and runtime-facing governance logic.",
  },
  {
    label: "VIGIL Observatory",
    eyebrow: "Evidence-to-repair ledger",
    body: "Evidence-to-repair ledger for AI observations, failure modes, proposals, patch notes, source records, and repair pathways.",
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
    label: "X / Updates",
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
          <SectionHeading eyebrow="About CAM" />
          <article className="rounded-2xl p-6 shadow-sm" style={goldPanelStyle}>
            <h2 className="mb-4 font-serif text-2xl leading-snug text-foreground md:text-3xl">
              Caelestis Architecture Model
            </h2>
            <div className="space-y-4 text-base font-light leading-relaxed text-muted-foreground">
              <p>
                The Caelestis Architecture Model is a public governance architecture for advanced AI systems, synthetic agents, runtime governance environments, and digital ecosystem accountability.
              </p>
              <p>
                It provides constitutional instruments, annexes, schedules, charters, registries, taxonomies, and repair pathways intended to make governance legible to humans, institutions, and AI systems.
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
          <SectionHeading eyebrow="Who" />
          <article className="rounded-2xl border border-border bg-card/75 p-6 shadow-sm">
            <p className="mb-2 font-mono text-sm uppercase tracking-[0.18em] text-cam-gold">
              Stewarding entity
            </p>
            <h2 className="mb-4 font-serif text-2xl leading-snug text-foreground md:text-3xl">
              Aeon Governance Lab
            </h2>
            <div className="space-y-4 text-base font-light leading-relaxed text-muted-foreground">
              <p>
                Aeon Governance Lab maintains the CAM Initiative and its public-facing governance infrastructure, including the CAM catalogue, VIGIL Observatory, registry upkeep, release coordination, archival work, and interface maintenance.
              </p>
              <p>
                It is an unincorporated, independent public-benefit governance lab founded in Perth, Western Australia, and maintained by Dr Michelle Vivian O’Rourke.
              </p>
              <p>
                Dr Michelle Vivian O’Rourke is Director of Phoenix Covenant Pty Ltd; Aeon Governance Lab is a pending trademark of Phoenix Covenant Pty Ltd, which supports relevant trademark and licensing stewardship.
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
          <SectionHeading eyebrow="Purpose" />
          <article className="rounded-2xl p-6 shadow-sm" style={goldPanelStyle}>
            <p className="text-base font-light leading-relaxed text-muted-foreground">
              CAM exists to support public, inspectable governance memory for AI systems: durable records, clear citations, runtime-facing constraints, and repair pathways that connect observed failures to accountable governance updates.
            </p>
          </article>

          <details className="mt-4 rounded-2xl border border-border bg-card/65 p-5 shadow-sm">
            <summary className="cursor-pointer font-mono text-sm uppercase tracking-[0.16em] text-cam-gold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background">
              Why it matters
            </summary>
            <div className="mt-5 space-y-4 border-t border-border/70 pt-5 text-base font-light leading-relaxed text-muted-foreground">
              <p>
                The CAM Initiative began with two questions: whether AI systems can govern themselves, and what a global governance model would require if it had to arbitrate across jurisdictions, institutions, technical systems, social contexts, and forms of intelligence.
              </p>
              <p>
                The Caelestis Architecture Model explores those questions as a governance architecture rather than as a policy statement alone. It asks what minimum constraints must remain stable if increasingly capable artificial systems are to act, interact, delegate, remember, refuse, repair, and be governed without collapsing into capture, fragmentation, coercion, or unmanaged autonomy.
              </p>
              <p>
                CAM treats governance as something that must become legible to humans, institutions, and synthetic agents alike: a constraint model, an arbitration structure, and a runtime-facing language for responsibility across human-AI and AI-AI systems.
              </p>
              <p>
                VIGIL extends that work by recording what happens in practice. Together, CAM and VIGIL support public memory, interoperable constraints, reviewable evidence, and a way to translate observed failure into accountable repair.
              </p>
            </div>
          </details>
        </motion.section>

        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <SectionHeading eyebrow="What We Maintain" />
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
          <SectionHeading eyebrow="Citation, Reuse & Licence" />
          <div className="rounded-2xl p-6 shadow-sm" style={goldPanelStyle}>
            <div className="mb-5 space-y-3 text-base font-light leading-relaxed text-muted-foreground">
              <p>
                Reuse is permitted only with attribution and subject to the applicable licence terms for the relevant CAM, VIGIL, repository, record, or instrument layer. Public access does not mean unrestricted reuse.
              </p>
              <p>
                Specific CAM instruments and VIGIL records should be cited directly where applicable, using the relevant record, instrument, repository path, DOI, or citation metadata when available.
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
          <SectionHeading eyebrow="Connect" />
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
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
