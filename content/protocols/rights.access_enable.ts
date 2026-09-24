import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.02.
 *
 * activity_key = rights.access_enable (checklist, company scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, dependencias y state effect del contenido
 * canónico D4.02. Verifica la capacidad para responder accesos sin
 * construir la respuesta real de ningún titular.
 *
 * Dependencia de completitud: la guía puede navegarse y revisarse
 * desde el inicio (can start), pero su conclusión definitiva
 * requiere el mecanismo general diseñado en D4.01 (can complete).
 * Se expresa consumiendo el fact externo
 * `rights.exercise_mechanism_status`: sin `designed` no hay outcome
 * definitivo. No convierte el acceso en un export técnico genérico:
 * cada categoría legal de información es un check propio.
 *
 * Metodología `agency_standard` (matriz, mapeo, walkthrough): la
 * obligación de acceso es legal; los artefactos de verificación son
 * método interno.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.access.confirmation_capacity",
  "rights.access.data_access_capacity",
  "rights.access.origin_reported",
  "rights.access.purposes_reported",
  "rights.access.recipient_categories_reported",
  "rights.access.recipient_identity_covered",
  "rights.access.retention_period_reported",
  "rights.access.legitimate_interests_covered",
  "rights.access.automated_logic_covered",
  "rights.access.denial_criteria",
  "rights.access.identification_sufficient",
  "rights.access.gratuity_coordinated",
];

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function satisfied(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
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
      description: "El punto fue verificado con respaldo revisable.",
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

export const RIGHTS_ACCESS_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.access_enable.v1",
  activity_key: "rights.access_enable",
  version: 1,
  mode: "checklist",
  execution_scope: "company",
  title: "Habilitación guiada del derecho de acceso",
  description:
    "Verifica que el responsable pueda identificar, compilar y entregar la información exigida cuando un titular ejerza su derecho de acceso. Evalúa capacidad organizacional, sin construir respuestas reales.",
  entry_node_key: "check-confirmation",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "check-confirmation",
      node_type: "question",
      title: "Confirmación del tratamiento",
      prompt:
        "¿La empresa puede confirmar si trata o no datos personales del titular que ejerce el acceso?",
      why_it_matters:
        "La confirmación es el primer contenido exigible de la respuesta de acceso.",
      fact_key: "rights.access.confirmation_capacity",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.confirmation_capacity",
        "Capacidad de confirmar el tratamiento verificada.",
      ),
      evidence_to_review: ["matriz de información a entregar", "mapeo de fuentes/repositorios"],
      required_facts: [],
      default_next_node_key: "check-data-access",
      provenance: "agency_standard",
    },
    {
      node_key: "check-data-access",
      node_type: "question",
      title: "Acceso a los datos",
      prompt: "¿La empresa puede dar acceso a los datos tratados del titular?",
      why_it_matters:
        "El acceso efectivo a los datos es el núcleo del derecho.",
      fact_key: "rights.access.data_access_capacity",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.data_access_capacity",
        "Capacidad de dar acceso verificada con procedimiento de extracción.",
      ),
      evidence_to_review: ["procedimiento de extracción", "ejemplo controlado o walkthrough"],
      required_facts: [],
      default_next_node_key: "check-origin",
      provenance: "agency_standard",
    },
    {
      node_key: "check-origin",
      node_type: "question",
      title: "Origen de los datos",
      prompt: "¿La empresa puede informar el origen de los datos del titular?",
      why_it_matters: "El origen es información exigible de la respuesta.",
      fact_key: "rights.access.origin_reported",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.origin_reported",
        "Fuente de origen trazable en el mapeo.",
      ),
      evidence_to_review: ["mapeo de fuentes/repositorios"],
      required_facts: [],
      default_next_node_key: "check-purposes",
      provenance: "agency_standard",
    },
    {
      node_key: "check-purposes",
      node_type: "question",
      title: "Finalidades",
      prompt: "¿La empresa puede informar la finalidad o finalidades del tratamiento?",
      why_it_matters: "Las finalidades informadas deben corresponder al tratamiento real.",
      fact_key: "rights.access.purposes_reported",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.purposes_reported",
        "Finalidades informables verificadas.",
      ),
      evidence_to_review: ["matriz de información a entregar"],
      required_facts: [],
      default_next_node_key: "check-recipient-categories",
      provenance: "agency_standard",
    },
    {
      node_key: "check-recipient-categories",
      node_type: "question",
      title: "Categorías de destinatarios",
      prompt:
        "¿La empresa puede informar las categorías, clases o tipos de destinatarios?",
      why_it_matters: "Las categorías de destinatarios son contenido exigible.",
      fact_key: "rights.access.recipient_categories_reported",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.recipient_categories_reported",
        "Categorías de destinatarios identificadas.",
      ),
      evidence_to_review: ["matriz de información a entregar"],
      required_facts: [],
      default_next_node_key: "check-recipient-identity",
      provenance: "agency_standard",
    },
    {
      node_key: "check-recipient-identity",
      node_type: "question",
      title: "Identidad de destinatarios",
      prompt:
        "¿La empresa puede informar la identidad de cada destinatario cuando el titular lo solicite?",
      why_it_matters:
        "La identidad individual se entrega a solicitud del titular, más allá de las categorías.",
      fact_key: "rights.access.recipient_identity_covered",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.recipient_identity_covered",
        "Capacidad de individualizar destinatarios verificada.",
      ),
      evidence_to_review: ["matriz de información a entregar", "template de respuesta"],
      required_facts: [],
      default_next_node_key: "check-retention",
      provenance: "agency_standard",
    },
    {
      node_key: "check-retention",
      node_type: "question",
      title: "Período de tratamiento",
      prompt:
        "¿La empresa puede informar el período durante el cual los datos serán tratados?",
      why_it_matters: "El período de conservación forma parte de la respuesta.",
      fact_key: "rights.access.retention_period_reported",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.retention_period_reported",
        "Período informable verificado.",
      ),
      evidence_to_review: ["matriz de información a entregar"],
      required_facts: [],
      default_next_node_key: "check-legitimate-interests",
      provenance: "agency_standard",
    },
    {
      node_key: "check-legitimate-interests",
      node_type: "question",
      title: "Intereses legítimos",
      prompt:
        "¿La empresa puede informar los intereses legítimos cuando ésa sea la base aplicable, o no opera con esa base?",
      why_it_matters:
        "Condicional: solo exigible cuando el tratamiento se basa en interés legítimo.",
      fact_key: "rights.access.legitimate_interests_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "rights.access.legitimate_interests_covered",
        "Ningún tratamiento relevante se basa en interés legítimo.",
      ),
      evidence_to_review: ["matriz de información a entregar"],
      required_facts: [],
      default_next_node_key: "check-automated-logic",
      provenance: "agency_standard",
    },
    {
      node_key: "check-automated-logic",
      node_type: "question",
      title: "Lógica automatizada",
      prompt:
        "¿La empresa puede entregar información significativa sobre la lógica aplicada cuando exista tratamiento comprendido por el artículo 8 bis, o no existe tal tratamiento?",
      why_it_matters:
        "Condicional: solo cuando exista decisión automatizada o perfil bajo el artículo 8 bis. No redefine el alcance de D4.08.",
      fact_key: "rights.access.automated_logic_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "rights.access.automated_logic_covered",
        "No existe tratamiento comprendido por el artículo 8 bis.",
      ),
      evidence_to_review: [
        "matriz de información a entregar",
        "coordinación con D4.08 respecto de lógica automatizada cuando corresponda",
      ],
      required_facts: [],
      default_next_node_key: "check-denial",
      related_activity_keys: ["automated_decision.scope_assess"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-denial",
      node_type: "question",
      title: "Criterio de negativa",
      prompt:
        "¿El procedimiento reconoce que la negativa de acceso solo procede cuando una ley disponga expresamente lo contrario?",
      why_it_matters:
        "La negativa es excepcional y legalmente acotada; no admite discrecionalidad.",
      fact_key: "rights.access.denial_criteria",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.denial_criteria",
        "Criterio de negativa excepcional documentado.",
      ),
      evidence_to_review: ["criterios para excepciones legales"],
      required_facts: [],
      default_next_node_key: "check-identification",
      provenance: "agency_standard",
    },
    {
      node_key: "check-identification",
      node_type: "question",
      title: "Individualización suficiente",
      prompt:
        "¿El procedimiento respeta que para el acceso basta la individualización del titular, sin requisitos adicionales?",
      why_it_matters:
        "Imponer requisitos extra al acceso vulnera su umbral procedimental propio.",
      fact_key: "rights.access.identification_sufficient",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.identification_sufficient",
        "Umbral de individualización respetado en formularios y procedimiento.",
      ),
      evidence_to_review: ["template de respuesta"],
      required_facts: [],
      default_next_node_key: "check-gratuity",
      provenance: "agency_standard",
    },
    {
      node_key: "check-gratuity",
      node_type: "question",
      title: "Gratuidad coordinada",
      prompt:
        "¿La regla de gratuidad está aplicada y cualquier costo admisible está coordinado con D4.01?",
      why_it_matters:
        "Los costos del acceso siguen las reglas generales del mecanismo, sin duplicarlas.",
      fact_key: "rights.access.gratuity_coordinated",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.gratuity_coordinated",
        "Gratuidad y costos coordinados con el mecanismo general.",
      ),
      evidence_to_review: ["template de respuesta"],
      required_facts: [],
      default_next_node_key: "synthesis",
      related_activity_keys: ["rights.exercise_mechanism_design"],
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis del acceso",
      prompt:
        "El sistema verifica el mecanismo general de D4.01 y el estado de cada contenido de acceso.",
      answer_type: "none",
      required_facts: [MECHANISM_FACT, ...CHECKS],
      transitions: [
        {
          rule_id: "mechanism-not-designed",
          description:
            "El mecanismo general aún no está diseñado en D4.01: la habilitación no puede concluir.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: MECHANISM_FACT,
              value: "designed",
            },
          },
          goto_outcome_key: "mechanism_pending",
          explanation:
            "La atención del acceso solo está completa sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un contenido de acceso requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de capacidad de acceso que requieren corrección.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún contenido está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan contenidos por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "access-complete",
          description:
            "Mecanismo diseñado y todos los contenidos satisfactorios o no aplicables.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: MECHANISM_FACT,
                value: "designed",
              },
              ...CHECKS.map(satisfied),
            ],
          },
          goto_outcome_key: "access_enabled",
          explanation:
            "La empresa puede responder accesos con los contenidos exigidos.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La verificación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "access_enabled",
      label: "Atención del acceso habilitada",
      classification: "agency_standard",
      explanation:
        "La empresa puede identificar, compilar y entregar la información exigida del acceso. Esto valida la capacidad, no respuestas reales ni el cumplimiento integral.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.access_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz de información, el mapeo de fuentes, el procedimiento de extracción, el template de respuesta y el walkthrough de capacidad.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "La atención del acceso solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Diseñar el mecanismo general en D4.01",
          activity_key: "rights.exercise_mechanism_design",
        },
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere correcciones de acceso",
      classification: "agency_standard",
      explanation:
        "Al menos un contenido de acceso requiere corrección. Completa la capacidad faltante.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada contenido pendiente y vuelve a verificar la capacidad de acceso.",
        },
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Verificación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen contenidos pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
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
