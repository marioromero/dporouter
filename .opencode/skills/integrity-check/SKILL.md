---
name: integrity-check
description: Audit the privacy application's canonical definitions and implementation for referential integrity, schema drift, invalid dependencies, provenance errors, missing state effects and Stage 1 to Stage 2 architectural regressions.
compatibility: opencode
---

# Integrity Check Skill

Use this skill for cross-domain validation, schema validation, pre-release review or substantial refactors.

## Read first

Read:

- `/AGENTS.md`
- `/docs/PROJECT_CANON.md`
- `/docs/DATA_CONTRACTS.md`
- `/docs/DECISIONS.md`
- `/docs/IMPLEMENTATION_STATUS.md`

Load domain files only as required by the requested validation scope.

## Mandatory checks

### Canonical identity

Verify:

- every domain key is unique;
- every activity key is unique;
- stable identity does not depend on visible labels.

### Referential integrity

Verify:

- every domain activity reference resolves;
- every `target_activity_key` resolves exactly once;
- cross-domain references point to valid domains;
- no canonical reference is silently ignored.

### Dependency integrity

Verify:

Allowed dependency types remain only:

- `execution_prerequisite`;
- `completion_dependency`;
- `input_dependency`.

Verify applicability conditions have not been stored as activity dependencies.

### Unknown semantics

Verify:

- unresolved facts retain an explicit unknown state;
- unknown is never coerced to false for applicability.

### Canonical field coverage

For every activity definition, verify support for the canonical fields in `DATA_CONTRACTS.md`.

Report silently dropped fields as defects.

### Provenance

Verify that implementation distinguishes:

- legal requirement;
- agency standard;
- pending official development.

Report any UI or data-model behavior that could misrepresent provenance.

### State integrity

Verify:

- formal state changes remain structured;
- enum values resolve;
- readiness is derived rather than arbitrarily editable where specified;
- MPI lifecycle and certification remain separate;
- relationship effects are not collapsed into unrelated state effects.

### Role integrity

Verify:

- role is supported per actor/per treatment;
- role history is representable;
- client role conversion and third-party conversion remain distinguishable.

### Stage boundary

Verify:

- Stage 1 has not accidentally implemented speculative Stage 2 behavior as fake functionality;
- Stage 1 definitions remain reusable by future client activity instances.

### Legal-content drift

Compare implemented canonical data against approved domain specifications.

Report:

- renamed keys;
- merged activities;
- omitted legal bases;
- altered provenance;
- changed applicability;
- invented legal rules.

Do not correct legal meaning autonomously.

## Severity

Classify findings as:

### BLOCKER

Breaks canonical architecture, legal traceability, referential integrity or future Stage 2 compatibility.

### MAJOR

Material implementation deviation that can cause incorrect professional use.

### MINOR

Non-blocking consistency or maintainability issue.

### NOTE

Useful future observation with no current defect.

## Output

Return findings in severity order.

For implementation defects, include:

- file;
- relevant symbol or location;
- violated canonical rule;
- concrete consequence.

If no findings exist, state explicitly that the checked scope passed integrity review.
