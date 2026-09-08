# Homeostasis assessment evidence is bound to its inputs

Date: 2026-09-08
Issue: #310

## Decision

A structural homeostasis PASS is evidence about one exact baseline-to-candidate transition under one exact governed proposal. It is not transferable approval evidence.

Homeostasis assessment artifacts therefore bind the homeostasis check version and Soul identity to deterministic SHA-256 fingerprints of the baseline Soul state, reviewed proposal, and candidate Soul state. Canonical object-key ordering makes semantically identical JSON object structures fingerprint identically while preserving array order.

## Boundary

This artifact does not grant review, approval, mutation, execution, or philosophical continuity authority. It only makes existing deterministic structural continuity evidence attributable to the exact governed inputs that produced it.

A stale baseline, changed proposal, modified candidate, changed homeostasis-check version, changed pass/fail result, or changed violations invalidates the assessment.

## Falsifiability

An assessment produced for proposal A against baseline X cannot verify for proposal B, baseline Y, or a modified candidate, even if all objects share the same soulId and the substituted transition would independently pass homeostasis checks.
