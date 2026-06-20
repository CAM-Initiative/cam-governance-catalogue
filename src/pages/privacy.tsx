import { Shell } from "@/components/layout/Shell";

const sections = [
  ["Overview", "This policy explains current site behaviour. This static site does not intentionally collect form data unless you choose to email, share, or otherwise send it to CAM Initiative."],
  ["Optional contributor information", "Contributor name, pseudonym, email, organisation or role, evidence URLs, screenshots, and submitted report contents may be received only if you provide them. Only provide contact details if you want a reply."],
  ["Anonymous and pseudonymous submissions accepted", "Anonymous and pseudonymous VIGIL submissions are welcome. If you need anonymity, avoid including identifying metadata in text, screenshots, filenames, links, or email accounts."],
  ["Evidence, screenshots, and third-party information", "Screenshots and evidence may contain personal information. Please avoid unnecessary personal, sensitive, confidential, or third-party information, including secrets, private credentials, private medical information, and private addresses."],
  ["How information is used", "Information you provide may be used to review a VIGIL signal, assess evidence, request clarification, route a governance issue, or prepare a public record if accepted."],
  ["Public record review and publication risk", "Accepted VIGIL material may later become public after maintainer review. Contributor contact details should not be published unless explicitly agreed or already public and materially relevant."],
  ["How information is stored or transmitted", "The VIGIL Submissions page builds drafts in your browser and does not silently submit or store them. If you send a report by email or another service, that service may store and transmit the material under its own terms."],
  ["Third-party services", "Email providers, GitHub, hosting providers, browsers, networks, and linked third-party services may process technical metadata such as IP address, user agent, timestamps, logs, account identifiers, or delivery data under their own policies."],
  ["Access, correction, and deletion requests", "You may ask for access, correction, removal, or contributor-detail redaction where practicable. Public repository history, forks, archives, email delivery, or legal/public-interest retention may limit what can be changed."],
  ["Non-affiliation", "The CAM Initiative and the Caelestis Architecture Model are not affiliated with the Caelestis project at https://caelestis-project.eu/."],
  ["Contact", "For privacy questions or requests, contact ethics@cam-initiative.org."],
  ["Last updated", "20 June 2026."],
];

export default function Privacy() {
  return (
    <Shell>
      <main className="container mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
        <div className="mb-8">
          <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.22em] text-cam-gold">Privacy</p>
          <h1 className="mb-4 font-serif text-4xl text-foreground md:text-5xl">Privacy Policy</h1>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">Plain-language privacy notes for the CAM Initiative website and VIGIL Submissions workflow. This policy explains site behaviour; it is not a legal compliance claim.</p>
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
