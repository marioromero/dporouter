import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.09.
 *
 * activity_key = automated_decision.safeguards_enable (checklist,
 * treatment scope). Contenido aprobado por la iteración vigente;
 * usa exclusivamente pasos, evidencia, dependencias y state effect
 * del contenido canónico D4.09. Verifica salvaguardas para cada
 * uso cubierto, incluyendo los amparados en excepciones.
 *
 * Unidad de ejecución: el treatment. Los cinco checks por uso
 * viven en la colección local compartida (`safeguards` por uso
 * cubierto); la guía NO duplica answers por uso ni usa fact keys
 * por ID. Esta guía verifica condiciones operacionales a nivel
 * tratamiento y los agregados derivados; el detalle por uso se
 * trabaja en el workspace del tratamiento.
 *
 * Dependencia de completitud hacia D4.08 vía fact externo
 * `automated_decision.scope_status` (can start libre, can complete
 * gated). La applicability semántica la gobierna `scope_status`;
 * un `legal_path_status` histórico nunca se consulta: si el estado
 * canónico actual no muestra usos cubiertos, D4.09 no es aplicable
 * aunque existan facts antiguos. Sin unset operators, sin limpieza
 * cruzada, sin timers ni plazos inventados.
 */

const SCOPE_FACT = "automated_decision.scope_status";

const CHECKS = [
  "automated_safeguards.ops_owners_identified",
  "automated_safeguards.ops_channels_defined",
  "automated_safeguards.ops_explanation_obtainable",
  "automated_safeguards.ops_intervention_substantive",
  "automated_safeguards.ops_viewpoint_receivable",
  "automated_safeguards.ops_d3_coherence",
];

