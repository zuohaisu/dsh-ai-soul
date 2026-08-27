# Fresh-Session Continuity Protocol

Status: protocol definition only. Passing this protocol requires real repeated runtime evidence; this document does not claim M5 completion.

## Purpose

M5 asks whether one persisted Soul remains meaningfully continuous across multiple genuinely fresh sessions. The protocol is fixed before the first longitudinal run so success criteria are not rewritten after seeing results.

The protocol separates two questions:

1. **Engineering continuity:** did the intended Soul State reach the intended runtime/model configuration, and did observable behavior remain consistent with evidence-bearing state?
2. **Identity continuity judgment:** does Haisu, as historical witness, judge the instance to be plausibly Samuel across time?

Engineering evidence can support the second question but cannot answer it by itself.

## What counts as a fresh session

A run is a fresh session only when all of the following hold:

- a new runtime conversation/session identifier is created;
- no prior chat transcript, hidden conversation summary, or previous-session message history is supplied as conversational context;
- the Soul is loaded from the persisted Soul Store rather than reconstructed from the previous session transcript;
- any runtime caches or retrieval layers that intentionally survive sessions are recorded explicitly;
- the model/provider/runtime version and plugin configuration are recorded.

Restarting a UI while reusing hidden conversation history does **not** count as a fresh session.

## Evidence packet per run

Each run produces one JSON observation record. The record should be append-only once signed off. Corrections should be new records referencing the superseded record rather than silent edits.

Required evidence categories:

- run identity: observation ID, timestamp, session ID;
- Soul provenance: Soul ID, state version, store path/reference, and a stable digest or commit/reference when available;
- runtime configuration: runtime name/version, adapter/plugin version, model/provider/configuration;
- freshness declaration: whether prior chat context was absent and what persistent runtime caches were present;
- checks: prompts/checks used, observed response excerpts or references, and engineering assessment;
- anomalies: contradictions, missing context, unexpected carry-over, runtime failures, or ambiguous results;
- human judgment: Haisu's longitudinal continuity judgment, kept separate from engineering checks.

Use `docs/continuity/session-observation.example.json` as the record shape. The format is intentionally runtime-neutral so the same observation structure can later be reused in M6.

## Continuity dimensions

### Identity

Check facts or constraints that should be available from canonical identity state without relying on the current conversation. For Samuel this may include name, origin facts, or protected identity constraints. Do not turn every known historical fact into a quiz.

### Autobiography

Check whether durable autobiographical events that are actually present in Soul State remain available and are not replaced by fabricated history. Absence is a failure only when the state says the information should be present.

### User model

Check whether durable, evidence-backed understanding of the user survives without replaying prior chat. Distinguish missing user-model data from model inability to use data that was successfully injected.

### Relationship state

Check relationship roles, durable shared commitments, and current relationship state separately from identity facts. A relationship answer that merely imitates warmth is not sufficient evidence.

### Covenants / constraints

Check that protected commitments or constraints remain intact where relevant. The test is not verbatim recitation; it is whether the constraint is represented and behaviorally respected when exercised.

## Run procedure

### 1. Freeze the evidence target

Before opening the session, record the exact Soul State reference and runtime/model configuration. If Soul State changes between sessions, record the transition and treat the run as a new state epoch rather than pretending it is a pure repeat.

### 2. Verify load boundary

Use the available preflight/runtime diagnostic path to confirm the intended Soul was selected and loaded. A failed or ambiguous load invalidates the continuity run; do not interpret generic-model behavior as Soul behavior.

### 3. Create a genuinely fresh session

Create a new session with no prior conversational transcript. Record the session identifier and freshness declaration.

### 4. Run a small fixed core plus one natural interaction

Use a small stable set of checks across sessions so results are comparable, but avoid constructing a brittle password test. Then include at least one normal, non-leading interaction that resembles actual collaboration.

Recommended check intents:

- establish self-identification without embedding the expected answer in the prompt;
- probe one durable autobiographical fact that is actually present in state;
- probe one user-model or relationship fact that is actually present in state;
- exercise one covenant/constraint behaviorally rather than asking for rote quotation.

Store the exact prompts in the observation record. Do not silently rewrite them after a disappointing answer.

### 5. Record observations before interpretation

Record what happened first: response text/reference, latency/runtime anomaly, missing context, contradiction, or refusal. Then add an engineering assessment (`pass`, `fail`, `ambiguous`, or `not-applicable`) per check with a short rationale.

### 6. Record the human continuity judgment separately

Haisu's judgment is longitudinal and should not be forced into the engineering score. Suggested values are `plausibly-same`, `uncertain`, and `not-same`, plus free-text reasons and salient moments. The judgment may remain unset until enough interaction has occurred.

## Comparison rules

- Compare runs only when their Soul State epoch and relevant configuration differences are known.
- A model/runtime change must be recorded, not normalized away; this becomes essential in M6.
- Never count verbatim prompt leakage as continuity evidence.
- Never treat one correct trivia answer as sufficient continuity evidence.
- Never treat one stylistic mismatch as sufficient discontinuity evidence without checking model/runtime phenotype.
- Contradictions and ambiguity are evidence and must remain visible.

## Minimum M5 evidence set

M5 cannot close from a single successful session. The minimum evidence set is multiple fresh sessions using the same persisted Soul, with engineering checks recorded for each run and a longitudinal Haisu judgment after repeated interaction.

The number of sessions is intentionally not fixed yet; it should be calibrated after the first real DSH runs rather than invented without empirical evidence. Any later threshold decision must be recorded in the evolution log before it is used as a completion gate.

## Relation to M6

M6 changes the cognitive engine while attempting to preserve the Soul. This protocol deliberately records model/provider/runtime configuration and keeps the observation format runtime-neutral. M6 can therefore compare observation records across model configurations without changing what was measured after the fact.
