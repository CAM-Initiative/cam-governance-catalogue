import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function write(path, content) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function replaceOnce(path, before, after) {
  const source = read(path);
  const first = source.indexOf(before);
  const last = source.lastIndexOf(before);

  if (first === -1) {
    throw new Error(`Expected text was not found in ${path}`);
  }

  if (first !== last) {
    throw new Error(`Expected text occurs more than once in ${path}`);
  }

  write(path, source.replace(before, after));
}

const policyPage = `import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { ArrowRight, Download, ExternalLink, FileText, Landmark, Network, Scale, ShieldCheck } from "lucide-react";

const pdfHref = \`${"${import.meta.env.BASE_URL}"}publications/CAM_Initiative_Australian_AI_Training_and_Contribution_Policy_Proposal.pdf\`;

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

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16" aria-labelledby="policy-publications-heading">
          <SectionHeading
            eyebrow="Current publication"
            title="Independent policy proposals grounded in inspectable governance architecture."
            body="Policy papers are institutional outputs of the CAM Initiative. They apply CAM primitives to specific public problems without presenting the CAELESTIS corpus itself as legislation, economic modelling, or legal authority."
          />

          <motion.article
            className="cam-parchment-card overflow-hidden rounded-3xl border border-cam-gold/40 shadow-xl"
            id="policy-proposal-01-2026"
            initial={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.65 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="border-b border-cam-gold/30 bg-[hsl(36_48%_94%)] px-6 py-5 md:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Policy Proposal 01/2026</p>
                <span className="rounded-full border border-primary/25 bg-card/75 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/70">
                  Independent public policy proposal
                </span>
              </div>
            </div>

            <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">20 July 2026</p>
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
                    href={pdfHref}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download the policy paper
                  </a>
                  <a
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card/85 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={pdfHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open PDF in browser
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <aside className="h-fit rounded-2xl border border-border/80 bg-card/75 p-5 shadow-sm" aria-label="Publication details">
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
                        <span className="rounded-full border border-primary/20 bg-background/70 px-2.5 py-1 text-xs text-foreground/75" key={theme}>{theme}</span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>
          </motion.article>
        </section>

        <section className="border-y border-border/60 bg-[hsl(38_40%_94%)]" id="recommendations">
          <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
            <SectionHeading
              eyebrow="Recommendations at a glance"
              title="Ten design choices for lawful permission and proportionate value return."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((recommendation, index) => (
                <article className="rounded-2xl border border-border/80 bg-card/85 p-5 shadow-sm" key={recommendation.title}>
                  <div className="mb-3 flex items-start gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cam-gold/45 bg-cam-gold/10 font-mono text-xs font-semibold text-[hsl(32_62%_25%)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-serif text-xl leading-snug text-foreground">{recommendation.title}</h3>
                  </div>
                  <p className="pl-11 text-sm leading-relaxed text-foreground/75 md:text-base">{recommendation.effect}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <SectionHeading
            eyebrow="Proposed national architecture"
            title="Seven connected scheme limbs, with permission and value return kept legally distinct."
            body="The architecture combines domestic training authority, corpus clearance, market-access duties, provider contributions, allocation mechanisms, and downstream durability."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {architecture.map((item, index) => {
              const Icon = item.icon;
              return (
                <article className={`rounded-2xl border border-border/80 bg-card/85 p-5 shadow-sm ${index === architecture.length - 1 ? "lg:col-start-2" : ""}`} key={item.title}>
                  <Icon className="mb-4 h-5 w-5 text-[hsl(32_62%_25%)]" aria-hidden="true" />
                  <h3 className="font-serif text-xl leading-snug text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/75 md:text-base">{item.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-t border-border/60 bg-[hsl(38_40%_94%)]">
          <div className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
            <SectionHeading eyebrow="Citation and status" title="A permanent public record for policy engagement." />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <article className="rounded-2xl border border-border/80 bg-card/85 p-6 shadow-sm">
                <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Suggested citation</p>
                <blockquote className="border-l-2 border-cam-gold/70 pl-4 font-mono text-sm leading-relaxed text-foreground md:text-[15px]">
                  CAM Initiative. (2026). AI Training, Contribution &amp; Copyright Scheme: Copyright permission, contribution valuation and sovereign value return (Policy Proposal 01/2026). Human Custodian-of-Record: Dr Michelle Vivian O’Rourke.
                </blockquote>
              </article>
              <article className="rounded-2xl border border-primary/25 bg-background/55 p-6 shadow-sm">
                <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Governance posture</p>
                <p className="text-sm leading-relaxed text-foreground/75 md:text-base">
                  This is an independent public policy proposal. It does not constitute legal, taxation, or investment advice. Indicative bands and implementation periods require empirical testing and legislative design.
                </p>
                <a className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-cam-gold transition hover:text-foreground" href="mailto:ethics@cam-initiative.org?subject=CAM%20Policy%20Proposal%2001%2F2026">
                  Discuss the proposal
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </article>
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
`;

write("src/pages/policy.tsx", policyPage);

replaceOnce(
  "src/App.tsx",
  'import About from "@/pages/about";\nimport Privacy from "@/pages/privacy";',
  'import About from "@/pages/about";\nimport Policy from "@/pages/policy";\nimport Privacy from "@/pages/privacy";',
);

