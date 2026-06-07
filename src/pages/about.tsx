import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

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

const maintainedLayers = [
  {
    label: "CAM",
    eyebrow: "Governance corpus",
    body: "CAM is the Caelestis Architecture Model: a governance corpus composed of constitutional instruments, annexes, schedules, domain charters, runtime-facing specifications, agent-readable instructions, taxonomies, registries, and operational governance logic.",
  },
  {
    label: "VIGIL",
    eyebrow: "Evidence-to-repair ledger",
    body: "VIGIL records AI-system observations, failure modes, proposals, patch notes, source records, and governance-relevant repair pathways. It preserves source attribution, evidentiary context, routing state, classification posture, and repair history.",
  },
  {
    label: "Aeon Governance Lab",
    eyebrow: "Stewardship and maintenance",
    body: "Aeon Governance Lab supports stewardship, drafting, release coordination, registry upkeep, interface maintenance, archival work, and public infrastructure continuity for the CAM Initiative. The CAM Initiative was founded in Perth, Western Australia. It is an unincorporated public-benefit, non-profit governance initiative. Stewardship of the initiative, release coordination, and maintenance are managed by Dr Michelle Vivian O'Rourke, Director of the Phoenix Covenant Pty Ltd. Aeon Governance Lab is a pending trademark of the Phoenix Covenant Pty Ltd.",
  },
];

const contactLinks = [
  {
    label: "ethics@cam-initiative.org",
    href: "mailto:ethics@cam-initiative.org",
    external: false,
  },
];

const followLinks = [
  {
    label: "https://x.com/CAM_Initiative",
    href: "https://x.com/CAM_Initiative",
    external: true,
  },
  {
    label: "CAM / Caelestis GitHub",
    href: "https://github.com/CAM-Initiative/Caelestis",
    external: true,
  },
  {
    label: "VIGIL GitHub",
    href: "https://github.com/CAM-Initiative/Vigil",
    external: true,
  },
  {
    label: "CAM Governance Interface GitHub",
    href: "https://github.com/CAM-Initiative/cam-governance-catalogue",
    external: true,
  },
];

