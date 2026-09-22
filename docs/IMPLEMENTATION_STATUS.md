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

D1.02 sigue siendo el único protocolo completo por ahora.

D3 continúa pendiente.

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

Canonical activity count:

`32`

Stage 1 canonical activities:

`32`

Guided protocols:

`1`

Protocol coverage:

`D1.02 only`

Pending canonical cross-domain targets:

* `risk.mpi_sync`
* `mpi.diffusion`
* `consent.mechanism_design`
* `sensitive.lawfulness_assess`
* `financial.titleIII_scope`

Still not implemented:

* protocols for remaining activities;
* D03-D12;
* real characterization UI;
* persistent client context;
* state-effect engine;
* Stage 2 persistence;
* AI.

Next controlled iteration:

`Pending architectural review of guided execution pilot. Do not proceed without explicit instruction.`
