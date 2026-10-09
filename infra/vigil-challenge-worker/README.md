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
- If the public build variables are not supplied, the dialog opens in unavailable mode and cannot accept or submit text.
- If the Worker has missing configuration/secrets, it rejects the request (503). If the GitHub repository is public, it refuses to create any issue.
- The Worker returns a reference like VIGIL-CH-00042, not a private repo link.
- Never commit tokens, secret keys, private keys, passwords, .env or .dev.vars files. Browser build variables are public and must NOT contain secrets.
- Public site and generated PDF remain authoritative only as projections of canonical VIGIL records, not user submissions.

## Review dispositions
Record issue triage, source verification, reasons, and final state: correction, clarification, retained with reasons, unresolved, duplicate, or out-of-scope. Redact any personal detail before publishing corrections. Do not turn unverified submissions into published allegations.

## Expansion boundary

This private repository may later support other VIGIL Observatory operations. Keep Case File challenges distinguishable from other workflow issues by their `[Case File challenge]` title prefix (and optional separately managed GitHub labels). The Worker must retain an explicit, single-purpose issue-creation policy.
