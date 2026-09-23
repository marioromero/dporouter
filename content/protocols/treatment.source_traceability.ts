import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.04.
 *
 * activity_key = treatment.source_traceability (procedure, treatment
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, legal basis, dependencias y
 * aplicabilidad del contenido canónico D2.04.
 *
 * Source of truth: `dataItems`, `sources` y `sourceRefs`. La
 * existencia de datos y fuentes se consume como derived; la cobertura
 * por categoría es condicional según canon ("cuando resulte
 * necesario") y por eso NO se exige universalidad: solo juicio
 * profesional la determina.
 */

const DERIVED = [
  "derived.treatment.data_items_exist",
  "derived.treatment.sources_exist",
];

const MANUAL = [
  "traceability.sources_identified",
  "traceability.category_covered",
  "traceability.evidence_kept",
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

export const TREATMENT_SOURCE_TRACEABILITY_PROTOCOL: ExecutionProtocol = {
  protocol_key: "treatment.source_traceability.v1",
  activity_key: "treatment.source_traceability",
  version: 1,
  mode: "procedure",
  execution_scope: "treatment",
  title: "Procedimiento guiado de trazabilidad de origen",
  description:
    "Verifica que el origen de los datos esté identificado, que la cobertura por categoría corresponda cuando sea necesaria y que la procedencia quede acreditada.",
  entry_node_key: "identify-sources",
  decision_fact_keys: [...MANUAL],
  external_fact_keys: [...DERIVED],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "identify-sources",
      node_type: "question",
      title: "Origen identificado",
      prompt:
        "¿Quedó identificado si los datos provienen del titular, de otra organización, de fuentes públicas u otra fuente, con uso lícito verificado?",
      why_it_matters:
        "Sin origen identificado no es posible acreditar la procedencia ni la licitud de uso.",
      fact_key: "traceability.sources_identified",
      answer_type: "single_select",
      options: stateOptions("traceability.sources_identified"),
      evidence_to_review: [
        "registro de fuentes por tratamiento",
        "evidencia de procedencia",
      ],
      required_facts: [],
      default_next_node_key: "cover-categories",
      related_activity_keys: ["treatment.inventory_create"],
      provenance: "legal_requirement",
    },
    {
      node_key: "cover-categories",
      node_type: "question",
      title: "Cobertura por categoría y fuentes públicas",
      prompt:
        "¿La fuente por categoría corresponde cuando resulta necesaria y quedaron identificadas las fuentes de acceso público?",
      why_it_matters:
        "La cobertura por categoría solo se exige cuando resulta necesaria; las fuentes públicas siempre deben quedar expresas.",
      fact_key: "traceability.category_covered",
      answer_type: "single_select",
      options: stateOptions("traceability.category_covered"),
      evidence_to_review: [
        "registro de fuentes por tratamiento",
        "identificación de fuentes de acceso público cuando corresponda",
        "integraciones o terceros de origen identificados",
      ],
      required_facts: [],
      default_next_node_key: "keep-evidence",
      provenance: "legal_requirement",
    },
    {
      node_key: "keep-evidence",
      node_type: "question",
      title: "Evidencia de origen preservada",
      prompt:
        "¿Quedó preservada la evidencia del origen para transparencia y ejercicio de derechos?",
      why_it_matters:
        "Sin evidencia preservada la trazabilidad no es acreditable ante titulares ni revisión.",
      fact_key: "traceability.evidence_kept",
      answer_type: "single_select",
      options: stateOptions("traceability.evidence_kept"),
      evidence_to_review: ["evidencia de procedencia"],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de trazabilidad",
      prompt:
        "El sistema verifica el estado estructural y las verificaciones profesionales.",
      answer_type: "none",
      required_facts: [...DERIVED, ...MANUAL],
      transitions: [
        {
          rule_id: "structural-missing",
          description:
            "Sin datos o sin fuentes no hay trazabilidad que validar.",
          when: { op: "any", conditions: DERIVED.map(derivedNo) },
          goto_outcome_key: "traceability_missing",
          explanation:
            "Faltan datos o fuentes registrados. Completa cada elemento en el workspace.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación profesional está pendiente o sin información.",
          when: { op: "any", conditions: MANUAL.map(unresolved) },
          goto_outcome_key: "traceability_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La trazabilidad aún no queda documentada.",
        },
        {
          rule_id: "all-verified",
          description:
            "Estructura presente y verificaciones profesionales realizadas.",
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
          goto_outcome_key: "traceability_documented",
          explanation:
            "Todas las verificaciones están realizadas y respaldadas para este tratamiento.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "traceability_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "traceability_documented",
      label: "Origen trazado y acreditado",
      classification: "legal_requirement",
      explanation:
        "Los datos y fuentes existen y el origen quedó identificado con cobertura correspondiente y evidencia preservada.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la matriz de trazabilidad",
          note: "Archiva el registro de fuentes por tratamiento con evidencia de procedencia e identificación de fuentes públicas e integraciones cuando corresponda.",
        },
      ],
    },
    {
      outcome_key: "traceability_missing",
      label: "Fuentes o datos por registrar",
      classification: "agency_standard",
      explanation:
        "Faltan datos o fuentes en el workspace. La validación jurídica requiere objetos sobre los cuales pronunciarse.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Registrar datos y fuentes en Tratamientos",
          note: "Agrega los datos y sus fuentes en la sección Tratamientos de la empresa.",
        },
      ],
    },
    {
      outcome_key: "traceability_in_progress",
      label: "Trazabilidad en curso",
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
