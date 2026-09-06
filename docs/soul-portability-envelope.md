# Soul Portability Envelope

Status: normative design contract for a future runtime-neutral export/import boundary.

## Purpose

A Soul is not a DeepSeek Harness plugin instance, model session, filesystem directory, or transcript archive. Portability therefore needs an explicit envelope that can carry one canonical Soul state between runtimes without accidentally creating a new Soul or importing unrelated history.

This document defines the minimum envelope only. It does not implement export/import, a second runtime, cloning, forking, merge/reunion, synchronization, or migration policy.

## Minimum envelope

A conforming envelope contains:

```json
{
  "format": "ai-soul-portability-envelope",
  "formatVersion": 1,
  "soulId": "stable-machine-identity",
  "stateSchema": "soul-state",
  "stateSchemaVersion": "<version used by the payload>",
  "exportedAt": "<ISO-8601 timestamp>",
  "stateDigest": "sha256:<hex>",
  "state": {}
}
```

### `soulId`

`soulId` is the stable machine identity of the existing Soul. Exporting or importing the envelope does not rename the Soul, create a new Soul, or authorize a fork.

### `stateSchema` and `stateSchemaVersion`

The receiver must know how to validate the exact canonical-state representation before any mutation occurs. Unsupported schema versions fail closed.

### `stateDigest`

`stateDigest` is computed over a deterministic canonical serialization of `state`. Its purpose is integrity verification, not identity derivation. A digest mismatch fails closed.

### `exportedAt`

`exportedAt` records when the envelope was materialized. It is provenance metadata for the transfer artifact; it is not Genesis, first encounter, naming, or a new lifecycle event by itself.

### `state`

`state` is the bounded canonical current Soul state needed to continue the same Soul in another compatible body/runtime.

The minimum envelope does not require raw transcripts, interaction history, Experience Records, governance history, audit logs, or external evidence stores. Those stores may later have separately versioned portability contracts, but they must not be silently collapsed into canonical state.

## Import preconditions

An importer must validate the complete envelope before mutating any local Soul store.

At minimum, reject when:

1. `format` or `formatVersion` is unsupported;
2. `stateSchema` or `stateSchemaVersion` is unsupported;
3. `stateDigest` does not match the deterministic digest of `state`;
4. the payload's canonical `soulId` and envelope `soulId` disagree;
5. the target operation would overwrite a different existing `soulId` without an explicitly defined future reconciliation protocol.

Validation success is not mutation authority. Import/apply semantics must remain governed by the destination runtime/store boundary.

## Identity semantics

The following are explicit non-equivalences:

- export != Genesis;
- import != Genesis;
- export != clone;
- import != fork;
- copying bytes != creating a second legitimate identity lineage;
- runtime attachment != Soul identity;
- model change != Soul identity change;
- state digest != soulId.

Clone, fork, divergence, merge, reunion, and multi-device concurrent-write semantics are intentionally undefined here. They require dedicated lineage/governance design and must never emerge accidentally from a basic export/import implementation.

## Store separation

The portability boundary preserves the project's existing separations:

1. canonical current Soul state — compact, current cognition and identity-bearing structured state;
2. interaction history — runtime/session records;
3. Experience/evidence stores — provenance-bearing lived or imported evidence;
4. governance/audit history — proposals, reviews, revisions, retirement, consolidation, and other mutation evidence.

A future full-fidelity migration may package several independently typed stores, but the minimum Soul envelope is not a transcript dump and does not make historical stores canonical merely because they are portable.

## Security and privacy boundary

Portability artifacts may contain sensitive canonical cognition. A future implementation must define confidentiality, storage, access control, and deletion behavior separately. This envelope contract provides integrity and identity-binding semantics only; it must not be represented as encryption or privacy protection.

## Falsifiable invariants

A conforming implementation must make these claims testable:

- changing the runtime or model does not change `soulId`;
- tampering with canonical state invalidates `stateDigest`;
- an identity mismatch is rejected before local canonical mutation;
- ordinary transcript/history data is not silently promoted into canonical state during portability;
- exporting the same Soul does not by itself create a new lineage.

## Relationship to M8

M8 extraction remains trigger-based. This contract does not justify premature extraction of a standalone `ai-soul` package. It gives a second runtime a minimal interoperability target when concrete pressure appears, while keeping DSH as the current reference body.
