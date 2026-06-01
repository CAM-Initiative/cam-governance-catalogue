# CAM Governance Interface

The **CAM Governance Interface** is the public Web UX layer for navigating the Caelestis Architecture Model (CAM) governance corpus and related public registry systems.

It provides:

* a constitutional orientation hub;
* a runtime governance model viewer;
* relational governance explainers;
* a searchable CAM instrument catalogue;
* public-facing registry and provenance links; and
* the VIGIL observatory for digital ecosystem health signals, observations, failure modes, proposals, and patch notes.

The interface is designed to make CAM governance material easier to inspect, browse, filter, cite, and connect across domains.

---

## Purpose

The CAM Governance Interface acts as a public presentation and navigation layer for CAM-adjacent governance infrastructure.

It does not create CAM doctrine, amend adopted instruments, or determine the legal or governance effect of source materials.

Instead, it presents structured public data from CAM and VIGIL sources so that governance records can be reviewed, linked, searched, and interpreted in context.

---

## Repository Role

This repository hosts the Web UX for CAM governance materials.

It is responsible for:

* rendering the public CAM interface;
* building the static GitHub Pages output;
* loading local CAM catalogue data;
* loading live VIGIL registry data;
* preserving source links and provenance paths;
* providing fallback data where appropriate; and
* exposing public navigation pathways across CAM instruments and VIGIL records.

The interface consumes registry data. It is not the canonical source of truth for the underlying CAM instruments or VIGIL records.

---

## Run Locally

Use Node 20, as specified in `.nvmrc`, and `pnpm`.

```bash
pnpm install
pnpm run dev
```

---

## Build for GitHub Pages

```bash
pnpm run build
```

Build output is written to:

```text
/docs
```

for GitHub Pages publication.

---

## GitHub Pages Settings

Use the following GitHub Pages settings:

```text
Branch: main
Folder: /docs
```

---

## Data Sources

The interface uses both local build-time data and live external registry data.

Core local data files include:

```text
/docs/data/cam-governance.json
/docs/data/runtime-flow.json
/docs/data/problem-pathways.json
```

The live VIGIL registry source is:

```text
https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Registry.Index.json
```

An optional cached VIGIL fallback may be generated at build time:

```text
/docs/data/vigil-registry-fallback.json
```

Runtime Governance and Relational Governance sit under the Constitution section.

VIGIL is exposed as CAM’s public AI governance observatory and digital ecosystem health register.

---

## VIGIL Observatory

The VIGIL page displays public governance records from the live VIGIL registry.

VIGIL records may include:

* observations;
* failure modes;
* proposals;
* patch notes;
* research or supporting records; and
* related governance metadata.

VIGIL is a public evidence-to-repair governance ledger for AI system observations, failure modes, proposals, patch notes, and related governance records.

The interface presents VIGIL records for review, filtering, navigation, and citation. It does not itself determine whether a record is adopted, implemented, resolved, or binding.

---

## VIGIL Interface Sync

The VIGIL page is populated at runtime from the live VIGIL master registry index:

```text
VIGIL.Registry.Index.json
```

on the VIGIL repository default branch.

The VIGIL source configuration lives in:

```text
src/config/registrySources.json
```

The interface treats VIGIL as an external live registry source so newly generated registry entries can appear without pinning the interface to an archival commit.

During CAM interface builds, the `sync:vigil` script may write:

```text
docs/data/vigil-registry-fallback.json
```

as an optional cached fallback.

Runtime loading always attempts the live registry first. If the live registry cannot be loaded, the interface may display a clear fallback notice and use cached data where available.

Record source links are read from generated registry metadata, including:

* `github_blob_url`
* `raw_url`
* `path`

The interface should not hard-code old VIGIL record paths or deprecated registry filenames.

---

## VIGIL Registry Dispatch

After the VIGIL repository routes records, validates records, rebuilds generated registry JSON files, and commits those generated files, the VIGIL workflow may send a `repository_dispatch` event to this repository.

Expected dispatch event type:

```text
vigil-records-updated
```

The dispatch should use a repository secret token with permission to dispatch to the CAM interface repository, for example:

```text
CAM_INTERFACE_DISPATCH_TOKEN
```

This allows the CAM Governance Interface to rebuild or refresh after VIGIL registry updates.

---

## Deprecated VIGIL Files

The interface should not consume deprecated VIGIL generated files, including:

```text
VIGIL.Records.json
VIGIL.Records.Index.json
VIGIL.ActiveRecords.json
VIGIL.ClosedRecords.json
```

The canonical live VIGIL entry point is:

```text
VIGIL.Registry.Index.json
```

---

## Validate Catalogue References

Run:

```bash
pnpm run validate:catalogue
```

This checks local catalogue references and helps detect broken or inconsistent interface data.

---

## Common Commands

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run validate:catalogue
```

If supported by the current package scripts, VIGIL fallback sync may be run with:

```bash
pnpm run sync:vigil
```

---

## Licence

The CAM Governance Interface is licensed under the CAM Governance Interface Licence.

This licence governs the Web UX layer, source code, interface layout, registry-loading logic, presentation components, and associated interface documentation.

The underlying CAM instruments, VIGIL records, schemas, governance texts, taxonomies, external source materials, and generated registries may be subject to separate licences or reuse restrictions.

See:

```text
LICENSE.md
```

or the applicable repository licence file.

---

## Citation

If citing the CAM Governance Interface, use the repository citation metadata where available.

Suggested short-form citation:

> CAM Initiative / Aeon Governance Lab. *CAM Governance Interface*. Public Web UX layer for the Caelestis Architecture Model governance corpus and VIGIL observatory.

See:

```text
CITATION.cff
```

where available.
