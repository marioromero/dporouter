# Data Contracts

Status: CANONICAL SEMANTIC CONTRACT
Implementation syntax: NOT YET SELECTED

This document defines semantic contracts.

It does not mandate TypeScript, JSON, a database engine or a particular schema library.

Do not prematurely lock implementation technology before the dedicated technical architecture iteration.

## 1. DomainDefinition

A domain definition must be capable of representing:

```text
domain_key
human_code
name
objective
description
activity_keys[]
related_domain_keys[]
````

Rules:

* `domain_key` is stable.
* `human_code` is presentation-oriented.
* visible naming changes must not break identity.

The twelve primary DPO service domains are fixed in `PROJECT_CANON.md`.

## 2. ActivityDefinition

The canonical activity-definition contract contains:

```text
activity_key
human_code
name
objective
trigger_question
interlocutors[]
data_collection_methods[]
steps_operational[]
evidence_required[]
evidence_basis
deliverable
estimated_time
complexity
legal_basis[]
applicable_role[]
conditions_applicability[]
reasoning_record_required
state_effect[]
relationship_effect[]
regulatory_status
last_legal_review
activity_type
activity_dependencies[]
```

No field should be silently removed because it is not yet shown in the Stage 1 UI.

## 3. Activity Type

Allowed baseline values:

```text
assessment
implementation
monitoring
```

Do not invent additional values without explicit schema revision.

## 4. Evidence Basis

Allowed baseline values:

```text
legal_requirement
agency_standard
```

This classification describes why the evidence or control is expected.

It must remain distinct from regulatory status.

## 5. ActivityDependency

Each dependency contains:

```text
target_activity_key
scope
type
condition
rationale
```

Allowed `scope` values:

```text
same_domain
cross_domain
```

Allowed `type` values:

```text
execution_prerequisite
completion_dependency
input_dependency
```

Definitions:

### execution_prerequisite

The target activity must reach the required execution condition before this activity may properly proceed.

### completion_dependency

This activity may begin, but its completion depends on the target activity reaching the required condition.

### input_dependency

The target activity supplies information consumed by this activity without necessarily imposing execution sequence.

Do not infer strict sequencing from every dependency.

## 6. Applicability Conditions

`conditions_applicability[]` is NOT an activity dependency.

It expresses case facts or states that determine whether an activity applies.

Examples of semantic sources include:

* treatment attributes;
* actor roles;
* data categories;
* governance state;
* regulatory tags;
* derived flags.

The executable applicability-expression format is deliberately deferred to the dedicated applicability-engine iteration.

Do not invent a permanent expression DSL before that iteration.

## 7. Unknown State

Applicability facts must support unresolved information.

At minimum, characterization answers support:

```text
yes
no
unknown
not_applicable
```

Rules:

```text
unknown != no
unknown != not_applicable
```

Do not coerce `unknown` into a Boolean false.

## 8. LegalBasis

A legal-basis reference must be capable of representing:

```text
source_id
source_name
article_or_provision
reference_text
source_url
basis_type
regulatory_status
last_verified_at
```

Legal source information is controlled content.

Implementation must not fabricate missing citations.

## 9. Regulatory Status

The product must be capable of distinguishing at least these semantic conditions:

```text
current
transitional
pending_agency_guidance
pending_agency_instrument
pending_regulation
superseded
```

Do not assume all statuses will be used by every activity.

Do not convert a pending state into current merely to simplify UI logic.

## 10. ReasoningRecord

The canonical reasoning record contains:

```text
conclusion
legal_question
facts_considered[]
legal_factors[]
evidence_refs[]
alternatives_considered[]
rationale
decided_by
reviewed_by
decided_at
legal_basis[]
```

Purpose:

A reasoning record preserves professional judgment for decisions where legislation requires assessment but does not supply a purely binary factual trigger.

Use cases include, among others:

* legitimate-interest assessment;
* reasonable breach risk;
* high-risk assessment;
* large-scale classification;
* other approved judgment nodes.

The reasoning record is an agency-standard evidence structure unless the canonical legal content explicitly says otherwise.

## 11. State Effects

`state_effect[]` represents structured consequences of an activity.

Examples of semantic effects include:

* creating a state;
* updating a state;
* clearing a state;
* activating a requirement;
* triggering recomputation;
* setting a readiness condition.

The exact executable state-effect syntax is deferred to the state-engine implementation iteration.

The requirement that formal state changes be structured is NOT deferred.

Do not hide a formal state transition only in prose.

## 12. Relationship Effects

`relationship_effect[]` represents consequences affecting actor or third-party relationships.

Examples include:

```text
review_processor_relationship
assess_unauthorized_processing
replacement_required
```

Relationship effects are distinct from state effects.

Do not collapse them merely because both may generate work.

## 13. DiagnosticAttribute

The characterization attribute contract contains:

```text
key
label
question
answer_type
options
source_type
legal_basis[]
derived_flags[]
dependencies[]
evidence_hint
last_legal_review
regulatory_status
```

Characterization facts and compliance findings remain separate.

## 14. Diagnostic Object Areas

The diagnostic model must be capable of organizing:

```text
entity
territory
roles
subjects
data_categories
processing_characteristics
flows
maturity
governance
regulatory_tags
```

This is a conceptual organization.

Implementation details will be approved later.

## 15. Per-Treatment Purpose Model

Lawfulness is evaluated per purpose, not once globally per treatment.

The model must be capable of representing:

```text
treatment
  purposes[]
    purpose_id
    description
    lawful_basis[]
