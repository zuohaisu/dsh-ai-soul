# Consolidation compresses current cognition without erasing lineage

Date: 2026-09-04
Status: accepted engineering invariant

## Decision

A mature Soul needs a governed way to turn several current mutable claims into one more compact current claim.

This operation is **consolidation**, not append, replace, retirement, raw summarization, or history deletion.

Its canonical shape is:

`A + B + ... + N -> C`

where every source value is explicitly named, every source must match exactly once in the current mutable domain, the resulting claim is explicitly supplied, and the whole operation requires independent review before mutation.

## Why

Bounded current cognition prevents canonical Soul state from becoming an unbounded prompt database. A capacity guard alone, however, only says "no more". It does not provide a path for the Soul to develop a more compact understanding.

Consolidation supplies that path while preserving governance:

- current cognition becomes smaller by `N - 1` entries;
- source experiences and governance evidence stay outside canonical current cognition;
- immutable evolution history records every source value and the resulting value;
- a missing, ambiguous, duplicated, or post-review-tampered source fails closed;
- consolidation has no authority over identity, identity invariants, or relationship covenants.

## Boundary

The generic primitive does **not** decide which claims are semantically related and does not authorize an LLM to silently compress state. Selection and synthesis are separate inference/reflection concerns. The primitive only provides an auditable mutation once exact inputs and a proposed result already exist.

Therefore:

**compact current cognition != erased history**

and

**consolidation authority != inference authority**.
