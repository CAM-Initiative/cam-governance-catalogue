import { chromium, webkit, devices } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const origin = process.env.HEALTH_ORIGIN || "https://www.cam-initiative.org";
const target = "/observatory/cases/";
const expectedHtml = await readFile(process.env.HEALTH_EXPECTED_HTML, "utf8");
const url = (path) => new URL(path, origin).href;
const row = ".vigil-case-table-row-link";
const errors = [];
const deadline = 30_000;

async function checkLibrary(page) {
  await page.locator(row).first().waitFor({ state: "visible", timeout: deadline });
  assert.equal(await page.locator('[data-static-publication-fallback="vigil-case-index"]').count(), 0,
    "Interactive library must replace the static fallback");
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
      assert.equal((await response.text()).trim(), expectedHtml.trim(),
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
    } finally { await degraded.close(); }
    console.log(name + ": live navigation, search, classification, assessment and dependency fallback passed");
  } finally { await browser.close(); }
}

await suite("desktop Chromium", chromium, { viewport: { width: 1440, height: 900 } });
await suite("mobile WebKit", webkit, devices["iPhone 13"]);
