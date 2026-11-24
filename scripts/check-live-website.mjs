import { chromium, webkit, devices } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const origin = process.env.HEALTH_ORIGIN || "https://www.cam-initiative.org";
const target = "/observatory/cases/";
const expectedHtml = await readFile(process.env.HEALTH_EXPECTED_HTML, "utf8");
const digest = value => createHash("sha256").update(value).digest("hex");
const url = (path) => new URL(path, origin).href;
if (process.env.HEALTH_EXPECTED_MANIFEST) {
  const manifest = JSON.parse(await readFile(process.env.HEALTH_EXPECTED_MANIFEST, "utf8"));
  for (const [path, expected] of Object.entries(manifest)) {
    const response = await fetch(url(path) + "?health=" + Date.now(), { signal: AbortSignal.timeout(30_000) });
    assert.ok(response.ok, "Published asset unavailable: " + path);
    assert.equal(digest(Buffer.from(await response.arrayBuffer())), expected, "Publication fingerprint mismatch: " + path);
  }
}
const row = ".vigil-case-table-row-link";
const errors = [];
const deadline = 30_000;

async function checkLibrary(page) {
  await page.locator(row).first().waitFor({ state: "visible", timeout: deadline });
  await page.locator('[data-static-publication-fallback="vigil-case-index"]').waitFor({ state: "detached", timeout: deadline });
  assert.ok(await page.locator(row).first().innerText(), "Incident rows must contain content");
}

async function suite(name, engine, options) {
  const browser = await engine.launch();
  try {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(name + ": " + error.message));
    try {
      // Compare actual HTML to the selected deployment commit, not just HTTP 200.
      const response = await page.goto(url(target + "?health=" + Date.now()), { waitUntil: "domcontentloaded" });
      assert.ok(response?.ok(), "Public Case Files route did not return success");
      assert.equal(digest((await response.text()).trim()), digest(expectedHtml.trim()),
        "Deployment identity mismatch: live HTML differs from the selected commit; may be superseded or cached");
      await checkLibrary(page);

      // Check a real multi-role facet and search against visible case records.
      const facet = page.locator(".vigil-dashboard-classification-facet");
      await facet.locator("summary").click();
      const aligned = facet.getByText("Safeguards worked", { exact: true });
      await aligned.click();
      await page.locator(".vigil-dashboard-selection-chip").filter({ hasText: "Safeguards worked" }).waitFor();
      await page.locator(row).first().waitFor({ state: "visible" });
      await facet.getByText("All classifications", { exact: true }).click();
      const search = page.getByPlaceholder("Search Case Files…");
      const firstId = await page.locator(row).first().locator(".vigil-case-table-id").innerText();
      await search.fill(firstId);
      await page.locator(row).first().waitFor({ state: "visible" });
      assert.ok((await page.locator(row).first().innerText()).includes(firstId));
      await search.fill("");

      // Direct landing page and client navigation are distinct execution paths.
      await page.goto(url("/"), { waitUntil: "domcontentloaded" });
      await page.getByRole("link", { name: "Explore the evidence" }).click();
      await checkLibrary(page);
      await page.goto(url("/"), { waitUntil: "domcontentloaded" });
      if (options.isMobile) {
        await page.getByRole("button", { name: "Menu", exact: true }).click();
        await page.locator("#mobile-site-navigation").getByRole("link", { name: "Case Files", exact: true }).click();
      } else {
        await page.locator(".site-desktop-nav a.site-nav-root[href='/observatory/cases/']").click();
      }
      await checkLibrary(page);
      await page.locator(row).first().click();
      await page.locator(".vigil-case-file-page #case-file-heading").waitFor({ state: "visible", timeout: deadline });
      await page.getByRole("tab", { name: /assessment/i }).first().click();
      await page.locator('[role="tabpanel"]').waitFor({ state: "visible" });
      assert.ok((await page.locator('[role="tabpanel"]').innerText()).trim().length > 20, "Assessment is empty");
      assert.deepEqual(errors, [], "Uncaught browser errors");
    } finally { await context.close(); }

    // Controlled dependency outage: no live or compact registry. The static
    // published records and explicit failure notice must remain usable.
    const degraded = await browser.newContext(options);
    try {
      await degraded.route(/VIGIL\.Incidents\.Index\.json|vigil-registry-fallback\.json/, route => route.abort());
      const page = await degraded.newPage();
      await page.goto(url(target), { waitUntil: "domcontentloaded" });
      const fallback = page.locator('[data-static-publication-fallback="vigil-case-index"]');
      await fallback.locator("[data-vigil-fallback-status]").filter({ hasText: /unavailable|could not|failed/i }).waitFor({ timeout: deadline });
      await fallback.locator("a[href^='/observatory/cases/VIGIL-INC-']").first().waitFor({ state: "visible" });
      await page.getByRole("link", { name: "Keep basic view" }).click();
      await fallback.locator("[data-vigil-fallback-status]").filter({ hasText: "Basic reading view" }).waitFor();
      assert.equal(await page.locator(row).count(), 0);
      // The SPA route cannot inherit direct-route HTML; it must offer a real
      // document navigation to the basic publication when the registry fails.
      await page.goto(url("/"), { waitUntil: "domcontentloaded" });
      if (options.isMobile) {
        await page.getByRole("button", { name: "Menu", exact: true }).click();
        await page.locator("#mobile-site-navigation").getByRole("link", { name: "Case Files", exact: true }).click();
      } else {
        await page.locator(".site-desktop-nav a.site-nav-root[href='/observatory/cases/']").click();
      }
      await page.getByRole("link", { name: "Open basic Case Files" }).click();
      await fallback.locator("a[href^='/observatory/cases/VIGIL-INC-']").first().waitFor({ state: "visible" });
    } finally { await degraded.close(); }
    const noBundle = await browser.newContext(options);
    try {
      await noBundle.route(/\/assets\/index-[^/]+\.js(?:\?|$)/, route => route.abort());
      const page = await noBundle.newPage();
      await page.goto(url(target), { waitUntil: "domcontentloaded" });
      await page.locator("[data-vigil-fallback-status]").filter({ hasText: /unavailable/i }).waitFor({ timeout: deadline });
      await page.locator('[data-static-publication-fallback="vigil-case-index"] a[href^="/observatory/cases/VIGIL-INC-"]').first().waitFor({ state: "visible" });
    } finally { await noBundle.close(); }
    console.log(name + ": live navigation, search, classification, assessment and dependency/bundle fallback passed");
  } finally { await browser.close(); }
}

await suite("desktop Chromium", chromium, { viewport: { width: 1440, height: 900 } });
await suite("mobile WebKit", webkit, devices["iPhone 13"]);
