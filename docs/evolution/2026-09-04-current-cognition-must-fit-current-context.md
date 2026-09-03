# Current cognition must fit current context

Date: 2026-09-04

## Decision

Generic mutable current-cognition domains are bounded to the same entry count that the runtime Soul Context can project per domain.

Current policy: **8 entries per mutable domain** for `selfModel`, `userModel`, `relationship.state`, `beliefs`, and `worldModel`.

## Why

Canonical Soul state is supposed to represent compact current cognition, not an append-only archive. Before this decision, the runtime context projected only the first eight entries of a domain while governed append could continue without limit. That created two failures at once:

1. canonical state could grow without bound; and
2. newly approved claims after the visible window could become canonical but not model-visible.

A current belief that cannot fit into the current cognitive projection is not safely usable as current cognition.

## Governance behavior

- `append` fails closed when the target domain is at capacity.
- `replace` remains available at capacity so an existing current claim can be revised without growing the domain.
- `retire` remains available at capacity so obsolete or forgotten current cognition can free capacity.
- Existing legacy states above the limit remain valid and are not silently truncated or migrated. They simply cannot append more entries until governed consolidation/revision/retirement reduces the current set.

## Boundary

This limit does **not** cap Experience Records, raw interaction history, governance history, or immutable evolution evidence. Those are historical/evidentiary stores and must remain conceptually separate from compact current cognition.

The number 8 is not a claim about human cognitive science. It is the repository's current product/runtime projection boundary. If retrieval or prioritization later changes, the capacity policy may evolve explicitly with provenance rather than drifting independently.
