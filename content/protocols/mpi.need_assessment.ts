import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.03.
 *
 * activity_key = mpi.need_assessment (decision, provisional: este mode no
 * sienta precedente general para otras actividades). Contenido aprobado
 * por la iteración vigente; usa exclusivamente factores, evidencia,
 * legal basis y state effect del contenido canónico D1.03.
 *
 * Sin scoring ni thresholds: el sistema NO deduce la recomendación desde
 * los factores. Cuatro nodos de consideración registran si cada factor
 * canónico fue considerado con respaldo; la compuerta de suficiencia solo
 * decide si existe base mínima para concluir; la conclusión la adopta
 * explícitamente el profesional junto a un ReasoningRecord válido.
 */

const FACTOR_FACTS = [
  "mpi_assessment.voluntary",
  "mpi_assessment.exposure_reviewed",
  "mpi_assessment.capacity_reviewed",
  "mpi_assessment.convenience_distinguished",
];

const DRAFT_FACT = "mpi_assessment.working_conclusion";

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

export const MPI_NEED_ASSESSMENT_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.need_assessment.v1",
  activity_key: "mpi.need_assessment",
  version: 1,
  mode: "decision",
  title: "Evaluación guiada de conveniencia de MPI",
  description:
    "Estructura el análisis de conveniencia de adoptar voluntariamente un MPI: considera los factores canónicos, verifica la base mínima para concluir y documenta la conclusión profesional con su razonamiento.",
  entry_node_key: "factor-voluntariness",
  decision_fact_keys: FACTOR_FACTS,
  last_review: "2026-09-22",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "factor-voluntariness",
      node_type: "question",
      title: "Carácter voluntario",
      prompt:
        "¿Se confirmó con respaldo que la adopción del MPI sería voluntaria?",
      why_it_matters:
        "La conveniencia profesional solo se evalúa cuando no existe obligación de adoptar. Si hubiera obligación, el análisis cambia por completo.",
      fact_key: "mpi_assessment.voluntary",
      answer_type: "yes_no_unknown",
      options: considerationOptions("mpi_assessment.voluntary"),
      evidence_to_review: [
        "Evaluación de conveniencia MPI",
        "Factores considerados",
      ],
      help_text: [
        "Confirma que ninguna norma vigente impone la adopción para este caso antes de evaluar conveniencia.",
      ],
      required_facts: [],
      default_next_node_key: "factor-exposure",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-exposure",
      node_type: "question",
      title: "Perfil de exposición y madurez",
      prompt:
        "¿Se evaluaron tamaño, complejidad, exposición, categorías de datos, riesgos y madurez?",
      why_it_matters:
        "El perfil de exposición y madurez es la base factual de cualquier recomendación sobre el programa.",
      fact_key: "mpi_assessment.exposure_reviewed",
      answer_type: "yes_no_unknown",
      options: considerationOptions("mpi_assessment.exposure_reviewed"),
      evidence_to_review: [
        "Evaluación de conveniencia MPI",
        "Factores considerados",
      ],
      help_text: [
        "Revisa tamaño y complejidad de la operación, exposición, categorías de datos tratadas, riesgos identificados y madurez actual.",
      ],
      required_facts: [],
      default_next_node_key: "factor-capacity",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-capacity",
      node_type: "question",
      title: "Capacidad organizacional",
      prompt:
        "¿Se consideró la capacidad organizacional para implementar y mantener el programa?",
      why_it_matters:
        "Recomendar un programa que la organización no puede sostener genera un cumplimiento ficticio.",
      fact_key: "mpi_assessment.capacity_reviewed",
      answer_type: "yes_no_unknown",
      options: considerationOptions("mpi_assessment.capacity_reviewed"),
      evidence_to_review: [
        "Evaluación de conveniencia MPI",
        "Factores considerados",
      ],
      help_text: [
        "Considera recursos, responsables, gobierno interno y capacidad de mantención en el tiempo.",
      ],
      required_facts: [],
      default_next_node_key: "factor-convenience",
      provenance: "agency_standard",
    },
    {
      node_key: "factor-convenience",
      node_type: "question",
      title: "Distinción conveniencia-obligación",
      prompt:
        "¿Se distinguió expresamente conveniencia profesional de obligación legal?",
      why_it_matters:
        "La recomendación profesional nunca debe presentarse como obligación jurídica.",
      fact_key: "mpi_assessment.convenience_distinguished",
      answer_type: "yes_no_unknown",
      options: considerationOptions("mpi_assessment.convenience_distinguished"),
      evidence_to_review: [
        "Evaluación de conveniencia MPI",
        "Recomendación documentada",
      ],
      help_text: [
        "Deja constancia de que la conclusión es recomendación profesional, no exigencia legal.",
      ],
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
            "Los cuatro factores fueron considerados con respaldo.",
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
        "¿Cuál conclusión profesional adoptas sobre la conveniencia de adoptar el MPI?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: el sistema solo verificó que existe base suficiente para concluir.",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "recommended",
          label: "Recomendado",
          description:
            "Juicio profesional: conviene adoptar el MPI. No constituye obligación legal.",
          fact_effect: { fact_key: DRAFT_FACT, value: "recommended" },
        },
        {
          value: "worth_considering",
          label: "Vale la pena considerarlo",
          description:
            "Juicio profesional: la adopción merece evaluación más profunda. No constituye obligación legal.",
          fact_effect: { fact_key: DRAFT_FACT, value: "worth_considering" },
        },
        {
          value: "not_priority",
          label: "No prioritario",
          description:
            "Juicio profesional: con los antecedentes actuales no es prioritario. No significa prohibición ni descarte definitivo.",
          fact_effect: { fact_key: DRAFT_FACT, value: "not_priority" },
        },
      ],
      evidence_to_review: ["Recomendación documentada"],
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
        "Existen factores pendientes o con información insuficiente. Esto no es una recomendación sobre el MPI.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
    {
      outcome_key: "recommended",
      label: "Recomendado",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: conviene adoptar voluntariamente el MPI. Es recomendación profesional, no obligación legal.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Continuar con formalización en D1.04",
          activity_key: "mpi.formalize_adoption",
        },
      ],
    },
    {
      outcome_key: "worth_considering",
      label: "Vale la pena considerarlo",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la adopción merece evaluación más profunda. Es recomendación profesional, no obligación legal.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Continuar con formalización en D1.04",
          activity_key: "mpi.formalize_adoption",
        },
      ],
    },
    {
      outcome_key: "not_priority",
      label: "No prioritario",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: con los antecedentes actuales la adopción no es prioritaria. No significa prohibición ni descarte definitivo; debe reevaluarse si cambian las condiciones.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Reevaluar si cambian tamaño, exposición, madurez o capacidad",
          note: "La conclusión depende de los antecedentes considerados; revísala ante cambios materiales.",
        },
      ],
    },
  ],
};
