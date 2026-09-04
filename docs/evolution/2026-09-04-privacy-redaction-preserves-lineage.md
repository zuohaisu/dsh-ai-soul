# 2026-09-04 — Privacy redaction preserves lineage without preserving plaintext

## Decision

AI Soul distinguishes **cognitive forgetting** from **physical payload redaction**.

A Soul may stop treating a claim as current cognition through governed retirement while the historical evidence still exists. Separately, a privacy request may require removal of sensitive payload content from an Experience Record. That operation must not pretend the Experience never occurred or silently sever the provenance chain.

For the first physical-erasure primitive, a redacted Experience keeps its stable record identity, timestamp, kind, source, and provenance, but replaces the original payload with an explicit redaction marker containing:

- redaction schema version;
- SHA-256 digest of a canonicalized representation of the prior payload;
- redaction timestamp;
- reason;
- redaction provenance.

The prior plaintext payload is not retained in the redacted record.

## Why

Two failure modes must both be avoided:

1. **Privacy failure** — keeping the sensitive payload merely because provenance matters.
2. **Continuity failure** — deleting the entire Experience identity so later derived claims, audits, or lineage references become inexplicable.

The digest is an audit anchor, not recoverable memory and not evidence that the redacted content should remain model-visible.

## Boundaries

This primitive is intentionally local to one Experience Record. It does not yet guarantee cascading deletion from autobiography, imported artifacts, governance/evolution records, filesystem backups, logs, or external systems. Those require explicit follow-on semantics because deletion scope and lineage consequences differ by store.

Redaction also grants no authority to mutate canonical SELF / OTHER / RELATIONAL / WORLD state. If current cognition must change, that continues through normal governed retirement/revision/consolidation.

## Invariant

> Privacy deletion may remove content while preserving the minimum non-content lineage needed to explain that a governed deletion occurred.
