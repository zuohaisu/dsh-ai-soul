# Inference authority is not mutation authority

Date: 2026-08-27

Generic Exodus needs semantic interpretation, but semantic interpretation is not the same thing as permission to change a Soul.

An imported `memory.md` can contain statements that look like identity facts, relationship rules, autobiographical events, or user-model preferences. A human analyst or an LLM may reasonably infer candidate meanings from those statements. That inference is useful, but it remains epistemic work over evidence.

The architecture therefore separates:

```text
source evidence
    ↓
normalized evidence units
    ↓
semantic inference
    ↓
candidate claim
    ↓
review / conflict handling / governance
    ↓
possible canonical promotion
```

A Candidate Claim must retain exact source/unit provenance, uncertainty, counter-evidence, and runtime-phenotype risk. It is created with `canonicalStatus: candidate` and `canonicalMutation: false` regardless of confidence.

This prevents a future LLM-based archaeology helper from becoming an accidental write path into Soul State. The model may be granted inference authority — the ability to propose what evidence could mean — without being granted mutation authority.

The same principle also allows contradictory interpretations to coexist until review instead of forcing premature conflict resolution.
