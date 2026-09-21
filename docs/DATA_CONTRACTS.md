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

