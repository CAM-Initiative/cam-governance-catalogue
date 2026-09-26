import { DocumentRail } from "@/components/DocumentRail";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryMasthead } from "@/components/vigil/VigilObservatoryMasthead";
import { motion } from "framer-motion";
import { Download, ExternalLink } from "lucide-react";

const trainingPolicyPdfHref = `${import.meta.env.BASE_URL}publications/CAM_Initiative_Australian_AI_Training_and_Contribution_Policy_Proposal.pdf`;
const sociSubmissionPdfHref = `${import.meta.env.BASE_URL}publications/CAM_SOCI_Targeted_Submission_FINAL.pdf`;
const aiProsperityParliamentHref = "https://www.aph.gov.au/DocumentStore.ashx?id=40eca803-9218-4238-93e6-6798859ef784&subId=802190";

const primaryButtonClass =
  "cam-action cam-action-primary";

const secondaryButtonClass =
  "cam-action cam-action-secondary";

const policyRail = [
  { href: "#parliamentary-submission-ai-prosperity-2026", label: "Artificial Intelligence and Australian Prosperity", meta: "PS 01/2026" },
  { href: "#consultation-submission-01-2026", label: "SOCI Act Consultation Submission", meta: "CS 01/2026" },
  { href: "#policy-proposal-01-2026", label: "AI Training, Contribution & Copyright Scheme", meta: "PP 01/2026" },
];

