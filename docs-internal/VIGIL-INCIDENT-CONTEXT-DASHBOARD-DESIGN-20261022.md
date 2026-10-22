# VIGIL Case Files — Incident Context and relational globe design
**Design baseline:** 22 October 2026 · **Status:** implementation-ready design, NOT implemented or approved for merge
**Catalogue branch:** `feat/vigil-case-files-dashboard-20261022`
**Canonical VIGIL branch:** `agent/incident-ecosystem-ingestion`
**Authority:** VIGIL `vigil/VIGIL.Schema.json` `incident_context_rules`; `vigil/docs/maintenance/INCIDENT-CONTEXT-GATE1.md`. The canonical Incident is the only semantic source of truth.

## 1. Visual and narrative goal

Turn the Case Files landing into a research-intelligence dashboard with a realistic, draggable 3D globe that answers **which jurisdictional *relationship* has been documented**, not "where every AI incident happened." Underlying records must drive every number. The Case File detail's Stage 01 becomes the legible explanation of *what technology operated, in what environment, who was involved, and why particular jurisdictions matter*. The design preserves all existing case stages and source-linked provenance.

No synthetic statistics, fabricated geographic coordinates, inferred country from provider headquarters, claimed regulatory applicability, or generic "affected person" without evidence.

### 1A. Case Files landing (desktop, conceptual wireframe)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ VIGIL Observatory  /  Case Files · research-intelligence dashboard          │
│ [CASE COUNT] [HIGH/CRITICAL] [EVIDENCED FAILURE]  (existing overview)       │
├─────────────────────────────────────┬───────────────────────────────────────┤
│ CASE LIBRARY                        │ JURISDICTION INTELLIGENCE             │
│ [Search] [Classification] [Severity]│ Relationship                            │
│                                     │ [All] [Occurrence] [Affected services]  │
│ [Active-filters: ... ×] [Clear]     │ [Institutions] [Population]             │
│                                     │ [Provider / Operator] [Infrastructure] │
│ [ID | Case | Severity | Class ...]  │ [Regulatory context]                    │
│ [ ... filtered canonical records ]  │ Geographic scope                       │
│                                     │ [All] [Single] [Multi / Cross-border]   │
│                                     │ [Global] [Unresolved / Not established]│
│                                     │ Country [All countries ▼]              │
│                                     │        ◉ PHOTO-REALISTIC 3D EARTH      │
│                                     │ Source-backed case counts / legend    │
│                                     ├───────────────────────────────────────┤
│                                     │ HARM SEVERITY · interactive doughnut   │
│                                     ├───────────────────────────────────────┤
│                                     │ MOST FREQUENT FIDELITY CLASS FAILURES  │
│                                     ├───────────────────────────────────────┤
│                                     │ Advertising, visually distinct         │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

Preserve the current approved navy/cyan panel identity, legible black case-list typography, compact role chips and yellow risk/severity chip contrast. Avoid inventing new chart data. Retain existing ad rail on OPENED Case Files; on the landing place eligible advertising below the right-hand insight panels, not floating over the globe.

### 1B. Stage 01 opened Case File (conceptual wireframe)

```text
01 INCIDENT
  What happened                                (existing narrative and artefacts)
  INCIDENT CONTEXT                             (new title; replaces 'Affected systems')
    Systems & Technology                       (existing system_context projection)
    Operational Environment                    (existing occurrence_environment / agent_context)
    Affected Parties & Institutions            (new structured entities)
    Geographic & Jurisdictional Context        (new source-linked relationships)
    Regulatory Context                         (potential surfaces, not Section 04 findings)
  Supporting evidence                          (existing source cards and provenance)
02 INCIDENT BREAKDOWN                         (unchanged)
03 CLASSIFICATION                              (unchanged)
04 COMPLIANCE                                  (unchanged authoritative assessments)
05 DISCUSSION / CONCLUSION                     (preserve current implemented sections)
```

These are five **subsections** under the current Stage 01, NOT five new Case File stages. Do not truncate the "What happened" narrative, overwrite artefact placements, or re-interpret Section 04 findings.

## 2. Exact field-to-screen mapping

