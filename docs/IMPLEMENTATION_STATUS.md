# Implementation Status

Last controlled update: 2026-10-21 (handoff and documentation sync; advisor access, glossary and section tones recorded; e2e declared stale)

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

D01–D06 are imported (`content/domains/d01.ts`, `d02.ts`, `d03.ts`, `d04.ts`, `d05.ts`, `d06.ts`).

D07–D12 have NOT yet been imported into this repository.

Do not invent them.

## Repository implementation

Current iteration:

`Handoff and documentation sync`

Status:

`COMPLETED (documentation only; no runtime change)`

UX RESET está implementado:

* navegación principal Empresa / Trabajo / Diagnóstico / Buscar /
  Glosario / Referencias (Trabajo reemplaza Mapa + Dominios; redirects
  conservan deep links antiguos);
* acceso asesor local con nómina fija (`pablo`, `carlos`, `mario`),
  `CompanyState.ownerId`, empresas por `companyIds` y `RequireCompany`
  bloqueando Trabajo/Diagnóstico/Actividad/Guías sin sesión o empresa;
  acceso demostrativo, no autenticación real ni Stage 2 (ADR-055);
* workspace local Stage 1 (empresas creadas por el usuario, progreso
  independiente por empresa, localStorage, export/import JSON validado;
  tratamientos con colecciones locales D2 más `automatedUses[]`
  D4.08/D4.09 con invariantes e import estricto; no constituye auth
  segura ni Stage 2);
* Activity View V2 en lenguaje humano (sin metadata técnica visible;
  auditoría colapsada; aplicabilidad humana; provenance única;
  vigencia global única);
* navegador sticky de contexto (dominios, actividades, nodos,
  anterior/siguiente);
* estados de trabajo not_started/in_review/reviewed/not_applicable/blocked
  (`Revisado` nunca significa `Cumple`);
* Diagnóstico alimenta facts reutilizables (initialFacts por empresa);
* siguiente revisión sugerida con información real;
* Glosario con búsqueda y flotante de consulta, sin claves técnicas;
* tonos visuales por sección en la ficha de actividad (solo presentación).

Deuda declarada: la suite `e2e/` quedó obsoleta tras el acceso asesor (helpers
con perfiles libres y navegación directa sin sesión/empresa). El gate confiable
es la suite unitaria más build y `content:check`. Ver `docs/KNOWN_ISSUES.md`.

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

`61`

Stage 1 canonical activities:

`61`

Guided protocols:

`54`

Protocol coverage:

`D1.01–D1.20 (todas las actividades D1), D2.01–D2.12 (todas las actividades D2), D3.01–D3.06 (todas las actividades D3), D4.01–D4.09 (D4.01–D4.07 company-scope; D4.08 decision + D4.09 checklist treatment-scope sobre automatedUses[] compartida). D5.01–D5.07 con ExecutionProtocols (D5.01–D5.05 + D5.07 decision con juicio y guards; D5.06 checklist sin reasoning; D5 guided retrofit CLOSED)`

D4 canonical coverage:

`D4.01–D4.09 (9 ActivityDefinitions, 9 ExecutionProtocols; 9/9 execution-ready, 9/9 product-ready; D4 guided retrofit CLOSED)`

D3 canonical coverage:

`D3.01–D3.06 (6 ActivityDefinitions, 6 ExecutionProtocols: D3.01 procedure + D3.02 checklist company-scope; D3.03 procedure + D3.04 decision + D3.05 checklist + D3.06 procedure purpose-scope; 6/6 execution-ready, 6/6 product-ready)`

D5 canonical coverage:

`D5.01–D5.07 (7 ActivityDefinitions, 0 ExecutionProtocols; canon importado, guided retrofit pendiente)`

D5.01–D5.07 son `assessment` purpose-scoped (la finalidad activa es la unidad jurídica principal), `applicable_role = responsible`, `evidence_basis = agency_standard`, `relationship_effect = []`, `conditions_applicability = []` (aplicabilidad conceptual en trigger/objetivo/pasos; sin taxonomía machine-readable), sin dependencias propias. Reasoning requerido en D5.01–D5.05 y D5.07; D5.06 sin juicio (verifica requisitos adicionales sin redefinir licitud D2). D5.01 (`sensitive.lawfulness_assess`) y D5.07 (`financial.titleIII_scope`) resuelven las dos pending references de D2.05 por existencia de los keys canónicos; D2.05 intacto. Frontera Stage 1: D5 evalúa el tratamiento, no almacena datos personales especiales reales (sin registros por titular, sin casos individuales, sin temporizadores operacionales). Captura estructurada de categorías/regímenes diferida a auditoría específica (`D5 SPECIAL-REGIME CAPTURE AUDIT`); `DataItemRecord.category` intacto.

D5 Punto 0 capture infrastructure (ADR-053; canon D5 intacto, sin protocolos nuevos):

