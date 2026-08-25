import { ArrowRight, ExternalLink } from "lucide-react";

const initiativeResources = [
  {
    id: "vigil-observatory",
    title: "VIGIL Observatory",
    subtitle: "Evidence, taxonomy & governance knowledge",
    purpose: "The public entry point for VIGIL governance knowledge, standards, taxonomy and policy materials.",
    href: "/observatory/knowledge-base",
  },
  {
    id: "case-files",
    title: "Case Files",
    subtitle: "Documented failure investigations",
    purpose: "Documented AI failure-mode investigations with evidence, classification, diagnosis, repair and learning.",
    href: "/observatory/cases",
  },
  {
    id: "datasets",
    title: "Datasets",
    subtitle: "Machine-readable governance reference data",
    purpose: "Downloadable VIGIL source, standards and requirement datasets for independent analysis and reuse.",
    href: "/datasets",
  },
];

const externalResources = [
  {
    label: "AI Regulations Tracker",
    description: "Compare AI laws, regulatory proposals and policy developments across jurisdictions.",
    href: "https://regulations.ai/",
  },
  {
    label: "AI Incident Database",
    description: "Search reported AI incidents and harms documented across systems, sectors and jurisdictions.",
    href: "https://incidentdatabase.ai/",
  },
  {
    label: "OECD AI Incidents Monitor",
    description: "Review internationally monitored AI incidents, hazards and emerging risk patterns.",
    href: "https://oecd.ai/en/incidents",
  },
  {
    label: "NIST AI Resource Center",
    description: "Access NIST AI risk-management frameworks, profiles, guidance and supporting resources.",
    href: "https://airc.nist.gov/",
  },
];

export function ExploreGovernanceRail() {
  return (
    <aside aria-label="Explore AI governance" className="home-governance-panel">
      <div className="home-governance-heading">
        <p className="home-governance-section-label">Explore AI Governance</p>
      </div>

      <div className="home-governance-links">
        {initiativeResources.map((resource) => (
          <a className="home-governance-card group" href={resource.href} key={resource.id}>
            <span className="home-governance-card-title">
              <span>{resource.title}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
            <span className="home-governance-detail block">
              <span>{resource.subtitle}</span>
              <span>{resource.purpose}</span>
            </span>
          </a>
        ))}
      </div>

      <div className="home-governance-external">
        <div className="home-governance-heading home-governance-external-heading">
          <p className="home-governance-section-label">External Tools</p>
        </div>
        <div className="home-governance-links">
          {externalResources.map((resource) => (
            <a className="home-governance-card group" href={resource.href} key={resource.label} rel="noreferrer" target="_blank">
              <span className="home-governance-card-title">
                <span>{resource.label}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
              <span className="home-governance-detail block">{resource.description}</span>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
