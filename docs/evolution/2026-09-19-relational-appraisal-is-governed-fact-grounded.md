# Relational appraisal is grounded in governed relationship facts

Date: 2026-09-19
Status: immutable evolution record
Issue: #344

## Decision

Runtime-evidence appraisal may now derive a bounded `relationalSignificance`
dimension, but only when two canonical facts coexist:

1. an exact provenance-bound participant link (rule v1: the event's structured
   `provenance.participant.id` matches exactly one governed relationship
   participant); and
2. at least one valid governed `RelationshipFact` in the projected
   `cognition.relational` cognition whose `subject` is that exact participant
   (`subject.type === 'participant'` and `subject.id` equal to the linked id).

The rule (`dyadic-governed-fact-v1`) keys exclusively on structure that is
already canonical. It never interprets `predicate` or `value` content, message
text, names, or model output; inventing relationship meaning from those would
be ontology invention and fails closed instead. Facts with other subjects,
non-participant subjects, invalid or tampered shapes, and legacy free-form
relationship entries never ground a relational appraisal — legacy entries stay
semantically opaque behind the governed projection.

Every relational claim cites exact evidence paths: the event's structured
participant identity, the exact linked `cognition.participants.<index>` entry,
and each grounding `cognition.relational.<index>` fact. The dimension is
bounded (`level: 'high'`), deterministic, and zero-mutation: inputs remain
detached and read-only, and no persistence, significance promotion, governance
decision, authorization, scheduling, tool use, or execution authority is
created.

Absent dyadic facts, the runtime-evidence path still emits the unchanged
relevance-only appraisal; the relational dimension is outcome-versus-no-outcome
with respect to the governed fact, which is exactly the falsifiable capability
this slice admits.

## Invariant

`governed dyadic fact != interpreted relationship meaning != mood != persona drift != mutation != permission != execution`

Appraisal remains read-only bounded interpretation. It can make governed
relationship state causally visible to downstream significance, but it cannot
change what that state says.

## Falsification boundary

Repository tests must demonstrate: the same event and participant produce a
relational appraisal with one governed dyadic fact and no relational dimension
when the fact is absent, points at another subject, uses a non-participant
subject type, or is tampered/invalid; legacy free-form entries never ground the
dimension; evidence paths cite the exact event and cognition locations; inputs
are not mutated; and the direct rule entry fails closed on missing or
ambiguous links and unsupported AppraisalInput versions.

## Non-goals

This slice does not interpret predicate/value semantics, does not grade
relationship closeness or affect, does not introduce appraisal-driven memory
writing or significance promotion, and does not add LLM or embedding-based
appraisal. Richer relational interpretation requires new governed structure
with explicit machine-readable semantics before any rule may consume it.
