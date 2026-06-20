import { Shell } from "@/components/layout/Shell";

const sections = [
  ["Overview", "This policy explains how the CAM Initiative site and VIGIL reporting workflow handle information. The static site does not intentionally collect personal information through the browser unless you choose to contact us or prepare and send a report."],
  ["What we collect", "Contributor name, pseudonym, email, organisation or role, evidence URLs, and submitted report contents may be collected only if you provide them in an email, GitHub issue, pull request, or other contribution channel."],
  ["Optional contributor information", "Contributor details are optional. You may provide a display name or contact email if you want maintainers to follow up, but reports can be prepared without those fields."],
  ["Anonymous and pseudonymous submissions", "Anonymous and pseudonymous reports are accepted. If you need anonymity, avoid including identifying metadata in text, screenshots, filenames, links, or email accounts."],
  ["Evidence and third-party information", "Please submit public-interest evidence only. Do not submit secrets, private credentials, private medical information, private addresses, or third-party personal information unless essential and lawful."],
  ["How information is used", "Information you provide may be used to review a VIGIL signal, assess evidence, request clarification, route a CAM governance issue, or prepare a public record if accepted."],
  ["Public record review and publication risk", "Accepted VIGIL records may become public. Contributor contact details should not be published unless explicitly agreed or already public and relevant, but evidence links and report contents may reveal information you include."],
  ["How information is stored / transmitted", "This interface builds drafts in your browser and does not silently submit or store them. If you send a report by email or GitHub, that service may store and transmit the material under its own terms."],
  ["Third-party services", "GitHub Pages, email providers, GitHub, analytics-free static hosting infrastructure, browsers, and networks may process technical metadata such as IP address, user agent, timestamps, or logs under their own policies."],
  ["Access, correction, and deletion requests", "You may ask for access, correction, removal, or contributor-detail redaction where practicable. Public repository history, forks, archives, email delivery, or legal/public-interest retention may limit what can be changed."],
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
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">Plain-language privacy notes for the CAM Initiative website and VIGIL reporting workflow. This policy explains current site behaviour; it is not a legal compliance promise.</p>
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
