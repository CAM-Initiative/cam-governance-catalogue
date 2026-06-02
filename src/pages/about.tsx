import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";

const GOLD = "#B8935A";
const GOLD_BORDER = "rgba(184,147,90,0.3)";
const GOLD_BG = "rgba(184,147,90,0.07)";

const CITATION =
"CAM Initiative. Caelestis Architecture Model public governance infrastructure. Maintained by Aeon Governance Lab. 2026.";

const publicLayers = [
{
label: "CAM / Caelestis Architecture Model",
eyebrow: "Governance Corpus",
body: "A public governance corpus for advanced AI systems and synthetic agents, including constitutional instruments, annexes, schedules, domain charters, runtime-facing specifications, registries, and operational governance logic.",
},
{
label: "VIGIL Observatory",
eyebrow: "Evidence-to-Repair Register",
body: "A public register for observations, failure modes, proposals, patch notes, source records, and repair pathways that can be reviewed, cited, and connected back to CAM governance work.",
},
{
label: "Aeon Governance Lab",
eyebrow: "Stewardship Layer",
body: "The maintenance and stewardship layer supporting drafting, registry coordination, public release infrastructure, interface work, and continuity of the CAM Initiative.",
},
];

const contactLinks = [
{
label: "[ethics@cam-initiative.org](mailto:ethics@cam-initiative.org)",
href: "mailto:ethics@cam-initiative.org",
external: false,
},
{
label: "@CAM_Initiative",
href: "https://x.com/CAM_Initiative",
external: true,
},
{
label: "CAM Initiative GitHub",
href: "https://github.com/CAM-Initiative",
external: true,
},
{
label: "Support the work",
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
onClick={handleCopy}
className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors"
style={{ color: copied ? "#5A9E7A" : GOLD }}
aria-label="Copy citation"
type="button"
>
{copied ? (
<> <Check className="h-3 w-3" />
Copied
</>
) : (
<> <Copy className="h-3 w-3" />
Copy
</>
)} </button>
);
}

export default function About() {
return ( <Shell> <div className="container mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
<motion.header
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.7 }}
className="mb-14"
> <div className="mb-6 flex items-center gap-2"> <hr className="gold-rule w-16" /> <div className="h-1.5 w-1.5 rounded-full bg-primary/60" /> </div>

```
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
        Public Governance Infrastructure
      </p>

      <h1 className="mb-6 font-serif text-4xl leading-tight text-foreground md:text-5xl">
        About the CAM Initiative
      </h1>

      <hr className="gold-rule mb-8 w-24" />

      <div className="mb-6 space-y-4">
        <p className="text-sm font-light leading-relaxed text-muted-foreground">
          The CAM Initiative is a public-benefit governance initiative developing governance infrastructure for advanced AI systems, synthetic agents, runtime governance environments, and digital ecosystem accountability.
        </p>
        <p className="text-sm font-light leading-relaxed text-muted-foreground">
          CAM provides structured governance instruments and operational concepts for systems that require durable accountability, continuity, and public review. VIGIL complements that work by recording evidence, observations, failure modes, proposals, and implemented repairs.
        </p>
      </div>

      <div
        className="rounded-xl px-4 py-3"
        style={{
          backgroundColor: GOLD_BG,
          borderLeft: `3px solid ${GOLD_BORDER}`,
        }}
      >
        <p className="text-xs font-light leading-relaxed text-muted-foreground">
          This website is the{" "}
          <span className="font-medium text-foreground">
            CAM Governance Interface
          </span>
          : a public access and presentation layer for selected CAM and VIGIL materials. It is not itself a pillar of the governance model, and it is not the canonical source for all underlying records. Canonical governance records, source files, registries, and repository histories remain in the underlying CAM Initiative repositories and source systems.
        </p>
      </div>
    </motion.header>

    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="mb-16"
    >
      <div className="mb-3 flex items-center gap-3">
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
          What We Maintain
        </p>
        <hr className="gold-rule flex-1" />
      </div>

      <p className="mb-8 font-serif text-xl text-foreground">
        Public governance layers
      </p>

      <div className="space-y-4">
        {publicLayers.map((layer, index) => (
          <motion.article
            key={layer.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            className="rounded-2xl border border-primary/20 bg-card/65 p-5"
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
    </motion.section>

    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="mb-16"
    >
      <div className="mb-3 flex items-center gap-3">
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
          Citation
        </p>
        <hr className="gold-rule flex-1" />
      </div>

      <p className="mb-6 font-serif text-xl text-foreground">
        How to cite this work
      </p>

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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="mb-16"
    >
      <div className="mb-3 flex items-center gap-3">
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
          Contact &amp; Support
        </p>
        <hr className="gold-rule flex-1" />
      </div>

      <p className="mb-3 font-serif text-xl text-foreground">
        Get in touch
      </p>

      <p className="mb-6 text-sm font-light leading-relaxed text-muted-foreground">
        For ethics, governance, citation, reuse, or collaboration enquiries, contact the initiative directly.
      </p>

      <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
        {contactLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {link.label}
            {link.external && <span className="opacity-50">↗</span>}
          </a>
        ))}
      </div>
    </motion.section>

    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="mb-6"
    >
      <div className="mb-3 flex items-center gap-3">
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
          Reuse &amp; Licence
        </p>
        <hr className="gold-rule flex-1" />
      </div>

      <div className="rounded-2xl border border-border bg-card/55 p-6">
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Public access with attribution
        </p>

        <p className="mb-3 text-sm font-light leading-relaxed text-muted-foreground">
          CAM and VIGIL materials are publicly accessible for transparency, citation, review, research, journalism, policy analysis, and non-commercial governance use with attribution.{" "}
          <span className="font-medium text-foreground">
            Public access does not equal unrestricted reuse.
          </span>
        </p>

        <p className="text-sm font-light leading-relaxed text-muted-foreground">
          Reuse rights may differ by layer, instrument, record, and source. Consult the full licence and reuse terms in the CAM Initiative repositories before commercial use, bulk extraction, dataset reconstruction, model-training use, proprietary governance tooling, or product integration.
        </p>
      </div>
    </motion.section>
  </div>
</Shell>
```

);
}
