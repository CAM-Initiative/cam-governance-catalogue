import test from "node:test";
import assert from "node:assert/strict";
import worker, { validateChallenge, issuePayload } from "../infra/vigil-challenge-worker/index.mjs";

const site = "https://cam-initiative.org";
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
      if (String(url).includes("/siteverify")) return new Response(JSON.stringify({ success: true, hostname: "cam-initiative.org", action: "case_file_challenge" }), { status: 200 });
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
        return new Response(JSON.stringify({ success: true, hostname: "cam-initiative.org", action: "unrelated_form" }), { status: 200 });
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
      if (String(url).includes("/siteverify")) return new Response(JSON.stringify({ success: true, hostname: "cam-initiative.org", action: "case_file_challenge" }), { status: 200 });
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
