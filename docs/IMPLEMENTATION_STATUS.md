# Implementation Status

Last controlled update: 2026-09-24 (D4.08–D4.09 guided batch, D4 CLOSED)

## Functional baseline

Status: FROZEN

Baseline version:

`Functional v1.0`

Completed outside the codebase:

- Block 0 — product architecture;
- Block 1 — legal master map;
- Block 2 — characterization model;
- Block 3 — DPO as a Service domains;
- Block 4 — punctual advisory phases;
- Block 5 — activities D1-D12;
- Block 6 — coverage and integrity review.

D01–D04 are imported (`content/domains/d01.ts`, `d02.ts`, `d03.ts`, `d04.ts`).

D05–D12 have NOT yet been imported into this repository.

Do not invent them.

## Repository implementation

Current iteration:

`UX Reset — guided company workflow`

Status:

`COMPLETED`

UX RESET está implementado:

* navegación principal Empresa / Trabajo / Diagnóstico / Buscar /
  Referencias (Trabajo reemplaza Mapa + Dominios; redirects conservan
  deep links antiguos);
* workspace local Stage 1 (perfiles y empresas creados por el usuario,
  progreso independiente por empresa, localStorage, export/import JSON
  validado; tratamientos con colecciones locales D2 más
  `automatedUses[]` D4.08/D4.09 con invariantes e import estricto;
  no constituye auth segura ni Stage 2);
* Activity View V2 en lenguaje humano (sin metadata técnica visible;
  auditoría colapsada; aplicabilidad humana; provenance única;
  vigencia global única);
* navegador sticky de contexto (dominios, actividades, nodos,
  anterior/siguiente);
* estados de trabajo not_started/in_review/reviewed/not_applicable/blocked
  (`Revisado` nunca significa `Cumple`);
* Diagnóstico alimenta facts reutilizables (initialFacts por empresa);
* siguiente revisión sugerida con información real.

D1/D2 permanecen canónicos (20 + 12 actividades, mismas keys, fuentes y
dependencias; sin cambios jurídicos).

D1 guided coverage real (reconciliado):

* 20/20 ExecutionProtocols (D1.01–D1.20), todos execution-ready;
* product-ready (10): D1.01, D1.03, D1.05, D1.06, D1.07, D1.09, D1.10,
  D1.11, D1.12, D1.18;
* execution-ready con gap (10): D1.02 (vía decision sin materializar),
  D1.04/D1.08 (bundles lifecycle/históricos), D1.13/D1.14 (instancia
  por período), D1.15 (entidad + fecha), D1.16 (periódico + fecha),
  D1.17 (append + temporal), D1.19 (ciclo temporal), D1.20
  (transición + condicional).

D1.03 usa juicio profesional documentado (sin deducción automática).

D2 real state:

* 12 ActivityDefinitions canónicas;
* 12 protocolos guiados (D2.01–D2.12), todos execution-ready;
* D2.06 con juicio purpose-scoped y efectos same-scope (product-ready);
* D2.10 con juicio treatment-scoped, referencia declarada a tratamiento
  posterior y efectos same-treatment (execution-ready; product-ready
  pendiente: el estado `not_required` determinístico no tiene vía de
  materialización en modo decision);
* D2.11 con juicio treatment-scoped y ramas mecánica/interpretativa
  (execution-ready; product-ready pendiente: rama mecánica sin
  materialización, misma familia del gap determinista);
* D2.12 procedure company-scope sin juicio (execution-ready;
  product-ready pendiente: `DYNAMIC_VALUE_EFFECT_GAP` para
  `last_revalidated_at`);
* D2 product-hardening backlog (consolidado D2 CLOSURE GATE; ninguno
  bloquea D3):
  * D2.01: systems/flows sin captura estructurada (revisión como
    evidencia documental); `treatment_inventory.status = established`
    sin materializar;
  * D2.02: `actor.role_history` (append) y `processor_relationship` sin
    mecanismo; `role_current` sin materializar;
  * D2.03/D2.04/D2.07/D2.08/D2.09: status canónicos sin vía de
    materialización treatment-scoped (`purposes = defined`,
    `source_traceability_status`, `minimization_status`,
    `retention_status`, `data_quality_status`);
  * D2.05, rama `not_required` D2.10, rama mecánica D2.11:
    `DETERMINISTIC_DECISION_FINALIZATION_GAP` (una sola capacidad
    común pendiente, separada del gap dinámico);
  * D2.12: `DYNAMIC_VALUE_EFFECT_GAP` (`last_revalidated_at`);
* scalar capture primitives `text`/`date` (Stage 1: escalares vigentes,
  sin estructuras ni historial);
* D2.05 purpose-scoped con deterministic decision gap (sin materializar);
* scope infrastructure Company → TreatmentContext → TreatmentPurpose
  (scopes cerrados, addressing con ancestry, resolución scopeada,
  finalización de juicio scope-aware, referencias a tratamientos
  declaradas y validadas, export/import validado);
* capture gap pendiente (matrices como vista); D2.11/D2.12
  implementados sin historial ni instancias.

D3 canonical content imported (6 ActivityDefinitions); D3.01–D3.06 guided, execution-ready y product-ready: D3 guided retrofit CLOSED.

Post-UX-Reset fix (explicit fact conflicts):

