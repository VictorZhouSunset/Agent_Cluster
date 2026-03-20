# Google AI Workbench Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh the dashboard UI toward a Google AI Studio-like workbench while preserving the current real backend behavior.

**Architecture:** Keep the existing React component tree and current backend contracts, but replace the visual system with a thinner workbench shell, lighter panels, and a unified toolbar language. The implementation stays client-only and focuses on `styles.css`, shared shell/layout components, and the existing sessions/documents screens.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, shared global CSS, react-markdown

---

### Task 1: Lock shell and page behavior with failing tests

**Files:**
- Modify: `src/client/layout/AppShell.test.tsx`
- Modify: `src/client/features/sessions/SessionsScreen.test.tsx`
- Modify: `src/client/features/files/FilesScreen.test.tsx`
- Modify: `src/client/features/skills/SkillsScreen.test.tsx`

**Step 1: Write the failing test**

Add assertions for:
- thinner shell semantics still exposing the selected section
- page toolbar / section title structure
- document and session split layouts still rendering list + detail regions

**Step 2: Run test to verify it fails**

Run: `pnpm test src/client/layout/AppShell.test.tsx src/client/features/sessions/SessionsScreen.test.tsx src/client/features/files/FilesScreen.test.tsx src/client/features/skills/SkillsScreen.test.tsx`
Expected: FAIL on missing updated structure/labels/classes

**Step 3: Write minimal implementation**

Update component markup only enough to satisfy the new workbench structure while keeping current behavior.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/client/layout/AppShell.test.tsx src/client/features/sessions/SessionsScreen.test.tsx src/client/features/files/FilesScreen.test.tsx src/client/features/skills/SkillsScreen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/client/layout/AppShell.test.tsx src/client/features/sessions/SessionsScreen.test.tsx src/client/features/files/FilesScreen.test.tsx src/client/features/skills/SkillsScreen.test.tsx
git commit -m "test: lock workbench shell structure"
```

### Task 2: Rebuild the app shell as a thinner workbench

**Files:**
- Modify: `src/client/layout/AppShell.tsx`
- Modify: `src/client/styles.css`

**Step 1: Write the failing test**

Add or refine tests that expect:
- compact rail-style navigation
- main toolbar / section heading grouping
- reduced per-nav description footprint

**Step 2: Run test to verify it fails**

Run: `pnpm test src/client/layout/AppShell.test.tsx`
Expected: FAIL because current shell still uses the heavier dashboard hero layout

**Step 3: Write minimal implementation**

Update shell markup and CSS tokens/classes to:
- narrow the sidebar
- introduce a shared top toolbar region
- reduce background glow and card thickness

**Step 4: Run test to verify it passes**

Run: `pnpm test src/client/layout/AppShell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/client/layout/AppShell.tsx src/client/styles.css src/client/layout/AppShell.test.tsx
git commit -m "feat: restyle dashboard shell as workbench"
```

### Task 3: Restyle Files and Skills as document workbench panes

**Files:**
- Modify: `src/client/features/documents/EditableDocumentsScreen.tsx`
- Modify: `src/client/features/documents/DocumentEditor.tsx`
- Modify: `src/client/styles.css`
- Test: `src/client/features/files/FilesScreen.test.tsx`
- Test: `src/client/features/skills/SkillsScreen.test.tsx`

**Step 1: Write the failing test**

Add assertions for:
- thinner list/detail containers
- toolbar-style action placement
- retained read-only bundled skill treatment

**Step 2: Run test to verify it fails**

Run: `pnpm test src/client/features/files/FilesScreen.test.tsx src/client/features/skills/SkillsScreen.test.tsx src/client/features/documents/DocumentEditor.test.tsx`
Expected: FAIL on updated structure or labels

**Step 3: Write minimal implementation**

Update document workspace markup/CSS to:
- make the left pane feel like a resource browser
- keep detail header actions in the top-right tool position
- make preview/editor surfaces flatter and more IDE-like

**Step 4: Run test to verify it passes**

Run: `pnpm test src/client/features/files/FilesScreen.test.tsx src/client/features/skills/SkillsScreen.test.tsx src/client/features/documents/DocumentEditor.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/client/features/documents/EditableDocumentsScreen.tsx src/client/features/documents/DocumentEditor.tsx src/client/styles.css src/client/features/files/FilesScreen.test.tsx src/client/features/skills/SkillsScreen.test.tsx
git commit -m "feat: restyle document panes as workbench"
```

### Task 4: Restyle Sessions and Overview to match the workbench language

**Files:**
- Modify: `src/client/features/sessions/SessionsScreen.tsx`
- Modify: `src/client/features/overview/OverviewScreen.tsx`
- Modify: `src/client/styles.css`
- Test: `src/client/features/sessions/SessionsScreen.test.tsx`
- Test: `src/client/features/overview/OverviewScreen.test.tsx`

**Step 1: Write the failing test**

Add assertions for:
- session page toolbar/header updates
- cleaner message/detail header structure
- overview rendered as thinner module panes rather than hero cards

**Step 2: Run test to verify it fails**

Run: `pnpm test src/client/features/sessions/SessionsScreen.test.tsx src/client/features/overview/OverviewScreen.test.tsx`
Expected: FAIL on outdated structure

**Step 3: Write minimal implementation**

Update the session and overview screens to reuse the same workbench vocabulary:
- compact headers
- lighter bordered panes
- consistent metadata rows and split layouts

**Step 4: Run test to verify it passes**

Run: `pnpm test src/client/features/sessions/SessionsScreen.test.tsx src/client/features/overview/OverviewScreen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/client/features/sessions/SessionsScreen.tsx src/client/features/overview/OverviewScreen.tsx src/client/styles.css src/client/features/sessions/SessionsScreen.test.tsx src/client/features/overview/OverviewScreen.test.tsx
git commit -m "feat: align sessions and overview with workbench ui"
```

### Task 5: Verify the full client build and behavior baseline

**Files:**
- Modify if needed: `src/client/styles.css`
- Modify if needed: affected client test files

**Step 1: Run the full client and shared verification**

Run:
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

Expected: all commands pass

**Step 2: Fix any regressions minimally**

Only patch markup/CSS/tests needed to restore the existing behavior contract.

**Step 3: Re-run verification**

Run:
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

Expected: all commands pass cleanly

**Step 4: Commit**

```bash
git add src/client
git commit -m "feat: refine dashboard toward google ai workbench"
```
