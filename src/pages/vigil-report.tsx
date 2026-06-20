import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { vigilSchemaOptions } from "@/data/vigilSchemaOptions";

type SubmissionType = "observation" | "failure_incident" | "proposal_suggestion" | "patch_repair_note" | "external_corpus_repo_material" | "other";

const submissionTypes: Array<{ value: SubmissionType; label: string; recordType: string }> = [
  { value: "observation", label: "Observation", recordType: "observation" },
  { value: "failure_incident", label: "Failure / incident", recordType: "failure_mode" },
  { value: "proposal_suggestion", label: "Proposal / suggestion", recordType: "proposal" },
  { value: "patch_repair_note", label: "Patch / repair note", recordType: "patch" },
  { value: "external_corpus_repo_material", label: "External corpus / repo material", recordType: "observation" },
  { value: "other", label: "Other", recordType: "observation" },
];

const initialForm = {
  submissionType: "observation" as SubmissionType,
  title: "",
  description: "",
  platform: "Unknown",
  proposedPlatform: "",
  product: "Unknown",
  proposedProduct: "",
  modelRuntime: "",
  where: "",
  date: "",
  evidenceLinks: "",
  hasAttachments: false,
  attachmentNotes: "",
  screenshotUrls: "",
  whyItMatters: "",
  contributorName: "",
  contributorEmail: "",
  externalRepositoryUrl: "",
  relevantPath: "",
  versionOrArchive: "",
  whatChanged: "",
  relatedRepair: "",
  relationshipType: "",
  relatedVigilId: "",
  relatedCamInstrument: "",
};

type FormState = typeof initialForm;

function splitLines(value: string) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

function Input({ label, value, onChange, type = "text", helper, list }: { label: string; value: string; onChange: (value: string) => void; type?: string; helper?: string; list?: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">{label}</span>
      <input className="rounded-xl border border-border bg-background px-3 py-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} list={list} />
      {helper && <span className="text-xs leading-relaxed text-muted-foreground">{helper}</span>}
    </label>
  );
}

function Textarea({ label, value, onChange, helper }: { label: string; value: string; onChange: (value: string) => void; helper?: string }) {
  return (
    <label className="grid gap-1 text-sm md:col-span-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cam-gold">{label}</span>
      <textarea className="min-h-24 rounded-xl border border-border bg-background px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
      {helper && <span className="text-xs leading-relaxed text-muted-foreground">{helper}</span>}
    </label>
  );
}

function OptionList({ id, options }: { id: string; options: readonly string[] }) {
  return (
    <datalist id={id}>
      {options.map((option) => <option key={option} value={option} />)}
    </datalist>
  );
}

