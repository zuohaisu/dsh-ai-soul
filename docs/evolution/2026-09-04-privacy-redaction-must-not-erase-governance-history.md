# Privacy redaction must not erase governance history

Date: 2026-09-04
Status: accepted engineering invariant

## Context

A governed state transition copies derived content into canonical Soul evolution history. That history can contain sensitive values, prior values, transition reasons, evidence, review commentary/provenance, conflict details, and the current proposal/review fingerprint representations. The latter are JSON strings and therefore can themselves carry plaintext.

Deleting only the originating Experience, autobiography entry, Candidate Claim, or reviewed proposal archive does not remove these copies from canonical Soul state.

## Decision

Canonical evolution history may undergo an explicit privacy redaction, but redaction must not silently rewrite the fact that governance occurred.

For one uniquely identified `governed-state-transition` entry, privacy redaction may remove content-bearing fields and replace them with deterministic SHA-256 lineage anchors. It must preserve the minimum historical governance identity needed to establish:

- which evolution entry existed and when;
- which target and operation were applied;
- confidence and proposer identity;
- proposal id;
- evidence ids when available;
- review decision, reviewer, review time, and policy.

Raw proposal/review fingerprints are not safe retention anchors because their present representation includes plaintext. Privacy-safe history stores only digests of those representations.

The redaction itself is a new append-only `privacy-redaction` evolution event. This makes the deletion action auditable and prevents a redacted record from appearing as though it had always contained less information.

## Invariant

> Privacy may redact historical content, but it must not erase the fact or governance identity of historical change.

This is distinct from ordinary cognition retirement and distinct from global erasure. The primitive does not claim that backups, logs, runtime caches, external stores, or semantic copies have been erased.

## Consequences

- Canonical Soul state can remove sensitive derived plaintext without deleting lineage.
- Redaction requires explicit reason and provenance and fails closed when the target is missing, ambiguous, malformed, non-governed, or already redacted.
- Identity invariants, covenants, current cognition, and unrelated evolution entries are not mutation targets of this primitive.
- Complete privacy erasure still requires impact assessment across storage boundaries and must not be inferred from this local mutation.
