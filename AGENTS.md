## Public-interface and third-party authoring rules

This repository publishes material for external readers. Public pages, labels, summaries, datasets, generated reports, and other visitor-facing surfaces must be written for a third party who has no access to the authoring conversation, agent handoff, repository work plan, migration history, or maintainer context.

Agents must:

* present substantive governance content directly and in plain public-facing language;
* treat repository workflow, agent coordination, migration state, branch management, validation tasking, reconciliation instructions, and maintainer TODOs as internal implementation material rather than public copy;
* not expose agent handoffs, internal work-package language, "next action" instructions, branch-state narration, migration notes, validator instructions, temporary implementation tasking, or conversational shorthand on public pages merely because those values exist in upstream records or metadata;
* distinguish legitimate public provenance from internal workflow. Evidence provenance, publication state, implementation status, source limitations, and other audit-relevant facts may be public where they help a third party assess the record, but they must be expressed as durable factual statements rather than instructions to the next maintainer or agent;
* prefer visitor-facing concepts over repository or architecture terminology where the latter is only meaningful internally;
* ensure generated reports and public record projections apply the same third-party standard as hand-authored pages; and
* remove inappropriate material from the public component or projection itself. Hiding internal content with CSS is not a sufficient repair.

When upstream data contains both substantive record content and internal routing or workflow metadata, the public interface must select and present the substantive content rather than mechanically rendering every available field.

## Static site output

The public site is served from `/docs`. When modifying UI, data-loading, or page-rendering code, agents must run the appropriate build/export/sync command and commit the resulting `/docs` changes. A PR that updates only `src/` but leaves `/docs` stale is incomplete unless the repository has been migrated away from `/docs` deployment and the PR documents that migration.

## Docs publication validation

Website work is incomplete unless the published `/docs` output is updated. This repository publishes GitHub Pages from `/docs`. After editing website source files, run the site build/export step or manually propagate the output to `/docs`, then run `python scripts/validate-docs-published-output.py`. Pull requests that change website source without updating `/docs` should fail validation.
