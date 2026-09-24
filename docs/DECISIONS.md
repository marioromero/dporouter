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

Precisión (2026-09-22): node prerequisites are semantic (`required_facts[]`), never positional — array order is presentation or suggested traversal only, and facts may originate outside the current protocol. Decision rules may route either to another node or to an outcome.

---

## ADR-043 — Decision support must be deterministic and explainable

Status: ACCEPTED

Canonical legal and professional decision protocols use explicit facts and deterministic rules.

Unknown required facts prevent a definitive outcome when the protocol marks them as necessary.

The system must expose the facts and rules that produced each conclusion.

An LLM must not silently determine a legal obligation or professional classification in place of the canonical rules.

---

## ADR-044 — Explicit finalization with canonical fact effects

Status: ACCEPTED

A definitive outcome may declare `canonical_fact_effects` as plain
`{fact_key, value}` pairs. They materialize exclusively through an
explicit professional action: never by rendering, navigating or
evaluating. Repeating the action is idempotent; failed validation
writes nothing.

Discarded: auto-materialization on outcome render (implicit mutation
without an auditable act) and interpreting `ActivityDefinition.state_effect[]`
as an executable language.

Effects requiring append, create, dynamic dates, history or lifecycle
remain gaps and are never declared. Judgment protocols (D1.03) keep
their own finalization path with `ReasoningRecord`; the generic path
covers `procedure` and `checklist` only.

Stage 1 boundary: materialization writes current observations with
provenance, never longitudinal history or versioning.

---

## ADR-045 — Explicit fact conflicts with professional resolution

Status: ACCEPTED

Same source plus update keeps that source's latest observation.
Different sources with the same value agree. Different sources with
different values produce `fact_conflict`: a distinct state, never
`unknown` nor `false`, and a conflict in a required fact blocks any
definitive conclusion.

Resolution is an explicit professional decision recording fact, value,
moment and alternatives; a later contradiction reopens the conflict.
Resolution applies only within its own juridical address (absent scope
means company legacy) and never resolves sibling scopes silently.

Discarded: last-write-wins across sources (destroys provenance) and
silent majority merging (hides disagreement).

Stage 1 boundary: resolutions carry no longitudinal audit log; that
belongs to Stage 2.

---

## ADR-046 — Company → TreatmentContext → TreatmentPurpose with closed scopes

Status: ACCEPTED

Stage 1 execution scopes are exactly `company`, `treatment` and
`purpose`. A company holds multiple treatment contexts; a treatment
holds multiple purposes. Identity carries full ancestry
(`companyId`, `companyId + treatmentId`,
`companyId + treatmentId + purposeId`); membership resolves by
structural traversal and cross-parent contexts are rejected.

Contexts are persistent juridical objects (identity plus juridical
attributes), never work instances: no owners, deadlines, workflow,
history, reopenings, timelines or longitudinal audit. Deletion is a
hard cascading delete without history.

Discarded: a generic extensible scope engine (unneeded complexity),
purpose as a flat attribute (destroys per-purpose relations required
by D2.05/D2.06), and a fourth scope (no demonstrated need).

Execution scope differs from storage scope: guidance may execute on
one object while addressing another. Purpose-level scoping beyond
identity/containment remains a separate architectural decision.

Stage 1 boundary: per-period instances, event history, dynamic dates
and lifecycle transitions stay deferred; `ClientActivityInstance`
remains a Stage 2 concept.

---

## ADR-047 — Scoped professional-judgment finalization

Status: ACCEPTED

`finalizeProfessionalJudgment` operates on an explicit
`ExecutionContext` (company, treatment or purpose). It reads answers,
facts and the prior record from that address, validates ancestry
before touching state, and persists record plus same-scope canonical
effects in one logical write. Re-finalizing is idempotent; failure
writes nothing.

Discarded: duplicating the finalizer per scope (one model serves all
three) and company-fallback writes for scoped executions (they would
contaminate sibling contexts).

