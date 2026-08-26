# Evolution Log — Significance Is a Proposal, Not Authority

**Date:** 2026-08-27

## Problem

M3 needs a way to distinguish potentially meaningful experience from ordinary runtime events, but a classifier should not become an authority that rewrites autobiography simply because it returned a high score.

A significance judgment is epistemic evidence. Promotion is a governed state transition. They are different operations.

## Decision

Introduce `Significance Assessment v1` as a runtime-neutral proposal object tied to one Experience Record.

The assessment carries:

- significance level;
- rationale;
- bounded confidence;
- provenance;
- a boolean promotion recommendation.

It does **not** contain mutation authority.

Even `level: high` and `recommendPromotion: true` leave Soul State unchanged. Promotion still requires a separate explicit operation with its own reason and provenance.

When promotion occurs, the assessment may be preserved as supporting evidence so a human can later inspect both the classifier/reviewer judgment and the actual promotion decision.

## Why this matters

Without this boundary, an eventual LLM significance classifier could silently become an identity editor. A model hallucination, threshold change, or provider switch could then alter autobiography through an implementation detail.

Keeping assessment and promotion separate preserves three questions:

1. What happened?
2. How significant did an assessor think it was, and why?
3. Who or what authorized durable promotion?

This separation is expected to feed directly into M4 conflict/confidence/evidence handling.

## Non-decision

This log does not choose an LLM, prompt, threshold, or automatic promotion policy. Those remain outside M3.2.
