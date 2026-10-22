import test from "node:test";
import assert from "node:assert/strict";
import { countryFromJurisdictionString } from "../src/lib/vigilCountryMatching.mjs";

const countries = [
  { id: "US", name: "United States" }, { id: "AU", name: "Australia" },
  { id: "CN", name: "China" }, { id: "CA", name: "Canada" },
  { id: "GB", name: "United Kingdom" }, { id: "HK", name: "Hong Kong" },
  { id: "FR", name: "France" }, { id: "SG", name: "Singapore" },
  { id: "NO", name: "Norway" },
];
const aliases = { US: ["usa"], AU: ["new south wales"], GB: ["wales"] };
const match = value => countryFromJurisdictionString(value, countries, aliases)?.id;

test("maps an explicit country or country-qualified locality", () => {
  assert.equal(match("Australia"), "AU");
  assert.equal(match("Perth, Western Australia, Australia"), "AU");
  assert.equal(match("United Kingdom / Wales"), "GB");
  assert.equal(match("France / European Union"), "FR");
  assert.equal(match("New Jersey, United States"), "US");
});
test("refuses multiple named jurisdictions, global and unresolved labels", () => {
  for (const value of [
    "United States / Canada", "Singapore / Norway",
    "United States / Singapore / China-linked entities",
    "Thailand / Hong Kong-hosted attacker infrastructure",
    "global", "global online service",
    "cross-border / United States and China",
    "not established", "Not applicable — controlled training", "",
  ]) assert.equal(match(value), undefined, value);
});
