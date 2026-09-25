import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";

const sections = [
  { id: "overview", title: "Overview", body: "This policy explains the current CAM Initiative website. The site is published as a static public website and does not provide an online VIGIL Observatory submission portal, user accounts, or a private evidence-upload service." },
  { id: "information-you-send", title: "Information you choose to send", body: "The website includes contact links that open your email application. Nothing is transmitted merely by visiting the site or selecting a contact link. Information reaches CAM Initiative only when you choose to send an email." },
  { id: "evidence-and-corrections", title: "Evidence and correction enquiries", body: "Evidence, correction, or governance enquiries may be sent to ethics@cam-initiative.org. Email is not an anonymous channel: the sending address and technical delivery metadata may be visible to CAM Initiative and relevant email or network providers." },
  { id: "sensitive-information", title: "Sensitive and third-party information", body: "Do not send unnecessary personal, sensitive, confidential, medical, credential, address, or third-party information. Remove unrelated identifying details and document or image metadata where practicable." },
  { id: "correspondence-use", title: "How correspondence may be used", body: "Correspondence may be used to assess an enquiry, review supporting evidence, request clarification, identify related governance records, correct published information, or inform future CAM or VIGIL Observatory work." },
  { id: "public-record-review", title: "Public-record review", body: "Material received by email is not automatically a public VIGIL Observatory record. Any later publication is subject to maintainer review, classification, evidence assessment, and redaction where appropriate. Contact details should not be published without explicit agreement unless already public and materially relevant." },
  { id: "third-party-services", title: "Third-party services and technical logs", body: "GitHub Pages, domain services, browsers, networks, email providers, and linked third-party services may process technical metadata such as IP address, user agent, timestamps, logs, account identifiers, or delivery data under their own policies." },
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
            <p>Plain-language privacy information for the CAM Initiative public website and email correspondence. It describes current site behaviour and does not claim legal certification or regulatory compliance.</p>
            <p className="public-reference-meta">Last updated · 13 July 2026</p>
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
