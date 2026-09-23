import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.07.
 *
 * activity_key = data.minimization_review (checklist, treatment
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, legal basis, dependencias y
 * aplicabilidad del contenido canónico D2.07. Cada check distingue
 * satisfactorio, brecha e información insuficiente, sin score global.
 *
 * Source of truth: `dataItems`, `purposes` y `dataPurposeLinks` (la
 * matriz es una vista, nunca se almacena duplicada). Un link jamás
 * prueba minimización: la conclusión conforme/remediación la adopta
 * el sistema solo desde verificaciones profesionales explícitas.
 */

const DERIVED = [
  "derived.treatment.data_items_exist",
  "derived.treatment.purposes_exist",
  "derived.treatment.links_exist",
];

const CHECK_FACTS = [
  "minimization.mapping_done",
  "minimization.excess_treated",
  "minimization.gaps_recorded",
];

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
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

export const DATA_MINIMIZATION_REVIEW_PROTOCOL: ExecutionProtocol = {
  protocol_key: "data.minimization_review.v1",
  activity_key: "data.minimization_review",
  version: 1,
  mode: "checklist",
  execution_scope: "treatment",
  title: "Revisión guiada de minimización de datos",
  description:
    "Revisa que cada dato tratado sea necesario, adecuado y pertinente para su finalidad: relación dato-finalidad, tratamiento de excesos y brechas registradas.",
  entry_node_key: "check-mapping",
  decision_fact_keys: [...CHECK_FACTS],
  external_fact_keys: [...DERIVED],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "check-mapping",
      node_type: "question",
      title: "Relación dato-finalidad",
      prompt:
        "¿Quedó relacionada cada categoría o campo relevante con su finalidad?",
      why_it_matters:
        "Sin relación no es posible juzgar necesidad ni pertinencia de cada dato.",
      fact_key: "minimization.mapping_done",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "minimization.mapping_done",
        "Cada dato relevante quedó vinculado a su finalidad.",
      ),
      evidence_to_review: [
        "matriz dato-finalidad",
        "registro de campos revisados",
      ],
      required_facts: [],
      default_next_node_key: "check-excess",
      related_activity_keys: ["treatment.purpose_define"],
      provenance: "legal_requirement",
    },
    {
      node_key: "check-excess",
      node_type: "question",
      title: "Excesos tratados",
      prompt:
        "¿Quedaron tratados los datos innecesarios, opcionales o históricos (eliminación, reducción, cese o constatación fundada)?",
      why_it_matters:
        "Sin tratar los excesos el tratamiento conserva datos más allá de lo necesario.",
      fact_key: "minimization.excess_treated",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "minimization.excess_treated",
        "Excesos eliminados, reducidos, cesados o fundadamente descartados.",
      ),
      evidence_to_review: [
        "brechas detectadas",
        "evidencia de eliminación o reducción cuando corresponda",
      ],
      required_facts: [],
      default_next_node_key: "check-gaps",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-gaps",
      node_type: "question",
      title: "Brechas y remediación",
      prompt:
        "¿Quedaron registradas las brechas detectadas con sus acciones de remediación?",
      why_it_matters:
        "Sin registro de brechas no hay seguimiento posible de la adecuación.",
      fact_key: "minimization.gaps_recorded",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "minimization.gaps_recorded",
        "Brechas y remediación registradas.",
      ),
      evidence_to_review: ["brechas detectadas"],
      required_facts: [],
      default_next_node_key: "final-assessment",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-assessment",
      node_type: "decision",
      title: "Síntesis de la revisión",
      prompt:
        "El sistema distingue puntos validados, brechas e información por acreditar.",
      answer_type: "none",
      required_facts: [...DERIVED, ...CHECK_FACTS],
      transitions: [
        {
          rule_id: "relations-missing",
          description:
            "Sin datos, finalidades o links no hay revisión posible.",
          when: {
            op: "any",
            conditions: DERIVED.map((f) => ({
              op: "fact_equals",
              fact_key: f,
              value: "no",
            }) as FactCondition),
          },
          goto_outcome_key: "relations_incomplete",
          explanation:
            "Faltan datos, finalidades o sus relaciones. Completa cada elemento en el workspace.",
        },
        {
          rule_id: "gaps-found",
          description:
            "Al menos un check requiere acción o corrección.",
          when: { op: "any", conditions: CHECK_FACTS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas que requieren acción o corrección antes de declarar conformidad.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún antecedente está sin responder o con información insuficiente.",
          when: {
            op: "any",
            conditions: [...CHECK_FACTS.map(unresolved)],
          },
          goto_outcome_key: "information_incomplete",
          explanation:
            "Falta información por acreditar. Con antecedentes pendientes no se emite conclusión definitiva.",
        },
        {
          rule_id: "all-conform",
          description:
            "Estructura relacionada y los tres checks satisfactorios.",
          when: {
            op: "all",
            conditions: [
              ...DERIVED.map((f) => ({
                op: "fact_equals",
                fact_key: f,
                value: "yes",
              }) as FactCondition),
              ...CHECK_FACTS.map(isYes),
            ],
          },
          goto_outcome_key: "minimization_conform",
          explanation:
            "Todos los criterios están revisados y satisfactorios para este tratamiento.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "information_incomplete",
          explanation:
            "La revisión no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "minimization_conform",
      label: "Minimización conforme",
      classification: "legal_requirement",
      explanation:
        "Los datos están relacionados con sus finalidades y los excesos y brechas quedaron tratados y registrados.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la revisión",
          note: "Archiva la matriz dato-finalidad con el registro de campos revisados, brechas y evidencia de eliminación o reducción.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere acciones correctivas",
      classification: "legal_requirement",
      explanation:
        "Al menos un punto presenta brechas. Documenta cada brecha y su medida correctiva.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Documentar brechas y medidas correctivas",
          note: "Registra cada brecha detectada con su medida correctiva antes de declarar conformidad.",
        },
      ],
    },
    {
      outcome_key: "relations_incomplete",
      label: "Relaciones por completar",
      classification: "agency_standard",
      explanation:
        "Faltan datos, finalidades o sus relaciones en el workspace. La revisión jurídica requiere objetos sobre los cuales pronunciarse.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar relaciones en Tratamientos",
          note: "Agrega datos, finalidades y sus relaciones en la sección Tratamientos de la empresa.",
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
  ],
};
