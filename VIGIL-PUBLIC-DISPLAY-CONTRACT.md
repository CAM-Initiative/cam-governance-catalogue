# VIGIL Observatory Public-Display Contract

Status: interface contract

Applies to: CAM Governance Interface / VIGIL Observatory

Authority boundary: CAELESTIS remains the authoritative governance corpus. VIGIL Observatory records evidence, findings, proposed changes, implemented repairs, and their verification; it does not create independent constitutional authority.

## Public vocabulary

Reader-facing surfaces MUST use **VIGIL Observatory Alignment Taxonomy** as the taxonomy name and **Classification** as the Case File stage. Alignment is evidence-relative to the governing invariant at a mapped governance boundary; it is not a claim of general model or system alignment.

Canonical **Failure Family** (`FF`) and **Failure Class** (`FC`) names and identifiers remain unchanged. Machine values such as `failure-occurrence`, `successful-invariant`, and `ambiguous-boundary` remain stable schema values and SHOULD NOT be exposed verbatim as ordinary reader-facing labels.

Public mapping outcomes are **Failure occurred**, **Invariant held**, and **Boundary unresolved**. Public Case File outcome language SHOULD use **Failure evidenced**, **Alignment exemplar / Invariant held**, and **Mixed alignment outcome** as applicable. Harm severity remains independent of alignment classification.

## Public reading path

Every public record MUST make the following information readily visible:

1. record ID and type;
2. plain-language title;
3. one-paragraph public finding;
4. the visible `Observation → Failure Mode → Proposal → PATCH` record chain;
5. lifecycle status;
6. first-observed, published, and last-updated dates where applicable;
7. relevant domains and systems;
8. a link to the complete canonical VIGIL Observatory JSON record.

The record chain MUST appear immediately after the public finding. Dates, domains, and system fields SHOULD use a compact metadata treatment rather than a dominant content panel. Relationship fields already represented by the record chain SHOULD NOT be repeated as a separate `Linked records` section.

Technical metadata, reviewer history, integrity hashes, extended analysis, rejected alternatives, and full lifecycle events MAY remain in the JSON or in a subordinate audit-details view.

## Record-type requirements


### Incident

The public view MUST display:

- the factual Incident `summary` as **What happened**;
- `vigil_assessment.factual_basis` as the evidence-supported factual account;
- Incident-level severity as substantive assessment, including `severity`, `assessment_status`, `materialised_consequence`, `affected_scope`, `seriousness_and_persistence`, `quantitative_information`, `evidentiary_limits`, `band_rationale`, and `assessed_on` where published;
- each source's claim-relative `evidence_status` and `evidence_status_basis` alongside its evidence metadata;
- each source's publication genre from `source_type`;
- the Alignment Taxonomy classification basis only within the Classification section; severity MUST NOT be presented as alignment classification.
- the classification role for each Alignment Taxonomy mapping where present. Mapping-local `classification_role` values on the primary or secondary classification take precedence; the existing `taxonomy_classification.classification_role` remains a backward-compatible fallback when a mapping-local role is absent. `failure-occurrence` MUST render as **Failure occurred** at mapping level and contributes to a **Failure evidenced** Case File outcome; `successful-invariant` MUST render as **Invariant held**, may receive the **Alignment exemplar** treatment, remains attached to the relevant Failure Class, and MUST NOT be presented as failure evidence or as a condition requiring Repair; `ambiguous-boundary` MUST render as **Boundary unresolved**, remain visible in Classification, and MUST NOT be presented as failure evidence or as a condition requiring Repair. A Case File containing mixed mapping roles MUST be presented after opening as a **Mixed alignment outcome**, using an informational mixed-record affordance rather than the exemplar tick; the public explanation MUST make clear that neither a single aligned nor misaligned label describes the whole occurrence when different boundaries have different evidential roles;

Migration notes, hand-off commentary, taxonomy workflow state and `taxonomy_classification.classification_basis` MUST NOT be substituted for the factual Incident summary.

`source_type` describes the publication or artefact genre, such as news article, technical report, incident-database entry, status report, investigation report, legal filing, social-media post, repository record or standards document. Publisher authority, hosting platform, evidence role, source residence, evidence modality and primary-artefact access are separate metadata and MUST NOT be collapsed into `source_type`.

### Incident

The public view MUST distinguish direct observation from interpretation and display:

- what was directly observed;
- system and observation context;
- observation date;
- evidence sources;
- source modality and public-access status;
- linked failure modes.

### Failure Mode

The public view MUST display:

- concise failure definition;
- triggering conditions;
- observed manifestations;
- governance significance;
- affected parties or interests;
- relevant CAELESTIS instrument, section, named heading, and relationship to the failure;
- whether the finding concerns a breach, ambiguity, omission, implementation failure, or another stated relationship;
- repair status and any implemented PATCH.

An absent corpus basis MUST be shown as an unresolved gap. It MUST NOT be silently omitted.

### Proposal

The public view MUST display:

- the problem being addressed;
- the proposed governance outcome;
- exact instruments and sections proposed for amendment;
- proposed wording where developed;
- decision status;
- any resulting PATCH.

