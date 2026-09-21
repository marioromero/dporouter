---
name: domain-implementation
description: Implement or update an approved D01-D12 privacy domain without reinterpreting legal content, changing canonical semantic keys, or breaking cross-domain traceability.
compatibility: opencode
---

# Domain Implementation Skill

Use this skill when implementing, importing, updating or reviewing an approved D01-D12 domain.

## Required context

Before modifying implementation:

1. Read `/AGENTS.md`.
2. Read `/docs/IMPLEMENTATION_STATUS.md`.
3. Read `/docs/PROJECT_CANON.md`.
4. Read `/docs/DATA_CONTRACTS.md`.
5. Read `/docs/DECISIONS.md`.
6. Read the requested domain file only.
7. Read another domain file only if a declared cross-domain dependency requires it.

Do not pre-load all domains.

## Implementation rules

Preserve exactly:

- semantic activity key;
- activity boundaries;
- activity type;
- evidence basis;
- legal basis;
- applicable role;
- applicability semantics;
- dependency semantics;
- reasoning-record requirement;
- state effects;
- relationship effects;
- regulatory status.

Visible UI wording may only be transformed when the task explicitly authorizes presentation editing.

Legal meaning must not change.

## Dependency rules

For every dependency:

- verify that `target_activity_key` resolves;
- preserve `scope`;
- preserve `type`;
- preserve conditional semantics;
- do not convert input dependency into execution order;
- do not treat every dependency as blocking.

## Applicability rules

Never mix:

`conditions_applicability[]`

with:

`activity_dependencies[]`.

Never treat `unknown` as false.

Do not invent default applicability when the canonical specification requires professional judgment.

## State rules

When an activity has formal `state_effect[]`:

- preserve structured representation;
- preserve transition semantics;
- do not reduce the effect to explanatory prose.

When the activity has `relationship_effect[]`:

- preserve it separately from general state effects.

## Provenance rules

Every implemented requirement must preserve whether its evidence or control is:

- legal requirement;
- agency standard.

Pending regulatory status must remain visible where supplied.

## Validation before completion

Before reporting completion, check:

1. activity keys are unique;
2. domain references resolve;
3. dependency targets resolve;
4. enum values are valid;
5. no canonical field was silently dropped;
6. no legal requirement was reclassified;
7. no agency standard was presented as legislation;
8. unknown-state semantics remain intact;
9. cross-domain links remain valid;
10. deep-link identity does not depend on mutable display labels.

If a canonical contradiction is discovered:

- do not fix legal content autonomously;
- report the contradiction;
- identify the exact affected activity or field;
- stop that specific content change until instructed.

## Completion report

Report:

- domain implemented;
- files changed;
- number of activity definitions affected;
- dependency validation result;
- unresolved references;
- schema deviations;
- tests or validation performed.

Do not continue into another domain automatically.
