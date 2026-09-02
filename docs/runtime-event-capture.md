# Runtime Event Capture Boundary

M3/M4.1 separates a runtime event from an Experience Record so Soul Core never depends on a DeepSeek Harness event type.

```text
runtime-specific event
      ↓ adapter mapping
Runtime Event Envelope v1
      ↓ mapRuntimeEventToExperience()
Experience Record v1
      ↓ explicit assessment boundary
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
- does not promote autobiography or mutate canonical Soul state.

The text requirement belongs only to this first Experience-capture slice. First encounter remains independent and may be recorded from a valid non-text human interaction.

## Live fail-closed significance gate

Issue #170 wires the live plugin `session/event` handler through `processDshHumanInteraction()` after the independently governed first-encounter path.

For an accepted text-bearing human message the processor now produces, in memory only:

```text
DSH human message
  → provenance-bound Experience Record
  → Significance Assessment v1
       level: low
       recommendPromotion: false
       method: fail-closed-baseline
  → STOP
```

The baseline assessment exists to make the selection boundary explicit without pretending that the system already knows what is worth remembering. It is not a classifier. It does not choose a model, prompt, threshold, relationship archetype, or durable-memory policy. Until a separately governed assessor establishes a promotion signal, the default answer is **do not promote**.

The assessment is epistemic evidence only. It grants no persistence, reflection, promotion, or canonical-state mutation authority. Experience and assessment are deliberately ephemeral in this slice.

A synthetic/plugin message receives neither Experience nor assessment. A valid non-text human message may still establish first encounter but receives neither Experience nor assessment, preserving `Genesis != first encounter != memory formation`.

## Authority boundaries

The implementation keeps four concerns distinct:

1. raw DSH interaction history — owned by the runtime/surface;
2. Experience Record — bounded interpreted evidence;
3. Significance Assessment — a proposal about importance, not authority;
4. canonical Soul state / governance history — changed only through explicit governed operations.

A later M4.1 slice may introduce a real significance assessor and a bounded candidate claim, but it must preserve this separation and must prove a control interaction causes zero canonical mutation.

## What is verified

Automated tests verify that:

- a real-shape DSH text `user/message` maps deterministically into a valid Experience Record;
- the live plugin handler routes DSH events through the interaction processor;
- accepted text Experience receives a valid assessment tied to the exact Experience id;
- the baseline assessment is explicitly `recommendPromotion:false` with policy provenance;
- a repeated/control interaction after first encounter leaves persisted canonical Soul state unchanged;
- synthetic/plugin messages produce neither Experience nor assessment;
- valid non-text human interaction remains eligible for first encounter without memory assessment;
- copied text is explicitly bounded;
- no Experience or Significance Assessment is durably stored by this slice.

The DSH `session/event` interaction source itself has real-runtime evidence from #147. The fail-closed significance gate added in #170 is currently covered by automated adapter/integration tests; it does **not** claim new real-DSH runtime evidence until exercised and recorded in a real DSH environment.