replaceOnce(
  "src/App.tsx",
  '      <Route path="/catalogue" component={Catalogue} />\n      <Route path="/privacy" component={Privacy} />',
  '      <Route path="/catalogue" component={Catalogue} />\n      <Route path="/policy" component={Policy} />\n      <Route path="/privacy" component={Privacy} />',
);

replaceOnce(
  "src/components/layout/Shell.tsx",
  '  { href: "/constitution", label: "Constitution", internal: true },\n  { href: "/vigil", label: "VIGIL", internal: true },',
  '  { href: "/constitution", label: "Constitution", internal: true },\n  { href: "/policy", label: "Policy", internal: true },\n  { href: "/vigil", label: "VIGIL", internal: true },',
);

replaceOnce(
  "src/components/layout/Shell.tsx",
  '  { href: "/constitution", label: "Constitution", internal: true },\n  { href: "/vigil", label: "VIGIL Ledger", internal: true },',
  '  { href: "/constitution", label: "Constitution", internal: true },\n  { href: "/policy", label: "Policy Papers", internal: true },\n  { href: "/vigil", label: "VIGIL Ledger", internal: true },',
);

replaceOnce(
  "src/components/layout/Shell.tsx",
  '  const links = [\n    { href: "/catalogue", label: "Catalogue", active: location === "/catalogue" },\n  ];',
  '  const links = [\n    { href: "/catalogue", label: "Catalogue", active: location === "/catalogue" },\n    { href: "/policy", label: "Policy", active: location === "/policy" || location.startsWith("/policy/") },\n  ];',
);

replaceOnce(
  "src/pages/home.tsx",
  `  {
    id: "vigil-observatory",
    title: "VIGIL Observatory",
    purpose: "Public evidence, observed failures, proposals, patch records, repair status, and post-patch monitoring.",
    description: "Explore the public ledger connecting real-world signals and failure modes to evidence, governance gaps, proposals, implemented patches, and continuing observation.",
    cta: "Browse the VIGIL Observatory",
    href: "/observatory",
  },
];`,
  `  {
    id: "vigil-observatory",
    title: "VIGIL Observatory",
    purpose: "Public evidence, observed failures, proposals, patch records, repair status, and post-patch monitoring.",
    description: "Explore the public ledger connecting real-world signals and failure modes to evidence, governance gaps, proposals, implemented patches, and continuing observation.",
    cta: "Browse the VIGIL Observatory",
    href: "/observatory",
  },
  {
    id: "policy-papers",
    title: "Policy Papers",
    purpose: "Public policy proposals translating CAM governance architecture into implementable institutional design.",
    description: "Read CAM Initiative policy papers applying governance primitives to law, public administration, market design, and technology transition.",
    cta: "Browse CAM Policy Papers",
    href: "/policy",
  },
];`,
);

replaceOnce(
  "src/pages/home.tsx",
  '        {initiativeResources.map((resource) => (\n          <article className="cam-parchment-card flex h-full flex-col rounded-2xl bg-[hsl(36_48%_96%)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cam-gold/55 hover:shadow-md" key={resource.id}>',
  '        {initiativeResources.filter((resource) => resource.id !== "policy-papers").map((resource) => (\n          <article className="cam-parchment-card flex h-full flex-col rounded-2xl bg-[hsl(36_48%_96%)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cam-gold/55 hover:shadow-md" key={resource.id}>',
);

replaceOnce(
  "docs/sitemap.xml",
  '  <url>\n    <loc>https://www.cam-initiative.org/observatory</loc>\n    <lastmod>2026-06-06</lastmod>\n  </url>',
  '  <url>\n    <loc>https://www.cam-initiative.org/policy</loc>\n    <lastmod>2026-07-20</lastmod>\n  </url>\n  <url>\n    <loc>https://www.cam-initiative.org/observatory</loc>\n    <lastmod>2026-06-06</lastmod>\n  </url>',
);

replaceOnce(
  "README.md",
  '* the VIGIL observatory for digital ecosystem health signals, observations, failure modes, proposals, and patch notes.',
  '* the VIGIL observatory for digital ecosystem health signals, observations, failure modes, proposals, and patch notes; and\n* CAM Initiative policy papers translating governance architecture into public policy proposals.',
);

const partPaths = Array.from({ length: 7 }, (_, index) => `.policy-pdf/part-${String(index).padStart(2, "0")}.b64`);
const encodedPdf = partPaths.map((path) => read(path).trim()).join("");
const pdf = Buffer.from(encodedPdf, "base64");
const pdfSha = createHash("sha256").update(pdf).digest("hex");
const expectedPdfSha = "9869a9f190764ae311e8b59d13dfcaf77bcaa6a5eb8fb621212ff5cca37bc4f1";

if (pdfSha !== expectedPdfSha) {
  throw new Error(`Policy PDF checksum mismatch: expected ${expectedPdfSha}, received ${pdfSha}`);
}

write("docs/publications/CAM_Initiative_Australian_AI_Training_and_Contribution_Policy_Proposal.pdf", pdf);

console.log("Applied Policy Papers source, navigation, sitemap, publication, and PDF asset updates.");
