## Static site output

The public site is served from `/docs`. When modifying UI, data-loading, or page-rendering code, agents must run the appropriate build/export/sync command and commit the resulting `/docs` changes. A PR that updates only `src/` but leaves `/docs` stale is incomplete unless the repository has been migrated away from `/docs` deployment and the PR documents that migration.

## Docs publication validation

Website work is incomplete unless the published `/docs` output is updated. This repository publishes GitHub Pages from `/docs`. After editing website source files, run the site build/export step or manually propagate the output to `/docs`, then run `python scripts/validate-docs-published-output.py`. Pull requests that change website source without updating `/docs` should fail validation.
