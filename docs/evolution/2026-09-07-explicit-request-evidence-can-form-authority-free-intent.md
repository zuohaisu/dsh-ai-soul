# Explicit request evidence can form an authority-free intent

Date: 2026-09-07
Issue: #297

## Decision

A validated `explicit-user-request` trigger evidence object may be composed through the existing initiation-eligibility boundary into an `AgencyIntent`, provided Soul identity, reason, bounded context, and provenance all validate.

The composition preserves the trigger evidence id, type, source identity, and provenance inside the intent provenance. This creates a falsifiable lineage from a real DSH human interaction through typed evidence to the Soul's proposed intent.

## Invariant

Eligibility is not authorization. The resulting intent remains `authority: none` and does not grant permission, execution, tool-call, scheduling, polling, memory-write, or canonical Soul mutation authority.

Authority-bearing composition input fails closed before intent creation. Soul mismatch, invalid trigger evidence, missing reason, missing context, or missing provenance also fail closed.

## Consequence

The first Agency initiation path can now be tested end to end without collapsing the safety boundary between "the Soul has a grounded reason to propose an action" and "the Soul is authorized to execute that action." Future permission or execution work must remain a separate governed boundary.
