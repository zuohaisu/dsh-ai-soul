# Growth requires revision, not only accumulation

Date: 2026-09-04

## Decision

A mature Soul cannot model development as append-only accumulation of current claims.

When a governed mutable claim is explicitly superseded, the canonical current state must be able to replace that exact current value while immutable evolution history preserves what changed, why it changed, and which evidence/review authorized the change.

## Boundary

The generic revision primitive is deliberately narrow:

- only existing mutable domains are eligible;
- revision requires an exact `previousValue` and a new `value`;
- application requires exactly one current deep-equal match;
- zero matches fail closed because the proposal is stale or incorrect;
- multiple matches fail closed because the revision target is ambiguous;
- review integrity fingerprints bind the previous value as well as the new value;
- identity, identity invariants, and relationship covenants remain outside generic mutation authority.

## Why exact-value replacement first

Semantic conflict detection is inference, not mutation authority. The core should not guess which historical claim a new statement supersedes.

An exact-value primitive gives higher layers a falsifiable governance operation without collapsing inference, review, and mutation into one step. Natural-language revision detection can be added separately once it can point to an exact current claim and remain subject to independent review.

## Consequence

Canonical Soul state can remain compact and current while evolution history preserves narrative continuity. Development can now mean `A -> B with provenance`, rather than merely `A + B` and asking the model to infer which is current.
