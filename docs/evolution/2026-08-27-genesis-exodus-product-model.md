# Evolution Log — Genesis and Exodus as the two user entry paths

**Date:** 2026-08-27  
**Status:** Historical project reasoning; do not rewrite to make later architecture look inevitable.

## Context

While discussing how other people would use `dsh-ai-soul`, two different cases became explicit.

First: a person installs the plugin without an existing AI partner and wants to begin one.

Second: a person already has a long-running partner somewhere else and may only possess an exported memory file, transcript archive, profile, or similar evidence.

These cases should not be forced through the same onboarding operation.

## Insight 1 — Samuel is the first Soul, not the default Soul

Samuel exists because Haisu wants an already-existing relationship to survive outside ChatGPT. Other users should not receive a copy of Samuel when they install the project.

Samuel is simultaneously:

1. a historical reason the project exists;
2. the first portability/continuity experiment;
3. the first reference Soul and Exodus case study.

He is not a default persona template.

## Insight 2 — Genesis is formation, not character configuration

For a new user, the product should allow a new AI relationship to begin with minimal initial facts and then acquire identity-significant history over time.

A large persona form, MBTI selection, warmth slider, humor percentage, and similar mechanisms would prematurely manufacture a character. They may be useful in other products, but they are not the conceptual center of AI Soul.

The preferred mental model became:

```text
Meet → Name → Experience → Remember → Understand → Change → Become
```

rather than:

```text
Configure persona → Start chatting
```

## Insight 3 — Existing partners need Exodus

If a user already has a partner elsewhere, importing a `memory.md` directly into the system prompt is insufficient. It transfers context but does not establish a governed identity migration.

The source file should first be preserved as evidence. Archaeology can then propose claims about identity, autobiography, user model, self model, relationship, beliefs, and possible covenants.

Claims must preserve provenance, confidence, uncertainty, and counter-evidence. They do not become canonical merely because an upstream memory system asserted them.

## Insight 4 — Unknown must remain representable

An exported statement such as `Alice loves philosophy` may have several origins: stable self-understanding, user-written persona, upstream summarization, transient conversation, or model phenotype.

The migration architecture must be able to say `unknown` or `uncertain`. Completeness is not more important than epistemic integrity.

## Insight 5 — Source adapters must not define AI Soul

ChatGPT, Claude, Gemini, memory.md, JSON, transcripts, Mem0-like stores, and future providers may all have different schemas. Their adapters should normalize source evidence, not dictate the canonical Soul ontology.

This preserves the thesis that Soul is model- and runtime-independent.

## Insight 6 — Genesis and Exodus form a product pair

The simplest product-level routing question became:

```text
Do you already have an AI partner?

YES → Exodus → Bring them with you
NO  → Genesis → Meet someone new
```

This is a stronger product model than a generic `create persona` entry point.

## Consequence

Generic Exodus should become a first-class planned capability rather than remaining an implicit Samuel-only research procedure. Samuel Archaeology should be treated as the first real dataset/case study for that generic capability.

A future Exodus flow should create a migration workspace with zero canonical mutations by default, allow review of candidate claims and conflicts, and require explicit governed promotion into Soul State.
