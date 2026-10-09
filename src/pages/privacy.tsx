import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";

const sections = [
  { id: "overview", title: "Overview", body: "This policy explains the current CAM Initiative website. The site is published as a static public website. Where enabled, it offers a Case File issue-reporting form for challenging evidence, references and assessments in existing VIGIL Observatory records. It does not provide user accounts or a general confidential evidence-upload service." },
  { id: "information-you-send", title: "Information you choose to send", body: "The website includes contact links that open your email application. Nothing is sent to CAM Initiative by selecting an email contact link alone. Information reaches us when you send an email or submit an enabled Case File report. Opening the reporting form without submitting does not create a review record, although an enabled anti-abuse verification service may process technical data." },
  { id: "evidence-and-corrections", title: "Evidence and correction enquiries", body: "Evidence, correction, or governance enquiries may be sent to ethics@cam-initiative.org. An enabled Case File form also allows challenges to the accuracy or interpretation of existing published Case Files. Email is not anonymous: the sending address and technical delivery metadata may be visible to CAM Initiative and relevant providers." },
  { id: "case-file-form-data", title: "Information collected through Case File reports", body: "Where available, the Case File form collects the record identifier and URL, report category, disputed statement or section, explanation, any supporting evidence or reference links you provide, and an optional reply email. It also records your confirmation that the report is an evidence-quality challenge. No contact email is required. The form does not accept file uploads and is not a channel for submitting sensitive or confidential third-party evidence." },
  { id: "case-file-processing", title: "How Case File reports are processed", body: "When the form is enabled, Cloudflare Turnstile checks for automated abuse and a Cloudflare Worker validates and forwards the report to an access-restricted private GitHub repository for review by authorised CAM Initiative maintainers. Cloudflare and GitHub may process associated technical data, including network identifiers, IP addresses, timestamps and security logs, and may process data outside Australia under their own terms and privacy practices. Optional contact details remain in the private review record and are not published as part of a Case File." },
  { id: "case-file-review-retention", title: "Review, retention and publication", body: "Reports are treated as unverified information. Maintainers may use them to check primary evidence, request clarification if contact details were provided, record review decisions, and make substantiated corrections through the normal VIGIL process. Reports do not automatically change or publish Case Files. Private review records may be retained as needed for evidence-integrity, correction history, duplicate assessment and applicable obligations; no fixed automatic deletion period is promised. Optional contact details should be removed or redacted when no longer necessary. Requests for access, correction or removal may be made using the contact below and will be considered case by case." },
  { id: "sensitive-information", title: "Sensitive and third-party information", body: "Do not send unnecessary personal, sensitive, confidential, medical, credential, address, or third-party information. Remove unrelated identifying details and document or image metadata where practicable." },
  { id: "correspondence-use", title: "How correspondence may be used", body: "Correspondence may be used to assess an enquiry, review supporting evidence, request clarification, identify related governance records, correct published information, or inform future CAM or VIGIL Observatory work." },
  { id: "public-record-review", title: "Public-record review", body: "Material received by email is not automatically a public VIGIL Observatory record. Any later publication is subject to maintainer review, classification, evidence assessment, and redaction where appropriate. Contact details should not be published without explicit agreement unless already public and materially relevant." },
  { id: "third-party-services", title: "Third-party services and technical logs", body: "GitHub Pages, Cloudflare, GitHub private issue services, domain services, browsers, networks, email providers, and linked third-party services may process technical metadata such as IP address, user agent, timestamps, logs, account identifiers, or delivery data under their own policies." },
  { id: "access-and-removal", title: "Access, correction, redaction, and removal", body: "You may request access, correction, contributor-detail redaction, or removal where practicable. Public repository history, forks, archives, email delivery, evidence-integrity needs, legal obligations, or public-interest retention may limit what can be changed." },
  { id: "non-affiliation", title: "Non-affiliation", body: "The CAM Initiative and the CAELESTIS Architecture Model are not affiliated with the Caelestis project at caelestis-project.eu." },
  { id: "contact", title: "Contact", body: "For privacy, evidence, or correction enquiries, contact ethics@cam-initiative.org." },
];

const privacyRail = sections.map((section) => ({ href: `#${section.id}`, label: section.title }));

export default function Privacy() {
  return <Shell>
    <main className="public-reference-page home-menu-page document-page">
      <div className="document-layout">
        <DocumentRail title="Privacy" items={privacyRail} ariaLabel="Privacy Policy sections" />

        <article className="document-content public-reference-document">
          <header className="document-hero public-reference-hero">
            <p className="public-reference-kicker">CAM Initiative</p>
            <h1>Privacy Policy</h1>
            <p>Plain-language privacy information for the CAM Initiative public website, email correspondence and VIGIL Case File issue-reporting forms. It describes current site behaviour and does not claim legal certification or regulatory compliance.</p>
            <p className="public-reference-meta">Last updated · 9 October 2026</p>
          </header>

          {sections.map((section) => <section id={section.id} key={section.id} className="document-section public-reference-policy-section">
            <div className="document-section-heading">
              <h2>{section.title}</h2>
            </div>
            <div className="document-reading">
              <p>{section.body}</p>
            </div>
          </section>)}
        </article>
      </div>
    </main>
  </Shell>;
}
