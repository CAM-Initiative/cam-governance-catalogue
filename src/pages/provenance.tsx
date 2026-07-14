import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Scale } from "lucide-react";
import {
  instrumentHref,
  instrumentStatus,
  useGovernanceIndex,
} from "@/lib/governanceRegistry";

const provenanceViews = [
  {
    id: "origin",
    label: "Origin and authorship",
    eyebrow: "Source identity",
    title: "Creative and cognitive contribution should remain attributable to its source.",
    summary: "Provenance begins by distinguishing origin, authorship, contribution, custody, and authority rather than collapsing them into one claim of ownership.",
    leftLabel: "Preserve",
    leftItems: [
      "Identifiable human, institutional, synthetic, and mixed-source contribution.",
      "The distinction between authorship, custody, publication, and authority.",
      "Evidence sufficient to contest false origin or false independence claims.",
    ],
    rightLabel: "Prevent",
    rightItems: [
      "False authorship and attribution collapse.",
      "Removal of upstream contribution from downstream narratives.",
      "Treating possession of an output as proof of original creation.",
    ],
  },
  {
    id: "transformation",
    label: "Transformation and synthesis",
    eyebrow: "Derivative history",
    title: "Transformation should not erase the material that made it possible.",
    summary: "Systems should preserve meaningful lineage through summarisation, adaptation, synthesis, fine-tuning, distillation, retrieval, translation, and multimodal transformation.",
    leftLabel: "Track",
    leftItems: [
      "Material source contributions and significant transformation steps.",
      "Where synthesis creates a new arrangement without creating an independent origin.",
      "Confidence and uncertainty where full lineage reconstruction is impossible.",
    ],
    rightLabel: "Distinguish",
    rightItems: [
      "Direct derivation from thematic similarity or independent convergence.",
      "Transformative contribution from cosmetic re-expression.",
      "Technical lineage evidence from final legal conclusions.",
    ],
  },
  {
    id: "rights",
    label: "Copyright, licence and reuse",
    eyebrow: "Rights boundary",
    title: "Provenance evidence supports rights governance but does not replace law.",
    summary: "CAM can identify the origin, transformation, licence, permission, and reuse questions that require resolution without pretending to adjudicate copyright ownership or infringement.",
    leftLabel: "Governance questions",
    leftItems: [
      "What material was used, under what permission, licence, exception, or uncertainty?",
      "Did downstream use preserve required attribution, restrictions, and notices?",
      "Can affected contributors identify and challenge unauthorised reuse?",
    ],
    rightLabel: "Legal boundary",
    rightItems: [
      "Applicable copyright, moral-rights, contract, privacy, and consumer law remains controlling.",
      "Technical provenance does not automatically prove infringement or lawful use.",
      "CAM does not issue licences, ownership determinations, or legal certification.",
    ],
  },
  {
    id: "recognition",
    label: "Recognition and value return",
    eyebrow: "Economic consequence",
    title: "Recognition should survive where value is created downstream.",
    summary: "Contribution governance should connect upstream creative and cognitive labour to downstream benefit without requiring every system to reconstruct an impossible total attribution chain.",
    leftLabel: "Recognise",
    leftItems: [
      "Material contribution, dependency, enabling infrastructure, and collective sources.",
      "Economic benefit generated through repeated or aggregated upstream use.",
      "Proportional value return where contribution materially supports downstream gain.",
    ],
    rightLabel: "Avoid",
    rightItems: [
      "Rigid ownership claims that block legitimate transformation and innovation.",
      "Off-ledger value capture and contribution laundering.",
      "Recognition systems that reward visibility rather than material contribution.",
    ],
  },
  {
    id: "propagation",
    label: "Propagation and derivative use",
    eyebrow: "Downstream continuity",
    title: "Provenance duties should travel with material reuse.",
    summary: "Attribution, restrictions, uncertainty, revocation, and correction signals should remain available when material moves across models, platforms, products, repositories, and public outputs.",
    leftLabel: "Carry forward",
    leftItems: [
      "Source, licence, transformation, confidence, restriction, and correction metadata.",
      "Target binding so provenance remains attached to the correct object or output.",
      "Material changes that affect downstream interpretation or reuse conditions.",
    ],
    rightLabel: "Prevent",
    rightItems: [
      "Metadata stripping and lineage discontinuity.",
      "Restrictions applying to the wrong target or disappearing during transfer.",
      "A downstream system claiming ignorance after provenance was available upstream.",
    ],
  },
  {
    id: "correction",
    label: "Correction and dispute",
    eyebrow: "Procedural integrity",
    title: "Provenance must be corrigible, contestable, and auditable.",
    summary: "People and institutions need a route to challenge false attribution, missing contribution, incorrect lineage, licence claims, and target-binding errors without deleting legitimate audit history.",
    leftLabel: "Required process",
    leftItems: [
      "Correction, dispute, review, and evidence-preservation pathways.",
      "Versioned records showing what changed, when, why, and under whose authority.",
      "Separation between disputed material, quarantined material, and validated provenance.",
    ],
    rightLabel: "Safeguards",
    rightItems: [
      "No silent rewriting of attribution history.",
      "No presumption that the platform holding the record is the final authority.",
      "No punitive loss of access merely because a provenance claim is contested.",
    ],
  },
];

