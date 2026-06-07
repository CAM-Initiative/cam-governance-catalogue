## Static site output

The public site is served from `/docs`. When modifying UI, data-loading, or page-rendering code, agents must run the appropriate build/export/sync command and commit the resulting `/docs` changes. A PR that updates only `src/` but leaves `/docs` stale is incomplete unless the repository has been migrated away from `/docs` deployment and the PR documents that migration.
