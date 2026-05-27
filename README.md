# CAM Runtime Atlas (Static GitHub Pages)

![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.19779351.svg)
![Support](https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-ffdd00?logo=buymeacoffee&logoColor=000)

This repository hosts an **explanatory runtime atlas** for Constitutional AI Mediation (CAM), using plain HTML/CSS/JavaScript.

> **Canonical source notice:** This repository/site is an explanatory interface, not the canonical corpus. Canonical governance documents remain in [CAM-Initiative/Caelestis](https://github.com/CAM-Initiative/Caelestis).

## What the site does

The `/docs` site provides three linked interfaces:

- **Landing page** introducing CAM runtime architecture.
- **Runtime flow view** with phase-based interactive execution cards.
- **Governance problem explorer** with curated pathways plus searchable/filterable instrument browsing.

## GitHub Pages setup (/docs)

Enable Pages in repository settings:

- **Source:** Deploy from a branch
- **Branch:** `main` (or your publishing branch)
- **Folder:** `/docs`

Required deployed structure:

- `/docs/index.html`
- `/docs/runtime.html`
- `/docs/explorer.html`
- `/docs/assets/style.css`
- `/docs/assets/app.js`
- `/docs/assets/runtime-map.js`
- `/docs/data/cam-governance.json`
- `/docs/data/runtime-flow.json`
- `/docs/data/problem-pathways.json`
- `/docs/images/`
- `/docs/.nojekyll`


## Support

CAM is an independent public governance and archival infrastructure project. Support helps sustain public archive stewardship, indexing, and governance research work.

## Validation

Run local catalogue validation before publishing:

```bash
node scripts/validate-catalogue-data.js
```

## Canonical and visual boundaries

Visual assets are explanatory and non-canonical. Canonical governance meaning remains in the source instruments and validated JSON data.
