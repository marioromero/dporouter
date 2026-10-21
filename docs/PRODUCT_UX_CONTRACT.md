# Product UX Contract

Status: PERMANENT (Stage 1)
Precedence: this document governs all user-experience decisions. It does not
override legal content, canonical data contracts, or the deterministic
guidance engine — it governs presentation, navigation and Stage 1 storage.

## 1. Work, not metadata

The user sees work and decisions, never internal technical metadata.
Visible surfaces show what to resolve, what to review, what evidence to
obtain, who to talk to, and what the next step is.

## 2. One work area

Map and Domains are a single area called `Trabajo` (global entry D1-D12).
No duplicate visual or conceptual entries for the same landscape.

## 3. Guides everywhere it matters

Every product-ready activity resolves its guide through the protocol
registry. Supported protocol modes:

```text
decision
procedure
checklist
```

An activity without a protocol honestly states that its operational guide
is pending; functionality is never faked.

## 4. Sticky context navigation

Domains, activities and protocol nodes navigate through a persistent
context navigator: domain strip (D1-D12), activity codes within the
domain, and node states within a guide. Explicit previous/next actions
exist between domains and between activities. Returning to an index is
never required.

## 5. No internals in normal UI

Internal variables and enums never appear in normal views. Provenance is
expressed in human language, exactly where the distinction changes how
the professional must interpret the requirement:

```text
Exigido por norma
Criterio interno recomendado
Pendiente de definición oficial
```

Shared temporal validity is reported once, globally — never repeated per
row or sheet.

## 6. Reviewed is not Compliant

`Revisado` never automatically means `Cumple`. Review states describe
work progress, never a legal-compliance verdict. No compliance
percentages are ever shown; factual review counts are allowed
(e.g. `8 de 32 actividades revisadas`).

## 7. Local Stage 1 workspace

The local workspace (browser storage, per company) is Stage 1 work
support. It is not secure authentication and it is not Stage 2.

Three fixed advisor accounts are seeded locally so the work thread starts
with an advisor and continues inside one company. Their credentials are
public demo values and are never presented as security. Companies are
created or imported by the user; no fictional company, activity state,
fact or progress is ever preloaded.

Work areas require an active advisor and a selected company. Reference
views (Inicio, Buscar, Glosario, Referencias) remain readable without a
session. The access gate orders local work; it is not a security boundary.

## 8. Diagnóstico feeds facts

Diagnóstico captures facts that guides reuse as injected context
(`initialFacts` or equivalent). Fact origin is never silently mixed:
every persisted fact records where it came from.

## 9. Every result leads somewhere

Any protocol result leads to a next step when one exists: next activity,
next node, pending antecedent, or explicit continuity action. Dead ends
are not acceptable UX.

## 10. Fact conflicts are explicit

Facts from different sources are never silently reconciled:

* same source + later update → the source's latest observation wins;
* different sources + same value → agreement, fact resolved;
* different sources + different values → `fact_conflict` state.

Pending, unknown and conflicted are three different, distinguishable
states. Conflict is never converted into unknown or into false.

A conflict in a required fact blocks any definitive conclusion
(functionally equivalent to missing information, but visibly distinct).
Resolution requires an explicit human decision recording fact, chosen
value, moment and the alternatives that existed. A newer contradicting
observation reopens the conflict automatically.

## 11. No technical metadata in normal UI

Raw `rule_id`, `fact_key`, `node_key`, `activity_key` and internal enums
never appear in normal user views. Use the available human label; when
no reliable human translation exists, use a generic message. Technical
identifiers live in code, tests, development logs and non-visible
technical inspectors.
