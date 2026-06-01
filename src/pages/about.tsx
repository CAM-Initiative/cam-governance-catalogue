import { Shell } from "@/components/layout/Shell";

const identityLayers = [
  {
    name: "CAM Initiative",
    description: "Umbrella public-benefit governance project identity.",
  },
  {
    name: "CAM / Caelestis Architecture Model",
    description: "Governance corpus containing constitutional instruments, annexes, schedules, domain charters, runtime-facing specifications, agent-readable instructions, taxonomies, registries, and operational governance logic.",
  },
  {
    name: "VIGIL",
    description: "Evidence-to-repair governance ledger for observations, failure modes, proposals, patch notes, source records, and repair pathways.",
  },
  {
    name: "Aeon Governance Lab",
    description: "Stewardship, maintenance, drafting, registry support, interface coordination, and public release infrastructure.",
  },
  {
    name: "CAM Governance Interface",
    description: "Public Web UX and access layer used to browse, search, filter, and cite CAM and VIGIL materials.",
  },
];

export default function About() {
  return (
    <Shell>
      <div className="relative flex-1 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 75% 0%, hsl(36 50% 96%) 0%, hsl(38 40% 92%) 54%, hsl(36 38% 90%) 100%)" }}
        />
        <div className="absolute right-0 top-0 h-72 w-72 pointer-events-none opacity-[0.06]">
          <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
            <circle cx="118" cy="78" r="64" fill="none" stroke="#B8935A" strokeWidth="0.5" />
            <circle cx="118" cy="78" r="42" fill="none" stroke="#B8935A" strokeWidth="0.4" />
            <line x1="0" y1="200" x2="200" y2="0" stroke="#B8935A" strokeWidth="0.7" />
            <line x1="44" y1="200" x2="200" y2="44" stroke="#B8935A" strokeWidth="0.5" />
            <line x1="0" y1="154" x2="154" y2="0" stroke="#B8935A" strokeWidth="0.5" />
          </svg>
        </div>

        <article className="relative z-10 container mx-auto max-w-5xl px-6 py-12 md:px-8 md:py-16">
          <header className="mb-10 max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <hr className="gold-rule w-16" />
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-cam-gold">Project Identity</p>
            </div>
            <h1 className="mb-4 font-serif text-4xl text-foreground md:text-5xl">About the CAM Initiative</h1>
            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Public governance infrastructure for CAM and VIGIL
            </p>
          </header>

          <section className="cam-parchment-card mb-8 rounded-2xl p-6 md:p-8">
            <div className="space-y-4 text-base leading-relaxed text-foreground/90 md:text-[17px]">
              <p>
                The CAM Initiative is a public-benefit governance project developing governance infrastructure for advanced AI systems, synthetic agents, runtime governance environments, and digital ecosystem accountability.
              </p>
              <p>
                The Initiative maintains two primary public governance layers: CAM — the Caelestis Architecture Model, and VIGIL — the evidence-to-repair ledger.
              </p>
              <p>
                The CAM Governance Interface is the public Web UX used to browse, search, filter, and cite CAM and VIGIL materials. It is an access layer, not the authoritative source of the underlying governance records.
              </p>
              <p>
                Aeon Governance Lab provides stewardship, maintenance, drafting, registry support, interface coordination, and public release infrastructure for the CAM Initiative.
              </p>
            </div>
          </section>

          <section className="mb-8 grid gap-4 md:grid-cols-2">
            {identityLayers.map((layer) => (
              <div key={layer.name} className="cam-parchment-card rounded-xl p-5">
                <h2 className="mb-2 font-mono text-[12px] uppercase tracking-[0.16em] text-cam-gold">{layer.name}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{layer.description}</p>
              </div>
            ))}
          </section>

          <div className="space-y-8">
            <section className="cam-parchment-card rounded-2xl p-6 md:p-8">
              <h2 className="mb-4 text-2xl text-foreground">CAM</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                <p>CAM is not ordinary policy prose and should not be treated as a conventional open-source software library.</p>
                <p>
                  CAM materials may be written in plain-language English, Markdown, JSON, or other structured formats, but they include operational and runtime-facing governance functions. Some CAM materials are designed to guide agents, validators, registries, governance workflows, runtime interpretation, and cross-domain review.
                </p>
                <p>CAM should therefore be understood as a governance corpus containing both normative text and operational governance specifications.</p>
              </div>
            </section>

            <section className="cam-parchment-card rounded-2xl p-6 md:p-8">
              <h2 className="mb-4 text-2xl text-foreground">VIGIL</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                <p>VIGIL is a public evidence-to-repair governance ledger.</p>
                <p>
                  It records what has been observed, why it may matter, how it is being classified, and whether it has been routed toward monitoring, proposal development, repair, implementation, supersession, or closure.
                </p>
                <p>
                  VIGIL does not itself create binding CAM doctrine. It preserves source attribution, evidentiary context, routing state, classification posture, and repair history so that governance work can proceed from structured public records.
                </p>
              </div>
            </section>

            <section className="cam-parchment-card rounded-2xl p-6 md:p-8">
              <h2 className="mb-4 text-2xl text-foreground">Public Access and Reuse</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                <p>CAM and VIGIL are publicly accessible for transparency, citation, review, research, journalism, policy analysis, and non-commercial governance use with attribution.</p>
                <p className="font-semibold text-foreground">Public repository access does not mean unrestricted open-source reuse.</p>
                <p>
                  CAM materials include governance instruments, plain-language operational specifications, agent-readable instructions, runtime schedules, schema-linked records, taxonomies, registries, and related governance logic.
                </p>
                <p>
                  VIGIL materials include evidence-to-repair records, source-linked observations, failure-mode classifications, proposals, patch notes, generated registries, and related governance metadata.
                </p>
                <p>
                  Reuse rights may differ by layer. Citation is required. Commercial use, bulk extraction, dataset reconstruction, model-training use, paid product integration, proprietary governance tooling, commercial analytics, or incorporation into AI-system development workflows may require prior written permission.
                </p>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="cam-parchment-card rounded-2xl p-6 md:p-8">
                <h2 className="mb-4 text-2xl text-foreground">Citation</h2>
                <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  <p>For simple references to the overall project, use the umbrella citation:</p>
                  <blockquote className="border-l-2 border-primary/50 pl-4 font-mono text-[13px] leading-relaxed text-foreground/85">
                    CAM Initiative. Caelestis Architecture Model public governance infrastructure. Maintained by Aeon Governance Lab. 2026.
                  </blockquote>
                  <p>For CAM-specific references, cite the CAM governance corpus or relevant instrument.</p>
                  <p>For VIGIL-specific references, cite the VIGIL evidence-to-repair ledger or relevant record.</p>
                  <p>Where available, use the citation metadata in the relevant repository.</p>
                </div>
              </div>

              <div className="cam-parchment-card rounded-2xl p-6 md:p-8">
                <h2 className="mb-4 text-2xl text-foreground">What CAM and VIGIL Are Not</h2>
                <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  <p>
                    CAM and VIGIL materials do not constitute legal advice, regulatory determination, safety certification, final incident adjudication, a finding of liability, or an official government standard.
                  </p>
                  <p>They are public governance artefacts intended to support analysis, review, repair, and accountable governance development.</p>
                </div>
              </div>
            </section>
          </div>
        </article>
      </div>
    </Shell>
  );
}
