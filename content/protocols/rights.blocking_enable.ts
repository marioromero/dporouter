import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.06.
 *
 * activity_key = rights.blocking_enable (procedure, company scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, dependencias y state effect del contenido
 * canónico D4.06. Verifica la capacidad de suspender temporalmente
 * operaciones de tratamiento sin administrar bloqueos reales.
 *
 * El plazo especial de 2 días hábiles se verifica como requisito
 * de capacidad del procedimiento (matriz de plazo especial,
 * template de decisión): NO se crea timer, dueAt, calendar engine
 * ni scheduler de días hábiles. Sin BlockingRequest, sin lifecycle
 * persistente: la transición al resolver el derecho principal se
 * verifica como regla, no como historial.
 *
 * Dependencia de completitud hacia D4.01 vía fact externo
 * `rights.exercise_mechanism_status`. Metodología `agency_standard`.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.blocking.joint_request_covered",
  "rights.blocking.alternative_covered",
  "rights.blocking.founded_request",
  "rights.blocking.two_day_capacity",
  "rights.blocking.treatment_halted",
  "rights.blocking.storage_permitted",
  "rights.blocking.suspension_executed",
  "rights.blocking.rejection_founded",
  "rights.blocking.agency_communication",
  "rights.blocking.complaint_route",
  "rights.blocking.transition_resolved",
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
    options: verifyOptions(factKey, yesHint),
    evidence_to_review: evidence,
    required_facts: [],
    default_next_node_key: next,
    ...(related ? { related_activity_keys: related } : {}),
    provenance: "agency_standard",
  };
}

