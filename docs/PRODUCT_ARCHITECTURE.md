# Product Architecture

Status: FROZEN FOR STAGE 1 FOUNDATION

## 1. Product Character

This is a professional daily-use work tool.

It is not:

- a marketing site;
- a blog;
- an online legal encyclopedia;
- a presentation deck;
- a generic checklist;
- a rigid questionnaire.

The user should feel that they are navigating an operational compliance system.

## 2. Primary Stage 1 Navigation

Stage 1 must eventually expose these primary areas in Spanish:

- Inicio
- Diagnóstico / Caracterización
- Mapa de cumplimiento
- Dominios
- Buscar
- Fuentes y estado normativo

The exact visual navigation component will be chosen during the UI implementation iteration.

Do not rename these information areas without explicit instruction.

## 3. Home

The Stage 1 home should provide fast access to:

- characterization;
- full map;
- domains;
- search;
- relevant regulatory notices.

Do not display fake client metrics.

Do not display fictional compliance percentages.

Stage 1 does not yet have enough persistent client execution data for those metrics.

## 4. Domain View

A domain view must eventually support:

- domain code;
- domain name;
- objective;
- concise orientation;
- activity list;
- filtering;
- cross-domain relationships;
- direct activity access.

Activities should normally appear as siblings.

Avoid decorative hierarchy that implies legal dependency where none exists.

## 5. Activity View

Activity View is a central reusable product surface.

The execution-oriented hierarchy should prioritize:

1. Nombre
2. Código humano
3. Objetivo
4. Cuándo aplica
5. Pregunta gatillo
6. Qué debe hacer el profesional
7. Pasos operacionales
8. Interlocutores
9. Métodos de levantamiento
10. Evidencia requerida
11. Entregable
12. Tiempo estimado
13. Complejidad
14. Fundamento legal
15. Dependencias
16. Resultado o efecto esperado
17. Estado regulatorio
18. Última revisión legal

Technical metadata must remain available but visually secondary.

## 6. Technical Traceability Surface

An activity must eventually expose or make inspectable:

- semantic activity key;
- activity type;
- applicable roles;
- applicability conditions;
- activity dependencies;
- reasoning-record requirement;
- state effects;
- relationship effects;
- evidence basis;
- regulatory status;
- last legal review.

Do not force ordinary users to understand internal field names in order to execute the activity.

## 7. Deep Linking

Every domain and activity must eventually have a stable direct route.

The route must:

- survive reload;
- be shareable;
- open without prior wizard state;
- use stable identifiers rather than mutable display labels.

Exact routing syntax is an implementation decision to be approved in the relevant iteration.

## 8. Map Mode

Map Mode provides free exploration.

It must allow a professional to understand:

- the twelve-domain landscape;
- activities within each domain;
- relevant relationships;
- legal and methodological provenance.

The map must not become an unreadable node graph by default.

Clarity is more important than visual novelty.

## 9. Guided Mode

Guided Mode consumes characterization facts.

It should eventually help classify activities as concepts such as:

- applicable;
- not applicable;
- unresolved;
- requiring professional assessment.

The exact executable applicability engine is not part of the foundation iteration.

Do not invent it before its dedicated design iteration.

## 10. Search

Search must eventually support finding activities by:

- visible name;
- code;
- semantic key;
- domain;
- legal concept;
- relevant metadata.

Search should be operational, not a decorative site-search box.

## 11. Regulatory Sources

The product must eventually provide a dedicated surface for:

- legal sources;
- article references;
- regulatory status;
- pending Agency materials;
- last legal review.

Source traceability must not be hidden in unstructured prose.

## 12. Stage 2 Compatibility

The product must preserve a conceptual separation between:

`ActivityDefinition`

and future:

`ClientActivityInstance`

Stage 2 may add a client-workspace layer around the existing definitions.

Definitions are universal.

Instances are contextual and historical.

## 13. Future Client Workspace

Not implemented in Stage 1 foundation.

Future capabilities include:

- client overview;
- treatment inventory;
- applicable roadmap;
- current activities;
- deadlines;
- evidence;
- artifacts;
- findings;
- corrective actions;
- incidents;
- regulatory cases;
- audit trail.

Do not fabricate Stage 2 screens during Stage 1 unless explicitly requested.

## 14. Document Intelligence Direction

A future work module should be able to reuse structured facts already collected to assist with generating artifacts such as:

- privacy policies;
- treatment inventories;
- lawfulness matrices;
- processor agreements;
- rights responses;
- EIPDs;
- breach reports;
- provider assessments;
- DPO reports;
- MPI evidence packages;
- audit reports.

Generated artifacts must remain reviewable by the professional.

Do not build autonomous unreviewed legal-document publication.

## 15. No Duplicate Content Models

Map Mode, Guided Mode, search and future client workspaces must consume shared canonical definitions.

Do not create separate copies of activity content per feature.
