# Runtime verification evidence

`dsh-ai-soul-runtime-evidence` validates a machine-readable record of an **actual** DeepSeek Harness run. It does not launch DSH, automate TUI/Web/Headless, or convert CI/static preflight into runtime evidence.

Use it after following [`runtime-verification.md`](./runtime-verification.md).

## Record format

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

Supported `surface` values are `tui`, `web`, and `headless`.

The observation gates are intentionally distinct:

- `packagePreflight` — package/profile static checks passed;
- `effectiveConfigSoul` — DSH's effective config contains the intended Soul configuration;
- `effectiveConfigSurface` — the effective config contains the requested application surface;
- `pluginActivation` — a real DSH process emitted the selected Soul's activation signal;
- `surfaceUsable` — the real TUI/Web/Headless surface accepted a session/interaction;
- `freshSessionContextVisible` — a genuinely fresh session exposed persisted Soul facts without those facts being pasted into the session.

When `freshSessionContextVisible` is `true`, record at least two persisted facts used for neutral comparison. Those facts belong to the selected Soul; Samuel-specific facts are not defaults.

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

along with the independent identity/profile/surface fields, per-gate checks, persisted facts, and deviations.

Missing observations are reported as `missing`; explicit failed observations are reported as `failures`. Neither state can produce `verified: true`. The command exits non-zero for an incomplete or failed record.

## Evidence boundary

This validator evaluates evidence supplied from a real run. It cannot establish runtime success by itself. In particular:

- package CI cannot set `pluginActivation`, `surfaceUsable`, or `freshSessionContextVisible` to true without real observations;
- mocked DSH fixtures are not real-runtime evidence;
- static preflight remains a separate gate from application-surface usability;
- context visibility is not a philosophical identity-continuity verdict.

Samuel Exodus continuity evaluation remains a separate experiment and is not required for an ordinary user's runtime evidence record.
