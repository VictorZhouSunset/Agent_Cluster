# Gate Dashboard

Gate Dashboard is a Linux-first Node app that runs on the same EC2 instance as OpenClaw and serves a React dashboard on port `3000`.

## Scope

The first version supports:

- viewing dashboard health
- viewing agent status
- viewing session lists and session detail
- viewing and editing allowlisted skills
- viewing and editing selected markdown files

OpenClaw remains the source of truth for health and session data. The dashboard should sit behind the entry server and reverse proxy, and OpenClaw itself should not be exposed directly to the public internet.

## Local workflow

This repository is developed for Ubuntu EC2 first. Local desktop work is supported for unit and integration checks, but Linux and OpenClaw are not installed in this workspace and E2E is intentionally out of scope for the current phase.

Use pnpm for all package management:

```bash
pnpm install
pnpm dev
```

## Production start

Build the dashboard, then start the built Node server entrypoint:

```bash
pnpm build
pnpm start
```

The production start script runs [dist/server/server/index.js](D:/2025-27_CS_AI/Projects/Agent_Cluster/dist/server/server/index.js). You can override the default port with `PORT`, though the intended default remains `3000`.

## Validation

Run the non-E2E checks after changes:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm test -- --run
```

## Notes

- The dashboard listens on port `3000`.
- Public traffic should be routed through the entry server and reverse proxy rather than direct access to port `3000`.
- Editable files are limited to the allowlisted markdown files and `skills/*/SKILL.md`.
