import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.01.
 *
 * activity_key = rights.exercise_mechanism_design (procedure, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, dependencias y state effect del
 * contenido canónico D4.01. Diseña y valida el mecanismo general para
 * el ejercicio de derechos; nunca administra solicitudes reales.
 *
 * Sin RightRequest, sin DataSubject, sin timers: los plazos legales
 * (30 días corridos, una prórroga hasta 30 días, reclamo ante la
 * Agencia) se verifican como capacidad del procedimiento, nunca como
 * vencimientos calculados. Sin montos de costos: solo reglas de
 * gratuidad y coordinación con instrucciones de la Agencia.
 *
 * Condicionales honestos (representante/mandatario, herederos,
 * prórroga, denegación, responsable no constituido en Chile, acceso
 * repetido, bloqueo) usan la opción explícita "No aplica en este
 * caso" donde la ausencia es legítima: la ausencia legítima nunca es
 * incumplimiento. `reasoning_record_required = false`: sin juicio,
 * sin ReasoningRecord. Sin dependencias: D4.01 es raíz del dominio.
 *
 * Metodología `legal_requirement` en el outcome positivo (la ley
 * exige el mecanismo); templates, walkthrough y matrices son método
 * y nunca se presentan como prescritos por ley.
 */

const CHECKS = [
  "rights.mechanism.channels_defined",
  "rights.mechanism.ease_effectiveness",
  "rights.mechanism.standing_covered",
  "rights.mechanism.heirs_covered",
  "rights.mechanism.authentication_designed",
  "rights.mechanism.request_data_covered",
  "rights.mechanism.per_right_records",
  "rights.mechanism.access_simplicity",
  "rights.mechanism.receipt_issued",
  "rights.mechanism.classification_routing",
  "rights.mechanism.deadline_30_capacity",
  "rights.mechanism.extension_covered",
  "rights.mechanism.response_form",
  "rights.mechanism.remission_proof",
  "rights.mechanism.denial_founded",
  "rights.mechanism.complaint_info",
  "rights.mechanism.blocking_routed",
  "rights.mechanism.gratuity_rules",
  "rights.mechanism.foreign_entity_covered",
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

function verifyOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "El punto fue verificado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "El punto aún no está cubierto en el mecanismo.",
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
      label: "Pendiente",
      description: "El punto aún no está cubierto en el mecanismo.",
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

export const RIGHTS_EXERCISE_MECHANISM_DESIGN_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.exercise_mechanism_design.v1",
  activity_key: "rights.exercise_mechanism_design",
  version: 1,
  mode: "procedure",
  execution_scope: "company",
  title: "Diseño guiado del mecanismo general de ejercicio de derechos",
  description:
    "Verifica que el responsable disponga de un mecanismo general, operativo y documentado para recibir, tramitar y responder el ejercicio de derechos: canales, autenticación, acuse, plazos como capacidad, respuesta, denegación fundada, reclamo, gratuidad y coordinación con bloqueo. No administra solicitudes reales.",
  entry_node_key: "check-channels",
  decision_fact_keys: [...CHECKS],
  last_review: "2026-09-24",
  provenance: "legal_requirement",
  nodes: [
    {
      node_key: "check-channels",
      node_type: "question",
      title: "Canales de recepción",
      prompt:
        "¿Están identificados el o los canales para recibir solicitudes: correo electrónico, formulario de contacto o medio electrónico equivalente?",
      why_it_matters:
        "Cubre el paso canónico 1: sin canal identificado no hay ejercicio posible.",
      fact_key: "rights.mechanism.channels_defined",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.channels_defined"),
      evidence_to_review: ["canales habilitados", "formularios/templates"],
      required_facts: [],
      default_next_node_key: "check-ease",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-ease",
      node_type: "question",
      title: "Sencillez y eficacia",
      prompt:
        "¿Los mecanismos y herramientas son sencillos en su operación y permiten un ejercicio expedito, ágil y eficaz?",
      why_it_matters:
        "Cubre el paso canónico 2: la ley exige sencillez operativa y eficacia del ejercicio.",
      fact_key: "rights.mechanism.ease_effectiveness",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.ease_effectiveness"),
      evidence_to_review: ["prueba o walkthrough del proceso"],
      required_facts: [],
      default_next_node_key: "check-standing",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-standing",
      node_type: "question",
      title: "Titular, representante y mandatario",
      prompt:
        "¿El procedimiento atiende solicitudes del propio titular, su representante legal o mandatario, según corresponda?",
      why_it_matters:
        "Cubre el paso canónico 3: la legitimación para ejercer determina quién puede solicitar.",
      fact_key: "rights.mechanism.standing_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.standing_covered"),
      evidence_to_review: ["procedimiento general de ejercicio de derechos"],
      required_facts: [],
      default_next_node_key: "check-heirs",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-heirs",
      node_type: "question",
      title: "Ejercicio por herederos",
      prompt:
        "¿El procedimiento incorpora el ejercicio por herederos cuando legalmente proceda, con sus limitaciones, o no procede en este caso?",
      why_it_matters:
        "Cubre el paso canónico 4, condicional: solo cuando el ejercicio por herederos proceda legalmente.",
      fact_key: "rights.mechanism.heirs_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "rights.mechanism.heirs_covered",
        "El ejercicio por herederos no procede legalmente en este caso.",
      ),
      evidence_to_review: ["procedimiento general de ejercicio de derechos"],
      required_facts: [],
      default_next_node_key: "check-authentication",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-authentication",
      node_type: "question",
      title: "Autenticación",
      prompt:
        "¿El mecanismo de autenticación está diseñado conforme a los procedimientos, formas y modalidades que establezca la Agencia?",
      why_it_matters:
        "Cubre el paso canónico 5: autenticar sin bloquear ilegítimamente el ejercicio.",
      fact_key: "rights.mechanism.authentication_designed",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.authentication_designed"),
      evidence_to_review: ["diseño de autenticación", "roles y responsables internos"],
      required_facts: [],
      default_next_node_key: "check-request-data",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-request-data",
      node_type: "question",
      title: "Datos mínimos de la solicitud",
      prompt:
        "¿La solicitud captura como mínimo la individualización correspondiente, un medio válido para comunicar la respuesta y permite identificar los datos o el tratamiento respecto de los cuales se ejerce el derecho?",
      why_it_matters:
        "Cubre los pasos canónicos 6 y 7: individualización, medio de respuesta e identificación del objeto del derecho.",
      fact_key: "rights.mechanism.request_data_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.request_data_covered"),
      evidence_to_review: ["formularios/templates", "matriz de requisitos por derecho"],
      required_facts: [],
      default_next_node_key: "check-per-right-records",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-per-right-records",
      node_type: "question",
      title: "Antecedentes por derecho específico",
      prompt:
        "¿El procedimiento incorpora los antecedentes adicionales exigibles según el derecho específico: rectificación, supresión u oposición?",
      why_it_matters:
        "Cubre el paso canónico 8: cada derecho exige antecedentes propios.",
      fact_key: "rights.mechanism.per_right_records",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.per_right_records"),
      evidence_to_review: ["matriz de requisitos por derecho"],
      required_facts: [],
      default_next_node_key: "check-access-simplicity",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-access-simplicity",
      node_type: "question",
      title: "Acceso sin requisitos adicionales",
      prompt:
        "¿El procedimiento evita imponer al derecho de acceso requisitos adicionales incompatibles con su regla legal específica?",
      why_it_matters:
        "Cubre el paso canónico 9: el acceso tiene un umbral procedimental propio que no admite recargos.",
      fact_key: "rights.mechanism.access_simplicity",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.access_simplicity"),
      evidence_to_review: ["matriz de requisitos por derecho", "formularios/templates"],
      required_facts: [],
      default_next_node_key: "check-receipt",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-receipt",
      node_type: "question",
      title: "Acuse de recibo",
      prompt: "¿El mecanismo genera acuse de recibo de cada solicitud?",
      why_it_matters:
        "Cubre el paso canónico 10: el acuse fija el ingreso y habilita el cómputo del plazo.",
      fact_key: "rights.mechanism.receipt_issued",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.receipt_issued"),
      evidence_to_review: ["modelos de acuse/respuesta/denegación"],
      required_facts: [],
      default_next_node_key: "check-classification",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-classification",
      node_type: "question",
      title: "Clasificación y derivación",
      prompt:
        "¿El procedimiento clasifica correctamente el derecho ejercido y lo deriva a su procedimiento específico?",
      why_it_matters:
        "Cubre el paso canónico 11: una mala clasificación desvía el caso a un cauce equivocado.",
      fact_key: "rights.mechanism.classification_routing",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.classification_routing"),
      evidence_to_review: ["procedimiento general de ejercicio de derechos"],
      required_facts: [],
      default_next_node_key: "check-deadline",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-deadline",
      node_type: "question",
      title: "Plazo general de 30 días corridos",
      prompt:
        "¿El procedimiento asegura capacidad para responder dentro del plazo general máximo de 30 días corridos desde el ingreso, sin operar como un timer de casos reales?",
      why_it_matters:
        "Cubre el paso canónico 12: el plazo es un requisito de capacidad del procedimiento, no un vencimiento calculado en Stage 1.",
      fact_key: "rights.mechanism.deadline_30_capacity",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.deadline_30_capacity"),
      evidence_to_review: ["matriz de plazos"],
      required_facts: [],
      default_next_node_key: "check-extension",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-extension",
      node_type: "question",
      title: "Prórroga única",
      prompt:
        "¿El procedimiento contempla una sola prórroga, cuando corresponda, por hasta 30 días corridos adicionales?",
      why_it_matters:
        "Cubre el paso canónico 13, condicional: la prórroga es única y acotada.",
      fact_key: "rights.mechanism.extension_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.extension_covered"),
      evidence_to_review: ["matriz de plazos"],
      required_facts: [],
      default_next_node_key: "check-response-form",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-response-form",
      node_type: "question",
      title: "Forma de respuesta",
      prompt:
        "¿El procedimiento asegura respuesta escrita al domicilio, correo electrónico u otro medio fijado por el titular?",
      why_it_matters:
        "Cubre el paso canónico 14: la respuesta debe llegar por el medio fijado por el titular.",
      fact_key: "rights.mechanism.response_form",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.response_form"),
      evidence_to_review: ["modelos de acuse/respuesta/denegación"],
      required_facts: [],
      default_next_node_key: "check-remission-proof",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-remission-proof",
      node_type: "question",
      title: "Respaldo de remisión",
      prompt:
        "¿El mecanismo conserva la capacidad de demostrar remisión, fecha y contenido íntegro de la respuesta?",
      why_it_matters:
        "Cubre el paso canónico 15: sin respaldo de remisión la respuesta no es acreditable.",
      fact_key: "rights.mechanism.remission_proof",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.remission_proof"),
      evidence_to_review: ["mecanismo previsto para conservar respaldo de remisión"],
      required_facts: [],
      default_next_node_key: "check-denial",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-denial",
      node_type: "question",
      title: "Denegación fundada",
      prompt:
        "¿El procedimiento exige, ante denegación total o parcial, fundamentación de la causa y de los antecedentes que la justifican?",
      why_it_matters:
        "Cubre el paso canónico 16: denegar sin fundamento deja al titular sin defensa.",
      fact_key: "rights.mechanism.denial_founded",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.denial_founded"),
      evidence_to_review: ["modelos de acuse/respuesta/denegación"],
      required_facts: [],
      default_next_node_key: "check-complaint",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-complaint",
      node_type: "question",
      title: "Reclamo ante la Agencia",
      prompt:
        "¿La denegación incorpora información sobre el derecho a reclamar ante la Agencia y el plazo legal aplicable?",
      why_it_matters:
        "Cubre el paso canónico 17: el titular denegado debe conocer su vía de reclamo.",
      fact_key: "rights.mechanism.complaint_info",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.complaint_info"),
      evidence_to_review: ["modelos de acuse/respuesta/denegación"],
      required_facts: [],
      default_next_node_key: "check-blocking",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-blocking",
      node_type: "question",
      title: "Ruta de bloqueo temporal",
      prompt:
        "¿El procedimiento incorpora la ruta especial de bloqueo temporal hacia D4.06 cuando corresponda?",
      why_it_matters:
        "Cubre el paso canónico 18: el bloqueo protege mientras se resuelve el derecho principal.",
      fact_key: "rights.mechanism.blocking_routed",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.blocking_routed"),
      evidence_to_review: ["procedimiento general de ejercicio de derechos"],
      required_facts: [],
      default_next_node_key: "check-gratuity",
      related_activity_keys: ["rights.blocking_enable"],
      provenance: "legal_requirement",
    },
    {
      node_key: "check-gratuity",
      node_type: "question",
      title: "Gratuidad y costos",
      prompt:
        "¿Las reglas de gratuidad están definidas (rectificación, supresión y oposición siempre gratuitas; acceso gratuito al menos trimestralmente) y, para acceso y portabilidad repetidos en el trimestre, solo prevén costos directos permitidos según instrucciones de la Agencia, sin inventar montos?",
      why_it_matters:
        "Cubre los pasos canónicos 19 y 20: la gratuidad es regla; el cobro es excepción acotada a costos directos.",
      fact_key: "rights.mechanism.gratuity_rules",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.gratuity_rules"),
      evidence_to_review: ["reglas de gratuidad/costos"],
      required_facts: [],
      default_next_node_key: "check-foreign-entity",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-foreign-entity",
      node_type: "question",
      title: "Responsable no constituido en Chile",
      prompt:
        "¿Se verificó el medio o representación electrónica exigida cuando el responsable es persona jurídica no constituida en Chile y aplica la regla legal correspondiente, o no aplica en este caso?",
      why_it_matters:
        "Cubre el paso canónico 21, condicional: solo para responsables no constituidos en Chile alcanzados por la regla.",
      fact_key: "rights.mechanism.foreign_entity_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "rights.mechanism.foreign_entity_covered",
        "El responsable está constituido en Chile o la regla no resulta aplicable.",
      ),
      evidence_to_review: ["procedimiento general de ejercicio de derechos"],
      required_facts: [],
      default_next_node_key: "synthesis",
      provenance: "legal_requirement",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis del mecanismo",
      prompt:
        "El sistema verifica si el mecanismo general cubre todos los puntos exigibles.",
      answer_type: "none",
      required_facts: [...CHECKS],
      transitions: [
        {
          rule_id: "gaps-found",
          description: "Al menos un punto exigible del mecanismo está pendiente.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen puntos del mecanismo por cubrir antes de declararlo diseñado.",
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
          rule_id: "mechanism-complete",
          description:
            "Todos los puntos exigibles verificados o legítimamente no aplicables.",
          when: { op: "all", conditions: CHECKS.map(satisfied) },
          goto_outcome_key: "mechanism_designed",
          explanation:
            "El mecanismo general cubre los puntos exigibles en este caso. Esto valida el diseño del procedimiento, no la atención de solicitudes reales.",
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
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "mechanism_designed",
      label: "Mecanismo general diseñado",
      classification: "legal_requirement",
      explanation:
        "El mecanismo general cubre los puntos exigibles en este caso. Esto valida el diseño del procedimiento y su capacidad, no la atención de solicitudes reales ni el cumplimiento integral de la empresa.",
      provenance: "legal_requirement",
      canonical_fact_effects: [
        { fact_key: "rights.exercise_mechanism_status", value: "designed" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Habilitar la atención del derecho de acceso en D4.02",
          activity_key: "rights.access_enable",
        },
        {
          kind: "activity",
          label: "Habilitar la atención de rectificación en D4.03",
          activity_key: "rights.rectification_enable",
        },
        {
          kind: "activity",
          label: "Habilitar la atención de supresión en D4.04",
          activity_key: "rights.suppression_enable",
        },
        {
          kind: "activity",
          label: "Habilitar la atención de oposición en D4.05",
          activity_key: "rights.opposition_enable",
        },
        {
          kind: "activity",
          label: "Habilitar el bloqueo temporal en D4.06",
          activity_key: "rights.blocking_enable",
        },
        {
          kind: "activity",
          label: "Habilitar la portabilidad en D4.07",
          activity_key: "rights.portability_enable",
        },
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva el procedimiento general, los canales habilitados, los formularios y templates, el diseño de autenticación, las matrices de requisitos y plazos, las reglas de gratuidad, los modelos de acuse/respuesta/denegación y la prueba o walkthrough del proceso.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "El mecanismo requiere completar puntos",
      classification: "agency_standard",
      explanation:
        "Al menos un punto exigible del mecanismo está pendiente. Completa el diseño antes de declararlo operativo.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Completar los puntos pendientes",
          note: "Atiende cada punto pendiente del procedimiento general y vuelve a verificar el mecanismo.",
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
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
  ],
};
