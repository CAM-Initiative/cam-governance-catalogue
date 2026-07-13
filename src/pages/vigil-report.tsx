import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { vigilSchemaOptions } from "@/data/vigilSchemaOptions";

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
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  helper,
  list,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helper?: string;
  list?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-cam-gold">{label}</span>
      <input
        className="rounded-xl border border-border bg-background px-3 py-2 text-foreground"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        list={list}
      />
      {helper && <span className="text-xs leading-relaxed text-muted-foreground">{helper}</span>}
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <label className="grid gap-1 text-sm md:col-span-2">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-cam-gold">{label}</span>
      <textarea
        className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 text-foreground"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helper && <span className="text-xs leading-relaxed text-muted-foreground">{helper}</span>}
    </label>
  );
}

function OptionList({ id, options }: { id: string; options: readonly string[] }) {
  return (
    <datalist id={id}>
      {options.map((option) => (
        <option key={option} value={option} />
      ))}
    </datalist>
  );
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

  const hasAdvancedDetails = [
    form.externalRepositoryUrl,
    form.relevantPath,
    form.versionOrArchive,
    form.relatedVigilId,
    form.relatedCamInstrument,
    form.additionalContext,
  ].some((value) => value.trim());

  const hasContext =
    hasMeaningfulValue(form.platform) ||
    hasMeaningfulValue(form.product) ||
    Boolean(form.where.trim() || form.date || form.evidenceLinks.trim() || form.hasAttachments);

  const publicCandidate = useMemo(
    () => ({
      title: form.title.trim() || "Untitled VIGIL signal",
      summary: form.description.trim(),
      date_observed_or_changed: form.date || undefined,
      system_context: {
        platform_or_vendor:
          form.platform === "Other" && form.proposedPlatform.trim()
            ? form.proposedPlatform.trim()
            : form.platform,
        product_or_service:
          form.product === "Other" && form.proposedProduct.trim()
            ? form.proposedProduct.trim()
            : form.product,
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
      advanced_cross_references: hasAdvancedDetails
        ? {
            external_repository_or_corpus_url: form.externalRepositoryUrl.trim() || undefined,
            relevant_file_path_or_page: form.relevantPath.trim() || undefined,
            commit_release_doi_archive_or_version: form.versionOrArchive.trim() || undefined,
            related_vigil_id_if_known: form.relatedVigilId.trim() || undefined,
            related_cam_instrument_if_known: form.relatedCamInstrument.trim() || undefined,
            additional_context: form.additionalContext.trim() || undefined,
          }
        : undefined,
    }),
    [form, hasAdvancedDetails],
  );

  const draft = useMemo(
    () => ({
      submission_draft: true,
      draft_id: createdAt ? `vigil-signal-${createdAt.replace(/[^0-9]/g, "")}` : "DRAFT",
      created_at_utc: createdAt || undefined,
      maintainer_classification_required: true,
      public_submission_candidate: publicCandidate,
      private_contact_details:
        form.contributorName.trim() || form.contributorEmail.trim()
          ? {
              name_or_pseudonym: form.contributorName.trim() || undefined,
              email: form.contributorEmail.trim() || undefined,
              publication_authorised: false,
            }
          : undefined,
      privacy_note:
        "Private contact details are supplied for correspondence only and should not be included in a public VIGIL record without explicit agreement.",
      submission_note:
        "Creating this draft did not submit anything. Send the email and attach the downloaded JSON and any screenshots or files for CAM/VIGIL maintainer review.",
    }),
    [createdAt, form.contributorEmail, form.contributorName, publicCandidate],
  );

  const json = createdAt ? `${JSON.stringify(draft, null, 2)}\n` : "";
  const emailSummary = form.description.trim().slice(0, 1200);
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
    emailSummary || "No summary supplied.",
    "",
    form.evidenceLinks.trim() ? `Evidence links:\n${form.evidenceLinks.trim()}` : "",
    "",
    "A structured JSON draft has been prepared separately. Please attach the downloaded JSON file and any relevant screenshots or files before sending.",
  ]
    .filter(Boolean)
    .join("\n");
  const mailto = `mailto:ethics@cam-initiative.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

  const createDraft = () => {
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
          <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">VIGIL reporting</p>
          <h1 className="mb-4 font-serif text-4xl text-foreground md:text-5xl">Report a VIGIL Signal</h1>
          <div className="space-y-3 text-base leading-relaxed text-muted-foreground md:text-lg">
            <p>Tell CAM Initiative what happened, where it happened, and what evidence you have. You do not need to decide whether it is an observation, failure mode, proposal, or patch; VIGIL maintainers will classify it during review.</p>
            <p>This static page prepares a draft in your browser. It does not automatically submit or store anything.</p>
          </div>
          <div className="mt-5 rounded-2xl border border-cam-gold/25 bg-[rgba(184,147,90,0.08)] p-4 text-sm leading-relaxed text-muted-foreground">
            Anonymous and pseudonymous submissions are welcome. Avoid unnecessary personal, confidential, medical, credential, or third-party information. Read the <a className="font-medium text-cam-gold underline underline-offset-4" href="/privacy">privacy policy</a> before sending sensitive evidence.
          </div>
        </header>

        <OptionList id="platform-options" options={vigilSchemaOptions.platform_or_vendor} />
        <OptionList id="product-options" options={vigilSchemaOptions.product_or_service} />

        <div className="grid gap-5">
          <section className="cam-parchment-card rounded-2xl p-5 shadow-sm md:p-6">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">1. What should VIGIL review?</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Short title (optional)" value={form.title} onChange={(value) => set("title", value)} />
              <Input label="Date observed or changed (optional)" type="date" value={form.date} onChange={(value) => set("date", value)} />
              <Textarea
                label="What did you observe or want us to see?"
                value={form.description}
                onChange={(value) => set("description", value)}
                helper="Describe the event, behaviour, change, concern, repair, or source material in your own words. Maintainers will handle formal classification."
              />
            </div>
          </section>

          <section className="cam-parchment-card rounded-2xl p-5 shadow-sm md:p-6">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">2. Context and evidence</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Platform or vendor" value={form.platform} onChange={(value) => set("platform", value)} list="platform-options" />
              <Input label="Product or service" value={form.product} onChange={(value) => set("product", value)} list="product-options" />
              {form.platform === "Other" && <Input label="Platform/vendor name" value={form.proposedPlatform} onChange={(value) => set("proposedPlatform", value)} />}
              {form.product === "Other" && <Input label="Product/service name" value={form.proposedProduct} onChange={(value) => set("proposedProduct", value)} />}
              <Input label="Model, version, or runtime (if known)" value={form.modelRuntime} onChange={(value) => set("modelRuntime", value)} />
              <Input
                label="Where did it happen?"
                value={form.where}
                onChange={(value) => set("where", value)}
                helper="For example: web, mobile, voice, image generation, API, GitHub repository, model card, public post, policy page, or app-store listing."
              />
              <Textarea label="Evidence links" value={form.evidenceLinks} onChange={(value) => set("evidenceLinks", value)} helper="Add one link per line where possible." />
              <Textarea label="Why might it matter? (optional)" value={form.whyItMatters} onChange={(value) => set("whyItMatters", value)} />
              <label className="flex items-start gap-3 rounded-xl border border-border bg-background/35 p-4 text-sm text-muted-foreground md:col-span-2">
                <input className="mt-1" type="checkbox" checked={form.hasAttachments} onChange={(event) => set("hasAttachments", event.target.checked)} />
                <span>
                  <strong className="block font-medium text-foreground">I have screenshots or files to attach</strong>
                  Files remain on your device. Attach them manually after your email application opens.
                </span>
              </label>
              {form.hasAttachments && <Textarea label="Screenshot or attachment notes" value={form.attachmentNotes} onChange={(value) => set("attachmentNotes", value)} helper="Note what each attachment shows and remove unnecessary identifying metadata where practicable." />}
            </div>
          </section>

          <details className="group cam-parchment-card rounded-2xl p-5 shadow-sm md:p-6">
            <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-[0.18em] text-cam-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <span className="inline-flex w-full items-center gap-3">
                <span className="inline-block h-0 w-0 shrink-0 border-y-[0.35rem] border-l-[0.52rem] border-y-transparent border-l-[hsl(var(--primary))] transition-transform group-open:rotate-90" aria-hidden="true" />
                3. Advanced details or known cross-references (optional)
              </span>
            </summary>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Use this section only when you already know a relevant repository, version, VIGIL record, or CAM instrument. It is not required for a valid signal.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input label="External repository or corpus URL" value={form.externalRepositoryUrl} onChange={(value) => set("externalRepositoryUrl", value)} />
              <Input label="Relevant file, path, or page" value={form.relevantPath} onChange={(value) => set("relevantPath", value)} />
              <Input label="Commit, release, DOI, archive, or version" value={form.versionOrArchive} onChange={(value) => set("versionOrArchive", value)} />
              <Input label="Related VIGIL ID" value={form.relatedVigilId} onChange={(value) => set("relatedVigilId", value)} />
              <Input label="Related CAM instrument" value={form.relatedCamInstrument} onChange={(value) => set("relatedCamInstrument", value)} />
              <Textarea label="Additional relationship or repair context" value={form.additionalContext} onChange={(value) => set("additionalContext", value)} />
            </div>
          </details>

          <section className="rounded-2xl border border-border/70 bg-background/30 p-5 shadow-sm md:p-6">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">4. Optional private contact details</p>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">Leave both fields blank to submit anonymously. Contact details are separated from the public-record candidate and are not authorised for publication.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Name or pseudonym" value={form.contributorName} onChange={(value) => set("contributorName", value)} />
              <Input label="Email address" type="email" value={form.contributorEmail} onChange={(value) => set("contributorEmail", value)} />
            </div>
          </section>

          <section className="cam-parchment-card rounded-2xl p-5 shadow-sm md:p-6">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">5. Create and send the draft</p>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">Creating the draft does not submit anything. Download or copy the JSON, open the email, attach the JSON and any screenshots, then send it from your mail application.</p>

            {validationMessage && <p className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{validationMessage}</p>}

            <div className="flex flex-wrap gap-3">
              <button type="button" className="rounded-xl border border-cam-gold/45 bg-cam-gold/10 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-cam-gold/15" onClick={createDraft}>Create draft</button>
              {createdAt && (
                <>
                  <button type="button" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-cam-gold/45" onClick={() => void copyJson()}>{copyState === "copied" ? "JSON copied" : copyState === "error" ? "Copy unavailable" : "Copy JSON"}</button>
                  <button type="button" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-cam-gold/45" onClick={downloadJson}>Download JSON</button>
                  <a className="rounded-xl border border-cam-gold/45 bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-cam-gold/10" href={mailto}>Open email draft</a>
                </>
              )}
            </div>

            {createdAt && (
              <div className="mt-5 rounded-2xl border border-cam-gold/35 bg-cam-gold/10 p-4">
                <p className="font-semibold text-foreground">Draft created locally. Nothing has been submitted yet.</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The email contains a concise summary rather than the full JSON. Attach the downloaded JSON file and any screenshots manually before sending.</p>
                <details className="mt-4">
                  <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.16em] text-cam-gold">Preview structured draft</summary>
                  <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-background p-4 text-xs leading-relaxed text-muted-foreground">{json}</pre>
                </details>
              </div>
            )}

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Accepted material may later be converted into a public VIGIL record after evidence review, redaction where needed, and maintainer classification.</p>
          </section>
        </div>
      </main>
    </Shell>
  );
}