* `DataItemRecord` con cuatro señales estructurales tri-estado (`sensitive`, `health`, `biologicalProfile`, `geolocation`; nuevos default `unknown`; legacy ausente = `unknown`; sin inferencias entre señales; sin escrituras canónicas por edición);
* `PurposeScopedState.specialRegimeProfile?` (`biometricIdentificationUse`, `involvesMinors`, `researchPublicInterestCandidate`; ausente = todo `unknown`; sin IDs/entidad/lifecycle);
* siete candidaturas derivadas `derived.purpose.d5_*_candidate` (read-only, no persistidas; ausencia = `unknown`; links vivos como única fuente de contexto; puente D5.07 solo sobre truth D2.05 existente sin materializar `purpose.lawful_basis`);
* validadores de coherencia puros no mutantes (`health_sensitive_mismatch`, `biological_sensitive_mismatch`, `biometric_context_mismatch`; advierten, nunca corrigen ni alteran candidaturas);
* refs de razonamiento `data_item:<id>` para futuro uso en `ReasoningRecord.facts_considered[]`;
* validación/import estricta (enum inválido rechaza; sospechoso enum-válido se preserva; legacy válido; derivados/warnings fuera del JSON).

D5.01–D5.03 guided batch (decision, purpose, con juicio profesional):

* D5.01 (`sensitive.lawfulness_assess`), D5.02 (`sensitive.health_biological_assess`) y D5.03 (`sensitive.biometric_assess`) con ExecutionProtocols execution-ready y product-ready (candidatura derivada como routing, cobertura estructural completa, rutas art. 16/16 bis fieles al canon, cautelas propias —ley sanitaria, prohibición especial, cuatro elementos de información—, refs `data_item:<id>`, staleness contra current state, finalización addressed purpose-scoped);
* UI estructural mínima: clasificación de datos (Sí/No/Por determinar), perfil de finalidad, advertencias de coherencia y estado estructural en guía; sin claves técnicas;
* finalización addressed obligatoria en guías D5 (la selección tardía avisa y bloquea); resto de dominios conserva camino histórico.

Readiness D5 actual: canonical 7, protocols 3, execution-ready 3, product-ready 3; pendientes D5.04–D5.07. Canonical total 54, protocols total 50, pending refs 2.

D5.04–D5.07 guided batch (D5 CLOSED):

* D5.04 (`minors.processing_assess`, decision purpose con juicio): candidatura por perfil, precondiciones (≥1 link, sensitive clasificado), población abstracta en tres answers (niños/adolescentes/<16 sensibles, sin datos reales), subregla <16 exigible solo con sensitive=yes, refs sensibles + snapshots de población para staleness;
* D5.05 (`research.public_interest_assess`, decision purpose con juicio): exclusividad e interés público por gate, rama de riesgo solo con sensibles, publicación con anonimización (unknown bloquea favorable), refs sensibles;
* D5.06 (`geolocation.requirements_assess`, checklist purpose sin reasoning): contexto D2 consumido read-only (vía art. 12/13 evaluada; sin vía → incomplete + next a D2.05), cuatro elementos informativos, rama de terceros separada (unknown → incomplete, nunca remediación), finalización scope-aware existente e idempotente;
* D5.07 (`financial.titleIII_scope`, decision purpose con juicio): bridge D2 sin modificarlo, refs = todos los vinculados, ámbito/requisitos en answers con snapshots, tres outcomes definitivos con effects exactos (out/in+satisfied/in+remediation), combinaciones imposibles bloqueadas, out_of_scope sin escritura a D2;
* guards D5 por dispatch estructural (sin literales): cobertura, refs, cautelas propias, snapshots `answer:<fact>=<value>`, conclusiones definitivas;
* UI: estado estructural extendido a los 7 regímenes + contexto estructural en guías D5 (datos vinculados, candidaturas, advertencias; sin claves).

Readiness D5 final: canonical 7, protocols 7, execution-ready 7, product-ready 7 (`D5 guided retrofit CLOSED`). Canonical total 54, protocols total 54, pending refs 2 (`risk.mpi_sync`, `mpi.diffusion`).

D6 canonical coverage:

`D6.01–D6.07 (7 ActivityDefinitions, 0 ExecutionProtocols; canon importado, guided retrofit pendiente)`

