# Public website operational resilience and dependency closure

## Release gate

A successful build or HTTP 200 is not evidence that the interactive service works. A change to the VIGIL schema, generated indexes, taxonomy/mapping semantics, source references, sidecars, or presentation contract must identify affected website consumers before it is approved for implementation. Link the upstream VIGIL issue/PR and the website reconciliation PR. Where a coordinated rollout is necessary, document compatibility and order; do not close the upstream obligation until the downstream public service is verified, or explicitly record an open owner and blocker.

Before merging: require the unresolved-runtime-binding gate, existing contract tests, generated Pages output validation and the browser smoke tests against the rebuilt local publication. The TypeScript gate presently blocks unresolved runtime names; other diagnostics are reported and must be audited before broad strict gating is introduced.

After deployment: the Verify live website health workflow runs after successful Pages deployment, every six hours and on demand. It checks live HTML, the entry JavaScript bundle and the published compact index/sidecars against the selected deployed commit, and checks actual rendering, direct and menu navigation, search, classification filtering, individual assessment and deliberately unavailable registry/bundle recovery in desktop Chromium and mobile WebKit.

## Failure communication and recovery

The generated basic publication is a supported reading path, not a loading spinner. It remains accessible while the interactive view prepares. A load failure changes the status explicitly; a bounded independent HTML watchdog covers entry-bundle failure. Users can retain the basic view with `?view=static` or retry the interactive route. An application rendering failure must expose the same recovery path; optional globe failure must not disable the library. No automatic rollback or data mutation is authorised by a monitoring failure.

## Operational evidence

A successful live check records the selected deployed commit, file fingerprints, directly associated PRs, most recent associated PRs found in up to 20 first-parent commits, verification run and verification time. A failed check must not replace the last verified good artifact. Until the first successful health run, there is no independently verified baseline. A recent PR is a diagnostic lead, not causal proof. If deployed identity cannot be confirmed, report that uncertainty rather than assign blame.

A failed check opens or updates one operational health issue and fails the GitHub Actions run; maintainers should configure GitHub notifications for workflow failures and repository issues. Review the exact failed step, deployment, last verified good and upstream change before authorising a rollback. Artifacts are retained for 90 days; if no retained baseline is available, report it as unavailable. Verify recovery with a successful live check and record the evidence on the incident issue before closing it.

This control applies to the public website and does not change VIGIL adjudication criteria, mapping roles, canonical records or taxonomy.
