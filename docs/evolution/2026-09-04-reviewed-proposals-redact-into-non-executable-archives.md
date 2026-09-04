# Reviewed proposals redact into non-executable archives

Date: 2026-09-04
Status: immutable evolution record

## Decision

A reviewed StateTransitionProposal must not be privacy-redacted in place and then treated as the same executable governance artifact.

Proposal contents are bound to the review by `proposalFingerprint`, and review contents are independently bound by `reviewFingerprint`. Rewriting content-bearing fields after review would either invalidate those fingerprints or require recomputing them, which would erase evidence of what was actually reviewed.

Therefore privacy handling for reviewed proposals uses a one-way archival transformation:

`reviewed executable proposal -> non-executable redacted archive`

The archive preserves proposal/review identity and decision metadata. The current fingerprint implementation is JSON serialization, not a cryptographic digest, so raw fingerprint strings may themselves contain sensitive proposal or review plaintext. A privacy-safe archive therefore preserves only SHA-256 digests of those fingerprint strings as lineage anchors. Content-bearing proposal and review fields are likewise removed from plaintext and represented only by deterministic digests plus explicit redaction governance metadata.

## Invariants

- Pending/unreviewed proposals are not eligible for this archival transformation. They remain active governance artifacts and require a separate lifecycle decision.
- The redacted archive is explicitly `executable=false` and must not be accepted by proposal review/apply machinery.
- Original proposal/review fingerprint strings are not retained because they may encode sensitive plaintext; deterministic digests of those strings are retained instead.
- Fingerprints are not recomputed from redacted content.
- Archival redaction does not undo an approved canonical state transition.
- Archival redaction does not rewrite canonical evolution history.
- Logs, backups, caches, external stores, exports, and semantic copies remain outside the claimed erasure scope.

## Rationale

Privacy and auditability are both first-class constraints. Auditability requires preserving that a governed decision occurred and a stable lineage anchor for the artifacts that were reviewed. Privacy does not require retaining all derived plaintext forever, including plaintext accidentally embedded inside a fingerprint representation. Converting a terminal proposal into a non-executable lineage-preserving archive with digest-only fingerprint anchors satisfies both constraints without granting redaction the authority to rewrite history.
