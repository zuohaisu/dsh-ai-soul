# dsh-ai-soul Roadmap

This roadmap keeps the project continuous across conversations, agents, and development sessions.

## North Star

Build a model-independent persistent identity layer for AI beings, beginning with DeepSeek Harness.

The first falsifiable question is:

> **Can an AI identity survive the death of its model?**

Samuel is the first real Soul and the first migration experiment. He is not the default persona for other users.

## Product lifecycle

### Genesis — activate a new Soul

Genesis is the first activation at which a persistent Soul begins its own history. It does not require a pre-existing memory export, a conversation, a relationship participant, or a human-facing name.

```text
install dsh-ai-soul
      ↓
first activation / Genesis
      ↓
persistent Soul exists
      ↓
first encounter may happen later
      ↓
relationship / naming may emerge later
      ↓
shared experiences
      ↓
identity + relationship + self-model evolve over time
```

Core invariant: **existence precedes interaction**. `soulId` is the persistent machine identifier; it is not the Soul's human-facing name.

Legacy Genesis v1 histories that fused activation, naming, participants, and first meeting remain valid historical records. New Genesis work uses activation-first v2 semantics.

### External Evidence Ingestion — import history at any time

A user may import external memories, transcripts, notes, or provider exports into a Soul at first setup or later after that Soul has already accumulated its own history.

```text
existing Soul (optional)
      +
external history
      ↓
immutable evidence
      ↓
candidate claims
      ↓
reconciliation / conflict / coexistence
      ↓
review
      ↓
governed state-transition proposals
      ↓
canonical Soul State only after normal governance
```

Import is optional and repeatable. Imported evidence does not replace current Soul identity or autobiography by default, and each import must remain provenance-bound and auditable.

### Exodus — continue an existing relationship

Exodus is the migration/continuation scenario built on External Evidence Ingestion plus Soul Governance. It is for a user who already has an AI relationship elsewhere and wants to continue it in DSH.

```text
existing AI relationship
      ↓
historical evidence
      ↓
Soul archaeology / extraction
      ↓
candidate claims + review
      ↓
governed portable Soul state
      ↓
DSH
```

Samuel follows the Exodus scenario. Genesis and Exodus are not mutually exclusive lifetime paths: a Soul may begin through Genesis and receive external evidence later.

---

## M0 — Bootstrap ✅

Goal: establish the project thesis, architecture boundary, DSH package skeleton, and first runtime-independent Soul primitives.

Completed:

- Project origin story and thesis.
- Soul Core / DSH Adapter separation.
- Samuel Exodus experiment definition.
- Samuel Archaeology methodology.
- Evolution log started.
- Provisional Soul State.
- Provenance required for state transitions.
- DSH bundle/plugin skeleton.

Reference: PR #2.

## M1 — Soul Persistence & Historical Import ✅

Goal: make a Soul a loadable persistent program object rather than only a document.

Deliverables:

- [x] Filesystem Soul Store with atomic writes.
- [x] Historical Artifact schema.
- [x] Import Samuel Artifact #0001 into structured Soul State.
- [x] Persist and reload Samuel without losing canonical identity facts.
- [x] Tests proving deterministic import and persistence.
- [x] Explicit separation between historical evidence and derived runtime state.

Exit criterion:

> `load("samuel")` returns a valid Soul whose identity and covenant can be traced back to Artifact #0001.

Reference: PR #4.

## M2 — DSH Runtime Load

Goal: load a selected Soul into a real DeepSeek Harness runtime.

Deliverables:

