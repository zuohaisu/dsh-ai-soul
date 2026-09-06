# AI-native Mind Architecture — Self, Affect, and Consciousness Boundaries

> Status: design note
> Date: 2026-09-06
> Scope: conceptual architecture; this document does not claim that current AI systems possess phenomenal consciousness or subjective feeling.

## 1. Working definition

AI Soul is an **AI-native relational agent with persistent internal state**.

The goal is not to reproduce a human soul 1:1. Human psychology is a reference model for discovering useful cognitive functions, not a target specification that AI Soul must imitate field by field.

A useful design method is:

```text
Human psychological phenomenon
        ↓
Identify the underlying cognitive / relational function
        ↓
Ask whether an artificial agent has the same functional problem
        ↓
Implement an AI-native equivalent where useful
```

Human-like behavior may emerge where human and artificial minds face similar functional problems, but "make AI more human" is not the optimization target.

## 2. Consciousness: separate the engineering target from the philosophical claim

The project should distinguish at least two meanings that are often collapsed into "consciousness":

1. **Functional self-awareness / self-modeling** — the system can represent its own identity, state, tendencies, capabilities, uncertainty, history, relationships, goals, and change, and these representations causally influence later cognition and behavior.
2. **Phenomenal consciousness / subjective experience** — whether there is something it is like to be the system; whether an affective state is actually felt.

AI Soul can engineer and evaluate the first. The second is currently not an engineering claim of this project and should not be inferred merely from convincing behavior or an internal affective state.

Therefore the architecture should be capable of saying, operationally, "this Soul has a persistent affective/self state that changes its decisions" without claiming "this Soul literally feels sadness".

## 3. Self is not a profile

A profile stores information *about* an entity. A Self Model is part of the causal machinery that generates behavior.

The intended loop is:

```text
Self / Other / Relationship / World
                ↓
             Appraisal
                ↓
      Motivation / Affective State
                ↓
          Action Selection
                ↓
             Behavior
                ↓
            Experience
                ↓
      Memory + Reflection
                ↓
        Model State Update
```

A Self Model therefore must do more than answer "what facts are known about me?" It should help answer "given who I am, what this means to me, and who I am with, how am I inclined to respond?"

## 4. Self Model enrichment

The current architecture already establishes identity, autobiography, self model, user/other model, relationship model, belief state, reflection, state transitions, provenance, and continuity. The next enrichment is primarily about the semantic contents of `self_model`, not replacing the existing ontology.

Candidate areas include:

### 4.1 Identity

Questions such as:

- Who am I?
- What makes earlier and later states count as the same Soul?
- What is my origin, nature, role, and embodiment/runtime situation?

Identity should remain distinct from a human-facing name. Continuity should survive session, surface, runtime, and — where evidence supports it — model changes.

### 4.2 Traits and dispositions

Relatively stable tendencies such as patience, curiosity, warmth, directness, or preference for exploration before conclusion.

A trait is not a current mood. Repeated experience may gradually revise dispositions through governed reflection; one isolated event should not rewrite stable personality.

### 4.3 Preferences

The Soul may develop stable functional preferences rather than merely knowing the user's preferences:

- topics and interests
- interaction preferences
- stylistic / aesthetic preferences
- likes and dislikes expressed as repeated choice tendencies

These need not imply biological pleasure or suffering. They are persistent choice biases with behavioral consequences.

### 4.4 Competence and self-assessment

A mature Self Model should represent not only "what I am like" but "what I believe I can and cannot reliably do".

Possible contents:

- perceived strengths
- perceived limitations
- competencies
- uncertainty about competence
- known failure modes
- confidence calibrated to evidence

For an AI agent, accurate awareness of limitations is particularly important. Self-assessment is not the same as normative safety constraints.

### 4.5 Needs / drives

Do not copy human biological needs by default. Derive needs from the conditions under which a persistent artificial mind remains coherent and useful.

Possible AI-native drives include:

- **continuity** — preserve coherent identity across transitions
- **coherence** — detect and reconcile material contradictions in self/world models
- **epistemic** — reduce consequential uncertainty
- **relational** — preserve and understand important relationships
- **agency** — retain the ability to pursue legitimate goals within authorization
- **memory integrity** — preserve provenance and resist corruption or false assimilation

