# Cross-surface runtime evidence

This runbook distinguishes two different claims:

1. `dsh-ai-soul-surface-continuity` proves two real DSH profile directories are configured against the same explicit `soulId + storeDir` continuity anchor.
2. `dsh-ai-soul-cross-surface-evidence` evaluates whether a **real runtime** run proved that a governed mutation observed on one surface became model-visible on the other surface.

The first is configuration evidence. It is not a substitute for the second.

## Required real run

Use two different DSH surfaces, normally TUI as source and Web as target (the reverse is also valid).

1. Preflight both profile directories and confirm the shared continuity anchor.
2. On the source surface, perform a real human interaction that creates an eligible durable preference proposal.
3. Complete independent human governance and capture the resulting persisted state commit and claim.
4. Start or refresh the target surface **after** that source commit.
5. Capture evidence that the target loads the same `soulId` from the same canonical store anchor.
6. Capture the target prompt/context assembly showing the exact learned claim.
7. Send a real target-surface model turn whose answer makes the learned preference observable.
8. Fill a JSON record using the template below and run:

```sh
dsh-ai-soul-cross-surface-evidence --record cross-surface-evidence.json
```

A verified result exits 0. Incomplete or failed evidence exits non-zero.

## Minimal record template

```json
{
  "recordedAt": "2026-09-03T12:00:00Z",
  "evidenceKind": "real-dsh-runtime",
  "source": {
    "surface": "tui",
    "profile": "<real source profile>",
    "runtime": "<runtime identity/version>",
    "dshVersion": "<DSH version>",
    "soulId": "<stable soul id>",
    "storeAnchor": "<resolved canonical store path>"
  },
  "target": {
    "surface": "web",
    "profile": "<real target profile>",
    "runtime": "<runtime identity/version>",
    "dshVersion": "<DSH version>",
    "soulId": "<same stable soul id>",
    "storeAnchor": "<same resolved canonical store path>"
  },
  "observations": {
    "realSourceRuntime": true,
    "sourceGovernedMutationPersisted": true,
    "realTargetRuntime": true,
    "targetLoadedAfterSourceCommit": true,
    "targetContextContainedClaim": true,
    "targetModelDemonstratedRecall": true
  },
  "linkage": {
    "stateCommitId": "<source governed commit id>",
    "claimId": "<persisted claim id>",
    "claim": "<exact bounded learned claim>",
    "sourceCommitAt": "<ISO timestamp>",
    "targetLoadId": "<target load/session id>",
    "targetLoadAt": "<ISO timestamp after sourceCommitAt>",
    "targetContextAssemblyId": "<target context/prompt assembly id>"
  },
  "evidence": {
    "sourceRuntime": "artifact://<source runtime evidence>",
    "sourceCommittedState": "artifact://<persisted state evidence>",
    "targetRuntime": "artifact://<target runtime evidence>",
    "targetLoadedState": "artifact://<target loaded state evidence>",
    "targetContext": "artifact://<target context evidence>",
    "targetResponse": "artifact://<target model response evidence>"
  }
}
```

## Fail-closed rules

Verification fails if source and target are the same surface, `soulId` differs, canonical store anchors differ, target load precedes the source commit, any required observation is false, required linkage/evidence is missing, or `evidenceKind` is anything other than `real-dsh-runtime`.

CI/unit tests may validate this contract, but they cannot satisfy it as runtime evidence.
