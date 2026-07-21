import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Check, Copy, Download, ExternalLink } from "lucide-react";

const policyPdfHref = `${import.meta.env.BASE_URL}publications/CAM_Initiative_Australian_AI_Training_and_Contribution_Policy_Proposal.pdf`;

const suggestedCitation =
  "CAM Initiative. (2026). AI Training, Contribution & Copyright Scheme: Copyright permission, contribution valuation and sovereign value return (Policy Proposal 01/2026). Human Custodian-of-Record: Dr Michelle Vivian O’Rourke. AI Agent: OpenAI, ChatGPT Work, Sol 5.6 Extra High.";

const submissionRecipients = [
  {
    organisation: "Australian Government Office of AI",
    email: "artificial.intelligence@industry.gov.au",
  },
  {
    organisation: "Attorney-General’s Department — Copyright and Artificial Intelligence Reference Group",
    email: "cairg@ag.gov.au",
  },
  {
    organisation: "Good Ancestors",
    email: "contact@goodancestors.org.au",
    note: "Adapted variation supplied for policy consideration.",
  },
];

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
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-2.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-primary/45 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">CAM Initiative Public Policy</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground md:text-5xl">Policy Papers</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Public policy proposals translating CAM governance architecture into implementable institutional design, legal mechanisms, public administration, and accountable technology transition.
          </p>
        </motion.header>

        <div id="policy-library" className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <aside className="cam-parchment-card rounded-2xl p-4 shadow-sm lg:sticky lg:top-20" aria-label="Policy library navigation">
            <div className="mb-5">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">Policy library</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Browse CAM Initiative policy proposals by publication number, year, and policy subject.
              </p>
            </div>

            <nav aria-label="Policy papers" className="space-y-5">
              <a
                className="block rounded-xl border border-cam-gold/30 bg-card px-3 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/50 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="#policy-library"
              >
                All policy papers
              </a>

              <div>
                <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/65">2026</p>
                <a
                  aria-current="page"
                  className="block rounded-xl border border-cam-gold/45 bg-[rgba(184,147,90,0.10)] px-3 py-3 transition hover:border-cam-gold/65 hover:bg-[rgba(184,147,90,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="#policy-proposal-01-2026"
                >
                  <span className="block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold">PP 01/2026</span>
                  <span className="mt-1.5 block font-serif text-base leading-snug text-foreground">AI Training, Contribution &amp; Copyright Scheme</span>
                </a>
              </div>
            </nav>
          </aside>

          <section className="min-w-0" aria-labelledby="policy-publications-heading">
            <motion.article
              className="cam-parchment-card overflow-hidden rounded-3xl border border-cam-gold/35 shadow-xl"
              id="policy-proposal-01-2026"
              initial={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.65 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="border-b border-cam-gold/30 bg-[hsl(36_48%_96%)] px-6 py-5 md:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold">Policy Proposal 01/2026</p>
                  <span className="rounded-full border border-primary/20 bg-card/70 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-foreground/65">
                    Independent public policy proposal
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold">20 July 2026</p>
                <h2 id="policy-publications-heading" className="font-serif text-3xl leading-tight text-foreground md:text-4xl">
                  AI Training, Contribution &amp; Copyright Scheme
                </h2>
                <p className="mt-3 text-base font-medium leading-relaxed text-foreground/75">
                  Copyright permission, contribution valuation and sovereign value return
                </p>

                <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground/78">
                  <p>
                    This paper explores a two-sided Australian AI training and contribution scheme. One side would address lawful permission and proportionate contributions from covered AI providers; the other would allocate value to verified rights holders and accredited corpus stewards according to contribution, utility, dependency, and continuing stewardship.
                  </p>
                  <p>
                    The proposal distinguishes the legal question of whether protected material may be used from the economic question of how different human contributions might be valued. A levy or public fund would not, by itself, provide blanket permission to ingest protected material.
                  </p>
                  <p>
                    It also considers how domestic training regulation could be paired with an Australian market-access obligation so that equivalent models trained offshore do not receive an avoidance advantage.
                  </p>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cam-gold/70 bg-cam-gold/20 px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-cam-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    download
                    href={policyPdfHref}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download PDF
                  </a>
                  <a
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={policyPdfHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open PDF in browser
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <aside className="border-t border-cam-gold/30 bg-[hsl(36_48%_96%)] p-6 md:p-8" aria-label="Publication details">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold">Publication details</p>
                  <CitationCopyButton />
                </div>

                <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Publication</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-foreground">Policy Proposal 01/2026 · 13 pages</dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Published</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-foreground">20 July 2026</dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Status</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-foreground">Public · submitted for policy consideration</dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4 md:col-span-2 xl:col-span-3">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Submitted to</dt>
                    <dd className="mt-3">
                      <ul className="space-y-3 text-sm leading-relaxed text-foreground">
                        {submissionRecipients.map((recipient) => (
                          <li className="border-l-2 border-cam-gold/30 pl-3" key={recipient.email}>
                            <span className="font-medium">{recipient.organisation}</span>
                            <span className="block break-all text-muted-foreground">{recipient.email}</span>
                            {recipient.note ? <span className="mt-1 block text-muted-foreground">{recipient.note}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4 md:col-span-2 xl:col-span-3">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Themes</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {["Copyright", "AI training", "Market access", "Contribution valuation", "Living corpora"].map((theme) => (
                        <span className="rounded-full border border-primary/20 bg-background/70 px-2.5 py-1 text-xs text-foreground/75" key={theme}>{theme}</span>
                      ))}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4 md:col-span-2 xl:col-span-3">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Suggested citation</dt>
                    <dd className="mt-2 font-mono text-sm leading-relaxed text-foreground/80">{suggestedCitation}</dd>
                  </div>
                </dl>
              </aside>
            </motion.article>
          </section>
        </div>
      </main>
    </Shell>
  );
}
