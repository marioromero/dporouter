import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.09.
 *
 * activity_key = data.quality_control (checklist, treatment scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D2.09. Cada check distingue satisfactorio,
 * brecha e información insuficiente, sin score, frecuencia ni
 * metodología inventada. La fuente disponible se usa como insumo
 * (input_dependency canónica con D2.04).
 */

const CHECK_FACTS = [
  "quality.review_done",
  "quality.sources_checked",
  "quality.correction_defined",
  "quality.rectification_aligned",
  "quality.results_recorded",
];

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function checkOptions(factKey: string, yesHint: string) {
  return [
    {
      value: "yes",
      label: "Revisado y satisfactorio",
      description: yesHint,
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Requiere acción o corrección",
      description: "Existe brecha que requiere acción o corrección.",
      fact_effect: { fact_key: factKey, value: "no" },
    },
    {
      value: "unknown",
      label: "Información insuficiente",
      description: "No es posible determinarlo con respaldo disponible.",
      fact_effect: { fact_key: factKey, value: "unknown" },
    },
  ];
}

function conditionalOptions(factKey: string, naHint: string) {
  return [
    {
      value: "yes",
      label: "Revisado y satisfactorio",
      description: "Verificado conforme al criterio evaluado.",
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
      label: "Requiere acción o corrección",
      description: "Existe brecha que requiere acción o corrección.",
      fact_effect: { fact_key: factKey, value: "no" },
    },
    {
      value: "unknown",
      label: "Información insuficiente",
      description: "No es posible determinarlo con respaldo disponible.",
      fact_effect: { fact_key: factKey, value: "unknown" },
    },
  ];
}

function verifiedOrNa(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
}

export const DATA_QUALITY_CONTROL_PROTOCOL: ExecutionProtocol = {
  protocol_key: "data.quality_control.v1",
  activity_key: "data.quality_control",
  version: 1,
  mode: "checklist",
  execution_scope: "treatment",
  title: "Revisión guiada de calidad de datos",
  description:
    "Revisa que existan controles para datos exactos, completos, actuales y pertinentes: muestreo, fuentes de actualización, corrección, rectificación y registro.",
  entry_node_key: "check-reviewed",
  decision_fact_keys: [...CHECK_FACTS],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "check-reviewed",
      node_type: "question",
      title: "Revisión de calidad",
      prompt:
        "¿Se revisaron exactitud, completitud, actualidad y pertinencia mediante muestra o controles disponibles?",
      why_it_matters:
        "Sin revisión no es posible detectar el deterioro de calidad que afecta al titular o al proceso.",
      fact_key: "quality.review_done",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "quality.review_done",
        "Revisión realizada con muestra o controles.",
      ),
      evidence_to_review: ["resultado de revisión o muestreo"],
      required_facts: [],
      default_next_node_key: "check-sources",
      provenance: "agency_standard",
    },
    {
      node_key: "check-sources",
      node_type: "question",
      title: "Fuentes de actualización",
      prompt: "¿Se identificaron las fuentes de actualización de los datos?",
      why_it_matters:
        "Sin fuentes de actualización no es posible mantener los datos actuales.",
      fact_key: "quality.sources_checked",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "quality.sources_checked",
        "Fuentes de actualización identificadas.",
      ),
      evidence_to_review: ["reglas de actualización"],
      required_facts: [],
      default_next_node_key: "check-correction",
      related_activity_keys: ["treatment.source_traceability"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-correction",
      node_type: "question",
      title: "Corrección o depuración",
      prompt:
        "¿Se definió corrección o depuración cuando corresponde, o se descartó fundadamente su necesidad?",
      why_it_matters:
        "Sin corrección el deterioro detectado queda sin tratamiento.",
      fact_key: "quality.correction_defined",
      answer_type: "yes_no_unknown",
      options: conditionalOptions(
        "quality.correction_defined",
        "No existen datos por corregir o depurar en este caso.",
      ),
      evidence_to_review: ["incidencias detectadas", "evidencia de corrección"],
      required_facts: [],
      default_next_node_key: "check-rectification",
      provenance: "agency_standard",
    },
    {
      node_key: "check-rectification",
      node_type: "question",
      title: "Coordinación con rectificación",
      prompt:
        "¿Se coordinó con el proceso de rectificación de titulares cuando resulta aplicable, o se descartó fundadamente?",
      why_it_matters:
        "Sin coordinación los derechos de rectificación quedan desconectados del control.",
      fact_key: "quality.rectification_aligned",
      answer_type: "yes_no_unknown",
      options: conditionalOptions(
        "quality.rectification_aligned",
        "No aplica coordinación con rectificación en este caso.",
      ),
      evidence_to_review: ["reglas de actualización"],
      required_facts: [],
      default_next_node_key: "check-recorded",
      provenance: "agency_standard",
    },
    {
      node_key: "check-recorded",
      node_type: "question",
      title: "Resultados registrados",
      prompt: "¿Quedaron registrados los resultados y remediaciones?",
      why_it_matters:
        "Sin registro no hay trazabilidad del control realizado.",
      fact_key: "quality.results_recorded",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "quality.results_recorded",
        "Resultados y remediaciones registrados.",
      ),
      evidence_to_review: [
        "resultado de revisión o muestreo",
        "incidencias detectadas",
      ],
      required_facts: [],
      default_next_node_key: "final-assessment",
      provenance: "agency_standard",
    },
    {
      node_key: "final-assessment",
      node_type: "decision",
      title: "Síntesis del control",
      prompt:
        "El sistema distingue puntos validados, brechas e información por acreditar.",
      answer_type: "none",
      required_facts: [...CHECK_FACTS],
      transitions: [
        {
          rule_id: "gaps-found",
          description:
            "Al menos un check requiere acción o corrección.",
          when: { op: "any", conditions: CHECK_FACTS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas que requieren acción o corrección antes de declarar conformidad.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún antecedente está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECK_FACTS.map(unresolved) },
          goto_outcome_key: "information_incomplete",
          explanation:
            "Falta información por acreditar. Con antecedentes pendientes no se emite conclusión definitiva.",
        },
        {
          rule_id: "all-conform",
          description: "Los cinco criterios revisados y satisfactorios.",
          when: {
            op: "all",
            conditions: [
              isYes("quality.review_done"),
              isYes("quality.sources_checked"),
              verifiedOrNa("quality.correction_defined"),
              verifiedOrNa("quality.rectification_aligned"),
              isYes("quality.results_recorded"),
            ],
          },
          goto_outcome_key: "quality_conform",
          explanation:
            "Todos los criterios están revisados y satisfactorios para este tratamiento.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "information_incomplete",
          explanation:
            "El control no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "quality_conform",
      label: "Calidad conforme",
      classification: "agency_standard",
      explanation:
        "Existen controles revisados para exactitud, completitud, actualidad y pertinencia, con corrección, rectificación y registro verificados.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el control de calidad",
          note: "Archiva el resultado de revisión o muestreo con reglas de actualización, incidencias y evidencia de corrección.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere acciones correctivas",
      classification: "agency_standard",
      explanation:
        "Al menos un punto presenta brechas. Documenta cada brecha y su medida correctiva.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Documentar brechas y medidas correctivas",
          note: "Registra cada brecha detectada con su medida correctiva antes de declarar conformidad.",
        },
      ],
    },
    {
      outcome_key: "information_incomplete",
      label: "Información insuficiente",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar revisión",
        },
      ],
    },
  ],
};
