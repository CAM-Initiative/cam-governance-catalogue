import { useEffect, useRef, useState, type FormEvent } from "react";
import { Flag, X } from "lucide-react";
import { createPortal } from "react-dom";

const ENDPOINT = String(import.meta.env.VITE_VIGIL_CHALLENGE_ENDPOINT ?? "").trim();
// Turnstile site keys are public; only the corresponding secret belongs in Cloudflare.
const SITE_KEY = String(import.meta.env.VITE_VIGIL_TURNSTILE_SITE_KEY || "0x4AAAAAAFSNuGaY4lVBa0hY").trim();
const ENABLED = /^https:\/\/[^/]+\/case-file-challenges$/.test(ENDPOINT) && Boolean(SITE_KEY);
const TYPES = [
  { value: "factual", label: "Factually inaccurate information" },
  { value: "misleading", label: "Misleading or unsupported interpretation" },
  { value: "omitted", label: "Missing evidence or relevant context" },
  { value: "reference", label: "Incorrect or unreliable source" },
  { value: "classification", label: "Classification or assessment concern" },
  { value: "other", label: "Other Case File concern" },
];

type Turnstile = {
  render: (element: HTMLElement, options: {
    sitekey: string;
    action: string;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
    theme: "auto";
  }) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

function turnstile() {
  return (window as Window & { turnstile?: Turnstile }).turnstile;
}

export function CaseFileChallenge({ caseId }: { caseId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const widgetContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("factual");
  const [target, setTarget] = useState("");
  const [explanation, setExplanation] = useState("");
  const [evidence, setEvidence] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [token, setToken] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  useEffect(() => {
    if (!open || !ENABLED || reference) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || widgetId.current || !widgetContainer.current || !turnstile()) return;
      widgetId.current = turnstile()!.render(widgetContainer.current, {
        sitekey: SITE_KEY,
        action: "case_file_challenge",
        theme: "auto",
        callback: setToken,
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    };
    let script = document.querySelector<HTMLScriptElement>("script[data-vigil-turnstile]");
    if (!script) {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.vigilTurnstile = "true";
      document.head.appendChild(script);
    }
    script.addEventListener("load", mount);
    mount();
    return () => {
      cancelled = true;
      script?.removeEventListener("load", mount);
      if (widgetId.current && turnstile()) turnstile()!.remove(widgetId.current);
      widgetId.current = null;
      setToken("");
    };
  }, [open, reference]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ENABLED || sending || !token || !consent) return;
    setError("");
    setSending(true);
    try {
      const result = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          caseUrl: window.location.origin + "/observatory/cases/" + encodeURIComponent(caseId) + "/",
          category,
          target,
          explanation,
          evidence,
          contact,
          consent,
          website,
          turnstileToken: token,
        }),
      });
      const body = (await result.json()) as { ok?: boolean; reference?: string; error?: string };
      if (!result.ok || !body.ok || !body.reference) {
        throw new Error(body.error || "Submission was not recorded. Please try again.");
      }
      setReference(body.reference);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission was not recorded. Please try again.");
      setToken("");
      if (widgetId.current && turnstile()) turnstile()!.reset(widgetId.current);
    } finally {
      setSending(false);
    }
  }

  function close() {
    setOpen(false);
    setError("");
  }

  return <>
    <button type="button" className="vigil-case-report-tab vigil-case-challenge-tab" onClick={() => setOpen(true)}>
      <Flag aria-hidden="true" /> Report a Case File issue
    </button>
    {typeof document !== "undefined" && createPortal(<dialog ref={dialog} className="vigil-case-challenge-dialog" onClose={close} aria-labelledby="vigil-challenge-title" aria-describedby="vigil-challenge-description">
      <div className="vigil-case-challenge-header">
        <div>
          <p className="vigil-case-challenge-kicker">VIGIL Observatory · Evidence integrity</p>
          <h2 id="vigil-challenge-title">Report a Case File issue</h2>
          <p id="vigil-challenge-description">Question an inaccuracy, unsupported statement or assessment in {caseId}.</p>
        </div>
        <button type="button" className="vigil-case-challenge-close" aria-label="Close report" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></button>
      </div>
      {reference ? <div role="status" className="vigil-case-challenge-success">
        <h3>Challenge received</h3>
        <p>Your report was recorded as <strong>{reference}</strong>. A VIGIL maintainer will assess the evidence before any Case File changes are made.</p>
        <button type="button" onClick={() => dialog.current?.close()}>Close</button>
      </div> : !ENABLED ? <div role="status" className="vigil-case-challenge-unavailable">
        <strong>Online submissions are not yet available.</strong>
        <p>The private review service is being configured. This control does not send an email or create a public GitHub issue.</p>
      </div> : <form onSubmit={submit} className="vigil-case-challenge-form">
        <label>What needs review?
          <select value={category} onChange={event => setCategory(event.target.value)} required>
            {TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <label>Which statement, clause or section? <span aria-hidden="true">*</span>
          <input value={target} onChange={event => setTarget(event.target.value)} maxLength={200} required placeholder="For example: Section 02, source clause 3" />
        </label>
        <label>Describe the problem <span aria-hidden="true">*</span>
          <textarea value={explanation} onChange={event => setExplanation(event.target.value)} minLength={20} maxLength={4000} rows={5} required placeholder="Explain what is inaccurate or misleading and why." />
        </label>
        <label>Supporting evidence or references (optional)
          <textarea value={evidence} onChange={event => setEvidence(event.target.value)} maxLength={1500} rows={2} placeholder="Reference URLs, citations or relevant evidence." />
        </label>
        <label>Contact email (optional)
          <input type="email" value={contact} onChange={event => setContact(event.target.value)} maxLength={254} autoComplete="email" placeholder="Only if you would like a follow-up." />
        </label>
        <div className="vigil-case-challenge-honeypot" aria-hidden="true">
          <label>Website <input name="website" autoComplete="off" tabIndex={-1} value={website} onChange={event => setWebsite(event.target.value)} /></label>
        </div>
        <p className="vigil-case-challenge-privacy">Do not include credentials, sensitive personal information or confidential third-party material. Reports go to a private review queue, not directly to the public Incident registry. See our <a href="/privacy/">Privacy Policy</a>.</p>
        <label className="vigil-case-challenge-consent">
          <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required />
          <span>I understand this is an evidence-quality challenge, not a request to publish a new incident. The report will be reviewed before any changes.</span>
        </label>
        <div ref={widgetContainer} aria-label="Anti-abuse verification" />
        {error && <p className="vigil-case-challenge-error" role="alert">{error}</p>}
        <button className="vigil-case-challenge-submit" disabled={sending || !token || !consent} type="submit">
          {sending ? "Recording challenge…" : "Submit for review"}
        </button>
      </form>}
    </dialog>, document.body)}
  </>;
}
