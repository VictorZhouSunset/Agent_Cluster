# Document Editor Markdown Preview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the shared dashboard document editor so files and skills show rendered Markdown by default, switch into edit mode with explicit controls, and keep the editor fully contained within the document card width.

**Architecture:** Keep the change inside the shared `documents` client feature so both `Files` and `Skills` inherit the new behavior without extra screen-specific logic. Add a Markdown rendering dependency for preview mode, extend the shared editor state machine to support preview/edit/cancel/save flows, and tighten width/overflow styles so the edit surface never grows past its card boundary.

**Tech Stack:** React 19, TypeScript, Vitest, `react-markdown`

---

### Task 1: Lock the new editor behavior with unit tests

**Files:**
- Modify: `src/client/features/documents/DocumentEditor.test.tsx`

**Step 1: Write the failing test**

Add editor tests that expect:
- rendered Markdown to appear in the default view mode
- an `Edit` button to reveal the textarea
- `Cancel` to return to preview mode without persisting changes
- `Save` to call `onSave` and keep width-constrained styles on the edit surface

**Step 2: Run test to verify it fails**

Run: `pnpm test -- DocumentEditor.test.tsx`
Expected: FAIL because the editor still renders a textarea immediately and has no preview/edit controls.

**Step 3: Write minimal implementation**

Update the shared editor component to introduce preview/edit state, Markdown rendering, and width-safe layout styles.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- DocumentEditor.test.tsx`
Expected: PASS

### Task 2: Verify integration through the files screen

**Files:**
- Modify: `src/client/features/files/FilesScreen.test.tsx`

**Step 1: Write the failing test**

Adjust file-screen coverage so it:
- waits for rendered Markdown in preview mode
- clicks `Edit` before mutating the textarea
- saves successfully through the shared editor flow

**Step 2: Run test to verify it fails**

Run: `pnpm test -- FilesScreen.test.tsx`
Expected: FAIL because the screen tests still assume the textarea is visible immediately.

**Step 3: Write minimal implementation**

Use the updated shared editor behavior without adding feature-specific workarounds.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- FilesScreen.test.tsx`
Expected: PASS

### Task 3: Ship the preview dependency and document the shared editor contract

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/client/features/documents/ARCH.md`

**Step 1: Add the dependency**

Install `react-markdown` with `pnpm`.

**Step 2: Update docs**

Refresh the documents feature architecture note so it describes preview/edit mode and the shared width constraints.

**Step 3: Run project validation**

Run:
- `pnpm test -- DocumentEditor.test.tsx FilesScreen.test.tsx`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

Expected: all commands succeed
