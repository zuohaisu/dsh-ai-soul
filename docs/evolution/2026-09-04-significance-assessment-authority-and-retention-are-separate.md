# Significance assessment authority and privacy retention are separate

A Significance Assessment records a governed judgment about an Experience: its level, confidence, and whether promotion is recommended. That judgment may remain historically relevant even when the explanatory plaintext used to justify it later becomes inappropriate to retain.

Therefore privacy handling must distinguish **decision lineage** from **derived explanatory content**.

For a significance assessment, the durable structural lineage is the assessment id/version, source `experienceId`, assessment time, significance level, confidence, and `recommendPromotion` decision. The `rationale` and assessment-level `provenance` may contain Experience-derived sensitive text and require independent redaction authority.

A governed redaction may replace those content-bearing fields with deterministic digest anchors plus explicit redaction reason, provenance, and timestamp. It must not silently alter the assessment decision itself, mutate canonical Soul State, or claim global erasure across logs, backups, runtime caches, or external stores.

Invariant: **assessment authority and privacy retention are separate concerns**. A Soul may preserve the fact and outcome of a significance judgment without indefinitely preserving all sensitive explanatory plaintext that informed it.