export const RIGHTS_BLOCKING_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.blocking_enable.v1",
  activity_key: "rights.blocking_enable",
  version: 1,
  mode: "procedure",
  execution_scope: "company",
  title: "Habilitación guiada del bloqueo temporal",
  description:
    "Verifica que la empresa pueda recibir, decidir y ejecutar oportunamente el bloqueo temporal: suspensión de operaciones con almacenamiento permitido y respuesta en 2 días hábiles como capacidad. Sin timers ni casos reales.",
  entry_node_key: "check-joint-request",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    node(
      "check-joint-request",
      "Bloqueo junto al derecho principal",
      "¿El procedimiento reconoce que puede solicitarse bloqueo junto con rectificación, supresión u oposición mientras la solicitud principal esté pendiente?",
      "El bloqueo vive acompañado del derecho principal en trámite.",
      "rights.blocking.joint_request_covered",
      "Solicitud conjunta contemplada.",
      ["procedimiento"],
      "check-alternative",
    ),
    node(
      "check-alternative",
      "Bloqueo como alternativa a supresión",
      "¿El procedimiento reconoce el bloqueo como alternativa a la supresión en los casos previstos por el art. 7?",
      "En esos casos el bloqueo sustituye a la eliminación.",
      "rights.blocking.alternative_covered",
      "Alternativa del art. 7 contemplada.",
      ["procedimiento", "matriz de plazo especial"],
      "check-founded",
    ),
    node(
      "check-founded",
      "Solicitud fundada",
      "¿El procedimiento recibe una solicitud de bloqueo fundada?",
      "La fundación habilita decidir sin arbitrariedad.",
      "rights.blocking.founded_request",
      "Recepción de solicitud fundada prevista.",
      ["procedimiento", "template de decisión"],
      "check-two-day",
    ),
    node(
      "check-two-day",
      "Capacidad de responder en 2 días hábiles",
      "¿El procedimiento asegura capacidad para responder dentro de 2 días hábiles desde la recepción, sin implementar timers ni vencimientos calculados?",
        "El plazo especial es un requisito de capacidad: la empresa debe poder responder a tiempo, sin motor de vencimientos.",
      "rights.blocking.two_day_capacity",
      "Capacidad de respuesta en plazo verificada con matriz y prueba controlada.",
      ["matriz de plazo especial", "walkthrough o prueba controlada"],
      "check-halt",
    ),
    node(
      "check-halt",
      "Detención del tratamiento",
      "¿El procedimiento impide el tratamiento de los datos comprendidos mientras la solicitud de bloqueo no sea resuelta?",
      "Bloquear sin detener es una suspensión nominal.",
      "rights.blocking.treatment_halted",
      "Detención verificada con walkthrough técnico.",
      ["capacidad técnica de suspensión", "walkthrough técnico", "simulación de suspensión"],
      "check-storage",
    ),
    node(
      "check-storage",
      "Almacenamiento permitido",
      "¿El procedimiento mantiene permitido el almacenamiento de los datos bloqueados?",
      "El bloqueo suspende operaciones, no borra el depósito.",
      "rights.blocking.storage_permitted",
      "Almacenamiento sin tratamiento verificado.",
      ["prueba de almacenamiento sin tratamiento", "configuración/controles"],
      "check-suspension",
    ),
    node(
      "check-suspension",
      "Ejecución de la suspensión",
      "¿La empresa puede ejecutar la suspensión temporal correspondiente cuando el bloqueo se concede?",
      "Conceder sin ejecutar deja el bloqueo en el papel.",
      "rights.blocking.suspension_executed",
      "Ejecución verificada con prueba controlada.",
      ["capacidad técnica de suspensión", "walkthrough o prueba controlada"],
      "check-rejection",
    ),
    node(
      "check-rejection",
      "Rechazo fundado",
      "¿El procedimiento exige fundamentación cuando el bloqueo se rechaza?",
      "Todo rechazo debe poder defenderse con razones.",
      "rights.blocking.rejection_founded",
      "Fundamentación del rechazo exigida con template.",
      ["template de decisión"],
      "check-agency",
    ),
    node(
      "check-agency",
      "Comunicación a la Agencia",
      "¿El procedimiento prevé la comunicación electrónica del rechazo a la Agencia?",
      "El rechazo se comunica electrónicamente a la autoridad.",
      "rights.blocking.agency_communication",
      "Mecanismo de comunicación previsto.",
      ["mecanismo de comunicación a Agencia"],
      "check-complaint",
    ),
    node(
      "check-complaint",
      "Ruta de reclamación",
      "¿El procedimiento informa y gestiona la ruta de reclamación legal aplicable al bloqueo?",
      "El titular debe conocer su vía frente al rechazo.",
      "rights.blocking.complaint_route",
      "Ruta de reclamación incorporada.",
      ["procedimiento", "template de decisión"],
      "check-transition",
    ),
    node(
      "check-transition",
      "Transición al resolver el derecho principal",
      "¿El procedimiento resuelve la transición cuando termina la solicitud principal, sin crear lifecycle persistente en Stage 1?",
      "La transición es una regla del procedimiento, no un historial de casos.",
      "rights.blocking.transition_resolved",
      "Regla de transición verificada en revisión procedimental.",
      ["revisión procedimental"],
      "synthesis",
      ["rights.exercise_mechanism_design"],
    ),
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis del bloqueo",
      prompt:
        "El sistema verifica el mecanismo general de D4.01 y la capacidad de bloqueo temporal.",
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
            "El bloqueo solo está completo sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un punto del bloqueo requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de capacidad de bloqueo que requieren corrección.",
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
          rule_id: "blocking-complete",
          description:
            "Mecanismo diseñado con capacidad de bloqueo verificada.",
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
          goto_outcome_key: "blocking_enabled",
          explanation:
            "La empresa puede suspender temporalmente operaciones con almacenamiento permitido y responder en plazo como capacidad.",
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
      outcome_key: "blocking_enabled",
      label: "Bloqueo temporal habilitado",
      classification: "agency_standard",
      explanation:
        "La empresa dispone de procedimiento y capacidad técnica de bloqueo temporal. Esto valida la capacidad, sin administrar bloqueos reales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.blocking_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva el procedimiento, la evidencia de capacidad técnica de suspensión, la configuración y controles, la matriz de plazo especial, el template de decisión, el mecanismo de comunicación a la Agencia y el walkthrough o prueba controlada.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "El bloqueo solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
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
      label: "Requiere correcciones de bloqueo",
      classification: "agency_standard",
      explanation:
        "Al menos un punto del bloqueo requiere corrección. Completa la capacidad faltante.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada punto pendiente y vuelve a verificar la capacidad de bloqueo.",
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
