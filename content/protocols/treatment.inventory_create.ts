import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.01.
 *
 * activity_key = treatment.inventory_create (procedure, treatment
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, legal basis, dependencias y
 * aplicabilidad del contenido canónico D2.01.
 *
 * Las condiciones objetivas (actores, finalidades, datos, fuentes,
 * identificación) se consumen como derived facts: ninguna pregunta
 * manual las duplica. Solo verifican criterio profesional la
 * identificación de procesos, las relaciones conocidas y la
 * trazabilidad con evidencias. Crear el TreatmentContext no completa
 * esta actividad. Systems/flows: gap explícito sin storage aprobado;
 * se revisan como evidencia documental, sin fingir captura.
 */

const DERIVED = [
  "derived.treatment.identified",
  "derived.treatment.actors_exist",
  "derived.treatment.purposes_exist",
  "derived.treatment.data_items_exist",
  "derived.treatment.sources_exist",
];

const MANUAL = [
  "inventory.processes_identified",
  "inventory.relations_reviewed",
  "inventory.traceability_assured",
];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function derivedNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function stateOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "Realizado y respaldado con evidencia.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "Aún no realizado o sin evidencia suficiente.",
      fact_effect: { fact_key: factKey, value: "no" },
    },
    {
      value: "unknown",
      label: "Sin información",
      description: "No es posible determinarlo con respaldo disponible.",
      fact_effect: { fact_key: factKey, value: "unknown" },
    },
  ];
}

export const TREATMENT_INVENTORY_CREATE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "treatment.inventory_create.v1",
  activity_key: "treatment.inventory_create",
  version: 1,
  mode: "procedure",
  execution_scope: "treatment",
  title: "Procedimiento guiado del inventario del tratamiento",
  description:
    "Verifica que el tratamiento quede identificado y levantado con sus elementos conocidos y trazabilidad: procesos, identidad, relaciones y evidencias.",
  entry_node_key: "identify-processes",
  decision_fact_keys: [...MANUAL],
  external_fact_keys: [...DERIVED],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "identify-processes",
      node_type: "question",
      title: "Procesos de negocio",
      prompt:
        "¿Quedaron identificados los procesos de negocio que implican tratamiento de datos personales?",
      why_it_matters:
        "Sin procesos identificados no es posible delimitar qué operaciones levantar.",
      fact_key: "inventory.processes_identified",
      answer_type: "single_select",
      options: stateOptions("inventory.processes_identified"),
      evidence_to_review: [
        "relación de procesos y sistemas revisados",
        "evidencia de levantamiento",
      ],
      required_facts: [],
      default_next_node_key: "review-relations",
      provenance: "agency_standard",
    },
    {
      node_key: "review-relations",
      node_type: "question",
      title: "Elementos relacionados",
      prompt:
        "¿Quedaron relacionados los titulares, categorías, actores, sistemas, fuentes y flujos conocidos?",
      why_it_matters:
        "Sin relaciones el inventario queda como lista suelta sin trazabilidad operativa.",
      fact_key: "inventory.relations_reviewed",
      answer_type: "single_select",
      options: stateOptions("inventory.relations_reviewed"),
      evidence_to_review: [
        "inventario maestro de tratamientos",
        "evidencia de levantamiento",
      ],
      help_text: [
        "Sistemas y flujos se revisan como evidencia documental: aún no tienen captura estructurada.",
      ],
      required_facts: [],
      default_next_node_key: "assure-traceability",
      provenance: "agency_standard",
    },
    {
      node_key: "assure-traceability",
      node_type: "question",
      title: "Trazabilidad con evidencias",
      prompt:
        "¿Quedó asegurada la trazabilidad entre el inventario y las evidencias utilizadas?",
      why_it_matters:
        "Sin trazabilidad el levantamiento no es auditable ni mantenible.",
      fact_key: "inventory.traceability_assured",
      answer_type: "single_select",
      options: stateOptions("inventory.traceability_assured"),
      evidence_to_review: [
        "evidencia de levantamiento",
        "identificadores estables de tratamientos",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del levantamiento",
      prompt:
        "El sistema verifica el estado estructural y las verificaciones profesionales.",
      answer_type: "none",
      required_facts: [...DERIVED, ...MANUAL],
      transitions: [
        {
          rule_id: "structural-missing",
          description:
            "Faltan elementos estructurales: el tratamiento sigue sin levantar.",
          when: { op: "any", conditions: DERIVED.map(derivedNo) },
          goto_outcome_key: "inventory_incomplete",
          explanation:
            "Faltan actores, finalidades, datos, fuentes o identificación. Completa cada elemento en el workspace.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación profesional está pendiente o sin información.",
          when: { op: "any", conditions: MANUAL.map(unresolved) },
          goto_outcome_key: "inventory_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El levantamiento aún no queda verificado.",
        },
        {
          rule_id: "all-verified",
          description:
            "Estructura completa y verificaciones profesionales realizadas.",
          when: {
            op: "all",
            conditions: [
              ...DERIVED.map((f) => ({
                op: "fact_equals",
                fact_key: f,
                value: "yes",
              }) as FactCondition),
              ...MANUAL.map(isDone),
            ],
          },
          goto_outcome_key: "inventory_complete",
          explanation:
            "Todas las verificaciones están realizadas y respaldadas para este tratamiento.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "inventory_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "inventory_complete",
      label: "Tratamiento levantado y verificado",
      classification: "agency_standard",
      explanation:
        "El tratamiento está identificado, con actores, finalidades, datos y fuentes, y el levantamiento verificado con trazabilidad.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Identificar actores y roles en D2.02",
          activity_key: "treatment.actor_roles",
        },
        {
          kind: "info",
          label: "Conservar el expediente de levantamiento",
          note: "Archiva la relación de procesos y sistemas revisados, la evidencia de levantamiento y los identificadores estables.",
        },
      ],
    },
    {
      outcome_key: "inventory_incomplete",
      label: "Estructura por completar",
      classification: "agency_standard",
      explanation:
        "Faltan elementos estructurales del tratamiento. Complétalos en el workspace antes de verificar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar estructuras en Tratamientos",
          note: "Agrega actores, finalidades, datos, fuentes y el identificador canónico en la sección Tratamientos de la empresa.",
        },
      ],
    },
    {
      outcome_key: "inventory_in_progress",
      label: "Levantamiento en curso",
      classification: "agency_standard",
      explanation:
        "Quedan verificaciones profesionales pendientes o sin información. Completa cada punto y conserva su evidencia.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
  ],
};
