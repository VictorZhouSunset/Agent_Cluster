# AGENTS.md

## Current Stage:

两条线：
1. D:\2025-27_CS_AI\Projects\Openmoose_Frontend 项目是我们的官网前后端（数据库在Supabase），有些东西可能需要改动

2. We are also trying to do next: 付费用户在sub-dashboard页面点击“建立集群”，就可以自动在AWS上建立起一个（现阶段就一个）EC2，t3-small，然后配置好Amazon Linux，openclaw，以及部署D:\2025-27_CS_AI\Projects\Agent_Cluster （当前） 项目里的cluster-dashboard（那就相当于只部署cio的，不部署md的），然后在sub-dashboard页面可以看见进入集群的按钮了




## Environment

- Target OS: Amazon Linux 2023
- Target Node.js: v22.22.1
  Reference: https://docs.openclaw.ai/install/node
- Target OpenClaw version: 2026.3.11
  Reference: https://github.com/openclaw/openclaw/releases
- This project is developed for Linux EC2 first, not for local desktop first without Linux or OpenClaw, so you cannot test E2E and do not need to do so now

## Current cluster naming

- `cio` and `agent_1` refer to the same machine
- `md` and `agent_2` refer to the same machine
- `others` refers to worker agents such as `agent_3`, `agent_4`, `agent_5`, and later `agent_x`

## Current deployment layout

- The main dashboard repo is installed on `cio` / `agent_1`
- The deployed folder name on `cio` / `agent_1` is `/home/ec2-user/Agent_Cluster_v2`
- The Python adapter in `deploy/agent_2_dashboard_adapter` is installed on `md` / `agent_2`
- The colleague-owned agent runtime lives under `/opt` and contains `agent_server.py`; treat it as an external dependency of this repo
- The dashboard on `cio` / `agent_1` listens on port `3000`
- The adapter on `md` / `agent_2` listens on port `9011`
- Existing cluster control-plane APIs continue to listen on port `9001`

## Installed paths relevant to this project

- OpenClaw executable:
  `/home/ec2-user/.nvm/versions/node/v22.22.1/bin/openclaw`
- OpenClaw installation directory:
  `/home/ec2-user/.nvm/versions/node/v22.22.1/lib/node_modules/openclaw`
- OpenClaw user configuration and workspace:
  `/home/ec2-user/.openclaw`
  `/home/ec2-user/.openclaw/workspace`
- Fixed editable markdown files live in:
  `/home/ec2-user/.openclaw/workspace`
- Managed or local skills live in:
  `/home/ec2-user/.openclaw/skills`
- Workspace skills live in:
  `/home/ec2-user/.openclaw/workspace/skills`
- OpenClaw logs and temporary files:
  `/tmp/openclaw`
- Observed OpenClaw user service unit:
  `/run/user/1000/systemd/units/invocation:openclaw-gateway.service`

## Task scope

Build a custom Dashboard for the Gate node.

The Dashboard must read local OpenClaw data and provide:

- health
- sessions
- skills
- selected markdown files

The first version of the Dashboard must support:

- viewing Agent status
- viewing Session list and Session content
- viewing and editing Skills
- viewing and editing selected markdown files

## Architecture rules

- The Dashboard runs on the same EC2 as OpenClaw
- The Dashboard listens on port `3000`
- OpenClaw must not be exposed directly to the public internet
- End users must not access port `3000` directly
- Public traffic should go through the entry server and reverse proxy

## Ownership boundaries

- This repo owns the Node dashboard on `cio` / `agent_1`
- This repo also owns the Python adapter under `deploy/agent_2_dashboard_adapter` for `md` / `agent_2`
- This repo does not own the colleague's `agent_server.py` runtime under `/opt`; integrate with it carefully rather than reshaping its protocol casually
- Treat OpenClaw runtime state as the source of truth and the colleague-owned agent runtime as an external system this repo must interoperate with

## Data rules

- Read OpenClaw runtime state from local OpenClaw interfaces
- Treat OpenClaw as the source of truth for session and health data
  Reference: https://docs.openclaw.ai/concepts/session
- Skills and selected markdown files may be edited carefully
  Reference: https://docs.openclaw.ai/tools/skills
- Do not directly modify raw session transcript/store files unless explicitly requested

## File scope

Editable files may include:

- `SOUL.md`
- `BOOTSTRAP.md`
- `HEARTBEAT.md`
- `IDENTITY.md`
- `USER.md`
- `AGENTS.md`
- `TOOLS.md`
- `~/.openclaw/skills/*/SKILL.md`
- `~/.openclaw/workspace/skills/*/SKILL.md`

## Change rules

- Keep changes minimal and targeted
- Do not introduce billing, cluster provisioning, or unrelated AWS logic into this repo
- Do not add OpenClaw built-in dashboard integration unless explicitly requested
- Prefer implementation that works cleanly on Amazon Linux 2023

## Dependency tools

- Use `pnpm` for this Dashboard project
- Do not introduce `uv` unless a real Python subproject is added

## Validation

After code changes:

1. install dependencies
2. run lint if present
3. run typecheck if present
4. run build if present
5. report failures clearly

## Secrets
The secret of the Dashboard adapter is: "YOUR_REAL_DASHBOARD_SECRET_HERE"
It's ok in the dev section to just speak it out loud. I will change the secret later in the production.
The secret of the 9001 port:
"X-Agent-Secret: openmoose-secret-cluster001"

## References

- Codex AGENTS.md guide: https://developers.openai.com/codex/guides/agents-md/
- OpenClaw install docs: https://docs.openclaw.ai/install
- OpenClaw Node docs: https://docs.openclaw.ai/install/node
- OpenClaw Linux docs: https://docs.openclaw.ai/platforms/linux
- OpenClaw releases: https://github.com/openclaw/openclaw/releases
