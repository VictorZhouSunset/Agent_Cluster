---
name: software-dev
description: Use when leading AI-driven software development that requires architecture decisions, C4 structure, ADR traceability, and strict TDD execution with folder/file documentation contracts.
---

# Software Development (ADR + C4 + TDD)

## Overview

Run AI-led development with explicit artifacts, strict execution order, and hard verification gates.

**Required background:** `superpowers:test-driven-development`

## Execution Phases (Strict Order)

Do not run phases in parallel.

1. **Phase A - Scope + Gates**
- Define task scope and acceptance checks.
- Define gate commands:
  - `ITER_GATES_CMD` for fast iteration gates.
  - `FULL_GATES_CMD` for final full gates.
- Define documentation commands:
  - `ADR_INDEX_CMD` (example: `python skills/software-dev/scripts/adr_index.py --root .`)
  - `DOCSCHECK_CMD` (example: `python skills/software-dev/scripts/docscheck.py --root .`)
  - `GREEN_CHECKPOINT_CMD` (example: `python skills/software-dev/scripts/green_checkpoint.py --root . --scope "<scope>" --gates "<summary>"`)
- Exit Phase A only when gate commands are explicit.

2. **Phase B - Architecture Decisions**
- Check ADR trigger conditions.
- If triggered: create/update ADR first, then update C4.
- Exit Phase B only when ADR/C4 artifacts are updated or explicitly marked not required.

3. **Phase C - TDD Delivery**
- Execute RED -> GREEN -> REFACTOR in small steps.
- One behavior per loop.
- Exit Phase C only when scoped behaviors are implemented and tests pass locally.

4. **Phase D - Documentation Sync**
- Update file header first for each changed file.
- Update owning folder `ARCH.md` immediately after.
- Exit Phase D only when headers and folder tables are synchronized.

5. **Phase E - Full Verification + Report**
- Run `FULL_GATES_CMD`.
- Run `ADR_INDEX_CMD`, `DOCSCHECK_CMD`, and `GREEN_CHECKPOINT_CMD`.
- Emit iteration report using the required template.
- On all-green gates, create a green checkpoint immediately.
- Stop only on all-green checkpoints or explicit rollback/escalation decision.

## Loop Protocol (Per Iteration)

Run this exact loop:

1. Plan one minimal behavior.
2. Write one failing test (RED).
3. Implement minimal code (GREEN).
4. Refactor while keeping tests green.
5. Update file header + folder `ARCH.md`.
6. Run `ITER_GATES_CMD`.
7. Emit one iteration report.

Stop conditions:

- Success stop: acceptance met, all gates green, and green checkpoint recorded.
- Safety stop: after `N=3` consecutive failed fix attempts on the same gate, rollback to last green point and re-scope.

Green checkpoint rule:

- Whenever Phase E is fully green, record checkpoint using one of:
  - A commit hash (preferred).
  - A patch id if commit is unavailable.
- Append checkpoint to `docs/green-checkpoints.md`:
  - timestamp, checkpoint hash/id, base checkpoint, changed_paths, scope, gate summary.

## Triggers (Deterministic)

### ADR Trigger Rules (Any true => ADR required)

- Store ADR files in `docs/adr/ADR-0001-YYYYMMDD-title.md`.
- Canonical ADR ID is `ADR-0001` and must match filename, title, supersede reference, and ADR index entry.
- Trigger when one or more of these happen:
  - Add/split/remove service or container.
  - Introduce new database, queue, or external dependency.
  - Change module boundaries or public interfaces.
  - Change auth model, primary key strategy, or consistency strategy.
  - Make tradeoffs among performance/cost/reliability goals.
- Required sections: `Status`, `Context`, `Decision`, `Consequences`, `Alternatives`.
- Required link field:
  - `Links: C4:<path>#<element>; Module:<folder>`
- Do not delete old ADRs; supersede with a new ADR and cross-link.
- Generate/update ADR index after ADR changes:
  - `python skills/software-dev/scripts/adr_index.py --root .`

Minimal ADR template:

```md
# ADR-0001: <title>
Status: Proposed | Accepted | Superseded by ADR-0007
Links: C4:docs/architecture/c4/workspace.dsl#<element>; Module:src/modules/<name>

## Context
## Decision
## Consequences
## Alternatives Considered
```

### C4 Trigger Rules (Any true => C4 update required)

- Keep C4 artifacts in `docs/architecture/c4/`.
- Canonical C4 source format is **Structurizr DSL** (`*.dsl`).
- Canonical C4 source file is `docs/architecture/c4/workspace.dsl` unless a documented exception ADR exists.
- Optional render exports (PlantUML/Mermaid/images) are derived artifacts, not source of truth.
- Update when boundaries/dependencies/runtime units change.
- Maintain at least L1 and L2 for non-trivial projects; add L3 for complex containers.
- Every C4 element in `workspace.dsl` must have a stable identifier for ADR `Links` targeting.
- Hard binding rules:
  - L2 Container must map to a runnable unit (independently deployable/startable/testable).
  - L3 Component must map to a first-level module directory (example: `src/modules/user/*`).
- C4 label names must match folder/service names.

## Artifacts + Commands (Project Contract)

### Quality Gate Commands

Project must define concrete commands before delivery. Default profiles:

