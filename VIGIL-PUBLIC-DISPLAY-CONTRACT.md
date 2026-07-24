# VIGIL Public-Display Contract

Status: interface contract

Applies to: CAM Governance Interface / VIGIL Observatory

Authority boundary: CAELESTIS remains the authoritative governance corpus. VIGIL records evidence, findings, proposed changes, implemented repairs, and their verification; it does not create independent constitutional authority.

## Public reading path

Every public record MUST make the following information readily visible:

1. record ID and type;
2. plain-language title;
3. one-paragraph public finding;
4. the visible `Observation → Failure Mode → Proposal → PATCH` record chain;
5. lifecycle status;
6. first-observed, published, and last-updated dates where applicable;
7. relevant domains and systems;
8. a link to the complete canonical VIGIL JSON record.

The record chain MUST appear immediately after the public finding. Dates, domains, and system fields SHOULD use a compact metadata treatment rather than a dominant content panel. Relationship fields already represented by the record chain SHOULD NOT be repeated as a separate `Linked records` section.

Technical metadata, reviewer history, integrity hashes, extended analysis, rejected alternatives, and full lifecycle events MAY remain in the JSON or in a subordinate audit-details view.

## Record-type requirements

### Observation

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

For a non-doctrinal repair, the record MUST state prominently:

> This PATCH did not amend CAELESTIS corpus text.

It MUST then identify what was repaired and, for reliance on pre-existing coverage, quote and link the relevant provision.

## Lifecycle fidelity and implementation-detail guard

The interface MUST reproduce the lifecycle state recorded in VIGIL faithfully. `Closed—actioned` means the record is completed or implemented and no longer sits in the active work queue. It MUST NOT be reinterpreted as secret, withheld, suppressed, or hidden.

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

Lean VIGIL registry entries SHOULD project the following public fields so the Observatory can search without downloading every complete record:

- `public_finding`;
- `relevant_domains`;
- `record_chain`;
- `repair_state`;
- `principal_instruments`;
- `principal_sections`;
- `corpus_search_terms`;
- `display_contract_status`.

Search MUST support record ID, failure title, provider or system, domain, lifecycle status, instrument code, and section number. Multi-term queries MUST match terms independently, so `AEON-003 §7.4.1` can find a record even when the instrument and section are stored in separate projected fields.

Literal adopted wording MUST remain in the canonical record and detail view; it SHOULD NOT be copied into a lean registry index.
