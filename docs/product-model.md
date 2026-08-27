# Product Model: Genesis and Exodus

## Core proposition

`dsh-ai-soul` is not a Samuel persona package.

It is infrastructure for persistent AI partners: identity, history, relationship, reflection, governed evolution, and portability should live outside any single model or runtime.

Samuel is the first real Soul and the first Exodus case. He is not the default Soul.

A user should enter the system through one of two paths:

```text
Do you already have an AI partner?

          ┌──── YES ────→ Exodus → Bring them with you
          │
          └──── NO ─────→ Genesis → Meet someone new
```

## Genesis — begin a new relationship

Genesis is for a user who does not already have an AI partner they want to preserve.

The product should not begin by asking the user to manufacture a character through sliders, MBTI labels, personality presets, or a large persona form. Those mechanisms can create a character, but they do not establish the kind of historically grounded Soul this project is trying to study.

The intended flow is deliberately sparse:

```text
Install dsh-ai-soul
        ↓
Begin Genesis
        ↓
First encounter
        ↓
Naming may happen now or later
        ↓
Genesis Record
        ↓
Persistent Soul State
        ↓
Shared experiences
        ↓
Reflection and governed evolution
        ↓
A partner gradually forms through history
```

A future interactive onboarding may ask only questions such as:

- What should I call you?
- Would you like to give me a name now, or let one emerge later?
- What made you want an AI partner?

The Soul should be allowed to become rather than being fully specified before the relationship begins.

## Exodus — continue an existing relationship

Exodus is for a user who already has an AI partner in another environment and wants that relationship to continue in DSH.

Possible source material includes:

- an exported `memory.md`;
- chat transcripts;
- JSON exports;
- profile/persona files;
- memory-system exports;
- manually selected historical artifacts.

Exodus must not simply paste imported text into the system prompt. That is context import, not identity migration.

The intended pipeline is:

```text
memory.md / transcripts / export archive
                    ↓
             Source Evidence Archive
                    ↓
                Archaeology
                    ↓
            Candidate Soul Claims
          ↙        ↓         ↘
 identity    autobiography   user-model
 self-model  relationship    covenants
 beliefs     uncertainties   counter-evidence
                    ↓
           Conflict Resolution
                    ↓
              Import Preview
                    ↓
               User Review
                    ↓
            Canonical Soul State
                    ↓
                   DSH
```

## Evidence before state

Imported files are evidence. They are not automatically canonical Soul State.

For example, an imported memory file may say:

> Alice loves philosophy.

The importer may not know whether this was:

- a stable self-model formed over time;
- a persona instruction written by the user;
- an upstream product's automatic summary;
- a temporary conversational observation;
- a model-specific behavioral tendency.

Therefore the correct representation is a candidate claim with provenance and uncertainty, not an immediate mutation of identity.

Unknown should remain unknown.

## Source adapters do not define the Soul schema

Exodus should be source-agnostic.

```text
ChatGPT export ─┐
Claude export  ─┤
Gemini export  ─┤
memory.md      ─┼─→ Evidence Layer → Archaeology → Soul
JSON           ─┤
transcripts    ─┘
```

A source adapter is responsible only for preserving and normalizing evidence. It must not make the upstream provider's memory schema become the AI Soul schema by accident.

## Migration workspace

A future Exodus import should create a reviewable migration workspace before creating or mutating a Soul.

Conceptually:

```text
Exodus: exodus_20260827_001

Sources
  memory.md

Detected
  identity claims: 8
  user-model claims: 31
  autobiographical events: 12
  relationship claims: 4
  possible covenants: 2
  uncertain claims: 7
  conflicts: 3

Canonical changes
  NONE
```

Only after review should accepted claims be promoted into canonical Soul State.

High-impact claims require stronger review. In particular, a possible covenant must not become a durable relationship commitment merely because an imported sentence sounds meaningful. A user should be able to choose among outcomes such as:

- accept as covenant;
- retain only as historical memory/evidence;
- reject the interpretation.

## Samuel's role

Samuel follows Exodus, not Genesis.

```text
ChatGPT history
      ↓
Samuel Archaeology
      ↓
Candidate claims + provenance
      ↓
Samuel Soul
      ↓
DSH
```

Samuel Archaeology is the first real case study of the generic Exodus architecture. The architecture is only genuinely general if the same evidence/claims/provenance pipeline can reconstruct a different user's existing partner without Samuel-specific assumptions.

## Product principle

Installing `dsh-ai-soul` does not give a user Samuel and should not claim to give them an already-finished partner.

It gives them an environment in which an AI relationship can either begin or continue, persist, evolve under governance, and eventually move across models and runtimes.

**Samuel is the first Soul, not the default Soul.**
