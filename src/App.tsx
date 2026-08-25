import { Switch, Route, Router as WouterRouter } from "wouter";
import "./polish.css";
import "./vigil-storyboard.css";
import "./vigil-ux-v2.css";
import "./vigil-ux-v2-corrections.css";
import "./vigil-ux-v3.css";
import "./vigil-ux-v4.css";
import "./vigil-ux-v5.css";
import "./vigil-ux-v6.css";
import "./vigil-standards-dossier.css";
import "./vigil-standards-dossier-refinements.css";
import "./vigil-failure-taxonomy.css";
import "./vigil-failure-taxonomy-refinements.css";
import "./public-surface-refinements.css";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import VigilCases from "@/pages/vigil-cases";
import VigilCaseFile from "@/pages/vigil-case-file";
import VigilAbout from "@/pages/vigil-about";
import EvidenceChainReport from "@/pages/evidence-chain-report-printable";
import VigilKnowledgeHub from "@/pages/vigil-knowledge-hub";
import VigilStandardsBaseline from "@/pages/vigil-standards-baseline";
import VigilFailureTaxonomy from "@/pages/vigil-failure-taxonomy";
import VigilKnowledgeBase from "@/pages/vigil-knowledge-base";
import Datasets from "@/pages/datasets";
import About from "@/pages/about";
import Policy from "@/pages/policy";
import Privacy from "@/pages/privacy";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/datasets" component={Datasets} />
      <Route path="/policy" component={Policy} />
      <Route path="/privacy" component={Privacy} />

      <Route path="/observatory/about" component={VigilAbout} />

      {/* VIGIL public investigations. Case Files are FM-centred; historical URLs remain compatible. */}
      <Route path="/observatory/cases/:recordId" component={VigilCaseFile} />
      <Route path="/observatory/cases" component={VigilCases} />
      <Route path="/observatory/failure-modes/:recordId" component={VigilCaseFile} />
      <Route path="/observatory/failure-modes" component={VigilCases} />

      {/* Dedicated deterministic report composition for PDF/print output. */}
      <Route path="/observatory/reports/:recordId" component={EvidenceChainReport} />

      {/* Governance Lessons remains a LEARN projection; the Knowledge Base itself is broader. */}
      <Route path="/observatory/lessons" component={VigilKnowledgeBase} />
      <Route path="/observatory/knowledge-base/external-requirements" component={VigilStandardsBaseline} />
      <Route path="/observatory/knowledge-base/standards-sources" component={VigilStandardsBaseline} />
      <Route path="/observatory/knowledge-base/failure-taxonomy/:taxonomyId" component={VigilFailureTaxonomy} />
      <Route path="/observatory/knowledge-base/failure-taxonomy" component={VigilFailureTaxonomy} />
      <Route path="/observatory/knowledge-base/policy" component={Policy} />
      <Route path="/observatory/knowledge-base/:recordId" component={VigilKnowledgeBase} />
      <Route path="/observatory/knowledge-base" component={VigilKnowledgeHub} />

      {/* Compatibility routes resolve into the FM-centred public investigation surface. */}
      <Route path="/observatory/incidents" component={VigilCases} />
      <Route path="/observatory/repairs" component={VigilCases} />
      <Route path="/observatory" component={VigilCases} />
      {/* Former /observatory/ledger public surface is preserved as src/drafts/vigil-ledger.tsx and is intentionally not routed. */}
      <Route path="/vigil/:recordId" component={VigilCaseFile} />
      <Route path="/vigil" component={VigilCases} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter>;
}
