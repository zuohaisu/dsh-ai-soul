# Generic Exodus

Generic Exodus is the product path for bringing an existing AI relationship into AI Soul without treating imported text as identity by default.

## Boundary

The first step is evidence preservation, not Soul mutation:

```text
external export
    ↓
Exodus source-evidence record
    ↓
structural normalization
    ↓
archaeology / candidate claims
    ↓
review and governed promotion
    ↓
canonical Soul State
```

An imported `memory.md`, transcript, JSON export, or provider memory file is **source evidence**. It is not a system prompt, not autobiography, and not canonical Soul State.

## ExodusSource v1

`createExodusSource()` records:

- an explicit source ID;
- source type and provider/runtime label;
- capture and import timestamps;
- original filename, media type, and byte length;
- SHA-256 digest of the original imported bytes;
- caller-supplied provenance metadata;
- `canonicalMutation: false` as an explicit import invariant.

The record is defensively cloned and deeply frozen. The digest anchors later normalized evidence and candidate claims to the exact imported bytes.

Example:

```js
import { createExodusSource } from '../src/core/index.js'

const source = createExodusSource({
  sourceId: 'aster-memory-001',
  sourceType: 'memory-export',
  provider: 'example-chat-runtime',
  capturedAt: '2026-08-27T09:00:00.000Z',
  filename: 'memory.md',
  mediaType: 'text/markdown',
  content: '# Memory\nAster and Mira met while building a garden journal.\n',
  provenance: {
    suppliedBy: 'mira',
    acquisition: 'user-export',
  },
})
```

Creating this record performs **zero canonical Soul mutations**.

## Markdown evidence normalization

`normalizeMarkdownEvidence()` is the first generic source adapter. It accepts an `ExodusSource` and the exact Markdown bytes represented by that source.

Before parsing anything, it recomputes SHA-256 and rejects content that no longer matches the source manifest. This keeps later evidence anchored to the preserved import instead of silently normalizing modified text.

The adapter emits deterministic structural evidence units:

- ATX headings;
- ordinary contiguous content blocks;
- fenced code blocks;
- exact 1-based source line ranges;
- raw source text for each unit;
- the active heading path;
- source ID and source digest linkage;
- `canonicalMutation: false` on the document and every unit.

Example:

```js
import {
  createExodusSource,
  normalizeMarkdownEvidence,
} from '../src/core/index.js'

const markdown = '# Memory\n\nAster and Mira met while building a garden journal.\n'
const source = createExodusSource({
  sourceId: 'aster-memory-001',
  sourceType: 'memory-export',
  provider: 'example-chat-runtime',
  capturedAt: '2026-08-27T09:00:00.000Z',
  filename: 'memory.md',
  mediaType: 'text/markdown',
  content: markdown,
  provenance: { suppliedBy: 'mira', acquisition: 'user-export' },
})

const evidence = normalizeMarkdownEvidence({ source, content: markdown })
```

This is deliberately **structural normalization, not interpretation**. A line such as `Name: Aster`, `Mira prefers concise answers`, or `We promised to stay together` remains text evidence. The adapter does not decide whether it is an identity fact, user-model fact, relationship claim, covenant, contradiction, or noise.

Those semantic decisions belong to later archaeology/candidate-claim stages where provenance, uncertainty, counter-evidence, and review can be represented explicitly.

## What these boundaries deliberately do not do

The source manifest and Markdown adapter do not infer identity, resolve conflicts, call an LLM, create candidate claims, inject imported text into a system prompt, or promote anything into canonical Soul State. Provider-specific adapters should normalize into this evidence pipeline rather than redefine the AI Soul ontology.
