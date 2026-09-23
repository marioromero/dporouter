import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.11.
 *
 * activity_key = dpo.operating_model (procedure). Contenido aprobado por
 * la iteración vigente; usa exclusivamente pasos, evidencia, legal basis
 * y state effect del contenido canónico D1.11. No convierte la lista
 * operacional en un árbol decisional: cinco verificaciones planas más
 * compuerta de designación y síntesis final.
 *
 * La compuerta reutiliza el fact dpo.designated ya producido por D1.09:
 * cuando la validación inicial existe, su respuesta se inyecta como
 * "Dato ya disponible" y solo se confirma vigencia. La validación
 * inicial disponible se usa como insumo (input_dependency canónica):
 * sus brechas deben informar el modelo operativo.
 */

const VERIFICATION_FACTS = [
  "dpo.designated",
  "dpo.operating.reporting",
  "dpo.operating.involvement",
  "dpo.operating.info_access",
  "dpo.operating.functions_map",
  "dpo.operating.cadence",
];

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
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

export const DPO_OPERATING_MODEL_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.operating_model.v1",
  activity_key: "dpo.operating_model",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del modelo operativo del DPO",
  description:
    "Pone en operación al DPO con reglas claras: reporte y acceso a la autoridad, eventos de involucramiento, acceso a información, mapa de funciones y cadencia de seguimiento.",
  entry_node_key: "designation-gate",
  decision_fact_keys: VERIFICATION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "designation-gate",
      node_type: "question",
      title: "DPO designado",
      prompt: "¿Existe actualmente un DPO designado?",
      why_it_matters:
        "El modelo operativo organiza el trabajo del DPO designado. Sin designación vigente corresponde designar primero.",
      fact_key: "dpo.designated",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe un DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "Aún no hay DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo.designated", value: "unknown" },
        },
      ],
      evidence_to_review: ["expediente de designación"],
      required_facts: [],
      default_next_node_key: "organize-reporting",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay modelo operativo que establecer.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. El modelo operativo requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "organize-reporting",
      node_type: "question",
      title: "Reporte y acceso a la autoridad",
      prompt:
        "¿Quedaron definidas la línea de reporte y el acceso del DPO a la autoridad?",
      why_it_matters:
        "El reporte directo sostiene la autonomía funcional del DPO en la operación diaria.",
      fact_key: "dpo.operating.reporting",
      answer_type: "single_select",
      options: stateOptions("dpo.operating.reporting"),
      evidence_to_review: [
        "carta o marco operativo DPO",
        "validación inicial D1.09 si está disponible",
      ],
      help_text: [
        "Si la validación inicial está disponible, úsala como insumo: sus brechas deben informar el modelo operativo.",
      ],
      required_facts: [],
      default_next_node_key: "organize-involvement",
      related_activity_keys: ["dpo.initial_governance_validation"],
      provenance: "agency_standard",
    },
    {
      node_key: "organize-involvement",
      node_type: "question",
      title: "Eventos de involucramiento",
      prompt:
        "¿Quedaron definidos los eventos que requieren involucramiento del DPO?",
      why_it_matters:
        "Sin eventos definidos, la participación del DPO queda a discreción de cada área y pierde oportunidad.",
      fact_key: "dpo.operating.involvement",
      answer_type: "single_select",
      options: stateOptions("dpo.operating.involvement"),
      evidence_to_review: [
        "reglas de involucramiento",
        "carta o marco operativo DPO",
      ],
      help_text: [
        "Define cómo, cuándo y con qué información participa el DPO en cada proceso alcanzado.",
      ],
      required_facts: [],
      default_next_node_key: "organize-info-access",
      provenance: "agency_standard",
    },
    {
      node_key: "organize-info-access",
      node_type: "question",
      title: "Acceso a información y operaciones",
      prompt:
        "¿Quedó definido el acceso oportuno del DPO a la información y operaciones de tratamiento?",
      why_it_matters:
        "Sin acceso efectivo el DPO no puede supervisar ni asesorar sobre los tratamientos reales.",
      fact_key: "dpo.operating.info_access",
      answer_type: "single_select",
      options: stateOptions("dpo.operating.info_access"),
      evidence_to_review: [
        "canales de acceso a información",
        "carta o marco operativo DPO",
      ],
      required_facts: [],
      default_next_node_key: "organize-functions",
      provenance: "agency_standard",
    },
    {
      node_key: "organize-functions",
      node_type: "question",
      title: "Mapa de funciones",
      prompt:
        "¿Quedaron mapeadas las funciones del DPO hacia derechos, riesgos, EIPD, capacitación, supervisión y relación con la Agencia?",
      why_it_matters:
        "El mapa traduce las funciones normativas en responsabilidades operativas concretas y coordinadas.",
      fact_key: "dpo.operating.functions_map",
      answer_type: "single_select",
      options: stateOptions("dpo.operating.functions_map"),
      evidence_to_review: [
        "matriz de funciones",
        "carta o marco operativo DPO",
        "validación inicial D1.09 si está disponible",
      ],
      required_facts: [],
      default_next_node_key: "organize-cadence",
      related_activity_keys: ["dpo.initial_governance_validation"],
      provenance: "agency_standard",
    },
    {
      node_key: "organize-cadence",
      node_type: "question",
      title: "Cadencia y seguimiento",
      prompt:
        "¿Quedaron definidas la cadencia operativa y los mecanismos de seguimiento?",
      why_it_matters:
        "Sin cadencia ni seguimiento el modelo queda en declaración y pierde vigencia operativa.",
      fact_key: "dpo.operating.cadence",
      answer_type: "single_select",
      options: stateOptions("dpo.operating.cadence"),
      evidence_to_review: [
        "cadencia de reuniones o seguimiento",
        "carta o marco operativo DPO",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del modelo operativo",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el modelo sigue en organización.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "operating_model_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El modelo aún no queda operativo.",
        },
        {
          rule_id: "all-verified",
          description:
            "Designación, reporte, involucramiento, acceso, funciones y cadencia verificados.",
          when: {
            op: "all",
            conditions: [
              isYes("dpo.designated"),
              ...VERIFICATION_FACTS.filter((f) => f !== "dpo.designated").map(
                isYes,
              ),
            ],
          },
          goto_outcome_key: "operating_model_active",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en organización.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "operating_model_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "operating_model_active",
      label: "Modelo operativo activo",
      classification: "agency_standard",
      explanation:
        "La designación, el reporte, el involucramiento, el acceso, el mapa de funciones y la cadencia quedaron verificados.",
      provenance: "agency_standard",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "dpo.operating_model_status", value: "active" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Planificar el trabajo anual con el modelo como insumo",
          activity_key: "dpo.annual_plan",
        },
        {
          kind: "info",
          label: "Conservar el modelo operativo",
          note: "Archiva la carta o marco operativo, la matriz de funciones, las reglas de involucramiento, los canales de acceso y la cadencia de seguimiento.",
        },
      ],
    },
    {
      outcome_key: "operating_model_in_progress",
      label: "Modelo en organización",
      classification: "agency_standard",
      explanation:
        "Quedan verificaciones pendientes o sin información. Completa cada punto y conserva su evidencia.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "DPO aún no designado",
      classification: "agency_standard",
      explanation:
        "Sin DPO designado no hay modelo operativo que establecer.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Designar DPO en D1.08",
          activity_key: "dpo.designate",
        },
      ],
    },
  ],
};
