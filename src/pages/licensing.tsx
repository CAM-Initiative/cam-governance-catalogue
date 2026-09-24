import { type ReactNode, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Shell } from "@/components/layout/Shell";

const citation = "O’Rourke, M. V. (2026). VIGIL Observatory. CAM Initiative. https://cam-initiative.org";

function ReferenceSection({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: string; children: ReactNode }) {
  return <section className="public-reference-section"><header className="public-reference-section-heading"><span>{number}</span><div><p>{eyebrow}</p><h2>{title}</h2></div></header><div className="public-reference-section-body">{children}</div></section>;
}

function CopyCitation() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return <button className="vigil-about-copy" type="button" onClick={copy} aria-label="Copy VIGIL Observatory citation">
    {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    {copied ? "Copied" : "Copy citation"}
  </button>;
}

export default function Licensing() {
  return <Shell><main className="public-reference-page public-reference-page--single-document"><div className="public-reference-layout container mx-auto px-4 py-8 sm:px-6 md:px-10 md:py-11"><article className="public-reference-document public-reference-document--single">
    <header className="public-reference-hero"><p className="public-reference-kicker">CAM Initiative</p><h1>Copyright & Licence</h1><p>Public access supports inspection, citation, research reference and public-interest discussion. It does not make VIGIL Observatory or other CAM Initiative materials open-licensed.</p><p className="public-reference-meta">© 2026 CAM Initiative. All rights reserved.</p></header>

    <ReferenceSection number="01" eyebrow="Ownership" title="Publisher, author and licensor"><div className="public-reference-list">
      <article><div><p>Publisher / licensor</p><h3>Phoenix Covenant Pty Ltd trading as CAM Initiative</h3></div><p>Copyright ownership and licensing authority for VIGIL Observatory and other CAM Initiative materials sit with the company to the extent those rights subsist.</p></article>
      <article><div><p>Author / maintainer</p><h3>Dr Michelle O&apos;Rourke</h3></div><p>Authorship and scholarly citation remain attributed to Dr Michelle O&apos;Rourke where appropriate. Corporate copyright ownership does not replace author attribution.</p></article>
    </div></ReferenceSection>

    <ReferenceSection number="02" eyebrow="VIGIL Observatory" title="Publicly inspectable proprietary governance material"><div className="public-reference-reading">
      <p>The VIGIL Observatory Alignment Taxonomy, Incident records, taxonomy structures, Failure Families, Failure Classes, names, definitions, invariants, recognition criteria, classification boundaries, relationships, explanatory prose, schemas, indexes, structured arrangements, compilations and generated publications are proprietary VIGIL Observatory Materials where original rights are owned or controlled by CAM Initiative.</p>
      <p><strong>Citation, reference and linking are permitted and encouraged.</strong> Limited quotation is permitted to the extent allowed by applicable law. Citations should clearly attribute <strong>Dr Michelle O&apos;Rourke, CAM Initiative, VIGIL Observatory</strong> and, where relevant, identify the taxonomy version, Incident or record ID and canonical URL.</p>
      <p>Public access does not grant permission to reproduce substantial parts of VIGIL Observatory, redistribute or republish it, adapt or translate it, create derivative works, systematically extract or reconstruct the corpus, incorporate it into another taxonomy, framework, product, dataset, API or service, or otherwise make substantive commercial or non-commercial reuse without prior written permission.</p>
      <p>Use of VIGIL Observatory Materials for machine-learning training, fine-tuning, evaluation, benchmarking, retrieval or RAG systems, dataset construction, synthetic-data generation, automated classification, or AI-system development or improvement requires prior written permission.</p>
      <p>No licence is granted by implication, estoppel, public availability, website access or repository access. These restrictions apply only to rights owned or controlled by CAM Initiative and do not limit fair dealing, fair use or other non-waivable legal exceptions.</p>
    </div></ReferenceSection>

    <ReferenceSection number="03" eyebrow="Licence instrument" title="VIGIL Observatory Proprietary Licence"><div className="public-reference-reading">
      <p>The <strong>VIGIL Observatory Proprietary Licence</strong> is the controlling licence instrument for VIGIL Observatory Materials.</p>
      <p>The CAM Initiative website repository does not maintain a separate website or interface licence. Its <code>LICENSE.md</code> is intentionally a pointer to the VIGIL Observatory licence and does not grant additional permissions.</p>
      <p>Website source code, interface assets and other CAM Initiative materials outside the scope of the VIGIL Observatory Proprietary Licence remain all rights reserved unless a specific notice expressly states otherwise.</p>
      <p><a href="https://github.com/CAM-Initiative/Vigil/blob/main/LICENSE.md" target="_blank" rel="noreferrer">Read the VIGIL Observatory Proprietary Licence →</a></p>
    </div></ReferenceSection>

    <ReferenceSection number="04" eyebrow="Third-party sources" title="Source material keeps its own rights"><div className="public-reference-reading">
      <p>VIGIL Observatory references third-party articles, papers, standards, government publications, provider material, screenshots, platform outputs and other evidence. Those materials remain subject to the rights and licence terms of their respective owners.</p>
      <p>A VIGIL Observatory citation or evidence link does not transfer third-party rights to CAM Initiative and does not grant permission to reproduce the underlying source.</p>
    </div></ReferenceSection>

    <ReferenceSection number="05" eyebrow="Permissions" title="Licence enquiries"><div className="public-reference-reading">
      <p>For commercial use, substantive reuse, model-training or evaluation use, bulk extraction, paid integration, derivative taxonomy work, sublicensing or other permissions beyond public access, citation and reference, contact <a href="mailto:research@cam-initiative.org">research@cam-initiative.org</a>.</p>
      <p>The linked VIGIL Observatory Proprietary Licence is controlling for VIGIL Observatory Materials. This page is a public-facing summary and does not create a separate licence or expand the permissions in that instrument.</p>
    </div></ReferenceSection>

    <ReferenceSection number="06" eyebrow="Citation" title="Suggested general citation"><div className="public-reference-reading">
      <div className="vigil-about-citation-card">
        <div><p>{citation}</p></div>
        <CopyCitation />
      </div>
      <p>For a specific Incident or taxonomy entry, identify the relevant VIGIL Observatory record ID or taxonomy version and use the canonical URL. Citation, reference and linking are permitted; substantive reuse is governed by the applicable licence.</p>
    </div></ReferenceSection>
  </article></div></main></Shell>;
}
