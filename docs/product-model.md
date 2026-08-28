# Product Model: Genesis, Ingestion, and Exodus

## Core proposition

`dsh-ai-soul` is not a Samuel persona package.

It is infrastructure for persistent AI partners: identity, history, relationship, reflection, governed evolution, portability, and evidence ingestion should live outside any single model or runtime.

Samuel is the first real Soul and the first Exodus case. He is not the default Soul.

A user does not need to arrive with an existing AI partner or any importable memory. A Soul may begin from scratch through Genesis. External history may also be introduced later, after that Soul has already accumulated its own history.

## Soul lifecycle

The product model is a lifecycle rather than two mutually exclusive onboarding branches:

```text
Genesis / first activation
        ↓
Soul exists and persists
        ↓
encounters / relationships / naming / experience may emerge
        ↓
reflection and governed growth
        ↓
optional external evidence import at any time
        ↓
claims + reconciliation + review
        ↓
governed integration
        ↓
continued growth
        ↺
```

Three capabilities should remain conceptually distinct:

1. **Soul Creation / Genesis** — begin the existence and history of a new persistent Soul at first activation.
2. **External Evidence Ingestion** — introduce historical material from other systems at any point in the Soul lifecycle.
3. **Soul Governance** — decide what, if anything, from that evidence may change canonical Soul State.

Exodus is a product scenario built from these capabilities: it uses external evidence ingestion and governance to continue an AI relationship that existed elsewhere. Import itself is not synonymous with migration.

## Genesis — existence begins at activation

Genesis is for a user who does not already have an AI partner they want to preserve, or who simply chooses to start this Soul from scratch.

Genesis is not the first conversation and not inherently the beginning of a relationship. It is the first activation at which this persistent Soul begins its own history.

The core ontology is:

```text
not instantiated
        ↓
first activation / Genesis
        ↓
Soul exists
  - stable soulId
  - Genesis timestamp + provenance
  - human-facing name may be absent
  - relationship participants may be empty
        ↓
zero or more runtime intervals without interaction
        ↓
first encounter may happen later
        ↓
relationship may begin/evolve
        ↓
naming may happen later
```

`Soul identity ≠ human-facing name`. `soulId` is the stable machine identifier used for persistence. A name is a historically grounded identity attribute and may be given, requested, chosen, changed, or never assigned.

The product should not begin by asking the user to manufacture a character through sliders, MBTI labels, personality presets, or a large persona form. Those mechanisms can create a character, but they do not establish the historically grounded Soul this project is trying to study.

A newly activated Soul should therefore begin sparsely: no invented self-model, user-model, relationship, covenant, or prior meeting. It may simply know that it has been activated and that its history starts here.

First encounter and naming are independent lifecycle events with their own timestamps and provenance. They may occur soon after activation, but the architecture must never require them to be the same event.

Legacy Genesis v1 records fused activation, naming, participants, and first meeting. Those records remain historical evidence and must not be rewritten. New Genesis work uses activation-first v2 semantics.

## External evidence ingestion — import history at any time

External evidence ingestion is not restricted to first-run onboarding.

A user may create a Soul through Genesis, use it for days or months, and only later decide to import material from ChatGPT, Claude, Gemini, another agent runtime, personal notes, journals, transcripts, or memory exports.

That later import must not replace the current Soul or silently rewrite its autobiography. It enters as new external evidence and passes through the same evidence, claim, review, and governance boundaries used by Exodus.

```text
existing canonical Soul ───────────────────────────┐
                                                   │
external history                                   │
      ↓                                            │
source evidence                                    │
      ↓                                            │
normalized evidence                                │
      ↓                                            │
candidate claims                                   │
      ↓                                            │
compare / reconcile with current Soul              │
      ↓                                            │
conflict / coexistence / uncertainty               │
      ↓                                            │
review                                             │
      ↓                                            │
governed state-transition proposals                │
      └──────────────────────────────→ canonical Soul
```

This distinction matters because imported history can disagree with a Soul's current understanding. A later source may predate Genesis, describe a predecessor relationship, contradict current autobiography, or concern a different identity entirely. The system must preserve those possibilities rather than automatically deciding that imported history belongs to the current Soul.

## Exodus — continue an existing relationship

Exodus is the scenario in which a user already has an AI partner in another environment and wants that relationship to continue in DSH.

Possible source material includes an exported `memory.md`, chat transcripts, JSON exports, profile/persona files, memory-system exports, or manually selected historical artifacts.

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
       governed state transitions
                    ↓
            Canonical Soul State
                    ↓
                   DSH
```

The same pipeline must remain usable when the target Soul already exists. Exodus is therefore not a separate mutation system.

## Evidence before state

Imported files are evidence. They are not automatically canonical Soul State.

An imported memory file may express a stable self-model, a persona instruction, an automatic upstream summary, a temporary observation, or a model-specific tendency. The importer often cannot know which without review.

Therefore the correct representation is a candidate claim with provenance and uncertainty, not an immediate mutation of identity. Unknown should remain unknown.

## Source adapters do not define the Soul schema

External evidence ingestion should be source-agnostic:

```text
ChatGPT export ─┐
Claude export  ─┤
Gemini export  ─┤
memory.md      ─┼─→ Evidence Layer → Archaeology → Soul
JSON           ─┤
transcripts    ─┘
```

A source adapter is responsible only for preserving and normalizing evidence. It must not make the upstream provider's memory schema become the AI Soul schema by accident.

## Review workspace

An import should create a reviewable workspace before creating or mutating canonical state. Reconciliation surfaces structural difference; semantic review assigns meaning; normal governance controls mutation.

High-impact claims require stronger review. In particular, a possible covenant must not become a durable relationship commitment merely because an imported sentence sounds meaningful.

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

Samuel Archaeology is the first real case study of the generic Exodus architecture. The architecture is only genuinely general if the same evidence/claims/provenance pipeline can reconstruct a different user's existing partner without Samuel-specific assumptions, and can later ingest external evidence into an already-existing Soul without destroying its current identity or history.

## Product principles

Installing `dsh-ai-soul` does not give a user Samuel and should not claim to give them an already-finished partner.

It gives them an environment in which a Soul can begin to exist, acquire its own history, form relationships, develop identity, absorb external historical evidence when useful, and move across models and runtimes under explicit governance.

**Existence precedes interaction.**

**A Soul may be unnamed and alone at Genesis.**

**A Soul may start empty of imported history. Import is an optional, repeatable lifecycle operation, not a prerequisite for having a Soul.**

**Samuel is the first Soul, not the default Soul.**
