#!/usr/bin/env python3
# input: project root path, optional checkpoint/base/changed-paths, scope and gate summary from Phase E
# output: appended row in docs/green-checkpoints.md with timestamp, checkpoint chain, and changed path scope
# pos: checkpoint recorder that makes rollback target deterministic for software-dev workflow
# 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
"""
Record a green checkpoint after all Phase E gates pass.
"""

from __future__ import annotations

import argparse
import datetime as dt
import subprocess
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Record a green checkpoint.")
    parser.add_argument("--root", default=".", help="Project root path")
    parser.add_argument("--scope", required=True, help="Checkpoint scope summary")
    parser.add_argument("--gates", required=True, help="Gate result summary")
    parser.add_argument(
        "--checkpoint",
        default="",
        help="Explicit checkpoint id (defaults to git short hash or patch-<timestamp>)",
    )
    parser.add_argument(
        "--base",
        default="",
        help="Base checkpoint id (defaults to latest checkpoint in output file)",
    )
    parser.add_argument(
        "--changed-paths",
        default="",
        help="Comma-separated changed top-level paths (auto-derived when omitted)",
    )
    parser.add_argument(
        "--output",
        default="docs/green-checkpoints.md",
        help="Checkpoint markdown file path under root",
    )
    parser.add_argument(
        "--source",
        default="phase-e",
        help="Source of checkpoint creation",
    )
    return parser.parse_args()


def run_git(root: Path, *args: str) -> tuple[bool, str]:
    try:
        proc = subprocess.run(
            ["git", *args],
            cwd=root,
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return False, ""
    return proc.returncode == 0, proc.stdout.strip()


def detect_checkpoint_id(root: Path, explicit: str) -> str:
    if explicit:
        return explicit.strip()

    ok, inside = run_git(root, "rev-parse", "--is-inside-work-tree")
    if ok and inside == "true":
        ok, head = run_git(root, "rev-parse", "--short", "HEAD")
        if ok and head:
            return head

    ts = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    return f"patch-{ts}"


def is_git_commit_id(value: str) -> bool:
    if not value:
        return False
    if value.startswith("patch-"):
        return False
    return True


def parse_last_checkpoint(path: Path) -> str:
    if not path.exists():
        return ""
    lines = [line.strip() for line in path.read_text(encoding="utf-8", errors="ignore").splitlines()]
    for line in reversed(lines):
        if not line.startswith("|"):
            continue
        if "timestamp_utc" in line or "---" in line:
            continue
        cols = [c.strip() for c in line.strip("|").split("|")]
        if len(cols) >= 2 and cols[1]:
            return cols[1]
    return ""


def top_level_paths(paths: list[str]) -> str:
    items: set[str] = set()
    for p in paths:
        p = p.strip().replace("\\", "/")
        if not p:
            continue
        top = p.split("/", 1)[0]
        if top:
            items.add(top)
    if not items:
        return "-"
    return ",".join(sorted(items))


def derive_changed_paths(root: Path, base: str) -> str:
    ok, inside = run_git(root, "rev-parse", "--is-inside-work-tree")
    if not (ok and inside == "true"):
        return "-"

    # Prefer base..HEAD when base is a commit id.
    if is_git_commit_id(base):
        ok, _ = run_git(root, "rev-parse", "--verify", f"{base}^{{commit}}")
        if ok:
            ok, out = run_git(root, "diff", "--name-only", f"{base}..HEAD")
            if ok and out:
                return top_level_paths(out.splitlines())

    # Fallback to last commit delta.
    ok, out = run_git(root, "diff", "--name-only", "HEAD~1..HEAD")
    if ok and out:
        return top_level_paths(out.splitlines())

    # Final fallback to working tree status.
    ok, out = run_git(root, "status", "--porcelain")
    if ok and out:
        paths = []
        for line in out.splitlines():
            if len(line) < 4:
                continue
            paths.append(line[3:].strip())
        return top_level_paths(paths)

    return "-"


def escape_cell(text: str) -> str:
    return text.replace("|", r"\|").replace("\n", " ").strip()


def ensure_file(path: Path) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    header = (
        "# Green Checkpoints\n\n"
        "| timestamp_utc | checkpoint | base | changed_paths | scope | gates | source |\n"
        "| --- | --- | --- | --- | --- | --- | --- |\n"
    )
    path.write_text(header, encoding="utf-8")


def append_row(
    path: Path,
    checkpoint: str,
    base: str,
    changed_paths: str,
    scope: str,
    gates: str,
    source: str,
) -> None:
    timestamp = dt.datetime.now(dt.UTC).strftime("%Y-%m-%d %H:%M:%SZ")
    row = (
        f"| {escape_cell(timestamp)} | {escape_cell(checkpoint)} | {escape_cell(base)} | "
        f"{escape_cell(changed_paths)} | {escape_cell(scope)} | {escape_cell(gates)} | "
        f"{escape_cell(source)} |\n"
    )
    with path.open("a", encoding="utf-8") as f:
        f.write(row)


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    output = (root / args.output).resolve()
    base = args.base.strip() or parse_last_checkpoint(output) or "-"
    checkpoint = detect_checkpoint_id(root, args.checkpoint)
    changed_paths = args.changed_paths.strip() or derive_changed_paths(root, base)

    ensure_file(output)
    append_row(output, checkpoint, base, changed_paths, args.scope, args.gates, args.source)

    print(f"[green-checkpoint] file={output}")
    print(f"[green-checkpoint] checkpoint={checkpoint}")
    print(f"[green-checkpoint] base={base}")
    print(f"[green-checkpoint] changed_paths={changed_paths}")
    print(f"[green-checkpoint] scope={args.scope}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
