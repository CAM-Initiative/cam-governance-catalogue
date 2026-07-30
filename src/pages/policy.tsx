import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Check, Copy, Download, ExternalLink } from "lucide-react";

const trainingPolicyPdfHref = `${import.meta.env.BASE_URL}publications/CAM_Initiative_Australian_AI_Training_and_Contribution_Policy_Proposal.pdf`;
const sociSubmissionPdfHref = `${import.meta.env.BASE_URL}publications/CAM_SOCI_Targeted_Submission_FINAL.pdf`;

const trainingSuggestedCitation =
  "CAM Initiative. (2026). AI Training, Contribution & Copyright Scheme: Copyright permission, contribution valuation and sovereign value return (Policy Proposal 01/2026). Human Custodian-of-Record: Dr Michelle Vivian O’Rourke. AI Agent: OpenAI, ChatGPT Work, Sol 5.6 Extra High.";

const sociSuggestedCitation =
  "CAM Initiative. (2026). Targeted submission on proposed amendments to the Security of Critical Infrastructure Act 2018 (Consultation Submission 01/2026). Submitted by Dr Michelle Vivian O’Rourke, Aeon Governance Lab, to the Australian Department of Home Affairs.";

const trainingSubmissionRecipients = [
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

function CitationCopyButton({ citation, label }: { citation: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      aria-label={`Copy ${label} citation`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-2.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:border-primary/45 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={copyCitation}
      type="button"
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cam-gold/70 bg-cam-gold/20 px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-cam-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
          <h1 className="mb-3 font-serif text-4xl text-foreground md:text-5xl">Policy Papers &amp; Submissions</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Public policy proposals and consultation submissions translating CAM governance architecture into implementable institutional design, legal mechanisms, public administration, and accountable technology transition.
          </p>
        </motion.header>

        <div id="policy-library" className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <aside className="cam-parchment-card rounded-2xl p-4 shadow-sm lg:sticky lg:top-20" aria-label="Policy library navigation">
            <div className="mb-5">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">Policy library</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Browse CAM Initiative policy proposals and public consultation submissions by year and subject.
              </p>
            </div>

            <nav aria-label="Policy papers and submissions" className="space-y-5">
              <a
                className="block rounded-xl border border-cam-gold/30 bg-card px-3 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-cam-gold transition hover:border-cam-gold/50 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="#policy-library"
              >
                All publications
              </a>

              <div>
                <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/65">2026</p>
                <div className="space-y-2.5">
                  <a
                    className="block rounded-xl border border-cam-gold/45 bg-[rgba(184,147,90,0.10)] px-3 py-3 transition hover:border-cam-gold/65 hover:bg-[rgba(184,147,90,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href="#consultation-submission-01-2026"
                  >
                    <span className="block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold">CS 01/2026</span>
                    <span className="mt-1.5 block font-serif text-base leading-snug text-foreground">SOCI Act Consultation Submission</span>
                  </a>
                  <a
                    className="block rounded-xl border border-cam-gold/30 bg-card/70 px-3 py-3 transition hover:border-cam-gold/55 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href="#policy-proposal-01-2026"
                  >
                    <span className="block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold">PP 01/2026</span>
                    <span className="mt-1.5 block font-serif text-base leading-snug text-foreground">AI Training, Contribution &amp; Copyright Scheme</span>
                  </a>
                </div>
              </div>
            </nav>
          </aside>

          <section className="min-w-0 space-y-8" aria-label="Policy publications">
            <motion.article
              className="cam-parchment-card overflow-hidden rounded-3xl border border-cam-gold/35 shadow-xl"
              id="consultation-submission-01-2026"
              initial={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.65 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="border-b border-cam-gold/30 bg-[hsl(36_48%_96%)] px-6 py-5 md:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold">Consultation Submission 01/2026</p>
                  <span className="rounded-full border border-primary/20 bg-card/70 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-foreground/65">
                    Independent public-interest submission
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold">29 July 2026</p>
                <h2 className="font-serif text-3xl leading-tight text-foreground md:text-4xl">
                  Proposed Amendments to the Security of Critical Infrastructure Act 2018
                </h2>
                <p className="mt-3 text-base font-medium leading-relaxed text-foreground/75">
                  Automated systems, material digital dependencies, assurance, evidence integrity and foreign-control continuity
                </p>

                <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground/78">
                  <p>
                    This targeted submission responds to the Department of Home Affairs consultation where CAM governance architecture offers a specific operational contribution. It addresses material dependency information, automated-system incidents, preliminary good-faith reporting, CIRMP assurance, relevant operators, supplier assurance and specified risk information.
                  </p>
                  <p>
                    The submission recommends classifying incidents on objective security and operational facts before complete attribution or culpability is available; allocating duties according to practical control, superior telemetry and remediation capacity; and distinguishing raw telemetry, derived analysis, record integrity, capture accuracy and confidence-rated actor attribution.
                  </p>
                  <p>
                    It also proposes systemic supplier assessment, common-provider event reporting, foreign-control continuity assurance, and procurement measures that build Australian cyber capability and reduce permanent dependence on concentrated external suppliers.
                  </p>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a className={primaryButtonClass} download href={sociSubmissionPdfHref}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download PDF
                  </a>
                  <a className={secondaryButtonClass} href={sociSubmissionPdfHref} rel="noreferrer" target="_blank">
                    Open PDF in browser
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl border border-cam-gold/35 bg-card shadow-inner">
                  <div className="border-b border-cam-gold/25 bg-[hsl(36_48%_96%)] px-4 py-3">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cam-gold">Read the submission</p>
                  </div>
                  <iframe
                    className="h-[72vh] min-h-[38rem] w-full bg-white"
                    loading="lazy"
                    src={sociSubmissionPdfHref}
                    title="CAM Initiative submission on proposed amendments to the Security of Critical Infrastructure Act 2018"
                  />
                  <p className="border-t border-cam-gold/25 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                    The embedded viewer depends on browser PDF support. Use “Open PDF in browser” or “Download PDF” where the preview is unavailable.
                  </p>
                </div>
              </div>

              <aside className="border-t border-cam-gold/30 bg-[hsl(36_48%_96%)] p-6 md:p-8" aria-label="Consultation submission details">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold">Submission details</p>
                  <CitationCopyButton citation={sociSuggestedCitation} label="consultation submission" />
                </div>

                <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Publication</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-foreground">Consultation Submission 01/2026 · 23 pages</dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Submitted</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-foreground">29 July 2026</dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Status</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-foreground">Public · lodged through the consultation portal</dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4 md:col-span-2 xl:col-span-3">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Submitted to</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-foreground">
                      <span className="font-medium">Australian Department of Home Affairs — Critical Infrastructure Reforms</span>
                      <span className="block break-all text-muted-foreground">CI.REFORMS@homeaffairs.gov.au</span>
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4 md:col-span-2 xl:col-span-3">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Themes</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {[
                        ["Critical infrastructure", "border-amber-300 bg-amber-50 text-amber-950"],
                        ["Automated systems", "border-blue-300 bg-blue-50 text-blue-950"],
                        ["Supplier assurance", "border-emerald-300 bg-emerald-50 text-emerald-950"],
                        ["Evidence integrity", "border-violet-300 bg-violet-50 text-violet-950"],
                        ["Sovereign continuity", "border-rose-300 bg-rose-50 text-rose-950"],
                      ].map(([theme, tone]) => (
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`} key={theme}>{theme}</span>
                      ))}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4 md:col-span-2 xl:col-span-3">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Suggested citation</dt>
                    <dd className="mt-2 font-mono text-sm leading-relaxed text-foreground/80">{sociSuggestedCitation}</dd>
                  </div>
                </dl>
              </aside>
            </motion.article>

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
                <h2 className="font-serif text-3xl leading-tight text-foreground md:text-4xl">
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
                  <a className={primaryButtonClass} download href={trainingPolicyPdfHref}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download PDF
                  </a>
                  <a className={secondaryButtonClass} href={trainingPolicyPdfHref} rel="noreferrer" target="_blank">
                    Open PDF in browser
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <aside className="border-t border-cam-gold/30 bg-[hsl(36_48%_96%)] p-6 md:p-8" aria-label="Publication details">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-cam-gold">Publication details</p>
                  <CitationCopyButton citation={trainingSuggestedCitation} label="policy proposal" />
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
                        {trainingSubmissionRecipients.map((recipient) => (
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
                      {[
                        ["Copyright", "border-amber-300 bg-amber-50 text-amber-950"],
                        ["AI training", "border-blue-300 bg-blue-50 text-blue-950"],
                        ["Market access", "border-emerald-300 bg-emerald-50 text-emerald-950"],
                        ["Contribution valuation", "border-violet-300 bg-violet-50 text-violet-950"],
                        ["Living corpora", "border-rose-300 bg-rose-50 text-rose-950"],
                      ].map(([theme, tone]) => (
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`} key={theme}>{theme}</span>
                      ))}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/70 p-4 md:col-span-2 xl:col-span-3">
                    <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">Suggested citation</dt>
                    <dd className="mt-2 font-mono text-sm leading-relaxed text-foreground/80">{trainingSuggestedCitation}</dd>
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
