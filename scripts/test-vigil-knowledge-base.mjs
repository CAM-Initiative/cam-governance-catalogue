import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("../src/components/layout/Shell.tsx", import.meta.url), "utf8");
const knowledgeBase = readFileSync(new URL("../src/pages/vigil-knowledge-base.tsx", import.meta.url), "utf8");
const report = readFileSync(new URL("../src/pages/evidence-chain-report.tsx", import.meta.url), "utf8");

assert.match(app, /\/observatory\/knowledge-base\/:recordId/);
assert.match(app, /\/observatory\/knowledge-base/);
assert.match(shell, /Knowledge Base/);
assert.match(knowledgeBase, /Completed evidence chains translated into reusable governance lessons/);
assert.match(knowledgeBase, /record\.publicationStatus\.toLocaleLowerCase\(\) === "published"/);
assert.match(knowledgeBase, /The Ends Do Not Authorise the Means|reportTitle/);
assert.match(knowledgeBase, /bg-rose-900/);
assert.doesNotMatch(knowledgeBase, /bg-emerald|text-emerald|border-emerald/);

assert.match(report, /type ReportChain = RecordChain & \{ learns: string\[\] \}/);
assert.match(report, /No published LEARN record is linked/);
assert.match(report, /A separate Observation record is not required/);
assert.match(report, /state\.learnRecords\[0\]\?\.reportTitle/);
assert.match(report, /chain\.failureModes\.length > 0 && chain\.proposals\.length > 0 && chain\.patches\.length > 0/);
assert.match(report, /Abstracted learning/);
assert.match(report, /Failure taxonomy link/);
assert.doesNotMatch(report, /border-emerald|bg-emerald|text-emerald/);

console.log("VIGIL Knowledge Base UX contract checks passed.");
