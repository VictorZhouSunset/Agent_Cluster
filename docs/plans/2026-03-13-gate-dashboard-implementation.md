# Gate Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first version of the Gate Dashboard as a single Node app on port `3000` with a React frontend, internal `/api` backend, read-only health/session views, and guarded editing for skills and approved markdown files.

**Architecture:** Use a modular monolith so the frontend and backend ship as one service while remaining logically separated in code. The backend owns provider adapters, path allowlisting, and normalized DTOs so the UI can stay stable as OpenClaw integration and future multi-node support grow.

**Tech Stack:** `pnpm`, Node.js 24, TypeScript, React, Vite, Express-style server, Vitest, Testing Library, Supertest

---

## Repository Note

This workspace is not currently a Git repository. If version control is desired, initialize Git before running the commit steps. If not, skip the commit steps and continue with the implementation steps.

### Task 1: Bootstrap the single-app workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/client/main.tsx`
- Create: `src/client/App.tsx`
- Create: `src/server/index.ts`
- Create: `src/server/app.ts`
- Create: `src/shared/types.ts`

**Step 1: Write the failing config smoke test**

Create `src/shared/types.ts` first with a placeholder exported type and add a tiny smoke test in `src/shared/types.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { DashboardSection } from "./types";

describe("shared types", () => {
  it("supports known dashboard sections", () => {
    const section: DashboardSection = "overview";
    expect(section).toBe("overview");
  });
});
```

**Step 2: Run test to verify the toolchain is not ready yet**

Run: `pnpm test -- --runInBand`
Expected: command fails because the workspace scripts and dependencies do not exist yet

**Step 3: Write the minimal scaffold**

Create a single-package TypeScript app with scripts for:

- `dev`
- `build`
- `lint`
- `typecheck`
- `test`

Use one server entrypoint in `src/server/index.ts` that starts the app on port `3000`, and one client entrypoint in `src/client/main.tsx` that renders `App`.

**Step 4: Run the smoke test again**

Run: `pnpm test -- --run src/shared/types.test.ts`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add .
git commit -m "chore: scaffold gate dashboard app"
```

### Task 2: Define normalized DTOs and provider contracts

**Files:**
- Modify: `src/shared/types.ts`
- Create: `src/server/providers/openclaw/types.ts`
- Create: `src/server/providers/filesystem/types.ts`
- Create: `src/shared/types.test.ts`

**Step 1: Write the failing type contract tests**

Expand `src/shared/types.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { AgentStatus, SessionSummary, EditableDocument } from "./types";

