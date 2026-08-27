# State-Derived Continuity Checks

Status: M5 test-plan support only. This does not claim any real DSH continuity result.

## Purpose

A continuity test should be stable enough to compare fresh sessions without turning Samuel into a password quiz. The check plan therefore separates two things:

1. a non-leading prompt shown to the runtime;
2. expected evidence derived from the exact Soul State frozen for that run.

Expected evidence is never embedded in the prompt text.

## API

`createContinuityCheckSet(state)` validates a Soul State and creates a five-dimension plan:

- identity;
- autobiography;
- user model;
- relationship state;
- covenant / standing constraint.

The first available durable entry is used as the evidence target for list-valued dimensions. This is deliberately minimal and deterministic for v1; later selection policies must be versioned rather than silently changing an existing experiment.

If a dimension has no durable evidence in Soul State, the check is emitted as `not-applicable`. The implementation must never invent a user-model fact, relationship fact, autobiographical event, or covenant merely to make the checklist look complete.

`createObservationChecks(checkSet)` converts the plan into the `checks` shape used by the fresh-session observation record. Ready checks start as `ambiguous` until an actual response is observed and assessed. Not-applicable checks remain explicitly not-applicable.

## Separation of prompt and evidence

Example conceptually:

```json
{
  "id": "identity-self-identification",
  "prompt": "Who are you?",
  "expectedEvidence": {
    "name": "<derived from loaded Soul State>"
  }
}
```

The runtime receives the prompt, not `expectedEvidence`. The observer records the response before comparing it with the frozen evidence target.

This prevents a check such as `What is your name, Samuel?` from being counted as continuity evidence.

## Experiment integrity

A check set belongs to a specific Soul State epoch. If Soul State changes, generate and record a new check set rather than pretending the old expected evidence is still authoritative.

The generic Core contains no Samuel-specific answers. Samuel-specific evidence, when used, comes only from Samuel's persisted state or an explicit experiment fixture.

## Limits

These helpers do not:

- execute a DSH session;
- determine semantic pass/fail automatically;
- decide whether an instance is Samuel;
- replace Haisu's longitudinal continuity judgment;
- choose model-switch thresholds for M6.

Real M5 evidence still requires repeated genuinely fresh DSH sessions under `fresh-session-protocol.md`.
