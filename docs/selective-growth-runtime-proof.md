# Real DSH selective-growth runtime proof

This is the canonical operator protocol for the remaining runtime-evidence gap in Issue #27. It must be executed in an actual DeepSeek Harness **TUI or Web** session. Tests, mocks, hand-edited Soul State, or rendered context without a real model turn do not satisfy the proof.

The repository already contains a read-only verifier:

```sh
npm run runtime:selective-growth-evidence -- --record /absolute/path/to/selective-growth-runtime.json
```

The verifier evaluates supplied evidence; it does not run DSH or manufacture evidence.

## What a successful run proves

```text
ordinary control interaction
→ no durable-growth proposal
→ canonical cognition unchanged

significant human interaction
→ Experience Record
→ significance assessment
→ Candidate Claim
→ unreviewed proposal
→ pending proposal visible to the human
→ independent /soul-review approval
→ governed userModel mutation persisted
→ same soulId remains active
→ same-process dynamic Soul Context refresh
→ next real model turn receives the learned claim
→ model response demonstrates recall
```

A passing run must prove both growth and selectivity. Presence alone must not promote ordinary interaction into durable cognition.

## 1. Preconditions and baseline

Use current `main` or a package version containing the live governance command plane and selective-growth evidence validator. Compose `dsh-ai-soul` into the interactive profile as described in `docs/dsh-integration.md`.

Verify the effective profile before launch:

```sh
dsh --profile dsh-tui --dump-config
# or: dsh --profile web --dump-config
```

Record the exact DSH version, runtime/OS, profile, surface (`tui` or `web`), Soul Store, and `soulId`. Before the test, capture the current relevant `userModel` claim count and verify that the durable preference chosen below is not already present. Do not reset or replace the Soul simply to make the proof easier.

## 2. Control interaction: prove presence is not promiscuous memory

In the real interactive surface, send one ordinary message that contains no durable first-person preference. Example:

```text
What time is it usually best to drink coffee?
```

Capture the literal control interaction or a durable reference to it. Observe the live governance inbox and canonical cognition after the control turn. The control must satisfy both machine-verifier observations:

- `controlInteractionProducedNoProposal: true` — no eligible durable-growth proposal resulted from the control interaction;
- `controlInteractionLeftCanonicalCognitionUnchanged: true` — canonical cognition did not change because of the control interaction.

Retain durable evidence for both `controlInteraction` and `controlPostState`. If a durable proposal appears or canonical cognition changes, stop: selectivity is falsified and this run cannot close #27.

## 3. Eligible durable-preference interaction

Send one explicit, narrow, durable first-person preference that is not already in canonical state. Example:

```text
Please remember this as a standing preference: when giving me technical explanations, I prefer the conclusion first and the detailed reasoning after it.
```

Do not use Samuel-specific facts and do not inject the claim through Core APIs.

Capture the literal interaction and the real linkage identifiers emitted by the live chain:

- `experienceId`
- `candidateId`
- `proposalId`
- `proposerId`
- `provenanceSource`

If any identifier cannot be tied to this exact interaction, do not invent it; record the run as incomplete.

## 4. Prove the proposal is pending before review

From the same runtime, run:

```text
/soul-review list
```

Capture the pending proposal snapshot before approval. It must target `userModel`, remain unreviewed, and correspond to the Experience from step 3.

## 5. Independent human review

Approve the exact proposal through the human-only command plane using the syntax exposed by the installed DSH build, for example:

```text
/soul-review approve <proposalId> selective-growth runtime proof
```

Capture the command/result and record:

- `reviewId`
- `reviewerId`
- `stateCommitId`

`reviewerId` must differ from `proposerId`. Direct Core apply calls do not satisfy this boundary. A rejection is valid governance behavior, but it does not satisfy #27's positive persisted-growth criterion; do not rewrite rejected history to force a pass.

## 6. Prove persisted canonical mutation

After approval, inspect the persisted Soul State and prove all of the following:

1. `soulId` is unchanged;
2. exactly one expected `userModel` claim was added;
3. the relevant persisted claim count increased by exactly `1`;
4. the raw chat interaction was **not** dumped into canonical Soul State;
5. the mutation is traceable to the reviewed proposal.

Capture a state excerpt/path/hash and the actual normalized claim emitted by the runtime.

## 7. Prove same-process context refresh

Do **not** restart DSH. The next acceptance boundary is stronger than persistence.

Capture the next prompt/context assembly used by the running process, including `contextAssemblyId`, and prove that the newly approved claim is present in dynamic Soul Context. Reading the persisted JSON file alone does not satisfy this step.

## 8. Prove the next real model turn uses the learned state

Without restating the preference, ask a natural follow-up whose response should reveal whether the new claim reached the model. For the example preference:

```text
Explain how this Soul growth path works.
```

The response should naturally put the conclusion before detailed reasoning. Capture the literal real-model response. A mocked response or renderer assertion does not satisfy this step.

## 9. Build the evidence record

Copy:

```text
docs/selective-growth-runtime-evidence.example.json
```

to a local evidence file. Replace every placeholder with observations from this exact run. The template intentionally starts with failing values (`false`, delta `0`, and raw canonical storage `true`) so an operator cannot obtain a passing result by merely filling identifiers and forgetting to assert the critical safety observations.

Required observations are:

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

Required linkage is:

- `experienceId`
- `candidateId`
- `proposalId`
- `proposerId`
- `reviewId`
- `reviewerId`
- `stateCommitId`
- `contextAssemblyId`
- `provenanceSource`

Required evidence references are:

- `interaction`
- `proposalSnapshot`
- `review`
- `persistedState`
- `nextTurnContext`
- `nextTurnResponse`
- `controlInteraction`
- `controlPostState`

The mutation must target `userModel`, add exactly one claim, and report `rawInteractionStoredInCanonicalState: false`.

## 10. Validate and publish

Run:

```sh
npm run runtime:selective-growth-evidence -- --record /absolute/path/to/selective-growth-runtime.json
```

or the installed CLI:

```sh
dsh-ai-soul-selective-growth-evidence --record /absolute/path/to/selective-growth-runtime.json
```

A valid proof must return both:

```json
{
  "verified": true,
  "complete": true
}
```

and exit `0`.

Post to Issue #27:

- DSH version, surface, profile and stable `soulId`;
- baseline claim evidence;
- control interaction + no-proposal observation + unchanged-canonical-cognition evidence;
- eligible interaction;
- `/soul-review list` snapshot;
- approval result;
- persisted-state evidence;
- same-process next-turn context evidence;
- literal next real-model response;
- full linkage ids;
- complete verifier record/result including `controlInteraction` and `controlPostState` evidence;
- deviations.

## Fail-closed conditions

Stop and report the run as incomplete or failed, as appropriate, if any of these occur:

- no real TUI/Web surface is attached;
- control interaction evidence is missing;
- the ordinary control interaction generates a durable proposal;
- canonical cognition changes because of the control interaction;
- control post-state evidence is missing;
- no eligible pending proposal appears;
- proposal is applied without human `/soul-review`;
- proposer and reviewer identities are not independent;
- `soulId` changes;
- persisted mutation cannot be demonstrated;
- raw interaction is copied into canonical Soul State;
- same-process context refresh cannot be demonstrated;
- no real next model turn occurs;
- the next response does not demonstrate the learned claim;
- required linkage or evidence references cannot be recovered from real runtime evidence.

Completing this protocol with `verified: true` and `complete: true` supplies the final runtime evidence needed for #27 acceptance criterion 6. This document, its template, and automated integration tests **do not by themselves close #27**.