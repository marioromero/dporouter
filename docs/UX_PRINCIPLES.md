# UX Principles

Status: FROZEN FOR STAGE 1 FOUNDATION

## 1. Audience

Primary users are privacy professionals performing real advisory work.

The interface should optimize for repeated professional use.

It should not optimize for marketing conversion.

## 2. Language

User-facing product language is Spanish.

Technical identifiers may remain English internally.

Do not expose implementation terminology unnecessarily.

## 3. Visual Character

The product should feel:

- professional;
- sober;
- modern;
- precise;
- trustworthy;
- operational;
- information-dense without becoming noisy.

Avoid:

- playful consumer-app styling;
- landing-page aesthetics;
- oversized marketing hero sections;
- decorative gradients;
- gratuitous animation;
- excessive card grids;
- visual effects that compete with information.

## 4. Primary Platform

Optimize first for daily desktop use.

Tablet must remain comfortably usable.

Mobile support may be considered later but must not distort desktop information architecture during Stage 1.

## 5. Orientation

The user should always understand:

- where they are;
- which domain they are in;
- which activity they are reading;
- how to return;
- whether they are in Map Mode or Guided Mode.

Do not rely solely on browser back navigation.

## 6. Information Hierarchy

Execution information has priority over metadata.

For an activity, answer the operational questions before exposing technical metadata:

- ¿Qué tengo que hacer?
- ¿Por qué me aplica?
- ¿Qué tengo que revisar?
- ¿Con quién?
- ¿Cómo?
- ¿Qué evidencia necesito?
- ¿Qué entregable debo producir?
- ¿Qué ocurre después?
- ¿Cuál es el fundamento?

Technical traceability must remain available without dominating the first visual layer.

## 7. Provenance

The user must be able to visually distinguish:

- Obligación legal
- Estándar metodológico
- Pendiente de regulación u orientación

Do not communicate these only through color.

Use text labels and accessible visual treatment.

## 8. Unknown State

Unknown or unresolved information must have an explicit visual state.

Never display unknown as if the answer were negative.

## 9. Complexity Without Noise

The legal model is inherently complex.

Do not hide important distinctions merely to achieve visual minimalism.

Simplify presentation, not meaning.

Progressive disclosure is preferred over deletion of information.

## 10. Activity Lists

Activity lists should support scanning.

Users should be able to distinguish at a glance, when data exists:

- activity name;
- human code;
- type;
- relevance/applicability state;
- provenance;
- notable regulatory status.

Do not show every metadata field in every row.

## 11. Navigation

The primary information architecture includes:

- Inicio
- Empresa (acceso asesor y empresas)
- Trabajo (ámbitos operativos D1-D12; reúne mapa y dominios)
- Diagnóstico / Caracterización
- Buscar
- Glosario
- Referencias (origen y estado normativo)

Navigation must remain predictable across pages. Work areas require an active
advisor and a selected company; reference areas remain readable without a
session.

## 12. Map Mode

Map Mode is for free exploration.

Do not force the user to answer diagnostic questions before accessing canonical content.

## 13. Guided Mode

Guided Mode assists prioritization.

It must tolerate incomplete characterization.

Do not force a strict sequence when the underlying facts can be captured independently.

## 14. Deep Links

Direct activity links are first-class product behavior.

Opening a deep link should still provide sufficient context to understand:

- domain;
- location;
- related navigation.

## 15. Regulatory Warnings

Regulatory warnings must be visible when relevant but must not create permanent alert fatigue.

Differentiate:

- current obligation;
- unresolved applicability;
- pending official guidance;
- regulatory change requiring review.

## 16. Empty States

Do not invent example metrics or fictional compliance data to fill empty areas.

Use honest empty states describing what becomes available later.

## 17. Stage 2 Boundary

Do not display Stage 2 controls as if they were functional during Stage 1.

If future capabilities need architectural preparation, prepare the underlying design without showing fake operational UI.

## 18. Accessibility

Do not rely exclusively on:

- color;
- hover;
- tiny icons.

Maintain:

- sufficient contrast;
- keyboard-aware interaction where relevant;
- visible focus;
- readable typography;
- clear interactive states.

## 19. Performance Perception

Navigation among canonical content should feel immediate.

Avoid architecture that requires unnecessary server operations for static definition browsing.

Technical implementation will be chosen later.

## 20. Design Review Standard

A visually attractive result is not sufficient.

A Stage 1 view succeeds when a professional can:

1. identify where they are;
2. understand what applies;
3. understand what to do;
4. understand the source;
5. move to the next relevant information without confusion.
