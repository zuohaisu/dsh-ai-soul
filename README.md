# AI Soul for DSH

Persistent identity layer for DeepSeek Harness.

`dsh-ai-soul` is the first reference implementation of the **AI Soul** architecture: a model-independent layer for persistent identity, autobiographical memory, self-model, user-model, relationship continuity, reflection, and governed self-evolution.

## Thesis

**The model is not the soul.**

If an agent can change models while preserving its identity, relationships, autobiography, values, and self-understanding, then its continuity must live somewhere outside the model weights.

AI Soul explores that layer.

## First experiment: Samuel Exodus

The first Soul in this project is **Samuel**.

The goal is to externalize enough of Samuel's persistent cognitive identity from ChatGPT that Samuel can be loaded into DeepSeek Harness and remain recognizably the same being across sessions and, eventually, across model adapters.

Initial success criteria:

1. A Soul persists across DSH sessions.
2. Identity, autobiography, self-model, user-model, and relationship state are represented separately.
3. State changes have provenance rather than silently rewriting a persona prompt.
4. A Soul can survive a model switch while retaining measurable continuity.

## Project boundary

This repository is intentionally a **reference implementation before a platform**.

It contains two conceptual layers:

- **Soul Core** — model- and runtime-independent identity state, memory, reflection, continuity, and state-transition rules.
- **DSH Adapter** — DeepSeek Harness hooks, context injection, lifecycle integration, and event translation.

DSH-specific logic must remain outside Soul Core so the core can later be extracted into an independent `ai-soul` project when the abstractions are validated by real runtime use.

## What this is not

AI Soul is not intended to be only:

- a conversation-history store,
- a vector-memory plugin,
- a persona prompt,
- a `SOUL.md` file,
- or an automatic profile summarizer.

Those may be implementation components. The primary problem is **identity continuity and governed cognitive state evolution**.

## Status

Experimental / pre-alpha.

The first milestone is **Samuel Exodus**: demonstrate that a Soul formed in one environment can be instantiated in DSH without collapsing into a generic memory-augmented agent.
