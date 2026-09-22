# Accepted Architecture Decisions

These decisions are accepted.

Do not reverse them implicitly during implementation.

---

## ADR-001 — Two-stage product architecture

Status: ACCEPTED

Stage 1 is a definition-driven operational manual and decision-support system.

Stage 2 adds persistent client-specific execution.

Stage 1 must be architected so Stage 2 can reuse it.

---

## ADR-002 — ActivityDefinition and ClientActivityInstance are separate

Status: ACCEPTED

Canonical activity content is universal.

Client execution is contextual and historical.

Do not merge the two concepts.

---

## ADR-003 — Stable semantic keys

Status: ACCEPTED

Activities and other canonical definitions use stable semantic identifiers.

Human-visible labels and codes may evolve without changing semantic identity.

---

## ADR-004 — Unknown is not false

Status: ACCEPTED

Unresolved characterization facts retain an explicit unknown state.

No Boolean coercion to false is permitted.

---

## ADR-005 — Applicability and dependency are separate

Status: ACCEPTED

Applicability conditions evaluate case facts and states.

Activity dependencies describe activity-to-activity relationships.

They must remain different fields and concepts.

---

## ADR-006 — Three dependency types

Status: ACCEPTED

The baseline activity dependency model contains:

- execution_prerequisite;
- completion_dependency;
- input_dependency.

No fourth dependency type is currently justified.

---

## ADR-007 — Flat activities by default

Status: ACCEPTED

Activities are siblings by default.

Deep decision branches are used only for genuine conditional divergence.

---

## ADR-008 — Characterization is not compliance assessment

Status: ACCEPTED

Characterization gathers relevant facts.

Compliance activities evaluate legal and methodological conformity.

Do not mix these merely to simplify forms.

---

## ADR-009 — Map Mode and Guided Mode use the same definitions

Status: ACCEPTED

There is one canonical content model.

Map Mode and Guided Mode are different ways to interact with it.

---

## ADR-010 — Guided Mode is non-linear

Status: ACCEPTED

Users may answer characterization questions in different orders.

Incomplete information is supported.

---

## ADR-011 — Legal requirement and agency standard remain distinguishable

Status: ACCEPTED

The application must preserve provenance.

Internal methodology may be stricter than legal minimums but must not be mislabeled as statutory obligation.

---

## ADR-012 — Public entities are outside operational scope

Status: ACCEPTED

The product operates for private entities.

Public obligations may be tracked only as excluded scope for coverage completeness.

---

## ADR-013 — No full GDPR operational branch

Status: ACCEPTED

EU applicability is screened.

Positive screening creates an applicability/referral outcome rather than a complete GDPR compliance model.

---

## ADR-014 — Law 21.663 is parallel scope

Status: ACCEPTED

ANCI / OIV / essential-service relevance may trigger parallel incident work.

The product does not become a complete cybersecurity compliance system.

---

## ADR-015 — Legal content is externally governed

Status: ACCEPTED

Coding agents implement approved legal content.

They do not independently reinterpret or update the legal baseline.

---

## ADR-016 — ReasoningRecord is standardized

Status: ACCEPTED

Professional judgment nodes use the canonical reasoning-record structure defined in `DATA_CONTRACTS.md`.

---

## ADR-017 — Formal state effects are structured

Status: ACCEPTED

Activities that create, change or close formal state must preserve that result structurally.

State transitions cannot exist only as prose.

---

## ADR-018 — Role is per actor and per treatment

Status: ACCEPTED

A company can be controller in one treatment and processor in another.

Role must not be modeled as one immutable company-level field.

---

## ADR-019 — Confirmed role conversion is historical

Status: ACCEPTED

Confirmed role changes update current role and append role history.

Potential conversion signals do not change role.

---

## ADR-020 — MPI lifecycle and certification are separate

Status: ACCEPTED

Certification state must not control MPI lifecycle automatically.

Certification revocation does not itself mean the MPI has been discontinued.

---

## ADR-021 — DPO and MPI recommendations are separate

Status: ACCEPTED

DPO professional recommendation and MPI professional recommendation are different outputs.

Neither becomes a legal obligation merely because the agency recommends it.

---

## ADR-022 — EIPD technology risk is not a fifth automatic trigger

Status: ACCEPTED

Technology is part of the general high-risk assessment.

It is not modeled as an autonomous automatic EIPD trigger unless future official law changes.

---

## ADR-023 — Large scale has no invented numeric threshold

Status: ACCEPTED

Large-scale assessment requires documented reasoning.

Do not hard-code an unsupported legal number.

---

## ADR-024 — Residual high risk does not create mandatory Agency consultation by default

Status: ACCEPTED

Agency consultation may be professionally recommended.

It is not represented as an automatic legal blocking condition under the frozen baseline.

---

## ADR-025 — Breach notification regimes are parallel

Status: ACCEPTED

A single incident may independently activate:

- privacy Agency notification;
- subject notification;
- ANCI / CSIRT reporting;
- contractual or sectoral reporting.

Do not collapse them into one Boolean or one deadline.

---

## ADR-026 — Concrete evidence over vague status

Status: ACCEPTED

Monitoring and closure should rely on reviewable evidence.

Avoid vague proof such as “follow-up completed” when a concrete artifact can be specified.

---

## ADR-027 — Findings and corrective actions are separate

Status: ACCEPTED

A finding is a detected condition.

A corrective action is work performed to remediate one or more findings.

---

## ADR-028 — Regulatory change is impact-driven

Status: ACCEPTED

Future regulatory updates must be able to identify affected:

- activities;
- artifacts;
- clients.

Do not treat regulatory monitoring as a news feed only.

---

## ADR-029 — Markdown documentation is not the runtime legal database

Status: ACCEPTED

Markdown files explain and govern canonical content.

When executable structured definitions are introduced, the application must consume a controlled structured representation.

Do not build runtime behavior by scraping prose from Markdown.

---

## ADR-030 — No premature Stage 2 implementation

Status: ACCEPTED

Stage 1 must remain Stage 2-compatible.

That does not authorize implementing speculative client-workflow features before they are designed.

---

## ADR-031 — Referential integrity must be validated

Status: ACCEPTED

Every dependency target and canonical reference must resolve correctly.

Unresolved references are errors, not optional warnings to ignore.

---

## ADR-032 — Canonical documentation changes are explicit

Status: ACCEPTED

Ordinary implementation work must not silently rewrite architecture or governance documents.

---

## ADR-041 — Structured canonical content is the single source of truth

Status: ACCEPTED

Approved D01-D12 operational definitions live under `/content/domains`.

The application consumes these structured canonical definitions.

`docs/domains/Dxx.md` files are deterministic human-readable projections generated from the same source.

Canonical legal or operational content must not be independently duplicated inside application implementation files.

A content change is made once in the canonical structured source, followed by regeneration and integrity validation.

Runtime behavior must not parse domain Markdown.

---

## ADR-042 — Guided execution is a separate canonical layer

Status: ACCEPTED

ActivityDefinition describes the operational activity.

ExecutionProtocol defines how a professional is guided through facts, questions, rules and outcomes.

Protocols live as canonical structured content and are not hardcoded inside UI components.

Map Mode, Guided Mode and future Stage 2 workflows may reuse the same protocol definitions.

---

## ADR-043 — Decision support must be deterministic and explainable

Status: ACCEPTED

Canonical legal and professional decision protocols use explicit facts and deterministic rules.

Unknown required facts prevent a definitive outcome when the protocol marks them as necessary.

The system must expose the facts and rules that produced each conclusion.

An LLM must not silently determine a legal obligation or professional classification in place of the canonical rules.