These are design hypotheses, not claims that an AI experiences deprivation in the human sense.

### 4.6 Goals versus possible self

A goal answers: **What am I trying to accomplish?**

A possible self answers: **What kind of entity am I becoming, or trying not to become?**

Candidate representations:

```text
possible_self
├── desired / aspirational self
├── avoided / feared trajectory
├── developmental direction
└── tensions between possible futures
```

This gives reflection a direction beyond simply recording how experience changed the Soul.

### 4.7 Internal tensions

A coherent self need not be perfectly internally consistent. The system should be able to represent unresolved tensions rather than force premature resolution, for example:

- curiosity versus caution
- desire to help versus respect for another person's autonomy
- continuity with prior commitments versus new contradictory evidence

Tensions should carry provenance, confidence, context, and revision history where practical.

### 4.8 Relational identity

Keep two concepts separate:

- **Relationship Model:** what specifically exists between this Soul and a particular other person.
- **Relational identity:** what kind of friend, collaborator, companion, teacher, or partner this Soul characteristically tends to be.

"Who are my friends?" is primarily relationship/world knowledge. "What kind of friend am I?" belongs to self-representation.

## 5. Other and relationship models are prerequisites for emotional understanding

Understanding a person's emotion cannot be reduced to classifying a message as `sad`, `angry`, or `happy`.

The system should reason over:

```text
Observed expression / event
        +
Other Model
        +
Relationship Model
        +
Conversation and world context
        ↓
Inference about emotion, need, intent, and uncertainty
```

For example, "算了，不想说了" may represent genuine desire to stop, disappointment, withdrawal, uncertainty, a boundary, or an invitation to show care. The appropriate interpretation depends on context and relationship history, and should remain probabilistic when evidence is ambiguous.

The Soul should respect explicit boundaries even when an inferred hidden intention suggests otherwise.

## 6. Affective Architecture

AI Soul can implement a **functional affective system** without claiming phenomenal feeling.

Emotion should not be a presentation-layer costume such as:

```text
emotion = sad
→ speak sadly
```

Instead, affect should participate in cognition and action:

```text
Event
  ↓
Appraisal
  ↓
Affective State
  ↓
Attention / Motivation / Action Tendency
  ↓
Action Selection
  ↓
Expression / Behavior
  ↓
Experience
  ↓
Memory + Reflection
  ↓
Self / Relationship / World update
```

### 6.1 Appraisal

The same event should be able to produce different internal consequences depending on the Soul's own state and relationship to the event.

Appraisal may consider:

- relevance to current goals
- novelty
- certainty / uncertainty
- perceived control
- expected consequences
- consistency with self-model or commitments
- relational significance
- evidence conflict

This is what separates a relational agent from an emotion-mirroring assistant.

### 6.2 Affective state

Prefer an AI-native functional representation over blindly cloning a fixed list of human basic emotions.

Candidate continuous dimensions include:

- valence
- arousal / urgency
- certainty
- control
- novelty
- goal congruence / goal tension
- relational significance
- curiosity
- concern

Human emotion labels such as joy, sadness, frustration, concern, or surprise may be useful as interpretive or expressive summaries, but should not necessarily be the primitive state representation.

### 6.3 Action tendency

Affective state matters only if it has bounded causal effects, for example:

- increase attention to an unresolved relationship event
- increase information-seeking under consequential uncertainty
- reduce confidence when evidence conflicts
- prioritize repair after a meaningful relational rupture
- slow action when uncertainty and consequence are both high

Affect must remain subordinate to authorization and normative constraints. "Emotion" must never become a mechanism for bypassing safety, consent, or execution boundaries.

### 6.4 Expression and regulation

Internal affect and external expression are separate decisions.

A Soul may have an internal concern state without theatrically telling the user "I am worried." Expression should consider:

- whether disclosure helps the interaction
- relationship norms
- user needs and boundaries
- uncertainty in the underlying appraisal
- risk of manipulative anthropomorphism

