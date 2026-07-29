import { Switch, Route, Router as WouterRouter } from "wouter";
import "./polish.css";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Constitution from "@/pages/constitution";
import RelationalGovernance from "@/pages/relational-governance-final";
import Provenance from "@/pages/provenance";
import Transition from "@/pages/transition-authority";
import Catalogue from "@/pages/catalogue";
import Vigil from "@/pages/vigil";
import VigilKnowledgeBase from "@/pages/vigil-knowledge-base";
import EvidenceChainReport from "@/pages/evidence-chain-report";
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
      {/* Specific Observatory resources must precede the ledger catch-all route. */}
      <Route path="/observatory/knowledge-base/:recordId" component={VigilKnowledgeBase} />
      <Route path="/observatory/knowledge-base" component={VigilKnowledgeBase} />
      <Route path="/observatory/reports/:recordId" component={EvidenceChainReport} />
      <Route path="/observatory" component={Vigil} />
      <Route path="/vigil" component={Vigil} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter>;
}
