import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.16.
 *
 * activity_key = dpo.governance_revalidation (checklist). Contenido
 * aprobado por la iteración vigente; usa exclusivamente los criterios,
 * evidencia, legal basis y dependencias del contenido canónico D1.16.
 * Replica la calibración de D1.09: cada check usa yes_no_unknown con
 * representación humana explícita por check. Sin score global; sin
 * usar Revisado como cumplimiento jurídico.
 *
 * La validación inicial disponible se usa como línea base de
 * comparación (input_dependency canónica). La remediación queda como
 * check explícito de apertura cuando corresponda.
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce a la revalidación
 *   verificable);
 * - product-ready: false (sin estado canónico materializable);
 * - motivo: la revalidación es periódica y exige fecha dinámica de
 *   revisión; el canon además requiere ReasoningRecord, cuya vía de
 *   juicio documentado queda diferida junto a la capa temporal. Los
 *   outcomes instruyen la documentación con su evidencia canónica.
 */

const CHECK_FACTS = [
  "dpo.revalidation.changes",
  "dpo.revalidation.conflicts",
  "dpo.revalidation.resources",
  "dpo.revalidation.updating",
  "dpo.revalidation.access",
  "dpo.revalidation.remediation",
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

export const DPO_GOVERNANCE_REVALIDATION_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.governance_revalidation.v1",
  activity_key: "dpo.governance_revalidation",
  version: 1,
  mode: "checklist",
  title: "Revisión guiada de revalidación de gobernanza del DPO",
  description:
    "Revalida periódicamente y ante cambios relevantes que la autonomía, independencia, idoneidad, recursos y ausencia de conflictos del DPO se mantengan efectivas.",
  entry_node_key: "designation-gate",
  decision_fact_keys: DECISION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "designation-gate",
      node_type: "question",
      title: "DPO designado",
      prompt: "¿Existe actualmente un DPO designado?",
      why_it_matters:
        "La revalidación recae sobre la gobernanza efectiva del DPO designado. Sin designación corresponde designar primero.",
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
      default_next_node_key: "check-changes",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay gobernanza que revalidar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. La revalidación requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-changes",
      node_type: "question",
      title: "Cambios de cargo, funciones o estructura",
      prompt:
        "¿Se revisaron los cambios de cargo, funciones o estructura que afectan al DPO?",
      why_it_matters:
        "Los cambios organizacionales pueden alterar las condiciones bajo las cuales opera el DPO.",
      fact_key: "dpo.revalidation.changes",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.revalidation.changes"),
      evidence_to_review: [
        "checklist o informe de revalidación",
        "validación inicial D1.09 como línea base cuando exista",
      ],
      required_facts: [],
      default_next_node_key: "check-conflicts",
      related_activity_keys: ["dpo.initial_governance_validation"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-conflicts",
      node_type: "question",
      title: "Conflictos de interés",
      prompt: "¿Se reevaluaron los conflictos de interés del DPO?",
      why_it_matters:
        "Nuevas funciones o vínculos pueden crear conflictos incompatibles con la función.",
      fact_key: "dpo.revalidation.conflicts",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.revalidation.conflicts"),
      evidence_to_review: [
        "checklist o informe de revalidación",
        "declaración o evaluación de conflictos",
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
        "¿Se revisó la suficiencia de recursos y disponibilidad del DPO?",
      why_it_matters:
        "Sin recursos ni tiempo la función pierde efectividad aunque la designación continúe.",
      fact_key: "dpo.revalidation.resources",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.revalidation.resources"),
      evidence_to_review: [
        "checklist o informe de revalidación",
        "evidencia revisada",
      ],
      required_facts: [],
      default_next_node_key: "check-updating",
      provenance: "agency_standard",
    },
    {
      node_key: "check-updating",
      node_type: "question",
      title: "Actualización de conocimientos",
      prompt:
        "¿Se revisó la actualización de conocimientos del DPO?",
      why_it_matters:
        "La idoneidad inicial se erosiona sin actualización profesional continua.",
      fact_key: "dpo.revalidation.updating",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.revalidation.updating"),
      evidence_to_review: [
        "checklist o informe de revalidación",
        "evidencia revisada",
      ],
      required_facts: [],
      default_next_node_key: "check-access",
      provenance: "agency_standard",
    },
    {
      node_key: "check-access",
      node_type: "question",
      title: "Accesibilidad y línea de reporte",
      prompt:
        "¿Se revisaron la accesibilidad del DPO y su línea de reporte?",
      why_it_matters:
        "Sin acceso ni reporte directo la autonomía funcional se pierde en la práctica.",
      fact_key: "dpo.revalidation.access",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.revalidation.access"),
      evidence_to_review: [
        "checklist o informe de revalidación",
        "organigrama o línea de reporte",
      ],
      required_facts: [],
      default_next_node_key: "check-remediation",
      provenance: "agency_standard",
    },
    {
      node_key: "check-remediation",
      node_type: "question",
      title: "Apertura de remediaciones",
      prompt:
        "¿Se abrieron las remediaciones cuando corresponde, o se descartó fundadamente su necesidad?",
      why_it_matters:
        "Sin remediación las brechas detectadas quedan sin tratamiento.",
      fact_key: "dpo.revalidation.remediation",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Revisado y satisfactorio",
          description: "Remediaciones abiertas o innecesariedad constatada.",
          fact_effect: { fact_key: "dpo.revalidation.remediation", value: "yes" },
        },
        {
          value: "no",
          label: "Requiere acción o corrección",
          description: "Faltan remediaciones por abrir ante brechas.",
          fact_effect: { fact_key: "dpo.revalidation.remediation", value: "no" },
        },
        {
          value: "unknown",
          label: "Información insuficiente",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo.revalidation.remediation", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "hallazgos",
        "acciones correctivas",
        "checklist o informe de revalidación",
      ],
      required_facts: [],
      default_next_node_key: "final-assessment",
      provenance: "agency_standard",
    },
    {
      node_key: "final-assessment",
      node_type: "decision",
      title: "Síntesis de la revalidación",
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
            "Existen brechas que requieren acción o corrección antes de dar por revalidada la gobernanza.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún antecedente está sin responder o con información insuficiente.",
          when: { op: "any", conditions: DECISION_FACTS.map(unresolved) },
          goto_outcome_key: "information_incomplete",
          explanation:
            "Falta información por acreditar. Con antecedentes pendientes no se emite revalidación definitiva.",
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
          goto_outcome_key: "governance_revalidated",
          explanation:
            "Todos los criterios de revalidación están revisados y satisfactorios.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin revalidar.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "information_incomplete",
          explanation:
            "La revalidación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "governance_revalidated",
      label: "Gobernanza revalidada",
      classification: "agency_standard",
      explanation:
        "Los seis criterios están revisados y satisfactorios para el DPO designado, según la evidencia revisada en esta sesión.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el informe de revalidación",
          note: "Archiva el checklist o informe de revalidación con la evidencia revisada, los hallazgos y las acciones correctivas cuando existan.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere acciones correctivas",
      classification: "agency_standard",
      explanation:
        "Al menos un criterio presenta brechas. Documenta cada brecha y su medida correctiva en el informe de revalidación.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Documentar brechas y medidas correctivas",
          note: "Registra cada brecha detectada con su medida correctiva en el informe de revalidación.",
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
        "Sin DPO designado no hay gobernanza que revalidar.",
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
