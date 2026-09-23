import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.06.
 *
 * activity_key = legitimate_interest.assessment (decision, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente factores, evidencia, legal basis y state effect del
 * contenido canónico D2.06. Sin scoring, pesos, thresholds ni regla
 * automática de balance: el sistema NO deduce la conclusión desde los
 * factores.
 *
 * Arquitectura espejo de D1.03: nodos de consideración registran si
 * cada factor canónico fue considerado con respaldo; la compuerta de
 * suficiencia solo decide si existe base mínima para concluir; la
 * conclusión la adopta explícitamente el profesional junto a un
 * ReasoningRecord purpose-scoped válido. El prerrequisito (base
 * candidata = interés legítimo según D2.05 para esta misma purpose)
 * se lee como fact externo, nunca se re-evalúa aquí.
 */

const FACTOR_FACTS = [
  "li_assessment.interest_defined",
  "li_assessment.necessity_reviewed",
  "li_assessment.rights_identified",
  "li_assessment.alternatives_reviewed",
  "li_assessment.safeguards_identified",
];

const PREREQ_FACT = "lawful.art13_source";
const DRAFT_FACT = "li_assessment.working_conclusion";

function considered(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function notConsidered(fact_key: string): FactCondition {
  return { op: "not", condition: considered(fact_key) };
}

function considerationOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Considerado con respaldo",
      description: "El factor fue considerado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No considerado",
      description: "El factor aún no ha sido considerado.",
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

export const LEGITIMATE_INTEREST_ASSESSMENT_PROTOCOL: ExecutionProtocol = {
  protocol_key: "legitimate_interest.assessment.v1",
  activity_key: "legitimate_interest.assessment",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada de interés legítimo",
  description:
    "Estructura el análisis de interés legítimo para la finalidad activa: considera los factores canónicos, verifica la base mínima para concluir y documenta la conclusión profesional con su razonamiento.",
  entry_node_key: "prerequisite-gate",
  decision_fact_keys: FACTOR_FACTS,
  external_fact_keys: [PREREQ_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "prerequisite-gate",
      node_type: "decision",
      title: "Base candidata",
      prompt:
        "El sistema verifica que esta finalidad tenga como base candidata el interés legítimo según D2.05.",
      answer_type: "none",
      required_facts: [PREREQ_FACT],
      transitions: [
        {
          rule_id: "li-candidate",
          description:
            "La finalidad tiene interés legítimo como base candidata.",
          when: {
            op: "fact_equals",
            fact_key: PREREQ_FACT,
            value: "legitimate_interest",
          },
          goto_node_key: "factor-interest",
          explanation:
            "Existe base para evaluar el interés legítimo de esta finalidad.",
        },
        {
          rule_id: "fallback-prerequisite",
          description:
            "Sin candidatura vigente no inicia la evaluación.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "Esta evaluación solo procede cuando D2.05 determinó interés legítimo como base candidata para la finalidad.",
        },
      ],
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "factor-interest",
      node_type: "question",
      title: "Interés perseguido",
      prompt:
        "¿Se definió concretamente el interés perseguido por el responsable o tercero?",
      why_it_matters:
        "Sin interés concreto no existe objeto que ponderar.",
      fact_key: "li_assessment.interest_defined",
      answer_type: "yes_no_unknown",
      options: considerationOptions("li_assessment.interest_defined"),
      evidence_to_review: [
        "antecedentes del interés",
        "Reasoning Record de interés legítimo",
      ],
      required_facts: [],
      default_next_node_key: "factor-necessity",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-necessity",
      node_type: "question",
      title: "Necesidad del tratamiento",
      prompt:
        "¿Se verificó que el tratamiento sea necesario para satisfacer ese interés?",
      why_it_matters:
        "Sin necesidad el interés no sostiene la finalidad aunque exista.",
      fact_key: "li_assessment.necessity_reviewed",
      answer_type: "yes_no_unknown",
      options: considerationOptions("li_assessment.necessity_reviewed"),
      evidence_to_review: ["análisis de necesidad"],
      required_facts: [],
      default_next_node_key: "factor-rights",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-rights",
      node_type: "question",
      title: "Derechos y libertades",
      prompt:
        "¿Se identificaron los derechos y libertades del titular que podrían resultar afectados?",
      why_it_matters:
        "Sin identificar afectaciones no es posible ponderar ni salvaguardar.",
      fact_key: "li_assessment.rights_identified",
      answer_type: "yes_no_unknown",
      options: considerationOptions("li_assessment.rights_identified"),
      evidence_to_review: ["evaluación de efectos sobre titulares"],
      required_facts: [],
      default_next_node_key: "factor-alternatives",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-alternatives",
      node_type: "question",
      title: "Alternativas menos intrusivas",
      prompt:
        "¿Se examinaron alternativas menos intrusivas razonablemente disponibles?",
      why_it_matters:
        "Sin examinar alternativas no es posible sostener necesidad ni proporcionalidad.",
      fact_key: "li_assessment.alternatives_reviewed",
      answer_type: "yes_no_unknown",
      options: considerationOptions("li_assessment.alternatives_reviewed"),
      evidence_to_review: ["alternativas consideradas"],
      required_facts: [],
      default_next_node_key: "factor-safeguards",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-safeguards",
      node_type: "question",
      title: "Salvaguardas",
      prompt:
        "¿Se identificaron salvaguardas que reduzcan los impactos?",
      why_it_matters:
        "Sin salvaguardas los impactos identificados quedan sin mitigación.",
      fact_key: "li_assessment.safeguards_identified",
      answer_type: "yes_no_unknown",
      options: considerationOptions("li_assessment.safeguards_identified"),
      evidence_to_review: ["salvaguardas"],
      required_facts: [],
      default_next_node_key: "sufficiency-gate",
      provenance: "agency_standard",
    },
    {
      node_key: "sufficiency-gate",
      node_type: "decision",
      title: "Suficiencia del análisis",
      prompt:
        "El sistema verifica si todos los factores fueron considerados con respaldo.",
      answer_type: "none",
      required_facts: [...FACTOR_FACTS],
      transitions: [
        {
          rule_id: "factors-pending",
          description:
            "Algún factor no fue considerado, está sin responder o sin información.",
          when: { op: "any", conditions: FACTOR_FACTS.map(notConsidered) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan factores por considerar. Sin el análisis completo no se habilita la conclusión profesional.",
        },
        {
          rule_id: "ready-for-conclusion",
          description:
            "Los cinco factores fueron considerados con respaldo.",
          when: { op: "all", conditions: FACTOR_FACTS.map(considered) },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Existe base mínima para que el profesional adopte una conclusión documentada.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La evaluación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "adopt-conclusion",
      node_type: "question",
      title: "Adopción de la conclusión",
      prompt:
        "¿Cuál conclusión profesional adoptas sobre si el interés legítimo sostiene esta finalidad?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: el sistema solo verificó que existe base suficiente para concluir.",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "supports_basis",
          label: "Sostiene la base",
          description:
            "Juicio profesional: el interés legítimo sostiene válidamente la finalidad.",
          fact_effect: { fact_key: DRAFT_FACT, value: "supports_basis" },
        },
        {
          value: "remediation_required",
          label: "Requiere medidas",
          description:
            "Juicio profesional: sostiene solo con salvaguardas o medidas adicionales.",
          fact_effect: { fact_key: DRAFT_FACT, value: "remediation_required" },
        },
        {
          value: "does_not_support_basis",
          label: "No sostiene la base",
          description:
            "Juicio profesional: el interés legítimo no puede sostener esta finalidad.",
          fact_effect: { fact_key: DRAFT_FACT, value: "does_not_support_basis" },
        },
      ],
      evidence_to_review: ["Reasoning Record de interés legítimo"],
      help_text: [
        "Selecciona la alternativa y documenta tu razonamiento a continuación. La conclusión solo queda registrada al adoptar con razonamiento válido.",
      ],
      required_facts: [...FACTOR_FACTS],
    },
  ],
  outcomes: [
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen factores pendientes o con información insuficiente. Esto no es una conclusión sobre el interés legítimo.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
    {
      outcome_key: "supports_basis",
      label: "Sostiene la base",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el interés legítimo sostiene válidamente la finalidad.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "purpose.legitimate_interest_outcome", value: "supports_basis" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Volver a D2.05 con la base validada",
          activity_key: "lawful_basis.assign",
        },
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con antecedentes, análisis de necesidad, efectos, alternativas y salvaguardas.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere medidas",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la base solo se sostiene con medidas o salvaguardas adicionales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "purpose.legitimate_interest_outcome", value: "remediation_required" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Implementar medidas y reevaluar",
          note: "Aplica las salvaguardas identificadas y vuelve a evaluar antes de asignar la base.",
        },
      ],
    },
    {
      outcome_key: "does_not_support_basis",
      label: "No sostiene la base",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el interés legítimo no puede sostener esta finalidad; no debe asignarse como base.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "purpose.legitimate_interest_outcome", value: "does_not_support_basis" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Revisar la base en D2.05",
          activity_key: "lawful_basis.assign",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "Sin candidatura vigente",
      classification: "agency_standard",
      explanation:
        "Esta evaluación solo procede con interés legítimo como base candidata para la finalidad.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Determinar la base en D2.05",
          activity_key: "lawful_basis.assign",
        },
      ],
    },
  ],
  reasoning_requirements: {
    required_fields: [
      "conclusion",
      "legal_question",
      "facts_considered",
      "legal_factors",
      "alternatives_considered",
      "rationale",
      "decided_by",
      "decided_at",
      "legal_basis",
    ],
  },
};
