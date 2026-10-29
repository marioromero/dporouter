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

const EVIDENCE_REVIEW_HELP: Record<
  string,
  import("./types").GuidanceNode["evidence_review_help"]
> = {
  "check-owners": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Examinar cómo el procedimiento asigna responsables internos para gestionar las salvaguardas de cada uso automatizado comprendido en el artículo 8 bis. Verificar que se identifiquen las funciones encargadas de proporcionar información, obtener explicaciones, intervenir humanamente y tramitar revisiones, distinguiendo responsables generales del tratamiento de quienes cuentan realmente con competencia y medios para actuar sobre una decisión.",
      no_evidence_guidance:
        "Consultar a privacidad, responsables del tratamiento y equipos operacionales para identificar quién podría ejercer cada función y cómo se coordinarían las actuaciones. Si no existe una asignación formal o verificable, documentar las responsabilidades pendientes sin presumir que designar un DPO o propietario del sistema equivale a disponer de todos los operadores necesarios.",
      expected_result:
        "Un procedimiento que identifique responsables y funciones para las salvaguardas de los usos comprendidos, con rutas de coordinación suficientemente claras. Las competencias no asignadas, capacidades no demostradas y dependencias entre áreas deben quedar reconocidas, sin crear expedientes individuales de decisiones.",
    },
    {
      evidence_item: "flujo de revisión",
      review_guide:
        "Contrastar el flujo de revisión con los responsables designados para comprobar quién recibe una solicitud, quién obtiene los antecedentes de la decisión automatizada y quién puede realizar la intervención humana correspondiente. Examinar las transferencias de responsabilidad y la posibilidad de escalar situaciones complejas, evitando procesos en que ninguna persona tenga capacidad real para revisar o corregir el resultado.",
      no_evidence_guidance:
        "Solicitar diagramas, instrucciones de derivación o explicaciones operacionales que permitan reconstruir las responsabilidades del flujo. Si existen etapas sin encargado o sin facultades definidas, identificar esas brechas sin atribuir automáticamente capacidad de decisión a quienes solo reciben o trasladan solicitudes.",
      expected_result:
        "Un flujo de revisión trazable que relacione las etapas de atención con responsables identificados y facultades pertinentes para cada uso comprendido. Los puntos de transferencia, escalamiento y revisión no definidos deben quedar explícitos, diferenciando diseño organizacional de funcionamiento comprobado.",
    },
  ],
  "check-channels": [
    {
      evidence_item: "canal para punto de vista",
      review_guide:
        "Verificar que los titulares puedan expresar su punto de vista respecto de decisiones automatizadas comprendidas y que exista una ruta para recibirlo y ponerlo a disposición de quienes revisan la decisión. Examinar la accesibilidad del canal, la claridad de sus instrucciones y su conexión con los usos pertinentes, evitando considerar suficiente un buzón genérico sin procedimiento de derivación.",
      no_evidence_guidance:
        "Consultar los canales de atención y los procedimientos destinados a recibir observaciones o antecedentes de los titulares. Si no existe una ruta identificable para incorporar su punto de vista, señalar las definiciones pendientes sin inventar formularios disponibles ni asumir que cualquier canal comercial satisface esta garantía.",
      expected_result:
        "Un canal previsto y operacionalmente verificable para recibir el punto de vista del titular y derivarlo al proceso de revisión correspondiente. Deben quedar reconocidas las restricciones de acceso, derivaciones incompletas y usos que todavía no cuenten con cobertura acreditada.",
    },
    {
      evidence_item: "canal/proceso de revisión",
      review_guide:
        "Examinar cómo se solicita la revisión de una decisión automatizada comprendida, quién recibe el requerimiento y cómo se inicia la evaluación correspondiente. Verificar que el canal esté vinculado a un proceso real, con responsables y mecanismos de atención diferenciados según el uso, sin asumir que proporcionar una dirección de contacto equivale a garantizar una revisión efectiva.",
      no_evidence_guidance:
        "Recabar los procedimientos y canales de revisión existentes, consultando a las áreas encargadas de decisiones automatizadas. Si no existe una conexión verificable entre recepción, evaluación y respuesta, registrar la brecha sin diseñar un sistema de tickets de casos reales ni inventar plazos legales específicos.",
      expected_result:
        "Un mecanismo que permita solicitar revisión y encauzarla hacia responsables con capacidad de evaluar la decisión automatizada pertinente. Las limitaciones operativas y los usos sin canal efectivo deben quedar identificados, sin exigir una plataforma tecnológica determinada.",
    },
  ],
  "check-explanation": [
    {
      evidence_item: "mecanismo para explicación",
      review_guide:
        "Comprobar que exista una forma efectiva de obtener información comprensible sobre cómo se produjo cada tipo de decisión automatizada comprendida, considerando los datos y factores relevantes, el proceso decisorio y las consecuencias del resultado. Examinar cómo se obtiene esa explicación de los equipos o sistemas pertinentes y distinguir un contenido explicativo útil de una declaración genérica sobre el uso de algoritmos.",
      no_evidence_guidance:
        "Consultar las especificaciones de los sistemas, las descripciones de modelos y a los responsables técnicos para determinar qué información puede utilizarse para explicar una decisión. Si no existen mecanismos suficientes para obtenerla, identificar las dependencias y limitaciones técnicas sin inventar explicaciones o presumir que disponer del código fuente asegura una comunicación comprensible.",
      expected_result:
        "Un mecanismo revisable que permita obtener explicaciones pertinentes y comprensibles para los usos automatizados comprendidos, con responsables, fuentes y limitaciones identificados. Las capacidades no implementadas y los factores relevantes aún no explicables deben quedar expresamente documentados.",
    },
    {
      evidence_item: "prueba de explicación",
      review_guide:
        "Examinar una prueba controlada que permita generar una explicación de una decisión automatizada ficticia y comprobar que describa los elementos pertinentes del resultado de manera comprensible. Contrastar el contenido producido con el funcionamiento conocido del sistema, evitando considerar suficiente una explicación genérica que no permita entender la decisión ni una salida técnica inaccesible para el titular.",
      no_evidence_guidance:
        "Solicitar una demostración con escenarios simulados o antecedentes verificables de pruebas realizadas previamente, sin utilizar datos personales reales. Si no se ha demostrado la capacidad de generar una explicación, señalar los pasos pendientes y las limitaciones técnicas, sin confundir una especificación teórica con funcionamiento efectivamente comprobado.",
      expected_result:
        "Una prueba revisable de obtención de explicaciones para los usos examinados, con contenido, comprensión y correspondencia técnica evaluables. Las decisiones o modelos no incluidos en la prueba deben permanecer identificados como límites de cobertura, sin afirmar que todos los usos están habilitados a partir de un único ejemplo.",
    },
  ],
  "check-intervention": [
    {
      evidence_item: "diseño de intervención humana",
      review_guide:
        "Examinar si el diseño permite que una persona competente evalúe sustantivamente la decisión automatizada, acceda a los antecedentes pertinentes y tenga facultades reales para mantenerla, modificarla o revertirla cuando corresponda. Revisar la independencia funcional, los criterios de actuación y la disponibilidad de información, evitando considerar intervención humana una aprobación meramente formal o una ratificación inevitable del resultado automatizado.",
      no_evidence_guidance:
        "Recabar las funciones asignadas a los revisores humanos, sus facultades y la información que tendrían disponible para intervenir. Si el diseño no contempla capacidad efectiva de análisis o corrección, identificar las brechas sin presumir que la presencia de una persona dentro del proceso basta para satisfacer la garantía.",
      expected_result:
        "Un diseño de intervención humana que establezca responsables competentes, acceso a antecedentes relevantes y facultades sustantivas de revisión de las decisiones comprendidas. Las restricciones de autoridad, información o recursos deben quedar reconocidas, diferenciando capacidades diseñadas de capacidades efectivamente implementadas.",
    },
    {
      evidence_item: "walkthrough funcional",
      review_guide:
        "Recorrer con una decisión ficticia cómo interviene una persona en el proceso, qué antecedentes puede consultar y qué acciones puede ejecutar frente al resultado automatizado. Observar si el recorrido permite una valoración independiente y una modificación real cuando corresponda, distinguiendo los controles funcionales de una intervención meramente nominal o de una aprobación predeterminada.",
      no_evidence_guidance:
        "Solicitar una demostración controlada del proceso de intervención humana, incluyendo las facultades disponibles para el operador y los resultados que podría producir. Si no puede verificarse una actuación sustantiva, registrar las etapas no comprobadas y los límites de acceso o autoridad sin utilizar decisiones reales de titulares.",
      expected_result:
        "Un recorrido funcional revisable que permita acreditar la capacidad de intervención humana sustantiva dentro de los usos probados, con información disponible, actuaciones y resultados observados. Las capacidades no demostradas y las restricciones funcionales deben quedar explícitas.",
    },
    {
      evidence_item: "entrevistas con operadores",
      review_guide:
        "Contrastar mediante entrevistas si los operadores conocen los criterios de revisión, comprenden las decisiones automatizadas sobre las que intervienen y disponen de autoridad e información para cuestionarlas. Examinar la correspondencia entre el procedimiento declarado y sus prácticas operacionales, distinguiendo conocimiento general del sistema de capacidad efectiva para valorar y corregir decisiones.",
      no_evidence_guidance:
        "Consultar a los responsables de equipos y operadores previstos para identificar funciones, formación, recursos y facultades relacionados con la intervención humana. Si no existen operadores identificados o no hay antecedentes suficientes sobre su actuación, registrar la incertidumbre sin atribuir competencia real a un cargo solamente por su denominación.",
      expected_result:
        "Antecedentes de entrevistas que permitan contrastar la preparación, facultades y posibilidades reales de actuación de los operadores frente a las decisiones comprendidas. Deben quedar identificadas las necesidades de formación, acceso a información o definición de responsabilidades, sin convertir las entrevistas en expedientes individuales.",
    },
  ],
  "check-viewpoint": [
    {
      evidence_item: "operadores responsables de revisión humana",
      review_guide:
        "Verificar que los operadores encargados de la revisión puedan recibir, comprender y considerar efectivamente las observaciones o antecedentes aportados por el titular al expresar su punto de vista. Examinar si disponen de facultades para incorporar esa información en la valoración de la decisión y distinguir una recepción meramente administrativa de una consideración sustantiva dentro del proceso.",
      no_evidence_guidance:
        "Consultar las atribuciones, instrucciones y prácticas previstas para los operadores de revisión humana, identificando cómo se utilizarían observaciones y antecedentes adicionales. Si los responsables no cuentan con facultades o una ruta clara para incorporarlos, registrar la brecha sin presumir que reenviar un mensaje constituye una consideración efectiva del punto de vista.",
      expected_result:
        "Operadores identificados y capacitados funcionalmente para considerar el punto de vista del titular en la revisión de decisiones automatizadas comprendidas, con responsabilidades y facultades revisables. Las limitaciones de actuación o de incorporación de antecedentes deben quedar explícitas.",
    },
    {
      evidence_item: "revisión del flujo de intervención",
      review_guide:
        "Examinar el flujo completo desde la recepción del punto de vista del titular hasta su consideración por el revisor humano y la posibilidad de revisar el resultado automatizado. Contrastar las etapas con las capacidades funcionales disponibles y comprobar que las observaciones puedan influir en la evaluación, sin exigir que toda revisión produzca necesariamente una modificación de la decisión.",
      no_evidence_guidance:
        "Recabar diagramas o instrucciones sobre recepción, derivación, evaluación e incorporación de observaciones en el procedimiento. Si no puede verificarse cómo llegan los antecedentes al revisor o cómo serían considerados, identificar las etapas pendientes sin implementar un ciclo de vida de solicitudes individuales.",
      expected_result:
        "Un flujo revisable que permita incorporar el punto de vista del titular en la evaluación humana y habilite la solicitud de revisión correspondiente, con responsabilidades y resultados posibles identificados. Los puntos de desconexión, etapas meramente nominales y usos sin cobertura suficiente deben quedar reconocidos.",
    },
  ],
  "check-coherence": [
    {
      evidence_item: "walkthrough/prueba controlada",
      review_guide:
        "Contrastar mediante un recorrido controlado las salvaguardas efectivamente previstas para los usos automatizados comprendidos con la información pública y las medidas de transparencia definidas en D3. Verificar que las explicaciones, canales de intervención y revisión y posibilidades de expresar el punto de vista sean coherentes con lo que la organización comunica, detectando promesas no implementadas o capacidades existentes que no estén suficientemente reflejadas en la información pública.",
      no_evidence_guidance:
        "Recabar los antecedentes de transparencia pública de D3 y una prueba controlada de los mecanismos de salvaguarda del tratamiento. Si no se dispone de información pública o demostración funcional suficiente, identificar las discrepancias y verificaciones pendientes sin modificar las definiciones canónicas de D3 ni inventar comunicaciones ya publicadas.",
      expected_result:
        "Una comprobación documentada de coherencia entre los mecanismos de salvaguarda de D4.09 y las declaraciones de información y transparencia de D3, con discrepancias y limitaciones identificadas. La revisión debe conservar D3 como fuente de verdad y distinguir las capacidades operacionales verificadas de las aún no implementadas.",
    },
  ],
};

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
    evidence_review_help: EVIDENCE_REVIEW_HELP[node_key] ?? [],
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
