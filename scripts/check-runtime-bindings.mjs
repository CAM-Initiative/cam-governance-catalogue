import ts from "typescript";
import { resolve, sep } from "node:path";
const path = ts.findConfigFile(".", ts.sys.fileExists, "tsconfig.json");
if (!path) throw new Error("tsconfig.json missing");
const config = ts.readConfigFile(path, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ".");
if (parsed.errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(parsed.errors, {
  getCurrentDirectory: ts.sys.getCurrentDirectory, getCanonicalFileName: x => x, getNewLine: () => "\n",
}));
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
const all = ts.getPreEmitDiagnostics(program);
// Establish an explicit narrow blocking gate for unresolved runtime bindings.
// Existing unrelated TypeScript debt must be audited before full strict gating.
const sourceRoot = resolve("src") + sep;
const blocking = all.filter(d => [2304, 2552, 18004].includes(d.code) && d.file && resolve(d.file.fileName).startsWith(sourceRoot));
const host = { getCurrentDirectory: ts.sys.getCurrentDirectory, getCanonicalFileName: x => x, getNewLine: () => "\n" };
if (all.length) console.log(ts.formatDiagnosticsWithColorAndContext(all, host));
console.log(`TypeScript diagnostics: ${all.length}; unresolved source binding diagnostics: ${blocking.length}`);
if (blocking.length) process.exitCode = 1;