```

Do not reduce a treatment to one global lawful-basis field.

## 16. Actor Role Model

Role is per actor and per treatment.

The model must support:

```text
actor.role_current
actor.role_history[]
```

An actor role event must be capable of representing:

```text
actor_id
treatment_id
previous_role
new_role
effective_at
detected_at
trigger_type
triggering_event
legal_basis[]
evidence_refs[]
state_effect[]
relationship_effect[]
reviewed_by
```

A potential role conversion does not update `role_current`.

Only a confirmed role conversion does.

## 17. Client Role Conversion vs Third-Party Role Conversion

These are different outcomes.

### client_role_conversion

May:

* update client role;
* append role history;
* recompute client obligations.

### third_party_role_conversion

May:

* update third-party role;
* append role history;
* trigger relationship review;
* trigger unauthorized-processing assessment.

It must not falsely change the client's role.

## 18. MPI Lifecycle State

Allowed baseline lifecycle values:

```text
not_assessed
not_adopted
under_evaluation
adoption_formalized
implementing
implemented
discontinued
```

MPI lifecycle is separate from certification status.

## 19. MPI Certification State

Allowed baseline values:

```text
not_requested
requested
certified
renewal_requested
expired
revoked
denied
terminated_other
```

Certification revocation does not automatically mean the MPI lifecycle becomes discontinued.

## 20. Formalized MPI Adoption

When adoption is formally evidenced, the model must be capable of recording:

```text
mpi.adoption_effective_at
mpi.adoption_evidence_ref
mpi.adoption_evidence_basis
```

The approved agency standard requires dated internal adoption evidence for auditability.

This documentation standard is not to be mislabeled as an express statutory formality unless canonical legal content says so.

## 21. DPO Requirement State

The model must distinguish:

```text
dpo.requirement.active
dpo.requirement.source
dpo.requirement.effective_at
dpo.status
dpo.vacancy
dpo.replacement_required
```

If an active MPI is the sole source requiring a DPO and the DPO terminates:

```text
dpo.status = terminated
dpo.vacancy = true
dpo.requirement.active = true
dpo.replacement_required = true
```

A voluntary DPO termination outside an active MPI does not automatically create a replacement obligation.

## 22. DPO Recommendation Outcome

Baseline recommendation outcomes:

```text
required_by_mpi
strongly_recommended
recommended
not_priority
```

This recommendation model must remain distinct from a legal-requirement determination.

## 23. MPI Recommendation Outcome

Baseline recommendation outcomes:

```text
recommended
worth_considering
not_priority
```

Do not transform professional recommendation into legal obligation.

## 24. Consent State

Baseline consent statuses:

```text
not_requested
pending
active
withdrawn
invalid
evidence_missing
```

The record must be capable of distinguishing consent by:

* subject;
* treatment;
* purpose.

Consent is not merely a person-level Boolean.

## 25. Rights Request State

Baseline rights-request statuses:

```text
received
identity_validation
under_assessment
executing
blocked_pending_decision
fulfilled
partially_fulfilled
rejected
overdue
closed
```

Deadline semantics must preserve whether a period is:

```text
calendar_days
business_days
without_undue_delay
```

Do not represent every legal deadline as a plain integer.

## 26. Transfer State

Baseline international-transfer statuses:

```text
identified
under_assessment
mechanism_pending
pending_authorization
allowed
allowed_by_exception
suspended
invalid
terminated
```

Transfer mechanism and transfer status are separate fields.

## 27. Treatment Readiness

Baseline readiness states:

```text
not_assessed
assessment_in_progress
blocked_pending_eipd
blocked_by_legal_gap
remediation_required
ready_with_escalation
ready
```

Readiness is a derived operational synthesis.

It must not be freely editable as an arbitrary user label.

## 28. Security Posture

Baseline agency-methodology states:

```text
not_assessed
adequate
improvement_required
material_gap
critical_gap
```

This is an agency-standard synthesis.

It must not be presented as a statutory legal classification.

## 29. Incident Deadlines

One incident may have multiple parallel legal deadlines.

The future model must be capable of representing:

```text
incident.deadlines[] {
  legal_regime
  obligation
  due_at
  status
}
```

Do not reduce all parallel reporting regimes to one deadline.

## 30. Findings and Corrective Actions

A finding and a corrective action are different entities.

A finding must be capable of representing:

```text
finding_id
legal_basis
activity_key
treatment_id
evidence
severity
detected_at
status
```

A corrective action must be capable of representing:

```text
action_id
finding_ids[]
action
owner
due_at
evidence_required
status
verified_at
```

One finding may have multiple actions.

One action may address multiple findings when the relationship is explicit.

## 31. ActivityDefinition vs ClientActivityInstance

`ActivityDefinition` is canonical content.

A future `ClientActivityInstance` is execution history.

Future instances are expected to reference definitions rather than copy them as unrelated records.

A future instance may contain:

```text
client_id
activity_key
treatment_id
status
owner
started_at
due_at
completed_at
reasoning_record_refs[]
evidence_refs[]
artifact_refs[]
history[]
```

This future contract is reserved for Stage 2.

Do not implement the full Stage 2 entity in the foundation iteration.

## 32. Referential Integrity

Eventually:

* every activity key must be unique;
* every dependency target must resolve exactly once;
* every domain activity reference must resolve exactly once;
* every referenced state enum must exist;
* every canonical derived flag should have an identified producer and/or consumer;
* unresolved references must fail validation.

Never silently discard an invalid reference.

## 33. ExecutionProtocol

An execution protocol defines HOW a professional is guided through facts,
questions, rules and outcomes for one activity. It complements, never
replaces, the `ActivityDefinition`.

An execution protocol must be capable of representing:

```text
protocol_key
activity_key
version
mode
execution_scope
title
description
entry_node_key
nodes[]
outcomes[]
decision_fact_keys[]
external_fact_keys[]
last_review
provenance
```

Allowed baseline `mode` values:

```text
decision
procedure
checklist
```

Allowed baseline `execution_scope` values:

```text
company
treatment
purpose
```

Rules:

* One activity has zero or one active protocol in Stage 1.
* Historical versions are reserved for later; no persistent versioning now.
* Protocols live as canonical structured content, never hardcoded in UI.
* The relation resolves via the protocol registry (`activity_key →
  ExecutionProtocol`); `ActivityDefinition` carries no protocol fields.
* `external_fact_keys[]` declares valid facts produced outside the
  protocol (Diagnóstico, another protocol, injected context, future
  persistence) so `required_facts` referencing them still validates.
* `execution_scope` declares the juridical object under analysis;
  absent means `company` (all D1 protocols resolve identically without
  editing them).

## 34. GuidanceNode

A guidance node must be capable of representing:

```text
node_key
node_type
title
prompt
why_it_matters
fact_key
answer_type
options[]
options_source
evidence_to_review[]
help_text[]
required_facts[]
default_next_node_key
transitions[]
related_activity_keys[]
provenance
```

Allowed baseline `node_type` values:

```text
question
decision
result
```

Allowed baseline `answer_type` values:

```text
yes_no_unknown
single_select
none
text
date
```

Allowed baseline `options_source` values:

```text
same_company_treatments
```

Rules:

* Do not force irrelevant fields on nodes that do not need them.
* Every `node_key` has a stable deep link.
* Opening a node without prior session state must work and must not invent
  prior answers.
* `required_facts[]` holds semantic fact keys that must be resolved to work
  the node. Array position defines presentation or suggested traversal only;
  it never defines semantic prerequisites. A fact key is valid when some
  protocol node produces it or when it is declared in
  `external_fact_keys[]`; facts may originate outside the current protocol.
* A decision rule may route either to another node (`goto_node_key`) or to
  an outcome (`goto_outcome_key`).
* Scalar capture nodes (`text`, `date`) carry no options and no
  `options_source`; the professional enters the value:
  - `text` is a scalar string, trimmed on write; empty or whitespace-only
    counts as unanswered and is never persisted. It never stores JSON,
    arrays, delimited lists, objects, matrices, relations or packed
    records.
  - `date` is a civil date strictly `YYYY-MM-DD` with a real calendar
    day. No time, timezone, datetime, ranges, recurrence or silent
    generation. Invalid values are never persisted.
  - Both persist as normal protocol answers in their ExecutionContext
    (company, treatment or purpose): no special storage, no `FactRecord`
    change, `YYYY-MM-DD` kept verbatim in JSON. Import rejects stored
    empty text or invalid dates as corrupt.
* `options_source` (absent by default) declares runtime-generated
  options for a `single_select` question whose values cannot be
  enumerated statically without destroying semantics.
  `same_company_treatments` offers the company's TreatmentContexts
  alongside the node's static `options` (e.g. an explicit absence
  alternative); the selected value is recorded as a normal scoped
  answer under the node's `fact_key`. A resolved treatment reference
  is valid only as an existing same-company treatment distinct from
  the executing treatment; import rejects dangling, cross-company or
  self references explicitly.

## 35. AnswerOption

An answer option must be capable of representing:

```text
value
label
description
fact_effect
next_node_key (only when the transition is direct)
```

Rules:

* Options produce facts with stable keys.
* A response never coerces `unknown` into `no`.

## 36. DecisionRule

A decision rule is declarative and explainable. It must support at minimum:

```text
all
any
not
comparison of a fact_key against a value
count of true factors within a set
destination route
textual explanation of why the rule fired
```

Rules:

* No general-purpose programming language is constructed.
* Rules are evaluated in order; the first match wins.
* Every fired rule exposes its explanation to the user.

## 37. ProtocolOutcome

A protocol outcome must be capable of representing:

```text
outcome_key
label
classification
explanation
provenance
next_actions[]
canonical_fact_effects[]
```

`classification` preserves the legal-requirement / agency-standard
distinction at result level. A methodological recommendation must never be
labeled as a legal requirement.

`canonical_fact_effects[]` holds only plain `{fact_key, value}` pairs
materialized through explicit finalization. It never interprets
`ActivityDefinition.state_effect[]` as an executable language: no
append, create, dynamic-date, history or lifecycle operators exist.
Effects requiring those remain gaps and are never declared.

## 38. NextAction

A next action may link to:

* another activity;
* another node;
* an evaluation restart;
* an informational action without destination.

Rules:

* Existing activities render as real links.
* Future targets not yet imported use the canonical pending-reference
  mechanism. No broken links are generated.

## 39. Guided Facts and Evaluation Context

Guidance nodes produce facts with stable keys. A protocol must not assume it
will always have to ask them: the engine receives an evaluation context and
reuses known facts, marking them as already available without demanding a
new answer.

Rules:

```text
unknown != no
unanswered != no
```

An unresolved mandatory fact prevents a definitive outcome when the protocol
marks it as necessary; the system reports which facts are missing instead.
Session answers persist per company in the Stage 1 local workspace and are
never presented as saved client records beyond it.

## 40. ExecutionScope

The closed set of juridical objects under analysis in Stage 1:

```text
company
treatment
purpose
```

Rules:

* No arbitrary scope strings, no generic nesting, no extensible engine.
* A protocol declares at most one scope; absent means `company`.
* Scopes are juridical objects, never work instances: no owners,
  deadlines, workflow, history or longitudinal audit.

## 41. ExecutionContext

A valid execution context carries its full ancestry:

```text
company → companyId
treatment → companyId + treatmentId
purpose → companyId + treatmentId + purposeId
```

Rules:

* Incomplete contexts (purpose without treatment, treatment without
  company) are inexpressible.
* Membership resolves by structural traversal: the treatment must live
  in the active company, the purpose in the active treatment.
* Cross-parent contexts are rejected, never silently repaired.

## 42. TreatmentContext

The persistent juridical object of one concrete processing operation:

```text
id (stable, unique within the company)
companyId (unambiguous parent)
canonicalTreatmentId (D2.01 identifier, when assigned)
name
description
purposes
```

It holds its own `protocolAnswers` and `reasoningRecords` in the same
shape as the company level. It carries no activity state, progress,
owners, deadlines or history.

## 43. TreatmentPurpose

The persistent juridical child of one purpose within a treatment:

```text
id (stable, unique within the treatment)
treatmentId (unambiguous parent)
description
```

It holds its own `protocolAnswers` and `reasoningRecords`. It carries
no workflow, progress, owners, deadlines, execution timestamps or
history. No fourth level or additional persistent juridical entity
exists in Stage 1.

## 44. Scoped Fact Addressing

Fact identity is `(scope, ancestry, factKey)`. `protocolKey` and any
other source belong to provenance, never to the semantic identity.

```text
company fact → companyId + factKey
treatment fact → companyId + treatmentId + factKey
purpose fact → companyId + treatmentId + purposeId + factKey
```

Rules:

* Protocol answers keep their `Record<protocolKey,
  Record<factKey, FactRecord>>` shape at every scope; no generic facts
  store exists.
* A purpose address always embeds its `treatmentId`, so ancestry is
  verifiable without global lookups.
* Active selection (`activeTreatmentId?`, `activePurposeId?`) is
  navigation, never a fact: a purpose selection requires a compatible
  treatment selection, and deletion cascades to scoped state plus
  affected navigation. No soft-delete or history is kept.
* Export/import preserves local IDs, parent relations, scoped answers
  and records, and rejects structurally invalid parentage; stale
  navigation pointers normalize to absent. Workspaces without
  treatments remain valid, and D1 facts are never moved.

## 45. Scoped Conflict Semantics

Within one juridical address:

```text
same source + update → latest observation of that source wins
different sources + same value → agreement, fact resolved
different sources + different values → fact_conflict
```

Rules:

* Values in different addresses never conflict with each other.
* A view resolves by precedence own scope → ancestors; ancestors fill
  absent keys, never override the own value, never conflict cross-scope.
* A conflict in a needed fact blocks a definitive conclusion within
  that view.
* Professional resolution applies only to its own address (absent scope
  means company legacy) and records fact, value, moment and
  alternatives; a later contradiction reopens the conflict.

## 46. AutomatedUseRecord

A local value object owned exclusively by one treatment,
supporting D4.08/D4.09 repeated-use evaluation (see ADR-052):

```text
id (stable, unique within the treatment)
name
description?
purposeId? (same-treatment purpose only; cross-parent rejected)
processDescription?
mechanismDescription?
decisionDescription?
profiling (yes | no | unknown)
evidenceRef? (documentary reference of the use, never subject evidence)
article8bisCoverage (covered | not_covered | unknown)
legalPath (contract_necessary | explicit_consent | legal_authorization
  | none | unknown | not_applicable)
