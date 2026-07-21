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
  ["Non-affiliation", "The CAM Initiative and the Caelestis Architecture Model are not affiliated with the Caelestis project at https://caelestis-project.eu/."],
  ["Contact", "For privacy, evidence, or correction enquiries, contact ethics@cam-initiative.org."],
  ["Last updated", "13 July 2026."],
];

export default function Privacy() {
  return (
    <Shell>
      <main className="container mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
        <div className="mb-10">
          <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-cam-gold">Privacy</p>
          <h1 className="mb-3 font-serif text-4xl text-foreground md:text-5xl">Privacy Policy</h1>
          <hr className="gold-rule mb-4 w-24" />
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">Plain-language privacy information for the CAM Initiative public website and email correspondence. It explains current site behaviour and is not a claim of legal certification or regulatory compliance.</p>
        </div>
        <div className="space-y-4">
          {sections.map(([title, body]) => (
            <section className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm" key={title}>
              <h2 className="mb-2 font-serif text-2xl text-foreground">{title}</h2>
              <p className="text-base leading-relaxed text-foreground/75">{body}</p>
            </section>
          ))}
        </div>
      </main>
    </Shell>
  );
}
