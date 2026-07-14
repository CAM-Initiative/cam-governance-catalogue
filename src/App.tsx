import { Switch, Route, Router as WouterRouter } from "wouter";
import "./polish.css";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Constitution from "@/pages/constitution";
import RelationalGovernance from "@/pages/relational-governance-final";
import Provenance from "@/pages/provenance";
import Transition from "@/pages/transition-final";
import Catalogue from "@/pages/catalogue";
import Vigil from "@/pages/vigil";
import About from "@/pages/about";
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
      <Route path="/privacy" component={Privacy} />
      <Route path="/observatory" component={Vigil} />
      <Route path="/vigil" component={Vigil} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter>;
}
