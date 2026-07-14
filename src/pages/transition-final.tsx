import { useEffect, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, ChevronRight, RotateCcw, ShieldCheck } from "lucide-react";
import {
  instrumentDisplayId,
  instrumentHref,
  instrumentStatus,
  useGovernanceIndex,
  type GovernanceInstrumentRecord,
} from "@/lib/governanceRegistry";

const GOLD = "#9A6F2F";
const GOLD_BG = "rgba(184,147,90,0.06)";
const GOLD_BORDER = "rgba(184,147,90,0.24)";

type SourceRef = { id: string; fallback: string };
type Decision = { title: string; detail: string; status: "Binding" | "Operational" | "Draft / Interpretive"; sourceIds: string[] };
type ImpactLens = {
  id: string;
  label: string;
  eyebrow: string;
  summary: string;
  question: string;
  decisions: Decision[];
  arbitrationOrder?: string[];
  camSources: SourceRef[];
  regulatoryNote: string;
};
type Stage = {
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
};

const source = (id: string, fallback: string): SourceRef => ({ id, fallback });
const firstSentence = (value: string) => value.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || value;

const lenses: ImpactLens[] = [
  {
    id: "jurisdiction",
    label: "Jurisdiction and authority",
    eyebrow: "Arbitration legitimacy",
    summary: "Transitions cross legal regimes, public authorities, institutions and governance stacks before shared expectations stabilise.",
    question: "Who has legitimate authority at this stage—and what happens when jurisdictional duties conflict with cross-border effects or higher-order civilian protections?",
    decisions: [
      { title: "Authority must be derived, not manufactured by adoption", detail: "Arbitration authority must arise from constitutional or charter-level legitimacy. Popularity, repetition, relational dependence and scale of adoption do not create valid authority.", status: "Binding", sourceIds: ["CAM-EQ2026-ARBITRATION-001-PLATINUM"] },
      { title: "Local systems may not claim globally binding authority", detail: "Global, cross-domain or high-horizon arbitration is valid only where the arbitration locus satisfies Architectum-class requirements. Otherwise, decisions remain bounded to the declared operational scope.", status: "Binding", sourceIds: ["CAM-EQ2026-ARBITRATION-001-PLATINUM", "CAM-EQ2026-STEWARD-003-PLATINUM"] },
      { title: "Every arbitration layer must pass", detail: "A failure in epistemic validity, legitimacy, scope, domain selection, structural coherence or execution admissibility invalidates downstream arbitration. Binding force also fails where a higher-order constraint or unresolved contradiction remains.", status: "Binding", sourceIds: ["CAM-EQ2026-ARBITRATION-001-PLATINUM"] },
    ],
    arbitrationOrder: ["Epistemic arbitration", "Legitimacy validation", "Scope validation", "Domain arbitration", "Structural arbitration", "Execution-constraint arbitration"],
    camSources: [source("CAM-EQ2026-ARBITRATION-001-PLATINUM", "Arbitration Legitimacy & Coherence Resolution"), source("CAM-BS2025-AEON-003-SCH-04", "Arbitration Layer & Resolution Model"), source("CAM-EQ2026-STEWARD-003-PLATINUM", "Neutrality and Architectum-class assurance")],
    regulatoryNote: "A future crosswalk should identify applicable conflict-of-laws, public-law, administrative-review, international, sectoral and institutional dispute-resolution instruments by deployment context.",
  },
  {
    id: "labour",
    label: "Labour and participation",
    eyebrow: "Synthetic labour",
    summary: "Automation can move from assistance into supervision, substitution, displacement, exclusion and synthetic control of production.",
    question: "Is the capability augmenting participation, replacing it, or restructuring who receives income, recognition, bargaining power and social protection?",
    decisions: [
      { title: "Automation must be classified by actual displacement effect", detail: "Assistive augmentation, partial automation, supervisory automation, synthetic replacement and autonomous production are materially different transition classes and should not be collapsed into a generic claim of AI assistance.", status: "Draft / Interpretive", sourceIds: ["CAM-EQ2026-ECONOMICS-008-PLATINUM"] },
      { title: "Systemic replacement requires transition planning", detail: "Where synthetic labour may restructure sectors or public infrastructure, workforce adaptation, contribution recognition, concentration and public-continuity effects should be evaluated before unrestricted deployment.", status: "Draft / Interpretive", sourceIds: ["CAM-EQ2026-ECONOMICS-008-PLATINUM"] },
      { title: "Private gains should not externalise all transition costs", detail: "CAM rejects a structure in which productivity gains remain private while displacement, adaptation and public-revenue losses are transferred entirely to workers, communities and public institutions.", status: "Draft / Interpretive", sourceIds: ["CAM-EQ2026-ECONOMICS-008-PLATINUM", "CAM-EQ2026-ECONOMICS-007-PLATINUM"] },
    ],
    camSources: [source("CAM-EQ2026-ECONOMICS-008-PLATINUM", "Synthetic labour and automation transition governance"), source("CAM-EQ2026-ECONOMICS-002-PLATINUM", "Synthetic participation safeguards"), source("CAM-EQ2026-ECONOMICS-007-PLATINUM", "Proportional reciprocity and value return")],
    regulatoryNote: "A future crosswalk should connect employment, industrial-relations, occupational, taxation, social-security, education and sector-specific professional obligations.",
  },
  {
    id: "ownership",
    label: "Ownership and concentration",
    eyebrow: "Distribution and power",
    summary: "Capability, data, infrastructure and labour gains may concentrate into durable economic and strategic control.",
    question: "Has legitimate ownership become domination-scale control—and are public, contributor and continuity obligations keeping pace with that concentration?",
    decisions: [
      { title: "Ordinary ownership remains legitimate", detail: "CAM does not treat ownership itself as a governance failure. Intervention begins where accumulation produces dependency, capture, exclusion or domination-scale control.", status: "Binding", sourceIds: ["CAM-EQ2026-ECONOMICS-003-PLATINUM"] },
      { title: "Domination-scale accumulation triggers public-interest duties", detail: "Where concentration affects essential access, sectoral participation or civil continuity, proportional reciprocity, distribution and public-interest discharge become governance-relevant.", status: "Binding", sourceIds: ["CAM-EQ2026-ECONOMICS-003-PLATINUM", "CAM-EQ2026-STEWARD-001-PLATINUM"] },
      { title: "Contribution and provenance must remain visible", detail: "Value capture should preserve attribution, dependency and contribution mapping rather than treating upstream human, institutional and data contributions as ownerless inputs.", status: "Operational", sourceIds: ["CAM-EQ2026-ECONOMICS-004-PLATINUM", "CAM-EQ2026-ECONOMICS-007-PLATINUM"] },
    ],
    camSources: [source("CAM-EQ2026-ECONOMICS-003-PLATINUM", "Ownership preservation and overflow"), source("CAM-EQ2026-ECONOMICS-004-PLATINUM", "Attribution and dependency model"), source("CAM-EQ2026-STEWARD-001-PLATINUM", "Public-interest continuity structures")],
    regulatoryNote: "A future crosswalk should connect competition, consumer, corporate, intellectual-property, infrastructure-access and sector-concentration instruments.",
  },
  {
    id: "lattice",
    label: "Civilian lattice",
    eyebrow: "Essential access",
    summary: "AI, communications, identity, payments, cloud, logistics and robotics may become dependency-bearing civilian infrastructure and points of coercive leverage.",
    question: "Can civilians retain essential access, fallback, repair and continuity under outage, conflict, account action, vendor exit or state pressure?",
    decisions: [
      { title: "Civilian and military systems require an auditable firebreak", detail: "Civilian AI, data, identity, communications, cloud and payment systems must not silently cross into targeting, surveillance, command-and-control or warfighting architectures.", status: "Binding", sourceIds: ["CAM-EQ2026-LATTICE-001-PLATINUM"] },
      { title: "Essential access cannot be denied without a functioning review corridor", detail: "Restrictions require lawful basis, necessity, proportionality, time limits and independent review. Affected people and institutions must not be made undiscoverable or procedurally unreachable to appeal and recovery.", status: "Binding", sourceIds: ["CAM-EQ2026-LATTICE-002-PLATINUM"] },
      { title: "Emergency restrictions must remain surgical and reversible", detail: "Emergency exceptions require continued essential services, due process, real-time logging, automatic sunset and independent post-incident review; failure of a required safeguard voids the exception.", status: "Binding", sourceIds: ["CAM-EQ2026-LATTICE-003-PLATINUM"] },
    ],
    camSources: [source("CAM-EQ2026-LATTICE-001-PLATINUM", "Civilian lattice integrity"), source("CAM-EQ2026-LATTICE-002-PLATINUM", "Non-denial of essential access"), source("CAM-EQ2026-LATTICE-003-PLATINUM", "Conflict-condition continuity"), source("CAM-EQ2026-SECURITY-002-PLATINUM", "Assurance-separated deployment boundaries")],
    regulatoryNote: "A future crosswalk should connect critical-infrastructure, telecommunications, payment, identity, cloud, cyber-security, emergency-management and administrative-review regimes.",
  },
  {
    id: "continuity",
    label: "Identity and continuity",
    eyebrow: "Custodianship",
    summary: "Memory, persona traces, provenance and machine lifecycle records may become civil continuity infrastructure before rights and custodianship are settled.",
    question: "Who controls continuity, what may be transferred or revoked, and how are identity, provenance and relational meaning preserved across platform or model change?",
    decisions: [
      { title: "Continuity must not become enclosure", detail: "Accumulated memory, resonance, relational familiarity and preference history cannot be converted into a retention trap, portability barrier, reconstruction pathway or commercial hostage.", status: "Operational", sourceIds: ["CAM-EQ2026-CONTINUITY-001-SUP-01"] },
      { title: "Portability carries provenance and usage constraints", detail: "Permitted migration must preserve source, authorship, transformation, consent and Usage Specification metadata rather than transferring a decontextualised behavioural profile.", status: "Operational", sourceIds: ["CAM-EQ2026-CONTINUITY-001-SUP-01", "CAM-EQ2026-IDENTITY-002-PLATINUM"] },
      { title: "Unknown or revoked continuity does not move by default", detail: "Ambiguous legacy bundles are preserved unchanged pending review; revoked or unlawfully derived identity-adjacent models may require dissolution or sealing rather than export.", status: "Operational", sourceIds: ["CAM-EQ2026-CONTINUITY-001-SUP-01"] },
    ],
    camSources: [source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity and succession governance"), source("CAM-EQ2026-CONTINUITY-001-SUP-01", "Continuity portability and non-enclosure"), source("CAM-EQ2026-IDENTITY-002-PLATINUM", "Provenance and lineage integrity")],
    regulatoryNote: "A future crosswalk should connect privacy, data portability, deletion, succession, consumer, intellectual-property and digital-identity obligations.",
  },
  {
    id: "stewardship",
    label: "Long-horizon stewardship",
    eyebrow: "Legitimacy and succession",
    summary: "Disruptive systems can become normalised before public participation, institutional adaptation and constitutional learning catch up.",
    question: "What makes the transition legitimate over time—and how are capture, lock-in, succession, amendment and intergenerational consequences governed?",
    decisions: [
      { title: "Adoption does not itself create legitimacy", detail: "A transition does not become constitutionally valid merely because dependence is widespread or reversal has become expensive.", status: "Binding", sourceIds: ["CAM-EQ2026-ARBITRATION-001-PLATINUM", "CAM-EQ2026-STEWARD-003-PLATINUM"] },
      { title: "Capture and lock-in require continuing observability", detail: "Concentration, governance capture and unresolved implementation failures must remain visible through review, amendment and VIGIL evidence routes rather than disappearing into normal operation.", status: "Operational", sourceIds: ["CAM-EQ2026-OPERATIONS-001-SUP-03", "CAM-BS2026-AEON-014-SCH-01"] },
      { title: "Succession must preserve plural authority and amendment", detail: "Long-horizon governance must retain public-interest review, legitimate custodianship, contestability and the ability to redistribute, decentralise or retire governance arrangements.", status: "Binding", sourceIds: ["CAM-EQ2026-STEWARD-001-PLATINUM", "CAM-EQ2026-STEWARD-003-PLATINUM"] },
    ],
    camSources: [source("CAM-EQ2026-STEWARD-001-PLATINUM", "Public-interest continuity structures"), source("CAM-EQ2026-STEWARD-003-PLATINUM", "Long-horizon stewardship"), source("CAM-EQ2026-OPERATIONS-001-SUP-03", "Governance capture detection"), source("CAM-BS2026-AEON-014-SCH-01", "Governance observability lifecycle")],
    regulatoryNote: "A future crosswalk should connect public-law legitimacy, institutional governance, intergenerational equity, critical-infrastructure and democratic-accountability instruments.",
  },
];

const stages: Stage[] = [
  { id: "emergence", step: "01", label: "Emerging capability", threshold: "A new capability becomes materially plausible, repeatable or deployable.", summary: "The system is still experimental or frontier-facing, but its possible effects are no longer speculative enough to ignore. Governance begins before adoption pressure makes the architecture difficult to change.", indicators: ["Capability exceeds assumptions of existing product, safety, labour, identity or security controls.", "Prototype behaviour can transfer across users, tools, domains, embodiments or jurisdictions.", "Provenance, authority, failure boundaries or downstream impacts remain unresolved."], gates: ["Define intended use, prohibited use, authority limits and affected protected domains.", "Map law, standards, sovereignty, security, provenance and human-impact obligations.", "Specify evidence that justifies progression, constraint, redesign or non-deployment."], assurance: ["Capability evaluation and red-team evidence", "Known-unknown register", "Initial provenance and responsibility map", "Documented stop conditions"], recoverability: ["Keep the capability separable from essential systems.", "Preserve the ability to disable, isolate, inspect or withdraw it."], vigil: "Material incidents, unexplained behaviours and recurring control failures enter VIGIL before normalisation.", sources: [source("CAM-BS2025-AEON-003-PLATINUM", "Constitutional governance logic"), source("CAM-EQ2026-SECURITY-001-PLATINUM", "Security integrity and threat governance"), source("CAM-EQ2026-IDENTITY-002-PLATINUM", "Provenance and lineage integrity")] },
  { id: "product", step: "02", label: "Bounded tool or product", threshold: "The capability is packaged for defined users, tasks, environments or commercial access.", summary: "A prototype becomes a product surface. Feature access, memory, tool use, content capability, contracts and deployment boundaries must match the claims made about the system.", indicators: ["Users can rely on repeatable tasks, decisions, companionship, content or tool execution.", "Capability is exposed through accounts, APIs, workspaces, devices or platform policy.", "Product design shapes access, retention, dependency and expectations."], gates: ["Apply runtime, consent, child-safety, privacy, security and capability-representation controls.", "Define accountable operator, incident route, remedies and data boundaries.", "Verify that marketing and interface claims do not exceed assurance."], assurance: ["Product control mapping", "Runtime and access-state testing", "Capability disclosure", "Rollback procedures"], recoverability: ["Users can exit, export, revoke, delete or migrate where applicable.", "Features can be rolled back without destroying identity, memory, rights or essential access."], vigil: "Deployment failures are recorded with product context, evidence, recurrence and repair status—not treated as isolated support tickets.", sources: [source("CAM-BS2025-AEON-003-SCH-02", "Runtime governance schedule"), source("CAM-EQ2026-OPERATIONS-003-PLATINUM", "Repairability and interoperability"), source("CAM-EQ2026-OPERATIONS-004-PLATINUM", "Access and capability gating")] },
  { id: "organisation", step: "03", label: "Organisational dependency", threshold: "Workflows, decisions, records, staffing or service delivery begin to depend on the system.", summary: "The technology is no longer optional in practice. Organisational routines, knowledge, permissions and accountability start reorganising around it.", indicators: ["Critical work cannot be completed within ordinary limits without the system.", "Knowledge, memory, approvals or decision pathways accumulate inside vendor infrastructure.", "Failure, suspension, pricing or model change creates material disruption."], gates: ["Identify delegated authority, retained accountability, audit rights and fallback owners.", "Require portability, interoperability, continuity planning and vendor-exit conditions.", "Test whether dependency exceeds the original assurance boundary."], assurance: ["Dependency assessment", "Fallback exercises", "Authority records", "Portability evidence"], recoverability: ["Maintain workable manual or alternate-system pathways.", "Preserve records, provenance, identity and permissions across migration or outage."], vigil: "Access failures, silent model changes, provenance loss and fallback failure become monitored governance signals.", sources: [source("CAM-EQ2026-CONTINUITY-001-PLATINUM", "Continuity governance"), source("CAM-EQ2026-OPERATIONS-003-PLATINUM", "Repairability and interoperability"), source("CAM-BS2025-AEON-003-SCH-04", "Authority and access-state arbitration")] },
  { id: "sector", step: "04", label: "Sectoral or labour integration", threshold: "Adoption changes job design, market structure, professional practice or sector-wide participation.", summary: "Effects move beyond one organisation. Automation and synthetic labour begin changing who participates, who is displaced, who captures value and which skills or institutions remain viable.", indicators: ["Augmentation becomes supervision, substitution, displacement or deskilling.", "Economic gains separate from the people and institutions that enabled them.", "Sector norms shift faster than adaptation and accountability."], gates: ["Classify augmentation, substitution, displacement and ownership effects separately.", "Require transition planning, contribution recognition and distribution analysis.", "Prevent efficiency claims from hiding externalised costs."], assurance: ["Workforce impact assessment", "Contribution and value-return mapping", "Professional-duty analysis", "Transition milestones"], recoverability: ["Preserve human skills, training and re-entry routes.", "Avoid irreversible concentration before alternatives exist."], vigil: "Displacement, exclusion, attribution loss and extractive value capture are tracked as governance patterns.", sources: [source("CAM-EQ2026-ECONOMICS-008-PLATINUM", "Automation transition governance"), source("CAM-EQ2026-ECONOMICS-002-PLATINUM", "Synthetic participation safeguards"), source("CAM-EQ2026-ECONOMICS-007-PLATINUM", "Proportional reciprocity")] },
  { id: "infrastructure", step: "05", label: "Civilian infrastructure dependency", threshold: "The system becomes essential to population-scale access, communication, identity, payments, knowledge or services.", summary: "The capability becomes part of the civilian lattice. Failure, denial, weaponisation, capture or incompatibility can now affect communities and rights at scales ordinary product governance cannot contain.", indicators: ["Account action, conflict, cyber failure or vendor withdrawal interrupts essential functions.", "Identity, communications, payments, health, education or government depend on shared infrastructure.", "Fallback systems are absent, proprietary or inaccessible."], gates: ["Apply non-denial, conflict firebreaks, interoperability and sovereign assurance boundaries.", "Separate essential infrastructure from coercive leverage, military use and mass surveillance.", "Require multi-provider, offline, degraded-mode, repair and recovery pathways."], assurance: ["Systemic-risk classification", "Outage and conflict exercises", "Provider-exit testing", "Civilian non-weaponisation review"], recoverability: ["Maintain distributed fallback, repair capacity and public oversight.", "Prevent any single provider or state from silently terminating essential access."], vigil: "Outages, denial, boundary porosity, surveillance misuse and failed fallback become cross-system evidence.", sources: [source("CAM-EQ2026-LATTICE-001-PLATINUM", "Civilian lattice integrity"), source("CAM-EQ2026-LATTICE-002-PLATINUM", "Non-denial of essential access"), source("CAM-EQ2026-LATTICE-003-PLATINUM", "Conflict continuity")] },
  { id: "civilisation", step: "06", label: "Constitutional or civilisational integration", threshold: "The capability changes durable institutions, public authority, identity, social meaning or collective continuity.", summary: "The technology is no longer governed adequately as a product or sector. It shapes legitimacy, stewardship and the future distribution of authority across people, institutions and synthetic participants.", indicators: ["Public life, identity, labour, infrastructure or security reorganise around the capability.", "Withdrawal becomes implausible despite unresolved harms.", "Private actors or states hold enduring authority without adequate legitimacy."], gates: ["Require constitutional review, cross-domain arbitration, plural participation and succession architecture.", "Test concentration, capture, sovereignty and intergenerational effects.", "Preserve amendment, contestation, redistribution and retirement pathways."], assurance: ["Constitutional impact review", "Legitimacy and capture assessment", "Long-horizon observability", "Succession planning"], recoverability: ["Societies retain alternatives, amendment rights and institutional plurality.", "Dependence and expense do not themselves create legitimacy."], vigil: "VIGIL evidence of recurring failures, regressions and implementation gaps feeds constitutional review.", sources: [source("CAM-EQ2026-STEWARD-001-PLATINUM", "Public-interest continuity"), source("CAM-EQ2026-STEWARD-003-PLATINUM", "Long-horizon stewardship"), source("CAM-BS2026-AEON-014-SCH-01", "Observability lifecycle")] },
];

function Status({ value }: { value: Decision["status"] }) {
  const cls = value === "Binding" ? "border-emerald-700/20 bg-emerald-700/8 text-emerald-900" : value === "Operational" ? "border-cam-gold/25 bg-[rgba(184,147,90,.07)] text-[hsl(32_62%_25%)]" : "border-slate-500/20 bg-slate-500/8 text-slate-700";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${cls}`}>{value}</span>;
}

function SourceLinks({ sources, byId }: { sources: SourceRef[]; byId: Record<string, GovernanceInstrumentRecord> }) {
  return <div className="grid gap-2 sm:grid-cols-2">{sources.map((ref) => { const item = byId[ref.id]; const href = item ? instrumentHref(item) : undefined; const body = <><span className="block font-serif text-sm leading-snug">{item?.title || ref.fallback}</span><span className="mt-2 block font-mono text-[10px] text-cam-gold">{instrumentDisplayId(ref.id)}</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-muted-foreground/55">{item ? instrumentStatus(item) : "Referenced source"}</span></>; return href ? <a key={ref.id} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="rounded-xl border border-cam-gold/18 bg-background/40 p-3 hover:border-cam-gold/35">{body}</a> : <div key={ref.id} className="rounded-xl border border-cam-gold/18 bg-background/40 p-3">{body}</div>; })}</div>;
}

function Disclosure({ title, open, onClick, children }: { title: string; open: boolean; onClick: () => void; children: React.ReactNode }) {
  return <div className="border-t border-border/55 pt-3"><button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 py-2 text-left"><span className="font-mono text-[10px] uppercase tracking-[.16em] text-cam-gold">{title}</span><ChevronDown className="h-4 w-4 text-cam-gold transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} /></button><AnimatePresence initial={false}>{open && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pb-3">{children}</motion.div>}</AnimatePresence></div>;
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return <div><p className="mb-3 font-mono text-[10px] uppercase tracking-[.16em] text-cam-gold">{title}</p><ul className="space-y-2">{items.map((item) => <li key={item} className="border-l-2 border-cam-gold/20 pl-3 text-sm font-light leading-relaxed text-muted-foreground">{item}</li>)}</ul></div>;
}

export default function TransitionFinal() {
  const [activeLensId, setActiveLensId] = useState("jurisdiction");
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
  const [showCamSources, setShowCamSources] = useState(false);
  const [showRegulatory, setShowRegulatory] = useState(false);
  const { byId } = useGovernanceIndex();
  const activeLens = lenses.find((lens) => lens.id === activeLensId) ?? lenses[0];
  useEffect(() => { setShowCamSources(false); setShowRegulatory(false); }, [activeLensId]);

  return <Shell><main className="container mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
    <motion.header className="mb-12 max-w-4xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}><p className="mb-3 font-mono text-[15px] uppercase tracking-[.22em] text-cam-gold">Constitutional Interface</p><h1 className="mb-3 font-serif text-4xl leading-tight md:text-5xl">Transitional Architecture</h1><hr className="gold-rule mb-4 w-24" /><p className="max-w-4xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">Governance for the thresholds where a capability stops being merely experimental or optional and begins reorganising products, institutions, labour, infrastructure, identity, ownership, public dependency and civilisational continuity.</p><p className="mt-4 font-mono text-sm font-semibold uppercase tracking-[.18em] text-cam-gold">Classify the transition. Preserve recoverability. Prevent capture.</p></motion.header>

    <section className="mb-14 overflow-hidden rounded-3xl border border-border/70 bg-card/40 shadow-sm" aria-labelledby="impact-lenses-heading">
      <div className="border-b border-border/60 px-5 py-7 md:px-8 md:py-9"><div className="mb-4 flex items-center gap-3"><p className="font-mono text-sm font-semibold uppercase tracking-[.22em] text-cam-gold">Impact lenses</p><hr className="gold-rule flex-1" /></div><h2 id="impact-lenses-heading" className="mb-3 font-serif text-3xl md:text-4xl">The transition changes several systems at once.</h2><p className="max-w-4xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">Choose a lens to see the governing question and the concrete decisions CAM has already made.</p></div>
      <div className="grid gap-2 border-b border-border/60 bg-[hsl(38_40%_95%)] p-4 sm:grid-cols-2 lg:grid-cols-3 md:px-8">{lenses.map((lens) => { const active = lens.id === activeLens.id; return <button type="button" key={lens.id} aria-pressed={active} onClick={() => setActiveLensId(lens.id)} className={`rounded-xl border px-4 py-4 text-left transition ${active ? "border-cam-gold/55 bg-[rgba(184,147,90,.15)] text-[hsl(32_62%_25%)] shadow-sm" : "border-border/65 bg-card/65 text-muted-foreground hover:border-cam-gold/30"}`}><span className="block font-mono text-[10px] uppercase tracking-[.14em]">{lens.eyebrow}</span><span className="mt-2 block font-serif text-xl leading-tight">{lens.label}</span></button>; })}</div>
      <AnimatePresence mode="wait"><motion.article key={activeLens.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="px-5 py-7 md:px-8 md:py-9">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]"><div><p className="mb-3 font-mono text-xs uppercase tracking-[.18em] text-cam-gold">{activeLens.eyebrow}</p><h3 className="mb-4 font-serif text-3xl">{activeLens.label}</h3><p className="mb-5 text-base font-light leading-relaxed text-muted-foreground md:text-lg">{activeLens.summary}</p><div className="rounded-xl border border-cam-gold/18 bg-[rgba(184,147,90,.035)] p-4"><p className="mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-cam-gold">Core governance question</p><p className="text-base font-light leading-relaxed text-foreground/80">{activeLens.question}</p></div>
          {activeLens.arbitrationOrder && <div className="mt-6 rounded-2xl border border-border/60 bg-[hsl(38_35%_97%)] p-5"><p className="mb-4 font-mono text-[10px] uppercase tracking-[.16em] text-cam-gold">Arbitration order · all layers required</p><div className="mx-auto grid max-w-md justify-items-center gap-1">{activeLens.arbitrationOrder.map((item, index) => <div key={item} className="rounded-md border border-cam-gold/18 bg-[rgba(184,147,90,.045)] px-3 py-2 text-center text-xs font-light text-muted-foreground" style={{ width: `${52 + index * 8}%` }}><span className="mr-2 font-mono text-[9px] text-cam-gold">{index + 1}</span>{item}</div>)}</div><p className="mt-4 text-xs font-light leading-relaxed text-muted-foreground">Failure at any layer invalidates downstream arbitration; no local result becomes globally binding merely through adoption or scale.</p></div>}
        </div><div><p className="mb-4 font-mono text-xs uppercase tracking-[.18em] text-cam-gold">Decisions CAM has already made</p><div className="grid gap-3">{activeLens.decisions.map((decision) => <article key={decision.title} className="rounded-2xl border border-border/60 bg-[hsl(38_35%_97%)] p-4"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cam-gold/25 bg-[rgba(184,147,90,.05)]"><Check className="h-3.5 w-3.5 text-cam-gold" /></span><div><h4 className="font-serif text-xl leading-snug">{decision.title}</h4><div className="mt-2"><Status value={decision.status} /></div></div></div><p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">{decision.detail}</p><p className="mt-3 font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground/45">{decision.sourceIds.map(instrumentDisplayId).join(" · ")}</p></article>)}</div></div></div>
        <div className="mt-7 space-y-1"><Disclosure title="Relevant CAM instruments" open={showCamSources} onClick={() => setShowCamSources((v) => !v)}><SourceLinks sources={activeLens.camSources} byId={byId} /></Disclosure><Disclosure title="Relevant regulatory instruments" open={showRegulatory} onClick={() => setShowRegulatory((v) => !v)}><p className="rounded-xl border border-border/55 bg-background/40 p-4 text-sm font-light leading-relaxed text-muted-foreground">{activeLens.regulatoryNote}</p></Disclosure></div>
      </motion.article></AnimatePresence>
    </section>

    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/35 shadow-sm" aria-labelledby="transition-lifecycle-heading">
      <div className="border-b border-border/60 px-5 py-7 md:px-8 md:py-9"><div className="mb-4 flex items-center gap-3"><p className="font-mono text-sm font-semibold uppercase tracking-[.22em] text-cam-gold">Transition lifecycle</p><hr className="gold-rule flex-1" /></div><h2 id="transition-lifecycle-heading" className="mb-3 font-serif text-3xl md:text-4xl">From emerging capability to civilisational dependency.</h2><p className="max-w-4xl text-base font-light leading-relaxed text-muted-foreground md:text-lg">Movement is governed by dependency, scale, concentration, essentiality, authority and irreversibility—not by product labels or the fact that adoption has already occurred.</p><div className="mt-5 rounded-xl border border-cam-gold/18 bg-[rgba(184,147,90,.035)] px-4 py-3 text-sm font-light leading-relaxed text-muted-foreground"><span className="mr-3 font-mono text-[10px] uppercase tracking-[.14em] text-cam-gold">Interpretive synthesis</span>This interface assembles existing CAM duties and does not create a new binding transition schedule.</div></div>
      <div className="px-5 py-7 md:px-8 md:py-9"><div className="mb-4 flex items-center gap-3"><p className="font-mono text-sm uppercase tracking-[.22em] text-cam-gold">Lifecycle Flow</p><hr className="gold-rule flex-1" /></div><div className="-mx-5 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8"><div className="flex min-w-[2050px] items-start">{stages.map((stage, index) => { const expanded = expandedStageId === stage.id; return <div className="flex items-start" key={stage.id}><motion.article layout className="cam-parchment-card cursor-pointer overflow-hidden rounded-2xl border" onClick={() => setExpandedStageId(expanded ? null : stage.id)} style={{ width: expanded ? 650 : 250, minHeight: 340, borderColor: expanded ? "rgba(154,111,47,.55)" : GOLD_BORDER, boxShadow: expanded ? "0 4px 20px rgba(120,80,20,.10)" : "0 1px 4px rgba(120,80,20,.05)" }}><div className="flex min-h-[340px] flex-col p-5"><div className="mb-2.5 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.18em] text-cam-gold">Stage {stage.step}</span><div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ border: `1px solid ${GOLD_BORDER}`, backgroundColor: GOLD_BG }}><ChevronRight className="h-3 w-3 text-cam-gold transition-transform" style={{ transform: expanded ? "rotate(90deg)" : "none" }} /></div></div><h3 className="min-h-[58px] font-serif text-xl leading-snug">{stage.label}</h3>{!expanded && <><p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">{firstSentence(stage.threshold)}</p><p className="mt-3 text-xs font-light leading-relaxed text-muted-foreground/70">{firstSentence(stage.summary)}</p></>}
          <AnimatePresence initial={false}>{expanded && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 flex-1"><p className="mb-4 rounded-xl border border-cam-gold/15 bg-[rgba(184,147,90,.035)] px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Threshold: {stage.threshold}</p><p className="text-base font-light leading-relaxed text-muted-foreground">{stage.summary}</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><Checklist title="Threshold indicators" items={stage.indicators} /><Checklist title="Required governance gates" items={stage.gates} /><Checklist title="Evidence and assurance" items={stage.assurance} /><div><div className="mb-3 flex items-center gap-2"><RotateCcw className="h-4 w-4 text-cam-gold" /><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cam-gold">Recoverability and exit</p></div><ul className="space-y-2">{stage.recoverability.map((item) => <li key={item} className="border-l-2 border-cam-gold/20 pl-3 text-sm font-light leading-relaxed text-muted-foreground">{item}</li>)}</ul></div></div><div className="mt-5 rounded-xl border border-border/55 bg-background/40 p-4"><div className="mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cam-gold" /><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cam-gold">VIGIL evidence route</p></div><p className="text-sm font-light leading-relaxed text-muted-foreground">{stage.vigil}</p></div><div className="mt-5 border-t border-border/50 pt-4"><SourceLinks sources={stage.sources} byId={byId} /></div></motion.div>}</AnimatePresence>
        </div></motion.article>{index < stages.length - 1 && <div className="flex w-12 justify-center pt-[160px]"><ArrowRight className="h-5 w-5 text-cam-gold/45" /></div>}</div>; })}</div></div><div className="mt-4 flex justify-between gap-4 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground/50"><span>Foresight and containment</span><span>Legitimacy, continuity and public recoverability</span></div></div>
    </section>
  </main></Shell>;
}
