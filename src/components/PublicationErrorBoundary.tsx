import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { reportStaticPublicationFailure } from "@/lib/staticPublicationFallback";

type Props = { children: ReactNode; fallback: ReactNode };
export class PublicationErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CAM publication render failed", error, info.componentStack);
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function PublicationRecovery() {
  const isCase = /^\/observatory\/cases\/[^/]+\/?$/.test(window.location.pathname);
  const isIndex = /^\/observatory\/(?:cases\/?)?$/.test(window.location.pathname);
  const kind = isCase ? "vigil-case" : "vigil-case-index";
  const hasBasic = (isCase || isIndex) && Boolean(document.querySelector(`[data-static-publication-fallback="${kind}"]`));
  useEffect(() => {
    if (hasBasic) reportStaticPublicationFailure(kind);
  }, [hasBasic, kind]);
  if (hasBasic) return null;
  const basicPath = isCase ? window.location.pathname.replace(/\/?$/, "/") : "/observatory/cases/";
  return <main role="alert" style={{ maxWidth: "48rem", margin: "2rem auto", padding: "1.5rem" }}>
    <h1>The interactive website is temporarily unavailable</h1>
    <p>Published Case Files remain available in the basic reading view. Search, filters and charts may not be available.</p>
    <p><a href={basicPath + "?view=static"}>Open basic Case Files</a> · <a href={window.location.pathname}>Retry interactive view</a> · <a href="/">Home</a></p>
  </main>;
}