describe("dashboard DTO contracts", () => {
  it("supports a session summary with optional node metadata", () => {
    const session: SessionSummary = {
      id: "s-1",
      title: "Example",
      updatedAt: "2026-03-13T12:00:00.000Z",
      nodeId: "local",
      nodeName: "Gate",
    };

    expect(session.nodeId).toBe("local");
  });

  it("supports editable document metadata", () => {
    const doc: EditableDocument = {
      id: "agents-md",
      name: "AGENTS.md",
      path: "AGENTS.md",
      kind: "file",
    };

    expect(doc.kind).toBe("file");
  });

  it("supports agent health cards", () => {
    const agent: AgentStatus = {
      id: "a-1",
      name: "Planner",
      status: "idle",
    };

    expect(agent.status).toBe("idle");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/shared/types.test.ts`
Expected: FAIL with missing exported types

**Step 3: Write minimal DTOs and provider interfaces**

Define:

- dashboard section union
- health DTO
- agent status DTO
- session summary/detail DTOs
- editable document DTO
- OpenClaw provider interface for health, agents, sessions
- filesystem provider interface for reading/writing allowlisted docs

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/shared/types.test.ts`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add src/shared/types.ts src/server/providers/openclaw/types.ts src/server/providers/filesystem/types.ts src/shared/types.test.ts
git commit -m "feat: define dashboard dto contracts"
```

### Task 3: Implement editable-path allowlisting

**Files:**
- Create: `src/server/providers/filesystem/allowlist.ts`
- Create: `src/server/providers/filesystem/allowlist.test.ts`
- Create: `src/server/providers/filesystem/constants.ts`

**Step 1: Write the failing allowlist tests**

Create `src/server/providers/filesystem/allowlist.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveEditableTarget } from "./allowlist";

describe("resolveEditableTarget", () => {
  it("allows AGENTS.md", () => {
    expect(resolveEditableTarget("agents-md").relativePath).toBe("AGENTS.md");
  });

  it("allows skill markdown files only", () => {
    expect(resolveEditableTarget("skill:planner").relativePath).toBe("skills/planner/SKILL.md");
  });

  it("rejects traversal", () => {
    expect(() => resolveEditableTarget("../secret")).toThrow(/not allowlisted/i);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/server/providers/filesystem/allowlist.test.ts`
Expected: FAIL because `resolveEditableTarget` does not exist

**Step 3: Write the minimal implementation**

Add:

- a constant map for `SOUL.md`, `USER.md`, `AGENTS.md`, `TOOLS.md`
- a helper for `skills/<name>/SKILL.md`
- strict rejection for path traversal, unknown ids, or non-`SKILL.md` skill paths

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/server/providers/filesystem/allowlist.test.ts`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add src/server/providers/filesystem/constants.ts src/server/providers/filesystem/allowlist.ts src/server/providers/filesystem/allowlist.test.ts
git commit -m "feat: add editable path allowlist"
```

### Task 4: Build the filesystem provider for safe reads and writes

**Files:**
- Create: `src/server/providers/filesystem/localFilesystemProvider.ts`
- Create: `src/server/providers/filesystem/localFilesystemProvider.test.ts`
- Modify: `src/server/providers/filesystem/types.ts`

**Step 1: Write the failing provider tests**

Create `src/server/providers/filesystem/localFilesystemProvider.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createLocalFilesystemProvider } from "./localFilesystemProvider";

describe("local filesystem provider", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "gate-dashboard-"));
    await mkdir(join(rootDir, "skills", "planner"), { recursive: true });
    await writeFile(join(rootDir, "AGENTS.md"), "# Agents");
    await writeFile(join(rootDir, "skills", "planner", "SKILL.md"), "# Planner");
  });

  it("reads an allowlisted file", async () => {
    const provider = createLocalFilesystemProvider(rootDir);
    const result = await provider.readDocument("agents-md");
    expect(result.content).toContain("# Agents");
  });

  it("writes an allowlisted skill", async () => {
    const provider = createLocalFilesystemProvider(rootDir);
    await provider.writeDocument("skill:planner", "# Updated");
    const result = await provider.readDocument("skill:planner");
    expect(result.content).toContain("Updated");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/server/providers/filesystem/localFilesystemProvider.test.ts`
Expected: FAIL because the provider does not exist

**Step 3: Write the minimal implementation**

Create a provider that:

- resolves ids through the allowlist
- reads content and last-modified metadata
- writes content only for allowlisted targets
- returns stable document DTOs

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/server/providers/filesystem/localFilesystemProvider.test.ts`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add src/server/providers/filesystem/types.ts src/server/providers/filesystem/localFilesystemProvider.ts src/server/providers/filesystem/localFilesystemProvider.test.ts
git commit -m "feat: add local filesystem provider"
```

### Task 5: Add OpenClaw provider contracts and local stub provider

**Files:**
- Create: `src/server/providers/openclaw/localOpenClawProvider.ts`
- Create: `src/server/providers/openclaw/localOpenClawProvider.test.ts`
- Modify: `src/server/providers/openclaw/types.ts`

**Step 1: Write the failing stub provider tests**

Create `src/server/providers/openclaw/localOpenClawProvider.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createLocalOpenClawProvider } from "./localOpenClawProvider";

describe("local OpenClaw provider", () => {
  it("returns normalized health", async () => {
    const provider = createLocalOpenClawProvider();
    const result = await provider.getHealth();
    expect(result.status).toBeDefined();
  });

  it("returns a session list", async () => {
    const provider = createLocalOpenClawProvider();
    const sessions = await provider.listSessions();
    expect(Array.isArray(sessions)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/server/providers/openclaw/localOpenClawProvider.test.ts`
Expected: FAIL because the stub provider is missing

**Step 3: Write the minimal implementation**

Create a local provider that:

- exposes the interface the routes will consume
- uses stubbed data or placeholder adapter methods for now
- clearly isolates the future real OpenClaw integration points

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/server/providers/openclaw/localOpenClawProvider.test.ts`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add src/server/providers/openclaw/types.ts src/server/providers/openclaw/localOpenClawProvider.ts src/server/providers/openclaw/localOpenClawProvider.test.ts
git commit -m "feat: add local openclaw provider stub"
```

### Task 6: Expose backend API routes

**Files:**
- Create: `src/server/routes/health.ts`
- Create: `src/server/routes/agents.ts`
- Create: `src/server/routes/sessions.ts`
- Create: `src/server/routes/documents.ts`
- Create: `src/server/routes/appRouter.ts`
- Create: `src/server/routes/appRouter.test.ts`
- Modify: `src/server/app.ts`

**Step 1: Write the failing API tests**

Create `src/server/routes/appRouter.test.ts`:

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("app router", () => {
  it("returns health data", async () => {
    const app = createApp();
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
  });

  it("returns sessions data", async () => {
    const app = createApp();
    const response = await request(app).get("/api/sessions");
    expect(response.status).toBe(200);
  });

  it("rejects unknown document ids", async () => {
    const app = createApp();
    const response = await request(app).get("/api/files/nope");
    expect(response.status).toBe(404);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/server/routes/appRouter.test.ts`
Expected: FAIL because the routes are not implemented

**Step 3: Write the minimal implementation**

Wire routes that:

- return normalized health and agent data
- return session lists and session detail
- expose file and skill list/detail/save endpoints
- map provider failures to structured error responses

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/server/routes/appRouter.test.ts`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add src/server/app.ts src/server/routes/health.ts src/server/routes/agents.ts src/server/routes/sessions.ts src/server/routes/documents.ts src/server/routes/appRouter.ts src/server/routes/appRouter.test.ts
git commit -m "feat: add dashboard api routes"
```

### Task 7: Build the React shell and navigation

**Files:**
- Create: `src/client/layout/AppShell.tsx`
- Create: `src/client/layout/AppShell.test.tsx`
- Create: `src/client/features/navigation.ts`
- Modify: `src/client/App.tsx`

**Step 1: Write the failing shell test**

Create `src/client/layout/AppShell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App";

describe("App shell", () => {
  it("renders the four primary dashboard areas", () => {
    render(<App />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Files")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/client/layout/AppShell.test.tsx`
Expected: FAIL because the app shell is not implemented

**Step 3: Write the minimal implementation**

Create:

- a layout with a sidebar or tab bar
- four navigable sections
- a default route/selection for `Overview`

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/client/layout/AppShell.test.tsx`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add src/client/App.tsx src/client/layout/AppShell.tsx src/client/layout/AppShell.test.tsx src/client/features/navigation.ts
git commit -m "feat: add dashboard shell"
```

### Task 8: Implement Overview and Sessions screens

**Files:**
- Create: `src/client/features/overview/OverviewScreen.tsx`
- Create: `src/client/features/overview/OverviewScreen.test.tsx`
- Create: `src/client/features/sessions/SessionsScreen.tsx`
- Create: `src/client/features/sessions/SessionsScreen.test.tsx`
- Create: `src/client/lib/apiClient.ts`
- Modify: `src/client/App.tsx`

**Step 1: Write the failing screen tests**

Create the tests:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OverviewScreen } from "./OverviewScreen";

describe("OverviewScreen", () => {
  it("renders health and agent sections", async () => {
    render(<OverviewScreen />);
    expect(await screen.findByText(/health/i)).toBeInTheDocument();
    expect(await screen.findByText(/agents/i)).toBeInTheDocument();
  });
});
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionsScreen } from "./SessionsScreen";

describe("SessionsScreen", () => {
  it("renders sessions and detail areas", async () => {
    render(<SessionsScreen />);
    expect(await screen.findByText(/sessions/i)).toBeInTheDocument();
    expect(await screen.findByText(/session detail/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/client/features/overview/OverviewScreen.test.tsx src/client/features/sessions/SessionsScreen.test.tsx`
Expected: FAIL because the screens and API client are missing

**Step 3: Write the minimal implementation**

Add:

- a small typed API client
- overview screen with loading/error/success states
- sessions master-detail layout with selected session content

Use mocked fetch responses in tests rather than real backend calls.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/client/features/overview/OverviewScreen.test.tsx src/client/features/sessions/SessionsScreen.test.tsx`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add src/client/features/overview/OverviewScreen.tsx src/client/features/overview/OverviewScreen.test.tsx src/client/features/sessions/SessionsScreen.tsx src/client/features/sessions/SessionsScreen.test.tsx src/client/lib/apiClient.ts src/client/App.tsx
git commit -m "feat: add overview and sessions screens"
```

### Task 9: Implement Skills and Files editors

**Files:**
- Create: `src/client/features/documents/DocumentEditor.tsx`
- Create: `src/client/features/documents/DocumentEditor.test.tsx`
- Create: `src/client/features/skills/SkillsScreen.tsx`
- Create: `src/client/features/files/FilesScreen.tsx`
- Modify: `src/client/lib/apiClient.ts`
- Modify: `src/client/App.tsx`

**Step 1: Write the failing editor tests**

Create `src/client/features/documents/DocumentEditor.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DocumentEditor } from "./DocumentEditor";

describe("DocumentEditor", () => {
  it("loads content and saves edits", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <DocumentEditor
        title="AGENTS.md"
        initialContent="# Agents"
        onSave={onSave}
      />,
    );

    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "# Updated");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith("# Updated");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/client/features/documents/DocumentEditor.test.tsx`
Expected: FAIL because the editor does not exist

**Step 3: Write the minimal implementation**

Add:

- reusable editor component
- skills screen backed by `/api/skills`
- files screen backed by `/api/files`
- save states and error messages

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run src/client/features/documents/DocumentEditor.test.tsx`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add src/client/features/documents/DocumentEditor.tsx src/client/features/documents/DocumentEditor.test.tsx src/client/features/skills/SkillsScreen.tsx src/client/features/files/FilesScreen.tsx src/client/lib/apiClient.ts src/client/App.tsx
git commit -m "feat: add skills and file editors"
```

### Task 10: Final validation and production wiring

**Files:**
- Modify: `package.json`
- Modify: `src/server/index.ts`
- Modify: `vite.config.ts`
- Modify: `vitest.config.ts`
- Create: `README.md`

**Step 1: Write the failing production smoke check**

Add a final backend smoke test in `src/server/index.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("server config", () => {
  it("defaults to port 3000", () => {
    expect(process.env.PORT ?? "3000").toBe("3000");
  });
});
```

**Step 2: Run test to verify any production gaps**

Run: `pnpm test -- --run src/server/index.test.ts`
Expected: PASS or reveal any missing production entry wiring

**Step 3: Complete the production wiring**

Ensure:

- the built client is served by the Node app
- `/api/*` remains routed to the backend
- the default port is `3000`
- the README explains the local non-E2E workflow and Linux-first deployment intent

**Step 4: Run validation**

Run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm test -- --run
```

Expected:

- install completes
- lint passes if configured
- typecheck passes
- build passes
- unit/integration tests pass

If `lint` is not configured yet, add it before claiming completion. If any command fails, stop and fix or report the failure clearly.

**Step 5: Commit**

Run:

```bash
git add .
git commit -m "feat: complete gate dashboard baseline"
```
