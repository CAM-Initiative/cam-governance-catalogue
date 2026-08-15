import { Switch, Route, Router as WouterRouter } from "wouter";
import "./polish.css";
import "./vigil-storyboard.css";
import "./vigil-ux-v2.css";
import "./vigil-ux-v2-corrections.css";
import "./vigil-ux-v3.css";
import "./vigil-ux-v4.css";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Constitution from "@/pages/constitution";
import RelationalGovernance from "@/pages/relational-governance-final";
import Provenance from "@/pages/provenance";
import Transition from "@/pages/transition-authority";
import Catalogue from "@/pages/catalogue";
import Vigil from "@/pages/vigil";
import VigilCases from "@/pages/vigil-cases";
import VigilCaseFile from "@/pages/vigil-case-file";
import VigilKnowledgeHub from "@/pages/vigil-knowledge-hub";
import { VigilExternalRequirements, VigilExternalSources } from "@/pages/vigil-reference-knowledge";
import VigilKnowledgeBase from "@/pages/vigil-knowledge-base";
import About from "@/pages/about";
import Policy from "@/pages/policy";
import Privacy from "@/pages/privacy";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/constitution/runtime" component={Constitution} />
      <Route path="/constitution/relational" component={RelationalGovernance} />
      <Route path="/constitution/provenance" component={Provenance} />
      <Route path="/constitution/transition" component={Transition} />
      <Route path="/constitution" component={Constitution} />
      <Route path="/catalogue" component={Catalogue} />
      <Route path="/policy" component={Policy} />
      <Route path="/privacy" component={Privacy} />

      {/* VIGIL public investigations. Case Files are FM-centred; historical URLs remain compatible. */}
      <Route path="/observatory/cases/:recordId" component={VigilCaseFile} />
      <Route path="/observatory/cases" component={VigilCases} />
      <Route path="/observatory/failure-modes/:recordId" component={VigilCaseFile} />
      <Route path="/observatory/failure-modes" component={VigilCases} />

      {/* Governance Lessons remains a LEARN projection; the Knowledge Base itself is broader. */}
      <Route path="/observatory/lessons" component={VigilKnowledgeBase} />
      <Route path="/observatory/knowledge-base/external-requirements" component={VigilExternalRequirements} />
      <Route path="/observatory/knowledge-base/standards-sources" component={VigilExternalSources} />
      <Route path="/observatory/knowledge-base/:recordId" component={VigilKnowledgeBase} />
      <Route path="/observatory/knowledge-base" component={VigilKnowledgeHub} />

      {/* Compatibility routes resolve into the same FM-centred investigation surface. */}
      <Route path="/observatory/reports/:recordId" component={VigilCaseFile} />
      <Route path="/observatory/incidents" component={VigilCases} />
      <Route path="/observatory/repairs" component={VigilCases} />

      <Route path="/observatory/ledger" component={Vigil} />
      <Route path="/observatory" component={Vigil} />
      <Route path="/vigil/:recordId" component={VigilCaseFile} />
      <Route path="/vigil" component={VigilCases} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter>;
}
