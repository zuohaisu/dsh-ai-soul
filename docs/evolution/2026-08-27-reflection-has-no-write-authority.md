# Reflection Has No Write Authority

**Date:** 2026-08-27

M4 now separates another boundary that is easy to collapse in an agent system:

> **Interpreting experience is not the same as approving a change.**

A reflection result may summarize what appears to have happened, preserve links to the experience/significance evidence it considered, and emit zero or more candidate state-transition proposals. Those proposals must remain unreviewed.

This matters because an LLM that both interprets an event and approves its own interpretation would effectively regain direct mutation authority, even if the implementation happened to call the intermediate object a “proposal.”

The runtime-neutral Reflection Result contract therefore permits:

- traceable source experience references;
- observations;
- zero or more unreviewed `StateTransitionProposal` objects;
- reflection provenance.

It explicitly rejects already-reviewed proposals. Approval remains a separate governance act subject to confidence policy, conflict handling, and review provenance.

A reflection is also allowed to produce **zero proposals**. “This mattered, but no durable Soul change is justified” is a first-class outcome rather than a failure to remember.
