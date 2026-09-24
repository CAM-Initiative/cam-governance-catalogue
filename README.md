# CAM Governance Interface

The **CAM Governance Interface** is the public Web UX layer for the CAM Initiative. It provides navigable access to the CAELESTIS constitutional AI governance corpus, the VIGIL Observatory, public datasets, technical references, and related governance materials.

The interface is a presentation layer. Canonical governance instruments, VIGIL Observatory records, taxonomies, schemas and generated registries remain authoritative in their source repositories.

## Public surfaces

The site currently provides:

- the CAM constitutional and runtime governance interface;
- searchable CAM governance instruments;
- VIGIL Observatory Case Files based on canonical Incident records;
- VIGIL Observatory Adjudication Taxonomy family and class references;
- deterministic Case File reports suitable for printing or PDF export;
- source-level evidence and assessment provenance displays;
- downloadable AI-governance standards data; and
- archived CAELESTIS releases and public reference material.

## Repository role

This repository owns the public interface, static-site build, registry-loading logic, display projections and interface-specific cached fallbacks. It does **not** own the canonical CAM or VIGIL Observatory datasets.

Canonical sources include:

- **CAELESTIS governance corpus:** `CAM-Initiative/Caelestis`
- **VIGIL Observatory Incident registry and Adjudication Taxonomy:** `CAM-Initiative/Vigil`

The public site consumes the canonical `main` branch of those repositories.

## VIGIL Observatory

VIGIL Observatory Case Files are Incident-centred public records. The interface keeps the layers distinct:

- **Incident / evidence:** what the sources establish;
- **Assessment:** VIGIL Observatory's bounded governance assessment, severity and evidentiary limitations;
- **Classification:** mapping of the Incident to the reusable VIGIL Observatory Adjudication Taxonomy where supported; and
- **References:** evidence, canonical record and taxonomy references.

The interface does not treat CAM repair state as part of the historical Incident itself.

### Canonical Incident index

```text
https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/VIGIL.Incidents.Index.json
```

### Canonical Adjudication Taxonomy index

```text
https://raw.githubusercontent.com/CAM-Initiative/Vigil/main/vigil/taxonomy/VIGIL.FailureTaxonomy.Index.json
```

The generated VIGIL Observatory taxonomy technical reference is also loaded from the VIGIL `main` branch.

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

VIGIL Observatory and CAM source configuration is maintained in:

```text
src/config/registrySources.json
```

Generated fallback data should remain clearly subordinate to the canonical upstream registries.

## Publication behaviour

The site is built as a static GitHub Pages application. Public pages and generated reports must contain reader-facing content only; maintainer work notes, branch-state instructions, migration notes and implementation handoffs are not public copy.

## Licence

This repository does not publish a separate website or interface licence. Its `LICENSE.md` is a pointer to the controlling **VIGIL Observatory Proprietary Licence** for VIGIL Observatory Materials.

Website source code, interface assets and other CAM Initiative materials outside that licence's scope remain **all rights reserved** unless a specific notice expressly states otherwise.

**Copyright:** © 2026 Phoenix Covenant Pty Ltd trading as CAM Initiative. All rights reserved.

## Citation

Suggested short-form citation:

> Dr Michelle O'Rourke. *CAM Initiative Website*. 2026.

Repository citation metadata is provided in `CITATION.cff`.
