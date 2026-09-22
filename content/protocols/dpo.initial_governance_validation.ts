import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.09.
 *
 * activity_key = dpo.initial_governance_validation (checklist). Contenido
 * aprobado por la iteración vigente; usa exclusivamente los seis criterios
 * canónicos de gobernanza inicial, la evidencia y el state effect de D1.09.
 *
 * Calibración de modo: cada check usa yes_no_unknown con representación
 * humana explícita por check — Sí = revisado y satisfactorio, No =
 * requiere acción o corrección, Desconocido = información insuficiente.
 * Sin score global; sin usar Revisado como cumplimiento jurídico. Los
 * checks son independientes y resolvibles en cualquier orden.
 */

const CHECK_FACTS = [
  "dpo.governance.reporting_line",
  "dpo.governance.autonomy",
  "dpo.governance.conflicts",
  "dpo.governance.resources",
  "dpo.governance.suitability",
  "dpo.governance.access",
];

const DECISION_FACTS = ["dpo.designated", ...CHECK_FACTS];

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function checkOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Revisado y satisfactorio",
      description: "Verificado conforme al criterio evaluado.",
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

export const DPO_GOVERNANCE_VALIDATION_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.initial_governance_validation.v1",
  activity_key: "dpo.initial_governance_validation",
  version: 1,
  mode: "checklist",
  title: "Revisión guiada de gobernanza inicial del DPO",
  description:
    "Revisa operacionalmente que el DPO designado dispone de autonomía, independencia funcional, recursos, idoneidad, disponibilidad y ausencia de conflictos incompatibles. Cada punto distingue validado, brecha o información por acreditar.",
  entry_node_key: "designation-gate",
  decision_fact_keys: DECISION_FACTS,
  last_review: "2026-09-22",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "designation-gate",
      node_type: "question",
      title: "DPO designado",
      prompt: "¿Existe actualmente un DPO designado?",
      why_it_matters:
        "Esta validación recae sobre la gobernanza efectiva del DPO designado. Sin designación corresponde designar primero.",
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
      evidence_to_review: [
        "expediente de designación",
        "comunicación interna de la designación",
      ],
      required_facts: [],
      default_next_node_key: "check-reporting-line",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay gobernanza que validar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. La validación de gobernanza requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-reporting-line",
      node_type: "question",
      title: "Línea de rendición directa",
      prompt:
        "¿El DPO rinde directamente a la autoridad que lo designó?",
      why_it_matters:
        "La rendición directa sostiene la autonomía funcional del DPO frente a la administración.",
      fact_key: "dpo.governance.reporting_line",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.reporting_line"),
      evidence_to_review: [
        "organigrama o línea de reporte",
        "ficha de validación de gobernanza",
      ],
      help_text: [
        "Revisa a quién reporta formalmente el DPO y si esa línea llega sin intermediación a la autoridad que lo designó.",
      ],
      required_facts: [],
      default_next_node_key: "check-autonomy",
      provenance: "agency_standard",
    },
    {
      node_key: "check-autonomy",
      node_type: "question",
      title: "Autonomía en protección de datos",
      prompt:
        "¿El DPO actúa con autonomía respecto de la administración en materias de protección de datos?",
      why_it_matters:
        "Sin autonomía funcional el DPO no puede desempeñar su función con independencia.",
      fact_key: "dpo.governance.autonomy",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.autonomy"),
      evidence_to_review: [
        "organigrama o línea de reporte",
        "ficha de validación de gobernanza",
      ],
      help_text: [
        "Verifica que la administración no instruya ni limite el criterio del DPO en materias de protección de datos.",
      ],
      required_facts: [],
      default_next_node_key: "check-conflicts",
      provenance: "agency_standard",
    },
    {
      node_key: "check-conflicts",
      node_type: "question",
      title: "Otras funciones y conflictos",
      prompt:
        "¿Las otras funciones del DPO son compatibles, sin conflictos de interés?",
      why_it_matters:
        "Funciones incompatibles o conflictos no gestionados comprometen la independencia del DPO.",
      fact_key: "dpo.governance.conflicts",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.conflicts"),
      evidence_to_review: [
        "declaración o evaluación de conflictos",
        "ficha de validación de gobernanza",
      ],
      help_text: [
        "Analiza qué otras funciones ejerce el DPO y si alguna determina fines o medios de tratamientos que luego debe supervisar.",
      ],
      required_facts: [],
      default_next_node_key: "check-resources",
      provenance: "agency_standard",
    },
    {
      node_key: "check-resources",
      node_type: "question",
      title: "Recursos y disponibilidad",
      prompt:
        "¿El DPO dispone de recursos materiales y disponibilidad suficientes?",
      why_it_matters:
        "Sin recursos ni tiempo asignado la función queda formalmente creada pero inoperante.",
      fact_key: "dpo.governance.resources",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.resources"),
      evidence_to_review: [
        "evidencia de recursos",
        "ficha de validación de gobernanza",
      ],
      help_text: [
        "Verifica dedicación efectiva, medios materiales y acceso operativo acorde al volumen y complejidad.",
      ],
      required_facts: [],
      default_next_node_key: "check-suitability",
      provenance: "agency_standard",
    },
    {
      node_key: "check-suitability",
      node_type: "question",
      title: "Idoneidad profesional",
      prompt:
        "¿El DPO acredita conocimientos, experiencia y actualización profesional?",
      why_it_matters:
        "La idoneidad sostiene la calidad técnica de la función desde su inicio.",
      fact_key: "dpo.governance.suitability",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.suitability"),
      evidence_to_review: [
        "evidencia de idoneidad",
        "ficha de validación de gobernanza",
      ],
      help_text: [
        "Revisa formación, experiencia pertinente y actualización en la materia.",
      ],
      required_facts: [],
      default_next_node_key: "check-access",
      provenance: "agency_standard",
    },
    {
      node_key: "check-access",
      node_type: "question",
      title: "Acceso a información y operaciones",
      prompt:
        "¿El DPO puede acceder a la información y operaciones relevantes?",
      why_it_matters:
        "Sin acceso efectivo el DPO no puede supervisar ni asesorar sobre los tratamientos reales.",
      fact_key: "dpo.governance.access",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.access"),
      evidence_to_review: ["ficha de validación de gobernanza"],
      help_text: [
        "Verifica capacidad real de acceso a sistemas, procesos y personas vinculadas a los tratamientos.",
      ],
      required_facts: [],
      default_next_node_key: "final-assessment",
      provenance: "agency_standard",
    },
    {
      node_key: "final-assessment",
      node_type: "decision",
      title: "Síntesis de la validación",
      prompt:
        "El sistema distingue puntos validados, brechas e información por acreditar.",
      answer_type: "none",
      required_facts: [...DECISION_FACTS],
      transitions: [
        {
          rule_id: "gaps-found",
          description:
            "Al menos un check requiere acción o corrección.",
          when: { op: "any", conditions: CHECK_FACTS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas que requieren acción o corrección antes de dar por validada la gobernanza.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún antecedente está sin responder o con información insuficiente.",
          when: { op: "any", conditions: DECISION_FACTS.map(unresolved) },
          goto_outcome_key: "information_incomplete",
          explanation:
            "Falta información por acreditar. Con antecedentes pendientes no se emite validación definitiva.",
        },
        {
          rule_id: "all-validated",
          description:
            "DPO designado y los seis criterios revisados y satisfactorios.",
          when: {
            op: "all",
            conditions: [
              isYes("dpo.designated"),
              ...CHECK_FACTS.map(isYes),
            ],
          },
          goto_outcome_key: "governance_validated",
          explanation:
            "Todos los criterios de gobernanza inicial están revisados y satisfactorios.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin validar.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "information_incomplete",
          explanation:
            "La validación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "governance_validated",
      label: "Gobernanza inicial validada",
      classification: "agency_standard",
      explanation:
        "Los seis criterios están revisados y satisfactorios para el DPO designado, según la evidencia revisada en esta sesión.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Utilizar la validación en el modelo operativo (D1.11)",
          activity_key: "dpo.operating_model",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere acciones correctivas",
      classification: "agency_standard",
      explanation:
        "Al menos un criterio presenta brechas. Documenta cada brecha y su medida correctiva en la ficha de validación.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Documentar brechas y medidas correctivas",
          note: "Registra cada brecha detectada con su medida correctiva en la ficha de validación de gobernanza.",
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
    {
      outcome_key: "prerequisite_missing",
      label: "DPO aún no designado",
      classification: "agency_standard",
      explanation:
        "Sin DPO designado no hay gobernanza que validar.",
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
