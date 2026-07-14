import { Switch, Route, Router as WouterRouter } from "wouter";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Runtime from "@/pages/runtime";
import Constitution from "@/pages/constitution";
import RelationalGovernance from "@/pages/relational-governance";
import Catalogue from "@/pages/catalogue";
import Vigil from "@/pages/vigil";
import About from "@/pages/about";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/runtime" component={Runtime} />
      <Route path="/constitution/runtime" component={Runtime} />
      <Route path="/constitution/relational" component={RelationalGovernance} />
      <Route path="/constitution" component={Constitution} />
      <Route path="/catalogue" component={Catalogue} />
      <Route path="/observatory" component={Vigil} />
      <Route path="/vigil" component={Vigil} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter>;
}
