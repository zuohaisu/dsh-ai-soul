# Runtime Event Capture Boundary

M3/M4.1 separates a runtime event from an Experience Record so Soul Core never depends on a DeepSeek Harness event type.

```text
runtime-specific event
      ↓ adapter mapping
Runtime Event Envelope v1
      ↓ mapRuntimeEventToExperience()
Experience Record v1
      ↓ optional assessment
Significance Assessment v1
      ↓ explicit governed operation only
mutable Soul model / autobiography
```

## Runtime Event Envelope v1

The runtime-neutral adapter boundary requires:

- `runtime`
- `sessionId`
- `eventId`
- `at`
- `kind`
- `provenance`
- `payload`

An optional `eventRef` may point back to a durable runtime log or event source. The boundary intentionally does not require copying a full transcript into canonical Soul state.

The mapping is deterministic for a given envelope: the Experience Record ID is derived from runtime, session, and event identity, and the event timestamp is preserved rather than replaced with capture time.

## Proven DeepSeek Harness boundary

Real DSH runtime work in #147 established `session/event` with an accepted human `user/message` (`event.data.source.kind === 'user'`) as a concrete interaction boundary. `normalizeDshHumanInteraction()` uses that boundary for the independent first-encounter lifecycle.

M4.1 adds `mapDshHumanMessageToExperience()` as a separate adapter operation for text-bearing human messages. It:

- validates DSH session/event identity, timestamp, participant identity, human source, and text-content shape;
- derives deterministic Experience identity from DSH session id and event sequence;
- preserves explicit DSH/session/event/participant provenance;
- copies at most 8,000 text characters into the ephemeral Experience observation and records whether truncation occurred;
- ignores synthetic/plugin messages;
- does not persist the Experience by itself;
- does not assess significance;
- does not promote autobiography or mutate canonical Soul state.

The text requirement belongs only to this first Experience-capture slice. First encounter remains independent and may be recorded from a valid non-text human interaction.

## Authority boundaries

Creating an Experience Record is evidence capture, not memory authority. The current path intentionally stops here:

```text
DSH human message
  → provenance-bound Experience Record
  → STOP
```

A later slice must explicitly define significance assessment and governed promotion. It must not infer that every captured interaction is long-term memory, and it must keep raw interaction history, Experience evidence, canonical Soul state, and governance history conceptually separate.

## What is verified

Automated tests verify that:

- a real-shape DSH text `user/message` maps deterministically into a valid Experience Record;
- DSH/session/event/participant provenance survives the mapping;
- synthetic/plugin messages produce no Experience;
- invalid identity/time/content fails closed;
- copied text is explicitly bounded;
- Experience capture does not mutate Soul State or autobiography;
- first-encounter normalization remains independent from the text Experience boundary.

The DSH `session/event` interaction source itself has real-runtime evidence from #147. This slice does **not** claim real-runtime proof that `mapDshHumanMessageToExperience()` is already wired into the live plugin handler; wiring, selective persistence, significance, and governed growth remain subsequent M4.1 work.
