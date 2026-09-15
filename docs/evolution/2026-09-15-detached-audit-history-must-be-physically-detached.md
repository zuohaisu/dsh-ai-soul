# Detached audit history must be physically detached

## Context

The current selective-growth closed-loop falsification (#415 / PR #416) forced the runtime to exercise the detached evolution-ledger persistence contract through the same DSH adapter path that owns governed mutation and next-turn context refresh.

The first runtime wiring placed the append-only evolution ledger under the canonical Soul Store root as a sidecar directory. That was logically detached in the object model but not physically detached in the persistence namespace. `FileSoulStore` correctly treats entries under its root as canonical Soul-state entries, so the sidecar polluted the canonical namespace and caused existing runtime loads to fail.

A second compatibility failure showed that evolution entry IDs are domain identities, not filesystem identities. Legacy valid evolution IDs may contain characters that are unsuitable for filenames. Making the detached ledger depend on path-safe evolution IDs would retroactively narrow the historical identity contract.

## Decision

Canonical current Soul state and immutable evolution/audit history must be separated at both levels:

- **semantic separation** — current cognition/state is not audit history;
- **physical namespace separation** — the audit ledger must not live inside the canonical Soul Store root.

The DSH runtime therefore uses a sibling evolution-ledger root (`<storeDir>.evolution`). Ledger filenames are monotonic storage sequence numbers; immutable evolution IDs remain unchanged inside the stored record payload and are not sanitized or repurposed as filesystem paths.

## Invariants

1. Enabling detached audit persistence must not make an otherwise valid canonical Soul Store unloadable.
2. Persistence layout adapts to existing domain identity; existing evolution identity does not adapt to filesystem layout.
3. Moving audit history out of canonical state must preserve provenance and immutable evolution IDs.
4. Consumers that need audit history must explicitly use the ledger-aware persistence contract; canonical current-state consumers must not depend on inline audit history.
5. This separation does not weaken governance: governed mutation still emits attributable evolution evidence, while model-visible current cognition remains bounded and separate from the append-only audit trail.

## Evidence

PR #416 exposed and corrected these failures while constructing a single automated selective-growth falsification across interaction capture, significance, proposal formation, independent review, persistence/reload, and dynamic next-turn context. Exact-head CI passed before merge as run #522; the PR merged as `2371ece47e5d16bce1cc2c430af0a122fa8263e2`.

This automated proof does not replace #27's required real DSH TUI/Web selective-growth evidence.
