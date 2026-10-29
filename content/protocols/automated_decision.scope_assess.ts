import type { ExecutionProtocol } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.08.
 *
 * activity_key = automated_decision.scope_assess (decision,
 * treatment scope). Contenido aprobado por la iteración vigente;
 * usa exclusivamente pasos, evidencia, dependencias y state effects
 * del contenido canónico D4.08. Identifica y evalúa separadamente
 * los usos automatizados del treatment bajo el artículo 8 bis.
 *
 * Unidad de ejecución: el treatment. Nunca el uso individual: no
 * hay sub-sesiones, nodos dinámicos, fact keys por ID ni progreso
 * por uso. Los usos viven en la colección local compartida
 * `automatedUses[]` (ADR-052) y se trabajan en el workspace del
 * treatment; la guía consume proyecciones `derived.*` y una
 * confirmación estática de inventario revisado.
 *
 * Juicio profesional con UN ReasoningRecord treatment-scoped para
 * el conjunto (el canon no exige uno por uso). La cobertura exacta
 * de IDs (`automated_use:<id>` en `facts_considered[]`) y la
 * compatibilidad conclusión↔estado las garantiza el guard
 * D4.08 en la finalización; derivar el outcome esperado NO
 * equivale a adoptar la conclusión. Sin auto-finalization:
 * inventario vacío y revisado solo habilita `no_covered_use`
 * mediante juicio finalizado.
 */

const REVIEWED_FACT = "automated_scope.inventory_reviewed";
const DRAFT_FACT = "automated_scope.working_conclusion";

const DERIVED = [
  "derived.treatment.automated_uses_exist",
  "derived.treatment.automated_uses_coverage_complete",
  "derived.treatment.automated_uses_coverage_pending",
  "derived.treatment.automated_uses_covered_exist",
  "derived.treatment.automated_uses_legal_path_complete",
];

