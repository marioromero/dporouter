import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.10.
 *
 * activity_key = precontractual_data.cleanup (decision, treatment
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos operativos, evidencia, dependencias y state
 * effect del contenido canónico D2.10. Sin criterios inventados de
 * eliminación, conservación, compatibilidad o licitud: la conclusión
 * la adopta explícitamente el profesional junto a un ReasoningRecord
 * treatment-scoped válido.
 *
 * Unidad jurídica: el tratamiento actual que obtuvo datos para medidas
 * precontractuales ("Determinar si el tratamiento actual continúa
 * apoyándose únicamente en esa situación precontractual"). El eventual
 * tratamiento posterior NO es un segundo objeto de ejecución: es una
 * referencia (treatmentId) registrada expresamente cuando existe, como
 * fact treatment-scoped del tratamiento que ejecuta. Sin grafo, sin
 * workflow, sin nueva entidad.
 *
 * Arquitectura espejo de D2.06: nodos de consideración registran si
 * cada factor canónico fue considerado con respaldo; la compuerta de
 * suficiencia solo decide si existe base mínima para concluir; la
 * conclusión la adopta el profesional. Los outcomes determinísticos
 * (sin datos precontractuales, evaluación incompleta, referencia
 * pendiente) no llevan efectos ni razonamiento, igual que en D2.06.
 */

const TRIGGER_FACT = "precontractual.precontractual_data";

const DECISION_FACTS = [
  TRIGGER_FACT,
  "precontractual.scope_reviewed",
  "precontractual.action_evidenced",
  "precontractual.posterior_treatment",
];

const DRAFT_FACT = "precontractual.working_conclusion";

/** Referencia al tratamiento posterior: id de tratamiento o ausencia explícita. */
const NO_POSTERIOR = "no_posterior";

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

export const PRECONTRACTUAL_DATA_CLEANUP_PROTOCOL: ExecutionProtocol = {
  protocol_key: "precontractual_data.cleanup.v1",
  activity_key: "precontractual_data.cleanup",
  version: 1,
  mode: "decision",
  execution_scope: "treatment",
  title: "Depuración guiada de datos precontractuales",
  description:
    "Estructura la revisión de datos obtenidos para medidas precontractuales en el tratamiento activo: identifica la situación, verifica la acción realizada, registra el tratamiento posterior cuando existe y documenta la conclusión profesional con su razonamiento.",
  entry_node_key: "trigger",
  decision_fact_keys: DECISION_FACTS,
  last_review: "2026-09-23",
  provenance: "legal_requirement",
  nodes: [
    {
      node_key: "trigger",
      node_type: "question",
      title: "Situación activadora",
      prompt:
        "¿Se obtuvieron datos específicamente para ejecutar medidas precontractuales solicitadas por el titular?",
      why_it_matters:
        "Sin datos precontractuales no existe obligación de depuración que revisar.",
      fact_key: TRIGGER_FACT,
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí, existen datos precontractuales",
          description: "Se obtuvieron datos para medidas precontractuales solicitadas.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "No existen datos precontractuales",
          description: "La revisión acredita que no se obtuvieron tales datos.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "Aún no es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "formularios de captación",
        "procesos comerciales",
        "contratos",
      ],
      required_facts: [],
      transitions: [
        {
          rule_id: "trigger-present",
          description: "Existen datos precontractuales por revisar.",
          when: considered(TRIGGER_FACT),
          goto_node_key: "scope-review",
          explanation:
            "La revisión de depuración procede sobre los datos identificados.",
        },
        {
          rule_id: "trigger-absent",
          description: "La revisión acredita ausencia de datos precontractuales.",
          when: {
            op: "fact_equals",
            fact_key: TRIGGER_FACT,
            value: "no",
          },
          goto_outcome_key: "cleanup_not_required",
          explanation:
            "Sin datos obtenidos para medidas precontractuales no hay depuración pendiente.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Sin determinar la situación no es posible avanzar.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Primero debe determinarse si existen datos precontractuales.",
        },
      ],
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "legal_requirement",
    },
    {
      node_key: "scope-review",
      node_type: "question",
      title: "Identificación de datos precontractuales",
      prompt:
        "¿Se identificaron los datos obtenidos específicamente para esas medidas, con respaldo revisable?",
      why_it_matters:
        "Sin identificar los datos no es posible depurarlos ni vincularlos a un tratamiento posterior.",
      fact_key: "precontractual.scope_reviewed",
      answer_type: "yes_no_unknown",
      options: considerationOptions("precontractual.scope_reviewed"),
      evidence_to_review: [
        "identificación de datos precontractuales",
        "revisión de formularios y sistemas",
        "muestreo",
      ],
      required_facts: [TRIGGER_FACT],
      default_next_node_key: "action-evidence",
      provenance: "legal_requirement",
    },
    {
      node_key: "action-evidence",
      node_type: "question",
      title: "Evidencia de la acción realizada",
      prompt:
        "¿Existe evidencia revisable de la acción realizada: supresión o anonimización de lo que permanece solo bajo el supuesto precontractual, o vinculación documentada a un tratamiento posterior?",
      why_it_matters:
        "La depuración exige acreditar qué se hizo con los datos: eliminar, anonimizar o vincular con justificación propia.",
      fact_key: "precontractual.action_evidenced",
      answer_type: "yes_no_unknown",
      options: considerationOptions("precontractual.action_evidenced"),
      evidence_to_review: [
        "evidencia de supresión o anonimización",
        "evaluación de continuidad del tratamiento",
        "nueva base documentada cuando exista un tratamiento posterior independiente",
      ],
      required_facts: [TRIGGER_FACT, "precontractual.scope_reviewed"],
      default_next_node_key: "posterior-select",
      provenance: "legal_requirement",
    },
    {
      node_key: "posterior-select",
      node_type: "question",
      title: "Tratamiento posterior",
      prompt:
        "Si existe un tratamiento posterior con finalidad y fuente de licitud diferente, selecciónalo para registrarlo expresamente. Si no existe, indícalo.",
      why_it_matters:
        "El canon exige distinguir el supuesto precontractual de un eventual tratamiento posterior con justificación propia.",
      fact_key: "precontractual.posterior_treatment",
      answer_type: "single_select",
      options: [
        {
          value: NO_POSTERIOR,
          label: "Sin tratamiento posterior",
          description:
            "No existe un tratamiento posterior con finalidad y fuente de licitud diferente.",
          fact_effect: {
            fact_key: "precontractual.posterior_treatment",
            value: NO_POSTERIOR,
          },
        },
      ],
      options_source: "same_company_treatments",
      evidence_to_review: ["nueva base documentada del tratamiento posterior"],
      required_facts: [
        TRIGGER_FACT,
        "precontractual.scope_reviewed",
        "precontractual.action_evidenced",
      ],
      default_next_node_key: "sufficiency-gate",
      related_activity_keys: ["lawful_basis.assign", "retention.schedule"],
      provenance: "legal_requirement",
    },
    {
      node_key: "sufficiency-gate",
      node_type: "decision",
      title: "Suficiencia de la revisión",
      prompt:
        "El sistema verifica si la revisión está completa y el tratamiento posterior determinado.",
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
              notConsidered("precontractual.scope_reviewed"),
              notConsidered("precontractual.action_evidenced"),
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan antecedentes por considerar. Sin la revisión completa no se habilita la conclusión profesional.",
        },
        {
          rule_id: "ready-for-conclusion",
          description:
            "La revisión está completa y el tratamiento posterior determinado.",
          when: { op: "all", conditions: [] },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Existe base mínima para que el profesional adopte una conclusión documentada.",
        },
      ],
      provenance: "legal_requirement",
    },
    {
      node_key: "adopt-conclusion",
      node_type: "question",
      title: "Adopción de la conclusión",
      prompt:
        "¿Cuál conclusión profesional adoptas sobre la depuración de los datos precontractuales de este tratamiento?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: el sistema solo verificó que existe base suficiente para concluir.",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "cleanup_completed",
          label: "Depuración completada",
          description:
            "Juicio profesional: los datos que permanecían solo bajo el supuesto precontractual fueron suprimidos o anonimizados según corresponde.",
          fact_effect: { fact_key: DRAFT_FACT, value: "cleanup_completed" },
        },
        {
          value: "linked_posterior",
          label: "Vinculado a tratamiento posterior",
          description:
            "Juicio profesional: los datos se preservan bajo un tratamiento posterior con finalidad y fuente de licitud diferente, registrado expresamente.",
          fact_effect: { fact_key: DRAFT_FACT, value: "linked_posterior" },
        },
      ],
      evidence_to_review: ["Registro de Depuración de Datos Precontractuales"],
      help_text: [
        "Selecciona la alternativa y documenta tu razonamiento a continuación. La conclusión solo queda registrada al adoptar con razonamiento válido.",
      ],
      required_facts: [...DECISION_FACTS],
    },
  ],
  outcomes: [
    {
      outcome_key: "assessment_incomplete",
      label: "Revisión incompleta",
      classification: "legal_requirement",
      explanation:
        "Existen antecedentes pendientes o con información insuficiente. Esto no es una conclusión sobre la depuración.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar revisión",
        },
      ],
    },
    {
      outcome_key: "cleanup_not_required",
      label: "Sin depuración requerida",
      classification: "legal_requirement",
      explanation:
        "La revisión acredita que no se obtuvieron datos para medidas precontractuales: no hay depuración pendiente.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la revisión",
          note: "Archiva la revisión que acredita la ausencia de datos precontractuales. Si existen reglas de conservación, verifica coherencia en D2.08.",
        },
        {
          kind: "activity",
          label: "Revisar conservación en D2.08",
          activity_key: "retention.schedule",
        },
      ],
    },
    {
      outcome_key: "cleanup_completed",
      label: "Depuración completada",
      classification: "legal_requirement",
      explanation:
        "Juicio profesional documentado: la depuración de los datos precontractuales fue completada.",
      provenance: "legal_requirement",
      canonical_fact_effects: [
        { fact_key: "treatment.precontractual_cleanup_status", value: "completed" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el registro",
          note: "Archiva el Registro de Depuración de Datos Precontractuales con la evidencia de supresión o anonimización. Si existen reglas de conservación, verifica coherencia en D2.08.",
        },
        {
          kind: "activity",
          label: "Revisar conservación en D2.08",
          activity_key: "retention.schedule",
        },
      ],
    },
    {
      outcome_key: "linked_posterior",
      label: "Vinculado a tratamiento posterior",
      classification: "legal_requirement",
      explanation:
        "Juicio profesional documentado: los datos se preservan bajo un tratamiento posterior con justificación propia, registrado expresamente.",
      provenance: "legal_requirement",
      canonical_fact_effects: [
        { fact_key: "treatment.precontractual_cleanup_status", value: "completed" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Distinguir la base del tratamiento posterior en D2.05",
          activity_key: "lawful_basis.assign",
        },
        {
          kind: "info",
          label: "Conservar el registro",
          note: "Archiva el Registro de Depuración con la referencia expresa al tratamiento posterior y su nueva base documentada.",
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
