# Compliance icons and Recognition criteria discussion — 18 October 2026

Scope: existing `fix/conclusion-reading-paragraphs-20261018` branch and PR 158. Preserve the concurrent docs rebuild at d74d4882. Do not change Recognition criteria behaviour without a separate presentation decision.

## Implemented icons

Sections 03 and 04 now import the same `AlignmentIcon` component and use the existing Lucide Check, X and CircleMinus symbols. Compliance maps Aligned to the check, Not aligned to the cross, Boundary to the circle-minus. Result labels remain visible and independent from taxonomy polarity. Icon SVGs are decorative (`aria-hidden`) because the result text supplies the accessible meaning. Existing colour treatments remain.

The interactive compliance component is also used by the print report. The static publisher renders the same component through React's static renderer, rather than maintaining a second hand-drawn icon set. No requirement outcome, evidence text, taxonomy mapping or source-selection setting is changed. Regenerated /docs assets and pages are included.

Validation: all 149 website tests pass; shared-kind mapping, exact icon markup parity, all three results and static evidence preservation are covered. Vite build, static export, docs-publication, palette, catalogue and registry checks pass. No browser screenshot verification is claimed.

## Recognition criteria: current behaviour, not changed

`CaseTaxonomyClassification.tsx` resolves the Incident's class ID through `loadFailureTaxonomy()` from `vigilFailureTaxonomy.ts`. That loader reads the current taxonomy from Vigil/main. The table selects `success_recognition.required_conditions` for a successful-invariant role; all other roles, including ambiguous-boundary, select failure-recognition conditions (with a legacy recognition fallback).

The displayed list is shared class reference material. The website does not generate an independent occurrence adjudication or prove that each displayed condition was satisfied. The primary table does not display the mapping's stored `classification_basis` in place of that list. Occurrence-specific reasons are stored in the Incident's mapping basis and source-clause relationship rationales; the latter appear in Section 02. Confidence is not a substitute for those reasons. Loading main also does not reconstruct the criteria used at the Incident's adjudication version.

## Proposal for discussion only

Show occurrence-specific reasoning first: what the preserved source episode demonstrates, why the mapped invariant is engaged and which decisive fact remains missing for Boundary. Link that reasoning to its source episode rather than inventing a source event for each condition. Keep shared taxonomy conditions in a clearly labelled reference disclosure. Boundary must not imply that failure conditions are all met, or automatically display an Aligned counterpart when failure is not established.

Use the taxonomy version actually used for adjudication where a governed version/snapshot can be resolved. If exact wording cannot be reconstructed, disclose that limit rather than pretending current main is the historical snapshot. The current aggregate mapping basis is not a structured condition-by-condition evidence map; the renderer must not manufacture such a map. Any canonical schema or snapshot-resolution control requires its own concrete design and approval.

No label changes, criterion rewrites, new Incident fields, taxonomy snapshot system or new automatic classification rule are implemented in this work.
