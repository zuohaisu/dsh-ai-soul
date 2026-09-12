# Continuity digest is bounded presentation

Status: accepted implementation boundary for #374.

A continuity digest is a deterministic, read-only presentation projection of canonical Soul state. It exists to keep identity-continuity-relevant state compact and attributable when a full Soul Context would be unnecessarily broad.

The digest may project only fields whose semantics are already canonical enough to present without inference: explicit identity fields, identity invariants, covenants, SELF, OTHER, WORLD, and beliefs. Every projected entry carries its machine-readable source path and is bounded by entry count and per-entry character limits.

`relationship.state` is intentionally excluded. Its array shape does not establish item-level relationship ontology, so a continuity projector must not translate opaque relationship state into trust, intimacy, role, attachment, or other relational conclusions.

The digest is not memory, canonical truth creation, reflection, appraisal, governance, mutation authority, permission, or execution authority. Changing the digest does not change the Soul. Changing canonical governed state may change the corresponding attributed digest entry.
