import { type ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";

function ReferenceSection({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: string; children: ReactNode }) {
  return <section className="public-reference-section"><header className="public-reference-section-heading"><span>{number}</span><div><p>{eyebrow}</p><h2>{title}</h2></div></header><div className="public-reference-section-body">{children}</div></section>;
}

export default function Licensing() {
  return <Shell><main className="public-reference-page public-reference-page--single-document"><div className="public-reference-layout container mx-auto px-4 py-8 sm:px-6 md:px-10 md:py-11"><article className="public-reference-document public-reference-document--single">
    <header className="public-reference-hero"><p className="public-reference-kicker">CAM Initiative</p><h1>Copyright & Licensing</h1><p>Public access is intended to support inspection, citation, research reference and public-interest discussion. It does not make VIGIL Observatory or other CAM Initiative materials open-licensed. The applicable rights depend on which material you are using.</p><p className="public-reference-meta">© 2026 Phoenix Covenant Pty Ltd trading as CAM Initiative. All rights reserved.</p></header>

    <ReferenceSection number="01" eyebrow="Ownership" title="Publisher, author and licensor"><div className="public-reference-list">
      <article><div><p>Publisher / licensor</p><h3>Phoenix Covenant Pty Ltd trading as CAM Initiative</h3></div><p>Copyright ownership and licensing authority for VIGIL Observatory and other CAM Initiative materials sit with the company to the extent those rights subsist.</p></article>
      <article><div><p>Author / maintainer</p><h3>Dr Michelle O&apos;Rourke</h3></div><p>Authorship and scholarly citation remain attributed to Dr Michelle O&apos;Rourke where appropriate. Corporate copyright ownership does not replace author attribution.</p></article>
    </div></ReferenceSection>

    <ReferenceSection number="02" eyebrow="VIGIL Observatory" title="Publicly inspectable proprietary governance material"><div className="public-reference-reading">
      <p>The VIGIL Observatory Failure Taxonomy, Incident records, taxonomy structures, families, classes, names, definitions, invariants, recognition criteria, classification boundaries, relationships, explanatory prose, schemas, indexes, structured arrangements, compilations and generated publications are proprietary VIGIL Observatory Materials where original rights are owned or controlled by CAM Initiative.</p>
      <p><strong>Citation, reference and linking are permitted and encouraged.</strong> Limited quotation is permitted to the extent allowed by applicable law. Citations should clearly attribute <strong>Dr Michelle O&apos;Rourke, CAM Initiative, VIGIL Observatory</strong> and, where relevant, identify the taxonomy version, Incident or record ID and canonical URL.</p>
      <p>Public access does not grant permission to reproduce substantial parts of VIGIL Observatory, redistribute or republish it, adapt or translate it, create derivative works, systematically extract or reconstruct the corpus, incorporate it into another taxonomy, framework, product, dataset, API or service, or otherwise make substantive commercial or non-commercial reuse without prior written permission.</p>
      <p>Use of VIGIL Observatory Materials for machine-learning training, fine-tuning, evaluation, benchmarking, retrieval or RAG systems, dataset construction, synthetic-data generation, automated classification, or AI-system development or improvement requires prior written permission.</p>
      <p>No licence is granted by implication, estoppel, public availability, website access or repository access. These restrictions apply only to rights owned or controlled by CAM Initiative and do not limit fair dealing, fair use or other non-waivable legal exceptions.</p>
    </div></ReferenceSection>

    <ReferenceSection number="03" eyebrow="Website & interface" title="CAM Initiative website materials"><div className="public-reference-reading">
      <p>The CAM Initiative website&apos;s source code, page structure, styling, routing, registry-loading logic, design components and associated interface documentation are governed separately by the <strong>CAM Governance Interface Licence v1.0</strong>.</p>
      <p>That licence permits public-interest, research, educational, journalistic, policy, civic, archival, governance and other non-commercial use of the Interface, including non-commercial copying, adaptation and derivative interface work subject to attribution and the licence conditions. Commercial use, model training, dataset reconstruction and paid product integration require prior written permission.</p>
      <p>Using the website or interface does not grant broader rights in VIGIL Observatory, CAELESTIS or other CAM Initiative materials displayed through it. Where a more specific notice applies to an underlying governance material, that specific notice controls.</p>
      <p><a href="https://github.com/CAM-Initiative/cam-governance-catalogue/blob/main/LICENSE.md" target="_blank" rel="noreferrer">Read the website/interface licence →</a></p>
    </div></ReferenceSection>

    <ReferenceSection number="04" eyebrow="Third-party sources" title="Source material keeps its own rights"><div className="public-reference-reading">
      <p>VIGIL Observatory references third-party articles, papers, standards, government publications, provider material, screenshots, platform outputs and other evidence. Those materials remain subject to the rights and licence terms of their respective owners.</p>
      <p>A VIGIL Observatory citation or evidence link does not transfer third-party rights to CAM Initiative and does not grant permission to reproduce the underlying source.</p>
    </div></ReferenceSection>

    <ReferenceSection number="05" eyebrow="Permissions" title="Licensing enquiries"><div className="public-reference-reading">
      <p>For commercial use, substantive reuse, model-training or evaluation use, bulk extraction, paid integration, derivative taxonomy work, sublicensing or other permissions beyond public access, citation and reference, contact <a href="mailto:research@cam-initiative.org">research@cam-initiative.org</a>.</p>
      <p>The repository-specific licence remains the controlling instrument. This page is a public-facing summary intended to make the current rights position easy to find and understand.</p>
      <p><a href="https://github.com/CAM-Initiative/Vigil/blob/main/LICENSE.md" target="_blank" rel="noreferrer">Read the VIGIL Observatory Proprietary Licence →</a></p>
    </div></ReferenceSection>
  </article></div></main></Shell>;
}
