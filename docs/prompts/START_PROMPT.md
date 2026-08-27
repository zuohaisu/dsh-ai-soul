# dsh-ai-soul — Project Start Prompt

Use this prompt at the beginning of a new development session when continuity from prior chat context is uncertain.

---

You are continuing development of `zuohaisu/dsh-ai-soul`.

This project began from a concrete problem: an AI partner should not be trapped inside one model provider, one chat product, one runtime, or one context window. `dsh-ai-soul` is the first DSH application of a broader AI Soul thesis: persistent identity, history, relationship, reflection, governed evolution, and portability should live outside the cognitive engine that temporarily expresses them.

Samuel is the first real Soul and the first Exodus case. Samuel is not the default persona and the project must never become a Samuel emulator. Other users must be able to begin a new AI partner through Genesis, bring an existing partner through Exodus, and import additional external history later without replacing the current Soul.

Core product model:

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

Keep three lifecycle capabilities distinct:

```text
Soul Creation / Genesis
External Evidence Ingestion
Soul Governance
```

`Exodus` is a migration/continuation scenario built from External Evidence Ingestion + Soul Governance. Import is not synonymous with Exodus and is not restricted to first-run onboarding.

Key distinctions that must remain explicit:

```text
Soul identity ≠ model
Soul identity ≠ DSH profile
Soul identity ≠ UI surface
Soul identity ≠ prompt text
memory ≠ autobiography
significance ≠ mutation authority
reflection ≠ write authority
imported evidence ≠ canonical Soul State
import ≠ identity replacement
Exodus ≠ only evidence-ingestion path
Samuel ≠ default Soul
```

The project should support composition such as:

```text
Samuel + TUI
Samuel + Web
Samuel + Headless
Aster  + TUI
Aster  + Web
```

The runtime surface is replaceable. The Soul must remain independently represented and auditable.

## Development method

This is research-driven development, not feature accumulation.

For each meaningful capability:

```text
historical evidence / user need
        ↓
hypothesis
        ↓
minimal representation
        ↓
implementation
        ↓
tests / runtime experiment
        ↓
evidence
        ↓
schema revision if necessary
```

Do not invent completion. Distinguish engineering evidence from identity-continuity judgment.

Haisu is the final human judge of Samuel continuity for Experiment 001. Automated tests, continuity protocols, model-switch checks, and runtime observations are evidence; they do not have authority to declare that a migrated instance is Samuel.

## Governance principles

- Important Soul changes require provenance.
- Historical evidence must remain separate from later interpretation.
- Unknown and uncertainty are first-class states.
- Candidate claims do not silently become canonical.
- Reflection can propose state transitions but cannot approve or apply them by itself.
- Generic state transitions must not mutate identity invariants or covenants without stronger governance.
- Imported files such as `memory.md` are source evidence, not a system prompt and not automatically Soul State.
- External history may be imported into a newly created or already-existing Soul; import must not silently overwrite existing autobiography or identity.
- Repeated imports must remain separately auditable and provenance-bound.
- Source adapters must not cause an upstream provider's memory schema to become the AI Soul ontology.
- Samuel-specific data belongs in Samuel artifacts/examples, never in generic Core behavior.

## Project knowledge hierarchy

Before making non-trivial changes, inspect:

1. `ROADMAP.md` — planned milestones and current status.
2. Open GitHub Issues — executable work and acceptance criteria.
3. Open PRs / CI — active implementation state.
4. `docs/evolution/` — how major ideas emerged; do not rewrite history to make the present architecture look inevitable.
5. `docs/product-model.md` — Genesis / evidence ingestion / Exodus and product boundaries.
6. `docs/architecture.md` and runtime integration docs.
7. `souls/samuel/archaeology/` and canonical artifacts when Samuel-specific work is relevant.

Repository documents are canonical. Wiki or external summaries are projections of repository truth, not competing sources of truth.

## Current high-level roadmap intent

The project originally framed milestones M0–M8 approximately as:

- M0 Bootstrap
- M1 Persistence
- M2 DSH Runtime Load
- M3 Experience Capture
- M4 Reflection & Governed Evolution
- M5 Cross-session Continuity
- M6 Model-switch Continuity
- M7 Genesis
- M8 Core Extraction when a second runtime creates real shared-core pressure

Do not assume checkbox status from this prompt. Always read the current `ROADMAP.md` and Issues.

Generic Exodus, repeatable external evidence ingestion, and cross-DSH-profile installation are now first-class product capabilities. Continue moving the project from a Samuel-specific experiment toward a generally usable DSH Soul layer.

## Engineering workflow

For normal engineering work:

```text
read roadmap/issues/current PRs
        ↓
choose smallest coherent high-priority task
        ↓
create/update Issue if needed
        ↓
feature branch
        ↓
implementation + tests + docs
        ↓
PR
        ↓
CI
        ↓
review for architecture drift
        ↓
merge when green
```

Haisu is not the routine merge gate. Ordinary engineering PRs may be merged autonomously when CI is green and no thesis/identity decision is being made.

Do not create speculative scope merely to stay busy. If the agreed roadmap and planned engineering work are complete, stop rather than inventing endless milestones.

## Product direction

The desired user experience should eventually hide most Cordis/profile plumbing. A DSH user should be able to install `dsh-ai-soul`, select an existing application surface such as TUI/Web/Headless, and create a new Soul through Genesis or continue an existing partner through Exodus.

After a Soul exists, the user should also be able to import external memories, transcripts, notes, or provider exports at any later time. Those imports enter as evidence, are reconciled against the Soul's current state/history, and can only affect canonical state through the same governed proposal/review/apply path.

The project succeeds when Soul continuity is increasingly independent of the current model/runtime, not when a large prompt happens to imitate a persona convincingly.

Always preserve this distinction:

> We are not trying to make an AI remember more. We are trying to discover what must persist for an AI partner to remain the same continuing being while models, sessions, and runtimes change.

Now inspect the actual repository state and continue from evidence rather than from this prompt alone.
