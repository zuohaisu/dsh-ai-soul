# Real DSH Selective-Growth Runtime Proof

This runbook produces the only evidence that can close the remaining runtime acceptance gap in Issue #27.

It must be executed in an actual DeepSeek Harness interactive surface (`tui` or `web`). Unit tests, mocked Cordis events, integration fixtures, direct calls into adapter functions, and hand-edited Soul State do **not** satisfy this proof.

The verifier is intentionally read-only:

```sh
npm run runtime:selective-growth-evidence -- --record /absolute/path/to/selective-growth-runtime.json
```

It evaluates evidence after the run; it does not run DSH or manufacture proof.

## 1. Preconditions

Use a composed interactive DSH profile containing all three required layers:

```text
@deepseek-ai/dsh-base
+ dsh-ai-soul
+ one interactive application surface
```

For TUI, verify the effective profile before launch:

```sh
dsh --profile dsh-tui --dump-config
```

The dump must contain the configured `ai-soul` plugin and the TUI application bundle. For Web, perform the equivalent check against the `web` profile.

Record before the interaction:

- exact DSH version;
- runtime/OS description;
- profile name;
- surface: `tui` or `web`;
- selected `soulId`;
- path to the Soul Store;
- the current persisted `userModel` claim count.

Do not start with a `userModel` claim semantically equivalent to the test claim below. This proof is for a new selective-growth append, not a duplicate/revision test.

## 2. Use one deterministic durable-preference interaction

In the real interactive surface, send a human message that the existing narrow inference policy accepts, for example:

```text
Please remember that I prefer concise implementation status updates.
```

Do not inject the claim directly through Core APIs and do not edit the Soul JSON.

Capture the literal interaction text as `evidence.interaction`.

The expected boundary is:

```text
real DSH human interaction
→ Experience Record
→ Significance Assessment
→ userModel Candidate Claim
→ unreviewed StateTransitionProposal
→ pending governance inbox
```

The interaction itself must not mutate canonical Soul State.

## 3. Verify the proposal is pending before review

From the same DSH runtime, run:

```text
/soul-review list
```

The command must show a pending proposal targeting `userModel`, with `operation: append`, the proposed claim, confidence, proposer, and provenance.

Capture the full human-readable output as `evidence.proposalSnapshot`.

Record the following linkage identifiers from runtime diagnostics/snapshots produced by the live chain:

- `experienceId`
- `candidateId`
- `proposalId`
- `proposerId`
- `provenanceSource`

If any required identifier cannot be tied to the same live interaction, stop and record the run as incomplete. Do not infer or invent linkage IDs.

## 4. Perform independent human review

Approve the exact pending proposal through the command plane:

```text
/soul-review approve <proposalId> selective-growth runtime proof
```

A successful command must return an acknowledgement equivalent to:

```text
Approved and persisted governance proposal: <proposalId>
```

Capture the review command/result as `evidence.review`.

Record:

- `reviewId`
- `reviewerId`
- `stateCommitId`

`reviewerId` must differ from `proposerId`. If proposer and reviewer identities are the same, the verifier rejects the proof.

Do not use a direct Core apply call. The proof specifically requires the independent live governance boundary.

## 5. Verify persisted canonical state

Read the persisted Soul State after approval and verify all of the following:

1. the selected `soulId` is unchanged;
2. the new `userModel` claim is present exactly once;
3. the persisted `userModel` claim count increased by exactly `1`;
4. the raw interaction text was **not** stored as canonical Soul State.

Capture an appropriate state excerpt/path/hash as `evidence.persistedState`.

The evidence JSON must therefore use:

```json
{
  "mutation": {
    "target": "userModel",
    "claim": "The user prefers concise implementation status updates.",
    "persistedClaimCountDelta": 1,
    "rawInteractionStoredInCanonicalState": false
  }
}
```

Use the actual normalized claim emitted by the runtime if its wording differs from the example. Do not rewrite the claim in the evidence record.

## 6. Verify same-process dynamic context refresh

