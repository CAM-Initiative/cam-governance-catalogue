#!/usr/bin/env python3
from pathlib import Path

REPORT = Path("src/pages/evidence-chain-report.tsx")
TEST = Path("scripts/test-vigil-knowledge-base.mjs")

sentence = "Section 01 is populated from the Failure Mode’s declared external sources. A separate Observation record is not required for this complete chain."
jsx_line = f'    {{isFailureEvidence && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{sentence}</p>}}\n'

report = REPORT.read_text(encoding="utf-8")
if jsx_line not in report:
    raise SystemExit("Expected Section 01 architecture-commentary JSX was not found; refusing an ambiguous edit.")
report = report.replace(jsx_line, "", 1)
REPORT.write_text(report, encoding="utf-8")

test = TEST.read_text(encoding="utf-8")
# Remove any obsolete assertion that requires the discarded public sentence.
test_lines = [line for line in test.splitlines(keepends=True) if sentence not in line]
test = "".join(test_lines)

marker = 'assert.doesNotMatch(reportSource, /A separate Observation record is not required/i, "Section 01 must not narrate internal OBS-versus-FM report architecture");\n'
if marker not in test:
    anchor = 'const reportSource = fs.readFileSync(reportPath, "utf8");\n'
    if anchor not in test:
        raise SystemExit("Could not locate reportSource test anchor.")
    test = test.replace(anchor, anchor + marker, 1)
TEST.write_text(test, encoding="utf-8")

print("Removed Section 01 architecture commentary and added regression coverage.")
