import { Shell } from "@/components/layout/Shell";

const sections = [
  ["Overview", "This policy explains the current CAM Initiative website and VIGIL reporting workflow. The site is published as a static website and does not silently submit a VIGIL report when you type into the form."],
  ["Browser-local draft preparation", "The VIGIL reporting page prepares a structured draft in your browser. Nothing is sent to CAM Initiative until you choose to open an email and send it. The current workflow does not require a CAM account."],
  ["Public evidence and private contact details", "The draft separates the public-record candidate from optional private contact details. A name, pseudonym, or email address is supplied for correspondence only and should not be included in a public VIGIL record without explicit agreement."],
  ["Anonymous and pseudonymous submissions", "Anonymous and pseudonymous VIGIL submissions are welcome. If you need anonymity, avoid identifying metadata in text, screenshots, filenames, public links, email accounts, or document properties."],
  ["Evidence, screenshots, and third-party information", "Screenshots and evidence may contain personal information. Avoid unnecessary personal, sensitive, confidential, medical, credential, address, or third-party information. Remove unrelated identifying details where practicable."],
  ["How submitted information may be used", "Material you send may be used to review a VIGIL signal, assess evidence, request clarification, route a governance issue, identify related records, or prepare a public record if accepted."],
  ["Public-record review", "A submitted draft is not automatically a public VIGIL record. Accepted material may be classified, edited, summarised, cross-referenced, or redacted during maintainer review. Contact details should not be published unless explicitly agreed or already public and materially relevant."],
  ["Email and attachments", "The website cannot attach files automatically. If you open the prepared email, attach the downloaded JSON draft and any screenshots or files manually. Your email provider and network may store or transmit the message under their own terms."],
  ["Third-party services and technical logs", "GitHub Pages, domain services, browsers, networks, email providers, and linked third-party services may process technical metadata such as IP address, user agent, timestamps, logs, account identifiers, or delivery data under their own policies."],
  ["Access, correction, redaction, and removal", "You may request access, correction, contributor-detail redaction, or removal where practicable. Public repository history, forks, archives, email delivery, evidence-integrity needs, legal obligations, or public-interest retention may limit what can be changed."],
  ["Non-affiliation", "The CAM Initiative and the Caelestis Architecture Model are not affiliated with the Caelestis project at https://caelestis-project.eu/."],
  ["Contact", "For privacy questions or requests, contact ethics@cam-initiative.org."],
  ["Last updated", "13 July 2026."],
];

export default function Privacy() {
  return (
    <Shell>
      <main className="container mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
        <div className="mb-8">
          <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">Privacy</p>
          <h1 className="mb-4 font-serif text-4xl text-foreground md:text-5xl">Privacy Policy</h1>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">Plain-language privacy information for the CAM Initiative website and VIGIL reporting workflow. It explains current site behaviour and is not a claim of legal certification or regulatory compliance.</p>
        </div>
        <div className="space-y-4">
          {sections.map(([title, body]) => (
            <section className="cam-parchment-card rounded-2xl p-5 shadow-sm" key={title}>
              <h2 className="mb-2 font-serif text-2xl text-foreground">{title}</h2>
              <p className="text-base leading-relaxed text-muted-foreground">{body}</p>
            </section>
          ))}
        </div>
      </main>
    </Shell>
  );
}
