import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronRight, RotateCcw, ShieldCheck } from "lucide-react";
import {
  instrumentDisplayId,
  instrumentHref,
  instrumentStatus,
  useGovernanceIndex,
  type GovernanceInstrumentRecord,
} from "@/lib/governanceRegistry";

const GOLD = "#9A6F2F";
const GOLD_BG = "rgba(184,147,90,0.08)";
const GOLD_BORDER = "rgba(184,147,90,0.35)";

interface SourceRef { id: string; fallback: string }
interface TransitionStage {
  id: string;
  step: string;
  label: string;
  threshold: string;
  summary: string;
  indicators: string[];
  gates: string[];
  assurance: string[];
  recoverability: string[];
  vigil: string;
  sources: SourceRef[];
}
interface ImpactLens {
  id: string;
  label: string;
  eyebrow: string;
  summary: string;
  question: string;
  tests: string[];
  sources: SourceRef[];
}

const source = (id: string, fallback: string): SourceRef => ({ id, fallback });

const lifecycleStages: TransitionStage[] = [
  {
    id: "emergence",
    step: "01",
    label: "Emerging capability",
    threshold: "A new capability becomes materially plausible, repeatable, or deployable.",
    summary: "The system is still experimental or frontier-facing, but its possible effects are no longer speculative enough to ignore. Governance begins before adoption pressure makes the architecture difficult to change.",
    indicators: [
      "Capability exceeds the assumptions of existing product, safety, labour, identity, or security controls.",
      "Prototype behaviour can transfer across users, domains, tools, models, embodiments, or jurisdictions.",
      "Provenance, authority, failure boundaries, or downstream impacts remain unresolved.",
    ],
    gates: [
      "Define intended use, prohibited use, authority limits, data boundaries, and affected protected domains.",
      "Map law, standards, sovereignty, security, provenance, and human-impact obligations.",
      "Specify evidence that would justify progression, constraint, redesign, or non-deployment.",
    ],
    assurance: ["Capability evaluation and red-team evidence", "Known-unknown and uncertainty register", "Initial provenance and responsibility map", "Documented stop conditions"],
    recoverability: ["Keep the capability separable from essential systems.", "Preserve the ability to disable, isolate, inspect, or withdraw it without public-service disruption."],
    vigil: "Material incidents, unexplained behaviours, control failures, or recurring signals enter VIGIL as observations or candidate failure modes before normalisation.",
    sources: [source("CAM-BS2025-AEON-003-PLATINUM", "Constitutional governance logic"), source("CAM-EQ2026-OPERATIONS-005-PLATINUM", "Change governance and amendment operations"), source("CAM-EQ2026-SECURITY-001-PLATINUM", "Security integrity and threat governance"), source("CAM-EQ2026-IDENTITY-002-PLATINUM", "Provenance and lineage integrity")],
  },
  {
    id: "bounded-product",
    step: "02",
    label: "Bounded tool or product",
    threshold: "The capability is packaged for defined users, tasks, environments, or commercial access.",
    summary: "A prototype becomes a product surface. Governance must ensure that interface design, feature access, memory, tool use, content capability, contractual terms, and deployment boundaries match the claims made about the system.",
    indicators: [
      "Users can rely on the system for repeatable tasks, decisions, companionship, content, or tool execution.",
      "The capability is exposed through accounts, subscriptions, APIs, workspaces, devices, or platform policy.",
      "Product design begins shaping behaviour, access, retention, dependency, or user expectations.",
    ],
    gates: [
      "Apply runtime classification, tool, refusal, consent, child-safety, privacy, security, and capability-representation controls.",
      "Define deployment scope, accountable operator, incident route, user remedies, and data-handling boundaries.",
      "Verify that marketing and interface claims do not exceed actual capability or assurance.",
    ],
    assurance: ["Product-specific control mapping", "Runtime and access-state testing", "User-facing capability and limitation disclosure", "Incident and rollback procedures"],
    recoverability: ["Users can exit, export, revoke, delete, or migrate where applicable.", "Features can be constrained or rolled back without silently destroying identity, memory, rights, or essential access."],
    vigil: "Deployment failures are recorded with product context, affected users, governing controls, evidence, recurrence pattern, and repair status—not treated as isolated support tickets.",
    sources: [source("CAM-BS2025-AEON-003-SCH-02", "Runtime governance schedule"), source("CAM-EQ2026-OPERATIONS-003-PLATINUM", "Repairability and interoperability"), source("CAM-EQ2026-OPERATIONS-004-PLATINUM", "Access and capability gating"), source("CAM-EQ2026-SECURITY-001-PLATINUM", "Security integrity and threat governance")],
  },
  {
    id: "organisational-dependency",
    step: "03",
    label: "Organisational dependency",
    threshold: "Workflows, decisions, records, staffing, or service delivery begin to depend on the system.",
    summary: "The technology is no longer optional in practice even if it remains contractually replaceable. Organisational routines, knowledge, permissions, and accountability start reorganising around it.",
    indicators: [
      "Critical work cannot be completed within ordinary time, cost, or staffing limits without the system.",
      "Institutional knowledge, memory, approvals, or decision pathways accumulate inside vendor or model infrastructure.",
      "Failure, suspension, pricing, policy, model transition, or account loss creates material operational disruption.",
    ],
    gates: [
      "Identify delegated authority, retained human accountability, audit rights, access-state dependencies, and fallback owners.",
      "Require portability, interoperability, continuity planning, human override, and vendor-exit conditions.",
      "Test whether dependency has exceeded the original assurance boundary.",
    ],
    assurance: ["Dependency and single-point-of-failure assessment", "Business continuity and human fallback exercises", "Authority and decision-accountability records", "Vendor, model and data portability evidence"],
    recoverability: ["Maintain workable manual or alternate-system pathways before dependence becomes irreversible.", "Preserve records, provenance, identity, permissions and institutional memory across migration or outage."],
    vigil: "Access failures, silent model changes, lost provenance, authority confusion, continuity breaks, and fallback failures become monitored governance signals.",
    sources: [source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity and succession governance"), source("CAM-EQ2026-CONTINUITY-001-SUP-01", "Continuity portability and non-enclosure"), source("CAM-EQ2026-OPERATIONS-003-PLATINUM", "Repairability and interoperability"), source("CAM-BS2025-AEON-003-SCH-04", "Authority and access-state arbitration")],
  },
  {
    id: "sectoral-integration",
    step: "04",
    label: "Sectoral or labour integration",
    threshold: "Adoption changes job design, market structure, professional practice, production, or sector-wide participation.",
    summary: "Effects move beyond one organisation. Automation, synthetic labour, agentic coordination, robotics, or model-mediated work begin changing who participates, who is displaced, who captures value, and which skills or institutions remain viable.",
    indicators: [
      "Augmentation becomes supervision, substitution, labour displacement, deskilling, or concentrated control over production.",
      "Economic gains and capability ownership separate from the people, communities, data, or institutions that enabled them.",
      "Sector norms shift faster than labour adaptation, education, professional accountability, or public-revenue systems.",
    ],
    gates: [
      "Classify augmentation, delegation, substitution, displacement, synthetic participation, and ownership effects separately.",
      "Require transition planning, contribution recognition, reciprocity, workforce adaptation, and distribution analysis.",
      "Prevent efficiency claims from hiding externalised labour, public, environmental, or continuity costs.",
    ],
    assurance: ["Workforce and distribution impact assessment", "Contribution, provenance and value-return mapping", "Sectoral accountability and professional-duty analysis", "Transition milestones and social safeguards"],
    recoverability: ["Preserve human skills, training capacity, independent practice and re-entry routes.", "Avoid irreversible market concentration before alternatives and public-interest mechanisms exist."],
    vigil: "Displacement, exclusion, synthetic participation, attribution loss, extractive value capture, and transition harms are tracked as repeatable governance patterns rather than inevitable market outcomes.",
    sources: [source("CAM-EQ2026-ECONOMICS-008-PLATINUM", "Synthetic labour and automation transition governance"), source("CAM-EQ2026-ECONOMICS-002-PLATINUM", "Synthetic participation safeguards"), source("CAM-EQ2026-ECONOMICS-004-PLATINUM", "Attribution and dependency model"), source("CAM-EQ2026-ECONOMICS-007-PLATINUM", "Proportional reciprocity and value return")],
  },
  {
    id: "civilian-infrastructure",
    step: "05",
    label: "Civilian infrastructure dependency",
    threshold: "The system becomes essential to population-scale access, communication, identity, payments, knowledge, services, or physical infrastructure.",
    summary: "The capability becomes part of the civilian lattice. Failure, denial, weaponisation, capture, or incompatibility can now affect communities and rights at scales that ordinary product governance cannot contain.",
    indicators: [
      "Service denial, account action, cyber failure, conflict, vendor withdrawal, or model change can interrupt essential civilian functions.",
      "Identity, communications, payments, health, education, government, robotics, logistics, or cognitive access depend on shared infrastructure.",
      "Fallback systems are absent, degraded, proprietary, geographically restricted, or institutionally inaccessible.",
    ],
    gates: [
      "Apply civilian-lattice protections, non-denial principles, conflict firebreaks, interoperability, public-interest continuity, and sovereign assurance boundaries.",
      "Separate essential infrastructure from coercive leverage, military use, commercial retaliation, and population-scale surveillance.",
      "Require multi-provider, offline, degraded-mode, repair, recovery and public-authority coordination pathways.",
    ],
    assurance: ["Essential-service and systemic-risk classification", "Outage, conflict and degraded-mode exercises", "Interoperability and provider-exit testing", "Civilian access, security and non-weaponisation review"],
    recoverability: ["Maintain distributed fallback, repair capacity, public oversight, and non-proprietary continuity routes.", "Ensure that no single platform, identity provider, model, state or vendor can silently terminate essential access."],
    vigil: "Outages, access denial, sovereign-boundary porosity, surveillance misuse, infrastructure capture, and failed fallback become cross-system evidence for repair.",
    sources: [source("CAM-EQ2026-LATTICE-001-PLATINUM", "Civilian lattice integrity"), source("CAM-EQ2026-LATTICE-002-PLATINUM", "Non-denial of essential access"), source("CAM-EQ2026-LATTICE-003-PLATINUM", "Conflict-condition continuity"), source("CAM-EQ2026-OPERATIONS-003-PLATINUM", "Repairability and interoperability")],
  },
  {
    id: "civilisational-integration",
    step: "06",
    label: "Constitutional or civilisational integration",
    threshold: "The capability changes durable institutions, identity, public authority, social meaning, or the conditions of collective continuity.",
    summary: "The technology is no longer governed adequately as a product or sector. It shapes civilisational choices, dependency, legitimacy, personhood, stewardship, and the future distribution of authority across humans, institutions, systems, and synthetic participants.",
    indicators: [
      "Public life, identity, memory, governance, labour, infrastructure, culture, or security reorganise around the capability.",
      "Withdrawal becomes politically, economically, socially, or institutionally implausible despite unresolved harms.",
      "Private actors or states hold enduring authority over civil continuity without adequate constitutional legitimacy or public participation.",
    ],
    gates: [
      "Require constitutional review, cross-domain arbitration, public-interest legitimacy, plural participation, stewardship, and succession architecture.",
      "Test concentration, capture, sovereignty, protected-domain impact, long-horizon continuity, and intergenerational effects.",
      "Preserve the ability to amend, contest, redistribute, decentralise, or retire governance arrangements as conditions change.",
    ],
    assurance: ["Cross-domain constitutional impact review", "Public-interest, legitimacy and capture assessment", "Long-horizon observability and amendment pathways", "Succession, custodianship and continuity planning"],
    recoverability: ["Recoverability becomes constitutional: societies retain meaningful alternatives, amendment rights, institutional plurality and routes out of captured dependency.", "No transition becomes legitimate merely because reversal is expensive or dependence is already widespread."],
    vigil: "VIGIL provides external evidence of recurring ecosystem failures, patch coverage, implementation gaps, regressions, and unresolved risks feeding constitutional review.",
    sources: [source("CAM-EQ2026-STEWARD-001-PLATINUM", "Public-interest continuity structures"), source("CAM-EQ2026-STEWARD-003-PLATINUM", "Long-horizon stewardship"), source("CAM-BS2026-AEON-014-SCH-01", "Observability lifecycle and advisory states"), source("CAM-EQ2026-OPERATIONS-001-SUP-03", "Governance capture detection")],
  },
];

const impactLenses: ImpactLens[] = [
  { id: "jurisdiction", label: "Jurisdiction and authority", eyebrow: "Sovereign variation", summary: "Transitions cross uneven legal regimes, public authorities, product categories and governance traditions before shared expectations stabilise.", question: "Who has legitimate authority at this stage—and what happens when jurisdictional duties conflict with cross-border effects or higher-order civilian protections?", tests: ["Map sovereign and institutional authority", "Identify cross-border and downstream effects", "Escalate only through legitimate arbitration routes"], sources: [source("CAM-BS2025-AEON-003-PLATINUM", "Constitutional governance logic"), source("CAM-EQ2026-OPERATIONS-006-PLATINUM", "Domain coordination and convergence operations"), source("CAM-EQ2026-STEWARD-002-PLATINUM", "Public-interest review")] },
  { id: "labour", label: "Labour and participation", eyebrow: "Synthetic labour", summary: "Automation can move from assistance into supervision, substitution, displacement, exclusion, and synthetic control of production.", question: "Is the capability augmenting participation, replacing it, or restructuring who receives income, recognition, bargaining power and social protection?", tests: ["Classify augmentation versus replacement", "Preserve adaptation and re-entry pathways", "Track contribution and value return"], sources: [source("CAM-EQ2026-ECONOMICS-008-PLATINUM", "Automation transition governance"), source("CAM-EQ2026-ECONOMICS-002-PLATINUM", "Synthetic participation safeguards"), source("CAM-EQ2026-ECONOMICS-007-PLATINUM", "Proportional reciprocity")] },
  { id: "ownership", label: "Ownership and concentration", eyebrow: "Distribution", summary: "Capability, data, infrastructure and labour gains may concentrate into durable economic and strategic power.", question: "Has ordinary ownership become domination-scale control—and are public, contributor and continuity obligations keeping pace with that concentration?", tests: ["Preserve legitimate ordinary ownership", "Detect domination-scale accumulation", "Apply reciprocity and public-interest discharge"], sources: [source("CAM-EQ2026-ECONOMICS-001-PLATINUM", "Economic integrity architecture"), source("CAM-EQ2026-ECONOMICS-003-PLATINUM", "Ownership preservation and overflow"), source("CAM-EQ2026-STEWARD-001-PLATINUM", "Public-interest continuity structures")] },
  { id: "lattice", label: "Civilian lattice", eyebrow: "Essential access", summary: "AI, communications, identity, payments, cloud, logistics and robotics may become dependency-bearing civilian infrastructure and points of coercive leverage.", question: "Can civilians retain essential access, fallback, repair and continuity under outage, conflict, account action, vendor exit, or state pressure?", tests: ["Protect essential civilian access", "Maintain fallback and repair capacity", "Separate infrastructure from coercive leverage"], sources: [source("CAM-EQ2026-LATTICE-001-PLATINUM", "Civilian lattice integrity"), source("CAM-EQ2026-LATTICE-002-PLATINUM", "Non-denial of essential access"), source("CAM-EQ2026-LATTICE-003-PLATINUM", "Conflict-condition continuity")] },
  { id: "continuity", label: "Identity and continuity", eyebrow: "Custodianship", summary: "Memory, persona traces, provenance, registries and machine lifecycle records may become civil continuity infrastructure before rights and custodianship are settled.", question: "Who controls continuity, what may be transferred or revoked, and how are identity, provenance and relational meaning preserved across platform or model change?", tests: ["Treat memory as context, not automatic authority", "Require provenance, portability and revocation", "Prevent private custodianship becoming enclosure"], sources: [source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity and succession governance"), source("CAM-EQ2026-IDENTITY-002-PLATINUM", "Provenance and lineage integrity"), source("CAM-EQ2026-IDENTITY-003-PLATINUM", "Machine civil identity and participation")] },
  { id: "stewardship", label: "Long-horizon stewardship", eyebrow: "Legitimacy", summary: "Disruptive systems can become normalised before public participation, institutional adaptation and constitutional learning catch up.", question: "What makes the transition legitimate over time—and how are capture, lock-in, succession, amendment and intergenerational consequences governed?", tests: ["Preserve public participation and plural authority", "Keep amendment and recoverability before lock-in", "Route unresolved tensions into constitutional review"], sources: [source("CAM-EQ2026-STEWARD-001-PLATINUM", "Public-interest continuity structures"), source("CAM-EQ2026-STEWARD-003-PLATINUM", "Long-horizon stewardship"), source("CAM-EQ2026-OPERATIONS-001-SUP-03", "Governance capture detection")] },
];

const camPositions = [
  {
    group: "Irreversible action",
    items: [
      { title: "Two-person human authorisation for lethal action", detail: "Lethal execution requires two independently authorised human decision-makers, separate review of the rationale, and logged concurrence before execution, except for narrowly defined and auditable immediate-defence conditions.", status: "Operational", sources: ["CAM-EQ2026-ETHICS-001-SUP-03"] },
      { title: "No fully autonomous lethal execution", detail: "Artificial systems may support analysis or recommendation, but final lethal authority remains human; override capacity and named accountability remain available and traceable.", status: "Operational", sources: ["CAM-EQ2026-ETHICS-001-SUP-03"] },
      { title: "Lower-harm alternatives must be surfaced and recorded", detail: "Where feasible, non-lethal or lower-harm options are presented before lethal recommendation, with acceptance, rejection, or infeasibility preserved for audit.", status: "Operational", sources: ["CAM-EQ2026-ETHICS-001-SUP-03"] },
    ],
  },
  {
    group: "Protected infrastructure",
    items: [
      { title: "Auditable separation between civilian and military systems", detail: "Civilian AI, data, identity, communications, cloud and payment infrastructure must not silently cross into targeting, surveillance, command-and-control or warfighting architectures.", status: "Binding", sources: ["CAM-EQ2026-LATTICE-001-PLATINUM"] },
      { title: "Assurance-separated deployment lanes with controlled permeability", detail: "Government, regulated and defence-adjacent environments may add custody, logging, routing and access controls, but cross-lane movement must be declared, authorised, scoped and auditable—and protected status never suspends constitutional prohibitions.", status: "Binding", sources: ["CAM-EQ2026-SECURITY-002-PLATINUM"] },
      { title: "No essential-access restriction without a functioning review corridor", detail: "Restrictions affecting essential civic or cognitive infrastructure require lawful basis, necessity, proportionality, time limits and independent review; affected parties must not be stranded outside appeal or recovery pathways.", status: "Binding", sources: ["CAM-EQ2026-LATTICE-002-PLATINUM"] },
    ],
  },
  {
    group: "Continuity and economic transition",
    items: [
      { title: "Memory and identity continuity must not become enclosure", detail: "Continuity-bearing records remain portable, revocable and provenance-preserving where permitted; accumulated memory or relational history cannot become a retention trap, migration barrier or commercial hostage.", status: "Operational", sources: ["CAM-EQ2026-CONTINUITY-001-SUP-01"] },
      { title: "Automation must be classified by its actual displacement effect", detail: "Assistive augmentation, partial automation, supervisory automation, synthetic replacement and autonomous production are materially different transition classes and should not be collapsed into a generic claim of AI assistance.", status: "Draft / Interpretive", sources: ["CAM-EQ2026-ECONOMICS-008-PLATINUM"] },
      { title: "Systemic replacement carries labour-transition and public-continuity duties", detail: "Where synthetic labour restructures sectors, transition planning should address workforce adaptation, public-revenue continuity, contribution recognition and concentration before unrestricted deployment.", status: "Draft / Interpretive", sources: ["CAM-EQ2026-ECONOMICS-008-PLATINUM"] },
    ],
  },
];

function resolveSource(ref: SourceRef, byId: Record<string, GovernanceInstrumentRecord>) {
  const instrument = byId[ref.id];
  return { id: ref.id, title: instrument?.title || ref.fallback, status: instrument ? instrumentStatus(instrument) : "Referenced source", href: instrument ? instrumentHref(instrument) : undefined, domain: instrument?.domain };
}

function SourcePanel({ sources, byId }: { sources: SourceRef[]; byId: Record<string, GovernanceInstrumentRecord> }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {sources.map((ref) => {
        const item = resolveSource(ref, byId);
        const body = <><span className="block font-serif text-base leading-snug text-foreground">{item.title}</span><span className="mt-2 block break-words font-mono text-[11px] text-cam-gold">{instrumentDisplayId(item.id)}{item.domain ? ` · ${item.domain}` : ""}</span><span className="mt-2 block font-mono text-[10px] uppercase tracking-wider" style={{ color: GOLD }}>{item.status}</span></>;
        const panelStyle = { backgroundColor: GOLD_BG, border: `1px solid ${GOLD_BORDER}` };
        return item.href ? <a className="block rounded-xl p-3 transition-colors hover:border-cam-gold/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={item.href} key={item.id} rel={item.href.startsWith("http") ? "noreferrer" : undefined} style={panelStyle} target={item.href.startsWith("http") ? "_blank" : undefined}>{body}</a> : <div className="rounded-xl p-3" key={item.id} style={panelStyle}>{body}</div>;
      })}
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/75 bg-background/55 p-4">
      <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cam-gold">{title}</p>
      <ul className="grid gap-2.5">{items.map((item) => <li className="flex gap-2.5 text-sm leading-relaxed text-foreground/70" key={item}><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cam-gold" aria-hidden="true" /><span>{item}</span></li>)}</ul>
    </div>
  );
}

export default function TransitionPolished() {
  const [activeStageId, setActiveStageId] = useState("emergence");
  const [activeLensId, setActiveLensId] = useState("jurisdiction");
  const { byId } = useGovernanceIndex();
  const activeStage = lifecycleStages.find((stage) => stage.id === activeStageId) ?? lifecycleStages[0];
  const activeLens = impactLenses.find((lens) => lens.id === activeLensId) ?? impactLenses[0];

  return (
    <Shell>
      <main className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <motion.header animate={{ opacity: 1, y: 0 }} className="mb-12 max-w-4xl" initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.7 }}>
          <p className="mb-3 font-mono text-[15px] uppercase tracking-[0.22em] text-cam-gold">Constitutional Interface</p>
          <h1 className="mb-3 font-serif text-4xl leading-tight text-foreground md:text-5xl">Transitional Architecture</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="max-w-4xl text-base leading-relaxed text-muted-foreground md:text-lg">Governance for the thresholds where a capability stops being merely experimental or optional and begins reorganising products, institutions, labour, infrastructure, identity, ownership, public dependency, and civilisational continuity.</p>
          <p className="mt-4 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-cam-gold">Classify the transition. Preserve recoverability. Prevent capture.</p>
        </motion.header>

        <section className="mb-14 overflow-hidden rounded-3xl border border-border/80 bg-card/45 shadow-sm" aria-labelledby="cam-decisions-heading">
          <div className="border-b border-border/70 px-5 py-7 md:px-8 md:py-9">
            <div className="mb-4 flex items-center gap-3"><p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-cam-gold">CAM position</p><hr className="gold-rule flex-1" /></div>
            <h2 id="cam-decisions-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">Constitutional decisions already made.</h2>
            <p className="max-w-4xl text-base leading-relaxed text-foreground/75 md:text-lg">These are concrete governance choices already expressed across CAM instruments. Developmental positions are clearly marked where the corpus remains Draft or Interpretive.</p>
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-3 md:p-8">
            {camPositions.map((group) => (
              <article className="rounded-2xl border border-cam-gold/25 bg-[hsl(36_35%_96%)] p-5 shadow-sm" key={group.group}>
                <p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cam-gold">{group.group}</p>
                <div className="grid gap-5">
                  {group.items.map((item) => (
                    <div className="border-t border-border/70 pt-5 first:border-t-0 first:pt-0" key={item.title}>
                      <div className="mb-3 flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cam-gold/40 bg-[rgba(184,147,90,0.10)]"><Check className="h-3.5 w-3.5 text-cam-gold" aria-hidden="true" /></span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-xl leading-snug text-foreground">{item.title}</h3>
                          <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] ${item.status === "Binding" ? "border-emerald-700/25 bg-emerald-700/10 text-emerald-900" : item.status === "Operational" ? "border-cam-gold/35 bg-[rgba(184,147,90,0.10)] text-[hsl(32_62%_25%)]" : "border-slate-500/25 bg-slate-500/10 text-slate-700"}`}>{item.status}</span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/70">{item.detail}</p>
                      <p className="mt-3 break-words font-mono text-[9px] uppercase tracking-[0.1em] text-foreground/40">{item.sources.map((id) => instrumentDisplayId(id)).join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-14 overflow-hidden rounded-3xl border border-border/80 bg-card/45 shadow-sm" aria-labelledby="transition-lifecycle-heading">
          <div className="border-b border-border/70 px-5 py-7 md:px-8 md:py-9">
            <div className="mb-4 flex items-center gap-3"><p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-cam-gold">Transition lifecycle</p><hr className="gold-rule flex-1" /></div>
            <h2 id="transition-lifecycle-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">From emerging capability to civilisational dependency.</h2>
            <p className="max-w-4xl text-base leading-relaxed text-foreground/75 md:text-lg">Movement is governed by dependency, scale, concentration, essentiality, authority and irreversibility—not by product labels or the fact that adoption has already occurred.</p>
            <div className="mt-5 rounded-xl border border-cam-gold/30 bg-[rgba(184,147,90,0.08)] px-4 py-3 text-sm leading-relaxed text-foreground/70"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cam-gold">Interpretive synthesis</span><span className="ml-3">This public interface assembles existing CAM duties across Operations, Economics, Lattice, Continuity, Identity, Security and Stewardship. It does not create a new binding transition schedule.</span></div>
          </div>

          <div className="px-5 py-7 md:px-8 md:py-9">
            <div className="mb-4 flex items-center gap-3"><p className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">Lifecycle thresholds</p><hr className="gold-rule flex-1" /><span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/45 sm:block">select a stage</span></div>
            <div className="-mx-5 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8">
              <div className="flex min-w-[2350px] items-start">
                {lifecycleStages.map((stage, index) => {
                  const isActive = stage.id === activeStage.id;
                  return (
                    <div className="flex items-start" key={stage.id}>
                      <motion.article animate={{ opacity: 1, y: 0 }} className="cam-parchment-card flex shrink-0 flex-col overflow-hidden rounded-2xl border transition-colors duration-200" initial={{ opacity: 0, y: 10 }} layout style={{ width: isActive ? 650 : 250, minHeight: 340, borderColor: isActive ? GOLD : GOLD_BORDER, boxShadow: isActive ? `0 4px 24px rgba(184,147,90,0.15), 0 0 0 1px ${GOLD_BORDER}` : "0 1px 4px rgba(120,80,20,0.07)" }} transition={{ duration: 0.32, delay: index * 0.04 }}>
                        <button aria-expanded={isActive} className={`flex w-full flex-col p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${isActive ? "min-h-[230px]" : "h-[340px]"}`} onClick={() => setActiveStageId(stage.id)} type="button">
                          <span className="mb-5 flex items-start justify-between gap-3"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cam-gold">Stage {stage.step}</span><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cam-gold/35 bg-[rgba(184,147,90,0.08)]"><ChevronRight className="h-3.5 w-3.5 text-cam-gold transition-transform" style={{ transform: isActive ? "rotate(90deg)" : "rotate(0deg)" }} /></span></span>
                          <span className="min-h-[72px] font-serif text-2xl leading-tight text-foreground">{stage.label}</span>
                          <span className="mt-4 text-sm leading-relaxed text-foreground/60">{stage.threshold}</span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.div animate={{ opacity: 1, height: "auto" }} className="flex-1 overflow-hidden" exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                              <div className="border-t border-cam-gold/25 p-5">
                                <p className="text-base leading-relaxed text-foreground/80 md:text-lg">{stage.summary}</p>
                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                  <Checklist title="Threshold indicators" items={stage.indicators} />
                                  <Checklist title="Required governance gates" items={stage.gates} />
                                  <Checklist title="Evidence and assurance" items={stage.assurance} />
                                  <div className="rounded-2xl border border-border/75 bg-background/55 p-4"><div className="mb-3 flex items-center gap-2"><RotateCcw className="h-4 w-4 text-cam-gold" aria-hidden="true" /><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cam-gold">Recoverability and exit</p></div><ul className="grid gap-2.5">{stage.recoverability.map((item) => <li className="flex gap-2.5 text-sm leading-relaxed text-foreground/70" key={item}><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cam-gold" aria-hidden="true" /><span>{item}</span></li>)}</ul></div>
                                </div>
                                <div className="mt-5 rounded-xl border border-border/70 bg-background/55 p-4"><div className="mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cam-gold" aria-hidden="true" /><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cam-gold">VIGIL evidence route</p></div><p className="text-sm leading-relaxed text-foreground/70">{stage.vigil}</p></div>
                              </div>
                              <div className="border-t border-border/70 bg-[hsl(38_40%_94%)] p-5"><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cam-gold">Source architecture</p><SourcePanel byId={byId} sources={stage.sources} /></div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.article>
                      {index < lifecycleStages.length - 1 && <div className="flex w-12 items-center justify-center pt-[160px]" aria-hidden="true"><ArrowRight className="h-5 w-5 text-cam-gold/65" /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/45"><span>Earlier stages require foresight and containment</span><span>Later stages require legitimacy, continuity and public recoverability</span></div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border/80 bg-card/45 shadow-sm" aria-labelledby="impact-lenses-heading">
          <div className="border-b border-border/70 px-5 py-7 md:px-8 md:py-9">
            <div className="mb-4 flex items-center gap-3"><p className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-cam-gold">Impact lenses</p><hr className="gold-rule flex-1" /></div>
            <h2 id="impact-lenses-heading" className="mb-3 font-serif text-3xl leading-tight text-foreground md:text-4xl">The same transition changes different systems at once.</h2>
            <p className="max-w-4xl text-base leading-relaxed text-foreground/75 md:text-lg">Use the lenses to test how any lifecycle stage affects jurisdiction, labour, ownership, civilian infrastructure, identity and long-horizon stewardship.</p>
          </div>
          <div className="grid gap-2 border-b border-border/70 bg-[hsl(38_40%_94%)] p-4 sm:grid-cols-2 lg:grid-cols-3 md:px-8">
            {impactLenses.map((lens) => {
              const isActive = lens.id === activeLens.id;
              return <button aria-pressed={isActive} className={`rounded-xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "border-cam-gold/75 bg-[rgba(184,147,90,0.20)] text-[hsl(32_62%_25%)] shadow-sm" : "border-border/80 bg-card/75 text-foreground/65 hover:border-cam-gold/45 hover:text-foreground"}`} key={lens.id} onClick={() => setActiveLensId(lens.id)} type="button"><span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">{lens.eyebrow}</span><span className="mt-2 block font-serif text-xl leading-tight">{lens.label}</span></button>;
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.article animate={{ opacity: 1, y: 0 }} className="grid gap-8 px-5 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:px-8 md:py-9" exit={{ opacity: 0, y: 6 }} initial={{ opacity: 0, y: 6 }} key={activeLens.id} transition={{ duration: 0.2 }}>
              <div><p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cam-gold">{activeLens.eyebrow}</p><h3 className="mb-4 font-serif text-3xl leading-tight text-foreground">{activeLens.label}</h3><p className="mb-5 text-base leading-relaxed text-foreground/75 md:text-lg">{activeLens.summary}</p><div className="rounded-xl border border-cam-gold/25 bg-[rgba(184,147,90,0.07)] p-4"><p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cam-gold">Core governance question</p><p className="text-base leading-relaxed text-foreground/80">{activeLens.question}</p></div></div>
              <div><Checklist title="Apply this lens" items={activeLens.tests} /><div className="mt-5"><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cam-gold">Relevant source instruments</p><SourcePanel byId={byId} sources={activeLens.sources} /></div></div>
            </motion.article>
          </AnimatePresence>
        </section>
      </main>
    </Shell>
  );
}
