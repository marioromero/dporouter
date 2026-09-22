# Project Governance

## Mission

This repository will contain an internal operational application for professionals providing private-sector personal-data-protection advisory services in Chile.

The product is not a marketing website and not a generic legal-information portal.

Its purpose is to transform a frozen legal and operational model into a highly clear, traceable and navigable professional tool.

The long-term destination is a client-specific operational roadmap with evidence, history, documents and auditable execution. The current product stage is intentionally narrower.

## Current Product Stage

The project has two planned stages.

### Stage 1 — Operational Manual and Decision Tree

Stage 1 provides:

- a complete navigable compliance map;
- twelve operational domains;
- stable deep links to domains and activities;
- guided characterization;
- applicability support;
- activity instructions;
- legal traceability;
- evidence expectations;
- deliverables;
- dependencies and relationships;
- regulatory-status visibility.

Stage 1 is primarily definition-driven.

It does NOT yet implement the complete persistent per-client work-management system.

### Stage 2 — Dynamic Client Roadmap

Stage 2 will reuse the Stage 1 definitions and add:

- clients;
- treatments;
- client activity instances;
- activity status;
- owners;
- deadlines;
- evidence;
- reasoning records;
- findings;
- corrective actions;
- generated documents;
- versions;
- audit history;
- regulatory-change impact;
- operational dashboards.

Stage 1 architecture MUST NOT make Stage 2 require a rewrite of the canonical activity model.

## Authority Order

For repository-level product decisions, use this order:

1. The explicit current user instruction.
2. This `AGENTS.md`.
3. `docs/PROJECT_CANON.md`.
4. `docs/DATA_CONTRACTS.md`.
5. Accepted decisions in `docs/DECISIONS.md`.
6. `docs/PRODUCT_ARCHITECTURE.md`.
7. `docs/UX_PRINCIPLES.md`.
8. The domain specification relevant to the current task.
9. Existing implementation.

If implementation conflicts with a higher-authority source, implementation must be corrected.

Do not silently reconcile conflicts by inventing a new interpretation.

## Mandatory Context Loading Policy

Do not eagerly load the entire repository documentation into context.

At the beginning of every substantive task:

1. Read `docs/IMPLEMENTATION_STATUS.md`.
2. Read only the canonical documents required for that task.
3. Read only the target domain file or files explicitly relevant to that task.
4. Use project skills when their descriptions match the requested work.

For architecture or data-model work, read:

- `docs/PROJECT_CANON.md`
- `docs/DATA_CONTRACTS.md`
- `docs/DECISIONS.md`

For navigation or UX work, also read:

- `docs/PRODUCT_ARCHITECTURE.md`
- `docs/UX_PRINCIPLES.md`

For domain implementation, read:

- the canonical documents above;
- only the requested `docs/domains/Dxx.md`;
- the `domain-implementation` skill.

Do NOT pre-load D01-D12 together unless an explicit integrity or cross-domain task requires them.

## Permanent Contracts

Two documents are permanent contracts alongside this file:

- `docs/PRODUCT_UX_CONTRACT.md` — permanent UX rules (work-first
  presentation, `Trabajo` area, per-company local workspace, provenance
  and validity language, no fake functionality).
- `docs/IMPLEMENTATION_PLAYBOOK.md` — the repetitive 12-step procedure
  for future iterations (status → scope → skills → implement → verify →
  commit → stop).

For guided-protocol work, use the `guided-protocol` skill.

## Locked Product Principles

The following rules are mandatory and must not be changed implicitly.

### 1. Private-sector scope

The operational product is for private entities.

Public-sector operational obligations are outside product scope.

They may exist in legal coverage records as excluded scope but must not generate public-sector operational branches.

### 2. Activity definitions are not client activity instances

A universal activity definition and a future client-specific execution record are different entities.

Never merge them.

Stage 1 works primarily with `ActivityDefinition`.

Stage 2 will introduce `ClientActivityInstance`.

### 3. Stable semantic identifiers

Technical semantic identifiers must remain stable even if visible labels change.

A visible hierarchical code is for humans.

A semantic key is for references, routing, persistence and relationships.

Never derive identity from a mutable UI label.

### 4. Unknown is not false

For diagnostic and applicability data:

`unknown != false`

An unanswered, uncertain or unresolved fact must never silently become a negative answer.

### 5. Applicability is not dependency

`conditions_applicability[]` determines whether an activity applies to the case.

`activity_dependencies[]` describes relationships between activities.

Never merge these concepts in storage, UI or logic.

### 6. Activities are flat by default

Do not build unnecessary deep trees.

Activities are normally sibling items inside a domain.

Add deeper branching only when a genuine conditional decision requires it.

### 7. Legal basis and agency standard must remain distinguishable

Every requirement displayed to a professional must preserve whether it is:

- a legal requirement;
- an agency methodological standard;
- pending official regulation or guidance.

Never present an internal methodological standard as if legislation explicitly required it.

### 8. Do not invent law

Legal content is supplied through approved project specifications.

Do not infer new Chilean legal obligations from GDPR, foreign law, blogs, personal knowledge or general privacy practice.