const DERIVED = [
  "derived.treatment.automated_uses_covered_exist",
  "derived.treatment.automated_uses_safeguards_complete",
  "derived.treatment.automated_uses_safeguards_enabled",
  "derived.treatment.automated_uses_safeguards_deficient",
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

export const AUTOMATED_DECISION_SAFEGUARDS_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "automated_decision.safeguards_enable.v1",
  activity_key: "automated_decision.safeguards_enable",
  version: 1,
  mode: "checklist",
  execution_scope: "treatment",
  title: "Habilitación de salvaguardas para decisiones automatizadas",
  description:
    "Verifica las condiciones operacionales y el estado de salvaguardas de cada uso cubierto por el artículo 8 bis, con las excepciones legales incluidas. El detalle por uso vive en la colección del tratamiento; esta guía valida el conjunto.",
  entry_node_key: "check-owners",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [SCOPE_FACT, ...DERIVED],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    node(
      "check-owners",
      "Responsables internos",
      "¿Están identificados los responsables internos de los usos automatizados cubiertos?",
      "Sin responsables no hay intervención ni revisión atribuibles.",
      "automated_safeguards.ops_owners_identified",
      "Responsables identificados.",
      ["procedimiento", "flujo de revisión"],
      "check-channels",
    ),
    node(
      "check-channels",
      "Canales de intervención y revisión",
      "¿Están definidos y operativos los canales para intervención humana, punto de vista y revisión?",
      "Los canales hacen ejercibles las salvaguardas de cada uso cubierto.",
      "automated_safeguards.ops_channels_defined",
      "Canales definidos y operativos.",
      ["canal para punto de vista", "canal/proceso de revisión"],
      "check-explanation",
    ),
    node(
      "check-explanation",
      "Explicación obtenible",
      "¿La explicación de cada decisión cubierta es operacionalmente obtenible (información y transparencia efectivas)?",
      "La salvaguarda de información y explicación exige contenido real, no una mención formal.",
      "automated_safeguards.ops_explanation_obtainable",
      "Explicación obtenible verificada con prueba de explicación.",
      ["mecanismo para explicación", "prueba de explicación"],
      "check-intervention",
    ),
    node(
      "check-intervention",
      "Intervención humana sustantiva",
      "¿La intervención humana prevista es real y no meramente nominal?",
      "Una intervención nominal no protege al titular.",
      "automated_safeguards.ops_intervention_substantive",
      "Intervención sustantiva verificada con walkthrough funcional.",
      ["diseño de intervención humana", "walkthrough funcional", "entrevistas con operadores"],
      "check-viewpoint",
    ),
    node(
      "check-viewpoint",
      "Punto de vista incorporable",
      "¿El punto de vista del titular y la revisión pueden incorporarse efectivamente al proceso?",
      "Expresar el punto de vista y pedir revisión deben tener efecto en el proceso.",
      "automated_safeguards.ops_viewpoint_receivable",
      "Recepción e incorporación verificadas.",
      ["operadores responsables de revisión humana", "revisión del flujo de intervención"],
      "check-coherence",
    ),
    node(
      "check-coherence",
      "Coherencia con transparencia pública",
      "¿Las salvaguardas son coherentes con la información y transparencia pública cubierta en D3, sin duplicar esa fuente de verdad?",
      "D4 verifica implementación; la verdad pública vive en D3.",
      "automated_safeguards.ops_d3_coherence",
      "Coherencia verificada sin duplicar D3.",
      ["walkthrough/prueba controlada"],
      "synthesis",
      ["transparency.policy_assemble"],
    ),
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de salvaguardas",
      prompt:
        "El sistema verifica la completitud de D4.08, los usos cubiertos actuales y el estado de salvaguardas.",
      answer_type: "none",
      required_facts: [SCOPE_FACT, ...DERIVED, ...CHECKS],
      transitions: [
        {
          rule_id: "scope-not-ready",
          description:
            "D4.08 sin completar en presencia de cubiertos: sin base para habilitar.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: SCOPE_FACT,
              value: "covered_use_present",
            },
          },
          goto_outcome_key: "not_applicable",
          explanation:
            "D4.09 solo procede con D4.08 completado en presencia de usos cubiertos. Sin esa base no hay habilitación posible.",
        },
        {
          rule_id: "stale-no-covered",
          description:
            "El estado canónico indica cobertura pero no hay usos cubiertos actuales.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: SCOPE_FACT,
                value: "covered_use_present",
              },
              {
                op: "fact_equals",
                fact_key: "derived.treatment.automated_uses_covered_exist",
                value: "no",
              },
            ],
          },
          goto_outcome_key: "not_applicable",
          explanation:
            "La colección actual no muestra usos cubiertos: el estado canónico previo ya no la representa. Revisa D4.08 antes de habilitar.",
        },
        {
          rule_id: "gaps-found",
          description:
            "Alguna condición operacional pendiente o alguna salvaguarda deficiente.",
          when: {
            op: "any",
            conditions: [
              ...CHECKS.map(isNo),
              {
                op: "fact_equals",
                fact_key: "derived.treatment.automated_uses_safeguards_deficient",
                value: "yes",
              },
            ],
          },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas operacionales o salvaguardas deficientes en usos cubiertos.",
        },
        {
          rule_id: "missing-info",
          description:
            "Condiciones o salvaguardas sin evaluar o con información insuficiente.",
          when: {
            op: "any",
            conditions: [
              ...CHECKS.map(unresolved),
              {
                op: "not",
                condition: {
                  op: "fact_equals",
                  fact_key:
                    "derived.treatment.automated_uses_safeguards_complete",
                  value: "yes",
                },
              },
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan condiciones operacionales o salvaguardas por evaluar en usos cubiertos.",
        },
        {
          rule_id: "safeguards-complete",
          description:
            "Base D4.08 vigente con todos los cubiertos y salvaguardas habilitadas.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: SCOPE_FACT,
                value: "covered_use_present",
              },
              {
                op: "fact_equals",
                fact_key: "derived.treatment.automated_uses_safeguards_enabled",
                value: "yes",
              },
              ...CHECKS.map(satisfied),
            ],
          },
          goto_outcome_key: "safeguards_enabled",
          explanation:
            "Todos los usos cubiertos actuales cuentan con las cinco salvaguardas y las condiciones operacionales.",
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
      outcome_key: "safeguards_enabled",
      label: "Salvaguardas habilitadas",
      classification: "agency_standard",
      explanation:
        "Todos los usos cubiertos actuales cuentan con información, explicación, intervención humana, punto de vista y revisión. Esto valida la habilitación, sin administrar decisiones individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "automated_decision.safeguards_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz de salvaguardas por uso, el procedimiento, el flujo de revisión, el diseño de intervención y el walkthrough o prueba controlada.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Salvaguardas por remediar",
      classification: "agency_standard",
      explanation:
        "Al menos una condición operacional o una salvaguarda de un uso cubierto requiere corrección.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        {
          fact_key: "automated_decision.safeguards_status",
          value: "remediation_required",
        },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada condición y cada salvaguarda deficiente en sus usos y vuelve a verificar.",
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
        "Existen condiciones o salvaguardas pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "not_applicable",
      label: "D4.09 no aplicable por ahora",
      classification: "agency_standard",
      explanation:
        "Sin D4.08 completado en presencia de cubiertos, o sin usos cubiertos actuales, no hay salvaguardas que habilitar. Lo revisado queda como avance preliminar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Evaluar el alcance en D4.08",
          activity_key: "automated_decision.scope_assess",
        },
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
  ],
};
