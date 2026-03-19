# Agent 2 Dashboard Adapter

This folder is the deployable Python adapter package for `md` (`agent_2`).

It is intended to run on the `md` / coordinator node and expose a dashboard-friendly API on port `9011` while reusing the existing agent control-plane APIs on port `9001`.

## What this adapter does

- serves a dashboard-facing HTTP API for `cio` / `agent_1`
- reads and writes allowlisted files directly on `md` / `agent_2`
- proxies file and skill reads/writes to remote `other` nodes through their existing `9001` APIs
- summarizes cluster node health and agent cards for the dashboard overview
- keeps sessions unsupported for now

## What to deploy

Deploy this entire folder to `md` / `agent_2`:

`deploy/agent_2_dashboard_adapter`

In the currently used deployment layout, the dashboard repo lives on `cio` / `agent_1` as `/home/ec2-user/Agent_Cluster_v2`, while this adapter is copied to a separate directory on `md` / `agent_2` such as `/home/ec2-user/agent_2_dashboard_adapter`.
The adapter reads editable files from the EC2 user's OpenClaw home layout, not from the adapter folder itself:

- fixed markdown files under `/home/ec2-user/.openclaw/workspace`
- managed or local skills under `/home/ec2-user/.openclaw/skills`
- workspace skills under `/home/ec2-user/.openclaw/workspace/skills`

## How to run

From the parent directory that contains `agent_2_dashboard_adapter`:

```bash
python -m agent_2_dashboard_adapter
```

Or from inside the deployed folder:

```bash
python server.py
```

## Required environment

- `DASHBOARD_ADAPTER_SECRET`
  The secret expected from the dashboard caller on `cio` / `agent_1` in header `X-Dashboard-Secret`.
  If omitted, the adapter falls back to `AGENT_SHARED_SECRET`.

- `AGENT_SHARED_SECRET`
  The cluster secret used when this adapter calls remote node `9001` APIs.

## Recommended environment

- `DASHBOARD_ADAPTER_HOST`
  Default: `0.0.0.0`

- `DASHBOARD_ADAPTER_PORT`
  Default: `9011`

- `DASHBOARD_ADAPTER_ROOT_DIR`
  Base home directory on `md` / `agent_2` that contains `.openclaw/...`.
  Default: the current user's home directory

- `DASHBOARD_ADAPTER_NODE_ID`
  Default: `openmoose02-md`

- `DASHBOARD_ADAPTER_NODE_NAME`
  Default: `OpenMoose02_MD`

- `DASHBOARD_ADAPTER_NODE_KIND`
  Default: `md`

- `DASHBOARD_ADAPTER_CONTROL_URL`
  The local `9001` control-plane base URL on `md` / `agent_2`.
  Default: `http://127.0.0.1:9001`

- `DASHBOARD_ADAPTER_REMOTE_NODES_JSON`
  JSON array describing remote `other` nodes that should be visible through the dashboard.
  Example:

```json
[
  {
    "id": "openmoose01-cso",
    "name": "OpenMoose01_CSO",
    "kind": "other",
    "base_url": "http://172.31.70.111:9001"
  }
]
```

## Security expectations

- keep port `9011` internal-only
- allow inbound `9011` from `cio` / `agent_1` only in the EC2 Security Group
- send `X-Dashboard-Secret` from the dashboard backend on `cio` / `agent_1`
- this adapter sends `X-Agent-Secret` to remote `9001` nodes

## Exposed endpoints

- `GET /health`
- `GET /dashboard/health`
- `GET /dashboard/nodes`
- `GET /dashboard/agents`
- `GET /dashboard/documents/<kind>?node=<id>`
- `GET /dashboard/documents/<kind>/<document_id>?node=<id>`
- `PUT /dashboard/documents/<kind>/<document_id>?node=<id>`

`kind` must be `file` or `skill`.

## Local verification

This package uses only the Python standard library.

Run the helper tests from the repo root:

```bash
python -m unittest discover deploy/agent_2_dashboard_adapter -p "test_*.py"
```
