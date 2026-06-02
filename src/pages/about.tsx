import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

const CITATION =
  "CAM Initiative. Caelestis Architecture Model public governance infrastructure. Maintained by Aeon Governance Lab. 2026. https://www.cam-initiative.org";

const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.07)";

const maintainedLayers = [
  {
    label: "CAM / Caelestis Architecture Model",
    eyebrow: "Governance architecture",
    body: "A public governance corpus for advanced AI systems and synthetic agents, including constitutional instruments, annexes, schedules, domain charters, runtime-facing specifications, registries, and operational governance logic.",
  },
  {
    label: "VIGIL Observatory",
    eyebrow: "Evidence-to-repair register",
    body: "A public observatory for observations, failure modes, proposals, patch notes, source records, and repair pathways that can be reviewed, cited, and connected back to CAM governance work.",
  },
  {
    label: "Stewardship & Maintenance",
    eyebrow: "Release continuity",
    body: "The coordination layer for drafting, registry review, public release infrastructure, maintenance cadence, citation support, and continuity of the CAM Initiative.",
  },
];

const contactLinks = [
  {
    label: "ethics@cam-initiative.org",
    href: "mailto:ethics@cam-initiative.org",
    external: false,
  },
  {
    label: "@CAM_Initiative",
    href: "https://x.com/CAM_Initiative",
    external: true,
  },
  {
    label: "GitHub",
    href: "https://github.com/CAM-Initiative/Caelestis",
    external: true,
  },
  {
    label: "Support",
    href: "https://buymeacoffee.com/cam_initiative",
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
      className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors"
      onClick={handleCopy}
      style={{ color: copied ? "#5A9E7A" : GOLD }}
      type="button"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
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

          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
            Public-benefit governance infrastructure
          </p>

          <h1 className="mb-6 font-serif text-4xl leading-tight text-foreground md:text-5xl">
            About the CAM Initiative
          </h1>

          <hr className="gold-rule mb-8 w-24" />

          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-light leading-relaxed text-muted-foreground md:text-base">
              The CAM Initiative maintains public governance infrastructure for advanced AI systems, synthetic agents, runtime governance environments, and digital ecosystem accountability.
            </p>
            <p className="text-sm font-light leading-relaxed text-muted-foreground md:text-base">
              Its work is intended to support careful public review: durable records, clear citations, visible maintenance pathways, and governance materials that can be inspected without requiring institutional gatekeeping.
            </p>
          </div>
        </motion.header>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
              What We Maintain
            </p>
            <hr className="gold-rule flex-1" />
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div
              aria-label="CAM triskelion mark"
              className="flex min-h-72 items-center justify-center rounded-3xl border border-primary/20 bg-card/45 p-8"
            >
              <img
                alt="CAM Initiative triskelion emblem"
                className="h-auto w-full max-w-64 opacity-90 mix-blend-screen drop-shadow-[0_0_28px_rgba(184,147,90,0.22)]"
                src="/favicon.svg"
              />
            </div>

            <div className="space-y-4">
              {maintainedLayers.map((layer, index) => (
                <motion.article
                  className="rounded-2xl border border-primary/20 bg-card/65 p-5"
                  initial={{ opacity: 0, y: 8 }}
                  key={layer.label}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
                    {layer.eyebrow}
                  </p>
                  <h2 className="mb-3 font-serif text-lg leading-snug text-foreground">
                    {layer.label}
                  </h2>
                  <p className="text-sm font-light leading-relaxed text-muted-foreground">
                    {layer.body}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div
            className="rounded-2xl px-5 py-4 md:px-6"
            style={{
              backgroundColor: GOLD_BG,
              borderLeft: `3px solid ${GOLD_BORDER}`,
            }}
          >
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-primary">
              Interface note
            </p>
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              The CAM Governance Interface is a public access and presentation layer for selected CAM and VIGIL materials. It is not a governance pillar, and it is not the canonical source of all underlying governance records. Canonical governance records, source files, registries, repository histories, and release metadata remain in the underlying CAM Initiative repositories and source systems.
            </p>
          </div>
        </motion.section>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
              Citation
            </p>
            <hr className="gold-rule flex-1" />
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              backgroundColor: GOLD_BG,
              border: `1px solid ${GOLD_BORDER}`,
            }}
          >
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
              Umbrella citation
            </p>
            <blockquote
              className="mb-5 border-l-2 pl-4 font-mono text-[13px] leading-relaxed text-foreground"
              style={{ borderColor: GOLD }}
            >
              {CITATION}
            </blockquote>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-md text-xs font-light leading-relaxed text-muted-foreground">
                Specific CAM instruments and VIGIL records should be cited directly where applicable, using the relevant record, instrument, repository path, DOI, or citation metadata when available.
              </p>
              <CopyButton text={CITATION} />
            </div>
          </div>
        </motion.section>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
              Contact &amp; Support
            </p>
            <hr className="gold-rule flex-1" />
          </div>

          <p className="mb-6 text-sm font-light leading-relaxed text-muted-foreground">
            For ethics, governance, citation, reuse, collaboration, or support enquiries, contact the initiative directly.
          </p>

          <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
            {contactLinks.map((link) => (
              <a
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                href={link.href}
                key={link.label}
                rel={link.external ? "noreferrer" : undefined}
                target={link.external ? "_blank" : undefined}
              >
                {link.label}
                {link.external && <span className="opacity-50">↗</span>}
              </a>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
              Stewardship
            </p>
            <hr className="gold-rule flex-1" />
          </div>

          <div className="rounded-2xl border border-border bg-card/55 p-6">
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              The CAM Initiative was founded in Perth, Western Australia. It is an unincorporated public-benefit, non-profit governance initiative. Stewardship of the initiative, release coordination and maintenance are managed by Dr Michelle Vivian O&apos;Rourke, Director of the Phoenix Covenant Pty Ltd. Aeon Governance Lab is a pending trademark of the Phoenix Covenant Pty Ltd.
            </p>
          </div>
        </motion.section>

        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
              Reuse &amp; Licence
            </p>
            <hr className="gold-rule flex-1" />
          </div>

          <div className="rounded-2xl border border-border bg-card/55 p-6">
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              Public access supports transparency, citation, review, research, journalism, policy analysis, and non-commercial governance use with attribution. Public access does not equal unrestricted reuse. Reuse rights differ by layer.
            </p>
          </div>
        </motion.section>
      </main>
    </Shell>
  );
}
