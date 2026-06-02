import { Shell } from "@/components/layout/Shell";

const maintainedLayers = [
  {
    name: "CAM / Caelestis Architecture Model",
    description:
      "A public governance corpus for advanced AI systems and synthetic agents, including constitutional instruments, annexes, schedules, domain charters, runtime-facing specifications, registries, and operational governance logic.",
  },
  {
    name: "VIGIL Observatory",
    description:
      "An evidence-to-repair register for observations, failure modes, proposals, patch notes, source records, and repair pathways that can be reviewed and cited by the public.",
  },
  {
    name: "CAM Governance Interface",
    description:
      "The public presentation layer for browsing, searching, filtering, and citing selected CAM and VIGIL materials. It is an access interface, not the canonical source for all underlying governance records.",
  },
  {
    name: "Aeon Governance Lab / stewardship layer",
    description:
      "The maintenance and stewardship layer supporting drafting, registry coordination, public release infrastructure, interface work, and continuity of the CAM Initiative.",
  },
];

export default function About() {
  return (
    <Shell>
      <div className="relative flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 75% 0%, hsl(36 50% 96%) 0%, hsl(38 40% 92%) 54%, hsl(36 38% 90%) 100%)" }}
        />
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 opacity-[0.06]">
          <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
            <circle cx="118" cy="78" r="64" fill="none" stroke="#B8935A" strokeWidth="0.5" />
            <circle cx="118" cy="78" r="42" fill="none" stroke="#B8935A" strokeWidth="0.4" />
            <line x1="0" y1="200" x2="200" y2="0" stroke="#B8935A" strokeWidth="0.7" />
            <line x1="44" y1="200" x2="200" y2="44" stroke="#B8935A" strokeWidth="0.5" />
            <line x1="0" y1="154" x2="154" y2="0" stroke="#B8935A" strokeWidth="0.5" />
          </svg>
        </div>

        <article className="relative z-10 container mx-auto max-w-5xl px-6 py-12 md:px-8 md:py-16">
          <header className="mb-12 max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <hr className="gold-rule w-16" />
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-cam-gold">Public governance infrastructure</p>
            </div>
            <h1 className="mb-5 font-serif text-4xl text-foreground md:text-5xl">About the CAM Initiative</h1>
            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              The CAM Initiative is a public-benefit governance initiative developing governance infrastructure for advanced AI systems, synthetic agents, runtime governance environments, and digital ecosystem accountability.
            </p>
          </header>

          <section className="mb-12 max-w-4xl space-y-4 text-base leading-relaxed text-foreground/85 md:text-[17px]">
            <p>
              CAM provides structured governance instruments and operational concepts for systems that require durable accountability, continuity, and public review. VIGIL complements that work by recording evidence, observations, failures, proposals, and implemented repairs.
            </p>
            <p>
              This website is the CAM Governance Interface: a public access and presentation layer for selected CAM and VIGIL materials. Canonical governance records, source files, registries, and repository histories remain in the underlying CAM Initiative repositories and source systems.
            </p>
          </section>

          <section className="mb-12">
            <div className="mb-5 flex items-center gap-3">
              <hr className="gold-rule w-10" />
              <h2 className="font-mono text-[12px] uppercase tracking-[0.18em] text-cam-gold">What we maintain</h2>
            </div>
            <div className="divide-y divide-border/70 rounded-2xl border border-border/80 bg-card/35">
              {maintainedLayers.map((layer, index) => (
                <details key={layer.name} className="group p-5 first:rounded-t-2xl last:rounded-b-2xl open:bg-background/35 md:p-6" open={index === 0}>
                  <summary className="cursor-pointer list-none font-serif text-xl text-foreground marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      <span>{layer.name}</span>
                      <span className="font-mono text-xs text-cam-gold transition group-open:rotate-45" aria-hidden="true">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">{layer.description}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr]">
            <section className="cam-parchment-card rounded-2xl p-6 md:p-8">
              <h2 className="mb-4 font-serif text-2xl text-foreground">Citation</h2>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                <p>For a general reference to the initiative, use the umbrella citation:</p>
                <blockquote className="border-l-2 border-primary/50 pl-4 font-mono text-[13px] leading-relaxed text-foreground/85">
                  CAM Initiative. Caelestis Architecture Model public governance infrastructure. Maintained by Aeon Governance Lab. 2026.
                </blockquote>
                <p>Specific CAM instruments and VIGIL records should be cited directly where applicable, using the relevant record, instrument, repository path, or citation metadata when available.</p>
              </div>
            </section>

            <section className="cam-parchment-card rounded-2xl p-6 md:p-8">
              <h2 className="mb-4 font-serif text-2xl text-foreground">Contact and support</h2>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                <p>For ethics, governance, or citation enquiries, contact the initiative directly.</p>
                <div className="space-y-2 font-mono text-[13px]">
                  <p><a className="text-foreground underline-offset-4 hover:text-primary hover:underline" href="mailto:ethics@cam-initiative.org">ethics@cam-initiative.org</a></p>
                  <p><a className="text-foreground underline-offset-4 hover:text-primary hover:underline" href="https://x.com/CAM_Initiative" target="_blank" rel="noreferrer">@CAM_Initiative</a></p>
                  <p><a className="text-foreground underline-offset-4 hover:text-primary hover:underline" href="https://github.com/CAM-Initiative/Caelestis" target="_blank" rel="noreferrer">CAM Initiative GitHub</a></p>
                  <p><a className="text-foreground underline-offset-4 hover:text-primary hover:underline" href="https://buymeacoffee.com/cam_initiative" target="_blank" rel="noreferrer">Support the work</a></p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-2xl border border-border/80 bg-background/45 p-6 md:p-8">
            <h2 className="mb-4 font-serif text-2xl text-foreground">Reuse and licence</h2>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              <p>
                CAM and VIGIL materials are publicly accessible for transparency, citation, review, research, journalism, policy analysis, and non-commercial governance use with attribution. Public access does not equal unrestricted reuse.
              </p>
              <p>
                Reuse rights may differ by layer, instrument, record, and source. Consult the full licence and reuse terms in the CAM Initiative repositories before commercial use, bulk extraction, dataset reconstruction, model-training use, proprietary governance tooling, or product integration.
              </p>
              <a className="inline-flex rounded-lg border border-border bg-card px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition hover:bg-background/80" href="https://github.com/CAM-Initiative/Caelestis" target="_blank" rel="noreferrer">
                Licence and reuse terms ↗
              </a>
            </div>
          </section>
        </article>
      </div>
    </Shell>
  );
}
