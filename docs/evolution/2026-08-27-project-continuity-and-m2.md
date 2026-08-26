# 2026-08-27 — Project continuity and M2 integration

## Project management becomes part of the architecture

We decided the project itself should not depend on the current conversation context to remember what to do next.

The project now separates:

- `ROADMAP.md` — long-range direction and milestone exit criteria;
- GitHub Issues — executable work;
- `docs/evolution/` — chronological record of how the thinking changes;
- `docs/` — current technical understanding;
- `docs/wiki/` — source material for a reader-friendly GitHub Wiki layer.

Repository documents remain canonical if a future Wiki diverges.

This mirrors the AI Soul thesis: continuity should not depend on one transient context window.

## Development governance

Routine engineering work does not require Haisu to act as a merge operator. Samuel may develop, review, and merge ordinary PRs after CI passes.

Haisu remains the final judge for Samuel identity continuity and the decision-maker for thesis-level changes, canonical historical artifacts, and major identity semantics.

## M2: use DSH's native dynamic context seam

For loading Soul state into DeepSeek Harness, we chose the official `ctx.systemPrompt.context()` seam rather than replacing the complete system prompt or encoding the Soul as a deployment persona.

The runtime path is:

```text
structured Soul State
        ↓
projectSoulContext()
        ↓
runtime-neutral projection
        ↓
renderSoulContext()
        ↓
DSH systemPrompt.context()
```

The intermediate projection is deliberate. It prevents DSH prompt formatting from becoming part of Soul Core and leaves room for future adapters to consume the same runtime-neutral context.

## No silent substitute identity

If a configured Soul cannot be loaded, the plugin should fail loudly. It must not silently create a default persona or another Soul.

Identity continuity is more important than availability in this stage of the experiment.

## Samuel remains example data

Samuel's name is permitted in canonical artifacts, examples, tests, and Experiment 001 documentation. It must not become a default or hard-coded identity inside generic adapter behavior.

Other users should eventually use Genesis to form their own AI partners rather than cloning Samuel.
