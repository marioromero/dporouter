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
      evidence_review_help: [
        {
          evidence_item: "antecedentes del interés",
          review_guide:
            "Examinar los objetivos operacionales, decisiones internas, acuerdos y demás antecedentes que expliquen el beneficio o necesidad perseguida. Identificar a quién corresponde el interés invocado, qué resultado concreto pretende alcanzarse y cómo se vincula con la finalidad evaluada. Distinguir intereses efectivamente sustentados de afirmaciones genéricas de conveniencia, eficiencia o beneficio económico que no permitan comprender suficientemente su alcance.",
          no_evidence_guidance:
            "Consultar a las áreas responsables y revisar documentación de procesos, decisiones organizacionales y antecedentes del tercero beneficiario cuando corresponda. Si no es posible precisar el interés o su relación con la finalidad, registrar las cuestiones pendientes y solicitar las aclaraciones necesarias, sin construir justificaciones retrospectivas desvinculadas de las circunstancias reales del tratamiento.",
          expected_result:
            "Un interés identificable, atribuido al responsable o a un tercero determinado y respaldado por antecedentes pertinentes, con descripción suficiente de su propósito y relación con la operación examinada. Las formulaciones ambiguas, afirmaciones sin sustento o circunstancias pendientes deben quedar documentadas, sin considerar acreditada la necesidad del tratamiento ni su compatibilidad con los derechos del titular.",
        },
        {
          evidence_item: "Reasoning Record de interés legítimo",
          review_guide:
            "Revisar la fundamentación registrada para comprobar que individualice el interés invocado, los hechos que lo sustentan y su vinculación con la finalidad correspondiente. Verificar que las afirmaciones relevantes puedan relacionarse con antecedentes identificables y que se distingan las circunstancias comprobadas de las apreciaciones profesionales. Reconocer los aspectos todavía sujetos a evaluación, sin exigir que la ponderación completa esté concluida en esta etapa.",
          no_evidence_guidance:
            "Recopilar los hechos y documentos disponibles para preparar o completar la fundamentación del interés. Cuando no exista un razonamiento registrado, identificar los elementos que requieren análisis y dejar constancia de las limitaciones conocidas. Evitar formular conclusiones favorables sin respaldo o presentar como realizada una evaluación jurídica que todavía se encuentra pendiente.",
          expected_result:
            "Una fundamentación inicial trazable que identifique el interés examinado, los antecedentes considerados y las cuestiones que deberán evaluarse posteriormente. El registro debe permitir continuar el análisis de necesidad y posibles afectaciones, sin anticipar que el interés legítimo constituye una base de licitud suficientemente acreditada.",
        },
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
      evidence_review_help: [
        {
          evidence_item: "análisis de necesidad",
          review_guide:
            "Examinar las operaciones realizadas, las categorías de datos utilizadas y su contribución concreta al interés identificado. Comprobar si existe una relación suficientemente fundada entre el tratamiento y el resultado perseguido, distinguiendo las actividades necesarias de aquellas que responden principalmente a conveniencia, eficiencia o aprovechamiento adicional de información. Identificar operaciones o categorías cuya necesidad no esté explicada, dejando la evaluación detallada de alternativas menos intrusivas para la etapa correspondiente.",
          no_evidence_guidance:
            "Consultar las descripciones de procesos, decisiones operacionales y antecedentes que expliquen cómo se pretende alcanzar el interés declarado. Si no existe un análisis documentado, identificar las operaciones y categorías que requieren justificación y recopilar los elementos necesarios para evaluarlas. Cuando la necesidad no pueda fundamentarse, registrar esa insuficiencia sin presumir que la utilidad del tratamiento basta para sostener la fuente jurídica.",
          expected_result:
            "Una evaluación documentada de la relación entre las operaciones examinadas y el interés perseguido, con fundamentos que permitan reconocer qué tratamientos resultan necesarios y cuáles requieren aclaración o justificación adicional. Las conclusiones deben quedar respaldadas por antecedentes verificables, sin anticipar una valoración favorable sobre los derechos del titular ni la suficiencia global del interés legítimo.",
        },
      ],
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
      evidence_review_help: [
        {
          evidence_item: "evaluación de efectos sobre titulares",
          review_guide:
            "Analizar las categorías de datos utilizadas, las personas afectadas y las circunstancias concretas de su utilización para reconocer posibles consecuencias sobre la privacidad, la autonomía y el ejercicio de derechos. Considerar el alcance del tratamiento, la comunicación a terceros, el seguimiento de conductas o la elaboración de perfiles cuando correspondan. Identificar la naturaleza de las afectaciones, su posible gravedad y los grupos especialmente expuestos, diferenciando riesgos razonablemente previsibles de situaciones meramente hipotéticas sin fundamento.",
          no_evidence_guidance:
            "Recopilar antecedentes de los procesos, flujos de información, características de los titulares y usos previstos para identificar las posibles consecuencias del tratamiento. Si no existe una evaluación documentada, registrar los aspectos pendientes y consultar a las áreas pertinentes para completar el análisis. Evitar interpretar la ausencia de reclamaciones o incidentes conocidos como demostración de que no existen posibles afectaciones.",
          expected_result:
            "Una identificación fundamentada de los derechos y libertades potencialmente comprometidos, con descripción de las circunstancias que podrían afectarlos y de los antecedentes utilizados para valorar su relevancia. Las incertidumbres y consecuencias pendientes de aclaración deben quedar documentadas para la evaluación posterior, sin anticipar la suficiencia de las salvaguardas ni una conclusión favorable sobre el interés legítimo.",
        },
      ],
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
      evidence_review_help: [
        {
          evidence_item: "alternativas consideradas",
          review_guide:
            "Comparar el método de tratamiento propuesto con otras formas razonablemente disponibles de alcanzar el mismo objetivo, considerando la reducción de datos recopilados, el uso de información anonimizada cuando resulte viable, la limitación de accesos o mecanismos operacionales diferentes. Evaluar si estas opciones permiten satisfacer suficientemente el interés identificado y qué diferencias presentan en cuanto a exposición de los titulares, viabilidad y eficacia. Distinguir las alternativas realmente disponibles de posibilidades meramente teóricas.",
          no_evidence_guidance:
            "Consultar antecedentes técnicos, procedimientos y decisiones operacionales para identificar opciones que pudieron considerarse o que todavía puedan evaluarse. Si no existe un análisis documentado, registrar las alternativas identificadas, sus limitaciones y los aspectos pendientes de comprobación. Cuando no se encuentre una opción razonablemente viable, fundamentar esa circunstancia sin presumir que la ausencia de propuestas demuestra automáticamente la necesidad del tratamiento elegido.",
          expected_result:
            "Una comparación fundamentada de las opciones pertinentes, con sus posibilidades de aplicación, limitaciones y consecuencias previsibles para los titulares. La evaluación debe permitir reconocer si existe una alternativa razonable que alcance el objetivo con menor intervención en los datos personales o justificar por qué no se identificó una opción adecuada, sin anticipar la conclusión definitiva sobre la licitud del tratamiento.",
        },
      ],
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
      evidence_review_help: [
        {
          evidence_item: "salvaguardas",
          review_guide:
            "Revisar las medidas técnicas, organizativas y operacionales propuestas o existentes, relacionándolas con las posibles afectaciones identificadas en la evaluación anterior. Considerar, según el tratamiento, restricciones de acceso, reducción de datos utilizados, seudonimización, limitaciones de conservación, controles de comunicación o mecanismos para facilitar el ejercicio de derechos. Comprobar qué consecuencias pretende reducir cada medida, su estado de implementación y los antecedentes disponibles sobre su funcionamiento, diferenciando controles efectivos de compromisos todavía no ejecutados.",
          no_evidence_guidance:
            "Consultar procedimientos internos, configuraciones de sistemas, controles de seguridad y antecedentes de las áreas responsables para localizar medidas que puedan resultar pertinentes. Si no existen controles suficientes o solo se han propuesto, identificar las afectaciones sin cobertura y las acciones pendientes de evaluación o implementación. Evitar presentar medidas planificadas como operativas o presumir que la ausencia de incidentes demuestra una protección adecuada.",
          expected_result:
            "Medidas identificadas y vinculadas con las consecuencias que buscan reducir, con información sobre su aplicación efectiva, limitaciones y acciones pendientes. La revisión debe permitir reconocer los impactos que permanecen sin tratamiento suficiente y aportar antecedentes para la valoración posterior, sin considerar automáticamente acreditada la procedencia del interés legítimo.",
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
      evidence_review_help: [
        {
          evidence_item: "Reasoning Record de interés legítimo",
          review_guide:
            "Valorar conjuntamente los hechos y fundamentos documentados sobre el interés invocado, la necesidad de las operaciones, las posibles afectaciones a los titulares, las alternativas disponibles y las medidas de protección consideradas. Comprobar que el razonamiento explique cómo influyen estos factores en la decisión, identifique incertidumbres relevantes y diferencie las condiciones acreditadas de aquellas que requieren medidas adicionales. Verificar que la conclusión elegida sea coherente con los antecedentes, sin equiparar la revisión completa de los factores con una valoración jurídica favorable.",
          no_evidence_guidance:
            "Recuperar los análisis y antecedentes de las etapas anteriores para completar la fundamentación profesional, identificando los hechos, criterios jurídicos y alternativas que todavía requieren revisión. Si existen factores sin respaldo suficiente o contradicciones relevantes, registrar las limitaciones y resolverlas antes de adoptar una conclusión. No presentar como realizado un análisis inexistente ni seleccionar una decisión favorable únicamente porque el sistema permite avanzar.",
          expected_result:
            "Una conclusión profesional fundamentada y trazable que determine si el interés legítimo sostiene la finalidad, requiere medidas adicionales o no constituye una base aplicable, con identificación de los antecedentes y criterios que justifican la decisión. El registro debe distinguir las condiciones acreditadas, las acciones pendientes y las razones de la valoración adoptada, sin considerar suficiente la sola completitud estructural de la evaluación.",
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
