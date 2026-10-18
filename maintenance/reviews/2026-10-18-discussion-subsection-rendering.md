# Discussion subsection rendering — 18 October 2026

Requested follow-up on existing branch `fix/conclusion-reading-paragraphs-20261018` and PR 158. No new canonical VIGIL field or schema contract is introduced.

The existing `significance_to_cam` string can carry an explicitly separated `Discussion — …` heading, followed by blank-line-separated prose. The shared presentation helper recognises only that standalone, colon-free heading convention. Inline `Discussion — …: body` text, quotations and ordinary colons remain prose. Existing sentence-preserving paragraph grouping remains unchanged.

Interactive Case Files, deterministic print reports and crawlable static HTML now render the heading as an h4 below Governance significance. Text remains escaped in static output. The heading has normal wrapping and a print break-after constraint; body text retains the existing reading paragraphs.

INC-129's public wording and canonical subsection boundary are updated separately in Vigil commit `81670d998e10197040712ffc4b28232dc88effd6`. The historical taxonomy versions, steward attribution, unverified hypothesis, experiment proposal and source limitations remain substantive content. Temporary release/branch narration is removed.

Checks: all 148 website tests pass, including heading recognition, ordinary-prose negative cases, full text/order preservation, escaping and shared interactive/print/static wiring. A one-off check with the revised actual INC-129 string yields one semantic heading and 13 reading paragraphs, with all text preserved. Vite build, static export, docs publication guard, palette, catalogue and registry validation pass. The generated /docs tree is included. The build retains configured main data (189 Incidents); it does not silently publish ingestion-branch data or change preview-source selection.

A screenshot smoke check was attempted but the local Playwright browser executable was unavailable and its browser download failed. No visual-browser verification is claimed. Markup, shared renderer behaviour and compiled assets are verified by the tests/build above.

No merge or deployment is performed.
