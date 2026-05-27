# CAM Governance Catalogue (Static GitHub Pages)

This repository is a **public reader/search interface** over governance data exported from [CAM-Initiative/Caelestis](https://github.com/CAM-Initiative/Caelestis).

> **Canonical source notice:** This repository is not canonical. The canonical governance corpus remains in CAM-Initiative/Caelestis.

## Structure

- `docs/index.html` — static UI for catalogue discovery and filtering.
- `docs/assets/style.css` — lightweight, calm, professional styles.
- `docs/assets/search.js` — client-side data loading, search, filtering, and result rendering.
- `docs/data/cam-governance.json` — local data source consumed by the page.

## Behavior

The catalogue:

- Loads data from `docs/data/cam-governance.json` in the browser.
- Supports full-text search across:
  - `id`, `title`, `summary`, `purpose`, `domain`, `status`, `effect`, `enforcement`, `review_state`, `authority_role`
- Supports structured filters for:
  - `domain`, `instrument_class`, `hierarchy_type`, `status`, `effect`, `enforcement`
- Renders accessible instrument cards with metadata.
- Links each instrument card to its canonical markdown source in `CAM-Initiative/Caelestis`.

## Publish with GitHub Pages

1. Push this repository to GitHub.
2. In repository settings, enable **GitHub Pages** from the `main` branch `/docs` folder.
3. The catalogue will be served from your Pages URL.

No framework, build step, backend, package manager, or external dependencies are required.