D6.01 (`third_party.relationship_map`, assessment, con juicio) y D6.02 (`cession.lawfulness_assess`, assessment, con juicio) requieren ReasoningRecord; D6.03–D6.07 (`cession.instrument_validate`, `processor.contract_validate`, `processor.instruction_controls_validate`, `subprocessor.authorization_validate`, `processor.security_exit_validate`) son `implementation` sin juicio. Las 7 con `applicable_role = responsible`, `evidence_basis = agency_standard`, `relationship_effect = []`, `conditions_applicability = []` (aplicabilidad conceptual en trigger/objetivo/pasos; sin taxonomía machine-readable hasta el capture audit). Scopes conceptuales: D6.01 treatment, D6.02 purpose, D6.03 purpose, D6.04–D6.07 treatment (sin scope de tercero, sin `ThirdPartyContext`, sin modificar `ActorRecord`). Única dependencia: D6.03 → D6.02 (`completion_dependency`); D2.02 es contexto relacionado, no dependencia. Fronteras congeladas: Stage 1 sin eventos/transacciones/historiales; D6 solo identifica dimensión internacional (licitud en D7, sin dependencia D6→D7); D2.09 es source-of-truth de calidad (D6.03 sin fact propio); D6.07 complementa sin sustituir D9 (sin facts D9). D1–D5 intactos. D6 no resuelve pending refs (siguen 2).

Readiness D6: canonical 7, protocols 0, execution-ready 0, product-ready 0 (`D6 canonical content imported; guided retrofit pending`). Canonical total 61, protocols total 54, pending refs 2 (`risk.mpi_sync`, `mpi.diffusion`).

D6 Punto 0 capture infrastructure (ADR-054; canon D6 intact, sin protocolos nuevos):

* `TreatmentScopedState.thirdPartyRelationships?`: colección local treatment-owned compartida por D6.01–D6.07; un record por relación con `relationshipType` único (`unknown|communication|cession|processor|subprocessor`); mismo actor con N relaciones = N records; `actorId` referencia `ActorRecord` sin tocarlo (rol D2 jamás se escribe automáticamente); `purposeIds[]`/`dataItemIds[]` same-treatment dedupe estricto (vacío = draft, nunca negativo); `internationalDimension` tri-estado solo routing D7 (sin licitud, sin efectos D6/D7); `parentRelationshipId` exclusivo de `subprocessor`, sin self/ciclos, ausente = draft incompleto para D6.06; assessments locales subordinadas (`cessionAssessment`, `processorAssessment`, `subprocessorAssessment`) con invariante tipo↔assessment y normalización atómica al cambiar tipo (sin conversión de resultados); edición/creación/borrado no escribe canonical facts, answers, reasoning ni effects.
* Borrado: actor referenciado → delete rechazado (sin cascade ni strip); relationship con hijos → reject; delete purpose/dataItem → strip de refs preservando records. Import estricto todo-o-nada (dup IDs, refs colgadas/cruzadas, self-parent, ciclos, enums inválidos, incompatibilidades rechazan; legacy ausente válido; roles nunca migrados).
* Tokens `third_party_relationship:<id>` exactos en `facts_considered[]` (helpers format/extract/unknown/considered); rationale/evidence nunca se parsean; futuro D6.01 = un record treatment-scoped contra todas las relaciones; futuro D6.02 = record purpose-scoped contra todas las cesiones de la purpose; execution sigue treatment/purpose (sin selector-as-context, sin protocolo por relación).
* Derived read-only: 23 claves `derived.treatment.d6_*` (existencia, completitud estructural del mapa —vacío≠completo—, unknowns, internacional, agregados contract/instructions/operational/authorization y padres) + 11 claves `derived.purpose.d6_*` (cesiones relevantes por purpose, dimensiones lawfulness/instrument independientes y la precisión D6.03 congelada: ready-positive solo con todo supported+todo validated; `blocked_by_lawfulness` con instrumentos validados y licitud fallida —nunca remediation por eso—; unknown = incomplete). Ningún derived persiste ni concluye legalidad.
* Readiness sin inflación: canonical total 61, protocols total 54, pending refs 2; D6 sigue canonical 7 / protocols 0 / execution-ready 0 / product-ready 0. Sin cuarto scope, sin `ThirdPartyContext`, sin eventos/historial/workflow, sin UI nueva.

Pending canonical cross-domain targets:

* `risk.mpi_sync`
* `mpi.diffusion`

Still not implemented:

* guided protocols for D6–D12 activities;
* D07-D12;
* real characterization UI;
* backend persistent client context (local treatment/purpose workspace exists);
* state-effect engine;
* Stage 2 persistence;
* AI.

Documentation and onboarding assets:

* `HANDOFF.md` (entrada corta de contexto), `README.md` actualizado;
* `docs/USER_GUIDE.md` (uso nivel asesor), `docs/SITE_MAP.md` (rutas y gates);
* `docs/KNOWN_ISSUES.md` (deuda verificable, incluido e2e obsoleto);
* contratos: `DATA_CONTRACTS.md` §49, ADR-055, arquitectura §2/§3, UX
  contract §7 y principios de navegación sincronizados con el acceso asesor.

Next controlled iteration (not started):

`(a) e2e realignment after advisor access; (b) D6 guided retrofit (D6.01-D6.07). Do not proceed without explicit instruction.`
