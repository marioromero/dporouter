import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.03.
 *
 * activity_key = treatment.purpose_define (procedure, treatment
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, legal basis, dependencias y
 * aplicabilidad del contenido canónico D2.03.
 *
 * Source of truth: `TreatmentPurpose` (crear/editar/eliminar) más los
 * derived `purposes_exist` y `purposes_described_complete`. Crear una
 * finalidad no la hace específica, explícita ni adecuada: esos checks
 * son juicio profesional manual. El canon no exige evaluación
 * persistente por purpose, así que no existe gap de estado
 * profesional por hijo (no hay PURPOSE_LEVEL_PROFESSIONAL_STATE_GAP).
 */

const DERIVED = [
  "derived.treatment.purposes_exist",
  "derived.treatment.purposes_described_complete",
];

const MANUAL = [
  "purposes.specific_explicit",
  "purposes.data_related",
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

export const TREATMENT_PURPOSE_DEFINE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "treatment.purpose_define.v1",
  activity_key: "treatment.purpose_define",
  version: 1,
  mode: "procedure",
  execution_scope: "treatment",
  title: "Procedimiento guiado de definición de finalidades",
  description:
    "Verifica que las finalidades del tratamiento existan, estén descritas y respondan a propósitos específicos y explícitos relacionados con los datos.",
  entry_node_key: "verify-specificity",
  decision_fact_keys: [...MANUAL],
  external_fact_keys: [...DERIVED],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "verify-specificity",
      node_type: "question",
      title: "Especificidad y explicitud",
      prompt:
        "¿Responde cada uso a una finalidad específica y explícita, separadas cuando son materialmente distintas y sin formulaciones genéricas?",
      why_it_matters:
        "Sin especificidad no es posible evaluar necesidad ni licitud de cada finalidad.",
      fact_key: "purposes.specific_explicit",
      answer_type: "single_select",
      options: stateOptions("purposes.specific_explicit"),
      evidence_to_review: [
        "registro de finalidades por tratamiento",
        "evidencia del proceso que origina cada finalidad",
      ],
      required_facts: [],
      default_next_node_key: "verify-data-relation",
      provenance: "legal_requirement",
    },
    {
      node_key: "verify-data-relation",
      node_type: "question",
      title: "Relación finalidad-datos",
      prompt:
        "¿Quedó relacionada cada finalidad con las categorías de datos utilizadas?",
      why_it_matters:
        "Sin relación finalidad-datos no es posible juzgar minimización ni licitud posterior.",
      fact_key: "purposes.data_related",
      answer_type: "single_select",
      options: stateOptions("purposes.data_related"),
      evidence_to_review: ["relación finalidad-datos"],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de finalidades",
      prompt:
        "El sistema verifica el estado estructural y los checks profesionales.",
      answer_type: "none",
      required_facts: [...DERIVED, ...MANUAL],
      transitions: [
        {
          rule_id: "structural-missing",
          description:
            "Sin finalidades descritas no hay qué evaluar jurídicamente.",
          when: { op: "any", conditions: DERIVED.map(derivedNo) },
          goto_outcome_key: "purposes_incomplete",
          explanation:
            "Faltan finalidades o descripciones. Regístralas en el workspace antes de evaluar.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Algún check profesional está pendiente o sin información.",
          when: { op: "any", conditions: MANUAL.map(unresolved) },
          goto_outcome_key: "purposes_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. Las finalidades aún no quedan definidas.",
        },
        {
          rule_id: "all-verified",
          description:
            "Estructura descrita y checks profesionales verificados.",
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
          goto_outcome_key: "purposes_defined",
          explanation:
            "Todas las verificaciones están realizadas y respaldadas para este tratamiento.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "purposes_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "purposes_defined",
      label: "Finalidades definidas y fundadas",
      classification: "legal_requirement",
      explanation:
        "Las finalidades existen, están descritas y responden a propósitos específicos y explícitos relacionados con los datos.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la matriz de finalidades",
          note: "Archiva el registro de finalidades por tratamiento con su evidencia de origen y la relación finalidad-datos.",
        },
      ],
    },
    {
      outcome_key: "purposes_incomplete",
      label: "Finalidades por registrar",
      classification: "agency_standard",
      explanation:
        "Faltan finalidades o descripciones. La evaluación jurídica requiere objetos sobre los cuales pronunciarse.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Registrar finalidades en Tratamientos",
          note: "Agrega cada finalidad con su descripción en la sección Tratamientos de la empresa.",
        },
      ],
    },
    {
      outcome_key: "purposes_in_progress",
      label: "Definición en curso",
      classification: "agency_standard",
      explanation:
        "Quedan checks profesionales pendientes o sin información. Completa cada punto y conserva su evidencia.",
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
