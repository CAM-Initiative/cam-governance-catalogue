# VIGIL Case Files — jurisdiction normalization review (22 October 2026)

## Purpose
Determine whether the new jurisdiction globe requires edits to canonical VIGIL records, and specify a bounded, source-first normalization contract. This is an internal engineering review, not visitor-facing Case File copy or legal applicability adjudication.

## Corpus audit snapshot
Source: the feature branch's `docs/data/vigil-dashboard-jurisdictions.json`, projected strictly from each canonical Incident's `jurisdictional_context.primary_jurisdiction`. **194** canonical Incident IDs were present. Counts are mutually exclusive based on the literal primary-jurisdiction text, *not* a determination of legal jurisdiction, place of harm, or physical location:

| Existing primary field | Case files |
| --- | ---: |
| Country, locality, region, or a mixed national/local description | 98 |
| Global / international descriptor | 35 |
| Cross-border descriptor as primary scope | 18 |
| Not established / unknown / non-geographic controlled exercise | 36 |
| Empty or missing | 7 |
| **Total** | **194** |

The 98 descriptive entries are not 98 independently verified single-country locations. Examples of mixed role strings include `United States / Canada`, `Singapore / Norway`, and `United States / Singapore / China-linked entities`. Locality-qualified strings include `New Jersey, United States` and `Perth, Western Australia, Australia`. `INC-187` records Australia as primary and New South Wales as secondary, which is valuable information that a one-string projection currently misses.

Many records have `secondary_jurisdictions`, `cross_border_relevance`, and other interpretive context which cannot be faithfully represented by a primary string alone. The generated incident index's `search_terms` is **not** admissible for locating cases.

## Finding
**Yes — a separate transformation/normalization pass is warranted.** There is no requirement to rewrite existing canonical `primary_jurisdiction` or historical narrative to show an initial Earth globe. The current dashboard produces an explicit, conservative primary-jurisdiction projection and omits unresolved/multi-country single-country pins. This is appropriate as an initial demo, not the finished geography model.

The canonical corpus is presently richer than the public index, but its geographic descriptors are heterogeneous natural language. A deterministic transformation can reduce manual effort while preserving ambiguity.

## Recommended additive contract
Keep every original `jurisdictional_context` field. Propose an additive normalized representation, reviewed alongside VIGIL's schema and maintainer instructions:

- `scope`: `single-jurisdiction`, `multi-jurisdiction`, `global`, `not-established`, `non-geographic-simulation`; use named values, not null conflations.
- `places[]`: `country_code` (ISO 3166-1 alpha-2), optional `subdivision_code` (ISO 3166-2), the raw supporting jurisdiction string, and a **relation** such as `occurrence-location`, `affected-service-jurisdiction`, `affected-population`, `regulatory-surface`, `provider-location` or `source-location`. Do not collapse distinct relations.
- `evidence_refs[]`: links to existing canonical source records / evidence clauses establishing the jurisdiction and relationship, or explicit unresolved state. Do not derive a physical incident location from a vendor address, domain, institutional affiliation, press publisher, or dataset country.
- `derivation`: explicit source-supported mapping, context-limited mapping, or unresolved; retain original text and do not silently infer.
- Optional display centroid only in the **site projection**, labelled `representative geographic anchor`, never an incident coordinate.

Prior to implementation, check the VIGIL schema, canonical validation rules, index generator and coverage requirements. Determine which genuinely evidenced geographic roles should be standardized; human adjudicate cases that conflate service, victim, provider, regulator and event locations.

## Implementation steps and safeguards
1. Deterministically extract current primary and secondary jurisdiction fields, producing candidate ISO codes **without modifying the original Incident records**.
2. Categorize every entry as explicit single-country, explicit subnational, named multi-jurisdiction, global, unestablished or controlled simulation. Generate a review queue for ambiguous interpretations.
3. Review source references for *role*, not merely country-name string matching. Avoid assuming international applicability from global product availability.
4. Add controlled schema fields through a maintainer-approved additive contract; migrate explicit cases first. Retain unresolvable entries as such.
5. Add index projections and versioned regression tests. Globe pins/filters should use source-grounded structured codes. Ensure counts are clearly scoped: case count, not country-citation count or confirmed harmed person count.
6. No change to Fidelity Class taxonomy, harm severity or existing occurrence adjudications unless separately justified by new evidence.

## Current feature branch
- Rotatable WebGL Earth with satellite surface texture and a 2D fallback. Graphic is geographically illustrative, not a claim of incident geolocation.
- Conservative country matching refuses unestablished or explicitly compound country strings. It accepts explicit national or locality-qualified country names, and provides a clearly separate unmapped count.
- Preview-branch switching retains the existing guard against combining a selected VIGIL branch with a main-only geography projection.
- The browser requests a texture from a versioned third-party CDN. For a fully independent production deployment, mirror a properly licensed NASA Blue Marble equirectangular image into CAM-controlled static assets and retain an attribution.