safeguards? (only when covered: five yes|no|unknown verifications
  plus minimal intervention/review channel scalars)
```

Rules:

* One collection `automatedUses[]` per treatment, shared by D4.08
  and D4.09. It is not an execution scope, not a global entity, not
  a `ClientActivityInstance`: no progress, owner, deadline,
  lifecycle, history or events.
* New uses start unclassified (`unknown`/`unknown`, no safeguards);
  descriptive drafts never force a legal determination.
* Coverage/legalPath obey the closed matrix (`covered` admits the
  three exceptions, `none` or `unknown`; `not_covered` forces
  `not_applicable`; `unknown` forces `unknown`). Coverage changes
  normalize path and safeguards atomically.
* `safeguards` corresponds only to covered uses. Its absence for
  `not_covered`/`unknown` is never non-compliance; safeguards on
  such uses are rejected at import.
* Determinations are subordinate professional records, not
  independent canonical facts. Creating, editing or deleting uses
  never writes canonical effects; the joint justification lives in
  the single treatment-scoped D4.08 ReasoningRecord (considered use
  IDs as explicit `automated_use:<id>` entries in
  `facts_considered[]`; `rationale` stays free prose and is never
  parsed), and the consolidated
  results live in treatment canonical facts written only by
  explicit finalization.
* Purpose deletion clears `purposeId` on affected uses and keeps
  them; use deletion is local hard-delete with its determinations
  and safeguards. Absent collection equals empty (legacy valid).
* Read-only deterministic `derived.treatment.automated_uses_*`
  projections expose existence, per-use classification progress,
  covered presence, legal-path determination and safeguard state.
  They never persist, never write facts and never conclude
  `no_covered_use` from an empty inventory.

## 47. D5 Special-Regime Capture (Punto 0)

Hybrid minimal capture enabling future machine-readable D5
candidacy without storing real special personal data. Structure is
never a legal conclusion; candidacy is never a canonical result.

```text
DataItemRecord: sensitive?, health?, biologicalProfile?,
  geolocation? (each yes | no | unknown; absent = unknown)