export const AUTOMATED_DECISION_SCOPE_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "automated_decision.scope_assess.v1",
  activity_key: "automated_decision.scope_assess",
  version: 1,
  mode: "decision",
  execution_scope: "treatment",
  title: "Evaluación del alcance de decisiones automatizadas",
  description:
    "Verifica el inventario de usos automatizados del tratamiento y documenta la conclusión profesional sobre su alcance bajo el artículo 8 bis: sin usos comprendidos, con vía legal o sin ella. La evaluación por uso vive en la colección del tratamiento; el juicio es conjunto.",
  entry_node_key: "confirm-inventory",
  decision_fact_keys: [REVIEWED_FACT],
  external_fact_keys: [...DERIVED],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "confirm-inventory",
      node_type: "question",
      title: "Inventario revisado",
      prompt:
        "¿Revisaste el inventario de usos automatizados de este tratamiento, incluyendo la conclusión documentada de que no existen usos relevantes cuando sea el caso?",
      why_it_matters:
        "Un inventario vacío por sí solo no significa ausencia de usos: solo la revisión afirmada habilita concluir.",
      fact_key: REVIEWED_FACT,
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Inventario revisado",
          description:
            "El tratamiento fue revisado y sus usos (o su ausencia) quedaron registrados.",
          fact_effect: { fact_key: REVIEWED_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "Pendiente de revisar",
          description: "El inventario aún no se revisa.",
          fact_effect: { fact_key: REVIEWED_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: REVIEWED_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "inventario/matriz de usos automatizados",
        "process maps",
      ],
      evidence_review_help: [
        {
          evidence_item: "inventario/matriz de usos automatizados",
          review_guide:
            "Examinar el inventario asociado al tratamiento para comprobar que se identificaron y revisaron los usos concretos de decisiones basadas en tratamiento automatizado o elaboración de perfiles, incluidos aquellos cuya cobertura jurídica deba evaluarse posteriormente. Contrastar el contenido con las actividades y sistemas del tratamiento, distinguiendo un inventario efectivamente revisado de una colección simplemente vacía y verificando que cada uso identificado esté representado de manera reconocible.",
          no_evidence_guidance:
            "Consultar al responsable del tratamiento y a las áreas de producto, TI o analítica para determinar si existen sistemas o procesos que produzcan decisiones automatizadas o perfiles relevantes. Si no existe inventario o no se ha revisado su completitud, mantener la evaluación pendiente; una colección `automatedUses[]` vacía no acredita por sí sola la inexistencia de usos comprendidos por el artículo 8 bis.",
          expected_result:
            "Un inventario revisado para el tratamiento correspondiente, con los usos automatizados identificados y suficientemente diferenciados o con una conclusión documentada de que no existen usos relevantes tras la revisión. Deben quedar explícitos los sistemas, procesos o fuentes cuya cobertura no se haya podido verificar, sin crear sesiones individuales por cada uso.",
        },
        {
          evidence_item: "process maps",
          review_guide:
            "Contrastar los mapas de procesos del tratamiento con el inventario de usos automatizados para identificar dónde se generan perfiles, recomendaciones, clasificaciones o decisiones y qué intervención tienen en las actuaciones de la empresa. Examinar los actores, entradas, resultados y momentos de decisión para detectar usos omitidos o duplicados, sin considerar que toda automatización administrativa constituya automáticamente una decisión comprendida por el artículo 8 bis.",
          no_evidence_guidance:
            "Solicitar diagramas de procesos, descripciones operativas o recorridos explicativos de las actividades pertinentes, consultando a los responsables de negocio y tecnología. Si no existen mapas suficientes, reconstruir los puntos de decisión a partir de antecedentes disponibles e identificar las rutas pendientes de revisión, evitando concluir ausencia de automatización por falta de documentación.",
          expected_result:
            "Mapas o descripciones de proceso que permitan contrastar la existencia, finalidad y ubicación de los usos automatizados con el inventario del tratamiento. Las divergencias y procesos no comprobados deben quedar reconocidos, proporcionando una base trazable para confirmar o mantener pendiente la revisión del inventario.",
        },
      ],
      required_facts: [],
      default_next_node_key: "structural-gate",
      provenance: "agency_standard",
    },
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Completitud de la evaluación",
      prompt:
        "El sistema verifica que el inventario esté revisado y que cada uso identificado tenga cobertura y vía legal evaluadas.",
      answer_type: "none",
      required_facts: [REVIEWED_FACT, ...DERIVED],
      transitions: [
        {
          rule_id: "inventory-missing",
          description:
            "Inventario sin revisar: no hay base para concluir.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: REVIEWED_FACT,
              value: "yes",
            },
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Sin revisión afirmada del inventario no hay conclusión posible, exista o no estructura cargada.",
        },
        {
          rule_id: "coverage-pending",
          description: "Algún uso sigue sin clasificación de cobertura.",
          when: {
            op: "fact_equals",
            fact_key: "derived.treatment.automated_uses_coverage_pending",
            value: "yes",
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Cada uso identificado debe quedar covered, not_covered o con revisión pendiente explícita antes de concluir.",
        },
        {
          rule_id: "paths-pending",
          description:
            "Uso cubierto con vía legal aún pendiente.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: "derived.treatment.automated_uses_coverage_complete",
                value: "yes",
              },
              {
                op: "fact_equals",
                fact_key: "derived.treatment.automated_uses_covered_exist",
                value: "yes",
              },
              {
                op: "not",
                condition: {
                  op: "fact_equals",
                  fact_key:
                    "derived.treatment.automated_uses_legal_path_complete",
                  value: "yes",
                },
              },
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Todo uso cubierto requiere vía legal determinada (excepción, ausencia determinada o pendiente explícito) antes de concluir.",
        },
        {
          rule_id: "ready-for-conclusion",
          description:
            "Base mínima completa: el profesional puede adoptar la conclusión documentada.",
          when: {
            op: "any",
            conditions: [
              {
                op: "fact_equals",
                fact_key: "derived.treatment.automated_uses_exist",
                value: "no",
              },
              {
                op: "all",
                conditions: [
                  {
                    op: "fact_equals",
                    fact_key:
                      "derived.treatment.automated_uses_coverage_complete",
                    value: "yes",
                  },
                  {
                    op: "any",
                    conditions: [
                      {
                        op: "fact_equals",
                        fact_key:
                          "derived.treatment.automated_uses_covered_exist",
                        value: "no",
                      },
                      {
                        op: "fact_equals",
                        fact_key:
                          "derived.treatment.automated_uses_legal_path_complete",
                        value: "yes",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Inventario revisado con evaluación completa: existe base mínima para el juicio profesional conjunto.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado queda sin concluir.",
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
        "¿Cuál es la conclusión profesional sobre el alcance del artículo 8 bis en este tratamiento, considerando cada uso evaluado?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: pondera por cada uso el tratamiento automatizado o profiling, la decisión producida, el efecto jurídico o afectación significativa y la vía legal (contrato, consentimiento, habilitación o ausencia determinada).",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "no_covered_use",
          label: "Sin usos comprendidos",
          description:
            "Juicio profesional: ningún uso del tratamiento queda comprendido por el artículo 8 bis.",
          fact_effect: { fact_key: DRAFT_FACT, value: "no_covered_use" },
        },
        {
          value: "covered_uses_with_legal_path",
          label: "Usos comprendidos con vía legal",
          description:
            "Juicio profesional: existen usos comprendidos y todos cuentan con vía legal de las letras a), b) o c).",
          fact_effect: {
            fact_key: DRAFT_FACT,
            value: "covered_uses_with_legal_path",
          },
        },
        {
          value: "covered_use_without_legal_path",
          label: "Uso comprendido sin vía legal",
          description:
            "Juicio profesional: existe al menos un uso comprendido sin excepción que permita la decisión.",
          fact_effect: {
            fact_key: DRAFT_FACT,
            value: "covered_use_without_legal_path",
          },
        },
      ],
      evidence_to_review: [
        "matriz de usos automatizados",
        "documentación de profiling",
        "lógica/inputs/outputs relevantes",
        "consecuencias para titulares",
        "contratos",
        "habilitación legal cuando se invoque",
        "análisis profesional",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz de usos automatizados",
          review_guide:
            "Examinar la clasificación individual de todos los usos registrados para comprobar que cada uno cuente con una evaluación de cobertura del artículo 8 bis y, cuando corresponda, de su vía legal. Contrastar las conclusiones individuales con el conjunto representado en `automatedUses[]`, distinguiendo usos no comprendidos, usos comprendidos con excepción identificada y usos comprendidos sin vía legal, sin perder casos pendientes ni consolidar categorías incompatibles.",
          no_evidence_guidance:
            "Recabar la matriz de evaluación y consultar al responsable del tratamiento o al profesional encargado sobre los usos cuya clasificación no esté documentada. Si falta cobertura o vía legal en alguno de los usos que la requieren, registrar el punto pendiente y no adoptar una conclusión conjunta definitiva basándose únicamente en otros usos evaluados.",
          expected_result:
            "Una matriz completa y trazable por uso que sustente una conclusión profesional conjunta compatible con los estados reales del tratamiento. Los usos sin cobertura o vía legal determinadas deben impedir una conclusión prematura, conservando el detalle individual en la colección existente y sin generar nuevos hechos por uso.",
        },
        {
          evidence_item: "documentación de profiling",
          review_guide:
            "Revisar las actividades de elaboración de perfiles asociadas a los usos inventariados, identificando qué características personales se analizan, qué resultados se producen y cómo influyen en decisiones sobre titulares. Distinguir la elaboración de perfiles de la decisión que eventualmente se adopta a partir de ella y examinar su contribución a posibles efectos jurídicos o afectaciones significativas, sin atribuir automáticamente el mismo alcance legal a todas las técnicas de perfilamiento.",
          no_evidence_guidance:
            "Solicitar a producto, analítica o tecnología las descripciones funcionales de los modelos, segmentaciones o sistemas de clasificación utilizados en el tratamiento. Si no es posible establecer qué perfiles se generan o cómo se utilizan para tomar decisiones, identificar la incertidumbre y no afirmar cobertura ni exclusión del artículo 8 bis sin antecedentes suficientes.",
          expected_result:
            "Documentación que permita comprender los usos de elaboración de perfiles, los resultados que generan y su intervención en decisiones relevantes para el titular. Las relaciones no acreditadas entre perfilamiento, decisión y afectación deben permanecer abiertas a evaluación profesional, sin decisiones automatizadas del propio Nexo DPO.",
        },
        {
          evidence_item: "lógica/inputs/outputs relevantes",
          review_guide:
            "Examinar las entradas, reglas, modelos y resultados relevantes de cada uso para comprender cómo el tratamiento automatizado contribuye a una decisión concreta. Revisar los factores principales utilizados, los resultados producidos y la intervención humana cuando exista, procurando una explicación significativa de su funcionamiento sin exigir acceso irrestricto a código fuente ni considerar una descripción comercial del algoritmo como evidencia técnica suficiente.",
          no_evidence_guidance:
            "Recabar especificaciones funcionales, descripciones de modelos y antecedentes explicativos de los responsables técnicos que permitan reconstruir el flujo entre entradas, procesamiento y resultados. Si la lógica o sus efectos no pueden comprenderse con respaldo suficiente, identificar qué información falta y mantener pendiente la valoración correspondiente, sin inferir automáticamente la existencia o ausencia de cobertura jurídica.",
          expected_result:
            "Una descripción verificable y comprensible de las entradas, operaciones y resultados relevantes para cada uso, suficiente para sustentar la evaluación de automatización, perfilamiento y decisión producida. Las limitaciones técnicas y los elementos no explicados deben quedar documentados, preservando la futura capacidad de información y transparencia exigida por el artículo 8 bis.",
        },
        {
          evidence_item: "consecuencias para titulares",
          review_guide:
            "Evaluar qué efectos produce cada decisión automatizada sobre los titulares, distinguiendo consecuencias jurídicas de otras afectaciones que puedan resultar significativamente relevantes. Examinar la naturaleza, intensidad y contexto de la decisión, sus consecuencias prácticas y las posibilidades de intervención humana, sin presumir que cualquier recomendación, clasificación o cambio de experiencia digital supera automáticamente el umbral del artículo 8 bis.",
          no_evidence_guidance:
            "Solicitar a los responsables de negocio y del tratamiento una descripción de las decisiones producidas y de sus consecuencias previsibles para los titulares, utilizando escenarios ficticios cuando sea necesario. Si las consecuencias no están suficientemente identificadas, registrar la falta de antecedentes y evitar clasificar el uso solamente por el nombre de la herramienta o por la existencia de automatización.",
          expected_result:
            "Un análisis por uso que describa los efectos jurídicos o las posibles afectaciones significativas y fundamente su valoración dentro del artículo 8 bis. Deben distinguirse impactos comprobados, consecuencias previsibles e incertidumbres, sin resolver reclamaciones individuales ni atribuir automáticamente afectaciones a todo uso tecnológico.",
        },
        {
          evidence_item: "contratos",
          review_guide:
            "Examinar los contratos y las condiciones de prestación pertinentes para determinar si una decisión automatizada comprendida es realmente necesaria para celebrar o ejecutar un contrato entre el titular y el responsable, conforme a la letra a) del artículo 8 bis. Verificar la relación entre la decisión, la obligación contractual y su necesidad efectiva, sin confundir conveniencia empresarial, eficiencia operativa o mera mención contractual con el requisito legal de necesidad.",
          no_evidence_guidance:
            "Recabar las cláusulas y antecedentes que describan las prestaciones contractuales relacionadas con el uso automatizado, consultando a las áreas jurídica y operacional. Cuando no pueda verificarse la necesidad contractual de la decisión, identificar la evaluación pendiente sin inventar obligaciones, atribuir efectos a contratos no revisados o considerar automáticamente acreditada la excepción.",
          expected_result:
            "Un análisis documentado que permita valorar, para cada uso comprendido que invoque esta vía, si la decisión es necesaria para celebrar o ejecutar el contrato correspondiente. Las justificaciones insuficientes deben quedar diferenciadas de las excepciones acreditadas, sin alterar el contrato ni crear una base legal nueva.",
        },
        {
          evidence_item: "habilitación legal cuando se invoque",
          review_guide:
            "Verificar que, cuando se invoque la letra c) del artículo 8 bis, exista una disposición legal identificable que habilite la decisión automatizada y contemple las salvaguardas exigibles para proteger los derechos y libertades del titular. Examinar el alcance de la habilitación y su correspondencia con la decisión concreta, evitando interpretar permisos generales de tratamiento de datos como autorizaciones específicas para cualquier decisión automatizada.",
          no_evidence_guidance:
            "Solicitar la identificación de la norma invocada y el análisis jurídico que relaciona su contenido con el uso automatizado correspondiente. Si la habilitación o las salvaguardas legales no pueden verificarse, registrar el punto como no acreditado o pendiente según los antecedentes, sin inventar autorizaciones regulatorias ni atribuir a políticas internas valor de habilitación legal.",
          expected_result:
            "Un fundamento legal identificable y revisable para cada decisión comprendida que invoque la excepción de habilitación legal, con su alcance y salvaguardas pertinentes documentados. La ausencia de norma aplicable o las dudas sobre sus condiciones deben quedar expresamente reflejadas y sujetas a evaluación profesional.",
        },
        {
          evidence_item: "análisis profesional",
          review_guide:
            "Examinar el razonamiento jurídico conjunto para verificar que explique las conclusiones de cobertura de todos los usos registrados, los hechos relevantes, los efectos sobre titulares y las vías legales evaluadas. Comprobar que la conclusión seleccionada sea compatible con el conjunto de estados documentados, que las referencias a los usos estén completas y que las decisiones cubiertas se deriven a D4.09 aunque exista una excepción legal.",
          no_evidence_guidance:
            "Solicitar al profesional responsable la fundamentación de los usos y de la conclusión conjunta, identificando clasificaciones pendientes, contradicciones o ausencia de respaldo jurídico. Si el análisis es insuficiente, mantener la evaluación sin finalizar y completar los antecedentes necesarios mediante el mecanismo existente de ReasoningRecord, sin generar conclusiones automáticamente ni crear un registro separado por uso.",
          expected_result:
            "Un juicio profesional documentado en un único ReasoningRecord del tratamiento, coherente con las clasificaciones individuales y con los resultados canónicos permitidos. Debe conservar las referencias exactas a los usos considerados, los fundamentos y la evidencia pertinente, sin reemplazar el guard de finalización ni excluir D4.09 para usos cubiertos con excepción.",
        },
      ],
      help_text: [
        "Evalúa por cada uso: ¿decisión basada en tratamiento automatizado o profiling? ¿Produce efectos jurídicos o afectación significativa similar? ¿Necesaria para contrato? ¿Consentimiento previo y expreso? ¿Habilitación legal con salvaguardas? Documenta la conclusión individual de cada uso en el razonamiento.",
        "Que exista una excepción no elimina las salvaguardas: todos los usos cubiertos se derivan a D4.09.",
      ],
      required_facts: [REVIEWED_FACT, ...DERIVED],
      related_activity_keys: ["automated_decision.safeguards_enable"],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "no_covered_use",
      label: "Sin usos comprendidos por el artículo 8 bis",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el tratamiento no presenta usos comprendidos. Esto valida la evaluación de alcance, no el cumplimiento integral.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "automated_decision.scope_status", value: "no_covered_use" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz de usos, el análisis profesional y el razonamiento con los usos considerados.",
        },
      ],
    },
    {
      outcome_key: "covered_uses_with_legal_path",
      label: "Usos comprendidos con vía legal",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: existen usos comprendidos y todos cuentan con vía legal. Las salvaguardas siguen exigibles en D4.09.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        {
          fact_key: "automated_decision.scope_status",
          value: "covered_use_present",
        },
        {
          fact_key: "automated_decision.legal_path_status",
          value: "exception_identified",
        },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Habilitar salvaguardas en D4.09",
          activity_key: "automated_decision.safeguards_enable",
        },
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz de usos, el análisis profesional y el razonamiento con los usos considerados.",
        },
      ],
    },
    {
      outcome_key: "covered_use_without_legal_path",
      label: "Uso comprendido sin vía legal",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: existe al menos un uso comprendido sin excepción que permita la decisión. Requiere remediación jurídica.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        {
          fact_key: "automated_decision.scope_status",
          value: "covered_use_present",
        },
        {
          fact_key: "automated_decision.legal_path_status",
          value: "remediation_required",
        },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Remediar la vía legal",
          note: "Define una vía legal válida para cada uso cubierto sin ella o ajusta el tratamiento; luego reevalúa el alcance.",
        },
        {
          kind: "activity",
          label: "Revisar salvaguardas en D4.09",
          activity_key: "automated_decision.safeguards_enable",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Falta revisión del inventario o evaluación de cobertura o vías. Sin la base completa no hay conclusión definitiva.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar inventario y evaluación",
          note: "Registra y evalúa cada uso en la colección del tratamiento y vuelve a la guía.",
        },
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
  ],
  reasoning_requirements: {
    // Sin nodos de consideración más allá de la base estructural:
    // el registro exige conclusión, pregunta, hechos, razonamiento,
    // autoría, fecha, fundamento y evidencia. Las referencias exactas
    // a usos (`automated_use:<id>`) las compone el guard de
    // finalización, no el borrador manual.
    required_fields: [
      "conclusion",
      "legal_question",
      "facts_considered",
      "rationale",
      "decided_by",
      "decided_at",
      "legal_basis",
      "evidence_refs",
    ],
  },
};
