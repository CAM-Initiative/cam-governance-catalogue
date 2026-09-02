# CAM Governance Interface

The **CAM Governance Interface** is the public Web UX layer for the CAM Initiative. It provides navigable access to the CAELESTIS constitutional AI governance corpus, the VIGIL Observatory, public datasets, technical references, and related governance materials.

The interface is a presentation layer. Canonical governance instruments, VIGIL records, taxonomies, schemas and generated registries remain authoritative in their source repositories.

## Public surfaces

The site currently provides:

- the CAM constitutional and runtime governance interface;
- searchable CAM governance instruments;
- VIGIL Observatory Case Files based on canonical Incident records;
- VIGIL Failure Taxonomy family and class references;
- deterministic Case File reports suitable for printing or PDF export;
- source-level evidence and diagnostic provenance displays;
- downloadable AI-governance standards data; and
- archived CAELESTIS releases and public reference material.

## Repository role

This repository owns the public interface, static-site build, registry-loading logic, display projections and interface-specific cached fallbacks. It does **not** own the canonical CAM or VIGIL datasets.

Canonical sources include:

- **CAELESTIS governance corpus:** `CAM-Initiative/Caelestis`
- **VIGIL Incident registry and Failure Taxonomy:** `CAM-Initiative/Vigil`

The public site consumes the canonical `main` branch of those repositories.

## VIGIL Observatory

VIGIL Case Files are occurrence-centred public records. The interface keeps the layers distinct:

- **Observation / evidence:** what the sources establish;
- **Diagnosis:** VIGIL's bounded governance interpretation, severity and diagnostic limitations;
- **Classification:** mapping of the occurrence to the reusable VIGIL Failure Taxonomy where supported; and
- **References:** evidence, canonical record and taxonomy references.

The interface does not treat CAM repair state as part of the historical Incident itself.

### Canonical Incident index

```text
https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Incidents.Index.json
```

### Canonical Failure Taxonomy index

```text
https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/taxonomy/VIGIL.FailureTaxonomy.Index.json
```

The generated VIGIL taxonomy technical reference is also loaded from the VIGIL `main` branch.

## CAELESTIS governance data

The canonical generated governance index is:

```text
https://raw.githubusercontent.com/CAM-Initiative/Caelestis/main/Governance/CAM.Governance.JSON
```

The interface keeps a generated fallback cache at:

```text
docs/data/cam-governance-fallback.json
```

The fallback exists for interface resilience and is not the canonical source of truth.

## Local development

Use Node 20, as specified in `.nvmrc`, and `pnpm`.

```bash
pnpm install
pnpm run dev
```

## Build

```bash
pnpm run build
```

GitHub Pages output is generated into:

```text
docs/
```

The published site uses the `main` branch `/docs` output.

## Data sync and validation

Common commands include:

```bash
pnpm run sync:cam
pnpm run sync:vigil
pnpm run validate:catalogue
pnpm run build
```

VIGIL and CAM source configuration is maintained in:

```text
src/config/registrySources.json
```

Generated fallback data should remain clearly subordinate to the canonical upstream registries.

## Publication behaviour

The site is built as a static GitHub Pages application. Public pages and generated reports must contain reader-facing content only; maintainer work notes, branch-state instructions, migration notes and implementation handoffs are not public copy.

## Licence

The CAM Governance Interface source and interface materials are governed by the repository licence. Underlying CAM instruments, VIGIL records, schemas, taxonomies, external source materials and generated datasets may have separate reuse terms.

See `LICENSE.md` for the interface licence.

## Citation

Suggested short-form citation:

> Dr Michelle O'Rourke. *CAM Governance Interface*. 2026.

Repository citation metadata is provided in `CITATION.cff`.
