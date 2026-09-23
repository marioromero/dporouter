import type { ExecutionProtocol } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.02.
 *
 * activity_key = treatment.actor_roles (decision, treatment scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D2.02.
 *
 * Source of truth: `actors[]` (el rol pertenece a cada actor). La
 * completitud estructural se consume como derived facts, nunca como
 * pregunta manual. La corrección jurídica de la clasificación se
 * adopta como juicio profesional documentado (ReasoningRecord
 * treatment-scoped, uno para el conjunto; el canon no exige uno por
 * actor). Estructura completa jamás equivale automáticamente a
 * clasificación validada.
 */

const DRAFT_FACT = "actor_roles.working_conclusion";

export const TREATMENT_ACTOR_ROLES_PROTOCOL: ExecutionProtocol = {
  protocol_key: "treatment.actor_roles.v1",
  activity_key: "treatment.actor_roles",
  version: 1,
  mode: "decision",
  execution_scope: "treatment",
  title: "Evaluación guiada de actores y roles",
  description:
    "Verifica que los actores estén clasificados y documenta si la clasificación jurídica es correcta: estructura primero, juicio después.",
  entry_node_key: "structural-gate",
  decision_fact_keys: [
    "derived.treatment.actors_exist",
    "derived.treatment.actors_roles_complete",
  ],
  external_fact_keys: [
    "derived.treatment.actors_exist",
    "derived.treatment.actors_roles_complete",
  ],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Completitud estructural",
      prompt:
        "El sistema verifica que existan actores y que todos tengan rol registrado.",
      answer_type: "none",
      required_facts: [
        "derived.treatment.actors_exist",
        "derived.treatment.actors_roles_complete",
      ],
      transitions: [
        {
          rule_id: "structural-missing",
          description:
            "Sin actores o con roles por definir no hay clasificación que evaluar.",
          when: {
            op: "any",
            conditions: [
              {
                op: "fact_equals",
                fact_key: "derived.treatment.actors_exist",
                value: "no",
              },
              {
                op: "fact_equals",
                fact_key: "derived.treatment.actors_roles_complete",
                value: "no",
              },
            ],
          },
          goto_outcome_key: "actors_incomplete",
          explanation:
            "Faltan actores o roles por registrar. Completa la estructura en el workspace antes de evaluar.",
        },
        {
          rule_id: "ready-for-conclusion",
          description:
            "Estructura completa: base mínima para el juicio profesional.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: "derived.treatment.actors_exist",
                value: "yes",
              },
              {
                op: "fact_equals",
                fact_key: "derived.treatment.actors_roles_complete",
                value: "yes",
              },
            ],
          },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Existe base mínima para que el profesional adopte una conclusión documentada.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "actors_incomplete",
          explanation:
            "La evaluación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      related_activity_keys: ["treatment.inventory_create"],
      provenance: "agency_standard",
    },
    {
      node_key: "adopt-conclusion",
      node_type: "question",
      title: "Adopción de la conclusión",
      prompt:
        "¿La clasificación jurídica de los actores es correcta según la evidencia revisada?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: el sistema solo verificó que existe base suficiente para concluir.",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "classification_sound",
          label: "Clasificación correcta",
          description:
            "Juicio profesional: cada actor está correctamente clasificado con su evidencia.",
          fact_effect: { fact_key: DRAFT_FACT, value: "classification_sound" },
        },
        {
          value: "remediation_needed",
          label: "Requiere corrección",
          description:
            "Juicio profesional: existe al menos una clasificación que corregir.",
          fact_effect: { fact_key: DRAFT_FACT, value: "remediation_needed" },
        },
      ],
      evidence_to_review: [
        "matriz de actores por tratamiento",
        "rol asignado a cada actor",
        "contratos o antecedentes revisados",
        "evidencia de clasificación",
      ],
      help_text: [
        "Selecciona la alternativa y documenta tu razonamiento a continuación. La conclusión solo queda registrada al adoptar con razonamiento válido.",
      ],
      required_facts: [
        "derived.treatment.actors_exist",
        "derived.treatment.actors_roles_complete",
      ],
    },
  ],
  outcomes: [
    {
      outcome_key: "actors_incomplete",
      label: "Actores por completar",
      classification: "agency_standard",
      explanation:
        "Faltan actores o roles por registrar. La corrección jurídica solo puede evaluarse sobre estructura completa.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar actores en Tratamientos",
          note: "Agrega los actores del tratamiento y define el rol de cada uno en la sección Tratamientos de la empresa.",
        },
      ],
    },
    {
      outcome_key: "classification_sound",
      label: "Clasificación correcta",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la clasificación de actores es correcta para este tratamiento.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la matriz de clasificación",
          note: "Archiva la matriz de actores por tratamiento con roles, contratos revisados y evidencia de clasificación.",
        },
      ],
    },
    {
      outcome_key: "remediation_needed",
      label: "Clasificación por corregir",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: existe al menos una clasificación que corregir antes de dar por establecido el mapa de actores.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir y reevaluar",
          note: "Corrige cada clasificación observada en el workspace y vuelve a adoptar conclusión con su razonamiento.",
        },
      ],
    },
  ],
  reasoning_requirements: {
    // Sin nodos de consideración (la base es estructural derivada):
    // el registro exige conclusión, pregunta, hechos, razonamiento,
    // autoría, fecha, fundamento y evidencia; no factores ni
    // alternativas automáticas.
    required_fields: [
      "conclusion",
      "legal_question",
      "facts_considered",
      "rationale",
      "decided_by",
      "decided_at",
      "legal_basis",
      "evidence_refs",
    ],
  },
};