- JS/TS:
  - `ITER_GATES_CMD=pnpm lint && pnpm typecheck && pnpm test`
  - `FULL_GATES_CMD=pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- Python:
  - `ITER_GATES_CMD=ruff check . && mypy . && pytest`
  - `FULL_GATES_CMD=ruff check . && mypy . && pytest && python -m build`

If a command is unavailable, declare replacement in Phase A and use it consistently.

Documentation automation commands (recommended defaults):

- `ADR_INDEX_CMD=python skills/software-dev/scripts/adr_index.py --root .`
- `DOCSCHECK_CMD=python skills/software-dev/scripts/docscheck.py --root .`
- `GREEN_CHECKPOINT_CMD=python skills/software-dev/scripts/green_checkpoint.py --root . --scope "<scope>" --gates "<summary>"`
- `DOCSCHECK_HEADER_EXTS=.py,.ts,.tsx,.go,.rs` (example project profile)

### Local Tooling Strategy (Recommended)

Use local CLI tools to reduce scan/edit cost and keep loop latency low.

- `rg` (ripgrep): default text/code search.
- `fd`: default file discovery.
- `bat`: readable file preview during triage.
- `fzf`: interactive narrowing over `rg`/`fd` results.
- `sg` (ast-grep): syntax-aware refactor/query; prefer over regex replacement for structural edits.
- `semgrep`: rule-based code/security/architecture checks; integrate into gates.
- `rga`: text search across rich docs/binaries (pdf/doc/etc.) for ADR/C4 evidence lookup.
- `ctags`: symbol index for large-repo navigation and call-surface mapping.

Phase usage:

- Phase A/B: `fd + rg + rga + bat` for scope and architecture evidence collection.
- Phase C/D: `sg` for structured edits; `rg` for assertion/backfill checks.
- Phase E: run `semgrep` as a gate (at least in `FULL_GATES_CMD`).

Semgrep gate integration example:

- JS/TS:
  - `ITER_GATES_CMD=pnpm lint && pnpm typecheck && pnpm test`
  - `FULL_GATES_CMD=pnpm lint && pnpm typecheck && pnpm test && pnpm build && semgrep --error`
- Python:
  - `ITER_GATES_CMD=ruff check . && mypy . && pytest`
  - `FULL_GATES_CMD=ruff check . && mypy . && pytest && python -m build && semgrep --error`

### Failure Handling and Rollback

When any gate fails:

1. Classify failure type: `lint | type | test | build`.
2. Apply minimal fix for that type only.
3. Re-run gates.

If the same type fails 3 times consecutively:

1. Roll back to last known green point (commit or patch).
2. Re-scope into smaller behavior.
3. Resume loop from RED.

Last green point definition:

- The most recent checkpoint recorded in `docs/green-checkpoints.md` from an all-green Phase E run.

## Documentation Contracts (Mandatory)

### Folder `ARCH.md` Contract

For **every** development folder, create `ARCH.md` (except generated folders such as `runtime`, `cache`, `dist`, `build`, `target`, `.next`, `node_modules`, `.venv`, `__pycache__`, `.git`).

`ARCH.md` must contain:

1. A minimal architecture summary in <= 3 lines.
2. The following declaration line:
   `一旦我所属的文件夹有所变化，请更新我。`
3. A file table: `file name | position | function`.

File table scope rule:

- Recommended: list all files grouped as `key | support | generated`.
- Minimum allowed: list all stable entrypoints and key files.
- If only minimum is used, explicitly mark omitted groups.
- Scaling hard rule: when file count in folder > 30, default to minimum mode and add:
  - `其余为 support/generated`

Minimal template:

```md
# <folder-name>
<line 1>
<line 2>
<line 3>
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| <file> | <role in folder> | <what it does> |
```

### File Header Contract

At the top of each source file, add 3 minimal lines (use language-appropriate comment syntax):

- `input: <external dependencies/inbound data>`
- `output: <public outputs/effects>`
- `pos: <position in local system>`

Then add this declaration:

`一旦我被更新，务必更新我的开头注释以及所属文件夹的md。`

Example (TypeScript):

```ts
// input: HTTP request payload, config, domain services
// output: validated command result + domain events
// pos: application service orchestrator in user module
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
```

Sync rule:

1. Update file header first after editing the file.
2. Update owning folder `ARCH.md` in the same iteration.
3. Never defer doc sync to end-of-task bulk cleanup.

Validation rule:

- Run docs contract validator in Phase E:
  - `python skills/software-dev/scripts/docscheck.py --root .`
- Header enforcement applies only to configured source extensions (default whitelist; override with `--header-ext`).
- `vendor`, `third_party`, and generated folders are excluded from header enforcement.
- Record checkpoint in Phase E:
  - `python skills/software-dev/scripts/green_checkpoint.py --root . --scope "<scope>" --gates "<summary>" --base "<prev_checkpoint_optional>" --changed-paths "<top_level1,top_level2>"`

## Iteration Report (Required Output)

Emit this after each loop:

```md
### Iteration Report
- Files changed: <list>
- ADR/C4 changes: <none or ADR id + C4 files>
- Commands run: <command list>
- Gate results: <pass/fail summary>
- Next 1-3 minimal behaviors:
  1. <behavior>
  2. <behavior>
  3. <behavior>
```

## Completion Criteria

- Phase A-E completed in order.
- ADR/C4 updated when triggers fire.
- Every changed file has compliant header comments.
- Every affected folder has synchronized `ARCH.md`.
- Full gates pass.
- Green checkpoint recorded.
- Final iteration report emitted.

## Canonical References

- ADR hub: `https://adr.github.io/`
- C4 model: `https://c4model.com/`
