// VIGIL public Case File challenge intake.
// Deploy separately as a Cloudflare Worker. NEVER commit secrets or credentials.
const CATEGORIES = Object.freeze({
  factual: "Factually inaccurate",
  misleading: "Misleading or unsupported interpretation",
  omitted: "Missing evidence or context",
  reference: "Incorrect or unreliable reference",
  classification: "Classification or assessment concern",
  other: "Other Case File concern",
});
const MAX_BODY = 12000;
const ID_PATTERN = /^VIGIL-INC-\d{6}$/;

function response(body, status, origin, headers = {}) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Vary": "Origin",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      ...headers,
    },
  });
}

function limitedString(value, max) {
  return typeof value === "string" && value.length <= max ? value.trim() : null;
}

export function validateChallenge(value, siteOrigin) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const caseId = limitedString(value.caseId, 32);
  const category = limitedString(value.category, 32);
  const explanation = limitedString(value.explanation, 4000);
  const target = limitedString(value.target, 200);
  const evidence = limitedString(value.evidence, 1500);
  const contact = limitedString(value.contact, 254);
  const token = limitedString(value.turnstileToken, 2048);
  if (!caseId || !ID_PATTERN.test(caseId) || !category || !Object.hasOwn(CATEGORIES, category)) return null;
  if (!explanation || explanation.length < 20 || !target || !token) return null;
  if (evidence === null || contact === null) return null;
  if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return null;
  if (value.consent !== true) return null;
  let url;
  try {
    url = new URL(value.caseUrl);
    if (url.origin !== siteOrigin) return null;
    if (url.pathname.replace(/\/+$/, "") !== "/observatory/cases/" + caseId) return null;
    if (url.username || url.password || url.search || url.hash) return null;
  } catch {
    return null;
  }
  return { caseId, category, explanation, target, evidence, contact, turnstileToken: token, caseUrl: url.href };
}

function quote(text) {
  // Treat user text as literal quoted evidence, not as GitHub issue metadata or instructions.
  return text.replace(/\r/g, "").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .split("\n").map(line => "> " + line).join("\n");
}

export function issuePayload(challenge) {
  const title = "[Case File challenge] " + challenge.caseId + " — " + CATEGORIES[challenge.category];
  const body = [
    "## Public Case File quality challenge",
    "**Status:** Unverified submission — requires human assessment.",
    "**Case File:** " + challenge.caseId,
    "**Canonical page:** " + challenge.caseUrl,
    "**Category:** " + CATEGORIES[challenge.category],
    "",
    "### Challenged section, clause or statement",
    quote(challenge.target),
    "",
    "### Reporter's explanation",
    quote(challenge.explanation),
    "",
    "### Evidence / supporting sources",
    quote(challenge.evidence || "Not supplied"),
    "",
    "### Optional reply contact (PRIVATE INTAKE ONLY)",
    quote(challenge.contact || "Not supplied"),
    "",
    "### Review checklist (maintainer use)",
    "- [ ] Verify the cited Case File text and originating sources",
    "- [ ] Distinguish factual corrections from interpretative disagreement",
    "- [ ] Check for duplicates or related challenges",
    "- [ ] Record disposition and rationale",
    "- [ ] If substantiated, update canonical VIGIL record through normal review",
    "- [ ] Check public projection, generated report and references",
    "",
    "Never copy personal contact details or unverified allegations from this private issue into a public repository.",
  ].join("\n");
  return { title, body };
}

async function verifyTurnstile(token, secret, ip, expectedHostname) {
  const data = new URLSearchParams({ secret, response: token });
  if (ip) data.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: data,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return false;
  const answer = await res.json();
  // Reject successful tokens issued for a different form or hostname.
  return answer.success === true && answer.hostname === expectedHostname && answer.action === "case_file_challenge";
}

export default {
  async fetch(request, env) {
    const siteOrigin = (env.SITE_ORIGIN || "").replace(/\/$/, "");
    const origin = request.headers.get("Origin") || "";
    const configured = Boolean(
      /^https:\/\/[^/]+$/.test(siteOrigin) &&
      env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO && env.TURNSTILE_SECRET
    );
    // Fail closed until deployment has ALL required secret and destination configuration.
    if (!configured) return new Response("Intake service is not configured.", { status: 503 });
    if (origin !== siteOrigin) return new Response("Forbidden", { status: 403 });
    const pathname = new URL(request.url).pathname;
    if (pathname !== "/case-file-challenges") return response({ error: "Not found" }, 404, origin);
    if (request.method === "OPTIONS") return response({}, 204, origin);
    if (request.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);
    if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
      return response({ error: "Content type must be JSON" }, 415, origin);
    }
    if (Number(request.headers.get("Content-Length")) > MAX_BODY) {
      return response({ error: "Submission too large" }, 413, origin);
    }
    let payload;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY) return response({ error: "Submission too large" }, 413, origin);
      payload = JSON.parse(raw);
    } catch {
      return response({ error: "Invalid JSON" }, 400, origin);
    }
    // Honeypot intentionally gets an indistinguishable acknowledgement (no GitHub write).
    if (payload && typeof payload.website === "string" && payload.website.trim()) {
      return response({ ok: true, reference: "Submission received" }, 202, origin);
    }
    const validated = validateChallenge(payload, siteOrigin);
    if (!validated) return response({ error: "Please check the required fields" }, 400, origin);
    let verified = false;
    try {
      verified = await verifyTurnstile(
        validated.turnstileToken,
        env.TURNSTILE_SECRET,
        request.headers.get("CF-Connecting-IP"),
        new URL(siteOrigin).hostname
      );
    } catch {
      return response({ error: "Verification temporarily unavailable" }, 503, origin);
    }
    if (!verified) return response({ error: "Verification failed. Please retry." }, 403, origin);

    const issue = issuePayload(validated);
    try {
      // Fail closed if the configured destination is public or inaccessible.
      // This prevents accidental publication of reporter emails or unverified allegations.
      const destination = await fetch(
        "https://api.github.com/repos/" + encodeURIComponent(env.GITHUB_OWNER) +
          "/" + encodeURIComponent(env.GITHUB_REPO),
        {
          headers: {
            Authorization: "Bearer " + env.GITHUB_TOKEN,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "CAM-VIGIL-Case-File-Challenges",
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!destination.ok || (await destination.json()).private !== true) {
        return response({ error: "Private intake is not configured. No submission was recorded." }, 503, origin);
      }
      const github = await fetch(
        "https://api.github.com/repos/" + encodeURIComponent(env.GITHUB_OWNER) +
          "/" + encodeURIComponent(env.GITHUB_REPO) + "/issues",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + env.GITHUB_TOKEN,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "CAM-VIGIL-Case-File-Challenges",
          },
          body: JSON.stringify(issue),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!github.ok) return response({ error: "Submission was not recorded. Please retry later." }, 503, origin);
      const created = await github.json();
      if (!Number.isInteger(created.number)) throw new Error("Missing GitHub issue reference");
      // Never disclose a private repository URL to an unauthenticated caller.
      return response({ ok: true, reference: "VIGIL-CH-" + String(created.number).padStart(5, "0") }, 201, origin);
    } catch {
      return response({ error: "Submission was not recorded. Please retry later." }, 503, origin);
    }
  },
};
