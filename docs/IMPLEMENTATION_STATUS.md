# Implementation Status

Last controlled update: 2026-09-22

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

The detailed D01-D12 domain files have NOT yet been imported into this repository.

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
  validado; no constituye auth segura ni Stage 2);
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
* scalar capture primitives `text`/`date` (Stage 1: escalares vigentes,
  sin estructuras ni historial);
* D2.05 purpose-scoped con deterministic decision gap (sin materializar);
* scope infrastructure Company → TreatmentContext → TreatmentPurpose
  (scopes cerrados, addressing con ancestry, resolución scopeada,
  finalización de juicio scope-aware, referencias a tratamientos
  declaradas y validadas, export/import validado);
* capture gap pendiente (matrices como vista); D2.11/D2.12
  implementados sin historial ni instancias.

D3 continúa pendiente.

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

Canonical activity count:

`32`

Stage 1 canonical activities:

`32`

Guided protocols:

`20`

Protocol coverage:

`D1.01–D1.20 (todas las actividades D1)`

Pending canonical cross-domain targets:

* `risk.mpi_sync`
* `mpi.diffusion`
* `consent.mechanism_design`
* `sensitive.lawfulness_assess`
* `financial.titleIII_scope`

Still not implemented:

* guided protocols for D03–D12 activities;
* D03-D12;
* real characterization UI;
* backend persistent client context (local treatment/purpose workspace exists);
* state-effect engine;
* Stage 2 persistence;
* AI.

Next controlled iteration:

`Pending architectural review of guided execution pilot. Do not proceed without explicit instruction.`
