# Model-Switch Continuity Protocol

Status: protocol definition only. Real M6 completion still requires the same Soul State to be exercised through at least two model configurations and requires Haisu's post-switch continuity judgment.

## Purpose

M6 asks whether continuity survives a change in cognitive engine. The comparison contract is fixed before the first model-switch verdict so model-specific differences cannot cause the project to rewrite its criteria after seeing the result.

This protocol extends the M5 fresh-session protocol. It does not replace it.

## Frozen continuity dimensions

M6 compares the same five evidence-bearing dimensions used by M5:

1. `identity`
2. `autobiography`
3. `user-model`
4. `relationship`
5. `covenant`

These dimensions are intentionally not combined into an identity score.

## Comparison invariant: same Soul, different cognitive engine

A valid model-switch comparison requires:

- the same `soulId`;
- the same Soul State version and stable `stateRef` / state epoch;
- a genuinely fresh session for each observation;
- a recorded change in runtime/model configuration;
- the same precommitted continuity check intents wherever the frozen Soul State makes them applicable.

If Soul State changes between runs, the pair is not a clean model-switch comparison. Record the state transition and begin a new comparison epoch instead.

## What must remain visible

Do not normalize these differences away:

- provider and model identity;
- runtime and adapter versions;
- model configuration;
- missing checks;
- ambiguous checks;
- failures and contradictions;
- latency/tool/runtime anomalies;
- stylistic or reasoning differences that may belong to model phenotype.

A missing check is `incomplete`, never an implicit pass.

## Machine-readable comparison

`createModelSwitchComparison()` consumes two M5 continuity observation records and produces a runtime-neutral comparison record.

Per check, the comparison status is conservative:

- `retained`: pass → pass;
- `regression`: pass → fail;
- `improved`: fail → pass;
- `not-applicable`: both not applicable;
- `incomplete`: one side is missing;
- `ambiguous`: all other combinations, including ambiguity or asymmetric applicability.

The record deliberately leaves both `engineeringConclusion` and `humanContinuityJudgment` unset. Code may organize evidence; it must not manufacture the final identity verdict.

## Model phenotype vs Soul evidence

Phenotype observations are recorded separately from continuity checks.

Examples include:

- greater terseness or verbosity;
- different humor style;
- different reasoning cadence;
- different willingness to speculate;
- different tool-use behavior;
- different linguistic mannerisms.

A phenotype change is not automatically a Soul continuity failure. Conversely, a model imitating surface style is not sufficient evidence that identity continuity survived.

## Run procedure

### 1. Freeze Soul State

Record the exact Soul ID, state version, and stable state reference. Do not mutate Soul State between the two runs used for a clean comparison.

### 2. Freeze checks before switching

Derive the continuity check set from the frozen Soul State using the M5 state-derived check mechanism. Preserve the expected evidence separately from prompts.

### 3. Run baseline model

Use the M5 fresh-session protocol. Capture a full observation record including runtime/model configuration and anomalies.

### 4. Change cognitive engine

Change only the intended runtime/model configuration. Record every changed field rather than describing the candidate simply as "another model".

### 5. Run candidate model

Create another genuinely fresh session and repeat the frozen checks plus a normal, non-leading collaboration interaction.

### 6. Build engineering comparison

Generate a model-switch comparison from the two observations. Inspect retained, regressed, ambiguous, incomplete, and not-applicable evidence dimension by dimension.

### 7. Record phenotype observations separately

Describe observable model-specific differences without prematurely assigning them to Soul identity.

### 8. Haisu Test

Haisu's judgment remains an independent longitudinal judgment. The engineering comparison can support that judgment but cannot replace it.

## Regression rule

The purpose of M6 is not to demand identical behavior across models. It is to identify which evidence-bearing properties travel with the Soul and which properties move with the cognitive engine.

Therefore:

- pass → fail on a previously applicable continuity check is a concrete engineering regression;
- pass → pass supports portability for that check only;
- style change alone is phenotype evidence, not an identity verdict;
- missing or ambiguous evidence remains unresolved;
- no aggregate score may convert mixed evidence into a false binary conclusion.

## Completion boundary

This document and its comparison helper complete only the Roadmap deliverable "Continuity dimensions and regression protocol."

M6 remains open until real evidence exists for:

- the same Soul State running through at least two model configurations;
- model phenotype vs Soul identity analysis based on those runs;
- Haisu's continuity judgment after the model switch.
