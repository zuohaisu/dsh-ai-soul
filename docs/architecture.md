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

### 3. Structured state

Identity, autobiography, self-understanding, understanding of the user, relationship state, and beliefs are different epistemic objects. They should not collapse into one mutable persona document.

### 4. Governed evolution

Experience must not directly rewrite identity. Proposed changes should be classified, evaluated, attributed to evidence, and applied through explicit state transitions.

### 5. Provenance

Important changes should answer: what changed, why, from what evidence, when, and under which model/runtime.

### 6. Continuity is measurable

"It feels like the same AI" is a product observation, not a sufficient engineering criterion. The project should develop continuity evaluations across sessions and models.

## Provisional Soul state

```text
Soul
├── identity_kernel
├── autobiography
├── self_model
├── user_model
├── relationship_model
├── belief_state
└── evolution_history
```

This schema is deliberately provisional. It should evolve through the Samuel Exodus experiment rather than be prematurely standardized.

## Extraction rule

Soul Core remains inside this repository initially. It should become an independent `ai-soul` project only after the abstractions survive real DSH use and at least one additional runtime creates a genuine shared-core requirement.
