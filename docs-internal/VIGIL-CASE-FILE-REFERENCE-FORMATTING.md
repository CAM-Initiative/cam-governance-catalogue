# Case File reference formatting — public website contract

Applies to VIGIL Observatory Case Files, including the full report/print view.

## Presentation rule

- **Show a reference as a linked bracketed number**: `[1]`, `[2]`, etc. Do not prefix the number with an extra “Evidence”, “Source”, “Source [1]”, or a separate source-label row.
- **Place the citation immediately after the claim, finding or evidence-based descriptive text** that it supports, in the same paragraph, field value, or assessment cell. Follow the existing Section **02 Assessment** harm-assessment reference convention.
- **Resolve reference numbers through the canonical Case File bibliography**, not directly from the `source_records[n]` array index. The link target is `#vigil-evidence-reference-N` in **06 References**.
- **Deduplicate identical bibliography references within a single attribution location**. Agent configuration and Operational Environment can cite the same source; do not print identical citation-only rows.
- **Do not fabricate reference numbers or outbound links.** If a source-record pointer is not resolvable to a published bibliography entry, display a plainly labelled unlinked fallback, retaining the pointer as a tooltip for maintainers.
- **Maintain semantic link labels and keyboard focus affordances**: the visible text stays `[N]`, while the accessible label identifies the evidence reference.
- **Keep evidence limitations in Section 06**, following the established Case File limitation policy; where those statements cite evidence, use the same compact inline `[N]` reference convention.
- **Preserve identical behaviour in the print/PDF renderer**, by reusing the same reference component wherever possible.

### Implementation and enforcement

- `src/components/vigil/IncidentContextSection.tsx` owns `SourceCitations` for Section 01 and the context limitations in Section 06.
- `src/components/vigil/HarmImpactMatrix.tsx` provides the Section 02 reference precedent (`vigil-harm-inline-references`).
- `src/vigil-case-file-dossier.css` defines the inline citation presentation (`vigil-context-citations`).
- `scripts/test-vigil-incident-context.mjs` checks link destinations, labels, one-per-source deduplication, non-invented links, and report parity.

This is a **presentation contract**, not a mutation to any canonical VIGIL source record.