PurposeScopedState.specialRegimeProfile? {
  biometricIdentificationUse, involvesMinors,
  researchPublicInterestCandidate (each yes | no | unknown)
}
```

Rules:

* The four item signals are structural declarations about the
  datum's nature for analysis purposes. New items default to
  `unknown`; `unknown` (or absence) never equals `no`.
* The purpose profile is a local purpose-owned object, not an
  entity: no IDs, no collection, no lifecycle. Absent is valid
  (legacy) and equals all `unknown`. It stores only abstract
  population/context signals, never ages, birthdates, subjects or
  representatives.
* No automatic inference exists between signals (`health = yes`
  never writes `sensitive = yes`, and likewise for every other
  pair). Editing a signal writes no other signal and no canonical
  fact, answer, reasoning record, effect or work status.
* No `biometric`, `minor`, `research`, `financial`, `titleIII`,
  `specialCategories[]`, `regimes[]` or applicability flags exist.
  `DataItemRecord.category` stays free text.
* Purpose-level candidates consider only items currently linked
  via `DataPurposeLink`; unlinking or deleting an item
  recomputes routing read-only without touching records, answers
  or prior results.
* Structural coherence validators are pure and non-mutating:
  stable issue codes (`health_sensitive_mismatch`,
  `biological_sensitive_mismatch`, `biometric_context_mismatch`
  with treatment/purpose/item references). They warn, never fix,
  never write facts and never alter candidacy. The biometric
  check fires only with sufficient explicit information (all
  linked items `sensitive = no`); unknowns stay silent.
* Derived candidates (`derived.purpose.d5_*_candidate`, seven
  static purpose-scoped keys) are read-only, never persisted,
  never conflict sources and never conclude: `yes` only when the
  structure mechanically requires review, `no` only when it
  mechanically excludes it, otherwise the fact is absent and
  absence means `unknown` for D5 routing. Empty links mean
  `unknown`, never `no`.
* The Title III candidate consumes only existing D2.05
  purpose-scoped route truth (`lawful.consent_applies`,
  `lawful.art13_source`): affirmed article 13(a) route with
  consent discarded yields `yes`; an affirmatively determined
  different route yields `no`; the rest stays `unknown`. No
  duplicated financial flag exists and `purpose.lawful_basis` is
  never materialized through this path.
* Reasoning references use the stable
  `ReasoningRecord.facts_considered[]` list with exact
  `data_item:<id>` tokens (local ID, treatment-subordinated);
  `rationale` and `evidence_refs` are never parsed.
* Import/export: legacy absence stays valid (`unknown`);
  invalid enums or types reject; enum-valid but suspicious
  combinations are preserved (runtime validators report them);
  derived candidates and warnings never persist.
* No new scope, entity, collection-per-purpose, per-item
  protocol session, dynamic fact key or persisted warning
  framework is introduced.

## 48. D6 Third-Party Relationship Capture (Punto 0)

Local value-object collection `TreatmentScopedState.thirdPartyRelationships?`
supporting repeatable D6.01–D6.07 evaluation over multiple third-party
relationships inside one treatment (see ADR-054). Structure is never a
legal conclusion; local assessments are never canonical results.

```text
ThirdPartyRelationshipRecord:
  id (stable, unique within the treatment)
  actorId (existing ActorRecord in the same treatment)
  label (human identification of the relationship)
  relationshipType (unknown | communication | cession | processor | subprocessor)
  purposeIds[] (same-treatment purposes; unique; may be empty draft)
  dataItemIds[] (same-treatment data items; unique; may be empty)
  internationalDimension (yes | no | unknown; default unknown)
  parentRelationshipId? (delegation chain; subprocessor only)
  evidenceRef? (documentary reference, never subject evidence)
  cessionAssessment? { lawfulness: supported|not_supported|unknown;
    instrument: validated|remediation_required|unknown }
  processorAssessment? { contract: validated|remediation_required|unknown;
    instructions: controlled|remediation_required|unknown;
    operational: controlled|remediation_required|unknown }
  subprocessorAssessment? { authorization: controlled|remediation_required|unknown }
