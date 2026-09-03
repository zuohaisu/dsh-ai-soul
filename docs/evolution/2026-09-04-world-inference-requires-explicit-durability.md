# WORLD inference requires explicit durability

## Decision

A runtime interaction does not become canonical WORLD context merely because it mentions a project, person, place, fact, or task.

The first WORLD inference boundary recognizes only explicit durable shared context declarations, initially:

- an active project the human explicitly asks the Soul to remember; or
- a shared durable commitment the human explicitly asks the Soul to remember or states as forward-looking.

The inferred result is only a provenance-bound Candidate Claim for `worldModel`. It has no mutation authority and must pass through independent governance before canonical state can change.

## Why

WORLD is the compact current model of the external context that materially shapes the Soul-human relationship and ongoing action. If incidental mentions are promoted automatically, WORLD collapses into chat history or generic knowledge and grows without bound.

Durability intent therefore acts as an epistemic and governance boundary, not as a keyword for automatic memory.

## Consequences

- Ordinary project mentions remain fail-closed.
- One-off tasks, locations, news, and incidental people remain fail-closed.
- Raw interaction history stays separate from canonical WORLD state.
- Future WORLD inference policies may broaden only through explicit, falsifiable policies with provenance and governance.
- This decision does not authorize generic entity extraction, RAG ingestion, or direct WORLD mutation.

Tracked by GitHub issue #208.
