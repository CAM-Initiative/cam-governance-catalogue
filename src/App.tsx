import { Switch, Route, Router as WouterRouter } from "wouter";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Runtime from "@/pages/runtime";
import Constitution from "@/pages/constitution";
import Catalogue from "@/pages/catalogue";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/runtime" component={Runtime} />
      <Route path="/constitution" component={Constitution} />
      <Route path="/catalogue" component={Catalogue} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter>;
}
