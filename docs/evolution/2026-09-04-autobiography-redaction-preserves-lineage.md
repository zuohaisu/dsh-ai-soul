# Autobiography redaction preserves lineage while removing derived content

Date: 2026-09-04
Status: accepted engineering invariant

M4.19 made erasure impact visible before granting destructive authority. The first concrete content-bearing derived artifact is autobiography: promotion may copy an Experience payload and add interpretation, significance material, and a human-readable promotion reason.

A privacy-safe autobiography operation therefore must not simply delete the entry. Deleting it would erase historical lineage and make later audit impossible. It also must not merely redact the original Experience while leaving copied autobiography content intact.

The bounded operation introduced here redacts four content-bearing fields from exactly one autobiography entry linked by `sourceExperienceId`:

- `payload`;
- `interpretation`;
- `significanceAssessment`;
- `promotion.reason`.

It preserves structural lineage:

- autobiography id;
- experienced/promoted timestamps;
- event kind;
- `sourceExperienceId`;
- promotion provenance;
- Experience provenance.

The removed fields are replaced by no plaintext. A dedicated redaction marker records deterministic SHA-256 digests, redaction time, explicit reason, and provenance. Those digests are lineage anchors only; they are not memory and must not be used to reconstruct or inject the removed content.

Key invariant:

> Privacy removal of derived autobiography content must preserve the fact and provenance of the historical transition without preserving the sensitive derived content itself.

This primitive is deliberately narrow. It does not erase the raw Experience record, candidate claims, proposals, evolution evidence, current cognition, logs, backups, exports, caches, or semantic copies. Those remain separate impacts requiring their own storage/governance semantics.

The operation fails closed when no entry matches, more than one entry matches, governance metadata is missing, the Soul State is malformed, or the target entry has already been redacted. It returns a detached next Soul State and does not mutate the supplied state in place.
