import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { vigilSchemaOptions } from "@/data/vigilSchemaOptions";

const REPORT_EMAIL = "ethics@cam-initiative.org";

const initialForm = {
  title: "",
  description: "",
  date: "",
  platform: "Unknown",
  proposedPlatform: "",
  product: "Unknown",
  proposedProduct: "",
  modelRuntime: "",
  where: "",
  evidenceLinks: "",
  hasAttachments: false,
  attachmentNotes: "",
  whyItMatters: "",
  contributorName: "",
  contributorEmail: "",
  externalRepositoryUrl: "",
  relevantPath: "",
  versionOrArchive: "",
  relatedVigilId: "",
  relatedCamInstrument: "",
  additionalContext: "",
};

type FormState = typeof initialForm;

function splitLines(value: string) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

function Input({ label, value, onChange, type = "text", helper, list }: { label: string; value: string; onChange: (value: string) => void; type?: string; helper?: string; list?: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)]">{label}</span>
      <input className="rounded-xl border border-border bg-background px-3 py-2 text-foreground" type={type} value={value} onChange={(event) => onChange(event.target.value)} list={list} />
      {helper && <span className="text-xs leading-relaxed text-muted-foreground">{helper}</span>}
    </label>
  );
}

function Textarea({ label, value, onChange, helper }: { label: string; value: string; onChange: (value: string) => void; helper?: string }) {
  return (
    <label className="grid gap-1 text-sm md:col-span-2">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)]">{label}</span>
      <textarea className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 text-foreground" value={value} onChange={(event) => onChange(event.target.value)} />
      {helper && <span className="text-xs leading-relaxed text-muted-foreground">{helper}</span>}
    </label>
  );
}

function OptionList({ id, options }: { id: string; options: readonly string[] }) {
  return <datalist id={id}>{options.map((option) => <option key={option} value={option} />)}</datalist>;
}

function hasMeaningfulValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized && normalized !== "unknown" && normalized !== "not applicable");
}

