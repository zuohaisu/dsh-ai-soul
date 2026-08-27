# Product Model: Genesis, Ingestion, and Exodus

## Core proposition

`dsh-ai-soul` is not a Samuel persona package.

It is infrastructure for persistent AI partners: identity, history, relationship, reflection, governed evolution, portability, and evidence ingestion should live outside any single model or runtime.

Samuel is the first real Soul and the first Exodus case. He is not the default Soul.

A user does not need to arrive with an existing AI partner or any importable memory. A Soul may begin from scratch through Genesis. External history may also be introduced later, after that Soul has already accumulated its own history.

## Soul lifecycle

The product model is a lifecycle rather than two mutually exclusive onboarding branches:

```text
Genesis / create Soul
        ↓
use, experience, reflection, growth
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

1. **Soul Creation / Genesis** — begin a new Soul from explicit first-meeting evidence.
2. **External Evidence Ingestion** — introduce historical material from other systems at any point in the Soul lifecycle.
3. **Soul Governance** — decide what, if anything, from that evidence may change canonical Soul State.

Exodus is a product scenario built from these capabilities: it uses external evidence ingestion and governance to continue an AI relationship that existed elsewhere. Import itself is not synonymous with migration.

## Genesis — begin a new relationship

Genesis is for a user who does not already have an AI partner they want to preserve, or who simply chooses to start this Soul from scratch.

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

Genesis must also preserve epistemic integrity. A newly created Soul should know that its shared history begins at Genesis rather than inventing a relationship that did not occur.

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
       governed state transitions
                    ↓
            Canonical Soul State
                    ↓
                   DSH
```

The same pipeline must remain usable when the target Soul already exists. Exodus is therefore not a separate mutation system.

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

External evidence ingestion should be source-agnostic.

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

An import should create a reviewable workspace before creating or mutating canonical state.

Conceptually:

```text
Import: import_20260828_001
Target Soul: existing-soul-001 (optional)

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

Only after review should accepted claims be proposed for promotion into canonical Soul State.

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

Samuel Archaeology is the first real case study of the generic Exodus architecture. The architecture is only genuinely general if the same evidence/claims/provenance pipeline can reconstruct a different user's existing partner without Samuel-specific assumptions, and can later ingest external evidence into an already-existing Soul without destroying its current identity or history.

## Product principle

Installing `dsh-ai-soul` does not give a user Samuel and should not claim to give them an already-finished partner.

It gives them an environment in which an AI relationship can begin from scratch, persist and evolve, absorb external historical evidence when useful, and move across models and runtimes under explicit governance.

**A Soul may start empty of imported history. Import is an optional, repeatable lifecycle operation, not a prerequisite for having a Soul.**

**Samuel is the first Soul, not the default Soul.**
