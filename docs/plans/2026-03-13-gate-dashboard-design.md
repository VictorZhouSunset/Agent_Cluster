# Gate Dashboard Design

**Date:** 2026-03-13

## Goal

Build a custom Dashboard for the Gate node that runs alongside OpenClaw on the same EC2 instance, reads local OpenClaw-backed data for health and sessions, and allows careful editing of skills and selected markdown files.

## Constraints

- Follow `AGENTS.md` as the governing project instruction set.
- Optimize for Ubuntu 24.04 LTS and Node.js 24 deployment on Linux EC2.
- Do not install Linux or OpenClaw locally for this phase.
- Do not rely on local end-to-end testing for this phase.
- Keep OpenClaw private and avoid exposing it directly to the public internet.
- Keep the first version minimal and targeted.

## Recommended Architecture

Use a modular monolith:

- one Node application listening on port `3000`
- React frontend for the dashboard UI
- backend API routes within the same application under `/api`
- provider/adaptor modules for OpenClaw-facing data and safe filesystem editing

This keeps deployment simple now while preserving a real backend boundary for future authentication, aggregation, and multi-node logic.

## Rejected Alternatives

### Direct React-to-OpenClaw / Filesystem Access

Rejected because the client should not own access to internal services or the filesystem, and future validation and multi-node support would become messy quickly.

### Separate Frontend and Backend Deployments

Rejected for v1 because it adds operational overhead without clear benefit at this stage. The code should stay logically separated, but the deployment can remain a single service.

## Backend Boundaries

### HTTP Layer

Route handlers receive requests, validate basic inputs, and shape responses.

### Service Layer

Services own business rules:

- allowlisted editable paths
- validation and save behavior
- normalization of provider output
- future auth and authorization hooks

### Provider Layer

Providers isolate external dependencies:

- `providers/openclaw` for local runtime health and session reads
- `providers/filesystem` for skills and approved markdown reads/writes
- `providers/nodes` as a future extension point for remote EC2 instances

## API Shape

### Health and Agents

- `GET /api/health`
- `GET /api/agents`

These return normalized dashboard-facing data for overview widgets and status cards.

### Sessions

- `GET /api/sessions`
- `GET /api/sessions/:id`

These support a session list view and session detail view. Session data remains read-only and OpenClaw-backed.

### Skills

- `GET /api/skills`
- `GET /api/skills/:id`
- `PUT /api/skills/:id`

These expose allowed skill metadata and editable skill contents under the approved `skills/*/SKILL.md` scope.

### Files

- `GET /api/files`
- `GET /api/files/:id`
- `PUT /api/files/:id`

These cover only the approved editable markdown files such as `SOUL.md`, `USER.md`, `AGENTS.md`, and `TOOLS.md`.

## Frontend Shape

The first version should include four main areas:

- `Overview` for health and agent status
- `Sessions` for list and content display
- `Skills` for safe skill editing
- `Files` for safe markdown editing

The React app should only communicate with `/api/*` and should not encode OpenClaw-specific assumptions directly into UI components.

## Data Model Guidance

Normalize backend responses into stable DTOs so the UI remains insulated from provider-specific response shapes.

Even in a single-node first version, include room in the models for future multi-node fields such as:

- `nodeId`
- `nodeName`
- `source`

This avoids a painful UI data model rewrite later.

## Error Handling

- Health and session failures should degrade gracefully without taking down the whole dashboard UI.
- File and skill saves should return structured errors such as `not_found`, `validation_error`, `upstream_unavailable`, and `write_failed`.
- Writes should be restricted to allowlisted files only.
- The first version can use whole-document saves with conservative validation and simple conflict checks if easy to add.

## Security and Access

- The dashboard backend may be reverse-proxied publicly later, but OpenClaw itself should remain private.
- End users should not access port `3000` directly in production.
- Sensitive read/write operations should stay server-side.

## Testing Strategy for This Phase

Skip local end-to-end testing for now.

Focus on:

- unit tests for path allowlisting and validation rules
- backend integration tests for route/service/provider behavior
- frontend component tests for loading, empty, error, and success states
- build and typecheck validation for the scaffolded app

## Implementation Direction

Start with a single deployable Node app using `pnpm`, establish the backend boundary first, then add the React views against normalized mock or local adapter-backed data. Keep remote-node support as an extension point rather than a v1 requirement.

## Open Questions Deferred

- exact OpenClaw local interface details for health and session reads
- authentication model for operators
- conflict resolution strategy for concurrent edits
- remote node registration and polling/push model

These should remain out of scope for the first implementation pass unless they become necessary to complete the baseline dashboard.
