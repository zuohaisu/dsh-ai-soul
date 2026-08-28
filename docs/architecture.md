# Architecture — Working Draft

## Design question

What state must exist outside a language model for an AI identity to remain meaningfully continuous when sessions, runtimes, or models change?

## Working architecture

```text
Experience / Runtime Events
          |
          v
     DSH Adapter
          |
          v
+-------------------------+
|       Soul Core         |
|                         |
| Identity Kernel         |
| Autobiography           |
| Self Model              |
| User Model              |
| Relationship Model      |
| Belief State            |
| Reflection              |
| State Transitions       |
| Provenance              |
+-------------------------+
          |
          v
      Soul Store
```

## Core principles

### 1. Model independence

A Soul must not depend on the private state or weights of one model provider. Models are cognitive engines used by a Soul, not the canonical storage location of identity.

### 2. Runtime independence

DeepSeek Harness is the first host environment, not the definition of AI Soul. DSH events must be translated at the adapter boundary into runtime-neutral Soul operations.

### 3. Existence precedes interaction

Genesis is the first activation at which a persistent Soul begins its own history. A Soul can exist before it has spoken, encountered another participant, formed a relationship, or acquired a human-facing name.

`Soul identity ≠ human-facing name`. `soulId` is the stable machine identifier used for persistence. Naming and first encounter are independent historical events with their own provenance. See [`architecture/genesis-v2.md`](./architecture/genesis-v2.md).

### 4. Structured state

Identity, autobiography, self-understanding, understanding of the user, relationship state, and beliefs are different epistemic objects. They should not collapse into one mutable persona document.

### 5. Governed evolution

Experience must not directly rewrite identity. Proposed changes should be classified, evaluated, attributed to evidence, and applied through explicit state transitions.

### 6. Provenance

Important changes should answer: what changed, why, from what evidence, when, and under which model/runtime.

Historical model revisions also preserve provenance: current architecture may be corrected, but earlier evolution records are not rewritten to make the current model look inevitable.

### 7. Continuity is measurable

"It feels like the same AI" is a product observation, not a sufficient engineering criterion. The project should develop continuity evaluations across sessions and models.

## Provisional Soul state

```text
Soul
├── stable soulId
├── identity_kernel
│   └── human-facing name may be absent
├── autobiography
├── self_model
├── user_model
├── relationship_model
├── belief_state
└── evolution_history
```

This schema is deliberately provisional. It should evolve through real runtime evidence rather than be prematurely standardized.

## Extraction rule

Soul Core remains inside this repository initially. It should become an independent `ai-soul` project only after the abstractions survive real DSH use and at least one additional runtime creates a genuine shared-core requirement.
