import { ArrowRight, BookOpen, Database, ExternalLink, FileText, Library, Scale } from "lucide-react";

const initiativeResources = [
  {
    id: "case-files",
    title: "Case Files",
    subtitle: "VIGIL Observatory AI incident database",
    purpose: "Canonical VIGIL Observatory Incident investigations with evidence, assessment, failure classification and repair analysis.",
    href: "/observatory/cases/",
    icon: FileText,
  },
  {
    id: "knowledge-base",
    title: "Knowledge Base",
    subtitle: "Taxonomy, methodology & governance knowledge",
    purpose: "VIGIL Observatory taxonomy, harm and severity methodology, standards, policy and supporting governance resources.",
    href: "/observatory/knowledge-base/",
    icon: Library,
  },
  {
    id: "datasets",
    title: "Datasets",
    subtitle: "Machine-readable governance reference data",
    purpose: "Downloadable VIGIL Observatory source, standards and requirement datasets for independent analysis and reuse.",
    href: "/datasets/",
    icon: Database,
  },
];

const externalResources = [
  {
    label: "AI Regulations Tracker",
    description: "Compare AI laws, regulatory proposals and policy developments across jurisdictions.",
    href: "https://regulations.ai/",
    icon: Scale,
  },
  {
    label: "AI Incident Database",
    description: "Search reported AI incidents and harms documented across systems, sectors and jurisdictions.",
    href: "https://incidentdatabase.ai/",
    icon: Database,
  },
  {
    label: "OECD AI Incidents Monitor",
    description: "Review internationally monitored AI incidents, hazards and emerging risk patterns.",
    href: "https://oecd.ai/en/incidents",
    icon: Database,
  },
  {
    label: "NIST AI Resource Center",
    description: "Access NIST AI risk-management frameworks, profiles, guidance and supporting resources.",
    href: "https://airc.nist.gov/",
    icon: BookOpen,
  },
];

export function ExploreGovernanceRail() {
  return (
    <aside aria-label="Explore AI governance" className="home-governance-panel">
      <div className="home-governance-heading home-governance-heading-rule">
        <p className="home-governance-section-label">Explore AI Governance</p>
      </div>

      <div className="home-governance-links">
        {initiativeResources.map((resource) => {
          const Icon = resource.icon;
          return <a className="home-governance-card group" href={resource.href} key={resource.id}>
            <span className="home-governance-card-title">
              <span className="home-governance-card-label"><Icon aria-hidden="true" /><span>{resource.title}</span></span>
              <ArrowRight className="home-governance-card-arrow h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
            <span className="home-governance-detail block">
              <span>{resource.subtitle}</span>
              <span>{resource.purpose}</span>
            </span>
          </a>;
        })}
      </div>

      <div className="home-governance-external">
        <div className="home-governance-heading home-governance-heading-rule home-governance-external-heading">
          <p className="home-governance-section-label">External Tools</p>
        </div>
        <div className="home-governance-links">
          {externalResources.map((resource) => {
            const Icon = resource.icon;
            return <a className="home-governance-card group" href={resource.href} key={resource.label} rel="noreferrer" target="_blank">
              <span className="home-governance-card-title">
                <span className="home-governance-card-label"><Icon aria-hidden="true" /><span>{resource.label}</span></span>
                <ExternalLink className="home-governance-card-arrow h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
              <span className="home-governance-detail block">{resource.description}</span>
            </a>;
          })}
        </div>
      </div>
    </aside>
  );
}
