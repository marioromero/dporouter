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
      evidence_review_help: [
        {
          evidence_item: "descripción de finalidad",
          review_guide:
            "Identificar el tratamiento y la finalidad concreta para los que se solicitará consentimiento, examinando quiénes son los titulares involucrados y en qué circunstancias surge la solicitud. Comprobar su correspondencia con los antecedentes de D2 y reconocer posibles relaciones contractuales o de servicio, sin resolver todavía la necesidad del tratamiento ni la presunción legal.",
          no_evidence_guidance:
            "Consultar las finalidades documentadas en D2 y los antecedentes de las áreas responsables para reconstruir el uso previsto y las circunstancias de la solicitud. Si faltan datos relevantes o existen contradicciones, identificar las aclaraciones pendientes sin crear finalidades ni presumir que el consentimiento será libre.",
          expected_result:
            "Una finalidad y un contexto de solicitud identificables, respaldados por antecedentes revisables y con circunstancias relevantes documentadas. Las indefiniciones deben quedar reconocidas para el análisis posterior, sin considerar que describir el tratamiento acredita libertad del consentimiento.",
        },
        {
          evidence_item: "mecanismo",
          review_guide:
            "Revisar cómo, cuándo y en qué canal se solicita la autorización, identificando las condiciones que rodean la decisión del titular y las consecuencias previstas de aceptar o rechazar. Distinguir las características efectivamente comprobadas de las propuestas, observando posibles condicionamientos sin anticipar su calificación jurídica definitiva.",
          no_evidence_guidance:
            "Consultar formularios, pantallas, guiones y descripciones funcionales para reconstruir la experiencia de solicitud y sus alternativas. Si no existe un diseño verificable o se desconoce qué sucede ante el rechazo, señalar las comprobaciones pendientes sin asumir libertad por la mera existencia de una opción de aceptación.",
          expected_result:
            "Un mecanismo contextualizado que permita reconocer las circunstancias de la solicitud, las alternativas ofrecidas y sus posibles condicionamientos. Los aspectos no comprobados deben quedar identificados, sin equiparar un diseño documentado con una decisión efectivamente libre.",
        },
        {
          evidence_item: "antecedentes usados para el juicio",
          review_guide:
            "Examinar los documentos, verificaciones y explicaciones que sustentan la descripción del contexto, identificando su origen, pertinencia y coherencia. Diferenciar hechos comprobados de afirmaciones del responsable e identificar vacíos relevantes para el análisis posterior de contrato, necesidad, excepción y demás circunstancias materiales.",
          no_evidence_guidance:
            "Recabar antecedentes contractuales, operativos y testimonios de responsables que permitan describir las condiciones reales de la solicitud. Cuando la información sea insuficiente o contradictoria, dejar identificadas las fuentes y comprobaciones pendientes sin atribuir respaldo a hechos todavía no verificados.",
          expected_result:
            "Antecedentes trazables y suficientes para sustentar la descripción del contexto, con hechos relevantes, fuentes e incertidumbres diferenciados. La revisión debe aportar fundamento al juicio profesional posterior, sin sustituir la valoración jurídica ni completar artificialmente factores aún pendientes.",
        },
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
      evidence_review_help: [
        {
          evidence_item: "contrato o condiciones del servicio",
          review_guide:
            "Comprobar si la solicitud de consentimiento se produce durante la ejecución de un contrato o la prestación de un servicio, identificando las condiciones aplicables y su relación con la finalidad activa. Revisar cuándo se solicita la autorización y qué consecuencias contractuales se contemplan ante su rechazo, sin resolver todavía si la recolección resulta necesaria.",
          no_evidence_guidance:
            "Consultar contratos, términos del servicio y antecedentes operativos para determinar si existe una relación contractual o prestación vinculada con la solicitud. Si no hay documentación suficiente, precisar las verificaciones pendientes sin presumir que la ausencia de un contrato escrito descarta la prestación de un servicio.",
          expected_result:
            "Un contexto contractual o de servicio identificado con antecedentes verificables, incluida la constatación fundada de su inexistencia cuando corresponda. Las condiciones relevantes y las incertidumbres deben quedar reconocidas para el análisis posterior de necesidad y presunción, sin anticipar una conclusión sobre libertad.",
        },
        {
          evidence_item: "oferta comercial relevante",
          review_guide:
            "Revisar qué bienes, servicios o beneficios se ofrecen y bajo qué condiciones puede acceder a ellos el titular, identificando la relación entre la oferta y la solicitud de consentimiento. Reconocer pagos, prestaciones o compromisos asociados sin considerar automáticamente que una oferta gratuita configura la excepción legal de contraprestación única.",
          no_evidence_guidance:
            "Recuperar ofertas, comunicaciones comerciales y condiciones de contratación o acceso al beneficio para reconstruir lo que efectivamente se propone al titular. Si existen diferencias entre la publicidad y las condiciones aplicadas, identificar las aclaraciones pendientes sin atribuir contraprestaciones ni excepciones no acreditadas.",
          expected_result:
            "Una oferta y sus condiciones relevantes identificadas con respaldo revisable, permitiendo reconocer su relación con la solicitud de consentimiento y las contraprestaciones informadas. Las discrepancias deben quedar documentadas para evaluar después la excepción legal, sin darla por aplicable desde este nodo.",
        },
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
      evidence_review_help: [
        {
          evidence_item: "necesidad alegada",
          review_guide:
            "Contrastar la necesidad invocada para recolectar los datos con las obligaciones y características concretas del contrato o servicio, identificando qué operaciones resultan indispensables y cuáles responden a finalidades adicionales. Determinar si concurren las condiciones de la presunción legal de falta de libertad, diferenciando una justificación documentada de la mera conveniencia del responsable.",
          no_evidence_guidance:
            "Consultar contratos, descripciones del servicio y antecedentes operativos para reconstruir por qué se requiere la recolección vinculada a la finalidad activa. Si la necesidad no está explicada o existen contradicciones, identificar las verificaciones pendientes sin presumir que todo dato solicitado es indispensable ni concluir automáticamente sobre la libertad.",
          expected_result:
            "Un análisis respaldado de la necesidad de la recolección respecto del contrato o servicio, con operaciones indispensables y adicionales diferenciadas y la eventual presunción legal identificada. Las incertidumbres deben quedar reconocidas, sin convertir esta consideración en una conclusión profesional definitiva.",
        },
        {
          evidence_item: "mecanismo",
          review_guide:
            "Comprobar cómo se integra la solicitud de consentimiento en la contratación o prestación del servicio, verificando si el acceso o continuidad de la prestación queda condicionado a autorizar tratamientos que no sean necesarios. Examinar las consecuencias previstas ante el rechazo y relacionarlas con la posible aplicación de la presunción, sin anticipar la evaluación específica de su excepción.",
          no_evidence_guidance:
            "Revisar formularios, recorridos y reglas funcionales para determinar qué sucede cuando el titular no autoriza la finalidad evaluada. Si no existen pruebas suficientes sobre las condiciones de acceso o rechazo, identificar los comportamientos pendientes de comprobar sin atribuir independencia o condicionamiento al mecanismo por su sola descripción.",
          expected_result:
            "Un mecanismo examinado respecto de sus condicionamientos contractuales y del tratamiento sometido a consentimiento, con las consecuencias de aceptar o rechazar identificadas. Los indicios relevantes para la presunción y las limitaciones de evidencia deben quedar documentados, sin considerar acreditada automáticamente la libertad de la manifestación.",
        },
      ],
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
      evidence_review_help: [
        {
          evidence_item: "oferta comercial relevante",
          review_guide:
            "Comprobar las condiciones bajo las cuales se ofrecen los bienes, servicios o beneficios, identificando si el consentimiento para tratar datos constituye efectivamente la única contraprestación exigida. Revisar posibles pagos, obligaciones u otras prestaciones asociadas y distinguir una oferta sin precio monetario del supuesto específico previsto en el artículo 12.",
          no_evidence_guidance:
            "Consultar condiciones comerciales, comunicaciones de la oferta y antecedentes del servicio para determinar qué recibe el titular y qué se exige a cambio. Si las contraprestaciones no están claras o existen versiones contradictorias, identificar las aclaraciones pendientes sin presumir la excepción por la sola gratuidad anunciada.",
          expected_result:
            "Una oferta examinada con sus contraprestaciones identificadas y respaldo suficiente para valorar si concurre el supuesto legal de contraprestación única. Las condiciones incompatibles o incertidumbres deben quedar reconocidas, sin considerar que la eventual excepción demuestra por sí sola libertad del consentimiento.",
        },
        {
          evidence_item: "antecedentes usados para el juicio",
          review_guide:
            "Revisar los documentos y verificaciones que sustentan la caracterización de la oferta, comprobando su correspondencia con las condiciones efectivamente aplicadas. Diferenciar afirmaciones del responsable de hechos respaldados e identificar si los antecedentes permiten justificar la aplicación o improcedencia de la excepción, sin sustituir el juicio profesional posterior.",
          no_evidence_guidance:
            "Recabar contratos, materiales comerciales y explicaciones de los responsables para respaldar las contraprestaciones identificadas y su relación con el consentimiento. Si no existen pruebas suficientes, señalar las fuentes y comprobaciones pendientes sin inventar condiciones de la oferta ni dar por acreditada la excepción.",
          expected_result:
            "Antecedentes trazables que permitan fundamentar si corresponde aplicar o descartar la excepción de contraprestación única, con discrepancias y limitaciones identificadas. La revisión debe sustentar el análisis jurídico sin transformar la ausencia de presunción en una conclusión automática de consentimiento libre.",
        },
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
      evidence_review_help: [
        {
          evidence_item: "antecedentes usados para el juicio",
          review_guide:
            "Examinar las circunstancias adicionales que puedan afectar la libertad de decisión del titular, como presiones, situaciones de dependencia, consecuencias del rechazo o restricciones efectivas de elección. Contrastar las explicaciones del responsable con antecedentes contractuales y operativos disponibles, distinguiendo hechos acreditados, afirmaciones e incertidumbres, sin repetir las evaluaciones específicas de necesidad y excepción.",
          no_evidence_guidance:
            "Recabar antecedentes de las áreas responsables y revisar comunicaciones, condiciones de participación y funcionamiento del mecanismo para identificar posibles condicionamientos. Si faltan comprobaciones o existen versiones contradictorias, señalar las fuentes pendientes sin presumir libertad por ausencia de reclamaciones ni atribuir presiones que no estén respaldadas.",
          expected_result:
            "Un conjunto de circunstancias materiales pertinentes examinado con respaldo trazable, que permita identificar factores favorables, posibles restricciones e incertidumbres relevantes para el juicio profesional. La revisión debe sustentar la evaluación global de libertad sin convertir la consideración de estos antecedentes en una conclusión automática.",
        },
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
      evidence_review_help: [
        {
          evidence_item: "Evaluación de libertad del consentimiento",
          review_guide:
            "Valorar conjuntamente los cinco factores examinados y sus antecedentes, determinando cómo inciden en la libertad de la manifestación para la finalidad activa. Fundamentar la conclusión elegida considerando el contexto contractual, la necesidad de la recolección, la eventual presunción legal, su excepción y los demás condicionamientos relevantes, sin equiparar factores revisados con resultados favorables.",
          no_evidence_guidance:
            "Reunir las evaluaciones y respaldos de los factores anteriores, identificando hechos comprobados, contradicciones y cuestiones pendientes de aclaración. Cuando no exista fundamento suficiente para adoptar una conclusión, completar las verificaciones necesarias sin presumir libertad por ausencia de presunción ni formular un razonamiento basado en antecedentes inexistentes.",
          expected_result:
            "Una conclusión profesional expresa y razonada sobre si la libertad del consentimiento resulta sostenible, con hechos, factores jurídicos, alternativas y fundamentos documentados en el ReasoningRecord correspondiente. La decisión debe reflejar la valoración integral de los antecedentes, sin derivarse automáticamente de la compuerta de suficiencia o de una puntuación.",
        },
      ],
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
