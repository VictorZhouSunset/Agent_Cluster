#!/usr/bin/env python3
# input: project root path, directory tree, source files, ARCH.md files
# output: contract validation findings and non-zero exit on errors
# pos: documentation contract gate for software-dev workflow
# 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
"""
Validate software-dev documentation contracts:
1) Source file header contract
2) ARCH.md presence and structure for non-generated directories
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path


DECL_ARCH = "一旦我所属的文件夹有所变化，请更新我。"
DECL_FILE = "一旦我被更新，务必更新我的开头注释以及所属文件夹的md。"
ARCH_TABLE_HEADER = "| file name | position | function |"

DEFAULT_EXCLUDE_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".idea",
    ".vscode",
    ".next",
    ".venv",
    ".pytest_cache",
    "__pycache__",
    "node_modules",
    "dist",
    "build",
    "target",
    "runtime",
    "cache",
    "vendor",
    "third_party",
    "third-party",
    ".codex",
}

SOURCE_EXTS = {
    ".c",
    ".cc",
    ".cpp",
    ".cs",
    ".go",
    ".h",
    ".hpp",
    ".java",
    ".js",
    ".jsx",
    ".kt",
    ".m",
    ".php",
    ".ps1",
    ".py",
    ".rb",
    ".rs",
    ".scala",
    ".sh",
    ".sql",
    ".swift",
    ".ts",
    ".tsx",
}


@dataclass
class Finding:
    level: str
    path: Path
    message: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate ARCH.md and source file header contracts.")
    parser.add_argument("--root", default=".", help="Project root path")
    parser.add_argument(
        "--max-files",
        type=int,
        default=30,
        help="When folder file count exceeds this, allow summarized ARCH.md table with omission marker",
    )
    parser.add_argument(
        "--exclude-dir",
        action="append",
        default=[],
        help="Directory name to exclude; can be passed multiple times",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat ARCH.md omission-marker mismatch as error instead of warning",
    )
    parser.add_argument(
        "--header-ext",
        action="append",
        default=[],
        help=(
            "Header-enforced file extension (example: --header-ext .py). "
            "Can be repeated; defaults to built-in whitelist."
        ),
    )
    return parser.parse_args()


def iter_dirs(root: Path, exclude_dirs: set[str]):
    for path in root.rglob("*"):
        if not path.is_dir():
            continue
        if any(part in exclude_dirs for part in path.parts):
            continue
        yield path


def normalize_ext(ext: str) -> str:
    ext = ext.strip().lower()
    if not ext:
        return ext
    if not ext.startswith("."):
        return "." + ext
    return ext


def configured_source_exts(cli_exts: list[str]) -> set[str]:
    if not cli_exts:
        return set(SOURCE_EXTS)
    return {normalize_ext(ext) for ext in cli_exts if normalize_ext(ext)}


def is_source_file(path: Path, source_exts: set[str]) -> bool:
    return path.suffix.lower() in source_exts


def read_head(path: Path, max_lines: int = 40) -> str:
    lines: list[str] = []
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        for _ in range(max_lines):
            line = f.readline()
            if line == "":
                break
            lines.append(line)
    return "".join(lines)


def check_source_headers(root: Path, exclude_dirs: set[str], source_exts: set[str]) -> list[Finding]:
    findings: list[Finding] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in exclude_dirs for part in path.parts):
            continue
        if path.name == "ARCH.md":
            continue
        if not is_source_file(path, source_exts):
            continue

        head = read_head(path)
        rel = path.relative_to(root)
        missing = []
        for token in ("input:", "output:", "pos:"):
            if token not in head:
                missing.append(token)
        if DECL_FILE not in head:
            missing.append("declaration")
        if missing:
            findings.append(
                Finding(
                    "error",
                    rel,
                    f"Missing file header items: {', '.join(missing)}",
                )
            )
    return findings


def check_arch_docs(root: Path, exclude_dirs: set[str], max_files: int, strict: bool) -> list[Finding]:
    findings: list[Finding] = []
    for d in iter_dirs(root, exclude_dirs):
        rel_dir = d.relative_to(root)

        # Check only non-empty directories after exclusions.
        files = [p for p in d.iterdir() if p.is_file() and p.name != "ARCH.md"]
        subdirs = [p for p in d.iterdir() if p.is_dir() and p.name not in exclude_dirs]
        if not files and not subdirs:
            continue

        arch = d / "ARCH.md"
        if not arch.exists():
            findings.append(Finding("error", rel_dir, "Missing ARCH.md"))
            continue

        text = arch.read_text(encoding="utf-8", errors="ignore")
        if DECL_ARCH not in text:
            findings.append(Finding("error", arch.relative_to(root), "Missing ARCH declaration line"))
        if ARCH_TABLE_HEADER not in text:
            findings.append(Finding("error", arch.relative_to(root), "Missing ARCH table header"))

        # File-count scaling policy check.
        visible_files = [p for p in d.iterdir() if p.is_file()]
        if len(visible_files) > max_files:
            table_lines = [
                line.strip()
                for line in text.splitlines()
                if line.strip().startswith("|") and "file name" not in line and "---" not in line
            ]
            listed_count = len(table_lines)
            omitted_marker = (
                "其余为 support/generated" in text
                or "others are support/generated" in text
            )
            if listed_count < len(visible_files) and not omitted_marker:
                level = "error" if strict else "warning"
                findings.append(
                    Finding(
                        level,
                        arch.relative_to(root),
                        "Folder exceeds max-files; add omission marker `其余为 support/generated`",
                    )
                )

    return findings


def print_findings(findings: list[Finding]) -> None:
    for f in findings:
        print(f"[{f.level}] {f.path.as_posix()} - {f.message}")


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    exclude_dirs = set(DEFAULT_EXCLUDE_DIRS)
    exclude_dirs.update(args.exclude_dir)
    source_exts = configured_source_exts(args.header_ext)

    findings = []
    findings.extend(check_source_headers(root, exclude_dirs, source_exts))
    findings.extend(check_arch_docs(root, exclude_dirs, args.max_files, args.strict))
    print_findings(findings)

    errors = [f for f in findings if f.level == "error"]
    warnings = [f for f in findings if f.level == "warning"]
    print(
        f"[docscheck] errors={len(errors)} warnings={len(warnings)} total={len(findings)} "
        f"header_exts={','.join(sorted(source_exts))}"
    )
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
