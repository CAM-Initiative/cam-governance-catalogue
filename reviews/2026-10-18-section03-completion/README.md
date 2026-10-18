# Section 03 classification completion — 18 October 2026

Review-ready implementation, with three explicitly held canonical mappings tracked separately. No PR, merge to main or deployment performed.

## Scope and branch continuity

Website: `work/section03-evidence-classification-reasoning-20261018`, baseline `55706ee398f2e9c9c75723ea49f49f4e88eeef2f`. At live fetch it was five commits ahead of and one behind `main` (`e41529cbb08d80237f0a9a1509051b754fd7aa8e`). Reconcile that main commit as an additional merge parent. Unique existing basis/reference/version work is preserved. Generated `/docs` conflicts are resolved by rebuilding, not choosing one stale generated side.

Canonical: `work/incident-taxonomy-reasoning-readjudication-20261018`. Baseline `42b631d` already contained its `main` (`290b8d8`). Published basis batches: `177ea2e883aab56f2c896c78e20688c4a77bdec6`, `31c377a54a1b136e999db8f2cb656ea64b23d4f1`, `85afdd443d6078b2ed2fb7e670204060fb20b8dc`. Audit/generated-output head: `032f8a2087a41e35451466e28161842c63433349`. Full audit: `vigil/docs/reviews/2026-10-18-section03-completion/` in Vigil.

Direct Git writes could not authenticate. Publish through the selected GitHub connector, using existing heads as parents and guarded non-forced updates. Preserve the website main commit as the second parent. No competing branch or PR is required.

## Presentation

- Preserve the existing mapping-local `classification_basis` display, class meaning/immutable ID, confidence and recorded-versus-current taxonomy versions.
- Reference conditions/exclusions remain in an explicitly labelled disclosure. Boundary rows show both sides as reference, never as occurrence proof.
- Match supporting episodes only by exact `class_id` and `canonical_taxonomy_mapping: true`. Preserve each episode's actual role/rationale, including earlier failure and later success for the same class. Resolve original sources only from valid `source_record_refs`; disclose missing links.
- Episode links open the interactive Assessment tab, then scroll and focus the original episode. Stable anchors survive statement projections, without assigning a new canonical episode or moving source evidence.
- Desktop table fits its container; at 390px mappings stack into labelled rows. Native disclosures work with keyboard focus.
- Deterministic and printable reports use the same mapping bases. Print shows compact episode references into Section 02, avoiding duplication of all episode analysis. Outcome words and four-column headers retain legible print widths.
- Static Case Files now include actual Section 03 bases, outcome, confidence, class meaning, versions and episode access, rather than identity metadata alone.

No canonical schema field, taxonomy, semantic validator, HIM or external-requirement result changed. Mapping outcome machine values and admitted classifications remain unchanged.

## Canonical explanation inventory

194 records, 458 actual mappings: 441 satisfactory and unchanged, 14 improved across 11 Incidents, three held unchanged. No empty mapping bases. 456 mappings have explicit admitted episode relationships; two do not. Full before/after text and reproducible inventory are in the canonical audit.

Examples: INC-003's mapping basis now includes the later credential-notification disposition alongside earlier signal-delivery failures. INC-154 now identifies the false board's purported directors and displaced approval authority. INC-190/191 no longer share an identical generic explanation: the Canadian divorce-record probes and US school-statistics request sequence have separate factual scope and limits.

Held: [Vigil #138](https://github.com/CAM-Initiative/Vigil/issues/138) for missing episode relationships on INC-197/FC-086 and INC-198/FC-087; [Vigil #139](https://github.com/CAM-Initiative/Vigil/issues/139) for INC-194's missing decisive independent-choice/disengagement condition. These require bounded substantive review, not a prose-only invented repair.

INC-129's current disputed record has six Boundary mappings. Do not test against its obsolete mixed-role configuration. Mixed roles remain exercised through INC-001/003/004; INC-126 retains its current single successful-invariant mapping.

## Actual verification

- `pnpm test:vigil`: 149 tests passed, including mapping-local basis/reference/version contracts and new admitted-relationship, source-ref, legacy-no-ID and mixed-episode fixtures.
- `pnpm build`: passed; rebuilt `/docs`, 194 static Case Files, 95 taxonomy entrypoints and sitemap. Existing bundle-size warning remains.
- `python scripts/validate-docs-published-output.py`: passed.
- `browser-acceptance.cjs`: 23 checks passed in packaged Chromium 153, zero page errors. Eleven interactive Cases (001/002/003/004/006/126/129/139/144/197/198), nine deterministic/print report Cases, actual episode navigation/focus, 390px responsive layout, and A4 PDF generation. Every rendered mapping basis was compared to the exact supplied canonical value. Reference disclosures, Boundary outcomes, confidence and recorded-version distinctions were checked. INC-139 covers partial unclassified/no mapping; INC-144 covers complete unclassified/no mapping.
- Inspected actual desktop Boundary, mobile and print screenshots; rendered and visually inspected physical PDF pages with Poppler. Corrected a discovered hidden-tab anchor problem and print word splitting. Final INC-003 test PDF: 77 A4 pages including the complete evidence and external-requirement content; print classification uses compact episode pointers.
- `static-acceptance.py`: 194 generated pages, all 465 `main` mapping bases present, zero broken episode anchors. This reads the actual built HTML, not source strings.
- Canonical validators passed and full canonical unittest discovery passed 280 tests; taxonomy validator passed 16 families / 79 classes. Exact basis-only JSON preservation check passed for all 11 edited records.

The normal publication build retains configured production `main` source selection. That source currently has 465 mappings. Browser acceptance substitutes this adjudication branch's exact 458-mapping working tree through request fixtures; it does not deploy or promote unmerged canonical records. This distinction is deliberate and is recorded rather than silently publishing feature-branch data as production. Preview source configuration remains available.

Local browser tests blocked unavailable external decorative images and Google fonts, using fallback fonts. They do not verify those remote assets or a deployed website. Static checks compare against canonical `origin/main`, pinned at `290b8d8` during this run. The audit records explanation quality, not a fresh full-corpus taxonomy certification.

## Reproduction and artefacts

`browser-acceptance.cjs` and `static-acceptance.py` are bounded one-off acceptance audits, not permanent semantic CI gates. Run from the website repository with `SECTION03_CANONICAL_ROOT` set to the adjudication checkout. Browser checks need Playwright and `SECTION03_CHROMIUM` pointing to a compatible executable. JSON results are committed beside this note. Temporary screenshots/PDF were inspected locally and are not source evidence or canonical incident media.

Artefact classes: source/components/tests = LIVE; `/docs` = GENERATED; this review directory = AUDIT. No new runtime authority.