No cross-scope effects exist: an effect without target metadata
materializes only in its execution scope. Child-target writes,
decision-outcome materialization and temporal operators remain gaps.

Stage 1 boundary: single-write persistence with provenance, never
longitudinal history or versioning.

---

## ADR-048 — Treatment references as declared scoped facts

Status: ACCEPTED

A protocol question may declare `options_source:
"same_company_treatments"`: the generic UI offers the company's live
TreatmentContexts next to the node's static options, and the choice
persists as a normal scoped answer under the node's `fact_key`. No new
scope, no graph engine, no workflow, no new entity, no new answer
type, no new operator.

Value contract: the selected value is a `treatmentId`, or one of the
node's own static options (e.g. an explicit absence alternative).
Validity is mechanical — existing treatment, same company, distinct
from the executing treatment — and enforced at the gate, at
finalization and at import. Self-reference is rejected because the
canon requires a *posterior* treatment, necessarily another one
(D2.10 step 3: "tratamiento posterior con finalidad y fuente de
licitud diferente").

Discarded: static `single_select` options for dynamic IDs (destroys
semantics); a parallel link store next to the fact (would store one
relation in two places); silent cleanup of references when the target
treatment is deleted (would alter recorded juridical determinations).

Deleting a referenced treatment leaves a dangling reference that the
UI flags as stale (re-pick overwrites) and import rejects with an
explicit error. Blocking deletion would invent workflow; silent
cleanup would rewrite history. Reported as known Stage 1 behavior.

The static engine routes optimistically on any resolved reference
value (no operator can test id existence); validity is enforced on
the safe side at the gate, at finalization, in the panel and at
import — all blocks, never silent passes.

Stage 1 boundary: single-target references only; no chains, no
traversal, no history/tombstones.

---

## ADR-049 — Scalar capture primitives text and date

Status: ACCEPTED

`text` (trimmed scalar string; empty = unanswered, never stored) and
`date` (strict civil `YYYY-MM-DD`, never stored when invalid) extend
`answer_type` for values the professional enters. Both persist as
normal protocol answers in their ExecutionContext — company,
treatment or purpose — with no special storage, no `FactRecord`
change, and verbatim JSON round-trip. Enforcement lives at the write
point (all scopes plus memory session) and at import (corrupt stored
values rejected explicitly). The engine is untouched: only stored
values exist, and stored values are always valid.

Discarded: option lists for free values (destroys or invents
semantics), silent normalization on import (rewrites evidence), and
any date library (unneeded for format + calendar validation).

Stage 1 boundary: scalars only — no JSON, arrays, matrices,
relations, datetimes, ranges, recurrence or history.

---

## ADR-050 — D2.11 and D2.12 readiness with recorded gaps

Status: ACCEPTED

D2.11 (`treatment.change_review`, decision) keeps both canon paths:
an interpretive branch finalizing professional judgment
treatment-scoped with `change_review_status = completed`, and a
mechanical branch closing deterministically without effects or
record. Before/after comparison is transient evaluation input plus
documentary evidence; a new change overwrites date and description
(latest wins), never versions. Treatment attribute updates happen in
the workspace, never via protocol effects (no mapping exists and none
is invented). Execution-ready yes; product-ready no (mechanical
branch shares the known deterministic-decision gap family).

D2.12 (`inventory.periodic_revalidation`, procedure, company scope,
no reasoning) finalizes static status effects through the existing
company-scope procedure path. Treatment selection is session input
(a free-text scope note), never an entity. The review date is
captured as a scalar answer and persists as such; materializing
canon `treatment_inventory.last_revalidated_at` would require dynamic
effect values, which the contract forbids: recorded as
`DYNAMIC_VALUE_EFFECT_GAP`. Execution-ready yes; product-ready no.

Discarded: `set_dynamic` / `from_answer` effect semantics,
`recompute` as a persisted operator (recompute is live derivation),
and per-period review instances (the canon defines no periods).

Stage 1 boundary: no history, no periodic instances, no Stage 2
semantics; `DETERMINISTIC_DECISION_FINALIZATION_GAP` untouched
(D1.02, D2.05, D2.10 branch, D2.11 mechanical branch).

---

## ADR-051 — Scoped procedure/checklist finalization with addressed context

Status: ACCEPTED

`validateScopedProcedureFinalization` and
`applyScopedProcedureFinalization` extend the existing
procedure/checklist finalization to `treatment` and `purpose`
scopes. Same procedure/checklist semantics, same
`canonical_fact_effects` contract (plain static `{fact_key,
value}` pairs, never interpreted as an executable language), no
ReasoningRecord, no deterministic-decision semantics.

The finalization evaluates the addressed fact view and writes
exclusively to the addressed `ExecutionContext` of the guide
being finalized (`validate` + `apply` receive it explicitly;
the guide session captures it on open and never re-resolves it
from late active selection). If the active selection moved, the
UI warns and blocks the record until the guide is reopened —
never a silent cross-context write. Ancestry is validated by
structural traversal before any read or write; cross-parent
contexts are rejected, never repaired. Conflicts block only intra-address (siblings never
block; ancestors fill absent keys per the frozen fact-view
rules). Idempotence is per full address. The company branch
delegates to the historic path with identical behavior.

Discarded: resolving the target from active selection at commit
time (would write a stale guide into the newly selected object);
company-fallback writes for scoped executions (they would
contaminate sibling contexts); cross-scope effect targets (no
target metadata, no operators, no DSL); dynamic value sourcing
(`DYNAMIC_VALUE_EFFECT_GAP` untouched).

Stage 1 boundary: no new scope, storage, entity, history or
Stage 2 semantics. Existing protocols become product-ready only
when their own content declares static same-scope effects in
later batches; this capability alone changes no readiness.

---

## ADR-052 — Automated uses as treatment-owned local value objects

Status: ACCEPTED

`TreatmentScopedState.automatedUses[]` is a local collection owned
exclusively by one `TreatmentContext` (ADR-046). D4.08
(`automated_decision.scope_assess`) and D4.09
(`automated_decision.safeguards_enable`) share the same collection;
there is no second list and no duplicated truth.

Each `AutomatedUseRecord` carries a local `id` (unique within the
treatment only), human identification, optional same-treatment
`purposeId`, factual process/mechanism/decision descriptions,
`profiling` (`yes | no | unknown`), an optional documentary
`evidenceRef`, subordinate professional determinations
(`article8bisCoverage`, `legalPath`) and optional per-use
safeguard verifications (`safeguards`, only when covered).

Coverage/legalPath obey a closed matrix (`covered` admits the three
exceptions, `none` or `unknown`; `not_covered` forces
`not_applicable`; `unknown` forces `unknown`). Coverage changes
normalize path and safeguards in a single consistent write; old
legal paths are never carried over. Import rejects invalid
combinations instead of repairing them silently.

Safeguard checks are objective structural verifications (`yes | no |
unknown` each, plus minimal channel scalars), never workflow. They
exist only for covered uses; their absence elsewhere is never
non-compliance.

One treatment-scoped `ReasoningRecord` (D4.08) validates the joint
evaluation; there is no record per use and the global record schema
is unchanged. Use IDs travel as explicit `automated_use:<id>`
tokens (exact ID, never name-only narrative), validated against the
addressed treatment. Canonical effects remain treatment-level
aggregates (`scope_status`, `legal_path_status`,
`safeguards_status`), written only by explicit protocol
finalization — never by editing, creating or deleting uses.

Discarded: dynamic fact keys per use (a hidden scope breaking
closed fact identity and validation); a fourth scope or
`AutomatedDecisionContext` (disproportionate, canon-frozen against);
per-use protocol sub-sessions, progress or instances (de facto
`ClientActivityInstance`); generic aggregation or history/lifecycle
machinery.

Stage 1 boundary: no new scope, entity, workflow, owner, deadline,
history, lifecycle, events or per-subject records. Collection
absence stays valid for legacy workspaces; deletion is local
hard-delete with technical cascade only.
