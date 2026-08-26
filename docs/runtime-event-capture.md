# Runtime Event Capture Boundary

M3 separates a runtime event from an Experience Record so Soul Core never depends on a DeepSeek Harness event type.

```text
runtime-specific event
      ↓ adapter mapping
Runtime Event Envelope v1
      ↓ mapRuntimeEventToExperience()
Experience Record v1
      ↓ optional assessment
Significance Assessment v1
      ↓ explicit governed operation only
Autobiography
```

## Runtime Event Envelope v1

The adapter boundary requires:

- `runtime`
- `sessionId`
- `eventId`
- `at`
- `kind`
- `provenance`
- `payload`

An optional `eventRef` may point back to a durable runtime log or event source. The boundary intentionally does not require copying a full transcript into Soul state.

The mapping is deterministic for a given envelope: the Experience Record ID is derived from runtime, session, and event identity, and the event timestamp is preserved rather than replaced with capture time.

## What is verified

Automated tests verify that an explicit runtime event can be mapped into a valid Experience Record while preserving runtime/session/event provenance, without mutating Soul State or autobiography.

## What is not yet verified

This code does **not** claim a concrete DeepSeek Harness lifecycle or event hook. The actual DSH event source must be identified from a real runtime and then wired as a thin adapter into this boundary.

That real-runtime wiring remains dependent on the M2 local DSH verification tracked in Issue #7.
