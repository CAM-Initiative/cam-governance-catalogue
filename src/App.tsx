import { Switch, Route, Router as WouterRouter } from "wouter";
import "./polish.css";
import "./vigil-storyboard.css";
import "./vigil-ux-v2.css";
import "./vigil-ux-v3.css";
import "./vigil-ux-v4.css";
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
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/licensing" component={Licensing} />
      <Route path="/datasets" component={Datasets} />
      <Route path="/policy" component={Policy} />
      <Route path="/privacy" component={Privacy} />

      {/* Legacy About URL retained for inbound links and canonicalized to /about in static publication metadata. */}
      <Route path="/observatory/about" component={About} />
      <Route path="/observatory/severity-methodology" component={VigilSeverityMethodology} />

      {/* VIGIL public investigations. Case Files are anchored to canonical Incident records. */}
      <Route path="/observatory/cases/:recordId" component={VigilCaseFile} />
      <Route path="/observatory/cases" component={VigilCases} />
      <Route path="/observatory/incidents/:recordId" component={VigilCaseFile} />

      {/* Dedicated deterministic report composition for PDF/print output. */}
      <Route path="/observatory/reports/:recordId" component={EvidenceChainReport} />

      <Route path="/observatory/knowledge-base/external-requirements" component={VigilStandardsBaseline} />
      <Route path="/observatory/knowledge-base/standards-sources/:sourceKey" component={VigilStandardSource} />
      <Route path="/observatory/knowledge-base/standards-sources" component={VigilStandardsBaseline} />
      <Route path="/observatory/knowledge-base/failure-taxonomy/:taxonomyId" component={VigilFailureTaxonomy} />
      <Route path="/observatory/knowledge-base/failure-taxonomy" component={VigilFailureTaxonomy} />
      <Route path="/observatory/knowledge-base/policy" component={Policy} />
      <Route path="/observatory/knowledge-base" component={VigilKnowledgeHub} />

      {/* Incident-centred Observatory entry points. */}
      <Route path="/observatory/incidents" component={VigilCases} />
      <Route path="/observatory" component={VigilCases} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter>;
}
