# Grotesque Visual Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh the Gate Dashboard into a Swiss-inspired Grotesque dark interface with stronger whitespace, restrained contrast, and a free Diatype-like font while preserving all existing behavior.

**Architecture:** Keep the current React + Vite client structure intact and focus the change on the shared shell, typography tokens, and reusable surface classes in the global stylesheet. Validate the refresh with a small UI test around the shell markup so the typography and structural cues stay stable while the screen features keep their data logic untouched.

**Tech Stack:** React 19, TypeScript, Vitest, global CSS, Vite

---

### Task 1: Lock the shell text structure with a failing UI test

**Files:**
- Modify: `D:\2025-27_CS_AI\Projects\Agent_Cluster\src\client\layout\AppShell.test.tsx`
- Modify: `D:\2025-27_CS_AI\Projects\Agent_Cluster\src\client\layout\AppShell.tsx`

**Step 1: Write the failing test**

Assert that the shell exposes a stable Grotesque-oriented brand structure such as:
- a brand title element
- a brand supporting copy block
- a toolbar context area

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/client/layout/AppShell.test.tsx`

Expected: FAIL because the current shell markup does not yet expose the refined visual structure.

**Step 3: Write minimal implementation**

Adjust `AppShell.tsx` only enough to support the approved typography hierarchy and supporting copy hooks.

**Step 4: Run the test to verify it passes**

Run: `pnpm test -- --run src/client/layout/AppShell.test.tsx`

Expected: PASS

### Task 2: Refresh the shared visual system

**Files:**
- Modify: `D:\2025-27_CS_AI\Projects\Agent_Cluster\src\client\styles.css`

**Step 1: Write the failing expectation**

Use the shell test from Task 1 as the initial red state and then rely on build verification for CSS integration.

**Step 2: Implement the minimal shared styling**

Update tokens and component classes for:
- the new Grotesque font family
- neutral dark surfaces
- increased whitespace
- restrained borders and shadows
- more editorial list/detail and editor styling

**Step 3: Verify the client still compiles**

Run: `pnpm lint`
Run: `pnpm typecheck`

Expected: PASS

### Task 3: Verify the whole dashboard

**Files:**
- Verify only

**Step 1: Run focused tests**

Run: `pnpm test -- --run src/client/layout/AppShell.test.tsx`

Expected: PASS

**Step 2: Run full project verification**

Run: `pnpm lint`
Run: `pnpm typecheck`
Run: `pnpm build`

Expected: PASS

**Step 3: Review the worktree**

Run: `git status --short`

Expected: only the intended visual refresh files and the new plan docs are modified.
