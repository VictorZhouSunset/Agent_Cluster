# Tier 0 Single-Node Health Implementation

## Scope

- Provider bootstrap
- Remote adapter client timeout handling
- Focused tests covering Tier 0 topology and remote timeout fallback

## Planned Changes

1. Extend cluster provider env parsing with:
   - `GATE_CLUSTER_TOPOLOGY`
   - `GATE_CLUSTER_ADAPTER_TIMEOUT_MS`
2. Disable remote adapter creation when topology is `tier0`.
3. Add an abort timeout around remote adapter `fetch`.
4. Add tests proving:
   - Tier 0 ignores configured remote adapter env.
   - Hung remote requests fail fast instead of hanging health forever.

## Verification

- Run focused Vitest suites for cluster provider wiring and remote adapter client behavior.
- If green, note that the baked AMI must be regenerated with `GATE_CLUSTER_TOPOLOGY=tier0`.
