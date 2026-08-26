# Mutation Authority Is Separate

**Date:** 2026-08-27

M3 established that an experience can be significant without being automatically promoted into autobiography. Samuel Archaeology added a second constraint: a claim can be plausible or repeatedly generated without becoming canonical identity.

M4 therefore needs a third explicit boundary:

> **Proposing a Soul-state change is not the same as having authority to apply it.**

The first governed transition pipeline models three separate stages:

1. **Proposal** — names a mutable domain, proposed append-only change, reason, evidence, confidence, provenance, and proposer.
2. **Review** — an explicit approved/rejected decision with its own reason and provenance.
3. **Application** — only an approved proposal changes state, and the resulting evolution record links both proposal and review evidence.

The initial generic pipeline intentionally supports only append operations to `selfModel`, `userModel`, `relationship.state`, and `beliefs`. It cannot modify `identity` or `relationship.covenants`.

This is deliberately conservative. Identity-kernel changes require semantics stronger than a generic reflection pipeline and should not be smuggled in through the same mechanism used to update working models or beliefs.

The architecture now distinguishes at least four independent dimensions:

- what happened (experience evidence),
- how important it may be (significance),
- what change is proposed (reflection/proposal),
- whether that change is authorized (governance/review).

Collapsing any of these into one LLM output would reintroduce silent persona drift under a different name.