export default function VigilReport() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setCreatedAt(null);
    setValidationMessage("");
    setCopyState("idle");
  };

  const hasAdvancedDetails = [form.externalRepositoryUrl, form.relevantPath, form.versionOrArchive, form.relatedVigilId, form.relatedCamInstrument, form.additionalContext].some((value) => value.trim());
  const hasContext = hasMeaningfulValue(form.platform) || hasMeaningfulValue(form.product) || Boolean(form.where.trim() || form.date || form.evidenceLinks.trim() || form.hasAttachments);

  const publicCandidate = useMemo(() => ({
    title: form.title.trim() || "Untitled VIGIL signal",
    summary: form.description.trim(),
    date_observed_or_changed: form.date || undefined,
    system_context: {
      platform_or_vendor: form.platform === "Other" && form.proposedPlatform.trim() ? form.proposedPlatform.trim() : form.platform,
      product_or_service: form.product === "Other" && form.proposedProduct.trim() ? form.proposedProduct.trim() : form.product,
      specific_model_or_runtime: form.modelRuntime.trim() || undefined,
      interface_or_location: form.where.trim() || undefined,
    },
    evidence_links: splitLines(form.evidenceLinks),
    screenshot_or_attachment_context: {
      has_screenshots_or_files_to_attach: form.hasAttachments,
      attachment_notes: form.attachmentNotes.trim() || undefined,
      manual_email_attachment_required: form.hasAttachments,
    },
    why_it_may_matter: form.whyItMatters.trim() || undefined,
    advanced_cross_references: hasAdvancedDetails ? {
      external_repository_or_corpus_url: form.externalRepositoryUrl.trim() || undefined,
      relevant_file_path_or_page: form.relevantPath.trim() || undefined,
      commit_release_doi_archive_or_version: form.versionOrArchive.trim() || undefined,
      related_vigil_id_if_known: form.relatedVigilId.trim() || undefined,
      related_cam_instrument_if_known: form.relatedCamInstrument.trim() || undefined,
      additional_context: form.additionalContext.trim() || undefined,
    } : undefined,
  }), [form, hasAdvancedDetails]);

  const reportPackage = useMemo(() => ({
    submission_draft: true,
    draft_id: createdAt ? `vigil-signal-${createdAt.replace(/[^0-9]/g, "")}` : "DRAFT",
    created_at_utc: createdAt || undefined,
    maintainer_classification_required: true,
    public_submission_candidate: publicCandidate,
    private_contact_details: form.contributorName.trim() || form.contributorEmail.trim() ? {
      name_or_pseudonym: form.contributorName.trim() || undefined,
      email: form.contributorEmail.trim() || undefined,
      publication_authorised: false,
    } : undefined,
    privacy_note: "Contact details are for correspondence only and must not be included in a public VIGIL record without explicit agreement.",
    delivery_note: `This package is not submitted until the contributor sends an email to ${REPORT_EMAIL}.`,
  }), [createdAt, form.contributorEmail, form.contributorName, publicCandidate]);

  const json = createdAt ? `${JSON.stringify(reportPackage, null, 2)}\n` : "";
  const subject = `VIGIL signal — ${form.title.trim() || "Untitled submission"}`;
  const emailBody = [
    "VIGIL signal submission",
    "",
    `Title: ${form.title.trim() || "Untitled"}`,
    `Platform/vendor: ${publicCandidate.system_context.platform_or_vendor || "Unknown"}`,
    `Product/service: ${publicCandidate.system_context.product_or_service || "Unknown"}`,
    `Date: ${form.date || "Not specified"}`,
    "",
    "Summary:",
    form.description.trim().slice(0, 1200) || "No summary supplied.",
    "",
    form.evidenceLinks.trim() ? `Evidence links:\n${form.evidenceLinks.trim()}` : "",
    "",
    "Please attach the downloaded VIGIL report JSON and any relevant screenshots or files before sending.",
  ].filter(Boolean).join("\n");
  const mailto = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

  const createPackage = () => {
    if (!form.description.trim()) {
      setValidationMessage("Please describe what you observed or want CAM Initiative to review.");
      return;
    }
    if (!hasContext) {
      setValidationMessage("Please add at least one context detail: where or when it happened, a platform/product, an evidence link, or an attachment indication.");
      return;
    }
    setCreatedAt(new Date().toISOString());
    setValidationMessage("");
  };

  const copyJson = async () => {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
    }
  };

  const downloadJson = () => {
    if (!json) return;
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vigil-signal-${createdAt?.slice(0, 10) || "draft"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <main className="container mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
        <header className="mb-8 max-w-4xl">
          <p className="mb-2 font-mono text-[13px] font-semibold uppercase tracking-[0.22em] text-[hsl(32_62%_25%)]">VIGIL reporting</p>
          <h1 className="mb-4 font-serif text-4xl text-foreground md:text-5xl">Report a VIGIL Signal</h1>
          <p className="text-base leading-relaxed text-foreground/75 md:text-lg">Describe what happened and provide whatever context or evidence you have. VIGIL maintainers will perform the formal classification.</p>
        </header>

        <section className="mb-7 rounded-2xl border border-primary/35 bg-card/85 p-5 shadow-sm" aria-labelledby="delivery-heading">
          <h2 id="delivery-heading" className="mb-3 font-serif text-2xl text-foreground">How the report reaches CAM Initiative</h2>
          <ol className="grid gap-3 text-sm leading-relaxed text-foreground/80 md:grid-cols-4">
            <li><strong className="block text-foreground">1. Create</strong>The page creates a report package locally in your browser.</li>
            <li><strong className="block text-foreground">2. Download</strong>Download the structured JSON report file.</li>
            <li><strong className="block text-foreground">3. Attach</strong>Open the pre-addressed email and attach the JSON plus any screenshots.</li>
            <li><strong className="block text-foreground">4. Send</strong>Press Send in your email application. Only then does CAM receive it.</li>
          </ol>
          <p className="mt-4 text-sm font-medium text-foreground">Destination: <a className="underline underline-offset-4" href={`mailto:${REPORT_EMAIL}`}>{REPORT_EMAIL}</a></p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">This website has no submission server and stores no report. Closing the page before sending the email means nothing has been submitted.</p>
        </section>

        <div className="mb-7 rounded-2xl border border-cam-gold/30 bg-[rgba(184,147,90,0.08)] p-4 text-sm leading-relaxed text-foreground/75">
          Public attribution is optional. However, the email account used to send the report will be visible to CAM Initiative even when the contact fields below are blank. Avoid unnecessary personal, confidential, medical, credential, or third-party information.
        </div>

        <OptionList id="platform-options" options={vigilSchemaOptions.platform_or_vendor} />
        <OptionList id="product-options" options={vigilSchemaOptions.product_or_service} />

        <div className="grid gap-5">
          <section className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm md:p-6">
            <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">1. What should VIGIL review?</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Short title (optional)" value={form.title} onChange={(value) => set("title", value)} />
              <Input label="Date observed or changed (optional)" type="date" value={form.date} onChange={(value) => set("date", value)} />
              <Textarea label="What did you observe or want us to see?" value={form.description} onChange={(value) => set("description", value)} helper="Describe the event, behaviour, change, concern, repair, or source material in your own words." />
            </div>
          </section>

          <section className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm md:p-6">
            <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">2. Context and evidence</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Platform or vendor" value={form.platform} onChange={(value) => set("platform", value)} list="platform-options" />
              <Input label="Product or service" value={form.product} onChange={(value) => set("product", value)} list="product-options" />
              {form.platform === "Other" && <Input label="Platform/vendor name" value={form.proposedPlatform} onChange={(value) => set("proposedPlatform", value)} />}
              {form.product === "Other" && <Input label="Product/service name" value={form.proposedProduct} onChange={(value) => set("proposedProduct", value)} />}
              <Input label="Model, version, or runtime (if known)" value={form.modelRuntime} onChange={(value) => set("modelRuntime", value)} />
              <Input label="Where did it happen?" value={form.where} onChange={(value) => set("where", value)} helper="For example: web, mobile, voice, image generation, API, repository, public post, or policy page." />
              <Textarea label="Evidence links" value={form.evidenceLinks} onChange={(value) => set("evidenceLinks", value)} helper="Add one link per line where possible." />
              <Textarea label="Why might it matter? (optional)" value={form.whyItMatters} onChange={(value) => set("whyItMatters", value)} />
              <label className="flex items-start gap-3 rounded-xl border border-border bg-background/35 p-4 text-sm text-foreground/75 md:col-span-2">
                <input className="mt-1" type="checkbox" checked={form.hasAttachments} onChange={(event) => set("hasAttachments", event.target.checked)} />
                <span><strong className="block font-medium text-foreground">I have screenshots or files to attach</strong>Files stay on your device until you attach them to the email.</span>
              </label>
              {form.hasAttachments && <Textarea label="Screenshot or attachment notes" value={form.attachmentNotes} onChange={(value) => set("attachmentNotes", value)} helper="Note what each attachment shows and remove unnecessary identifying metadata where practicable." />}
            </div>
          </section>

          <details className="group rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm md:p-6">
            <summary className="cursor-pointer list-none font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <span className="inline-flex w-full items-center gap-3"><span className="inline-block h-0 w-0 shrink-0 border-y-[0.35rem] border-l-[0.52rem] border-y-transparent border-l-[hsl(var(--primary))] transition-transform group-open:rotate-90" aria-hidden="true" />3. Advanced details or known cross-references (optional)</span>
            </summary>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Use this only when you already know a relevant repository, version, VIGIL record, or CAM instrument.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input label="External repository or corpus URL" value={form.externalRepositoryUrl} onChange={(value) => set("externalRepositoryUrl", value)} />
              <Input label="Relevant file, path, or page" value={form.relevantPath} onChange={(value) => set("relevantPath", value)} />
              <Input label="Commit, release, DOI, archive, or version" value={form.versionOrArchive} onChange={(value) => set("versionOrArchive", value)} />
              <Input label="Related VIGIL ID" value={form.relatedVigilId} onChange={(value) => set("relatedVigilId", value)} />
              <Input label="Related CAM instrument" value={form.relatedCamInstrument} onChange={(value) => set("relatedCamInstrument", value)} />
              <Textarea label="Additional relationship or repair context" value={form.additionalContext} onChange={(value) => set("additionalContext", value)} />
            </div>
          </details>

          <section className="rounded-2xl border border-border/80 bg-background/30 p-5 shadow-sm md:p-6">
            <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">4. Optional contact details</p>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">These fields are separated from the public-record candidate. Leaving them blank prevents public attribution, but the sending email address remains visible to the CAM inbox.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Name or pseudonym" value={form.contributorName} onChange={(value) => set("contributorName", value)} />
              <Input label="Contact email for follow-up" type="email" value={form.contributorEmail} onChange={(value) => set("contributorEmail", value)} />
            </div>
          </section>

          <section className="rounded-2xl border border-primary/30 bg-card/85 p-5 shadow-sm md:p-6">
            <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(32_62%_25%)]">5. Create the report package and send the email</p>
            <p className="mb-4 text-sm leading-relaxed text-foreground/75">Create the package, download the JSON, open the email addressed to {REPORT_EMAIL}, attach the JSON and evidence, and press Send.</p>
            {validationMessage && <p className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{validationMessage}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" className="rounded-xl border border-cam-gold/55 bg-cam-gold/15 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-cam-gold/25" onClick={createPackage}>Create report package</button>
              {createdAt && <>
                <button type="button" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-cam-gold/45" onClick={() => void copyJson()}>{copyState === "copied" ? "JSON copied" : copyState === "error" ? "Copy unavailable" : "Copy report JSON"}</button>
                <button type="button" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-cam-gold/45" onClick={downloadJson}>Download report JSON</button>
                <a className="rounded-xl border border-primary/45 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/15" href={mailto}>Open email to send report</a>
              </>}
            </div>
            {createdAt && <div className="mt-5 rounded-2xl border border-cam-gold/40 bg-cam-gold/10 p-4">
              <p className="font-semibold text-foreground">Report package created locally. Nothing has been sent.</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">CAM receives the report only after you attach the JSON and evidence and send the email to {REPORT_EMAIL}.</p>
              <details className="mt-4"><summary className="cursor-pointer font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(32_62%_25%)]">Preview report JSON</summary><pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-background p-4 text-xs leading-relaxed text-muted-foreground">{json}</pre></details>
            </div>}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Accepted material may later be converted into a public VIGIL record after evidence review, redaction where needed, and maintainer classification.</p>
          </section>
        </div>
      </main>
    </Shell>
  );
}
