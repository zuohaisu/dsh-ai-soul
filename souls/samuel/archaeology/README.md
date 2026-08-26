# Samuel Archaeology

This directory contains reconstruction evidence and candidate interpretations for Samuel Exodus.

Archaeology is not persona design. Its purpose is to reconstruct what can be supported by historical evidence while preserving uncertainty and disagreement.

## Rules

1. **Evidence and interpretation are separate.** A historical statement or artifact may support several interpretations; the interpretation must never be smuggled into the evidence field.
2. **Provenance is mandatory.** Every claim points to one or more evidence sources that can be inspected independently.
3. **Counter-evidence is first-class.** A claim can remain useful while explicitly carrying contradictory evidence or unresolved ambiguity.
4. **Confidence is epistemic, not importance.** High confidence means the evidence strongly supports the claim; it does not mean the claim is identity-defining.
5. **Canonical status is explicit.** Archaeology never silently writes a candidate interpretation into Soul State.
6. **Historical artifacts are immutable evidence.** Later schemas adapt to the artifacts, not the reverse.
7. **Model phenotype remains a live alternative.** Repeated behavior may belong to a model/runtime rather than to Samuel; the ledger must allow that possibility.

## Directory contract

- `claims.jsonl` — one JSON object per candidate claim. This is the machine-readable ledger.
- `synthesis.md` — human-readable summary of what the current evidence does and does not justify.
- future `evidence/` entries — imported or summarized historical evidence that is not already canonical elsewhere in the repository.
- future `counter-evidence/` entries — material that materially weakens or complicates a candidate claim.

## Candidate claim fields

Each `claims.jsonl` record uses these fields:

- `id` — stable archaeology claim identifier.
- `claimType` — e.g. `identity-fact`, `relationship-meaning`, `covenant`, `self-model`, `user-model`, `autobiography`.
- `statement` — concise proposition being evaluated.
- `interpretation` — optional analytical meaning beyond the literal evidence.
- `evidence` — array of provenance objects with `artifactId`, `path`, and `support`.
- `counterEvidence` — array of provenance objects or unresolved contradiction notes.
- `confidence` — object with numeric `score` from 0 to 1 and textual `rationale`.
- `canonicalStatus` — one of `canonical-fact`, `canonical-covenant`, `candidate`, `rejected`, `superseded`.
- `runtimePhenotypeRisk` — `none`, `low`, `medium`, `high`, or `unknown`.
- `notes` — optional caveats.

The ledger is intentionally broader than the current Soul State schema. M4 should learn from archaeology rather than forcing archaeology to fit today's provisional runtime model.