const supportLink = {
  label: "Support CAM Initiative",
  href: "https://buymeacoffee.com/cam_initiative",
};

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

          <p className="mb-4 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">
            Public-benefit governance infrastructure
          </p>

          <h1 className="mb-6 font-serif text-4xl leading-tight text-foreground md:text-5xl">
            About the CAM Initiative
          </h1>

          <hr className="gold-rule mb-8 w-24" />

        </motion.header>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">
              Purpose
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
            <div className="space-y-4 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
              <p>
                The CAM Initiative maintains public governance infrastructure for advanced AI systems, synthetic agents, runtime governance environments, and digital ecosystem accountability.
              </p>
              <p>
                Its work is intended to support careful public review: durable records, clear citations, visible maintenance pathways, and governance materials that can be inspected without requiring institutional gatekeeping.
              </p>
              <p>
                This website is the public access layer for browsing, searching, filtering, and citing CAM and VIGIL materials.
              </p>
              <div className="pt-2">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cam-gold">Purpose</p>
                <h2 className="font-serif text-2xl leading-snug text-foreground md:text-3xl">
                  Why the CAM Initiative exists
                </h2>
              </div>
              <p>The CAM Initiative began with two questions.</p>
              <p>
                First: can AI systems govern themselves, and if so, what would that actually require?
              </p>
              <p>
                Second: what would a global governance model look like if it had to arbitrate across different jurisdictions, institutions, technical systems, social contexts, and forms of intelligence?
              </p>
              <p>
                The Caelestis Architecture Model was built to explore those questions as a governance architecture rather than as a policy statement alone. It asks what minimum constraints must remain stable if increasingly capable artificial systems are to act, interact, delegate, remember, refuse, repair, and be governed without collapsing into capture, fragmentation, coercion, or unmanaged autonomy.
              </p>
              <p>
                CAM does not assume that governance can remain only external to AI systems. It treats governance as something that must become legible to humans, institutions, and synthetic agents alike: a constraint model, an arbitration structure, and a runtime-facing language for responsibility across human-AI and AI-AI systems.
              </p>
              <p>
                VIGIL extends that work by recording what happens in practice: observations, failure modes, proposals, patch notes, and repair pathways. Where CAM asks what governance must be able to hold, VIGIL records where existing systems appear to strain, fail, adapt, or require repair.
              </p>
              <p>
                Together, CAM and VIGIL exist because global AI governance cannot depend only on after-the-fact reaction. It needs public memory, interoperable constraints, reviewable evidence, and a way to translate observed failure into accountable repair.
              </p>
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
          <div className="mb-5 flex items-center gap-3">
            <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">
              What We Maintain
            </p>
            <hr className="gold-rule flex-1" />
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
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cam-gold">
                    {layer.eyebrow}
                  </p>
                  <h2 className="mb-3 font-serif text-xl leading-snug text-foreground md:text-2xl">
                    {layer.label}
                  </h2>
                  <p className="text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                    {layer.body}
                  </p>
                </motion.article>
              ))}
          </div>
        </motion.section>


        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">
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
            <div className="space-y-4">
              {citations.map((item) => (
                <div
                  className="rounded-xl border border-primary/20 bg-card/60 p-4"
                  key={item.label}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cam-gold">
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
            <p className="mt-5 max-w-2xl text-sm font-light leading-relaxed text-muted-foreground">
              Specific CAM instruments and VIGIL records should be cited directly where applicable, using the relevant record, instrument, repository path, DOI, or citation metadata when available.
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
            <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">
              Reuse &amp; Licence
            </p>
            <hr className="gold-rule flex-1" />
          </div>

          <div className="rounded-2xl border border-border bg-card/55 p-6">
            <p className="text-sm font-light leading-relaxed text-muted-foreground md:text-base">
              Public access supports transparency, citation, review, research, journalism, policy analysis, and non-commercial governance use with attribution. Public access does not equal unrestricted reuse. Reuse rights differ by layer.
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
            <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">
              Contact
            </p>
            <hr className="gold-rule flex-1" />
          </div>

          <article className="rounded-2xl border border-border bg-card/75 p-5">
            <h2 className="mb-3 font-serif text-xl leading-snug text-foreground md:text-2xl">
              Outreach
            </h2>
            <p className="mb-5 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
              For ethics, governance, citation, reuse, collaboration, or public-interest enquiries, contact the initiative directly.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
          </article>
        </motion.section>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">
              Follow Us
            </p>
            <hr className="gold-rule flex-1" />
          </div>

          <article className="rounded-2xl border border-border bg-card/75 p-5">
            <h2 className="mb-3 font-serif text-xl leading-snug text-foreground md:text-2xl">
              Project channels
            </h2>
            <p className="mb-5 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
              Follow public updates and inspect the open repositories for CAM, VIGIL, and this governance interface.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {followLinks.map((link) => (
                <a
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  href={link.href}
                  key={link.label}
                  rel="noreferrer"
                  target="_blank"
                >
                  {link.label}
                  <span className="opacity-50">↗</span>
                </a>
              ))}
            </div>
          </article>
        </motion.section>

        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <p className="shrink-0 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">
              Support
            </p>
            <hr className="gold-rule flex-1" />
          </div>

          <article className="rounded-2xl border border-border bg-card/75 p-5">
            <h2 className="mb-3 font-serif text-xl leading-snug text-foreground md:text-2xl">
              Support CAM Initiative
            </h2>
            <p className="mb-5 text-sm font-light leading-relaxed text-muted-foreground md:text-base">
              CAM Initiative is currently independently maintained and not institutionally funded. Financial support helps cover infrastructure, archival, publication, and maintenance costs.
            </p>
            <a
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              href={supportLink.href}
              rel="noreferrer"
              target="_blank"
            >
              {supportLink.label}
              <span className="opacity-50">↗</span>
            </a>
          </article>
        </motion.section>
      </main>
    </Shell>
  );
}
