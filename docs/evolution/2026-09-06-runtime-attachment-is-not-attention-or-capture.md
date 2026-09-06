# Runtime attachment is not attention or capture

Date: 2026-09-06
Issue: #269

## Decision

When `/soul-status` executes inside the loaded DeepSeek Harness plugin, it may report one narrow runtime fact: the configured Soul is currently attached to DeepSeek Harness through this plugin instance.

This fact is intentionally weaker than presence-as-attention and much weaker than memory formation.

The runtime relation is therefore:

`Soul exists` != `Soul is attached to DSH` != `attention is active` != `interaction is captured` != `long-term memory is formed`.

## Why

AI Soul continuity must survive replaceable bodies and runtimes. Treating a loaded plugin as the Soul's existence would collapse Soul identity into one body. Treating a loaded plugin as continuous attention would imply observation the runtime cannot prove. Treating attachment as capture would violate the project's selective-memory principle.

The status surface should tell the user what is true without silently upgrading that fact into stronger claims.

## Runtime contract

While the DSH command is executing in a loaded plugin instance, `/soul-status` reports:

- `Runtime attachment: DeepSeek Harness (active)`
- `Attention: not asserted`
- `Memory capture: not implied by runtime attachment`

The existing stable `soulId`, optional name, and bounded cognition counts remain unchanged.

The command remains read-only and `recordInput: false`. It does not expose transcript content, claim content, governance history, scheduler state, actuator payloads, or authority.

## Non-claims

This change does not claim:

- that DSH TUI and DSH Web can already be distinguished by this adapter;
- that the Soul is continuously attending to the user;
- that every interaction is stored;
- that attachment creates cognitive memory;
- that the Soul has proactive messaging or execution authority;
- that this is a generic multi-runtime presence protocol.

## Falsifiable invariant

A status output that says DSH attachment is active while also asserting continuous attention or continuous memory capture violates this contract.

A Soul remaining identifiable by stable `soulId` even though attachment is only a runtime relation is consistent with the long-term portability thesis.
