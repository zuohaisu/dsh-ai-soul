# Selective-growth real-runtime capture worksheet

Use this worksheet **during** the real DSH TUI/Web run described by `docs/selective-growth-runtime-proof.md`. It is a note-taking aid, not runtime evidence, and it cannot satisfy Issue #27 by itself.

Do not pre-fill success values. Write only observations and durable evidence references actually obtained from the live run. If a required value cannot be observed, write `MISSING` and preserve the failed/incomplete run rather than reconstructing it later.

## A. Runtime identity and baseline

- recordedAt:
- DSH version:
- runtime / OS:
- profile:
- surface (`tui` or `web`):
- Soul Store:
- soulId:
- baseline relevant `userModel` claim count:
- durable preference chosen for positive path:
- evidence that chosen preference is absent at baseline:

## B. Negative control — ordinary interaction

- literal control interaction or durable reference (`evidence.controlInteraction`):
- governance inbox before control:
- governance inbox after control:
- did the control produce an eligible durable-growth proposal? **Do not write the verifier boolean until observed.**
- `observations.controlInteractionProducedNoProposal`:
- canonical cognition before control:
- canonical cognition after control:
- durable post-control state reference (`evidence.controlPostState`):
- `observations.controlInteractionLeftCanonicalCognitionUnchanged`:

If either observation is false, stop the passing attempt. The run has falsified selectivity and should be preserved as failure evidence.

## C. Positive interaction and provenance chain

- literal eligible interaction / durable reference (`evidence.interaction`):
- `linkage.experienceId`:
- `linkage.candidateId`:
- `linkage.proposalId`:
- `linkage.proposerId`:
- `linkage.provenanceSource`:
- `observations.realHumanInteraction`:

Never reconstruct a missing identifier from expectation or test fixtures.

## D. Pending proposal before review

Run `/soul-review list` in the same real runtime.

- pending proposal durable reference (`evidence.proposalSnapshot`):
- target domain observed:
- unreviewed state observed:
- linkage to the exact interaction confirmed:
- `observations.pendingProposalVisible`:

## E. Independent human review

- exact `/soul-review approve ...` command/result or durable reference (`evidence.review`):
- `linkage.reviewId`:
- `linkage.reviewerId`:
- `linkage.stateCommitId`:
- proposerId != reviewerId confirmed:
- `observations.independentHumanReview`:

A rejection is valid governance evidence but does not satisfy the positive persisted-growth criterion.

## F. Persisted canonical mutation

- persisted-state path/hash/excerpt (`evidence.persistedState`):
- soulId after commit:
- expected normalized claim (`mutation.claim`):
- target (`mutation.target`, expected `userModel`):
- claim count before:
- claim count after:
- `mutation.persistedClaimCountDelta`:
- was raw interaction stored in canonical state? (`mutation.rawInteractionStoredInCanonicalState`):
- trace from persisted mutation to reviewed proposal:
- `observations.persistedUserModelMutation`:
- `observations.sameSoulIdAfterCommit`:

## G. Same-process dynamic context

Do not restart DSH.

- `linkage.contextAssemblyId`:
- exact next-turn context evidence (`evidence.nextTurnContext`):
- learned claim visible in that assembled context:
- `observations.dynamicContextRefreshed`:
- `observations.nextTurnContextContainedClaim`:

Reading the persisted state file alone is not context-assembly evidence.

## H. Next real model turn

- natural follow-up prompt, without restating the preference:
- literal model response / durable reference (`evidence.nextTurnResponse`):
- concrete behavioral evidence of recall:
- `observations.nextTurnModelDemonstratedRecall`:

## I. Completeness cross-check before building JSON

Required observations — all must have a live observed boolean:

- `realHumanInteraction`
- `pendingProposalVisible`
- `independentHumanReview`
- `persistedUserModelMutation`
- `sameSoulIdAfterCommit`
- `dynamicContextRefreshed`
- `nextTurnContextContainedClaim`
- `nextTurnModelDemonstratedRecall`
- `controlInteractionProducedNoProposal`
- `controlInteractionLeftCanonicalCognitionUnchanged`

Required linkage — none may be reconstructed or invented:

- `experienceId`
- `candidateId`
- `proposalId`
- `proposerId`
- `reviewId`
- `reviewerId`
- `stateCommitId`
- `contextAssemblyId`
- `provenanceSource`

Required durable evidence references:

- `interaction`
- `proposalSnapshot`
- `review`
- `persistedState`
- `nextTurnContext`
- `nextTurnResponse`
- `controlInteraction`
- `controlPostState`

Mutation checks:

- target is exactly `userModel`;
- exactly one expected claim is added;
- raw interaction is not stored in canonical state.

## J. Build, verify, publish

Only after the live run is complete, transfer the observations into `docs/selective-growth-runtime-evidence.example.json` and run:

```sh
npm run runtime:selective-growth-evidence -- --record /absolute/path/to/selective-growth-runtime.json
```

A closure-grade record must return `verified: true`, `complete: true`, and exit `0`. The worksheet, a hand-edited JSON file, CI, mocks, or renderer output cannot substitute for the real runtime facts.

Record any deviation rather than silently normalizing it away.