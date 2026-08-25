import { Shell } from "@/components/layout/Shell";

const sections = [
  ["Overview", "This policy explains the current CAM Initiative website. The site is published as a static public website and does not provide an online VIGIL submission portal, user accounts, or a private evidence-upload service."],
  ["Information you choose to send", "The website includes contact links that open your email application. Nothing is transmitted merely by visiting the site or selecting a contact link. Information reaches CAM Initiative only when you choose to send an email."],
  ["Evidence and correction enquiries", "Evidence, correction, or governance enquiries may be sent to ethics@cam-initiative.org. Email is not an anonymous channel: the sending address and technical delivery metadata may be visible to CAM Initiative and relevant email or network providers."],
  ["Sensitive and third-party information", "Do not send unnecessary personal, sensitive, confidential, medical, credential, address, or third-party information. Remove unrelated identifying details and document or image metadata where practicable."],
  ["How correspondence may be used", "Correspondence may be used to assess an enquiry, review supporting evidence, request clarification, identify related governance records, correct published information, or inform future CAM or VIGIL work."],
  ["Public-record review", "Material received by email is not automatically a public VIGIL record. Any later publication is subject to maintainer review, classification, evidence assessment, and redaction where appropriate. Contact details should not be published without explicit agreement unless already public and materially relevant."],
  ["Third-party services and technical logs", "GitHub Pages, domain services, browsers, networks, email providers, and linked third-party services may process technical metadata such as IP address, user agent, timestamps, logs, account identifiers, or delivery data under their own policies."],
  ["Access, correction, redaction, and removal", "You may request access, correction, contributor-detail redaction, or removal where practicable. Public repository history, forks, archives, email delivery, evidence-integrity needs, legal obligations, or public-interest retention may limit what can be changed."],
  ["Non-affiliation", "The CAM Initiative and the CAELESTIS Architecture Model are not affiliated with the Caelestis project at caelestis-project.eu."],
  ["Contact", "For privacy, evidence, or correction enquiries, contact ethics@cam-initiative.org."],
];

export default function Privacy() {
  return <Shell>
    <main className="public-reference-page">
      <div className="container mx-auto max-w-[1040px] px-4 py-8 sm:px-6 md:px-10 md:py-12">
        <article className="public-reference-document">
          <header className="public-reference-hero">
            <p className="public-reference-kicker">CAM Initiative</p>
            <h1>Privacy Policy</h1>
            <p>Plain-language privacy information for the CAM Initiative public website and email correspondence. It describes current site behaviour and does not claim legal certification or regulatory compliance.</p>
            <p className="public-reference-meta">Last updated · 13 July 2026</p>
          </header>

          <div className="public-reference-policy-list">
            {sections.map(([title, body], index) => <section key={title} className="public-reference-policy-section">
              <header><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2></header>
              <p>{body}</p>
            </section>)}
          </div>
        </article>
      </div>
    </main>
  </Shell>;
}
