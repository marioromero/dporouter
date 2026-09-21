# Project Canon

Status: FROZEN BASELINE
Baseline: Functional v1.0
Scope: Private-sector Chile
Product language: Spanish

## 1. Product Mission

The product is an internal operational tool for privacy professionals advising private entities in Chile.

Its objective is to maximize professional autonomy while maintaining:

- a homogeneous advisory standard;
- legal traceability;
- verifiable execution;
- auditable results;
- repeatable deliverables;
- clear applicability logic.

The product must help the professional execute work, not merely read explanations.

## 2. Service Context

The product must support two commercial service contexts.

### DPO as a Service

Continuous operational work organized through recurring compliance domains.

### Punctual Advisory

Finite advisory work organized through project phases.

The service type is commercially declared.

It is not inferred as a legal diagnostic result.

A future diagnostic may warn when the selected service appears inconsistent with the client's needs, but it does not autonomously change the commercial service type.

## 3. Legal Scope

Operational scope is limited to private entities.

Public entities are outside operational product scope.

Public-sector legal obligations may be represented only as excluded product scope when required for legal coverage completeness.

The product must not generate operational public-sector branches.

## 4. Primary Operational Domains

The DPO as a Service operational model contains exactly twelve primary domains.

D1 — Gobernanza, accountability, DPO y MPI

D2 — Inventario, licitud y ciclo de vida

D3 — Transparencia, políticas y consentimiento

D4 — Derechos de titulares y decisiones automatizadas

D5 — Tratamientos especiales

D6 — Cesiones, encargados y subencargados

D7 — Transferencias internacionales

D8 — Privacy by design, riesgo y EIPD

D9 — Seguridad y brechas

D10 — Agencia y gestión regulatoria

D11 — Capacitación y cultura

D12 — Monitoreo, auditoría y mejora continua

Do not rename these domains without explicit architectural authorization.

## 5. Punctual Advisory Phases

The punctual advisory model contains five primary phases.

AP1 — Diagnóstico y caracterización

Primary output:
- diagnosis;
- applicability determination.

AP2 — Gap analysis y plan de remediación

AP3 — Diseño documental y de controles

AP4 — Implementación y habilitación operacional

AP5 — Verificación y cierre

Primary closing outputs:
- final report;
- evidence package;
- continuity plan.

These phases and D1-D12 reuse the same underlying legal and operational content where applicable.

Do not create duplicated legal definitions merely because the commercial service context differs.

## 6. Characterization Principle

Characterization captures facts.

Compliance assessment determines whether legal or methodological requirements are satisfied.

These are different concepts.

The diagnostic must not ask compliance questions merely to populate characterization.

Characterization answers may include:

- yes;
- no;
- unknown;
- not_applicable.

`unknown` must never be treated as `no`.

## 7. Core Characterization Areas

The characterization model must be capable of representing at least:

- entity;
- private-sector status;
- sector;
- annual sales / company-size context;
- territorial factors;
- roles;
- data subjects;
- data categories;
- processing characteristics;
- processors and subprocessors;
- disclosures and transfers;
- international flows;
- maturity;
- governance;
- DPO;
- MPI;
- cybersecurity applicability tags;
- EU extraterritorial-screening tags.

## 8. Roles

A client does not have one immutable global privacy role.

Role is determined per actor and per treatment.

An organization may simultaneously be:

- controller for some treatments;
- processor for other treatments.

The data model must support role history.

Confirmed role conversion under the applicable legal model changes the relevant role state.

A potential role-conversion signal does not change the legal role by itself.

Client role conversion and third-party role conversion must remain distinguishable.

## 9. EU Scope

There is no full GDPR operational branch in the baseline product.

The product may screen for factors such as:

- offering goods or services;
- monitoring behavior;
- relevant establishment.

A positive screen may generate:

- an extraterritorial-applicability report;
- a referral or ad hoc advisory need.

It does not activate a complete GDPR compliance tree.

## 10. Cybersecurity Scope

The product may track whether the organization is:

- within essential-service scope;
- verified as an OIV;
- pending OIV verification.

Relevant privacy incidents may activate a parallel ANCI / CSIRT workflow.

The privacy product must not become a full Law 21.663 compliance application.

## 11. Anti-Explosion Rule

Activities are siblings by default.

Entity type, role, data type, scale, flow, maturity, geography and other characteristics should normally be represented through:

- attributes;
- flags;
- applicability conditions.

Do not encode every combination as a new hierarchical branch.

Create deeper branching only when the user genuinely needs to choose between materially different operational paths.

## 12. Dual Navigation Model

The application must support two ways to use the same canonical definitions.

### Map Mode

Free exploration of the complete operational model.

### Guided Mode

Prioritization and applicability assistance using characterization facts and derived flags.

Guided Mode is not a rigid sequential wizard.

Users may:

- answer questions in different orders;
- leave information unresolved;
- revisit prior facts.

## 13. Activity as Operational Unit

The terminal operational unit is an activity.

Every activity must be capable of communicating:

- what is being assessed or implemented;
- why it applies;
- who should be involved;
- how information should be collected;
- what the professional must do;
- what evidence is expected;
- what deliverable is produced;
- estimated effort;
- complexity;
- legal or methodological basis;
- dependencies;
- applicability conditions;
- state effects;
- regulatory status.

## 14. Traceability Categories

Requirements must preserve their provenance.

At minimum distinguish:

### Legal requirement

A requirement grounded directly in applicable law or regulation.

### Agency standard

A methodological or professional standard adopted by the advisory organization.

### Pending official development

A matter awaiting Agency guidance, list, model, regulation, instruction or other official instrument.

The UI must never collapse these into one undifferentiated category.

## 15. Regulatory Change

Regulatory content has a review date and status.

The future product must be able to identify:

- affected activities;
- affected artifacts;
- affected clients.

Regulatory updates must not require redefining the identity of existing activities.

## 16. Stage 1 Product

Stage 1 is definition-driven and linkable.

It contains:

- product navigation;
- domains;
- activities;
- characterization;
- applicability support;
- legal traceability;
- sources;
- search;
- filtering.

Stage 1 does not yet implement the full client work-management lifecycle.

## 17. Stage 2 Product

Stage 2 will introduce persistent operational execution.

The same activity definition may have many client-specific activity instances.

Stage 2 is expected to support:

- execution status;
- responsible person;
- deadlines;
- evidence;
- reasoning;
- deliverables;
- generated documents;
- findings;
- corrective actions;
- treatment readiness;
- incident workflows;
- regulatory cases;
- history;
- auditability.

The Stage 1 content model must remain reusable.

## 18. Legal Interpretation Boundary

Coding agents do not decide the law.

When canonical domain content is later supplied, it must be implemented faithfully.

If the content appears contradictory or technically impossible to represent, report the issue.

Do not silently reinterpret it.
