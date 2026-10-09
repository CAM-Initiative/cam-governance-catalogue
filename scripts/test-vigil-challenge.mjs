import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker, { validateChallenge, issuePayload } from "../infra/vigil-challenge-worker/index.mjs";

const site = "https://www.cam-initiative.org";
const challenge = {
  caseId: "VIGIL-INC-000126",
  caseUrl: site + "/observatory/cases/VIGIL-INC-000126/",
  category: "misleading",
  target: "Section 03 · classification",
  explanation: "The asserted failure is not supported by the cited first-party material.",
  evidence: "https://example.com/primary-report",
  contact: "",
  consent: true,
  website: "",
  turnstileToken: "test-token",
};
const env = {
  SITE_ORIGIN: site,
  GITHUB_TOKEN: "fixture",
  GITHUB_OWNER: "example-org",
  GITHUB_REPO: "private-challenges",
  TURNSTILE_SECRET: "fixture",
  CHALLENGE_RATE_LIMITER: { limit: async () => ({ success: true }) },
};
const post = input => new Request("https://worker.example/case-file-challenges", {
  method: "POST",
  headers: { Origin: site, "Content-Type": "application/json" },
  body: JSON.stringify(input),
});

test("validates required fields, permitted case URL and explicit consent", () => {
  assert.equal(validateChallenge(challenge, site)?.caseId, "VIGIL-INC-000126");
  assert.equal(validateChallenge({ ...challenge, consent: false }, site), null);
  assert.equal(validateChallenge({ ...challenge, category: "arbitrary" }, site), null);
  assert.equal(validateChallenge({ ...challenge, caseUrl: "https://other.example/observatory/cases/VIGIL-INC-000126/" }, site), null);
  assert.equal(validateChallenge({ ...challenge, explanation: "Too short" }, site), null);
  assert.equal(validateChallenge({ ...challenge, caseId: "INC-126" }, site), null);
});

test("formats reporter text as quoted evidence rather than issue metadata", () => {
  const issue = issuePayload(validateChallenge({ ...challenge, target: "<script>attack</script>\n### extra" }, site));
  assert.match(issue.title, /\[Case File challenge\] VIGIL-INC-000126/);
  assert.match(issue.body, /> &lt;script&gt;attack&lt;\/script&gt;/);
  assert.match(issue.body, /> ### extra/);
  assert.match(issue.body, /Status:\*\* Unverified submission/);
});

test("OPTIONS preflight returns empty 204, never a body", async () => {
  const reply = await worker.fetch(new Request("https://worker.example/case-file-challenges", {
    method: "OPTIONS", headers: { Origin: site },
  }), env);
  assert.equal(reply.status, 204);
  assert.equal(await reply.text(), "");
});

test("rejects requests from another Origin before any external call", async () => {
  const reply = await worker.fetch(new Request("https://worker.example/case-file-challenges", {
    method: "POST", headers: { Origin: "https://attacker.example", "Content-Type": "application/json" },
    body: JSON.stringify(challenge),
  }), env);
  assert.equal(reply.status, 403);
});

test("requires Turnstile and a private destination before recording an issue", async () => {
  const original = globalThis.fetch;
  let calledPost = false;
  try {
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/siteverify")) return new Response(JSON.stringify({ success: true, hostname: "www.cam-initiative.org", action: "case_file_challenge" }), { status: 200 });
      if (init?.method === "POST") calledPost = true;
      return new Response(JSON.stringify({ private: false }), { status: 200 });
    };
    const reply = await worker.fetch(post(challenge), env);
    assert.equal(reply.status, 503);
    assert.equal(calledPost, false);
    assert.match((await reply.json()).error, /Private intake/);
  } finally {
    globalThis.fetch = original;
  }
});

test("rejects a token verified for a different Turnstile action", async () => {
  const original = globalThis.fetch;
  let githubCalled = false;
  try {
    globalThis.fetch = async (url) => {
      if (String(url).includes("/siteverify")) {
        return new Response(JSON.stringify({ success: true, hostname: "www.cam-initiative.org", action: "unrelated_form" }), { status: 200 });
      }
      githubCalled = true;
      throw new Error("GitHub should not be contacted on wrong action");
    };
    const reply = await worker.fetch(post(challenge), env);
    assert.equal(reply.status, 403);
    assert.equal(githubCalled, false);
  } finally {
    globalThis.fetch = original;
  }
});

test("creates an issue only after verification and private-repo check", async () => {
  const original = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (url, init) => {
      calls.push(String(url));
      if (String(url).includes("/siteverify")) return new Response(JSON.stringify({ success: true, hostname: "www.cam-initiative.org", action: "case_file_challenge" }), { status: 200 });
      if (!init?.method || init.method === "GET") return new Response(JSON.stringify({ private: true }), { status: 200 });
      return new Response(JSON.stringify({ number: 42 }), { status: 201 });
    };
    const reply = await worker.fetch(post(challenge), env);
    assert.equal(reply.status, 201);
    assert.equal((await reply.json()).reference, "VIGIL-CH-00042");
    assert.equal(calls.length, 3);
  } finally {
    globalThis.fetch = original;
  }
});

