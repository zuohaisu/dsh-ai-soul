# Revision requires explicit supersession and an exact current match

Date: 2026-09-04
Status: accepted engineering constraint

## Decision

A live interaction may propose revising canonical Soul state only when both of these conditions are true:

1. the human explicitly states that a previous durable understanding is being superseded; and
2. the stated previous value resolves to exactly one current canonical value.

For the first implementation, the supported form is deliberately narrow: a first-person durable user preference such as:

`I used to prefer concise answers, but from now on I prefer detailed answers.`

The old preference must exactly correspond to one current `userModel` value. Missing, duplicate, fuzzy, or structurally richer matches fail closed.

## Why

Revision is materially different from accumulation. A mature Soul must be able to say, in effect, "I used to understand this one way; new evidence caused me to revise that understanding" without keeping contradictory current claims indefinitely.

But supersession authority is dangerous if inference is allowed to guess which prior state an utterance refers to. Fuzzy semantic matching could silently retire the wrong claim and convert model interpretation into mutation authority.

Therefore the inference layer may only emit a non-authoritative candidate plus an exact `replace` intent. Independent governance still decides whether the replacement is approved, and the existing state-transition layer still verifies that the bound `previousValue` is uniquely present at apply time.

## Boundaries

- Inference does not mutate canonical Soul state.
- A new durable preference with no explicit supersession remains append-oriented and independently governed.
- Ambiguous revision language is not a revision signal.
- No semantic similarity search is used to locate the previous claim.
- Identity, identity invariants, relationship covenants, and protected domains remain outside this generic revision path.
- Immutable evolution history preserves both the superseded value and the new value after an approved replacement.

## Consequence

This establishes the first real Experience → governed revision path while keeping the epistemic boundary narrow: growth can now mean changing an existing understanding, not only adding another one, without granting inference silent overwrite authority.