| Stage 01 subsection | Canonical fields | Display contract |
| --- | --- | --- |
| Systems & Technology | `system_context.platform_or_vendor`, `product_or_service`, `specific_model_or_runtime`, `interface_surface`, `component_role` | Existing source-grounded provider, product, model, interface and architecture. Do not duplicate provider location or institution role from a product label. |
| Operational Environment | `system_context.agent_context`, `occurrence_environment` | Preserve deployment state, activity contexts, external reach, actor, agent configuration/count and evidentiary limits; where the existing legacy fallback is needed, retain its labels. |
| Affected Parties & Institutions | `affected_party_context.entities[]` | One entity card/row each, grouped by semantic role rather than implied harm. Show name, kind, role(s), evidence state, short basis and clickable `source_record_refs`; source refs must point to the corresponding Stage 01 evidence/reference entry. |
| Geographic & Jurisdictional Context | `jurisdictional_context.normalized_geography` plus **retained** legacy `primary_jurisdiction`, `secondary_jurisdictions`, `cross_border_relevance` | Show scope with its correct interpretation, then source-linked role cards. Each has relationship role, one or more named country/subdivision locations, party refs if any, evidence state, basis and evidence links. If no reviewed structure, show **'Not yet structurally assessed'**, legacy raw text if available, and distinguish this from 'not established by evidence'. |
| Regulatory Context | Existing `jurisdictional_context.regulatory_surface` and only geography relations with role `regulatory-context` | Label as *Potential regulatory context* / *Candidate governance surface*. Link to Stage 04 where there is an admitted assessment; never synthesize applicability, compliance status, jurisdiction of law, or certification from geographic presence. |

### 2A. Readable hierarchy

Use a bordered outer `Incident Context` section with five vertically stacked subsections and modest dividers. Desktop: selected fields may use 2-column definition grids inside each subsection, but NEVER split a single lengthy evidence basis across columns. Mobile: single column, body text ≥ readable baseline, no horizontally clipped case field or status text. Long evidence basis remains visible and wraps. Source evidence links must be real anchors, not decorative citations.

Recommended elements: heading + one-line explanatory caption; small muted role badge; black/neutral body text and understated evidence-state label; subdued disclosure affordance for provenance details. Keep source evidence uncertainty in text; do not encode epistemic status using colour alone. Reuse existing Site variables, `vigil-case-field`, and responsive breakpoints rather than introducing a visually unrelated dashboard component library.

### 2B. Empty and difficult cases

- Legacy Incident with only raw geography: show *Legacy jurisdiction description — not yet reviewed for geographic roles*; do not display it as an evidenced event location.
- Canonical `normalized_geography.scope: global` with zero relations: show *Global scope recorded; no country-specific geographic relationship established.*
- `cross-border` with 2+ roles: show each evidenced relationship separately. Do not invent a country-to-country arrow; show arcs only for separately evidenced **directional** relationships, which are not presently in the schema.
- `unresolved`: display *Location not established* (or fuller source-specific limitation) without map pin.
- Disputed/attributed relation: show its evidence label inline and link citations; do not silently merge with "supported."
- Party role `provider` or `operator`: display under Parties even if nobody is confirmed harmed.
- `non-geographic` training/evaluation: label explicitly; do not imply missing authoring.

## 3. 3D globe and facet behaviour

**Keep** the approved satellite-textured Three.js Earth and 2D fallback in `src/components/vigil/EarthGlobe3D.tsx`. Implement the chips as **two independent dimensions**, not a mixed single strip:

**Row 1: Relationship role** (single-selection v1, in this order):
- All relationships (default).
- Occurrence → `occurrence-location`.
- Affected services → `affected-service-jurisdiction`.
- Affected institutions → `affected-organization-jurisdiction`.
- Affected populations → `affected-population-jurisdiction`.
- Provider / operator → `provider-location` or `operator-location`.
- Infrastructure → `infrastructure-location`.
- Regulatory context → `regulatory-context`.
- Other → `other` only if there are reviewed such relations.

**Row 2: Scope / uncertainty** (single-selection v1): All scopes (default), Single jurisdiction, Multiple / cross-border, Global, Not established / unresolved, Non-geographic. These filter CASES by canonical normalized scope; they are *not* alternative role types. Users should be able to select any scope while role filtering is active. Display unpinned cases in a contextual list/count below the Earth; selecting them filters the Case File list, not a fake ocean pin.

