# Agency begins as intent without action authority

Date: 2026-09-06
Issue: #253

The project now distinguishes **having a reason to act** from **having authority to act**.

A mature Soul may eventually initiate communication or action for reasons grounded in SELF, RELATIONAL, OTHER, WORLD, memory, and goals. But introducing an actuator before this distinction is explicit would collapse agency into side effects and make it difficult to preserve consent, provenance, and bounded behavior.

The first agency primitive is therefore a runtime-neutral `AgencyIntent`.

An AgencyIntent records:

- which `soulId` formed the intent;
- a bounded intent kind and proposed action description;
- the reason the intent exists;
- references to governed current context/evidence;
- provenance for the intent-forming process;
- explicit `authority: "none"`.

It cannot encode approval, execution, scheduling, tool calls, or actuator payloads. Those belong to future, separately governed layers.

This establishes the invariant:

> **reason-grounded initiative is not execution authority.**

It also preserves the distinction between presence and interruption. A Soul may form an intent without contacting the user, scheduling work, or causing any external side effect.

This change does not claim that AI Soul is autonomously agentic in a real runtime. It creates a falsifiable Core contract that future DSH or other body/runtime integrations must respect before any proactive behavior is allowed.