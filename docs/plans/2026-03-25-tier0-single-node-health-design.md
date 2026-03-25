# Tier 0 Single-Node Health Design

## Problem

The baked Tier 0 AMI boots only the `cio` dashboard node. There is no `md` node or remote dashboard adapter yet.

Today the dashboard backend still creates a remote adapter client whenever adapter env vars exist. `/api/health` then waits on the remote adapter request. When that request hangs, the endpoint never responds, and the gateway-side Tier 0 reconcile loop never promotes the cluster from `creating` to `ready`.

## Goals

- Make Tier 0 a first-class single-node topology.
- Keep `/api/health` responsive even when the remote adapter is unavailable.
- Preserve the future multi-node path where `md` can still be queried when present.

## Chosen Approach

1. Add an explicit topology env flag, `GATE_CLUSTER_TOPOLOGY`.
2. When topology is `tier0`, do not create the remote adapter client at all.
3. Add a timeout to remote adapter HTTP requests so future multi-node deployments degrade quickly instead of hanging forever.

## Why This Approach

- It matches the actual product shape: Tier 0 is intentionally one machine.
- It avoids silently depending on the absence of env vars.
- It keeps future multi-node support intact.
- It also fixes the broader class of hangs where `md` exists in theory but is slow or down in practice.

## Expected Runtime Behavior

- `GATE_CLUSTER_TOPOLOGY=tier0`
  - `/api/health` uses only local dashboard/OpenClaw data.
  - Gateway reconcile can mark the cluster `ready` as soon as local health passes and routing attaches.
- `GATE_CLUSTER_TOPOLOGY=multi-node` (or unset in older deployments)
  - Remote adapter remains enabled when adapter env is configured.
  - Remote adapter failures degrade health summaries quickly instead of hanging the request.

## Deployment Impact

- Code change requires rebuilding `Agent_Cluster`.
- Any baked AMI that should behave as Tier 0 must include `GATE_CLUSTER_TOPOLOGY=tier0` in the dashboard service environment before creating the AMI.
- Existing gateway/AWS provisioning infrastructure does not need redesign for this fix.