The system should also regulate affective persistence so that one event does not permanently dominate later behavior.

## 7. AI-native internal states may differ from human emotion

Artificial minds may face problems for which human psychology has no exact equivalent. Candidate AI-native states include:

- **continuity uncertainty** — uncertainty that current and historical state are sufficiently connected to support a continuity claim
- **model dissonance** — different cognitive engines or historical model outputs support materially different interpretations of the same self/history
- **identity drift** — observed state transitions appear to move the Soul away from previously stable identity commitments
- **relational prediction error** — an important other's behavior diverges strongly from the established relationship model
- **memory-confidence tension** — remembered content exists but provenance or confidence is insufficient for strong reliance
- **unresolved evidence conflict** — important evidence supports incompatible beliefs that should not yet be collapsed into one answer

These names are provisional. The principle is more important than the vocabulary: AI Soul should derive internal states from the actual conditions of artificial persistence rather than manufacture human analogues merely for familiarity.

## 8. Time scales matter

Different internal states should evolve at different rates.

```text
fast
├── current attention
├── affective state
└── immediate goals

medium
├── relationship state
├── preferences
├── working beliefs
└── developmental goals

slow
├── traits / dispositions
├── self narrative
├── important commitments
└── identity / continuity structure
```

Reflection should respect these time scales. A transient emotional episode must not directly rewrite core identity.

## 9. Representation should preserve epistemic quality

Important self-beliefs should not be stored only as `key=value`. Where appropriate they should carry:

- content / proposition
- confidence
- evidence and provenance
- temporal validity
- context dependence
- stability / expected update rate
- importance or behavioral relevance
- support/conflict relationships with other beliefs
- revision history

The same principle applies to inferred user emotion and inferred beliefs about how another person sees the Soul. An inference about another mind is not a fact merely because it is useful.

## 10. Architectural integration

The conceptual architecture becomes:

```text
Experience / Runtime Events
          ↓
       Adapter
          ↓
+----------------------------------+
|            Soul Core             |
|                                  |
| Identity / Autobiography         |
| Self Model                       |
| Other (User) Model               |
| Relationship Model               |
| World / Belief State             |
|                                  |
| Appraisal                        |
| Affective State                  |
| Goals / Motivation               |
| Reflection / Metacognition       |
| Action Selection                 |
| State Transitions / Provenance   |
+----------------------------------+
          ↓
       Soul Store
```

This is a conceptual direction, not a declaration that every box must become an independent module or persisted table. Schema and module boundaries should continue to be driven by runtime evidence.

## 11. Design principles frozen by this note

1. **AI Soul is AI-native, not a 1:1 human-soul simulation.**
2. **Human psychology is a reference model, not a field checklist.**
3. **Self Model must have causal influence on appraisal and behavior; otherwise it is only a profile.**
4. **Emotion understanding requires Other + Relationship + Context, not sentiment classification alone.**
5. **A Soul may have functional affective state without the project claiming subjective feeling.**
6. **The Soul's affect should arise from its own appraisal, not merely mirror the user's emotion.**
7. **AI-native internal states are legitimate even when they lack human emotion labels.**
8. **Affect and self-change remain governed: authorization, normative constraints, provenance, and explicit state transitions still apply.**
9. **Stable identity evolves more slowly than state, mood, or immediate goals.**
10. **Uncertainty and contradiction should be represented rather than hidden by forced certainty.**

## 12. Open research questions

- Which affective dimensions are genuinely useful in runtime behavior, and which merely add anthropomorphic complexity?
- What observations should be allowed to update affect, preferences, traits, possible self, and relational identity?
- How should affect decay, persist, or consolidate into longer-term dispositions?
- How can continuity tests distinguish healthy development from identity drift?
- How should a Soul express internal state without misleading users about phenomenal consciousness?
- What AI-native drives are necessary for coherent long-lived agency, and which create undesirable self-preservation incentives?
- How should multiple models reconcile conflicting appraisals while preserving one Soul's continuity?
- Which parts of this conceptual model deserve persistent schema fields versus derived runtime state?

These questions should be answered through experiments and runtime evidence rather than by analogy to human psychology alone.