export default function Policy() {
  return (
    <Shell>
      <main className="home-menu-page document-page policy-page">
        <VigilObservatoryMasthead
          titleId="policy-heading"
          kicker="CAM Initiative · Public policy"
          title="Policy Papers & Submissions"
          description="Public policy proposals and consultation submissions translating CAM governance architecture into implementable institutional design, legal mechanisms, public administration, and accountable technology transition."
          contextLabel="Library context"
          mode="collection"
          metadata={[
            { label: "Collection", value: "Policy & submissions" },
            { label: "Published", value: policyRail.length },
            { label: "Publisher", value: "CAM Initiative" },
            { label: "Access", value: "Public" },
          ]}
        />

        <div id="policy-library" className="document-layout document-layout--wide document-layout-below-header">
          <DocumentRail
            title="Policy library"
            items={policyRail}
            ariaLabel="Policy papers and submissions"
          />

          <div className="document-content">
            <section className="policy-publications" aria-label="Policy publications">
            <motion.article
              className="policy-publication"
              id="parliamentary-submission-ai-prosperity-2026"
              initial={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.65 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="policy-publication-banner">
                <div className="policy-publication-banner-row">
                  <p className="policy-kicker">Parliamentary Submission · 2026</p>
                  <span className="policy-publication-status">
                    Published by the Parliament of Australia
                  </span>
                </div>
              </div>

              <div className="policy-publication-body">
                <p className="policy-publication-date">13 September 2026</p>
                <h2 className="policy-publication-title">
                  Artificial Intelligence and Australian Prosperity
                </h2>
                <p className="policy-publication-subtitle">
                  Submission to the Joint Select Committee on Artificial Intelligence
                </p>

                <div className="policy-publication-copy">
                  <p>
                    This submission proposes a national prosperity framework for retaining Australian productive capacity, knowledge, value and capability through the AI transition.
                  </p>
                  <p>
                    It treats sovereign AI as an economic lifecycle: <strong>Discover → Fund → Build → Scale → Retain → Reinvest</strong>, connecting emerging capability, strategic capital, domestic industry, scale-up pathways, Australian ownership and long-term reinvestment.
                  </p>
                  <p>
                    The submission also addresses copyright and creator value, robotics and automation, strategic digital infrastructure, workforce transition and mechanisms for retaining a greater share of AI-era economic value in Australia.
                  </p>
                </div>

                <div className="cam-action-row">
                  <a className={primaryButtonClass} href={aiProsperityParliamentHref} rel="noreferrer" target="_blank">
                    View official parliamentary submission
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </motion.article>

            <motion.article
              className="policy-publication"
              id="consultation-submission-01-2026"
              initial={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.65 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="policy-publication-banner">
                <div className="policy-publication-banner-row">
                  <p className="policy-kicker">Consultation Submission 01/2026</p>
                  <span className="policy-publication-status">
                    Independent public-interest submission
                  </span>
                </div>
              </div>

              <div className="policy-publication-body">
                <p className="policy-publication-date">29 July 2026</p>
                <h2 className="policy-publication-title">
                  Proposed Amendments to the Security of Critical Infrastructure Act 2018
                </h2>
                <p className="policy-publication-subtitle">
                  Automated systems, material digital dependencies, assurance, evidence integrity and foreign-control continuity
                </p>

                <div className="policy-publication-copy">
                  <p>
                    This targeted submission responds to the Department of Home Affairs consultation where CAM governance architecture offers a specific operational contribution. It addresses material dependency information, automated-system incidents, preliminary good-faith reporting, CIRMP assurance, relevant operators, supplier assurance and specified risk information.
                  </p>
                  <p>
                    The submission recommends classifying incidents on objective security and operational facts before complete attribution or culpability is available; allocating duties according to practical control, superior telemetry and remediation capacity; and distinguishing raw telemetry, derived analysis, record integrity, capture accuracy and confidence-rated actor attribution.
                  </p>
                  <p>
                    It also proposes systemic supplier assessment, common-provider event reporting, foreign-control continuity assurance, and procurement measures that build Australian cyber capability and reduce permanent dependence on concentrated external suppliers.
                  </p>
                </div>

                <div className="cam-action-row">
                  <a className={primaryButtonClass} download href={sociSubmissionPdfHref}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download PDF
                  </a>
                  <a className={secondaryButtonClass} href={sociSubmissionPdfHref} rel="noreferrer" target="_blank">
                    Open PDF in browser
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>

                <div className="policy-document-frame">
                  <div className="policy-document-frame-head">
                    <p className="policy-document-frame-label">Read the submission</p>
                  </div>
                  <iframe
                    className="policy-document-frame-viewer"
                    loading="lazy"
                    src={sociSubmissionPdfHref}
                    title="CAM Initiative submission on proposed amendments to the Security of Critical Infrastructure Act 2018"
                  />
                  <p className="policy-document-frame-note">
                    The embedded viewer depends on browser PDF support. Use “Open PDF in browser” or “Download PDF” where the preview is unavailable.
                  </p>
                </div>
              </div>
            </motion.article>

            <motion.article
              className="policy-publication"
              id="policy-proposal-01-2026"
              initial={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.65 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="policy-publication-banner">
                <div className="policy-publication-banner-row">
                  <p className="policy-kicker">Policy Proposal 01/2026</p>
                  <span className="policy-publication-status">
                    Independent public policy proposal
                  </span>
                </div>
              </div>

              <div className="policy-publication-body">
                <p className="policy-publication-date">20 July 2026</p>
                <h2 className="policy-publication-title">
                  AI Training, Contribution &amp; Copyright Scheme
                </h2>
                <p className="policy-publication-subtitle">
                  Copyright permission, contribution valuation and sovereign value return
                </p>

                <div className="policy-publication-copy">
                  <p>
                    This paper explores a two-sided Australian AI training and contribution scheme. One side would address lawful permission and proportionate contributions from covered AI providers; the other would allocate value to verified rights holders and accredited corpus stewards according to contribution, utility, dependency, and continuing stewardship.
                  </p>
                  <p>
                    The proposal distinguishes the legal question of whether protected material may be used from the economic question of how different human contributions might be valued. A levy or public fund would not, by itself, provide blanket permission to ingest protected material.
                  </p>
                  <p>
                    It also considers how domestic training regulation could be paired with an Australian market-access obligation so that equivalent models trained offshore do not receive an avoidance advantage.
                  </p>
                </div>

                <div className="cam-action-row">
                  <a className={primaryButtonClass} download href={trainingPolicyPdfHref}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download PDF
                  </a>
                  <a className={secondaryButtonClass} href={trainingPolicyPdfHref} rel="noreferrer" target="_blank">
                    Open PDF in browser
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </motion.article>
            </section>
          </div>
        </div>
      </main>
    </Shell>
  );
}
