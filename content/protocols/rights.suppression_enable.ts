import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.04.
 *
 * activity_key = rights.suppression_enable (checklist, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente el marco causal, las excepciones, los pasos
 * adicionales, la evidencia, las dependencias y el state effect del
 * contenido canónico D4.04.
 *
 * Stage 1 verifica que el marco cubra las 6 causales y las 6
 * familias de excepciones; NO convierte la guía en juicio
 * profesional sobre casos individuales ni adopta decisiones de
 * supresión (`reasoning_record_required = false`). Cada causal y
 * cada excepción es un check propio: la matriz causal/excepciones
 * es el deliverable, no una decisión automatizada.
 *
 * Dependencia de completitud hacia D4.01 vía fact externo
 * `rights.exercise_mechanism_status`. Metodología `agency_standard`.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.suppression.cause_unnecessary",
  "rights.suppression.cause_consent_withdrawn",
  "rights.suppression.cause_unlawful",
  "rights.suppression.cause_outdated",
  "rights.suppression.cause_legal_order",
  "rights.suppression.cause_opposition",
  "rights.suppression.exception_expression",
  "rights.suppression.exception_legal_contract",
  "rights.suppression.exception_public_function",
  "rights.suppression.exception_public_health",
  "rights.suppression.exception_research",
  "rights.suppression.exception_claims",
  "rights.suppression.request_records",
  "rights.suppression.data_located",
  "rights.suppression.deletion_executed",
  "rights.suppression.third_parties_identified",
  "rights.suppression.changes_communicated",
  "rights.suppression.blocking_integrated",
  "rights.suppression.no_case_decisions",
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

function node(
  node_key: string,
  title: string,
  prompt: string,
  why: string,
  factKey: string,
  yesHint: string,
  evidence: string[],
  next: string,
  related?: string[],
): import("./types").GuidanceNode {
  return {
    node_key,
    node_type: "question",
    title,
    prompt,
    why_it_matters: why,
    fact_key: factKey,
    answer_type: "yes_no_unknown",
    options: checkOptions(factKey, yesHint),
    evidence_to_review: evidence,
    required_facts: [],
    default_next_node_key: next,
    ...(related ? { related_activity_keys: related } : {}),
    provenance: "agency_standard",
  };
}

export const RIGHTS_SUPPRESSION_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.suppression_enable.v1",
  activity_key: "rights.suppression_enable",
  version: 1,
  mode: "checklist",
  execution_scope: "company",
  title: "Habilitación guiada del derecho de supresión",
  description:
    "Verifica que el procedimiento cubra las seis causales legales de supresión, sus seis familias de excepciones y las consecuencias operacionales. Evalúa el marco de decisión, sin adoptar decisiones sobre casos reales.",
  entry_node_key: "check-cause-unnecessary",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    node(
      "check-cause-unnecessary",
      "Causal: datos no necesarios",
      "¿El procedimiento contempla la causal de datos no necesarios respecto de los fines para los cuales fueron recogidos?",
      "Primera causal legal: el dato que perdió su finalidad debe poder suprimirse.",
      "rights.suppression.cause_unnecessary",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-cause-consent",
    ),
    node(
      "check-cause-consent",
      "Causal: consentimiento revocado",
      "¿El procedimiento contempla la causal de revocación del consentimiento con ausencia de otro fundamento legal?",
      "Segunda causal: revocado el consentimiento sin otra base, procede evaluar la supresión. No redefine el consentimiento de D3.",
      "rights.suppression.cause_consent_withdrawn",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-cause-unlawful",
    ),
    node(
      "check-cause-unlawful",
      "Causal: tratamiento ilícito",
      "¿El procedimiento contempla la causal de obtención o tratamiento ilícito?",
      "Tercera causal: lo ilícitamente obtenido o tratado debe poder suprimirse.",
      "rights.suppression.cause_unlawful",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-cause-outdated",
    ),
    node(
      "check-cause-outdated",
      "Causal: datos caducos",
      "¿El procedimiento contempla la causal de datos caducos?",
      "Cuarta causal: el dato caduco pierde sustento de conservación.",
      "rights.suppression.cause_outdated",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-cause-order",
    ),
    node(
      "check-cause-order",
      "Causal: mandato legal o judicial",
      "¿El procedimiento contempla la causal de cumplimiento de sentencia, resolución de autoridad u obligación legal?",
      "Quinta causal: el mandato externo obliga a suprimir.",
      "rights.suppression.cause_legal_order",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-cause-opposition",
    ),
    node(
      "check-cause-opposition",
      "Causal: oposición sin otra base",
      "¿El procedimiento contempla la causal de oposición ejercida con ausencia de otro fundamento legal?",
      "Sexta causal: la oposición exitosa sin otra base deriva en supresión.",
      "rights.suppression.cause_opposition",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-expression",
    ),
    node(
      "check-exception-expression",
      "Excepción: libertad de opinión e información",
      "¿El procedimiento contempla que la supresión no procede cuando el tratamiento sea necesario para las libertades de emitir opinión e informar?",
      "Primera familia de excepciones: la supresión cede ante estas libertades.",
      "rights.suppression.exception_expression",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-contract",
    ),
    node(
      "check-exception-contract",
      "Excepción: obligación legal o contrato",
      "¿El procedimiento contempla la excepción de obligación legal o ejecución de contrato?",
      "Segunda familia: el deber legal o contractual sostiene el tratamiento.",
      "rights.suppression.exception_legal_contract",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-public",
    ),
    node(
      "check-exception-public",
      "Excepción: función pública o interés público",
      "¿El procedimiento contempla la excepción de función pública o actividad de interés público?",
      "Tercera familia: la función pública sostiene el tratamiento.",
      "rights.suppression.exception_public_function",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-health",
    ),
    node(
      "check-exception-health",
      "Excepción: salud pública",
      "¿El procedimiento contempla la excepción de interés público en salud pública conforme a las condiciones legales?",
      "Cuarta familia, con condiciones legales propias.",
      "rights.suppression.exception_public_health",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-research",
    ),
    node(
      "check-exception-research",
      "Excepción: fines históricos, estadísticos o científicos",
      "¿El procedimiento contempla la excepción de fines históricos, estadísticos o científicos e investigaciones de interés público?",
      "Quinta familia: la investigación de interés público sostiene el tratamiento.",
      "rights.suppression.exception_research",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-claims",
    ),
    node(
      "check-exception-claims",
      "Excepción: reclamaciones",
      "¿El procedimiento contempla la excepción de formulación, ejercicio o defensa de reclamación administrativa o judicial?",
      "Sexta familia: la defensa de reclamaciones sostiene el tratamiento.",
      "rights.suppression.exception_claims",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-request",
    ),
    node(
      "check-request",
      "Causal y antecedentes de la solicitud",
      "¿El procedimiento verifica que la solicitud identifique causal y antecedentes cuando corresponda?",
      "Sin causal identificada no hay evaluación posible.",
      "rights.suppression.request_records",
      "Verificación de causal prevista.",
      ["procedimiento de supresión", "templates"],
      "check-location",
    ),
    node(
      "check-location",
      "Localización de datos",
      "¿El procedimiento define cómo localizar los datos a suprimir?",
      "Localizar es prerrequisito de eliminar.",
      "rights.suppression.data_located",
      "Localización prevista con data mapping.",
      ["data mapping", "revisión de retention/data flows"],
      "check-deletion",
    ),
    node(
      "check-deletion",
      "Eliminación",
      "¿El procedimiento ejecuta la eliminación cuando la supresión procede?",
      "La supresión procedente debe ejecutarse, no solo declararse.",
      "rights.suppression.deletion_executed",
      "Ejecución prevista con reglas de eliminación y walkthrough.",
      ["reglas de eliminación", "walkthrough controlado"],
      "check-third-parties",
    ),
    node(
      "check-third-parties",
      "Terceros receptores",
      "¿El procedimiento identifica las comunicaciones o cesiones previas de los datos?",
      "Sin identificar receptores no hay propagación.",
      "rights.suppression.third_parties_identified",
      "Identificación de receptores prevista.",
      ["procedimiento downstream", "revisión de propagación"],
      "check-communication",
    ),
    node(
      "check-communication",
      "Comunicación de cambios",
      "¿El procedimiento comunica los cambios a terceros receptores cuando corresponda conforme al art. 11?",
      "La supresión debe alcanzar los tratamientos de terceros informados.",
      "rights.suppression.changes_communicated",
      "Comunicación prevista con templates.",
      ["templates", "procedimiento downstream"],
      "check-blocking",
    ),
    node(
      "check-blocking",
      "Bloqueo temporal",
      "¿El procedimiento integra el bloqueo temporal cuando sea solicitado durante la resolución?",
      "El bloqueo protege mientras se decide la supresión.",
      "rights.suppression.blocking_integrated",
      "Integración con bloqueo prevista.",
      ["procedimiento de supresión"],
      "check-no-decisions",
      ["rights.blocking_enable"],
    ),
    node(
      "check-no-decisions",
      "Sin decisiones sobre casos reales",
      "¿El procedimiento y la guía evitan adoptar decisiones sobre casos reales de supresión en Stage 1?",
      "Stage 1 diseña el marco; decidir un caso pertenece a su expediente futuro.",
      "rights.suppression.no_case_decisions",
      "Marco sin decisiones individuales verificado.",
      ["escenarios controlados"],
      "synthesis",
      ["rights.exercise_mechanism_design"],
    ),
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la supresión",
      prompt:
        "El sistema verifica el mecanismo general de D4.01 y la cobertura del marco causal y de excepciones.",
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
            "La atención de la supresión solo está completa sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un punto del marco de supresión requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas en causales, excepciones o consecuencias operacionales.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún punto está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan puntos por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "suppression-complete",
          description:
            "Mecanismo diseñado con marco causal y de excepciones cubierto.",
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
          goto_outcome_key: "suppression_enabled",
          explanation:
            "El procedimiento puede evaluar causales, aplicar excepciones y ejecutar efectos de supresión.",
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
      outcome_key: "suppression_enabled",
      label: "Atención de la supresión habilitada",
      classification: "agency_standard",
      explanation:
        "La empresa dispone de matriz causal y de excepciones más procedimiento operacional. Esto valida el marco, sin decidir casos individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.suppression_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz causal/excepciones, el procedimiento de supresión, el data mapping, las reglas de eliminación, el procedimiento downstream, los templates y el walkthrough controlado.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "La atención de la supresión solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
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
      label: "Requiere correcciones de supresión",
      classification: "agency_standard",
      explanation:
        "Al menos un punto del marco requiere corrección. Completa causales, excepciones o efectos operacionales.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada punto pendiente y vuelve a verificar el marco de supresión.",
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
        "Existen puntos pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
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
