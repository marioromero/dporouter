import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.03.
 *
 * activity_key = rights.rectification_enable (procedure, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, dependencias y state effect del
 * contenido canónico D4.03. Verifica capacidad y propagación de
 * rectificaciones sin decidir casos individuales.
 *
 * La excepción de imposibilidad o esfuerzo desproporcionado se
 * verifica como criterio y procedimiento existente, con exigencia
 * de fundamentación; Stage 1 nunca adopta conclusiones sobre un
 * caso real ni persiste juicios (`reasoning_record_required =
 * false`). Coordinación con bloqueo como capacidad, sin lifecycle.
 *
 * Dependencia de completitud hacia D4.01 vía fact externo
 * `rights.exercise_mechanism_status` (can start libre, can complete
 * gated). Metodología `agency_standard`.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.rectification.inexact_data_identified",
  "rights.rectification.precise_modification",
  "rights.rectification.supporting_records",
  "rights.rectification.systems_corrected",
  "rights.rectification.reuse_prevented",
  "rights.rectification.recipients_identified",
  "rights.rectification.recipients_notified",
  "rights.rectification.exception_criterion",
  "rights.rectification.exception_evidenced",
  "rights.rectification.blocking_coordinated",
  "rights.rectification.common_procedure",
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

function verifyOptions(factKey: string, yesHint: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: yesHint,
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "El punto aún no está cubierto en el procedimiento.",
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

export const RIGHTS_RECTIFICATION_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.rectification_enable.v1",
  activity_key: "rights.rectification_enable",
  version: 1,
  mode: "procedure",
  execution_scope: "company",
  title: "Habilitación guiada de la rectificación",
  description:
    "Verifica que la empresa pueda rectificar datos inexactos, desactualizados o incompletos y propagar las rectificaciones a destinatarios. Evalúa el procedimiento y sus criterios, sin decidir casos individuales.",
  entry_node_key: "check-inexact-data",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "check-inexact-data",
      node_type: "question",
      title: "Identificación del dato",
      prompt:
        "¿El procedimiento permite identificar los datos inexactos, desactualizados o incompletos objeto de rectificación?",
      why_it_matters:
        "Sin identificación precisa no hay objeto rectificable.",
      fact_key: "rights.rectification.inexact_data_identified",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.inexact_data_identified",
        "Criterio de identificación del dato verificado.",
      ),
      evidence_to_review: ["procedimiento de rectificación"],
      required_facts: [],
      default_next_node_key: "check-modification",
      provenance: "agency_standard",
    },
    {
      node_key: "check-modification",
      node_type: "question",
      title: "Modificación precisa",
      prompt:
        "¿El procedimiento recibe la modificación o actualización precisa solicitada?",
      why_it_matters:
        "La rectificación exige conocer el valor correcto pretendido.",
      fact_key: "rights.rectification.precise_modification",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.precise_modification",
        "Recepción de la modificación precisa verificada.",
      ),
      evidence_to_review: ["procedimiento de rectificación"],
      required_facts: [],
      default_next_node_key: "check-supporting",
      provenance: "agency_standard",
    },
    {
      node_key: "check-supporting",
      node_type: "question",
      title: "Antecedentes de respaldo",
      prompt:
        "¿El procedimiento recibe antecedentes de respaldo cuando corresponda?",
      why_it_matters:
        "El respaldo acredita la corrección sin convertirlo en barrera.",
      fact_key: "rights.rectification.supporting_records",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.supporting_records",
        "Recepción de antecedentes prevista.",
      ),
      evidence_to_review: ["procedimiento de rectificación"],
      required_facts: [],
      default_next_node_key: "check-systems",
      provenance: "agency_standard",
    },
    {
      node_key: "check-systems",
      node_type: "question",
      title: "Corrección en sistemas",
      prompt:
        "¿La empresa puede ejecutar la modificación en las fuentes y sistemas aplicables?",
      why_it_matters:
        "La rectificación no concluida en sistemas es una declaración sin efecto.",
      fact_key: "rights.rectification.systems_corrected",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.systems_corrected",
        "Capacidad de corrección verificada con data/system mapping y walkthrough.",
      ),
      evidence_to_review: ["data/system mapping", "walkthrough de corrección"],
      required_facts: [],
      default_next_node_key: "check-reuse",
      provenance: "agency_standard",
    },
    {
      node_key: "check-reuse",
      node_type: "question",
      title: "No reutilización del valor incorrecto",
      prompt:
        "¿El procedimiento impide que los datos sin rectificar vuelvan a tratarse una vez efectuada la rectificación?",
      why_it_matters:
        "Reutilizar el valor incorrecto anula la rectificación ya ejecutada.",
      fact_key: "rights.rectification.reuse_prevented",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.reuse_prevented",
        "Control contra reutilización verificado.",
      ),
      evidence_to_review: ["walkthrough de corrección", "análisis de propagación"],
      required_facts: [],
      default_next_node_key: "check-recipients",
      provenance: "agency_standard",
    },
    {
      node_key: "check-recipients",
      node_type: "question",
      title: "Destinatarios identificados",
      prompt:
        "¿El procedimiento identifica a los destinatarios a quienes los datos fueron comunicados o cedidos?",
      why_it_matters:
        "Sin identificar destinatarios no hay propagación posible.",
      fact_key: "rights.rectification.recipients_identified",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.recipients_identified",
        "Identificación de destinatarios prevista con trazabilidad de datos.",
      ),
      evidence_to_review: ["trazabilidad de datos", "propagación/corrección downstream"],
      required_facts: [],
      default_next_node_key: "check-notify",
      provenance: "agency_standard",
    },
    {
      node_key: "check-notify",
      node_type: "question",
      title: "Comunicación a destinatarios",
      prompt: "¿El procedimiento comunica la rectificación a esos destinatarios?",
      why_it_matters:
        "La rectificación debe alcanzar los tratamientos downstream.",
      fact_key: "rights.rectification.recipients_notified",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.recipients_notified",
        "Comunicación a destinatarios prevista con template.",
      ),
      evidence_to_review: ["template de comunicación a destinatarios"],
      required_facts: [],
      default_next_node_key: "check-exception",
      provenance: "agency_standard",
    },
    {
      node_key: "check-exception",
      node_type: "question",
      title: "Criterio de imposibilidad o esfuerzo desproporcionado",
      prompt:
        "¿El procedimiento contempla la excepción cuando la comunicación resulte imposible o exija esfuerzo desproporcionado, como criterio a aplicar y no como decisión anticipada de un caso?",
      why_it_matters:
        "La excepción existe como marco; invocarla en un caso real pertenece a Stage 2.",
      fact_key: "rights.rectification.exception_criterion",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.exception_criterion",
        "Criterio documentado para imposibilidad/esfuerzo desproporcionado.",
      ),
      evidence_to_review: [
        "criterio documentado para imposibilidad/esfuerzo desproporcionado",
      ],
      required_facts: [],
      default_next_node_key: "check-exception-evidence",
      provenance: "agency_standard",
    },
    {
      node_key: "check-exception-evidence",
      node_type: "question",
      title: "Fundamentación de la excepción",
      prompt:
        "¿El procedimiento exige que cualquier invocación de esa excepción quede fundamentada y evidenciada?",
      why_it_matters:
        "Una excepción sin fundamento es una vía de elusión de la propagación.",
      fact_key: "rights.rectification.exception_evidenced",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.exception_evidenced",
        "Exigencia de fundamentación verificada.",
      ),
      evidence_to_review: [
        "criterio documentado para imposibilidad/esfuerzo desproporcionado",
      ],
      required_facts: [],
      default_next_node_key: "check-blocking",
      provenance: "agency_standard",
    },
    {
      node_key: "check-blocking",
      node_type: "question",
      title: "Coordinación con bloqueo",
      prompt:
        "¿El procedimiento coordina la eventual solicitud de bloqueo temporal mientras se resuelve la rectificación?",
      why_it_matters:
        "El bloqueo protege los datos mientras la rectificación está pendiente.",
      fact_key: "rights.rectification.blocking_coordinated",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.blocking_coordinated",
        "Coordinación con bloqueo prevista.",
      ),
      evidence_to_review: ["procedimiento de rectificación"],
      required_facts: [],
      default_next_node_key: "check-common",
      related_activity_keys: ["rights.blocking_enable"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-common",
      node_type: "question",
      title: "Procedimiento y plazos comunes",
      prompt:
        "¿La rectificación utiliza el procedimiento y los plazos comunes de D4.01?",
      why_it_matters:
        "Los plazos y cauces son los del mecanismo general, sin duplicarlos.",
      fact_key: "rights.rectification.common_procedure",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.common_procedure",
        "Uso del procedimiento común verificado.",
      ),
      evidence_to_review: ["simulación controlada"],
      required_facts: [],
      default_next_node_key: "synthesis",
      related_activity_keys: ["rights.exercise_mechanism_design"],
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la rectificación",
      prompt:
        "El sistema verifica el mecanismo general de D4.01 y la capacidad de rectificación y propagación.",
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
            "La atención de la rectificación solo está completa sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un punto de rectificación requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de capacidad de rectificación que requieren corrección.",
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
          rule_id: "rectification-complete",
          description:
            "Mecanismo diseñado y capacidad de rectificación verificada.",
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
          goto_outcome_key: "rectification_enabled",
          explanation:
            "La empresa puede rectificar y propagar rectificaciones con sus criterios y controles.",
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
      outcome_key: "rectification_enabled",
      label: "Atención de la rectificación habilitada",
      classification: "agency_standard",
      explanation:
        "La empresa dispone de procedimiento y capacidad para rectificar y propagar modificaciones. Esto valida la capacidad, sin decidir casos individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.rectification_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva el procedimiento de rectificación, el data/system mapping, la evidencia de propagación downstream, el template de comunicación y el criterio de excepción con su walkthrough.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "La atención de la rectificación solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
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
      label: "Requiere correcciones de rectificación",
      classification: "agency_standard",
      explanation:
        "Al menos un punto de rectificación requiere corrección. Completa la capacidad faltante.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada punto pendiente y vuelve a verificar la capacidad de rectificación.",
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
