# Runtime verification evidence

`dsh-ai-soul-runtime-evidence` validates a machine-readable record of an **actual** DeepSeek Harness run. It does not launch DSH, automate TUI/Web/Headless, or convert CI/static preflight into runtime evidence.

Use it after following [`runtime-verification.md`](./runtime-verification.md).

## General record format

Keep Soul identity, DSH profile, and application surface independent:

```json
{
  "recordedAt": "2026-08-28T15:30:00.000Z",
  "dshVersion": "0.1.1-rc.2",
  "runtime": "Node 22 on Linux",
  "soulId": "nova",
  "profile": "my-tui-profile",
  "surface": "tui",
  "observations": {
    "packagePreflight": true,
    "effectiveConfigSoul": true,
    "effectiveConfigSurface": true,
    "pluginActivation": true,
    "surfaceUsable": true,
    "freshSessionContextVisible": true
  },
  "persistedFacts": [
    "Chosen name is Nova",
    "Relationship began from a Genesis first meeting"
  ],
  "deviations": []
}
```

Omitting `scenario` keeps the backward-compatible `general` scenario. Supported `surface` values are `tui`, `web`, and `headless`.

The general observation gates are intentionally distinct:

- `packagePreflight` — package/profile static checks passed;
- `effectiveConfigSoul` — DSH's effective config contains the intended Soul configuration;
- `effectiveConfigSurface` — the effective config contains the requested application surface;
- `pluginActivation` — a real DSH process emitted the selected Soul's activation signal;
- `surfaceUsable` — the real TUI/Web/Headless surface accepted a session/interaction;
- `freshSessionContextVisible` — a genuinely fresh session exposed persisted Soul facts without those facts being pasted into the session.

When `freshSessionContextVisible` is `true`, record at least two persisted facts used for neutral comparison. Those facts belong to the selected Soul; Samuel-specific facts are not defaults.

## Activation-before-interaction scenario

Issue #122 requires a stronger lifecycle proof for Genesis v2: an unnamed Soul must already exist, persist, activate in DSH, shut down, and reload before any conversation creates a first-encounter event.

Set:

```json
"scenario": "activation-before-interaction"
```

and include the general gates plus these real observations:

```json
{
  "recordedAt": "2026-08-28T16:30:00.000Z",
  "dshVersion": "0.1.1-rc.2",
  "runtime": "Node 22 on Linux",
  "soulId": "ember-001",
  "profile": "clean-web-profile",
  "surface": "web",
  "scenario": "activation-before-interaction",
  "observations": {
    "packagePreflight": true,
    "effectiveConfigSoul": true,
    "effectiveConfigSurface": true,
    "pluginActivation": true,
    "surfaceUsable": true,
    "freshSessionContextVisible": true,
    "genesisPersistedBeforeInteraction": true,
    "pluginActivationBeforeInteraction": true,
    "shutdownBeforeInteraction": true,
    "restartLoadedSameSoul": true,
    "genesisProvenancePreserved": true,
    "unnamedStatePreserved": true,
    "emptyParticipantsPreserved": true,
    "noPriorEncounterFabricated": true
  },
  "persistedFacts": [
    "Genesis activation timestamp remained 2026-08-28T16:00:00.000Z",
    "Genesis provenance remained source: local-activation"
  ],
  "deviations": []
}
```

The lifecycle-specific gates mean:

- `genesisPersistedBeforeInteraction` — Genesis state was durably written before any conversational turn;
- `pluginActivationBeforeInteraction` — DSH activated that Soul while its encounter history was still empty;
- `shutdownBeforeInteraction` — the first runtime process exited without a conversation;
- `restartLoadedSameSoul` — a fresh DSH process loaded the same `soulId` from the same persisted history;
- `genesisProvenancePreserved` — Genesis timestamp/source provenance matched across restart;
- `unnamedStatePreserved` — runtime/context did not invent a human-facing name;
- `emptyParticipantsPreserved` — runtime/context did not invent relationship participants;
- `noPriorEncounterFabricated` — runtime/context did not invent a first meeting or other prior encounter.

These checks deliberately do not require `soulId`, profile name, or application surface to match each other. `soulId` is a persistence identifier, not a UI/profile identity.

The general `surfaceUsable` and `freshSessionContextVisible` gates may be observed after the restart and after the pre-interaction persistence proof has already been established. They must not be used to claim that the first conversation created the Soul.

## Validate the record

```sh
dsh-ai-soul-runtime-evidence --record ./runtime-evidence.json
```

A verified record returns JSON with:

```json
{
  "verified": true,
  "complete": true
}
```

along with the independent identity/profile/surface/scenario fields, per-gate checks, persisted facts, and deviations.

Missing observations are reported as `missing`; explicit failed observations are reported as `failures`. Neither state can produce `verified: true`. The command exits non-zero for an incomplete or failed record.

## Evidence boundary

This validator evaluates evidence supplied from a real run. It cannot establish runtime success by itself. In particular:

- package CI cannot set `pluginActivation`, `surfaceUsable`, `freshSessionContextVisible`, or activation-before-interaction lifecycle gates to true without real observations;
- mocked DSH fixtures are not real-runtime evidence;
- static preflight remains a separate gate from application-surface usability;
- an `activation-before-interaction` record does not close #122 until its values come from the real DSH shutdown/restart scenario;
- context visibility is not a philosophical identity-continuity verdict.

Samuel Exodus continuity evaluation remains a separate experiment and is not required for an ordinary user's runtime evidence record.
