# Dashboard Gemini Design Compatibility Notes

This note compares `docs/Dashboard_Gemini_Design` with the current Gate Dashboard codebase.

## Recommendation

Use the Gemini design as a **visual and layout reference**, not as a feature-by-feature implementation target.

Current recommendation:

- keep the overall visual style
- keep the 4 main sections
- keep the shared editor experience for `Skills` and `Files`
- do **not** add new backend services just to match demo data in the design

## Safe to adopt now

These fit the current product and data model:

- dark dashboard shell and stronger visual hierarchy
- improved sidebar navigation
- richer card styling for overview
- better session master-detail layout
- Markdown rendering for session content
- preview-first document editor with `Edit`, `Save`, and `Cancel`
- shared editing pattern across `Skills` and `Files`

## Needs adaptation to current real data

These ideas are useful, but the displayed fields should be changed to match current backend contracts:

- node cards
  - current real fields: `status`, `checkedAt`, `summary`, `kind`, `origin`, `supports*`
  - Gemini mock fields: `cpu`, `memory`, `uptime`
- agent cards
  - current real fields: `status`, optional `summary`, optional `updatedAt`, optional `nodeName`
  - Gemini mock fields: `lastActive`, detailed service-style roles
- sessions
  - current real fields: `title`, `status`, `updatedAt`, optional `startedAt`, optional `agentName`, optional `nodeName`
  - Gemini mock data is more polished than current real data, so some metadata should be simplified
- documents
  - current real editable set is allowlisted markdown files and skill markdown only
  - Gemini demo includes `config.yaml`, which should not be added to editable scope now

## Do not add now

These should stay out of the current implementation unless we explicitly create new backend support:

- node telemetry service for CPU or memory
- uptime tracking service
- computed cluster load service
- fake named operational services just for UI flavor
- expanded file editing beyond the current markdown allowlist
- analytics, notifications, queueing, or monitoring panels not backed by real routes

## If we want to add them later

These can be good future features, but they should be treated as separate backend work:

1. Telemetry layer
   - per-node CPU
   - per-node memory
   - uptime
   - cluster aggregates
2. Richer agent metadata
   - last activity
   - task summary
   - agent capabilities or role tags
3. Richer session metadata
   - better timestamps
   - session source/owner
   - search and filters

## Practical design direction

Best path for the next redesign:

1. Reuse the Gemini layout, typography, spacing, colors, and interaction patterns.
2. Bind it to the current real API and type contracts.
3. Replace unsupported telemetry/service data with current real status and summary fields.
4. Keep unsupported ideas as visual placeholders only if they are clearly marked and not misleading.

## Bottom line

The Gemini design is good and worth using.

But it should be implemented as:

- **new frontend presentation**
- on top of **current real backend capabilities**

Not as:

- a requirement to invent missing services right now
