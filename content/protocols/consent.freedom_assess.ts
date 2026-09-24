import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.04.
 *
 * activity_key = consent.freedom_assess (decision, purpose scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * factores, evidencia, legal basis y state effects del contenido
 * canónico D3.04. Sin scoring, pesos, thresholds ni regla automática:
 * el sistema NO deduce si el consentimiento es libre.
 *
 * Arquitectura espejo de D2.06: nodos de consideración registran si
 * cada factor canónico fue considerado con respaldo; la compuerta de
 * suficiencia solo decide si existe base mínima para concluir; la
 * conclusión la adopta explícitamente el profesional junto a un
 * ReasoningRecord purpose-scoped válido (finalizeProfessionalJudgment
 * existente, sin procedure finalizer). La ruta de consentimiento se
 * lee como fact externo de D2.05, nunca se re-evalúa aquí.
 *
 * La presunción legal (consentimiento en ejecución de contrato o
 * servicio cuya recolección no es necesaria ⇒ se presume no libre,
 * salvo contraprestación única del art. 12) queda visible en los
 * factores y en la compuerta, y su existencia o aplicación integra
 * los `legal_factors` del ReasoningRecord vía los títulos de
 * consideración. Que la presunción no opere NUNCA implica libertad
 * automática: siempre se exige conclusión profesional documentada.
 */

const FACTOR_FACTS = [
  "consent.freedom.context_reviewed",
  "consent.freedom.contract_identified",
  "consent.freedom.necessity_presumption_reviewed",
  "consent.freedom.sole_exception_reviewed",
  "consent.freedom.background_reviewed",
];

const PREREQ_FACT = "lawful.consent_applies";
const DRAFT_FACT = "consent.freedom.working_conclusion";

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

export const CONSENT_FREEDOM_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "consent.freedom_assess.v1",
  activity_key: "consent.freedom_assess",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada de libertad del consentimiento",
  description:
    "Estructura el juicio profesional sobre si el consentimiento puede considerarse libre en el contexto concreto: contexto, contrato o servicio, necesidad y presunción aplicable, excepción de contraprestación única y demás antecedentes, con conclusión documentada.",
  entry_node_key: "prerequisite-gate",
  decision_fact_keys: FACTOR_FACTS,
  external_fact_keys: [PREREQ_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "prerequisite-gate",
      node_type: "decision",
      title: "Ruta de consentimiento",
      prompt:
        "El sistema verifica que esta finalidad siga la ruta de consentimiento según D2.05.",
      answer_type: "none",
      required_facts: [PREREQ_FACT],
      transitions: [
        {
          rule_id: "consent-route",
          description: "La finalidad sigue la ruta de consentimiento.",
          when: {
            op: "fact_equals",
            fact_key: PREREQ_FACT,
            value: "consent_yes",
          },
          goto_node_key: "factor-context",
          explanation:
            "Existe base para evaluar la libertad del consentimiento de esta finalidad.",
        },
        {
          rule_id: "fallback-prerequisite",
          description: "Sin ruta de consentimiento no inicia la evaluación.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "Esta evaluación solo procede cuando la finalidad utiliza consentimiento como base de licitud.",
        },
      ],
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "factor-context",
      node_type: "question",
      title: "Contexto de la solicitud",
      prompt:
        "¿Se describió el contexto en que se solicita el consentimiento?",
      why_it_matters:
        "Sin contexto no es posible juzgar si la manifestación de voluntad es realmente libre.",
      fact_key: "consent.freedom.context_reviewed",
      answer_type: "yes_no_unknown",
      options: considerationOptions("consent.freedom.context_reviewed"),
      evidence_to_review: [
        "descripción de finalidad",
        "mecanismo",
        "antecedentes usados para el juicio",
      ],
      required_facts: [],
      default_next_node_key: "factor-contract",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-contract",
      node_type: "question",
      title: "Contrato o prestación de servicio",
      prompt:
        "¿Se identificó si existe contrato o prestación de servicio en cuyo marco se solicita el consentimiento?",
      why_it_matters:
        "El marco contractual activa el análisis de necesidad y la eventual presunción legal.",
      fact_key: "consent.freedom.contract_identified",
      answer_type: "yes_no_unknown",
      options: considerationOptions("consent.freedom.contract_identified"),
      evidence_to_review: [
        "contrato o condiciones del servicio",
        "oferta comercial relevante",
      ],
      required_facts: [],
      default_next_node_key: "factor-necessity",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-necessity",
      node_type: "question",
      title: "Necesidad y presunción aplicable",
      prompt:
        "¿Se determinó si la recolección o tratamiento es necesario para dicho contrato o servicio, y en su caso si opera la presunción legal de no-libertad?",
      why_it_matters:
        "Cuando el consentimiento se obtiene en ejecución de contrato o servicio y la recolección no es necesaria, opera la presunción legal de que no fue libremente otorgado. Determinar necesidad y presunción es indispensable para el juicio.",
      fact_key: "consent.freedom.necessity_presumption_reviewed",
      answer_type: "yes_no_unknown",
      options: considerationOptions(
        "consent.freedom.necessity_presumption_reviewed",
      ),
      evidence_to_review: ["necesidad alegada", "mecanismo"],
      help_text: [
        "La presunción no se aplica en el supuesto de contraprestación única del artículo 12. Que la presunción no opere no significa automáticamente que el consentimiento sea libre.",
      ],
      required_facts: [],
      default_next_node_key: "factor-exception",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-exception",
      node_type: "question",
      title: "Excepción de contraprestación única",
      prompt:
        "¿Se verificó si opera la excepción legal de bienes, servicios o beneficios cuya única contraprestación sea el consentimiento?",
      why_it_matters:
        "La excepción desplaza la presunción, pero no exime de adoptar conclusión profesional sobre la libertad.",
      fact_key: "consent.freedom.sole_exception_reviewed",
      answer_type: "yes_no_unknown",
      options: considerationOptions(
        "consent.freedom.sole_exception_reviewed",
      ),
      evidence_to_review: [
        "oferta comercial relevante",
        "antecedentes usados para el juicio",
      ],
      required_facts: [],
      default_next_node_key: "factor-background",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-background",
      node_type: "question",
      title: "Demás antecedentes materiales",
      prompt:
        "¿Se examinaron los demás antecedentes materiales necesarios para concluir si la manifestación es realmente libre?",
      why_it_matters:
        "Sin antecedentes completos la conclusión profesional carece de base suficiente.",
      fact_key: "consent.freedom.background_reviewed",
      answer_type: "yes_no_unknown",
      options: considerationOptions("consent.freedom.background_reviewed"),
      evidence_to_review: ["antecedentes usados para el juicio"],
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
          description: "Los cinco factores fueron considerados con respaldo.",
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
        "¿Cuál conclusión profesional adoptas sobre si el consentimiento puede considerarse libre en este contexto concreto?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: ni la ausencia de presunción ni ningún puntaje sustituyen tu conclusión.",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "freedom_supported",
          label: "Libertad sostenible",
          description:
            "Juicio profesional: el consentimiento puede considerarse libre en este contexto.",
          fact_effect: { fact_key: DRAFT_FACT, value: "freedom_supported" },
        },
        {
          value: "freedom_not_supported",
          label: "Libertad no sostenible",
          description:
            "Juicio profesional: el consentimiento no puede considerarse libre en este contexto.",
          fact_effect: { fact_key: DRAFT_FACT, value: "freedom_not_supported" },
        },
      ],
      evidence_to_review: ["Evaluación de libertad del consentimiento"],
      help_text: [
        "Selecciona la alternativa y documenta tu razonamiento a continuación, incluyendo la existencia o aplicación de la presunción. La conclusión solo queda registrada al adoptar con razonamiento válido.",
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
        "Existen factores pendientes o con información insuficiente. Esto no es una conclusión sobre la libertad del consentimiento.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
    {
      outcome_key: "freedom_supported",
      label: "Libertad sostenible",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el consentimiento puede considerarse libre en este contexto.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.freedom_status", value: "supported" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Continuar el diseño en D3.03",
          activity_key: "consent.mechanism_design",
        },
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con contexto, contrato o servicio, necesidad y presunción, excepción y demás antecedentes.",
        },
      ],
    },
    {
      outcome_key: "freedom_not_supported",
      label: "Libertad no sostenible",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el consentimiento no puede considerarse libre en este contexto; no puede sostener la finalidad.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.freedom_status", value: "not_supported" },
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
      label: "Sin ruta de consentimiento",
      classification: "agency_standard",
      explanation:
        "Esta evaluación solo procede cuando la finalidad utiliza consentimiento como base de licitud.",
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