**Country selection:** a distinct selector + clickable globe pins. A country's pin is a *representative country-centroid anchor* and its tooltip explicitly says *Jurisdiction relationship — not incident location*. For subdivision associations do not show false point coordinates; optionally zoom/highlight a country until grounded region geometries are available. No provider HQ inference, place-name-only geocoding, unverified GPS, or globe pin if the only known relationship is unresolved.

**Interaction contract:**
1. Selecting role, scope, country, severity, classification, text search, or Fidelity Class filters the SAME canonical Incident-ID set. Apply AND across dimensions; each role filter is OR within mapped roles (e.g., provider OR operator).
2. Pin count is **distinct Incident IDs with at least one matching country relationship**, not source citations, relation count, persons harmed, or total mentions. An Incident with two relevant countries appears once in each country but only once in the filtered Case File list; therefore the **sum of country pin counts may exceed the total unique-case count** and must be labelled.
3. A region match must honor selected role and evidence-state policy. Proposed initial policy: display supported/attributed/disputed source-linked geographic relations, with the evidence state visible and optional evidence-state facet later; unresolved geographic relations get no pin.
4. Counts on **All relationships** deduplicate by Incident and country; multiple roles for the same Incident-country pair are not double counted. Tooltip can expand to show distinct role labels without extra case count.
5. Non-map cases (global, unknown, not yet migrated) remain findable in table, but are never substituted with arbitrary marker position. Distinguish *not yet reviewed* from evidence-*not established*.
6. State sync must be centrally managed in the Case Files page, not duplicated between `VigilCasesDashboard.tsx` and `vigil-cases.tsx`. Reset pagination on facet change; clearing filters resets role, scope and country selections. Preserve existing severity doughnut and failure-ranking behaviour; facet counts should consistently respond to cross-filters.
7. No data from VIGIL `agent/...` preview branch may silently cross-contaminate public `main` website index. Compare `record_version` (and ideally SHA/index provenance) when joining source files; report mismatches as *not yet synchronized*.
8. Responsive: right rail desktop; below list or summary for tablet/mobile; chips wrap; keyboard operable pins via mirrored country list and accessible labels; reduced-motion and 2D fallback preserved.

### 3A. Meaningful visual hierarchy

At globe panel header: **Jurisdiction intelligence** with a non-interactive one-line subtitle *Explore where incident relationships are evidenced.* Below: role chips first, scope chips second, country selector, Earth, three small metrics **Unique matching cases**, **Countries represented**, **Unmapped / pending**. Below globe: first 5 countries by unique cases and link to Show all. The donut remains below and is **Harm severity** (not a second classification). Most frequent failure classes remain at the bottom, before the ad area.

Keep the existing blue atmospheric globe appearance; enough negative space for a premium demo, but not at expense of geographic limitations or the Case File list. Tooltips use grounded text.

## 4. Public data delivery design (must be implemented with migration)

1. VIGIL's canonical `vigil/records/incidents/VIGIL-INC-NNNNNN.json` contains review-backed `affected_party_context.entities[]` and `jurisdictional_context.normalized_geography`.
2. Extend canonical builder `vigil/scripts/build-vigil-jurisdiction-index.py` to **project canonical reviewed roles** in an additive versioned structure. Retain the existing text-derived fields for compatibility but never mislabel lexical aliases as reviewed assertions. Recommended v2 projection entry:
```json
{
  "incident_id": "VIGIL-INC-000187",
  "record_version": "the-record-current-version",
  "projection_status": "reviewed-canonical",
  "scope": "cross-border",
  "relations": [{
    "relationship_id": "GEO-001",
    "role": "affected-service-jurisdiction",
    "evidence_state": "attributed",
    "locations": [{"country_code": "AU", "subdivision_code": "AU-NSW"}],
    "party_refs": ["PARTY-001"],
    "source_record_refs": ["source_records[0]"]
  }]
}
```
The above is a **shape example only**, not an adjudicated content claim or actual record version.
3. Gate the new projection against canonical Incident IDs, source refs and version consistency. Do not silently fall back from an explicit canonical v2 "unresolved" relation to a guess from older free text. A single v1 string cannot substitute for many-to-many role information.
4. Catalogue builds a same-source branch-aware *public* geo index at `docs/data/vigil-dashboard-jurisdictions.json` or a parallel versioned file. The current `scripts/sync-vigil-dashboard-jurisdictions.mjs` is primary-text-only: replace/extend it to sync **VIGIL's published canonical jurisdiction index**, not to scrape hundreds of individual Incident files for a second independent geography taxonomy. Retain v1 fallback only for explicit compatibility and label it as **legacy text-derived**.
5. Join by canonical Incident `id` and record version; never mix branch refs. Tests must fail on stale/incompatible v2 projection rather than silently displaying incorrect provenance.
6. The 3D scene accepts **only** a prepared array of grounded country anchors and role-aware counts; all role/scope filtering and aggregation belongs in a pure tested selector module. Geometry is illustrative; user actions update case list state.

