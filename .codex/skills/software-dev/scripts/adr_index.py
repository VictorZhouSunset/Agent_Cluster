#!/usr/bin/env python3
# input: project root path, ADR markdown files under docs/adr
# output: generated docs/adr/index.md summary table and process exit status
# pos: documentation automation utility for ADR indexing
# 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
"""
Generate docs/adr/index.md from ADR markdown files.

Naming convention (default):
  ADR-0001-YYYYMMDD-title.md
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
from pathlib import Path


NAME_RE = re.compile(r"^ADR-(?P<seq>\d{4})-(?P<date>\d{8})-(?P<slug>[a-z0-9-]+)\.md$")
STATUS_RE = re.compile(r"^Status:\s*(.+)\s*$", re.IGNORECASE | re.MULTILINE)
TITLE_RE = re.compile(r"^\s*#\s*(.+?)\s*$", re.MULTILINE)
LINKS_RE = re.compile(r"^Links:\s*(.+)\s*$", re.IGNORECASE | re.MULTILINE)
TITLE_ID_RE = re.compile(r"^\s*#\s*(ADR-\d{4})\s*:\s*(.+?)\s*$", re.MULTILINE)
STATUS_SUPERSEDED_RE = re.compile(r"Superseded\s+by\s+(ADR-\d{4})", re.IGNORECASE)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate ADR index markdown.")
    parser.add_argument("--root", default=".", help="Project root path")
    parser.add_argument("--adr-dir", default="docs/adr", help="ADR directory under root")
    parser.add_argument("--output", default="docs/adr/index.md", help="Output index file")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero when ADR filename does not match convention",
    )
    return parser.parse_args()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def extract_field(pattern: re.Pattern[str], text: str, fallback: str) -> str:
    match = pattern.search(text)
    if not match:
        return fallback
    return match.group(1).strip()


def build_index(root: Path, adr_dir: Path) -> tuple[list[dict], list[Path], list[str]]:
    rows: list[dict] = []
    invalid: list[Path] = []
    semantic_issues: list[str] = []

    for path in sorted(adr_dir.glob("*.md")):
        if path.name.lower() in {"index.md", "arch.md", "readme.md"}:
            continue
        m = NAME_RE.match(path.name)
        if not m:
            invalid.append(path)
            continue

        text = read_text(path)
        title = extract_field(TITLE_RE, text, m.group("slug").replace("-", " "))
        status = extract_field(STATUS_RE, text, "Unknown")
        links = extract_field(LINKS_RE, text, "-")
        expected_id = f"ADR-{m.group('seq')}"
        title_match = TITLE_ID_RE.search(text)
        if not title_match:
            semantic_issues.append(f"{path.name}: title must be `# {expected_id}: <title>`")
        else:
            title_id = title_match.group(1).upper()
            title = f"{title_id}: {title_match.group(2).strip()}"
            if title_id != expected_id:
                semantic_issues.append(
                    f"{path.name}: title id `{title_id}` does not match filename id `{expected_id}`"
                )
        superseded_match = STATUS_SUPERSEDED_RE.search(status)
        if "superseded by" in status.lower() and not superseded_match:
            semantic_issues.append(
                f"{path.name}: status supersede reference must use canonical id `ADR-0001`"
            )
        rel = path.relative_to(root).as_posix()
        rows.append(
            {
                "seq": int(m.group("seq")),
                "adr_id": expected_id,
                "date": m.group("date"),
                "title": title,
                "status": status,
                "links": links,
                "path": rel,
            }
        )

    rows.sort(key=lambda x: (x["seq"], x["date"], x["title"].lower()))
    return rows, invalid, semantic_issues


def render_index(rows: list[dict], invalid: list[Path], semantic_issues: list[str], root: Path) -> str:
    now = dt.datetime.now(dt.UTC).strftime("%Y-%m-%d %H:%M:%SZ")
    lines: list[str] = []
    lines.append("# ADR Index")
    lines.append("")
    lines.append(f"Generated: {now}")
    lines.append("")
    lines.append("| adr_id | date | title | status | links |")
    lines.append("| --- | --- | --- | --- | --- |")

    for row in rows:
        lines.append(
            f"| {row['adr_id']} | {row['date']} | [{row['title']}]({row['path']}) | "
            f"{row['status']} | {row['links']} |"
        )

    if not rows:
        lines.append("| - | - | - | - | - |")

    lines.append("")
    lines.append("## Convention")
    lines.append("- Filename: `ADR-0001-YYYYMMDD-title.md`")
    lines.append("- Canonical ADR ID: `ADR-0001` (use in title/status/index)")
    lines.append("- Required fields: `Status:` and `Links:`")
    lines.append("- Links format: `Links: C4:<path>#<element>; Module:<folder>`")
    lines.append("")

    if invalid:
        lines.append("## Invalid ADR Filenames")
        for path in invalid:
            rel = path.relative_to(root).as_posix()
            lines.append(f"- `{rel}`")
        lines.append("")

    if semantic_issues:
        lines.append("## ADR Semantic Issues")
        for issue in semantic_issues:
            lines.append(f"- {issue}")
        lines.append("")

    return "\n".join(lines) + "\n"


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    adr_dir = (root / args.adr_dir).resolve()
    output = (root / args.output).resolve()

    if not adr_dir.exists():
        adr_dir.mkdir(parents=True, exist_ok=True)
        print(f"[adr-index] Created missing ADR directory: {adr_dir}")

    rows, invalid, semantic_issues = build_index(root, adr_dir)
    content = render_index(rows, invalid, semantic_issues, root)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")

    print(f"[adr-index] Wrote: {output}")
    print(f"[adr-index] ADR rows: {len(rows)}")
    if invalid:
        print(f"[adr-index] Invalid filenames: {len(invalid)}")
    if semantic_issues:
        print(f"[adr-index] Semantic issues: {len(semantic_issues)}")
    if args.strict and (invalid or semantic_issues):
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
