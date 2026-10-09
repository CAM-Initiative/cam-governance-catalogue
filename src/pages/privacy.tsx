import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";
import privacyPolicy from "@/lib/privacyPolicy.json";

const { sections } = privacyPolicy;

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
            <p>{privacyPolicy.intro}</p>
            <p className="public-reference-meta">Last updated · {privacyPolicy.lastUpdated}</p>
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