export default function VigilReport() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [draftCreated, setDraftCreated] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDraftCreated(false);
  };

  const selectedType = submissionTypes.find((type) => type.value === form.submissionType) ?? submissionTypes[0];
  const needsExternalFields = form.submissionType === "patch_repair_note" || form.submissionType === "external_corpus_repo_material";
  const schemaReviewRequest = {
    ...(form.platform === "Other" && form.proposedPlatform ? { platform_or_vendor: form.proposedPlatform } : {}),
    ...(form.product === "Other" && form.proposedProduct ? { product_or_service: form.proposedProduct } : {}),
  };

  const draft = useMemo(() => ({
    submission_draft: true,
    schema_alignment: "VIGIL draft — maintainer review required",
    id: "DRAFT",
    draft_id: `draft-${new Date().toISOString()}`,
    submission_type: selectedType.label,
    record_type_hint: selectedType.recordType,
    title: form.title,
    summary: form.description,
    date_observed_or_changed: form.date,
    system_context: {
      platform_or_vendor: form.platform,
      product_or_service: form.product,
      specific_model_or_runtime: form.modelRuntime,
      interface_surface: form.where,
    },
    evidence_links: splitLines(form.evidenceLinks),
    screenshot_or_attachment_context: {
      has_screenshots_or_files_to_attach: form.hasAttachments,
      attachment_notes: form.attachmentNotes,
      public_screenshot_urls: splitLines(form.screenshotUrls),
      manual_email_attachment_required: form.hasAttachments,
    },
    why_it_may_matter: form.whyItMatters,
    contributor: {
      name_or_pseudonym: form.contributorName || undefined,
      email: form.contributorEmail || undefined,
      contact_details_optional: true,
    },
    external_material: needsExternalFields ? {
      external_repository_or_corpus_url: form.externalRepositoryUrl,
      relevant_file_path_or_page: form.relevantPath,
      commit_release_doi_archive_or_version: form.versionOrArchive,
      what_changed: form.whatChanged,
      related_failure_incident_or_proposal: form.relatedRepair,
      relationship_type: form.relationshipType,
      related_vigil_id_if_known: form.relatedVigilId,
      related_cam_instrument_if_known: form.relatedCamInstrument,
    } : undefined,
    schema_value_review_request: Object.keys(schemaReviewRequest).length ? schemaReviewRequest : undefined,
    submission_note: "Creating this draft did not submit anything. The contributor must send it by email for CAM/VIGIL maintainer review.",
  }), [form, needsExternalFields, schemaReviewRequest, selectedType]);

  const json = JSON.stringify(draft, null, 2);
  const subject = `VIGIL Submission Draft — ${form.title || "Untitled submission"}`;
  const emailBody = [
    "VIGIL submission draft",
    "",
    `Title: ${form.title || "Untitled"}`,
    `Submission type: ${selectedType.label}`,
    `Platform/vendor: ${form.platform}${form.proposedPlatform ? ` (${form.proposedPlatform})` : ""}`,
    `Product/service: ${form.product}${form.proposedProduct ? ` (${form.proposedProduct})` : ""}`,
    "",
    form.hasAttachments ? "Attachment reminder: please attach screenshots or files manually before sending." : "",
    "Attach screenshots or files manually to the email before sending if they are relevant.",
    "",
    "JSON draft:",
    json,
  ].filter(Boolean).join("\n");
  const mailto = `mailto:ethics@cam-initiative.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <Shell>
      <main className="container mx-auto max-w-5xl px-6 py-10 md:px-10">
        <header className="mb-6">
          <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">VIGIL reporting</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground md:text-5xl">VIGIL Submissions</h1>
          <div className="max-w-3xl space-y-3 text-base leading-relaxed text-muted-foreground">
            <p>Use this page to prepare a VIGIL submission draft. You can send an observation, incident, proposal, repair note, external repo/corpus reference, or other evidence signal. Anonymous and pseudonymous submissions are welcome.</p>
            <p>This page does not automatically submit anything. After creating the draft, use the email button and send it from your mail app.</p>
            <p>Only provide contact details if you want a reply. Please avoid unnecessary personal, sensitive, confidential, or third-party information.</p>
          </div>
        </header>

        <OptionList id="platform-options" options={vigilSchemaOptions.platform_or_vendor} />
        <OptionList id="product-options" options={vigilSchemaOptions.product_or_service} />

        <div className="grid gap-5">
          <section className="cam-parchment-card rounded-2xl p-5 shadow-sm">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">1. What are you submitting?</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {submissionTypes.map((type) => (
                <button key={type.value} type="button" className={`rounded-xl border p-3 text-left transition ${form.submissionType === type.value ? "border-cam-gold bg-cam-gold/10 text-foreground" : "border-border bg-card/60 text-muted-foreground hover:text-foreground"}`} onClick={() => set("submissionType", type.value)}>
                  {type.label}
                </button>
              ))}
            </div>
          </section>

          <section className="cam-parchment-card rounded-2xl p-5 shadow-sm">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">2. What happened / what changed?</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Short title" value={form.title} onChange={(value) => set("title", value)} />
              <Input label="Date observed or date changed" type="date" value={form.date} onChange={(value) => set("date", value)} />
              <Textarea label="What happened? / What should we look at?" value={form.description} onChange={(value) => set("description", value)} />
              <Input label="Platform or vendor" value={form.platform} onChange={(value) => set("platform", value)} list="platform-options" />
              <Input label="Product or service" value={form.product} onChange={(value) => set("product", value)} list="product-options" />
              {form.platform === "Other" && <Input label="Proposed platform/vendor value" value={form.proposedPlatform} onChange={(value) => set("proposedPlatform", value)} />}
              {form.product === "Other" && <Input label="Proposed product/service value" value={form.proposedProduct} onChange={(value) => set("proposedProduct", value)} />}
              <Input label="Model/version/runtime if known" value={form.modelRuntime} onChange={(value) => set("modelRuntime", value)} />
              <Input label="Where did this happen?" value={form.where} onChange={(value) => set("where", value)} helper="For example: ChatGPT web, mobile app, image generation, voice mode, API, GitHub repo, model card, public post, policy page, app store listing, or another visible surface." />
              <Textarea label="Evidence links" value={form.evidenceLinks} onChange={(value) => set("evidenceLinks", value)} />
              <Textarea label="Why it may matter" value={form.whyItMatters} onChange={(value) => set("whyItMatters", value)} />
              <label className="flex items-center gap-3 rounded-xl border border-border bg-background/35 p-3 text-sm text-muted-foreground md:col-span-2">
                <input type="checkbox" checked={form.hasAttachments} onChange={(event) => set("hasAttachments", event.target.checked)} />
                I have screenshots or files to attach
              </label>
              <Textarea label="Screenshot / attachment notes" value={form.attachmentNotes} onChange={(value) => set("attachmentNotes", value)} helper="Attach screenshots or files manually to the email before sending." />
              <Textarea label="Public screenshot URL(s), if already hosted" value={form.screenshotUrls} onChange={(value) => set("screenshotUrls", value)} />
              {needsExternalFields && (
                <>
                  <Input label="External repository or corpus URL" value={form.externalRepositoryUrl} onChange={(value) => set("externalRepositoryUrl", value)} />
                  <Input label="Relevant file/path/page" value={form.relevantPath} onChange={(value) => set("relevantPath", value)} />
                  <Input label="Commit, release, DOI, archive link, or version if known" value={form.versionOrArchive} onChange={(value) => set("versionOrArchive", value)} />
                  <Input label="Related VIGIL ID if known" value={form.relatedVigilId} onChange={(value) => set("relatedVigilId", value)} />
                  <Textarea label="What changed?" value={form.whatChanged} onChange={(value) => set("whatChanged", value)} />
                  <Textarea label="Which failure, incident, or proposal might this repair or relate to?" value={form.relatedRepair} onChange={(value) => set("relatedRepair", value)} />
                  <Input label="Is this a direct repair, related material, or possible cross-reference?" value={form.relationshipType} onChange={(value) => set("relationshipType", value)} />
                  <Input label="Related CAM instrument if known" value={form.relatedCamInstrument} onChange={(value) => set("relatedCamInstrument", value)} />
                </>
              )}
              <Input label="Optional contributor name or pseudonym" value={form.contributorName} onChange={(value) => set("contributorName", value)} />
              <Input label="Optional contributor email" type="email" value={form.contributorEmail} onChange={(value) => set("contributorEmail", value)} />
            </div>
          </section>

          <section className="cam-parchment-card rounded-2xl p-5 shadow-sm">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-cam-gold">3. Create draft and email it</p>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">Creating a draft does not submit anything. You must press the email button and send the email from your mail app.</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="rounded-xl border border-cam-gold/40 bg-cam-gold/10 px-4 py-2 text-sm font-medium text-foreground" onClick={() => setDraftCreated(true)}>Create draft</button>
              {draftCreated && <a className="rounded-xl border border-cam-gold/40 bg-card px-4 py-2 text-sm font-medium text-foreground" href={mailto}>Email submission draft</a>}
            </div>
            {draftCreated && (
              <div className="mt-5 rounded-2xl border border-cam-gold/35 bg-cam-gold/10 p-4">
                <p className="font-semibold text-foreground">Draft created only. This has not been submitted yet. To send it to CAM Initiative, press the email button below and send the email from your mail application.</p>
                {form.hasAttachments && <p className="mt-2 text-sm text-muted-foreground">Attachment reminder: please attach screenshots or files manually before sending.</p>}
                <details className="mt-4">
                  <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.16em] text-cam-gold">Compact JSON draft</summary>
                  <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-background p-4 text-xs text-muted-foreground">{json}</pre>
                </details>
              </div>
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Accepted records may later be maintained in the public VIGIL repository after maintainer review.</p>
          </section>
        </div>
      </main>
    </Shell>
  );
}