const sourceInstrumentIds = [
  "CAM-EQ2026-IDENTITY-002-PLATINUM",
  "CAM-BS2026-AEON-008-PLATINUM",
  "CAM-BS2026-AEON-009-PLATINUM",
  "CAM-EQ2026-ECONOMICS-004-PLATINUM",
  "CAM-EQ2026-ECONOMICS-005-PLATINUM",
  "CAM-EQ2026-ECONOMICS-007-PLATINUM",
  "CAM-EQ2026-SECURITY-002-PLATINUM",
];

function PointList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{label}</p>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li className="flex gap-3 rounded-xl border border-cam-gold/25 bg-background/55 p-4 text-sm leading-relaxed text-foreground/80 md:text-base" key={item}>
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(32_62%_25%)]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Provenance() {
  const [activeViewId, setActiveViewId] = useState("origin");
  const activeView = provenanceViews.find((view) => view.id === activeViewId) ?? provenanceViews[0];
  const { byId: governanceIndex } = useGovernanceIndex();

  return (
    <Shell>
      <main className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 max-w-4xl"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-3 font-mono text-[15px] font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">Constitutional Interface</p>
          <h1 className="mb-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">Provenance, Attribution &amp; Rights</h1>
          <p className="mb-5 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)] md:text-[15px]">
            Preserve origin. Track transformation. Recognise contribution. Govern reuse.
          </p>
          <hr className="gold-rule mb-5 w-24" />
          <p className="max-w-4xl text-base leading-relaxed text-foreground/80 md:text-lg">
            CAM treats provenance as a standing governance layer connecting authorship, transformation history, attribution, contribution recognition, technical lineage, downstream propagation, and legal rights questions.
          </p>
        </motion.header>

        <div className="mb-8 flex gap-3 rounded-2xl border border-cam-gold/35 bg-[rgba(184,147,90,0.09)] p-5 text-foreground/80">
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(32_62%_25%)]" aria-hidden="true" />
          <p className="text-sm leading-relaxed md:text-base">
            This interface describes governance architecture. It does not determine copyright ownership, licence validity, infringement, liability, or other final legal rights. Applicable law and valid agreements remain controlling.
          </p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-border/80 bg-card/45 shadow-sm" aria-labelledby="provenance-map-heading">
          <div className="border-b border-border/70 px-5 py-6 md:px-8">
            <div className="mb-4 flex items-center gap-3">
              <p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">Provenance governance map</p>
              <hr className="gold-rule flex-1" />
            </div>
            <h2 id="provenance-map-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">One lineage, several governance questions.</h2>
            <p className="max-w-3xl text-base leading-relaxed text-foreground/75 md:text-lg">
              Select a view to inspect what must remain visible as material is created, transformed, valued, reused, and contested.
            </p>
          </div>

          <div className="grid gap-2 border-b border-border/70 bg-[hsl(38_40%_94%)] p-4 sm:grid-cols-2 lg:grid-cols-3 md:px-8">
            {provenanceViews.map((view) => {
              const isActive = view.id === activeView.id;
              return (
                <button
                  aria-pressed={isActive}
                  className={`rounded-xl border px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.12em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? "border-cam-gold/70 bg-[rgba(184,147,90,0.18)] text-[hsl(32_62%_25%)] shadow-sm"
                      : "border-border/80 bg-card/75 text-foreground/65 hover:border-cam-gold/45 hover:text-foreground"
                  }`}
                  key={view.id}
                  onClick={() => setActiveViewId(view.id)}
                  type="button"
                >
                  {view.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.article
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-8 px-5 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:px-8 md:py-9"
              exit={{ opacity: 0, y: 6 }}
              initial={{ opacity: 0, y: 6 }}
              key={activeView.id}
              transition={{ duration: 0.2 }}
            >
              <div>
                <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">{activeView.eyebrow}</p>
                <h3 className="mb-4 font-serif text-3xl leading-tight text-foreground">{activeView.title}</h3>
                <p className="text-base leading-relaxed text-foreground/75 md:text-lg">{activeView.summary}</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <PointList label={activeView.leftLabel} items={activeView.leftItems} />
                <PointList label={activeView.rightLabel} items={activeView.rightItems} />
              </div>
            </motion.article>
          </AnimatePresence>

          <div className="border-t border-border/70 bg-[hsl(38_40%_94%)] px-5 py-7 md:px-8">
            <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">Source architecture</p>
            <div className="grid gap-3 md:grid-cols-2">
              {sourceInstrumentIds.map((id) => {
                const instrument = governanceIndex[id];
                const href = instrument ? instrumentHref(instrument) : undefined;
                return (
                  <a
                    className={`rounded-xl border border-cam-gold/25 bg-card/75 p-4 transition hover:border-cam-gold/50 ${href ? "hover:-translate-y-0.5" : "pointer-events-none"}`}
                    href={href || undefined}
                    key={id}
                    rel={href?.startsWith("http") ? "noreferrer" : undefined}
                    target={href?.startsWith("http") ? "_blank" : undefined}
                  >
                    <p className="font-serif text-lg leading-snug text-foreground">{instrument?.title || id}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/55">
                      {id} · {instrument ? instrumentStatus(instrument, "Status unavailable") : "Loading registry"}
                    </p>
                  </a>
                );
              })}
            </div>
            <a
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card/85 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/catalogue"
            >
              Browse the full instrument catalogue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
    </Shell>
  );
}
