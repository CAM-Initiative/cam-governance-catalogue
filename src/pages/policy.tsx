import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Check, Copy, Download, ExternalLink } from "lucide-react";

const policyPdfHref = `${import.meta.env.BASE_URL}publications/CAM_Initiative_Australian_AI_Training_and_Contribution_Policy_Proposal.pdf`;

const suggestedCitation =
  "CAM Initiative. (2026). AI Training, Contribution & Copyright Scheme: Copyright permission, contribution valuation and sovereign value return (Policy Proposal 01/2026). Human Custodian-of-Record: Dr Michelle Vivian O’Rourke. AI Agent: OpenAI, ChatGPT Work, Sol 5.6 Extra High.";

function CitationCopyButton() {
  const [copied, setCopied] = useState(false);

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(suggestedCitation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      aria-label="Copy policy citation"
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-cam-gold transition hover:border-primary/45 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={copyCitation}
      type="button"
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function Policy() {
  return (
    <Shell>
      <main className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 max-w-3xl"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">CAM Initiative Public Policy</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground md:text-5xl">Policy Papers</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Public policy proposals translating CAM governance architecture into implementable institutional design, legal mechanisms, public administration, and accountable technology transition.
          </p>
        </motion.header>

        <div id="policy-library" className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <aside className="cam-parchment-card rounded-2xl p-4 shadow-sm lg:sticky lg:top-20" aria-label="Policy library navigation">
            <div className="mb-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cam-gold">Policy library</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Browse CAM Initiative policy proposals by publication number, year, and policy subject.
              </p>
            </div>

            <nav aria-label="Policy papers" className="space-y-5">
              <a
                className="block rounded-xl border border-cam-gold/30 bg-card px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cam-gold transition hover:border-cam-gold/50 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="#policy-library"
              >
                All policy papers
              </a>

              <div>
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/65">2026</p>
                <a
                  aria-current="page"
                  className="block rounded-xl border border-cam-gold/45 bg-[rgba(184,147,90,0.10)] px-3 py-3 transition hover:border-cam-gold/65 hover:bg-[rgba(184,147,90,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="#policy-proposal-01-2026"
                >
                  <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cam-gold">PP 01/2026</span>
                  <span className="mt-1.5 block font-serif text-base leading-snug text-foreground">AI Training, Contribution &amp; Copyright Scheme</span>
                </a>
              </div>
            </nav>
          </aside>

          <section className="min-w-0" aria-labelledby="policy-publications-heading">
            <motion.article
              className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl"
              id="policy-proposal-01-2026"
              initial={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.65 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="border-b border-cam-gold/25 bg-card px-6 py-5 md:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">Policy Proposal 01/2026</p>
                  <span className="rounded-full border border-primary/20 bg-background/70 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/65">
                    Independent public policy proposal
                  </span>
                </div>
              </div>

              <div className="grid gap-8 p-6 md:p-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                  <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">20 July 2026</p>
                  <h2 id="policy-publications-heading" className="font-serif text-4xl leading-tight text-foreground md:text-5xl">
                    AI Training, Contribution &amp; Copyright Scheme
                  </h2>
                  <p className="mt-4 text-lg font-medium leading-relaxed text-foreground/75">
                    Copyright permission, contribution valuation and sovereign value return
                  </p>

                  <blockquote className="mt-7 rounded-2xl border-l-4 border-cam-gold bg-[hsl(36_45%_96%)] p-5 text-lg leading-relaxed text-foreground shadow-sm md:text-xl">
                    Permission is the legal basis. Utility, dependency and stewardship determine value.
                  </blockquote>

                  <div className="mt-7 space-y-4 text-base leading-relaxed text-foreground/78 md:text-lg">
                    <p>
                      Australia should establish a two-sided AI training and contribution scheme. The first side secures lawful permission and collects proportionate contributions from covered AI providers. The second allocates value to verified rights holders and accredited corpus stewards according to contribution, utility, dependency, and continuing stewardship.
                    </p>
                    <p>
                      The proposal separates the legal question of whether protected material may be used from the economic question of how different human contributions should be valued. A levy or public fund must never be mistaken for blanket permission to ingest protected material.
                    </p>
                    <p>
                      It also combines domestic training regulation with a proportionate Australian market-access obligation so that equivalent models trained offshore do not receive an avoidance advantage.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cam-gold/70 bg-cam-gold/20 px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-cam-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      download
                      href={policyPdfHref}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Download PDF
                    </a>
                    <a
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-background/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      href={policyPdfHref}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open PDF in browser
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                <aside className="h-fit rounded-2xl border border-border/80 bg-background/55 p-5 shadow-sm" aria-label="Publication details">
                  <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">Publication details</p>
                  <dl className="space-y-4 text-sm leading-relaxed">
                    <div>
                      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Proposed by</dt>
                      <dd className="mt-1 text-foreground">CAM Initiative</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Human Custodian-of-Record</dt>
                      <dd className="mt-1 text-foreground">Dr Michelle Vivian O’Rourke</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">AI Agent</dt>
                      <dd className="mt-1 text-foreground">OpenAI, ChatGPT Work, Sol 5.6 Extra High</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Project identity</dt>
                      <dd className="mt-1 text-foreground">Aeon Governance Lab™</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Publication</dt>
                      <dd className="mt-1 text-foreground">Policy Proposal 01/2026 · 13 pages</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Themes</dt>
                      <dd className="mt-2 flex flex-wrap gap-2">
                        {["Copyright", "AI training", "Market access", "Contribution valuation", "Living corpora"].map((theme) => (
                          <span className="rounded-full border border-primary/20 bg-card px-2.5 py-1 text-xs text-foreground/75" key={theme}>{theme}</span>
                        ))}
                      </dd>
                    </div>
                    <div className="border-t border-border/80 pt-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Suggested citation</dt>
                        <CitationCopyButton />
                      </div>
                      <dd className="rounded-xl border border-border/80 bg-card p-4 font-mono text-xs leading-relaxed text-foreground/80">
                        {suggestedCitation}
                      </dd>
                    </div>
                  </dl>
                </aside>
              </div>
            </motion.article>
          </section>
        </div>
      </main>
    </Shell>
  );
}