test("fails closed without backend secrets", async () => {
  const reply = await worker.fetch(post(challenge), { SITE_ORIGIN: site });
  assert.equal(reply.status, 503);
});

test("challenge modal escapes Case File tab button styles and matches PDF link typography", () => {
  const ui = readFileSync(new URL("../src/components/vigil/CaseFileChallenge.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/vigil-case-file-challenge.css", import.meta.url), "utf8");
  assert.match(ui, /createPortal\(<dialog\b/);
  assert.match(ui, /document\.body\)}/);
  assert.match(css, /\.vigil-case-file-page \.vigil-case-stage-tabs \.vigil-case-challenge-tab \{/);
  assert.match(css, /font-size: 0\.7rem !important/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*font-size: 0\.72rem !important/);
});

test("category radio controls remain visible in preview with submission fail-closed", () => {
  const ui = readFileSync(new URL("../src/components/vigil/CaseFileChallenge.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/vigil-case-file-challenge.css", import.meta.url), "utf8");
  assert.match(ui, /<fieldset className="vigil-case-challenge-categories">/);
  assert.match(ui, /<input type="radio" name="challenge-category"/);
  assert.match(ui, /<textarea value=\{explanation\}/);
  assert.match(ui, /<textarea value=\{evidence\}/);
  assert.match(ui, /<input type="email" value=\{contact\}/);
  assert.doesNotMatch(ui, /Form preview — submissions disabled|Submission unavailable in preview/);
  assert.match(ui, /\{sending \? "Recording challenge…" : "Submit for review"\}/);
  assert.doesNotMatch(ui, /!ENABLED \? <div role="status"/);
  assert.match(ui, /if \(!CAN_SUBMIT \|\| sending \|\| !token \|\| !consent\) return/);
  assert.match(ui, /disabled=\{!CAN_SUBMIT \|\| sending \|\| !token \|\| !consent\}/);
  assert.match(css, /input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)/);
  assert.match(css, /\.vigil-case-challenge-option input\[type="radio"\]/);
});

test("production hostname is consistent across form and Worker configuration", () => {
  const form = readFileSync(new URL("../src/components/vigil/CaseFileChallenge.tsx", import.meta.url), "utf8");
  const configuration = readFileSync(new URL("../infra/vigil-challenge-worker/wrangler.toml", import.meta.url), "utf8");
  assert.match(form, /window\.location\.origin === "https:\/\/www\.cam-initiative\.org"/);
  assert.match(configuration, /SITE_ORIGIN = "https:\/\/www\.cam-initiative\.org"/);
});

test("rejects POST attempts when the rate-limit binding is absent (fails closed)", async () => {
  const { CHALLENGE_RATE_LIMITER: removed, ...withoutLimiter } = env;
  const reply = await worker.fetch(post(challenge), withoutLimiter);
  assert.equal(reply.status, 503);
  assert.match((await reply.json()).error, /Intake protection is not configured/);
});

test("returns 429 with a retry hint before Turnstile or GitHub access when throttled", async () => {
  const original = globalThis.fetch;
  let externalCalls = 0;
  let observedKey = "";
  try {
    globalThis.fetch = async () => {
      externalCalls += 1;
      throw new Error("Rate-limited requests must not contact external services");
    };
    const limitedEnv = {
      ...env,
      CHALLENGE_RATE_LIMITER: {
        limit: async ({ key }) => {
          observedKey = key;
          return { success: false };
        },
      },
    };
    const request = new Request("https://worker.example/case-file-challenges", {
      method: "POST",
      headers: { Origin: site, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.15" },
      body: JSON.stringify(challenge),
    });
    const reply = await worker.fetch(request, limitedEnv);
    assert.equal(reply.status, 429);
    assert.equal(reply.headers.get("Retry-After"), "60");
    assert.equal(reply.headers.get("Access-Control-Allow-Origin"), site);
    assert.match((await reply.json()).error, /Too many requests/);
    assert.equal(observedKey, "case-file-challenges:192.0.2.15");
    assert.equal(externalCalls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("returns 503 and does not reach external services when rate limiter is unavailable", async () => {
  const original = globalThis.fetch;
  let called = false;
  try {
    globalThis.fetch = async () => { called = true; throw new Error("Should not call external API"); };
    const reply = await worker.fetch(post(challenge), {
      ...env,
      CHALLENGE_RATE_LIMITER: { limit: async () => { throw new Error("Unavailable"); } },
    });
    assert.equal(reply.status, 503);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = original;
  }
});

test("rate limiter uses a Wrangler binding with expected namespace and per-minute limit", () => {
  const config = readFileSync(new URL("../infra/vigil-challenge-worker/wrangler.toml", import.meta.url), "utf8");
  assert.match(config, /\[\[ratelimits\]\]/);
  assert.match(config, /name = "CHALLENGE_RATE_LIMITER"/);
  assert.match(config, /limit = 5/);
  assert.match(config, /period = 60/);
});