```

Rules:

* One relationship has exactly one type. An actor holding two different
  relationships (e.g. processor for one purpose, cession recipient for
  another) is recorded as two relationship records. No
  `relationshipTypes[]`.
* `ActorRecord` stays untouched and remains D2.02 source of truth for
  actor identity and role. A relationship never copies name/kind/role
  and never writes the actor role automatically.
* Purpose and data references resolve only inside the same treatment
  (cross-parent rejected at write and import). References exist for
  routing, targeting and traceability; empty lists are valid drafts,
  never negative conclusions.
* `internationalDimension` is routing metadata for future D7 only:
  no adequacy, no SCC, no transfer safeguards, no legality, and
  editing it writes no D6/D7 canonical fact.
* `parentRelationshipId` expresses delegation only: valid only for
  `subprocessor`, must resolve in the same treatment to a `processor`
  or `subprocessor`, never self-reference, never cycles. Absent parent
  on a subprocessor is an accepted draft (future D6.06 treats it as
  incomplete).
* Type/assessment compatibility is a hard invariant:
  `cessionAssessment` only with `cession`, `processorAssessment` only
  with `processor`, `subprocessorAssessment` only with `subprocessor`;
  `unknown` and `communication` carry none; only `subprocessor` may
  carry a parent. Changing `relationshipType` atomically clears
  incompatible assessments and parent. This is structural
  normalization, never legal conversion of results.
* Assessments are subordinate professional determinations: creating,
  editing or deleting records never writes canonical facts, answers,
  reasoning records or effects. Canonical D6 aggregates materialize
  only through explicit protocol finalization (future protocols).
* D6.03 precision frozen: instrument state and cession lawfulness are
  independent dimensions. All instruments validated with at least one
  lawfulness `not_supported` yields a blocked/non-finalizable state:
  neither `instrument_status = validated` nor a remediation effect
  caused solely by the lawfulness failure.
* Empty collection never means complete, controlled or validated:
  every positive aggregate projection requires at least one relevant
  record. For subprocessors, "none recorded" is structurally `no
  exist`; `not_applicable` remains a future reviewed-map judgment,
  never vacuous success.
* Read-only deterministic `derived.treatment.d6_*` (23 keys) and
  `derived.purpose.d6_*` (11 keys) projections expose existence,
  structural completeness, per-dimension assessment aggregation and
  the D6.03 ready/blocked/incomplete separation. They never persist,
  never write facts and never conclude legality.
* Reasoning references use exact `third_party_relationship:<id>`
  tokens inside `ReasoningRecord.facts_considered[]` (local ID,
  treatment-subordinated; same ID in another treatment does not
  collide); `rationale` and `evidence_refs` are never parsed. Future
  D6.01 validates one treatment-scoped record against all current
  relationships; future D6.02 validates a purpose-scoped record
  against all current cessions linked to that purpose. Execution
  scope remains treatment/purpose; no per-relationship protocol,
  session or context exists.
* Delete behavior: an actor referenced by ≥1 relationship cannot be
  deleted (reject, never silent cascade or strip); a relationship
  with children cannot be deleted (reject, no cascade); deleting a
  purpose strips its ID from `purposeIds[]` and deleting a data item
  strips its ID from `dataItemIds[]`, both preserving records and
  writing nothing canonical.
* Import/export: legacy absence is valid (absent = empty structurally,
  collection not materialized); duplicate local IDs, dangling actor,
  purpose, data or parent references, cross-treatment references,
  self-parents, cycles, invalid enums, type/assessment
  incompatibilities and wrong shapes reject explicitly; no ID
  regeneration and no silent repair. Derived projections never
  persist. Roles from `ActorRecord` are never migrated into
  relationships.
* Stage 1 boundary: the collection stores third-party reference,
  abstract classification, juridical links, international tri-state
  and abstract determinations only — never individual disclosures,
  transfer payloads, data subjects, incidents, events, timestamps,
  transaction history, owners, deadlines or workflow instances. No
  fourth scope, no `ThirdPartyContext`, no `ClientActivityInstance`.

## 49. Stage 1 Local Workspace and Advisor Access

The local workspace is browser-persisted Stage 1 work support. It is not
authentication, not a server-backed client registry and not Stage 2.

Root shape (`WorkspaceData`, version `1`):

```text
version: 1
profiles: LocalProfile[]
activeProfileId?: string
companies: Record<companyId, CompanyState>
```

`LocalProfile`:

```text
id
name
username?        advisor login name when the profile is an access account
createdAt
companyIds[]
activeCompanyId?
```

`CompanyState.ownerId?` records the advisor that created or imported the
company. Absence is valid for companies created before advisor access.

Rules:

* Storage is local (`localStorage`, key `dporouter.stage1.v1`); nothing is
  sent to a server and nothing is encrypted.
* Advisor accounts are a fixed local seed (`pablo`, `carlos`, `mario`).
  Credentials are public demo values, never security; the login is a local
  work-thread gate, not authentication.
* Login sets `activeProfileId`; logout clears it. No other profile becomes
  active implicitly.
* Company membership is `LocalProfile.companyIds[]`, not `ownerId`.
  `ownerId` is provenance and import/replacement metadata; access is
  enforced by membership.
* Creating a company assigns `ownerId = active advisor` and appends its ID
  to that advisor's `companyIds[]`. Selecting a company only accepts an ID
  present in the active advisor's `companyIds[]`.
* Loading the workspace (`ensureAdvisorProfiles`) adds missing fixed advisor
  profiles, normalizes their usernames and closes a non-advisor active
  session. It never deletes companies, never reassigns ownership and never
  edits activity data.
* Legacy absence of `username`, `ownerId`, `activeCompanyId` or `treatments`
  remains valid; migration is entry-by-entry and never invents ownership.
* `RequireCompany` gates `Trabajo`, `Diagnóstico`, `Actividad` and `Guía`.
  `Inicio`, `Buscar`, `Glosario` and `Referencias` remain readable without a
  session. The gate is presentation-level; it is not a security boundary.
* Export produces one `CompanyState` as JSON. Import validates the whole
  company strictly (shape, references, answer values), asks confirmation
  before replacing an existing company, and stores it under the importing
  advisor (`ownerId = active advisor`, appended to `companyIds[]`).
* Managing companies, treatments, purposes, local value objects and
  activity work states writes no canonical facts. Only explicit protocol
  finalization writes canonical aggregates (ADR-044, ADR-047, ADR-051).
* No activity owner, deadline, workflow, history or longitudinal audit is
  created by this access layer. Those remain Stage 2 concerns.