* `fact_conflict` como estado distinguible (nunca unknown ni false);
* resolución explícita del profesional con alternativas y momento;
* conflicto en fact requerido bloquea conclusión definitiva;
* nueva contradicción reabre el conflicto;
* IDs técnicos fuera de la UI normal (resultado sin `rule_id`);
* motor, D1/D2 y reglas D1.02 intactos.

Implemented:

* canonical D01 specification;
* D1 domain objective and description;
* 20 canonical D1 activities;
* D1 structured runtime definitions;
* D1 activity deep links;
* D1 search;
* canonical D1 sources;
* transitional regulatory status;
* D1 dependency presentation;
* progressive cross-domain pending-reference handling;
* D1 integrity tests.

Implemented adicionalmente:

* canonical D02 specification;
* 12 canonical D2 activities;
* treatment inventory;
* actor/role assessment;
* purpose definition;
* source traceability;
* lawful basis per purpose;
* legitimate-interest reasoning;
* minimization;
* retention;
* data quality;
* precontractual cleanup;
* treatment change review;
* inventory revalidation;
* D1 → D2 dependency resolution.

Implemented adicionalmente:

* ExecutionProtocol canonical layer;
* GuidanceNode model;
* deterministic decision rules;
* fact reuse architecture;
* protocol deep links;
* explainable outcomes;
* next-action links;
* D1.02 guided DPO assessment pilot.

Implemented adicionalmente (reconciliación):

* 20 protocolos guiados D1 con finalización explícita e idempotente;
* workspace local con treatments/purposes, resolución scopeada de
  conflictos y export/import validado;
* D1.03 juicio profesional con ReasoningRecord intacto.

Implemented adicionalmente (D3 canonical import):

* canonical D03 specification (`content/domains/d03.ts`);
* 6 canonical D3 activities (D3.01–D3.06: política, publicación,
  mecanismo de consentimiento, libertad, prueba, retiro);
* D2.05 → `consent.mechanism_design` (D3.03) resuelta; tipo
  `completion_dependency` y condición intactos;
* deterministic `docs/domains/D03.md` projection;
* D3.01 (`transparency.policy_assemble`, procedure, company) y
  D3.02 (`transparency.publication_validate`, checklist, company)
  con ExecutionProtocols execution-ready y efectos estáticos
  materializados por finalización explícita (`policy_status =
  assembled`, `publication_status = validated`); D3.02 exige D3.01
  para concluir (completion_dependency operativa vía fact externo),
  sin bloquear navegación ni revisión preliminar;
* D3.03 (`consent.mechanism_design`, procedure, purpose) con
  dependency gating operativo hacia D3.04/D3.05/D3.06 de la misma
  purpose (solo `mechanism_designed` materializa
  `consent.mechanism_status = designed`);
* D3.04 (`consent.freedom_assess`, decision, purpose) con juicio
  profesional (`finalizeProfessionalJudgment` purpose-scoped,
  presunción visible sin deducción automática);
* D3.05 (`consent.proof_design`, checklist, purpose) y D3.06
  (`consent.withdrawal_enable`, procedure, purpose) con effects
  estáticos same-purpose por finalización ADR-051;
* puente D2.05 → D3 read-only vía `lawful.consent_applies =
  consent_yes` (sin materializar `purpose.lawful_basis`, sin
  modificar D2.05);
* D3.03–D3.06 execution-ready y product-ready (verificados en
  runtime): D3 guided retrofit CLOSED (6/6 protocols).

Scoped procedure/checklist finalization available (ADR-051):
explicit finalization writes static `canonical_fact_effects` to
the addressed company/treatment/purpose context with ancestry
validation and intra-address conflicts only. No protocol becomes
product-ready by this capability alone; D2/D3 content effects
remain pending per-activity batches.

Canonical activity count:

`47`

Stage 1 canonical activities:

`47`

Guided protocols:

`47`

Protocol coverage:

`D1.01–D1.20 (todas las actividades D1), D2.01–D2.12 (todas las actividades D2), D3.01–D3.06 (todas las actividades D3), D4.01–D4.09 (D4.01–D4.07 company-scope; D4.08 decision + D4.09 checklist treatment-scope sobre automatedUses[] compartida)`

D4 canonical coverage:

`D4.01–D4.09 (9 ActivityDefinitions, 9 ExecutionProtocols; 9/9 execution-ready, 9/9 product-ready; D4 guided retrofit CLOSED)`

D3 canonical coverage:

`D3.01–D3.06 (6 ActivityDefinitions, 6 ExecutionProtocols: D3.01 procedure + D3.02 checklist company-scope; D3.03 procedure + D3.04 decision + D3.05 checklist + D3.06 procedure purpose-scope; 6/6 execution-ready, 6/6 product-ready)`

Pending canonical cross-domain targets:

* `risk.mpi_sync`
* `mpi.diffusion`
* `sensitive.lawfulness_assess`
* `financial.titleIII_scope`

Still not implemented:

* guided protocols for D05–D12 activities;
* D05-D12;
* real characterization UI;
* backend persistent client context (local treatment/purpose workspace exists);
* state-effect engine;
* Stage 2 persistence;
* AI.

Next controlled iteration:

`Pending architectural review of guided execution pilot. Do not proceed without explicit instruction.`