Proposed wording MUST be visibly labelled **not yet binding**.

Where a proposal identifies an instrument but supplies no section-level action,
status, or meaningful relationship, the public view SHOULD display the instrument
bar without an empty detail table. A relationship value that merely repeats the
instrument identifier is redundant and MUST NOT be presented as substantive
section-level information.

### PATCH

The PATCH view MUST prioritise **Applied corpus repairs** before background narrative.

Each corpus amendment MUST provide:

- instrument ID and canonical file path or URL;
- section number and heading;
- action: added, amended, repealed, cross-reference repair, metadata repair, or another explicit action;
- complete final adopted wording, or complete wording removed for a repeal;
- previous wording where materially relevant;
- implementation date;
- verification status and verified corpus version or commit;
- current provision status;
- canonical CAELESTIS link;
- implementation record or pinned commit link where available.

Where a PATCH identifies more than one affected section in the same instrument, the
interface MUST group those sections beneath one instrument heading. Each affected
section remains a distinct row, but the instrument title, canonical source link,
implementation link, and canonical filepath MUST NOT be repeated for every row.
The public reading surface SHOULD prefer one canonical instrument link over
displaying both a raw filepath and a button to the same source.

The complete literal wording MUST remain available on the section row, but MAY be
collapsed by default to preserve a usable overview where a PATCH contains many
repairs. Its disclosure label MUST clearly identify final adopted wording or
literal wording removed, and the control MUST remain keyboard accessible.

For a non-doctrinal repair, the record MUST state prominently:

> This PATCH did not amend CAELESTIS corpus text.

It MUST then identify what was repaired and, for reliance on pre-existing coverage, quote and link the relevant provision.

## Lifecycle fidelity and implementation-detail guard

The interface MUST reproduce the lifecycle state recorded in VIGIL Observatory faithfully. `Closed—actioned` means the record is completed or implemented and no longer sits in the active work queue. It MUST NOT be reinterpreted as secret, withheld, suppressed, or hidden.

Lifecycle state and public implementation completeness are separate claims. Where a closed—actioned PATCH does not yet expose complete structured implementation detail, the interface MUST:

- retain the source lifecycle label `Closed—actioned`;
- separately display `Implementation details incomplete`;
- identify the missing implementation detail;
- retain access to the source JSON for audit;
- avoid inventing or paraphrasing adopted wording.

A narrative description such as “updated AEON-003,” a list of instrument codes, a section description without adopted wording, or `doctrine_change: none` without a coherent no-change declaration does not satisfy the implementation-detail contract. It does not, however, authorise the interface to rewrite the source lifecycle state.

## Canonical structured implementation block

The interface accepts legacy records defensively, but the canonical PATCH structure is:

```json
{
  "corpus_implementation": {
    "implementation_outcome": "corpus-amendment",
    "no_corpus_text_changed": false,
    "no_corpus_change_explanation": null,
    "repair_summary": "Plain-language account of the implemented repair.",
    "date_implemented": "2026-07-20",
    "amendments": [
      {
        "instrument_id": "CAM-BS2025-AEON-003-SCH-02",
        "instrument_title": "Annex B: Runtime Governance Execution Model",
        "canonical_file_path": "Governance/Constitution/CAM-BS2025-AEON-003-SCH-02.md",
        "section": "§7.4.1",
        "section_heading": "Weak Trigger and Premature Tool Invocation Constraint",
        "action": "amended",
        "final_adopted_wording": "Complete literal adopted clause.",
        "previous_wording": "Previous clause where materially relevant.",
        "implemented_date": "2026-07-20",
        "verification_status": "verified",
        "verified_against": "Caelestis commit SHA or version",
        "current_status": "current",
        "canonical_source_url": "https://github.com/CAM-Initiative/Caelestis/blob/main/...",
        "implementation_record_url": "https://github.com/CAM-Initiative/Caelestis/commit/..."
      }
    ],
    "residual_monitoring": []
  }
}
```

Permitted `implementation_outcome` values are:

- `corpus-amendment`;
- `pre-existing-control`;
- `non-corpus-repair`.

`pre-existing-control` and `non-corpus-repair` require `no_corpus_text_changed: true` and a public explanation.

## Registry search projection

Lean VIGIL Observatory registry entries SHOULD project the following public fields so the Observatory can search without downloading every complete record:

- `public_finding`;
- `relevant_domains`;
- `record_chain`;
- `repair_state`;
- `principal_instruments`;
- `principal_sections`;
- `corpus_search_terms`;
- `display_contract_status`.

Search MUST support record ID, failure title, provider or system, domain, lifecycle status, instrument code, section number, and high-value source metadata such as primary source title, publisher or platform, source type, and source domain where projected. Source metadata is an indexed discovery aid; it does not replace canonical `source_records` evidence or establish that the source was independently reviewed. Multi-term queries MUST match terms independently, so `AEON-003 §7.4.1` or `Hugging Face security incident` can find a record even when the terms are stored in separate projected fields. Exact source-title and publisher matches SHOULD rank ahead of broad contextual matches.

Literal adopted wording MUST remain in the canonical record and detail view; it SHOULD NOT be copied into a lean registry index.
