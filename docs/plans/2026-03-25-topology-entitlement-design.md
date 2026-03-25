# Topology Entitlement Design

**Goal:** Use subscription entitlement to choose the correct cluster topology, while keeping one dashboard codebase that can render either Tier0 single-node or the internal three-node cluster.

**Current problem**

- `subscriptions.plan_code` is still a legacy display label such as `pro`; it does not drive provisioning.
- `Agent_Cluster` currently distinguishes Tier0 by the runtime env var `GATE_CLUSTER_TOPOLOGY=tier0`, not by Supabase data.
- The current Tier0 bootstrap fix works only after a rebaked AMI because topology is injected through the baked service config.
- Internal clusters and paid-user Tier0 clusters therefore behave differently today for operational reasons, not because there is a clean product model.

**Design decision**

- `subscriptions.plan_code` becomes the entitlement source of truth.
- `clusters.topology` records the actual deployed shape of one cluster.
- `Openmoose_Frontend/gateway` maps `plan_code -> topology -> provisioning config`.
- `Agent_Cluster` remains one codebase and switches behavior by topology.

**Topology model**

- `tier0` entitlement maps to `tier0-single-node` topology.
- `internal` entitlement maps to `internal-three-node` topology.
- The topology string is written both to Supabase and to the launched cluster runtime env.

**Gateway responsibilities**

- Read `subscriptions.plan_code` during create-cluster flow.
- Reject unknown plan codes with a clear error.
- Choose the correct RPC / provisioning payload for the topology.
- Persist `clusters.topology` when creating or reusing a cluster slot.
- Include topology in the baked bootstrap environment so the launched EC2 knows how to run its dashboard.

**Dashboard responsibilities**

- `tier0-single-node`: disable the remote adapter client and expose only the local `cio` node.
- `internal-three-node`: enable the remote adapter client and merge local plus remote nodes.
- Keep existing `healthy/degraded/offline` semantics.
- Do not render nodes that do not belong to the selected topology.

**Node inventory behavior**

- Tier0 returns exactly one node from the backend, so the existing frontend `nodes.map(...)` naturally renders one card.
- Internal topology returns the expected node inventory shape and existing statuses.
- A later follow-up can add explicit offline placeholders when the remote adapter is entirely unreachable, but that is not required to land the entitlement-to-topology pipeline.

**Migration path**

1. Add `clusters.topology` to Supabase and backfill existing rows.
2. Normalize existing subscription seed rows to meaningful `plan_code` values.
3. Update gateway queries/RPC payloads/tests to use plan code and topology explicitly.
4. Update baked bootstrap generation to inject topology into `gate-dashboard.service`.
5. Re-bake the Tier0 AMI and point the launch template at the new image.

**Non-goals for this slice**

- No second dashboard repo.
- No new status enum beyond `healthy/degraded/offline`.
- No attempt to redesign internal remote-adapter semantics beyond topology selection.
