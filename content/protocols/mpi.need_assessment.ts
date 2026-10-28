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
      evidence_review_help: [
        {
          evidence_item: "Evaluación de conveniencia MPI",
          review_guide:
            "Revisar el análisis de conveniencia del caso concreto y comprobar si documenta por qué se considera voluntaria la adopción del MPI. Verificar qué tipo de responsable es la organización, qué tratamientos realiza, en qué sector opera y qué normas o condiciones particulares podrían afectarla. La existencia de una evaluación no respalda la conclusión por sí sola. Distinguir una conclusión respaldada por fuentes, una conclusión preliminar y una evaluación pendiente.",
          no_evidence_guidance:
            "Precisar si no hay evaluación disponible, si está incompleta o si no indica sus fuentes. Identificar la información pendiente y consultar, cuando sea necesario, a las áreas jurídica, regulatoria o de cumplimiento. La ausencia de un documento no demuestra que la adopción sea voluntaria: con información insuficiente, la voluntariedad queda sin confirmar.",
          expected_result:
            "Una conclusión sobre el carácter voluntario de la adopción, con las fuentes revisadas, su vigencia, su aplicabilidad y las incertidumbres pendientes, distinguiendo lo respaldado de lo preliminar y lo pendiente. Esta actividad respalda una decisión metodológica y no exige un documento independiente del DPO.",
        },
        {
          evidence_item: "Factores considerados",
          review_guide:
            "Revisar los antecedentes que comprueben si existe alguna obligación específica de adoptar un MPI: normativa del sector, reglas especiales para la entidad, instrucciones o resoluciones de autoridad y condiciones regulatorias o contractuales vinculantes, cuando corresponda. Registrar la fuente consultada, su vigencia, su ámbito y la razón por la que se aplica o no al caso, en una revisión proporcional a la naturaleza de la organización y sus actividades. Las obligaciones generales de protección de datos, prevención, seguridad o responsabilidad no implican por sí solas la obligación de adoptar un MPI (artículo 49 de la Ley N.º 19.628, según la modificación de la Ley N.º 21.719, y Decreto N.º 662 de 2026). Tampoco dar la adopción por voluntaria solo por la regla general de la ley: normas sectoriales o condiciones particulares pueden modificar el análisis.",
          no_evidence_guidance:
            "Indicar qué fuentes faltan y qué información permitiría confirmar el marco aplicable, consultando cuando sea necesario a las áreas jurídica, regulatoria o de cumplimiento. Si el marco aplicable no puede confirmarse, mantener la conclusión como no confirmada, sin dar por existente una obligación específica ni por descartada una posible obligación.",
          expected_result:
            "Un registro del carácter voluntario con las fuentes consultadas, su vigencia, su aplicabilidad al caso y las incertidumbres pendientes, como respaldo de una decisión metodológica sobre la revisión.",
        },
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
      evidence_review_help: [
        {
          evidence_item: "Evaluación de conveniencia MPI",
          review_guide:
            "La evaluación debe relacionar las características de la operación y los tratamientos con los riesgos y las prácticas de protección existentes. Las conclusiones deben sustentarse en antecedentes concretos que fundamenten la conveniencia de adoptar o no un MPI, identificando las limitaciones que puedan afectar la recomendación.",
          no_evidence_guidance:
            "Indicar qué dimensiones del perfil no pudieron verificarse y qué antecedentes servirían para completarlas. La falta de documentación localizada no demuestra por sí sola que la práctica no exista; consultar las áreas que podrían confirmarla.",
          expected_result:
            "Un perfil de exposición y madurez consolidado con los antecedentes disponibles y las brechas identificadas, que fundamente la recomendación profesional de adoptar o no un MPI.",
        },
        {
          evidence_item: "Factores considerados",
          review_guide:
            "Los factores analizados deben contar con respaldo identificable y permitir comprender su influencia en la conveniencia de adoptar un MPI. La evaluación debe distinguir los riesgos observados de los supuestos, sin considerar el tamaño de la organización ni la existencia de políticas como prueba suficiente del nivel de riesgo o madurez.",
          no_evidence_guidance:
            "Indicar qué factores no pudieron confirmarse y qué información o áreas de la organización permitirían hacerlo. No suplir la evidencia faltante con supuestos generales.",
          expected_result:
            "Un registro de los factores considerados con su respaldo y sus incertidumbres, base para evaluar la conveniencia profesional de adoptar un MPI.",
        },
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
      evidence_review_help: [
        {
          evidence_item: "Evaluación de conveniencia MPI",
          review_guide:
            "La evaluación debe determinar si la organización dispone de condiciones realistas para implementar y mantener el programa, considerando recursos, responsabilidades y mecanismos de gobierno interno. La recomendación debe tener en cuenta la continuidad de estas capacidades y no limitarse a la conveniencia teórica de adoptar el MPI.",
          no_evidence_guidance:
            "Se deben identificar las capacidades que no pudieron verificarse y los antecedentes necesarios para evaluarlas. La falta de documentación localizada no demuestra por sí sola que los recursos, responsables o prácticas no existan.",
          expected_result:
            "Una evaluación fundamentada de la capacidad organizacional para implementar y mantener el MPI, con las limitaciones relevantes para la recomendación profesional.",
        },
        {
          evidence_item: "Factores considerados",
          review_guide:
            "Los factores deben contar con respaldo identificable sobre los recursos disponibles, la asignación de responsabilidades, el apoyo del gobierno interno y la capacidad de mantener las actividades en el tiempo. Deben distinguirse las capacidades existentes de las previstas o aún no confirmadas, sin asumir que la disponibilidad inicial garantiza la continuidad del programa.",
          no_evidence_guidance:
            "Se deben señalar los factores que no pudieron confirmarse y las áreas o antecedentes que permitirían evaluarlos. No deben darse por disponibles recursos, responsables o apoyos internos sin respaldo suficiente.",
          expected_result:
            "Un registro de las capacidades disponibles, las brechas y las incertidumbres que puedan afectar la implementación y continuidad del MPI.",
        },
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
      evidence_review_help: [
        {
          evidence_item: "Evaluación de conveniencia MPI",
          review_guide:
            "La evaluación debe diferenciar los motivos profesionales que sustentan la conveniencia de adoptar un MPI de las obligaciones jurídicas aplicables a la organización. Las conclusiones deben identificar la base de cada afirmación y evitar presentar una recomendación metodológica como una exigencia legal. También deben explicitarse las condiciones o antecedentes que podrían modificar esa conclusión.",
          no_evidence_guidance:
            "Se deben señalar los antecedentes que no permiten verificar esta distinción y la información jurídica o interna necesaria para aclararla. La ausencia de una explicación documentada no demuestra por sí sola que la organización haya confundido ambos conceptos; corresponde identificar qué aspecto requiere confirmación.",
          expected_result:
            "Una evaluación que distinga claramente la conveniencia profesional de adoptar un MPI de las obligaciones jurídicas que correspondan al caso, con fundamentos suficientes para comprender la diferencia.",
        },
        {
          evidence_item: "Recomendación documentada",
          review_guide:
            "La recomendación debe expresar si la adopción del MPI se aconseja por razones profesionales y diferenciar esa conclusión de cualquier obligación legal que resulte aplicable. Toda afirmación de obligatoriedad debe contar con fundamento jurídico pertinente, sin convertir los criterios metodológicos de la evaluación en requisitos legales. La redacción debe permitir reconocer qué parte corresponde a una recomendación y cuál a una obligación, si existe.",
          no_evidence_guidance:
            "Se deben identificar las afirmaciones cuya naturaleza no pueda determinarse y los fundamentos necesarios para aclarar si corresponden a una recomendación profesional o a una obligación jurídica aplicable. Las dudas deben quedar identificadas sin atribuir incumplimientos no verificados.",
          expected_result:
            "Una recomendación documentada que explicite sus fundamentos profesionales y distinga las obligaciones jurídicas que, en su caso, resulten aplicables, de modo que la conclusión no induzca a interpretar la recomendación como una exigencia legal.",
        },
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
      evidence_review_help: [
        {
          evidence_item: "Recomendación documentada",
          review_guide:
            "La conclusión debe reflejar el juicio profesional derivado de los antecedentes revisados, considerando el carácter voluntario del MPI, el perfil de exposición y madurez, la capacidad organizacional y la distinción entre conveniencia y obligación jurídica. La alternativa seleccionada debe ser coherente con esos antecedentes y contar con un razonamiento explícito, sin tratar la selección como un cálculo automático del sistema.",
          no_evidence_guidance:
            "Se deben identificar los antecedentes previos insuficientes o las contradicciones que impiden fundamentar la conclusión. No debe adoptarse una recomendación definitiva mientras falten elementos relevantes para el juicio profesional; la ausencia de documentación no demuestra por sí sola que una práctica no exista.",
          expected_result:
            "Una conclusión profesional adoptada y acompañada de un razonamiento que explique cómo los antecedentes sustentan la recomendación de adoptar o no un MPI, incluyendo las limitaciones relevantes.",
        },
      ],
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
      canonical_fact_effects: [
        { fact_key: "mpi.recommendation_outcome", value: "recommended" },
      ],
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
      canonical_fact_effects: [
        { fact_key: "mpi.recommendation_outcome", value: "worth_considering" },
      ],
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
      canonical_fact_effects: [
        { fact_key: "mpi.recommendation_outcome", value: "not_priority" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Reevaluar si cambian tamaño, exposición, madurez o capacidad",
          note: "La conclusión depende de los antecedentes considerados; revísala ante cambios materiales.",
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
