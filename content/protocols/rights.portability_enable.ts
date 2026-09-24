import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.07.
 *
 * activity_key = rights.portability_enable (checklist, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente elegibilidad, pasos, evidencia, dependencias y
 * state effect del contenido canónico D4.07.
 *
 * La elegibilidad (tratamiento automatizado Y base de
 * consentimiento, sobre datos facilitados por el titular) se
 * verifica como capacidad de evaluar, sin materializar ni
 * modificar facts de D2/D3: si existen se consumen como contexto,
 * si no, la empresa igualmente evalúa documentalmente. La
 * transmisión directa es condicional a posibilidad técnica: no se
 * impone interoperabilidad absoluta. Portabilidad no implica
 * supresión salvo solicitud conjunta.
 *
 * Dependencia de completitud hacia D4.01 vía fact externo
 * `rights.exercise_mechanism_status`. Metodología `agency_standard`.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.portability.eligibility_automated",
  "rights.portability.eligibility_consent",
  "rights.portability.provided_data",
  "rights.portability.structured_format",
  "rights.portability.interoperable",
  "rights.portability.transfer_to_controller",
  "rights.portability.expedient_means",
  "rights.portability.no_obstacles",
  "rights.portability.clear_instructions",
  "rights.portability.technical_characteristics",
  "rights.portability.direct_transmission",
  "rights.portability.no_auto_deletion",
  "rights.portability.gratuity_coordinated",
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

export const RIGHTS_PORTABILITY_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.portability_enable.v1",
  activity_key: "rights.portability_enable",
  version: 1,
  mode: "checklist",
  execution_scope: "company",
  title: "Habilitación guiada de la portabilidad",
  description:
    "Verifica la capacidad técnica y procedimental para atender la portabilidad cuando concurran sus requisitos: elegibilidad, formato interoperable, transmisión y gratuidad. Evalúa capacidad, sin exportar datos reales.",
  entry_node_key: "check-eligibility-automated",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    node(
      "check-eligibility-automated",
      "Elegibilidad: tratamiento automatizado",
      "¿El procedimiento evalúa si el tratamiento es automatizado como primer requisito de elegibilidad?",
      "La portabilidad exige tratamiento automatizado; sin él no procede.",
      "rights.portability.eligibility_automated",
      "Evaluación de automatización prevista.",
      ["procedimiento"],
      "check-eligibility-consent",
    ),
    node(
      "check-eligibility-consent",
      "Elegibilidad: base de consentimiento",
      "¿El procedimiento evalúa si el tratamiento se basa en consentimiento, consumiendo D2/D3 como contexto cuando existan y sin modificar sus verdades?",
      "Segundo requisito de elegibilidad: la base debe ser consentimiento. D4 no redefine la base de licitud.",
      "rights.portability.eligibility_consent",
      "Evaluación de base prevista sin duplicar D2/D3.",
      ["procedimiento"],
      "check-provided-data",
    ),
    node(
      "check-provided-data",
      "Datos facilitados por el titular",
      "¿El procedimiento identifica los datos personales concernientes al titular que éste haya facilitado al responsable?",
      "La portabilidad alcanza los datos facilitados por el titular, no todo el repositorio.",
      "rights.portability.provided_data",
      "Delimitación de datos prevista.",
      ["procedimiento"],
      "check-format",
    ),
    node(
      "check-format",
      "Formato estructurado",
      "¿La empresa puede generar copia en formato electrónico estructurado, genérico y de uso común?",
      "El formato debe ser estructurado y de uso común, no propietario.",
      "rights.portability.structured_format",
      "Formato de exportación verificado.",
      ["formato de exportación", "especificación técnica"],
      "check-interoperable",
    ),
    node(
      "check-interoperable",
      "Interoperabilidad",
      "¿El formato puede ser operado por distintos sistemas, verificado con prueba de interoperabilidad?",
      "Interoperable significa operable por otros sistemas, no promesa abstracta.",
      "rights.portability.interoperable",
      "Interoperabilidad probada.",
      ["prueba de interoperabilidad", "export test"],
      "check-transfer",
    ),
    node(
      "check-transfer",
      "Comunicación a otro responsable",
      "¿El procedimiento permite la comunicación o transferencia de los datos a otro responsable?",
      "El titular puede llevar sus datos a otro responsable.",
      "rights.portability.transfer_to_controller",
      "Mecanismo de transmisión previsto.",
      ["mecanismo de transmisión", "walkthrough"],
      "check-expedient",
    ),
    node(
      "check-expedient",
      "Medios expeditos y menos onerosos",
      "¿La transmisión utiliza medios expeditos y menos onerosos?",
      "La portabilidad no admite dilaciones ni encarecimientos artificiales.",
      "rights.portability.expedient_means",
      "Medios expeditos verificados.",
      ["mecanismo de transmisión"],
      "check-obstacles",
    ),
    node(
      "check-obstacles",
      "Sin trabas ni obstáculos",
      "¿El procedimiento evita imponer trabas u obstáculos a la portabilidad?",
      "Las trabas convierten el derecho en ilusorio.",
      "rights.portability.no_obstacles",
      "Ausencia de obstáculos verificada.",
      ["revisión procedimental", "walkthrough"],
      "check-instructions",
    ),
    node(
      "check-instructions",
      "Instrucciones al titular",
      "¿El procedimiento informa clara y precisamente las medidas necesarias para obtener los datos?",
      "El titular debe saber cómo obtener sus datos.",
      "rights.portability.clear_instructions",
      "Instrucciones claras previstas.",
      ["instrucciones al titular"],
      "check-technical",
    ),
    node(
      "check-technical",
      "Características técnicas",
      "¿El procedimiento informa las características técnicas de la operación?",
      "La transparencia técnica permite ejercer el derecho con conocimiento.",
      "rights.portability.technical_characteristics",
      "Información técnica prevista.",
      ["especificación técnica", "instrucciones al titular"],
      "check-direct",
    ),
    {
      node_key: "check-direct",
      node_type: "question",
      title: "Transmisión directa",
      prompt:
        "¿El procedimiento habilita la transmisión directa responsable a responsable cuando sea técnicamente posible, o no es técnicamente posible en este caso?",
      why_it_matters:
        "Condicional: la transmisión directa se exige cuando sea técnicamente posible, sin imponer interoperabilidad absoluta.",
      fact_key: "rights.portability.direct_transmission",
      answer_type: "single_select",
      options: conditionalOptions(
        "rights.portability.direct_transmission",
        "La transmisión directa no es técnicamente posible; se mantiene la entrega al titular.",
      ),
      evidence_to_review: ["análisis de transmisión directa", "mecanismo de transmisión"],
      required_facts: [],
      default_next_node_key: "check-no-deletion",
      provenance: "agency_standard",
    },
    node(
      "check-no-deletion",
      "Portabilidad sin supresión automática",
      "¿El procedimiento reconoce que la portabilidad no implica supresión ante el responsable cedente salvo solicitud conjunta?",
      "Portar no es borrar: la supresión requiere su propia solicitud.",
      "rights.portability.no_auto_deletion",
      "Regla reconocida en el procedimiento.",
      ["procedimiento"],
      "check-gratuity",
    ),
    node(
      "check-gratuity",
      "Gratuidad coordinada",
      "¿Las reglas de gratuidad y costos están coordinadas con D4.01, sin inventar montos?",
      "Los costos siguen las reglas generales del mecanismo.",
      "rights.portability.gratuity_coordinated",
      "Coordinación con D4.01 verificada.",
      ["procedimiento"],
      "synthesis",
      ["rights.exercise_mechanism_design"],
    ),
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la portabilidad",
      prompt:
        "El sistema verifica el mecanismo general de D4.01, la elegibilidad y la capacidad técnica de portabilidad.",
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
            "La portabilidad solo está completa sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un punto de portabilidad requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de elegibilidad o capacidad técnica.",
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
          rule_id: "portability-complete",
          description:
            "Mecanismo diseñado con elegibilidad y capacidad técnica verificadas.",
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
          goto_outcome_key: "portability_enabled",
          explanation:
            "La empresa puede atender portabilidades elegibles con formato y transmisión adecuados.",
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
      outcome_key: "portability_enabled",
      label: "Portabilidad habilitada",
      classification: "agency_standard",
      explanation:
        "La empresa dispone de procedimiento y validación técnica de portabilidad. Esto valida la capacidad, sin exportar datos reales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.portability_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva el procedimiento, el formato de exportación, la especificación técnica, la prueba de interoperabilidad, el mecanismo de transmisión, las instrucciones al titular, el análisis de transmisión directa y el walkthrough.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "La portabilidad solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
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
      label: "Requiere correcciones de portabilidad",
      classification: "agency_standard",
      explanation:
        "Al menos un punto requiere corrección. Completa elegibilidad o capacidad técnica.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada punto pendiente y vuelve a verificar la capacidad de portabilidad.",
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
