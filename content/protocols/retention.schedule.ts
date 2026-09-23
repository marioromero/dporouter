import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.08.
 *
 * activity_key = retention.schedule (procedure, treatment scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D2.08. No inventa universalidad: el canon admite
 * excepciones y distintos criterios, así que no se exige cobertura
 * total inventada. `criterion` y `event` son texto vigente, nunca
 * fechas, timers ni expiración.
 */

const DERIVED = [
  "derived.treatment.purposes_exist",
  "derived.treatment.retention_rules_exist",
  "derived.treatment.retention_rules_linked",
];

const MANUAL = [
  "retention.purpose_related",
  "retention.legal_basis_identified",
  "retention.criteria_defined",
  "retention.extended_justified",
  "retention.exceptions_documented",
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

function verifiedOrNa(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
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

function conditionalOptions(factKey: string, naHint: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "Realizado y respaldado con evidencia.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "na",
      label: "No aplica en este caso",
      description: naHint,
      fact_effect: { fact_key: factKey, value: "na" },
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

export const RETENTION_SCHEDULE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "retention.schedule.v1",
  activity_key: "retention.schedule",
  version: 1,
  mode: "procedure",
  execution_scope: "treatment",
  title: "Procedimiento guiado de conservación y supresión",
  description:
    "Verifica que cada conjunto relevante cuente con criterio de conservación, fundamento, evento y responsable: reglas definidas, períodos justificados y excepciones documentadas.",
  entry_node_key: "relate-purpose",
  decision_fact_keys: [...MANUAL],
  external_fact_keys: [...DERIVED],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "relate-purpose",
      node_type: "question",
      title: "Conservación vinculada a finalidad",
      prompt:
        "¿Quedó relacionada la conservación con la finalidad correspondiente?",
      why_it_matters:
        "Sin vínculo con la finalidad no es posible juzgar si el período es necesario.",
      fact_key: "retention.purpose_related",
      answer_type: "single_select",
      options: stateOptions("retention.purpose_related"),
      evidence_to_review: ["matriz de conservación"],
      required_facts: [],
      default_next_node_key: "identify-legal-basis",
      related_activity_keys: ["treatment.purpose_define", "lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "identify-legal-basis",
      node_type: "question",
      title: "Fundamentos de conservación",
      prompt:
        "¿Quedaron identificadas las obligaciones legales que exigen conservación y los casos con autorización o consentimiento para períodos superiores?",
      why_it_matters:
        "Sin fundamento los períodos superiores carecen de justificación trazable.",
      fact_key: "retention.legal_basis_identified",
      answer_type: "single_select",
      options: stateOptions("retention.legal_basis_identified"),
      evidence_to_review: ["fundamentos legales cuando correspondan"],
      required_facts: [],
      default_next_node_key: "define-criteria",
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "define-criteria",
      node_type: "question",
      title: "Criterios, eventos y responsables",
      prompt:
        "¿Quedaron definidos período o criterio de término, evento de supresión o anonimización y responsables operacionales?",
      why_it_matters:
        "Sin criterio, evento ni responsable la conservación queda sin ejecución posible.",
      fact_key: "retention.criteria_defined",
      answer_type: "single_select",
      options: stateOptions("retention.criteria_defined"),
      evidence_to_review: [
        "matriz de conservación",
        "reglas de supresión o anonimización",
        "responsables",
      ],
      required_facts: [],
      default_next_node_key: "justify-extended",
      provenance: "agency_standard",
    },
    {
      node_key: "justify-extended",
      node_type: "question",
      title: "Períodos superiores justificados",
      prompt:
        "¿Quedaron justificados los períodos superiores con autorización legal o consentimiento, o se descartó fundadamente su existencia?",
      why_it_matters:
        "Un período superior sin justificación excede lo necesario para la finalidad.",
      fact_key: "retention.extended_justified",
      answer_type: "single_select",
      options: conditionalOptions(
        "retention.extended_justified",
        "No existen períodos superiores que justificar en este caso.",
      ),
      evidence_to_review: [
        "fundamentos legales cuando correspondan",
        "evidencia de configuración o ejecución cuando corresponda",
      ],
      help_text: [
        "Solo cuando existan períodos superiores. En caso contrario marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "document-exceptions",
      provenance: "agency_standard",
    },
    {
      node_key: "document-exceptions",
      node_type: "question",
      title: "Excepciones documentadas",
      prompt: "¿Quedaron documentadas las excepciones con su evidencia?",
      why_it_matters:
        "Sin excepciones documentadas la matriz queda incompleta frente a revisión.",
      fact_key: "retention.exceptions_documented",
      answer_type: "single_select",
      options: stateOptions("retention.exceptions_documented"),
      evidence_to_review: ["matriz de conservación"],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de la conservación",
      prompt:
        "El sistema verifica las reglas existentes y las verificaciones profesionales.",
      answer_type: "none",
      required_facts: [...DERIVED, ...MANUAL],
      transitions: [
        {
          rule_id: "rules-missing",
          description:
            "Sin reglas de conservación no hay programa que validar.",
          when: { op: "any", conditions: DERIVED.map(derivedNo) },
          goto_outcome_key: "rules_missing",
          explanation:
            "Faltan reglas, finalidades o vínculos válidos. Define cada elemento en el workspace.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación profesional está pendiente o sin información.",
          when: { op: "any", conditions: MANUAL.map(unresolved) },
          goto_outcome_key: "retention_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La conservación aún no queda definida.",
        },
        {
          rule_id: "all-verified",
          description:
            "Reglas existentes y verificaciones profesionales realizadas.",
          when: {
            op: "all",
            conditions: [
              ...DERIVED.map((f) => ({
                op: "fact_equals",
                fact_key: f,
                value: "yes",
              }) as FactCondition),
              isDone("retention.purpose_related"),
              isDone("retention.legal_basis_identified"),
              isDone("retention.criteria_defined"),
              verifiedOrNa("retention.extended_justified"),
              isDone("retention.exceptions_documented"),
            ],
          },
          goto_outcome_key: "retention_defined",
          explanation:
            "Todas las verificaciones están realizadas y respaldadas para este tratamiento.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "retention_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "retention_defined",
      label: "Conservación definida y fundada",
      classification: "agency_standard",
      explanation:
        "Existen reglas vinculadas y la finalidad, el fundamento, los criterios, los períodos superiores y las excepciones quedaron verificados.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la matriz de conservación",
          note: "Archiva la matriz con fundamentos, reglas de supresión o anonimización, responsables y evidencia de configuración o ejecución.",
        },
      ],
    },
    {
      outcome_key: "rules_missing",
      label: "Reglas por definir",
      classification: "agency_standard",
      explanation:
        "Faltan reglas de conservación, finalidades o vínculos válidos. La validación requiere objetos sobre los cuales pronunciarse.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Definir reglas en Tratamientos",
          note: "Agrega reglas de conservación vinculadas a datos en la sección Tratamientos de la empresa.",
        },
      ],
    },
    {
      outcome_key: "retention_in_progress",
      label: "Conservación en curso",
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
