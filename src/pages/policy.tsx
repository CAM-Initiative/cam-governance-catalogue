import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Landmark,
  Network,
  Scale,
  ShieldCheck,
} from "lucide-react";

const policyPdfHref = `${import.meta.env.BASE_URL}publications/CAM_Initiative_Australian_AI_Training_and_Contribution_Policy_Proposal.pdf`;

const recommendations = [
  {
    title: "Separate permission from valuation",
    effect: "Copyright authority determines lawful use; the Contribution Value Schedule determines relative return.",
  },
  {
    title: "Regulate training and market access",
    effect: "Equivalent models trained offshore should not receive an avoidance advantage when supplied in Australia.",
  },
  {
    title: "Use a progressive provider obligation",
    effect: "Commercial and systemic contribution should rise with Australian revenue, reach, capability, and dependency.",
  },
  {
    title: "Establish rights and provenance clearance",
    effect: "Covered operators should carry the evidentiary burden for lawful corpus acquisition, scope, and lineage.",
  },
  {
    title: "Adopt targeted and pooled compensation",
    effect: "Identifiable material contributions receive targeted return; diffuse foundational inputs receive system-level pooled compensation.",
  },
  {
    title: "Recognise living corpus stewardship",
    effect: "Accredited stewards may receive retainers, change-set payments, and major-correction units.",
  },
  {
    title: "Preserve human–AI works without a class discount",
    effect: "Human tool use does not reduce permission standing; utility and independent origin remain assessable.",
  },
  {
    title: "Publish indexed bands, not false precision",
    effect: "Units and rate bands should be transparent, CPI-indexed, and reviewed as technology changes.",
  },
  {
    title: "Protect experimentation and public benefit",
    effect: "De minimis thresholds, transitional rates, and audited activity-based reductions should prevent investment cliffs.",
  },
  {
    title: "Pilot before fixing dollar rates",
    effect: "Three corpus classes should test value evidence, administration cost, gaming risk, and provider burden.",
  },
];

const architecture = [
  {
    title: "AI Training and Infrastructure Permit",
    body: "Pre-run authority and enforceable operating conditions for covered training activity conducted in Australia.",
    icon: ShieldCheck,
  },
  {
    title: "Rights and Provenance Clearance",
    body: "An audited corpus manifest establishing lawful basis, acquisition pathways, restrictions, and lineage.",
    icon: FileText,
  },
  {
    title: "Covered-provider and market-access obligation",
    body: "Proportionate duties for qualifying domestic providers and materially capable overseas-trained models supplied in Australia.",
    icon: Network,
  },
  {
    title: "Australian AI Contribution Levy",
    body: "A progressive provider-side contribution linked to Australian revenue, scale, capability, reach, and dependency.",
    icon: Scale,
  },
  {
    title: "Sovereign AI Contribution Fund",
    body: "Auditable value-return pools for verified rights holders, contributors, and accredited corpus stewards.",
    icon: Landmark,
  },
  {
    title: "Contribution Value Schedule",
    body: "Published units and bands for fixed works, foundational inputs, evaluation corpora, human–AI works, and living corpora.",
    icon: FileText,
  },
  {
    title: "Model passport",
    body: "Portable governance, rights, evaluation, and contribution conditions that follow checkpoints, fine-tunes, distillations, and transfers.",
    icon: Network,
  },
];

const suggestedCitation =
  "CAM Initiative. (2026). AI Training, Contribution & Copyright Scheme: Copyright permission, contribution valuation and sovereign value return (Policy Proposal 01/2026). Human Custodian-of-Record: Dr Michelle Vivian O’Rourke. AI Agent: Sol 5.6 Extra High thinking.";

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mb-7 max-w-4xl">
      <div className="mb-4 flex items-center gap-3">
        <p className="shrink-0 font-mono text-[13px] font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">{eyebrow}</p>
        <hr className="gold-rule flex-1" />
      </div>
      <h2 className="font-serif text-3xl leading-tight text-foreground md:text-4xl">{title}</h2>
      {body ? <p className="mt-3 text-base leading-relaxed text-foreground/75 md:text-lg">{body}</p> : null}
    </div>
  );
}

