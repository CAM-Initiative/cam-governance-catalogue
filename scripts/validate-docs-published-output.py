#!/usr/bin/env python3
"""Validate that website source edits update the published /docs output.

This repository publishes GitHub Pages from docs/. The guard is intentionally
repo-level and diff-based: when website source files change in a branch or local
working tree, the same diff must include the corresponding generated output.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Iterable

DOCS_OUTPUT_PREFIX = "docs/"
GENERATED_ASSET_PREFIX = "docs/assets/"
GENERATED_ENTRYPOINTS = {
    "docs/index.html",
    "docs/404.html",
}
PUBLIC_SOURCE_PREFIX = "src/public/"
SOURCE_ENTRYPOINT = "src/index.html"
VIGIL_FALLBACK = Path("docs/data/vigil-registry-fallback.json")
VIGIL_SITEMAP = Path("docs/sitemap.xml")
VIGIL_CASE_ROOT = Path("docs/observatory/cases")
VIGIL_CASE_URL_PREFIX = "https://www.cam-initiative.org/observatory/cases/"
LEGACY_SITEMAP_URLS = {
    "https://www.cam-initiative.org/catalogue",
    "https://www.cam-initiative.org/phoenix-covenant",
    "https://www.cam-initiative.org/vigil",
}

# The website is a Vite app rooted at src/ (see vite.config.ts). Keep this list
# intentionally focused on files that feed the published site, and avoid VIGIL
# record data, schemas, validators, and repository documentation.
WEBSITE_SOURCE_PREFIXES = (
    "src/",
)

# Build/export metadata that can change the generated /docs entrypoints/assets.
WEBSITE_SOURCE_FILES = (
    "vite.config.ts",
    "scripts/prepare-github-pages.js",
)

IGNORED_SOURCE_PREFIXES = (
    "docs/",
    ".github/",
)


def run_git(args: list[str], *, check: bool = True) -> str:
    result = subprocess.run(
        ["git", *args],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if check and result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"git {' '.join(args)} failed: {message}")
    return result.stdout.strip()


def repo_root() -> Path:
    return Path(run_git(["rev-parse", "--show-toplevel"])).resolve()


def ref_exists(ref: str) -> bool:
    if not ref:
        return False
    result = subprocess.run(
        ["git", "rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        text=True,
    )
    return result.returncode == 0


def event_base_sha() -> str | None:
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        return None
    try:
        event = json.loads(Path(event_path).read_text())
    except (OSError, json.JSONDecodeError):
        return None

    pull_request = event.get("pull_request") or {}
    base_sha = ((pull_request.get("base") or {}).get("sha") or "").strip()
    if base_sha:
        return base_sha

    before = (event.get("before") or "").strip()
    if before and set(before) != {"0"}:
        return before

    return None


def resolve_base_ref(explicit_base: str | None) -> str:
    candidates = [
        explicit_base,
        os.environ.get("DOCS_VALIDATION_BASE_SHA"),
        os.environ.get("GITHUB_BASE_SHA"),
        event_base_sha(),
        os.environ.get("GITHUB_BASE_REF") and f"origin/{os.environ['GITHUB_BASE_REF']}",
        "origin/main",
        "main",
        "origin/master",
        "master",
        "HEAD~1",
    ]

    for candidate in candidates:
        if candidate and ref_exists(candidate):
            return candidate

    raise RuntimeError(
        "Could not determine a git base ref for docs publication validation. "
        "Pass --base <ref>, set DOCS_VALIDATION_BASE_SHA, or fetch origin/main."
    )


def committed_changed_paths(base_ref: str) -> set[str]:
    # Compare against the merge base so local branches and PR branches both work.
    merge_base = run_git(["merge-base", base_ref, "HEAD"])
    diff_output = run_git(["diff", "--name-only", "--diff-filter=ACMRTUXB", merge_base, "HEAD"])
    return {line.strip() for line in diff_output.splitlines() if line.strip()}


def local_changed_paths() -> set[str]:
    # Include staged and unstaged local edits so contributors can run the guard
    # before committing. CI checkouts are clean, so this is a no-op there.
    paths: set[str] = set()
    for args in (
        ["diff", "--name-only", "--diff-filter=ACMRTUXB"],
        ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"],
        ["ls-files", "--others", "--exclude-standard"],
    ):
        output = run_git(args)
        paths.update(line.strip() for line in output.splitlines() if line.strip())
    return paths


def normalize(path: str) -> str:
    return path.replace(os.sep, "/").lstrip("./")


def is_docs_output(path: str) -> bool:
    return normalize(path).startswith(DOCS_OUTPUT_PREFIX)


def is_website_source(path: str) -> bool:
    normalized = normalize(path)
    if any(normalized.startswith(prefix) for prefix in IGNORED_SOURCE_PREFIXES):
        return False
    if normalized in WEBSITE_SOURCE_FILES:
        return True
    return any(normalized.startswith(prefix) for prefix in WEBSITE_SOURCE_PREFIXES)


def is_bundle_source(path: str) -> bool:
    normalized = normalize(path)
    # vite.config.ts can alter the generated bundle. The Pages post-processor
    # changes route entrypoints/sitemap without necessarily changing hashed assets.
    if normalized == "vite.config.ts":
        return True
    return (
        normalized.startswith("src/")
        and not normalized.startswith(PUBLIC_SOURCE_PREFIX)
        and normalized != SOURCE_ENTRYPOINT
    )


def expected_public_output(path: str) -> str | None:
    normalized = normalize(path)
    if not normalized.startswith(PUBLIC_SOURCE_PREFIX):
        return None
    relative_path = normalized.removeprefix(PUBLIC_SOURCE_PREFIX)
    return f"docs/{relative_path}"


def format_paths(paths: Iterable[str]) -> str:
    sorted_paths = sorted(paths)
    if not sorted_paths:
        return "  (none)"
    return "\n".join(f"  - {path}" for path in sorted_paths[:40]) + (
        f"\n  ... and {len(sorted_paths) - 40} more" if len(sorted_paths) > 40 else ""
    )



def validate_vigil_publication_integrity() -> list[str]:
    """Verify that published VIGIL cases, fallback data, and sitemap stay in lockstep."""
    errors: list[str] = []

    for required_path in (VIGIL_FALLBACK, VIGIL_SITEMAP, VIGIL_CASE_ROOT):
        if not required_path.exists():
            errors.append(f"Required VIGIL publication artifact is missing: {required_path}")
    if errors:
        return errors

    try:
        fallback = json.loads(VIGIL_FALLBACK.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        return [f"Could not parse {VIGIL_FALLBACK}: {exc}"]

    records = fallback.get("records")
    if not isinstance(records, list):
        return [f"{VIGIL_FALLBACK} must contain a records array."]

    record_ids = [
        record.get("id")
        for record in records
        if isinstance(record, dict)
        and record.get("record_type") == "incident"
        and isinstance(record.get("id"), str)
    ]
    if len(record_ids) != len(records):
        errors.append(
            f"{VIGIL_FALLBACK} contains non-Incident records or records without string ids."
        )

    declared_count = fallback.get("record_count")
    if declared_count != len(record_ids):
        errors.append(
            f"{VIGIL_FALLBACK} declares record_count={declared_count!r}, "
            f"but contains {len(record_ids)} Incident records."
        )

    duplicates = sorted({record_id for record_id in record_ids if record_ids.count(record_id) > 1})
    if duplicates:
        errors.append(
            "Duplicate Incident ids in VIGIL fallback: " + ", ".join(duplicates)
        )

    try:
        sitemap_root = ET.parse(VIGIL_SITEMAP).getroot()
    except (OSError, ET.ParseError) as exc:
        return errors + [f"Could not parse {VIGIL_SITEMAP}: {exc}"]

    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_urls = [
        loc.text.strip()
        for loc in sitemap_root.findall("sm:url/sm:loc", namespace)
        if loc.text and loc.text.strip()
    ]
    legacy_sitemap_urls = sorted(
        url for url in sitemap_urls if url.rstrip("/") in LEGACY_SITEMAP_URLS
    )
    if legacy_sitemap_urls:
        errors.append(
            "Retired legacy URLs must not appear in docs/sitemap.xml: "
            + ", ".join(legacy_sitemap_urls)
        )
    noncanonical_directory_urls = sorted(
        url for url in sitemap_urls
        if url != "https://www.cam-initiative.org/" and not url.endswith("/")
    )
    if noncanonical_directory_urls:
        errors.append(
            "Directory-backed sitemap URLs must use trailing slashes: "
            + ", ".join(noncanonical_directory_urls[:10])
            + (" ..." if len(noncanonical_directory_urls) > 10 else "")
        )

    sitemap_case_ids = [
        url.removeprefix(VIGIL_CASE_URL_PREFIX).rstrip("/")
        for url in sitemap_urls
        if url.startswith(VIGIL_CASE_URL_PREFIX)
        and url.removeprefix(VIGIL_CASE_URL_PREFIX).rstrip("/").startswith("VIGIL-INC-")
    ]

    record_id_set = set(record_ids)
    sitemap_id_set = set(sitemap_case_ids)
    missing_from_sitemap = sorted(record_id_set - sitemap_id_set)
    stale_in_sitemap = sorted(sitemap_id_set - record_id_set)
    if missing_from_sitemap:
        errors.append(
            "Incident records missing from docs/sitemap.xml: "
            + ", ".join(missing_from_sitemap)
        )
    if stale_in_sitemap:
        errors.append(
            "Stale Incident URLs remain in docs/sitemap.xml: "
            + ", ".join(stale_in_sitemap)
        )
    if len(sitemap_case_ids) != len(sitemap_id_set):
        errors.append("docs/sitemap.xml contains duplicate VIGIL Incident URLs.")

    published_case_ids = {
        entry.name
        for entry in VIGIL_CASE_ROOT.iterdir()
        if entry.is_dir()
        and entry.name.startswith("VIGIL-INC-")
        and (entry / "index.html").is_file()
    }

    for record_id in sorted(record_id_set & published_case_ids):
        page_path = VIGIL_CASE_ROOT / record_id / "index.html"
        page_html = page_path.read_text()
        expected_canonical = f'{VIGIL_CASE_URL_PREFIX}{record_id}/'
        if f'<link rel="canonical" href="{expected_canonical}" />' not in page_html:
            errors.append(
                f"{page_path} does not declare the trailing-slash canonical {expected_canonical}"
            )
    missing_case_pages = sorted(record_id_set - published_case_ids)
    orphan_case_pages = sorted(published_case_ids - record_id_set)
    if missing_case_pages:
        errors.append(
            "Incident records missing published case entrypoints: "
            + ", ".join(missing_case_pages)
        )
    if orphan_case_pages:
        errors.append(
            "Published VIGIL case entrypoints have no fallback record: "
            + ", ".join(orphan_case_pages)
        )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fail when website source changed but published docs/ output did not."
    )
    parser.add_argument(
        "--base",
        help="Git ref/SHA to compare against. Defaults to PR base, push before SHA, origin/main, main, or HEAD~1.",
    )
    args = parser.parse_args()

    os.chdir(repo_root())
    base_ref = resolve_base_ref(args.base)
    changed_paths = committed_changed_paths(base_ref) | local_changed_paths()

    normalized_changes = {normalize(path) for path in changed_paths}
    website_source_changes = {path for path in normalized_changes if is_website_source(path)}
    docs_changes = {path for path in normalized_changes if is_docs_output(path)}
    bundle_source_changes = {path for path in website_source_changes if is_bundle_source(path)}
    generated_asset_changes = {
        path for path in docs_changes if path.startswith(GENERATED_ASSET_PREFIX)
    }
    entrypoint_source_changed = SOURCE_ENTRYPOINT in website_source_changes
    generated_entrypoint_changes = docs_changes & GENERATED_ENTRYPOINTS
    expected_public_outputs = {
        output
        for path in website_source_changes
        if (output := expected_public_output(path)) is not None
    }
    missing_public_outputs = expected_public_outputs - docs_changes

    print(f"Docs publication validator base ref: {base_ref}")
    print(f"Website source changes detected: {len(website_source_changes)}")
    print(f"Bundle-producing source changes detected: {len(bundle_source_changes)}")
    print(f"Generated asset changes detected: {len(generated_asset_changes)}")
    print(f"/docs output changes detected: {len(docs_changes)}")

    errors: list[str] = []
    errors.extend(validate_vigil_publication_integrity())

    if website_source_changes and not docs_changes:
        errors.append(
            "Website source files changed, but `/docs` was not updated at all."
        )

    if bundle_source_changes and not generated_asset_changes:
        errors.append(
            "Application source changed, but no rebuilt file under `docs/assets/` is present. "
            "A PDF, favicon, sitemap, or other unrelated `/docs` change cannot satisfy the build guard."
        )

    if entrypoint_source_changed and not generated_entrypoint_changes:
        errors.append(
            "`src/index.html` changed, but neither `docs/index.html` nor `docs/404.html` was regenerated."
        )

    if missing_public_outputs:
        errors.append(
            "Files under `src/public/` changed without their matching published `/docs` files."
        )

    if errors:
        print("\nERROR: Published GitHub Pages output is stale or incomplete.\n", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        print("\nWebsite source changes:", file=sys.stderr)
        print(format_paths(website_source_changes), file=sys.stderr)
        print("\nGenerated asset changes:", file=sys.stderr)
        print(format_paths(generated_asset_changes), file=sys.stderr)
        if missing_public_outputs:
            print("\nMissing public outputs:", file=sys.stderr)
            print(format_paths(missing_public_outputs), file=sys.stderr)
        print(
            "\nRun the site build/export step before reporting the website update as complete.",
            file=sys.stderr,
        )
        return 1

    if website_source_changes:
        print("PASS: website source changes have corresponding generated Pages output.")
    elif docs_changes:
        print("PASS: /docs output changed without website source changes.")
    else:
        print("PASS: no website source changes requiring /docs output updates.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
