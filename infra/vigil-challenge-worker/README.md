# VIGIL Case File evidence-quality challenges

**Status: feature branch only. NOT YET LIVE.**

This is a challenge/correction route for existing published Case Files, not a new-Incident intake route. The action appears in the contents menu immediately after Full report / PDF. GitHub Pages remains a static site and must never receive credentials.

## Data flow
1. A visitor identifies a disputed Case File section, category, explanation, evidence URLs, and optional reply email. The page supplies the exact Case File ID and URL.
2. A visitor explicitly agrees to the notice and completes Turnstile. The site submits JSON to the configured Cloudflare Worker.
3. The Worker validates origin, shape, permitted field sizes, consent, canonical Case File URL and Turnstile token with hostname.
4. The Worker first checks GitHub's repository metadata to confirm the configured intake destination is PRIVATE. Only then does it create a private issue. The public response contains only an intake reference.
5. Maintainers assess the report against original evidence and record a disposition. Reports never change canonical VIGIL data automatically.

## Account owner setup (still required)
The private intake repository is created and verified. The connected tools cannot configure Cloudflare or provision secrets; the account owner must:

1. Use the existing **CAM-Initiative/vigil-observatory** PRIVATE repository (verified 9 October 2026). Keep Issues enabled and do not use a public repository for incoming reports.
2. Create a fine-grained GitHub access token confined to CAM-Initiative/vigil-observatory, with Issues read/write and minimum metadata permissions. Set expiry/rotation as appropriate. Do NOT paste the value into chat, files, GitHub issues, Pages variables or commits.
3. Create a Cloudflare Turnstile widget restricted to cam-initiative.org. The public site key is not a password; the Turnstile secret must remain confidential.
4. Deploy this directory as a Cloudflare Worker, providing GITHUB_TOKEN and TURNSTILE_SECRET using Cloudflare Worker **secret** bindings only (via dashboard or secure interactive Wrangler secret put prompts).
5. Set non-secret Worker vars SITE_ORIGIN, GITHUB_OWNER, GITHUB_REPO from wrangler.toml. Create Cloudflare rate-limiting controls for the endpoint; Turnstile and Origin checks alone are not a rate limit.
6. Configure the public website build variables VITE_VIGIL_CHALLENGE_ENDPOINT (complete HTTPS Worker URL ending /case-file-challenges) and VITE_VIGIL_TURNSTILE_SITE_KEY (public Turnstile site key). These are the only values the browser sees.
7. BEFORE enabling a live form, update the Privacy Policy to explain collection, purpose, processors (Cloudflare and GitHub), retention/deletion, response and removal requests, and contact details. Review applicable privacy duties.
8. Run node --test scripts/test-vigil-challenge.mjs and pnpm run test:vigil; then rebuild and validate /docs. Test one consented report end-to-end against the actual private repository, including negative security cases and mobile access.

## Safe defaults
- If the Worker endpoint build variable is missing, the dialog opens in unavailable mode and cannot accept or submit text. The existing public Turnstile site key alone does not activate submissions.
- If the Worker has missing configuration/secrets, it rejects the request (503). If the GitHub repository is public, it refuses to create any issue.
- The Worker returns a reference like VIGIL-CH-00042, not a private repo link.
- Never commit tokens, secret keys, private keys, passwords, .env or .dev.vars files. Browser build variables are public and must NOT contain secrets.
- Public site and generated PDF remain authoritative only as projections of canonical VIGIL records, not user submissions.

## Review dispositions
Record issue triage, source verification, reasons, and final state: correction, clarification, retained with reasons, unresolved, duplicate, or out-of-scope. Redact any personal detail before publishing corrections. Do not turn unverified submissions into published allegations.

## Expansion boundary

This private repository may later support other VIGIL Observatory operations. Keep Case File challenges distinguishable from other workflow issues by their `[Case File challenge]` title prefix (and optional separately managed GitHub labels). The Worker must retain an explicit, single-purpose issue-creation policy.


## Browser-based setup sequence

1. In GitHub (Settings > Developer settings > Personal access tokens > Fine-grained tokens), create a token restricted to owner CAM-Initiative, repository vigil-observatory only, with Issues: Read and write. GitHub grants read-only Metadata automatically. Do not share the token in a message or commit.
2. In Cloudflare Dashboard > Turnstile, open the **existing widget** with public site key `0x4AAAAAAFSNuGaY4lVBa0hY`. Check it allows hostname `cam-initiative.org`. Do not create another widget. The private secret belongs only in the Worker secret binding (`TURNSTILE_SECRET`).
3. Under Cloudflare Workers & Pages create a Worker named vigil-case-file-challenges. The worker's script is infra/vigil-challenge-worker/index.mjs, and should be deployed from this source. Its request path is /case-file-challenges.
4. In the Worker Settings > Variables and Secrets, add non-secret TEXT variables SITE_ORIGIN=https://cam-initiative.org, GITHUB_OWNER=CAM-Initiative, GITHUB_REPO=vigil-observatory. Add SECRET variables GITHUB_TOKEN and TURNSTILE_SECRET. Use the Cloudflare secret input controls, not plain-text bindings or source code.
5. In website repository Settings > Secrets and variables > Actions > Variables (not Secrets), configure `VITE_VIGIL_CHALLENGE_ENDPOINT` as the full deployed Worker HTTPS URL ending `/case-file-challenges`. The existing PUBLIC site key is already present as a browser-safe fallback in `CaseFileChallenge.tsx`; optionally override with `VITE_VIGIL_TURNSTILE_SITE_KEY` for a future widget. Both website build workflows pass these public values. Never put GitHub tokens or Turnstile secrets in VITE_ variables.
6. Run the rebuild/publish workflow on the feature branch AFTER the endpoint is safely configured, and perform end-to-end tests before merging. Site remains unavailable while the Worker HTTPS endpoint variable is missing, even though the public site key is already embedded.

Cloudflare's Wrangler configuration for deployments from a local checkout is supplied in wrangler.toml. The Worker code has no hardcoded credentials.

## Existing-widget integration (Cloudflare Spin)

Cloudflare Spin created widget site key `0x4AAAAAAFSNuGaY4lVBa0hY`; **do not create another widget**. The site key is a public, non-secret frontend constant. The React dialog renders this widget explicitly with the action `case_file_challenge`. The Worker uses Cloudflare's canonical `/turnstile/v0/siteverify` endpoint and refuses reports unless both the hostname and the action match. The secret is never embedded in a frontend build. Cloudflare's existing-widget recovery flow normally uses an authenticated Wrangler 4.109+ CLI to retrieve the secret directly into the Worker; no such authenticated Cloudflare tooling is available in this chat. The account owner must set `TURNSTILE_SECRET` using Cloudflare's secure Worker Secret UI. Do not paste or send the secret to an assistant.