Do not independently rewrite legal conclusions supplied in canonical content.

If implementation exposes a contradiction or missing field, report it as a specification issue.

### 9. No full GDPR branch

European territorial applicability may be screened.

A positive screen can produce an applicability report and referral.

Do not create a complete GDPR operational tree unless explicitly instructed in a future task.

### 10. Cybersecurity is parallel, not merged

Law 21.663 / ANCI relevance is represented through applicability tags and parallel incident obligations when appropriate.

Do not transform this privacy product into a complete cybersecurity compliance product.

### 11. Map and Guided Mode share one model

The product has:

- free exploration through Map Mode;
- applicability-oriented exploration through Guided Mode.

They must consume the same underlying definitions.

Do not maintain separate copies of the legal content for each mode.

### 12. Guided Mode is not a linear wizard

Characterization questions can be answered in different orders.

Users must be able to revisit facts.

The system must support incomplete information.

### 13. Deep linking is mandatory

Every domain and every activity must eventually have a stable directly accessible route.

A user must not need to traverse a previous wizard step to open a valid activity URL.

### 14. Traceability is a product requirement

An activity must eventually be traceable to:

- its legal or methodological basis;
- applicability conditions;
- dependencies;
- evidence expectations;
- deliverable;
- regulatory status;
- last legal review.

### 15. Evidence is concrete

Avoid vague evidence labels such as “follow-up completed”.

Evidence expectations should describe concrete, reviewable artifacts when the approved domain specification provides them.

### 16. State effects are not prose-only

When an activity creates, changes or closes a formal state, that effect must remain representable as structured data.

Do not hide state transitions exclusively in descriptive text.

### 17. Future auditability

Do not make architectural choices that prevent future preservation of:

- who;
- what;
- when;
- why;
- evidence;
- previous value;
- new value;
- version.

## UI Language

The product UI is Spanish.

Canonical technical identifiers should use stable English semantic naming where already defined by the specifications.

Do not translate semantic keys into Spanish merely for presentation.

Visible labels and technical identifiers are separate concerns.

## Legal Content Change Control

Do not modify approved legal/domain content unless the user explicitly authorizes a content revision.

When implementing domain content:

- preserve semantic activity keys;
- preserve legal-basis distinctions;
- preserve activity boundaries;
- preserve applicability semantics;
- preserve dependency semantics;
- preserve evidence-basis classification.

If something appears legally questionable, do not silently fix it.

Report the issue and leave the canonical content unchanged unless explicitly instructed.

## Canonical Documentation Change Control

Do not modify any of these files as a side effect of ordinary implementation:

- `AGENTS.md`
- `docs/PROJECT_CANON.md`
- `docs/DATA_CONTRACTS.md`
- `docs/DECISIONS.md`
- `docs/PRODUCT_ARCHITECTURE.md`
- `docs/UX_PRINCIPLES.md`

They may only be changed when the current task explicitly instructs you to update project governance or architecture.

`docs/IMPLEMENTATION_STATUS.md` is expected to be updated when an iteration explicitly requests it.

## Canonical Domain Content

Approved D01-D12 operational content lives under `/content/domains`.

These structured definitions are the executable canonical source of truth.

`docs/domains/Dxx.md` files are generated human-readable projections.

Do not edit generated domain Markdown to change legal or operational content.

To modify approved domain content:

receive explicit authorization;
edit the canonical structured definition;
regenerate its human-readable documentation;
run content and integrity validation.

Application code under `/src` must consume canonical definitions rather than maintain independent copies.

## Dependency Integrity

Every eventual `target_activity_key` must resolve to exactly one defined activity.

No implementation may silently ignore an unresolved dependency.

An unresolved reference is a configuration error.

## Regulatory State

Pending Agency guidance, pending regulatory instruments and current legal rules are different states.

Do not convert pending regulation into assumed content.

## Development Discipline

Before editing:

1. inspect the current implementation status;
2. inspect the relevant canonical documents;
3. inspect existing code in the affected area;
4. understand existing patterns before creating new ones.

After editing:

1. run the relevant verification available for the chosen stack;
2. inspect errors rather than suppressing them;
3. use the reviewer subagent for substantial changes when requested or when the task explicitly calls for review;
4. report what changed and any unresolved issue.

Do not disable type checks, lint rules, tests or validation merely to make a task appear complete.

Do not add arbitrary dependencies when the existing stack can solve the requirement.

## Git Discipline

Never use destructive Git commands unless explicitly instructed.

Do not rewrite history.

Do not discard unrelated user changes.

Do not commit automatically unless the current task explicitly requests a commit.

When a commit is requested, include only changes belonging to the current iteration.

## MCP and External Tools

Do not add MCP servers, plugins, external services or external data dependencies unless explicitly instructed.

Do not assume internet research is authorized merely because a legal reference exists.

The legal content baseline is controlled outside the coding agent.

## Completion Rule

Do not continue into a subsequent product iteration unless explicitly instructed.

At the end of each iteration:

- summarize files changed;
- summarize architectural choices made;
- report verification performed;
- report any irreversible or costly-to-change decision;
- stop.
