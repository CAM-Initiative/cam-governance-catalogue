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
    if normalized in WEBSITE_SOURCE_FILES:
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
