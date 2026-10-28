import { useEffect } from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import "./polish.css";
import "./vigil-storyboard.css";
import "./vigil-ux-v2.css";
import "./vigil-ux-v3.css";
import "./vigil-ux-v4.css";
import "./vigil-case-file-challenge.css";
import "./vigil-ux-v5.css";
import "./vigil-ux-v6.css";
import "./vigil-standards-dossier.css";
import "./vigil-standards-dossier-refinements.css";
import "./vigil-failure-taxonomy.css";
import "./vigil-failure-taxonomy-refinements.css";
import "./public-surface-refinements.css";
import "./public-reference-pages.css";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import VigilCases from "@/pages/vigil-cases";
import VigilCaseFile from "@/pages/vigil-case-file";
import EvidenceChainReport from "@/pages/evidence-chain-report-printable";
import VigilKnowledgeHub from "@/pages/vigil-knowledge-hub";
import VigilStandardsBaseline from "@/pages/vigil-standards-baseline";
import VigilStandardSource from "@/pages/vigil-standard-source";
import VigilFailureTaxonomy from "@/pages/vigil-failure-taxonomy";
import Datasets from "@/pages/datasets";
import About from "@/pages/about";
import Licensing from "@/pages/licensing";
import VigilSeverityMethodology from "@/pages/vigil-severity-methodology";
import Policy from "@/pages/policy";
import Privacy from "@/pages/privacy";

function Router() {
  const [location] = useLocation();
  useEffect(() => {
    const detail = /^\/observatory\/(?:alignment-taxonomy|ai-governance-standards)\/[^/]+\/?$/.test(location);
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (detail) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex, follow";
    } else if (robots?.content === "noindex, follow") {
      robots.remove();
    }
  }, [location]);
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/licensing" component={Licensing} />
      <Route path="/datasets" component={Datasets} />
      <Route path="/policy" component={Policy} />
      <Route path="/privacy" component={Privacy} />

      {/* CAM-wide reference hub. */}
      <Route path="/knowledge-base" component={VigilKnowledgeHub} />

      {/* VIGIL Observatory public resources. */}
      <Route path="/observatory/harm-impact-assessment" component={VigilSeverityMethodology} />
      <Route path="/observatory/alignment-taxonomy/:taxonomyId" component={VigilFailureTaxonomy} />
      <Route path="/observatory/alignment-taxonomy" component={VigilFailureTaxonomy} />
      <Route path="/observatory/ai-governance-standards/:sourceKey" component={VigilStandardSource} />
      <Route path="/observatory/ai-governance-standards" component={VigilStandardsBaseline} />

      {/* VIGIL public investigations. Case Files are anchored to canonical Incident records. */}
      <Route path="/observatory/cases/:recordId" component={VigilCaseFile} />
      <Route path="/observatory/cases" component={VigilCases} />

      {/* Dedicated deterministic report composition for PDF/print output. */}
      <Route path="/observatory/reports/:recordId" component={EvidenceChainReport} />


      {/* Incident-centred Observatory entry points. */}
      <Route path="/observatory" component={VigilCases} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter>;
}
