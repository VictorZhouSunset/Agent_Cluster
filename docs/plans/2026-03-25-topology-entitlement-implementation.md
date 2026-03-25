# Topology Entitlement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Drive cluster provisioning and dashboard behavior from subscription entitlement and persisted cluster topology.

**Architecture:** `Openmoose_Frontend/gateway` maps `subscriptions.plan_code` into a persisted `clusters.topology` value and injects that topology into launched cluster runtimes. `Agent_Cluster` continues to use one dashboard codebase, but switches behavior by topology-aware runtime env instead of implicit infrastructure differences.

**Tech Stack:** Supabase SQL, Node.js, gateway server modules, Agent_Cluster TypeScript, Vitest, Node test runner, pnpm

---

### Task 1: Add topology to the gateway data model

**Files:**
- Create: `D:/2025-27_CS_AI/Projects/Openmoose_Frontend/gateway/database/2026-03-25-cluster-topology.sql`
- Modify: `D:/2025-27_CS_AI/Projects/Openmoose_Frontend/gateway/database/2026-03-21-subdashboard-init.sql`
- Test: `D:/2025-27_CS_AI/Projects/Openmoose_Frontend/gateway/server/clusterQueriesRpc.test.mjs`

**Step 1: Write the failing test**

- Add assertions in `clusterQueriesRpc.test.mjs` that the create-cluster flow forwards a topology derived from `plan_code`, and that returned cluster payloads expose topology.

**Step 2: Run test to verify it fails**

Run:

```bash
cd /d D:\2025-27_CS_AI\Projects\Openmoose_Frontend\gateway && node --test server/clusterQueriesRpc.test.mjs
```

Expected: FAIL because topology is neither selected nor returned yet.

**Step 3: Write minimal implementation**

- Add SQL migration for `clusters.topology`.
- Backfill seed rows.
- Update init SQL so existing seed data uses meaningful plan codes such as `tier0` and `internal`.

**Step 4: Run test to verify it passes**

Run the same test command and confirm the topology assertions pass.

**Step 5: Commit**

```bash
git add gateway/database/2026-03-25-cluster-topology.sql gateway/database/2026-03-21-subdashboard-init.sql gateway/server/clusterQueriesRpc.test.mjs
git commit -m "feat: add cluster topology schema"
```

### Task 2: Map entitlement to topology in gateway create flow

**Files:**
- Modify: `D:/2025-27_CS_AI/Projects/Openmoose_Frontend/gateway/server/lib/clusterQueries.mjs`
- Modify: `D:/2025-27_CS_AI/Projects/Openmoose_Frontend/gateway/server/lib/clusterProvisioner.mjs`
- Modify: `D:/2025-27_CS_AI/Projects/Openmoose_Frontend/gateway/server/tier0Lifecycle.test.mjs`
- Test: `D:/2025-27_CS_AI/Projects/Openmoose_Frontend/gateway/server/clusterQueriesRpc.test.mjs`
- Test: `D:/2025-27_CS_AI/Projects/Openmoose_Frontend/gateway/server/tier0Lifecycle.test.mjs`

**Step 1: Write the failing test**

- Add coverage for:
  - `plan_code=tier0` -> `topology=tier0-single-node`
  - unsupported plan code -> clear HTTP error
  - returned cluster payload includes topology.

**Step 2: Run test to verify it fails**

Run:

```bash
cd /d D:\2025-27_CS_AI\Projects\Openmoose_Frontend\gateway && node --test server/clusterQueriesRpc.test.mjs server/tier0Lifecycle.test.mjs
```

Expected: FAIL because gateway still ignores plan codes beyond status checks.

**Step 3: Write minimal implementation**

- Add a small plan-code-to-topology mapper in `clusterQueries.mjs`.
- Include topology in the RPC arguments / mapped cluster payload.
- Include topology in bootstrap script generation so launched nodes inherit the right dashboard mode.

**Step 4: Run test to verify it passes**

Run the same command and confirm both test files pass.

**Step 5: Commit**

```bash
git add gateway/server/lib/clusterQueries.mjs gateway/server/lib/clusterProvisioner.mjs gateway/server/tier0Lifecycle.test.mjs gateway/server/clusterQueriesRpc.test.mjs
git commit -m "feat: drive cluster topology from entitlement"
```

### Task 3: Make Agent_Cluster topology-aware at the node inventory layer

**Files:**
- Modify: `D:/2025-27_CS_AI/Projects/Agent_Cluster/src/server/providers/cluster/createConfiguredProviders.ts`
- Modify: `D:/2025-27_CS_AI/Projects/Agent_Cluster/src/server/providers/cluster/clusterOpenClawProvider.ts`
- Modify: `D:/2025-27_CS_AI/Projects/Agent_Cluster/src/server/providers/cluster/createConfiguredProviders.test.ts`
- Test: `D:/2025-27_CS_AI/Projects/Agent_Cluster/src/server/providers/cluster/createConfiguredProviders.test.ts`

**Step 1: Write the failing test**

- Add tests that:
  - Tier0 still returns only the local node.
  - Internal topology keeps remote adapter behavior enabled.

**Step 2: Run test to verify it fails**

Run:

```bash
cd /d D:\2025-27_CS_AI\Projects\Agent_Cluster && pnpm vitest run src/server/providers/cluster/createConfiguredProviders.test.ts
```

Expected: FAIL if topology aliases or additional internal topology names are not recognized yet.

**Step 3: Write minimal implementation**

- Normalize topology names into one helper.
- Keep Tier0 single-node disabling the remote adapter client.
- Keep internal topology using the adapter path.

**Step 4: Run test to verify it passes**

Run the same test command and confirm it passes.

**Step 5: Commit**

```bash
git add src/server/providers/cluster/createConfiguredProviders.ts src/server/providers/cluster/clusterOpenClawProvider.ts src/server/providers/cluster/createConfiguredProviders.test.ts
git commit -m "feat: normalize dashboard topology modes"
```

### Task 4: Verify the two-repo slice

**Files:**
- Modify: `D:/2025-27_CS_AI/Projects/Openmoose_Frontend/gateway/README.md`
- Modify: `D:/2025-27_CS_AI/Projects/Openmoose_Frontend/gateway/deploy/TIER0-SETUP.md`
- Modify: `D:/2025-27_CS_AI/Projects/Agent_Cluster/docs/plans/2026-03-25-topology-entitlement-design.md`

**Step 1: Run gateway verification**

```bash
cd /d D:\2025-27_CS_AI\Projects\Openmoose_Frontend\gateway && node --test server/clusterQueriesRpc.test.mjs server/tier0Lifecycle.test.mjs server/routeManager.test.mjs server/clusterReconciler.test.mjs
```

Expected: PASS

**Step 2: Run dashboard verification**

```bash
cd /d D:\2025-27_CS_AI\Projects\Agent_Cluster && pnpm typecheck && pnpm build && pnpm vitest run src/server/providers/cluster/createConfiguredProviders.test.ts
```

Expected: PASS

**Step 3: Update docs**

- Document that `plan_code` is entitlement and `topology` is deployment shape.
- Document that Tier0 rebakes must include the topology env.

**Step 4: Commit**

```bash
git add gateway/README.md gateway/deploy/TIER0-SETUP.md docs/plans/2026-03-25-topology-entitlement-design.md
git commit -m "docs: document topology entitlement flow"
```