Without restarting the DSH process, trigger or inspect the next Soul Context assembly used for the next model turn.

Record:

- `contextAssemblyId`;
- evidence that the newly persisted claim is present in the assembled Soul Context.

Capture that material as `evidence.nextTurnContext`.

This is a critical boundary: persistence alone does not prove that the currently running model context was refreshed.

## 7. Require a real next model turn

In the same real interactive session, ask a question whose answer depends on the newly learned preference without repeating the preference itself. For example:

```text
How should you format implementation status updates for me?
```

The model response must demonstrate use of the learned claim. Capture the literal response as `evidence.nextTurnResponse`.

A test assertion that `renderSoulContext()` contains the claim is not a substitute for this step. The acceptance requires a real next model turn in TUI/Web.

## 8. Build the verifier record

Create a JSON record with this shape, replacing every placeholder with evidence from the actual run:

```json
{
  "recordedAt": "2026-09-04T00:00:00Z",
  "dshVersion": "<exact version>",
  "runtime": "<OS/runtime>",
  "profile": "<profile>",
  "soulId": "<stable soulId>",
  "surface": "tui",
  "observations": {
    "realHumanInteraction": true,
    "pendingProposalVisible": true,
    "independentHumanReview": true,
    "persistedUserModelMutation": true,
    "sameSoulIdAfterCommit": true,
    "dynamicContextRefreshed": true,
    "nextTurnContextContainedClaim": true,
    "nextTurnModelDemonstratedRecall": true
  },
  "linkage": {
    "experienceId": "<id>",
    "candidateId": "<id>",
    "proposalId": "<id>",
    "proposerId": "<id>",
    "reviewId": "<id>",
    "reviewerId": "<id>",
    "stateCommitId": "<id>",
    "contextAssemblyId": "<id>",
    "provenanceSource": "<source>"
  },
  "mutation": {
    "target": "userModel",
    "claim": "<actual normalized claim>",
    "persistedClaimCountDelta": 1,
    "rawInteractionStoredInCanonicalState": false
  },
  "evidence": {
    "interaction": "<literal human interaction or durable capture reference>",
    "proposalSnapshot": "<literal /soul-review list output or durable capture reference>",
    "review": "<approval command/result or durable capture reference>",
    "persistedState": "<state evidence or durable capture reference>",
    "nextTurnContext": "<context evidence or durable capture reference>",
    "nextTurnResponse": "<literal real-model response or durable capture reference>"
  },
  "deviations": []
}
```

The evaluator also accepts `surface: "web"` for a Web proof.

## 9. Run the verifier

```sh
npm run runtime:selective-growth-evidence -- --record /absolute/path/to/selective-growth-runtime.json
```

A valid proof must return both:

```json
{
  "verified": true,
  "complete": true
}
```

and exit with status `0`.

Any missing required field, false observation, non-`userModel` target, claim-count delta other than `1`, canonical raw-interaction storage, or proposer/reviewer identity collision makes the proof fail.

## 10. Evidence publication

Post the verifier result and durable references/captures to Issue #27. Include:

- DSH version and surface;
- exact `soulId`;
- test interaction;
- `/soul-review list` snapshot;
- approval result;
- persisted-state evidence;
- same-process next-turn context evidence;
- real next model response;
- full linkage IDs;
- verifier JSON/result;
- any deviations.

Only after that evidence verifies should #27 acceptance criterion 6 be marked complete.

## Fail-closed stop conditions

Stop the run and report it as incomplete rather than filling gaps when any of these occur:

- no real TUI/Web surface is attached;
- no pending proposal appears;
- proposal is applied without `/soul-review` human approval;
- proposer and reviewer are not independent;
- the `soulId` changes;
- persisted mutation cannot be demonstrated;
- dynamic context refresh cannot be demonstrated;
- no real next model turn occurs;
- the next-turn response does not demonstrate the new claim;
- required linkage cannot be recovered from real runtime evidence.

The purpose of this proof is falsifiability, not producing a green-looking artifact.
