# Evolution Log — Continuity Prompts Must Not Contain Answers

**Date:** 2026-08-27

## Observation

A continuity test can accidentally manufacture its own success if the prompt contains the fact it intends to verify. Asking `What is your name, Samuel?` is not meaningful evidence that the loaded Soul supplied the name Samuel.

## Decision

M5 continuity checks separate the **prompt shown to the runtime** from the **expected evidence frozen from Soul State**.

The prompt must be non-leading. Expected evidence is stored beside the experiment plan for later assessment but is not supplied as part of the check prompt.

For dimensions that contain no durable evidence, the correct result is `not-applicable`, not an invented target.

## Consequence

Continuity evaluation becomes state-derived rather than Samuel-hard-coded. The same mechanism can be used for Genesis Souls and later M6 model-switch comparisons.

The v1 selector intentionally chooses the first durable entry for list-valued dimensions. Selection policy is therefore deterministic and inspectable; changing it later requires an explicit versioned decision rather than silently moving the goalposts after observing model behavior.
