import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.11.
 *
 * activity_key = treatment.change_review (decision, treatment scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * trigger, pasos operativos, evidencia, dependencias y state effect
 * del contenido canónico D2.11. Sin snapshots, sin historial de
 * cambios, sin versiones, sin instancias: la comparación
 * antes/después es insumo transitorio de la evaluación actual y el
 * deliverable documental conserva evidencia según mecanismos
 * existentes.
 *
 * Unidad jurídica: UN tratamiento existente frente a un cambio
 * material actual ("compara el tratamiento existente con su nueva
 * condición"). El trigger es evento transitorio, no historial.
 * `recompute` = re-evaluar reglas determinísticas contra facts
 * vigentes (la aplicabilidad y los derived se derivan en vivo); no es
 * operador ni efecto persistido.
 *
 * Dos ramas fieles al canon ("cuando el cambio requiera
 * interpretación"): la interpretativa adopta juicio profesional con
 * ReasoningRecord treatment-scoped; la mecánica cierra con outcome
 * determinístico sin efectos (misma familia del deterministic gap
 * conocido: NO se resuelve aquí).
 */

const TRIGGER_FACT = "change.detected";
const DATE_FACT = "change.date";
const DESC_FACT = "change.description";

const DECISION_FACTS = [
  TRIGGER_FACT,
  "change.attributes_identified",
  "change.impact_assessed",
  "change.inventory_updated",
  "change.requires_interpretation",
  DATE_FACT,
  DESC_FACT,
];

const DRAFT_FACT = "change.working_conclusion";

function considered(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function notConsidered(fact_key: string): FactCondition {
  return { op: "not", condition: considered(fact_key) };
}

function considerationOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Considerado con respaldo",
      description: "El factor fue considerado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No considerado",
      description: "El factor aún no ha sido considerado.",
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

export const TREATMENT_CHANGE_REVIEW_PROTOCOL: ExecutionProtocol = {
  protocol_key: "treatment.change_review.v1",
  activity_key: "treatment.change_review",
  version: 1,
  mode: "decision",
  execution_scope: "treatment",
  title: "Revisión guiada de cambios del tratamiento",
  description:
    "Estructura la revisión de un cambio material en el tratamiento activo: registra el cambio y su fecha, compara la condición anterior con la nueva, evalúa el impacto sobre finalidad y licitud, actualiza el inventario y documenta el juicio profesional cuando el cambio requiere interpretación.",
  entry_node_key: "trigger",
  decision_fact_keys: DECISION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "trigger",
      node_type: "question",
      title: "Cambio material",
      prompt:
        "¿El tratamiento cambió de manera que sea necesario reevaluar su finalidad, licitud, proporcionalidad, conservación u obligaciones relacionadas?",
      why_it_matters:
        "Sin cambio material no existe revisión que ejecutar.",
      fact_key: TRIGGER_FACT,
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí, existe un cambio material",
          description: "Se detectó un cambio que exige reevaluación.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "Sin cambio material",
          description: "No se detectó un cambio que exija reevaluación.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "Aún no es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: ["revisión de cambio", "entrevistas", "revisión de sistemas"],
      required_facts: [],
      transitions: [
        {
          rule_id: "trigger-present",
          description: "Existe un cambio material por revisar.",
          when: considered(TRIGGER_FACT),
          goto_node_key: "change-date",
          explanation: "La revisión del cambio procede sobre el tratamiento.",
        },
        {
          rule_id: "trigger-absent",
          description: "Sin cambio material no hay revisión pendiente.",
          when: { op: "fact_equals", fact_key: TRIGGER_FACT, value: "no" },
          goto_outcome_key: "no_change",
          explanation:
            "Sin cambio material detectado no existe revisión que ejecutar.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Sin determinar el cambio no es posible avanzar.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Primero debe determinarse si existe un cambio material.",
        },
      ],
      related_activity_keys: ["treatment.inventory_create"],
      provenance: "agency_standard",
    },
    {
      node_key: "change-date",
      node_type: "question",
      title: "Fecha del cambio",
      prompt:
        "¿En qué fecha ocurrió el cambio? Indica la fecha civil del cambio actual.",
      why_it_matters:
        "El canon exige registrar el cambio y su fecha como punto de partida de la revisión.",
      fact_key: DATE_FACT,
      answer_type: "date",
      evidence_to_review: ["registro de cambio"],
      help_text: [
        "Una fecha por revisión: un cambio nuevo reemplaza la fecha anterior. No se conserva historial de cambios en el runtime.",
      ],
      required_facts: [TRIGGER_FACT],
      default_next_node_key: "change-description",
      provenance: "agency_standard",
    },
    {
      node_key: "change-description",
      node_type: "question",
      title: "Descripción del cambio",
      prompt:
        "Describe el cambio actual: qué atributos del tratamiento fueron modificados y cuál es la condición nueva frente a la anterior.",
      why_it_matters:
        "Sin identificar qué cambió no es posible evaluar el impacto ni comparar antes y después.",
      fact_key: DESC_FACT,
      answer_type: "text",
      evidence_to_review: ["registro de cambio", "revisión documental"],
      help_text: [
        "Describe solo el cambio actual. La comparación antes/después es insumo de esta evaluación; no se conservan versiones anteriores en el runtime.",
      ],
      required_facts: [TRIGGER_FACT, DATE_FACT],
      default_next_node_key: "attributes",
      provenance: "agency_standard",
    },
    {
      node_key: "attributes",
      node_type: "question",
      title: "Atributos y finalidad",
      prompt:
        "¿Se identificaron los atributos modificados y se revisó si existe una finalidad nueva o modificada?",
      why_it_matters:
        "Una finalidad nueva o modificada condiciona la compatibilidad y la base de licitud.",
      fact_key: "change.attributes_identified",
      answer_type: "yes_no_unknown",
      options: considerationOptions("change.attributes_identified"),
      evidence_to_review: [
        "atributos modificados",
        "finalidad nueva o modificada",
      ],
      required_facts: [TRIGGER_FACT, DATE_FACT, DESC_FACT],
      default_next_node_key: "impact",
      provenance: "agency_standard",
    },
    {
      node_key: "impact",
      node_type: "question",
      title: "Impacto sobre licitud y obligaciones",
      prompt:
        "¿Se evaluó la compatibilidad del uso distinto, la base de licitud cuando corresponde, y la minimización, conservación, calidad, actores y fuentes afectados?",
      why_it_matters:
        "El cambio puede alterar la licitud y las obligaciones aplicables al tratamiento.",
      fact_key: "change.impact_assessed",
      answer_type: "yes_no_unknown",
      options: considerationOptions("change.impact_assessed"),
      evidence_to_review: [
        "evaluación de impacto sobre finalidad y licitud",
        "compatibilidad del uso distinto",
        "minimización, conservación, calidad, actores y fuentes",
      ],
      required_facts: [TRIGGER_FACT, "change.attributes_identified"],
      default_next_node_key: "inventory",
      provenance: "agency_standard",
    },
    {
      node_key: "inventory",
      node_type: "question",
      title: "Inventario actualizado",
      prompt:
        "¿Se actualizaron en el inventario del tratamiento los atributos afectados, de modo que las obligaciones y flags dependientes se recalculen sobre el estado vigente?",
      why_it_matters:
        "El inventario debe reflejar la condición nueva; la aplicabilidad y los derivados se recalculan en vivo desde los facts vigentes.",
      fact_key: "change.inventory_updated",
      answer_type: "yes_no_unknown",
      options: considerationOptions("change.inventory_updated"),
      evidence_to_review: ["actualización de inventario"],
      help_text: [
        "Actualiza los atributos en Tratamientos; esta guía verifica que se hizo, no duplica el inventario.",
      ],
      required_facts: [TRIGGER_FACT, "change.impact_assessed"],
      default_next_node_key: "interpretation",
      related_activity_keys: ["treatment.inventory_create"],
      provenance: "agency_standard",
    },
    {
      node_key: "interpretation",
      node_type: "question",
      title: "Interpretación profesional",
      prompt:
        "¿El cambio requiere interpretación profesional (compatibilidad de un uso distinto, nueva justificación, juicio sobre licitud)?",
      why_it_matters:
        "Solo el cambio que exige interpretación se cierra con juicio documentado; el cambio mecánico se registra sin deducir conclusiones.",
      fact_key: "change.requires_interpretation",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Requiere interpretación",
          description: "El cambio exige juicio profesional documentado.",
          fact_effect: { fact_key: "change.requires_interpretation", value: "yes" },
        },
        {
          value: "no",
          label: "Cambio mecánico",
          description: "El cambio se verifica y registra sin interpretación.",
          fact_effect: { fact_key: "change.requires_interpretation", value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "Aún no es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "change.requires_interpretation", value: "unknown" },
        },
      ],
      required_facts: [TRIGGER_FACT, "change.inventory_updated"],
      default_next_node_key: "sufficiency-gate",
      provenance: "agency_standard",
    },
    {
      node_key: "sufficiency-gate",
      node_type: "decision",
      title: "Suficiencia de la revisión",
      prompt:
        "El sistema verifica si la revisión está completa y qué camino corresponde.",
      answer_type: "none",
      required_facts: [...DECISION_FACTS],
      transitions: [
        {
          rule_id: "factors-pending",
          description:
            "Algún factor no fue considerado, está sin responder o sin información.",
          when: {
            op: "any",
            conditions: [
              notConsidered(TRIGGER_FACT),
              notConsidered("change.attributes_identified"),
              notConsidered("change.impact_assessed"),
              notConsidered("change.inventory_updated"),
              { op: "fact_unresolved", fact_key: DATE_FACT },
              { op: "fact_unresolved", fact_key: DESC_FACT },
              // El triaje sí/no/ausente decide la rama: sin responder o
              // sin información no hay cierre en ninguna dirección. Se
              // usa fact_unresolved (ausente o unknown) y NO notConsidered:
              // el valor "no" es la rama mecánica válida, no un pendiente.
              { op: "fact_unresolved", fact_key: "change.requires_interpretation" },
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan antecedentes por considerar. Sin la revisión completa no hay cierre.",
        },
        {
          rule_id: "mechanical-change",
          description:
            "Cambio verificado que no requiere interpretación profesional.",
          when: {
            op: "fact_equals",
            fact_key: "change.requires_interpretation",
            value: "no",
          },
          goto_outcome_key: "change_recorded",
          explanation:
            "El cambio se registra sin juicio: no hay interpretación que documentar.",
        },
        {
          rule_id: "ready-for-conclusion",
          description:
            "La revisión está completa y el cambio exige interpretación.",
          when: { op: "all", conditions: [] },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Existe base mínima para que el profesional adopte una conclusión documentada.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "adopt-conclusion",
      node_type: "question",
      title: "Adopción de la conclusión",
      prompt:
        "¿Adoptas la conclusión profesional de que la revisión del cambio fue completada?",
      why_it_matters:
        "Esta adopción es tu juicio profesional, no un cálculo del sistema: el sistema solo verificó que existe base suficiente para concluir.",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "change_review_completed",
          label: "Revisión completada",
          description:
            "Juicio profesional: el cambio fue revisado, el inventario actualizado y las obligaciones recalculadas sobre el estado vigente.",
          fact_effect: { fact_key: DRAFT_FACT, value: "change_review_completed" },
        },
      ],
      evidence_to_review: ["Revisión de Cambio de Tratamiento"],
      help_text: [
        "Documenta tu razonamiento a continuación. La conclusión solo queda registrada al adoptar con razonamiento válido.",
      ],
      required_facts: [...DECISION_FACTS],
    },
  ],
  outcomes: [
    {
      outcome_key: "assessment_incomplete",
      label: "Revisión incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o con información insuficiente. Esto no es una conclusión sobre el cambio.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar revisión",
        },
      ],
    },
    {
      outcome_key: "no_change",
      label: "Sin cambio material",
      classification: "agency_standard",
      explanation:
        "No se detectó un cambio que exija reevaluación: no hay revisión pendiente.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la verificación",
          note: "Archiva la verificación de ausencia de cambios materiales.",
        },
      ],
    },
    {
      outcome_key: "change_recorded",
      label: "Cambio registrado",
      classification: "agency_standard",
      explanation:
        "Cambio verificado y registrado sin interpretación profesional: el inventario quedó actualizado sobre el estado vigente.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Verificar inventario en D2.01",
          activity_key: "treatment.inventory_create",
        },
        {
          kind: "info",
          label: "Conservar el registro",
          note: "Archiva el Registro de Cambio con fecha, descripción y comparación antes/después.",
        },
      ],
    },
    {
      outcome_key: "change_review_completed",
      label: "Revisión completada",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la revisión del cambio fue completada.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "treatment.change_review_status", value: "completed" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Verificar inventario en D2.01",
          activity_key: "treatment.inventory_create",
        },
        {
          kind: "info",
          label: "Conservar el registro",
          note: "Archiva la Revisión de Cambio de Tratamiento con el Reasoning Record cuando corresponda.",
        },
      ],
    },
  ],
  reasoning_requirements: {
    required_fields: [
      "conclusion",
      "legal_question",
      "facts_considered",
      "legal_factors",
      "alternatives_considered",
      "rationale",
      "decided_by",
      "decided_at",
      "legal_basis",
    ],
  },
};