## 5. Implementation ownership — exact touch points

**VIGIL** on `agent/incident-ecosystem-ingestion`:
- `vigil/VIGIL.Schema.json` and `vigil/scripts/incident_context_validation.py`: already Gate 1 implemented; amend only after additional approval if migration exposes a genuine coverage gap.
- `vigil/scripts/build-vigil-jurisdiction-index.py` and `vigil/VIGIL.Incidents.Jurisdictions.Index.json`: future reviewed-role projection and tests after Gate 2.
- `vigil/records/incidents/*.json`: future Gate 2 evidence-reviewed migration, preserve all prior structures.
- Maintainers, template, audit and PR #155: retain gate records, no competing branch or unauthorized merge.

**Catalogue** on `feat/vigil-case-files-dashboard-20261022`:
- `src/pages/vigil-case-file.tsx`: rename existing affected-systems section, compose five subcomponents (can factor new `src/components/vigil/IncidentContextSection.tsx`).
- `src/lib/vigilAffectedSystems.ts`: reuse existing system/environment projection, do not backfill geography or party names here.
- `src/pages/vigil-cases.tsx`: own all facets and pagination, same Incident-ID set.
- `src/components/vigil/VigilCasesDashboard.tsx`: role chips, scope chips, country selector, provenance-aware metrics. Do not create a different globe on a new branch.
- `src/components/vigil/EarthGlobe3D.tsx`: retain 3D Earth, country markers and fallback, differentiate only semantic tooltips.
- `scripts/sync-vigil-dashboard-jurisdictions.mjs`: consume VIGIL canonical geo projection once published on a trusted same-branch source.
- Case File PDF/static/print path: preserve relevant metadata and references, no silent omissions; compare static and interactive renderers.
- `src/components/vigil/VigilCasesDashboard.css`, `src/vigil-case-file-dossier.css` and any existing style layers: responsive refinements, no global regression.

## 6. Acceptance tests (required for demo readiness)

- Canonical fixture with US provider, Australian affected service and unknown occurrence location: clicking Affected services shows Australia; Provider shows US; Occurrence shows no pins; role counts and list stay aligned.
- Multi-country one Incident: two valid country pins each show count 1; case-library unique count stays 1; no fabricated movement arc.
- Global / not established / non-geographic scopes: no arbitrary pins; explicit scope chips continue to select the cases; distinguish not-yet-migrated records.
- Same Incident and country with two relationship roles: country All-role count is 1, not 2.
- Disputed/attributed evidence: inline label in Section 01 and source-link navigation; no settled-fact presentation; test unresolved with no coordinates.
- Empty legacy Incident: original system/environment and raw primary jurisdiction remain visible with clear *legacy/not yet reviewed* label; do not blank content or imply new validation verdict.
- Cross-filtering, clear/reset, URL refresh as supported, pagination, severity doughnut, FC ranking and accessible mobile table still work. Unavailable geography never blocks the Case Files list.
- Accessible keyboard country selection, dark-mode contrast, drag rotation and reduced-motion 2D fallback.
- Static/PDF case render retains Incident Context subheadings and source references. Printed geography never suggests an incident coordinate.
- Both GitHub CI pipelines green on exact branch heads; preview visually checked on desktop and mobile before any merge.

## 7. Separately gated work sequence

**Design completed here** means the intended layout and interaction contract are specified, not built. **Gate 1** canonical schema/validator already committed. **Gate 2**: perform a source-first representative pilot, present record-local before/after proposals, and stop for human approval before bulk edits. After approved migration, wire role-aware projection and the site. No one should treat a draft PR or a green structural validator as evidence that all 200 Incidents were source-adjudicated.