export default function Policy() {
  return (
    <Shell>
      <main className="overflow-hidden">
        <section className="border-b border-border/60 bg-[hsl(38_40%_93%)]">
          <div className="container mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20">
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.7 }}>
              <div className="mb-6 flex items-center gap-3">
                <hr className="gold-rule w-16" />
                <p className="font-mono text-[15px] font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">CAM Initiative · Public Policy</p>
              </div>
              <h1 className="mb-6 font-serif text-5xl leading-[1.02] text-foreground md:text-7xl">Policy Papers</h1>
              <p className="max-w-4xl text-lg leading-relaxed text-foreground/80 md:text-xl">
                Public policy proposals translating CAM governance architecture into implementable institutional design, legal mechanisms, public administration, and accountable technology transition.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" aria-labelledby="policy-records-heading">
          <SectionHeading
            eyebrow="Policy records"
            title="Independent proposals grounded in inspectable governance architecture."
            body="Select a policy record to inspect its proposition, recommendations, architecture, publication details, citation, and source document. Additional papers can be added to this collection using the same expandable record structure."
          />

          <motion.div initial={{ opacity: 0, y: 14 }} transition={{ duration: 0.65 }} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }}>
            <details className="group overflow-hidden rounded-3xl border border-cam-gold/40 bg-card shadow-xl">
              <summary className="cursor-pointer list-none bg-card p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:p-8 [&::-webkit-details-marker]:hidden">
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cam-gold/45 bg-cam-gold/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[hsl(32_62%_25%)]">
                        Policy Proposal 01/2026
                      </span>
                      <span className="rounded-full border border-primary/20 bg-background/70 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/65">
                        Independent public policy proposal
                      </span>
                    </div>

                    <h2 id="policy-records-heading" className="font-serif text-3xl leading-tight text-foreground md:text-5xl">
                      AI Training, Contribution &amp; Copyright Scheme
                    </h2>
                    <p className="mt-3 text-base font-medium leading-relaxed text-foreground/70 md:text-lg">
                      Copyright permission, contribution valuation and sovereign value return
                    </p>

                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-foreground/55">
                      <span>20 July 2026</span>
                      <span>13 pages</span>
                      <span>Australia</span>
                      <span>Human–AI co-creation</span>
                    </div>

                    <p className="mt-6 max-w-4xl border-l-3 border-cam-gold pl-4 text-base leading-relaxed text-foreground/78 md:text-lg">
                      Permission is the legal basis. Utility, dependency and stewardship determine value.
                    </p>
                  </div>

                  <span className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cam-gold/35 bg-[hsl(36_48%_96%)] text-[hsl(32_62%_25%)] transition-transform duration-200 group-open:rotate-90" aria-hidden="true">
                    <ChevronRight className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[hsl(32_62%_25%)]">
                  Select to inspect the complete policy record
                </p>
              </summary>

              <div className="border-t border-cam-gold/30 bg-[hsl(38_40%_94%)] p-5 md:p-8">
                <div className="mb-8 flex flex-wrap gap-3">
                  <a
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cam-gold/70 bg-cam-gold/20 px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-cam-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    download
                    href={policyPdfHref}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download PDF
                  </a>
                  <a
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={policyPdfHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open PDF in browser
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>

                <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8" aria-labelledby="policy-overview-heading">
                  <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Policy proposition</p>
                  <h3 id="policy-overview-heading" className="font-serif text-2xl leading-tight text-foreground md:text-3xl">
                    A two-sided scheme for lawful permission and proportionate value return.
                  </h3>
                  <div className="mt-5 space-y-4 text-base leading-relaxed text-foreground/78 md:text-lg">
                    <p>
                      Australia should establish an AI training and contribution scheme in which lawful permission and provider contributions are secured on one side, while verified rights holders and accredited corpus stewards receive value according to contribution, utility, dependency, and continuing stewardship on the other.
                    </p>
                    <p>
                      Copyright permission determines whether protected material may be used. It does not, by itself, determine the relative value of a novel, specialist research collection, safety-evaluation corpus, or continuously maintained governance corpus. Conversely, payment into a levy or public fund must never be treated as blanket authority to ingest protected material.
                    </p>
                    <p>
                      The proposal combines domestic training regulation with a proportionate Australian market-access obligation so that materially capable models trained offshore cannot obtain an avoidance advantage when supplied into the Australian market.
                    </p>
                  </div>
                </section>

                <section className="mt-8" aria-labelledby="recommendations-heading">
                  <SectionHeading eyebrow="Recommendations at a glance" title="Ten design choices for lawful permission and proportionate value return." />
                  <div className="grid gap-4 md:grid-cols-2">
                    {recommendations.map((recommendation, index) => (
                      <article className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm" key={recommendation.title}>
                        <div className="mb-3 flex items-start gap-3">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cam-gold/45 bg-cam-gold/10 font-mono text-xs font-semibold text-[hsl(32_62%_25%)]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <h3 id={index === 0 ? "recommendations-heading" : undefined} className="font-serif text-xl leading-snug text-foreground">{recommendation.title}</h3>
                        </div>
                        <p className="pl-11 text-sm leading-relaxed text-foreground/75 md:text-base">{recommendation.effect}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="mt-8" aria-labelledby="architecture-heading">
                  <SectionHeading
                    eyebrow="Proposed national architecture"
                    title="Seven connected scheme limbs, with permission and value return kept legally distinct."
                    body="The architecture combines domestic training authority, corpus clearance, market-access duties, provider contributions, allocation mechanisms, and downstream durability."
                  />
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {architecture.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <article className={`rounded-2xl border border-border/80 bg-card p-5 shadow-sm ${index === architecture.length - 1 ? "lg:col-start-2" : ""}`} key={item.title}>
                          <Icon className="mb-4 h-5 w-5 text-[hsl(32_62%_25%)]" aria-hidden="true" />
                          <h3 id={index === 0 ? "architecture-heading" : undefined} className="font-serif text-xl leading-snug text-foreground">{item.title}</h3>
                          <p className="mt-3 text-sm leading-relaxed text-foreground/75 md:text-base">{item.body}</p>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="mt-8 rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8" aria-labelledby="publication-details-heading">
                  <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
                    <div>
                      <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Publication details</p>
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
                          <dd className="mt-1 text-foreground">Sol 5.6 Extra High thinking</dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Project identity</dt>
                          <dd className="mt-1 text-foreground">Aeon Governance Lab™</dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Status</dt>
                          <dd className="mt-1 text-foreground">Independent public policy proposal</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <p id="publication-details-heading" className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Suggested citation</p>
                      <blockquote className="rounded-xl border border-border/80 bg-background/60 p-5 font-mono text-sm leading-relaxed text-foreground md:text-[15px]">
                        {suggestedCitation}
                      </blockquote>

                      <div className="mt-5 rounded-xl border border-primary/20 bg-background/45 p-5">
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Governance posture</p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/75 md:text-base">
                          This is an independent public policy proposal. It does not constitute legal, taxation, or investment advice. Indicative bands and implementation periods require empirical testing and legislative design.
                        </p>
                      </div>

                      <a className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:text-foreground" href="mailto:ethics@cam-initiative.org?subject=CAM%20Policy%20Proposal%2001%2F2026">
                        Discuss the proposal
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </section>
              </div>
            </details>
          </motion.div>
        </section>
      </main>
    </Shell>
  );
}