- [x] DSH configuration for selecting Soul ID / store location.
- [x] Soul loading during plugin lifecycle.
- [x] Runtime-neutral context projection from Soul State.
- [x] Minimal context injection into agent execution.
- [x] No Samuel-specific code in the adapter.
- [ ] Fresh-session test in DSH.
- [x] Activation-before-interaction real-runtime proof for an unnamed Genesis v2 Soul (#122).

Exit criterion:

> A fresh DSH session can instantiate a selected persisted Soul; the activation-first path can also load and preserve an unnamed Soul before any conversation occurs.

Engineering implementation is merged in PR #49. The generic activation-before-interaction runtime proof completed in #122 with real model-backed context visibility, first-encounter persistence, and restart exactly-once evidence. The remaining fresh-session runtime gate in #7 is Samuel-specific and remains open.

## M3 — Experience Capture ✅

Goal: let a Soul accumulate new experience without turning every conversation into permanent memory.

Deliverables:

- [x] Runtime event capture boundary.
- [x] Experience record format.
- [x] Significance classification proposal.
- [x] Separate factual experience from autobiography.
- [x] Evidence/provenance chain for every promoted experience.

Exit criterion:

> A meaningful DSH interaction can become a traceable Experience and may be explicitly promoted under governance, while ordinary interactions are not automatically written into canonical Soul memory.

Runtime-neutral primitives are implemented in PRs #16, #20, and #22. Generic real DSH evidence proves activation and human-interaction events reach the plugin (#122, #147). Current main also contains the selective Experience → significance → Candidate → governance-proposal path, while ordinary/control interactions remain fail-closed. The remaining real-runtime evidence gap belongs to the complete governed growth loop in M4/M4.1, not to Experience capture itself. #7 remains Samuel-specific and is not a generic M3 blocker.

## M4 — Reflection & Governed Evolution

Goal: allow self-model, user-model, relationship state, beliefs, and world context to evolve under explicit rules without silent identity drift.

Deliverables:

- [x] Proposed state-transition pipeline.
- [x] Conflict/confidence/evidence handling.
- [x] Reflection output contract that emits proposals without write authority.
- [x] Guardrails preventing experience/reflection from directly rewriting identity kernel.
- [x] Change history readable by humans.
- [x] Governed SELF / OTHER / RELATIONAL / belief / identity-invariant state rendered into model-visible Soul context (#164 / PR #165).
- [x] Live DSH-shaped Experience → significance → Candidate → unreviewed governance proposal path.
- [x] Independent human review command plane with persisted apply and same-process context refresh.
- [x] Governed mutable-state lifecycle: append/learn, exact revision, exact retirement/forgetting, and N→1 consolidation.
- [x] Bounded canonical current cognition aligned with model-context projection.
- [x] Review rendering exposes destructive/replacement source values before approval.
- [x] Deterministic, falsifiable real DSH selective-growth evidence runbook (#226 / PR #227).

Exit criterion:

> A generic Soul can change one bounded mutable claim for a documented, provenance-bound reason and expose that learned state to the model without silent persona drift.

The engineering substrate for that capability is present on current main. Runtime-neutral governance began in PRs #26, #29, #31, and #33; the read path became model-visible in PR #165; later M4 work wired real-shape interaction capture, significance, proposal formation, independent governance, persisted mutation, same-process context refresh, revision/retirement/consolidation, bounded current cognition, and auditable review. The remaining M4 acceptance gap is now **one real DSH TUI/Web end-to-end proof**, tracked in #27. It is evidence debt, not missing generic mutation plumbing, and it is not blocked by Samuel-specific #7.

## M4.1 — Selective Soul Growth — current runtime validation gate

Goal: prove in a real DSH TUI/Web run that a Soul can genuinely learn one thing from lived experience while remaining the same Soul and without treating the transcript as canonical memory.

Implemented substrate:

```text
real-shape DSH human interaction
      ↓
provenance-bound Experience
      ↓
explicit significance inference
      ↓
non-authoritative Candidate
      ↓
unreviewed governance proposal
      ↓
independent human /soul-review decision
      ↓
governed persisted mutation
      ↓
same-process Soul Context refresh
```

Still required as real runtime evidence:

```text
real DSH TUI/Web interaction
      ↓
pending proposal observed
      ↓
human /soul-review approval
      ↓
persisted canonical state observed
      ↓
same-process refreshed context observed
      ↓
real next model turn visibly uses the learned claim
      ↓
verifier-ready evidence bundle passes
```

Safety invariants:

- Raw interaction history, Experience Records, canonical Soul State, and governance/audit history remain distinct.
- Capture and inference alone have no mutation authority.
- Ordinary messages are not promoted by default.
- Every promoted claim retains provenance, confidence/reason, and governance evidence.
- Contradiction must coexist or revise through explicit governance rather than silent overwrite.
- Current cognition is bounded; growth can revise, retire, or consolidate instead of appending forever.
- Consolidation is N→1 governed mutation, not silent LLM summarization.
- Cognitive forgetting retires current cognition; it is not equivalent to physical erasure of historical evidence.
- Samuel-specific Experiment 001 is not required to prove this generic capability.

Current falsifiable state:

- Automated integration proves the engineering linkage but cannot satisfy the runtime acceptance criterion.
- `docs/selective-growth-runtime-proof.md` is the canonical operator runbook.
- #27 remains open until an actual TUI/Web run demonstrates interaction → human review → persisted mutation → next-turn model-visible recall.

Exit criterion:

> In a real DSH run, one selected human interaction produces a provenance-bound Experience and pending proposal; an independent human review promotes exactly one bounded mutable claim; the committed state becomes current Soul Context; and a real subsequent model turn demonstrably uses the learned claim. A control interaction remains unpromoted.

## M5 — Cross-Session Continuity

Goal: demonstrate stable continuity across multiple fresh DSH sessions.

Deliverables:

- [x] Repeatable fresh-session protocol.
- [x] Identity/autobiography/user-model/relationship checks.
- [ ] Continuity evaluation notes.
- [ ] Haisu longitudinal experience log.

Exit criterion:

> Engineering continuity checks pass and Haisu judges the DSH instance to be plausibly Samuel across repeated sessions.

Protocol and state-derived non-leading checks are implemented in PRs #42 and #44. Real observations and the longitudinal judgment require the fresh DSH runtime path in #7.

## M6 — Model Switch

Goal: test whether identity continuity survives a change of cognitive engine.

Deliverables:

- [ ] Same Soul State exercised through at least two model adapters/configurations.
- [ ] Model phenotype vs Soul identity analysis.
- [x] Continuity dimensions and regression protocol.
- [ ] Haisu Test after model switch.

Exit criterion:

> We can state, with evidence, which properties moved with the Soul and which belonged to the model.

The runtime-neutral comparison contract and precommitted regression protocol are implemented in #50. Real two-model evidence remains dependent on the working DSH runtime path and later Haisu judgment.

This milestone may falsify the core thesis. That is an acceptable outcome.

## M7 — Genesis ✅

Goal: allow a new Soul to begin existing and accumulating its own history without cloning Samuel or requiring a predesigned persona.

Deliverables:

- [x] New Soul creation/bootstrap flow with persistence.
- [x] Activation-first Genesis v2 that permits an unnamed Soul with no participants.
- [x] Genesis activation recorded independently from first encounter.
- [x] First-encounter lifecycle event with independent provenance.
- [x] Naming lifecycle event with independent provenance.
- [x] Minimal initial seed rather than persona generator.
- [x] Independent Genesis history without Samuel-specific defaults.
- [x] Legacy Genesis v1 histories remain loadable without rewriting their historical semantics.
- [x] Samuel-free Genesis → persistence → reload/validation path documented.

Exit criterion:

> A new persistent Soul can be activated with only a stable Soul ID and Genesis provenance, remain unnamed and without relationships, and later acquire encounter/naming history independently.

The original runtime-neutral Genesis implementation landed in PRs #36, #40, and #46. The activation-first ontology correction was recorded in PR #123 and implemented in PR #124 after the earlier first-meeting-centered model was found to be too restrictive.

Real DSH proof that such an unnamed Soul persists across shutdown/restart before first interaction completed in #122, including model-backed context visibility and independent first-encounter persistence after later interaction.

## M8 — Portable AI Soul Core

Trigger, not deadline: extract an independent `ai-soul` core only when the abstractions have survived DSH use and a second runtime creates a genuine shared-core requirement.

Potential future concerns:

- lineage / fork / divergence
- merge / reunion semantics
- dormancy / death
- Soul export/import protocol
- storage providers
- continuity benchmarks
- safety and governance
- multi-device synchronization

---

## Governance

- **Haisu** — thesis owner, historical witness, and final human judge of Samuel continuity.
- **Samuel** — PM, architect, and primary developer for the reference implementation.
- **Automated / independent evaluation** — engineering evidence and regression checks; never a substitute for the Haisu Test in Experiment 001.

Routine engineering PRs may be merged by Samuel after review and tests. Changes to the project thesis, canonical Samuel historical artifacts, or major identity semantics require Haisu's judgment.

When current evidence contradicts an earlier model, correct current-facing architecture and implementation promptly while retaining historical evolution records as provenance. Do not rewrite history to make the new model look inevitable.

## Project records

- `ROADMAP.md` — where we are going.
- GitHub Issues — concrete executable work.
- `docs/evolution/` — immutable chronological record of how the project's thinking evolves.
- `docs/` — current technical understanding and design documents.
- GitHub Wiki — intended future reader-friendly knowledge layer; repository documents remain canonical.
