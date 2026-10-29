import type { ExecutionProtocol, EvidenceReviewHelp, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.05.
 *
 * activity_key = rights.opposition_enable (checklist, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente ramas, pasos adicionales, evidencia, dependencias
 * y state effect del contenido canónico D4.05.
 *
 * Stage 1 valida ramas y criterios de oposición; NO resuelve el
 * balance individual de interés legítimo ni persiste juicios sobre
 * casos (`reasoning_record_required = false`). El cese del
 * tratamiento se verifica como proceso disponible, no como orden
 * sobre un caso real. No redefine el interés legítimo de D2.
 *
 * Dependencia de completitud hacia D4.01 vía fact externo
 * `rights.exercise_mechanism_status`. Metodología `agency_standard`.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.opposition.li_opposition_allowed",
  "rights.opposition.li_cessation_criteria",
  "rights.opposition.marketing_opposition",
  "rights.opposition.marketing_cessation",
  "rights.opposition.public_source_covered",
  "rights.opposition.research_exception",
  "rights.opposition.cause_identified",
  "rights.opposition.brief_reasoning",
  "rights.opposition.additional_records",
  "rights.opposition.blocking_coordinated",
  "rights.opposition.third_parties_notified",
  "rights.opposition.common_procedure",
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

const EVIDENCE_REVIEW_HELP: Record<string, EvidenceReviewHelp[]> = {
  "check-li-opposition": [
    {
      evidence_item: "matriz de ramas y excepciones",
      review_guide:
        "Comprobar que la matriz reconozca el derecho a oponerse en cualquier momento cuando el tratamiento específico se fundamente en el interés legítimo del responsable. Examinar cómo se identifica esta rama, cómo se distingue de otros fundamentos de licitud y qué información permite derivar la solicitud a su evaluación correspondiente, sin convertir la presentación de una oposición en una decisión automática sobre su procedencia definitiva.",
      no_evidence_guidance:
        "Recabar los criterios jurídicos del procedimiento y las definiciones de bases de licitud aplicables, consultando a privacidad sobre cómo se recibiría una oposición por interés legítimo. Si la matriz no diferencia esta hipótesis, identificar la brecha sin inventar restricciones temporales, motivos obligatorios no previstos ni nuevos fundamentos legales.",
      expected_result:
        "Una matriz que contemple claramente la oposición en cualquier momento frente a tratamientos basados en interés legítimo, con una ruta para identificar y evaluar el tratamiento afectado. Las omisiones y dependencias jurídicas deben quedar reconocidas, sin adoptar balances individuales de derechos e intereses en Stage 1.",
    },
    {
      evidence_item: "mapping de tratamientos por base/finalidad",
      review_guide:
        "Contrastar las finalidades y bases de licitud documentadas en D2 con los tratamientos que podrían estar sujetos a oposición por interés legítimo. Revisar que el mapeo permita identificar los datos, operaciones y procesos afectados por una oposición concreta, distinguiendo los usos sustentados en interés legítimo de aquellos que tengan otro fundamento, sin redefinir sus bases jurídicas.",
      no_evidence_guidance:
        "Consultar el inventario de tratamientos y las evaluaciones de bases de licitud para reconstruir la relación entre operaciones, finalidades y sistemas. Si faltan correspondencias o los fundamentos no están determinados, señalar las verificaciones pendientes sin clasificar automáticamente todo tratamiento comercial como basado en interés legítimo.",
      expected_result:
        "Un mapeo trazable de tratamientos y finalidades que permita identificar el alcance potencial de la oposición por interés legítimo, con sus dependencias operativas. Las bases no verificadas y las discrepancias con D2 deben permanecer explícitas, sin alterar decisiones jurídicas preexistentes.",
    },
  ],
  "check-li-cessation": [
    {
      evidence_item: "matriz de ramas y excepciones",
      review_guide:
        "Examinar si la matriz establece el cese del tratamiento como consecuencia ordinaria de una oposición bajo interés legítimo, salvo acreditación de motivos legítimos imperiosos que prevalezcan sobre los derechos e intereses del titular o de necesidad para formular, ejercer o defender reclamaciones. Comprobar que el procedimiento exige fundamentación y evaluación de estas excepciones, sin presumir que cualquier interés empresarial justifica continuar tratando los datos.",
      no_evidence_guidance:
        "Consultar los criterios jurídicos para analizar oposición y posibles excepciones, identificando responsables, antecedentes necesarios y rutas de escalamiento. Si no existe una pauta de valoración, registrar la brecha sin inventar ponderaciones automáticas, motivos imperiosos genéricos ni decisiones sobre solicitudes reales.",
      expected_result:
        "Una matriz que distinga la regla de cese de las excepciones legalmente acreditables y contemple cómo evaluar sus fundamentos. Debe quedar clara la necesidad de valorar las circunstancias pertinentes en cada caso posterior, sin que la guía Stage 1 resuelva balances individuales.",
    },
    {
      evidence_item: "proceso de cese",
      review_guide:
        "Verificar cómo una decisión de cese procedente llegaría a los responsables y sistemas que ejecutan el tratamiento afectado, incluyendo operaciones dependientes de la finalidad correspondiente. Revisar mecanismos para interrumpir usos posteriores sin confundir el cese de una operación específica con eliminación indiscriminada de datos utilizados legítimamente para otras finalidades.",
      no_evidence_guidance:
        "Solicitar diagramas operacionales, instrucciones y antecedentes de control de tratamientos para identificar cómo se aplicarían decisiones de cese. Si faltan responsables o conexiones con sistemas relevantes, documentar la incertidumbre sin afirmar que una respuesta administrativa produce automáticamente la interrupción técnica del tratamiento.",
      expected_result:
        "Una ruta operacional revisable para aplicar el cese cuando proceda, con actividades, responsables y sistemas pertinentes identificados. Las dependencias técnicas o comprobaciones no realizadas deben quedar reconocidas sin implementar ceses de tratamientos reales durante Stage 1.",
    },
  ],
  "check-marketing-opposition": [
    {
      evidence_item: "revisión de campañas/profiling",
      review_guide:
        "Examinar las campañas, segmentaciones y actividades de elaboración de perfiles para identificar tratamientos realizados exclusivamente con fines de marketing directo, conforme al artículo 8, letra b). Distinguir el perfilamiento vinculado a esta finalidad de otros usos automatizados y revisar cómo se reconocerían los datos y canales afectados por el ejercicio de oposición, evitando una clasificación basada únicamente en nombres comerciales de campañas.",
      no_evidence_guidance:
        "Recabar inventarios de campañas, configuraciones de segmentación y antecedentes de los responsables de marketing y analítica. Si no se conocen las finalidades reales o los usos de perfiles, identificar las comprobaciones pendientes sin asumir que toda analítica constituye marketing directo o que la ausencia de campañas activas descarta tratamientos relevantes.",
      expected_result:
        "Una revisión documentada de los tratamientos de marketing directo y de los perfiles vinculados a ellos, suficiente para determinar qué operaciones podrían quedar alcanzadas por la oposición. Las finalidades ambiguas, fuentes no examinadas y tratamientos sin respaldo deben quedar señalados.",
    },
    {
      evidence_item: "procedimiento de marketing/direct profiling",
      review_guide:
        "Verificar que las instrucciones de marketing contemplen el ejercicio de oposición respecto del tratamiento exclusivamente destinado a marketing directo, incluida la elaboración de perfiles asociada a dicha finalidad. Comprobar cómo se identifica la persona y se comunica la oposición a los responsables de los canales pertinentes, sin imponer una justificación propia de la rama de interés legítimo cuando no corresponda.",
      no_evidence_guidance:
        "Consultar a las áreas comerciales y de privacidad sobre los canales, listas, segmentaciones y responsabilidades que intervienen en la recepción de oposiciones. Si no existe procedimiento específico, identificar las adaptaciones pendientes sin presumir que un enlace de baja comercial cubre automáticamente todos los tratamientos de marketing directo.",
      expected_result:
        "Un procedimiento específico para recibir y encauzar oposiciones a marketing directo y perfilamiento vinculado, con canales y responsables identificados. Deben quedar visibles las operaciones no cubiertas y las diferencias entre recepción de una preferencia y aplicación efectiva del cese.",
    },
  ],
  "check-marketing-cessation": [
    {
      evidence_item: "proceso de cese",
      review_guide:
        "Examinar cómo el procedimiento permite interrumpir los tratamientos de marketing directo alcanzados por una oposición, incluidas listas de destinatarios, campañas, audiencias y elaboración de perfiles vinculada cuando corresponda. Revisar la circulación de la decisión entre sistemas y proveedores pertinentes, diferenciando el cese verificable de una mera actualización visual de preferencias o de una exclusión aplicada a un único canal.",
      no_evidence_guidance:
        "Consultar los mecanismos de exclusión, sincronización de preferencias y ejecución de campañas para determinar qué operaciones deben modificarse. Si no existe una ruta completa de cese, identificar los sistemas, responsables y canales pendientes, sin inventar listas de supresión activas ni procesos automáticos de propagación.",
      expected_result:
        "Un proceso documentado para aplicar el cese del marketing directo y de su perfilamiento vinculado en las operaciones correspondientes, con cobertura y dependencias identificadas. Las herramientas previstas deben diferenciarse de aquellas cuyo funcionamiento haya sido efectivamente comprobado.",
    },
    {
      evidence_item: "walkthrough de cese",
      review_guide:
        "Realizar o examinar una simulación con datos ficticios que permita observar cómo una oposición de marketing se incorpora al mecanismo de exclusión y afecta posteriores operaciones de campaña y perfilamiento vinculado. Contrastar el resultado de la prueba con las rutas declaradas y verificar si la exclusión se mantiene en sistemas relevantes, sin considerar suficiente una confirmación visual aislada.",
      no_evidence_guidance:
        "Solicitar pruebas controladas de exclusión o antecedentes equivalentes de verificaciones anteriores, utilizando entornos apropiados y sin datos personales reales de titulares. Si no puede demostrarse el cese, registrar las etapas pendientes y los límites de la prueba, sin presentar la existencia de un botón o configuración como garantía de resultado.",
      expected_result:
        "Un recorrido funcional revisable que permita comprobar la capacidad de aplicar el cese en los canales y procesos examinados, con resultados y limitaciones documentados. Las integraciones no probadas deben reconocerse sin extrapolar el resultado a todos los tratamientos de la empresa.",
    },
  ],
  "check-public-source": [
    {
      evidence_item: "matriz de ramas y excepciones",
      review_guide:
        "Comprobar que la matriz contemple la oposición respecto de datos obtenidos de fuentes de acceso público cuando no exista otro fundamento legal para su tratamiento. Examinar cómo se verificaría tanto la procedencia de los datos como la eventual existencia de un fundamento distinto, evitando considerar que el carácter públicamente accesible de una fuente autoriza por sí solo cualquier uso posterior.",
      no_evidence_guidance:
        "Consultar los criterios de procedencia y licitud de los datos, junto con los antecedentes documentados en D2 sobre su origen y fundamento. Si no puede establecerse alguna de estas condiciones, identificar la incertidumbre sin inventar otra base legal ni concluir que todo dato públicamente disponible está excluido de la protección.",
      expected_result:
        "Un criterio de oposición que distinga el origen público de los datos de la existencia de un fundamento jurídico suficiente para tratarlos, conforme al artículo 8, letra c). Las fuentes o bases no acreditadas deben quedar pendientes de verificación, sin modificar la evaluación de licitud de D2.",
    },
  ],
  "check-research-exception": [
    {
      evidence_item: "matriz jurídica",
      review_guide:
        "Examinar si la matriz reconoce la excepción legal a la oposición cuando el tratamiento tenga fines de investigación científica o histórica o fines estadísticos y, además, resulte necesario para cumplir una función pública o ejercer una actividad de interés público. Verificar que ambos requisitos sean tratados de manera conjunta y que el criterio no considere suficiente el interés académico, estadístico o empresarial aislado.",
      no_evidence_guidance:
        "Solicitar los fundamentos jurídicos y criterios de evaluación utilizados para reconocer esta excepción, consultando las finalidades y funciones pertinentes. Si no están definidos los requisitos acumulativos o la necesidad pública, identificar las brechas sin presumir que cualquier investigación permite rechazar una oposición.",
      expected_result:
        "Una matriz jurídica que contemple la excepción científica, histórica o estadística bajo las condiciones acumulativas del artículo 8, con criterios revisables para fundamentar su eventual aplicación. No debe anticipar decisiones sobre investigaciones concretas ni convertir una finalidad genérica en excepción automática.",
    },
  ],
  "check-cause": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Verificar cómo el procedimiento identifica si una oposición corresponde a interés legítimo, marketing directo o datos procedentes de fuentes públicas, y qué pasos se seguirán cuando la solicitud sea ambigua o abarque varias operaciones. Revisar que la clasificación determine los requisitos y consecuencias pertinentes sin imponer a todas las ramas el mismo estándar de fundamentación o justificación.",
      no_evidence_guidance:
        "Consultar las instrucciones de atención y derivación para reconstruir cómo se determinaría la causal aplicable y el tratamiento afectado. Si faltan criterios o responsables, documentar las definiciones pendientes sin reinterpretar automáticamente toda manifestación de rechazo como una oposición jurídicamente idéntica.",
      expected_result:
        "Un procedimiento capaz de identificar y encauzar las distintas hipótesis de oposición, con rutas de derivación y criterios diferenciados. Las solicitudes ambiguas o supuestos no previstos deben reconocerse como situaciones que requieren aclaración o análisis posterior.",
    },
    {
      evidence_item: "templates",
      review_guide:
        "Examinar si los modelos de solicitud permiten identificar la operación o finalidad frente a la cual se formula la oposición y reunir la información pertinente según la rama aplicable. Revisar la claridad de las instrucciones y si existen campos que exijan causas o antecedentes innecesarios para supuestos de marketing directo.",
      no_evidence_guidance:
        "Recabar formularios y modelos utilizados o previstos para recibir oposiciones, consultando cómo se presentan al titular. Cuando no existan o no permitan identificar el tratamiento afectado, señalar la adaptación necesaria sin inventar formularios publicados ni requisitos legales adicionales.",
      expected_result:
        "Modelos de solicitud comprensibles, capaces de orientar la identificación de la oposición y su tratamiento correspondiente sin imponer cargas uniformes injustificadas. Las limitaciones de cobertura, claridad y aplicabilidad deben quedar identificadas.",
    },
  ],
  "check-reasoning": [
    {
      evidence_item: "templates",
      review_guide:
        "Comprobar que los modelos permitan recoger una fundamentación breve en la hipótesis de oposición basada en interés legítimo, de acuerdo con el artículo 11. Revisar que el campo o instrucción se relacione con esa rama específica y no se utilice indiscriminadamente para exigir explicaciones equivalentes en marketing directo u otros supuestos.",
      no_evidence_guidance:
        "Solicitar los modelos de solicitud y revisar sus campos de fundamento o motivos, contrastándolos con la matriz de ramas. Si no existe un espacio adecuado o se exige la misma explicación en todos los casos, identificar la corrección pendiente sin elaborar requisitos más extensos que los legales.",
      expected_result:
        "Un modelo que permita aportar la fundamentación breve jurídicamente pertinente para la rama de interés legítimo, sin transformarla en una barrera general al ejercicio de oposición. Las diferencias con otras hipótesis deben quedar claras para quien gestione el canal.",
    },
    {
      evidence_item: "escenarios controlados",
      review_guide:
        "Recorrer escenarios ficticios de oposición por interés legítimo y marketing directo para comprobar que el procedimiento distingue cuándo corresponde recibir una fundamentación breve y cuándo no debe trasladarse automáticamente esa exigencia. Observar las decisiones de clasificación y derivación previstas, sin resolver el balance jurídico de un caso real.",
      no_evidence_guidance:
        "Solicitar ejemplos simulados que permitan comparar el tratamiento procedimental de distintas ramas o preparar pruebas con datos ficticios. Si no se han contrastado estos supuestos, identificar las comprobaciones pendientes sin presentar ejemplos hipotéticos como solicitudes efectivamente resueltas.",
      expected_result:
        "Escenarios controlados que muestren una aplicación diferenciada de las exigencias de fundamentación, con posibles barreras o inconsistencias detectadas. La simulación debe acreditar comprensión del procedimiento sin generar decisiones individualizadas ni registros de Stage 2.",
    },
  ],
  "check-records": [
    {
      evidence_item: "templates",
      review_guide:
        "Examinar si el modelo permite que el titular acompañe antecedentes adicionales relevantes para explicar su oposición o facilitar la localización de los datos, respetando las reglas procedimentales del artículo 11. Verificar que la posibilidad de aportar información complementaria no se convierta en un requisito obligatorio indiscriminado o en una causa de rechazo automático ante su ausencia.",
      no_evidence_guidance:
        "Consultar los modelos y las instrucciones de recepción para determinar cómo podrían incorporarse antecedentes adicionales y quién los evaluaría. Si no existe una vía definida, identificar la brecha sin inventar documentos obligatorios ni solicitar datos personales reales para demostrar la capacidad del canal.",
      expected_result:
        "Un modelo que permita adjuntar o proporcionar antecedentes adicionales pertinentes cuando corresponda, sin imponer cargas improcedentes. Las condiciones de recepción, revisión y protección de esa información deben ser identificables, con las limitaciones pendientes reconocidas.",
    },
  ],
  "check-blocking": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Verificar que las instrucciones reconozcan la eventual solicitud fundada de bloqueo temporal vinculada a una oposición y su coordinación con D4.06. Examinar cómo se derivaría el requerimiento a la ruta especial, considerando el plazo de dos días hábiles para responder y las restricciones aplicables mientras se resuelve la solicitud de bloqueo, sin confundirlo con el cese definitivo de la oposición.",
      no_evidence_guidance:
        "Consultar el procedimiento de oposición y la ruta de bloqueo de D4.06 para identificar responsables y puntos de derivación. Si no existe una coordinación definida, señalar las brechas y decisiones pendientes sin suponer que toda oposición genera bloqueo automático ni implementar suspensión real de tratamientos en Stage 1.",
      expected_result:
        "Un procedimiento que contemple la coordinación con el bloqueo temporal cuando sea solicitado y proceda conforme a la ley, con condiciones, responsabilidades y plazo especial diferenciados. Las conexiones no definidas deben quedar reconocidas sin sustituir la evaluación específica de D4.06.",
    },
  ],
  "check-third-parties": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Comprobar que el procedimiento contemple la comunicación de los cambios derivados de una oposición a las personas a quienes el responsable comunicó previamente los datos, cuando corresponda conforme al artículo 11. Revisar cómo se identificarían esos destinatarios, qué cambios deben informarse y quién sería responsable de comunicar, distinguiendo la obligación de informar de la posibilidad de controlar directamente sistemas externos.",
      no_evidence_guidance:
        "Consultar los registros de destinatarios y las instrucciones de comunicación con terceros para reconstruir cómo se gestionaría esa consecuencia. Si faltan criterios de identificación o canales de comunicación, documentar las brechas sin inventar notificaciones efectuadas ni atribuir al responsable control técnico sobre todos los receptores.",
      expected_result:
        "Una ruta documentada para identificar destinatarios pertinentes y comunicarles los cambios derivados de una oposición cuando corresponda, con responsabilidades y medios previstos. Deben distinguirse las obligaciones del responsable, las gestiones con terceros y los resultados que no puedan comprobarse.",
    },
    {
      evidence_item: "walkthrough de cese",
      review_guide:
        "Revisar mediante un escenario controlado cómo una oposición procedente podría generar actuaciones de cese y la comunicación de cambios a destinatarios relevantes. Examinar si el recorrido distingue el tratamiento interno, el envío de instrucciones o avisos y la verificación de actuaciones externas, sin considerar que una simulación acredita notificaciones reales.",
      no_evidence_guidance:
        "Solicitar un recorrido con datos ficticios que permita observar la relación entre la decisión de cese prevista y las comunicaciones externas. Si las pruebas solo cubren sistemas internos, identificar la parte del proceso no verificada sin presuponer que los terceros ya recibieron o ejecutaron cambios.",
      expected_result:
        "Una simulación revisable de la coordinación entre cese y comunicación a terceros, con las etapas observadas y sus límites documentados. La prueba debe distinguir la capacidad de enviar comunicaciones de la ejecución efectiva por destinatarios externos.",
    },
  ],
  "check-common": [
    {
      evidence_item: "escenarios controlados",
      review_guide:
        "Recorrer con supuestos ficticios las distintas rutas de oposición y su conexión con el procedimiento general D4.01, desde recepción, clasificación y derivación hasta respuesta y eventuales consecuencias operacionales. Comprobar la capacidad para aplicar los plazos generales, incluido el período ordinario de treinta días corridos y la prórroga única cuando corresponda, sin generar vencimientos ni decisiones sobre solicitudes reales.",
      no_evidence_guidance:
        "Solicitar simulaciones que permitan comprobar la articulación entre D4.01 y los criterios específicos de oposición, utilizando información ficticia y sin expedientes individuales. Si no se han probado las rutas, identificar etapas, responsabilidades o plazos pendientes de comprobación sin considerar suficiente una descripción general del mecanismo.",
      expected_result:
        "Escenarios controlados que permitan valorar la capacidad del procedimiento para tramitar las diversas hipótesis de oposición mediante las reglas comunes de D4.01. Deben quedar diferenciadas las etapas funcionalmente comprobadas, las pendientes y las cuestiones reservadas a la resolución de cada caso en Stage 2.",
    },
  ],
};

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
    ...(EVIDENCE_REVIEW_HELP[node_key]
      ? { evidence_review_help: EVIDENCE_REVIEW_HELP[node_key] }
      : {}),
    required_facts: [],
    default_next_node_key: next,
    ...(related ? { related_activity_keys: related } : {}),
    provenance: "agency_standard",
  };
}

export const RIGHTS_OPPOSITION_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.opposition_enable.v1",
  activity_key: "rights.opposition_enable",
  version: 1,
  mode: "checklist",
  execution_scope: "company",
  title: "Habilitación guiada del derecho de oposición",
  description:
    "Verifica que el procedimiento cubra las hipótesis legales de oposición (interés legítimo, marketing directo, fuente pública) y su excepción, con cese del tratamiento cuando corresponda. Valida ramas y criterios, sin resolver casos individuales.",
  entry_node_key: "check-li-opposition",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    node(
      "check-li-opposition",
      "Interés legítimo: oposición",
      "¿El procedimiento permite la oposición en cualquier momento cuando la base sea interés legítimo?",
      "Rama de interés legítimo: la oposición es permanente, no sujeta a ventana.",
      "rights.opposition.li_opposition_allowed",
      "Oposición permanente prevista en la matriz.",
      ["matriz de ramas y excepciones", "mapping de tratamientos por base/finalidad"],
      "check-li-cessation",
    ),
    node(
      "check-li-cessation",
      "Interés legítimo: cese y motivos imperiosos",
      "¿El procedimiento contempla el cese del tratamiento salvo que el responsable acredite motivos legítimos imperiosos que prevalezcan, o necesidad para formular, ejercer o defender reclamaciones?",
      "El cese es la regla; los motivos imperiosos o las reclamaciones son la excepción a acreditar, sin resolver el balance de un caso real.",
      "rights.opposition.li_cessation_criteria",
      "Criterio de cese y excepción documentado con escalamiento.",
      ["matriz de ramas y excepciones", "proceso de cese"],
      "check-marketing-opposition",
    ),
    node(
      "check-marketing-opposition",
      "Marketing directo: oposición",
      "¿El procedimiento contempla la oposición cuando el tratamiento sea exclusivamente para marketing directo, incluida la elaboración de perfiles vinculada a dicho marketing?",
      "Rama de marketing directo, con su profiling vinculado.",
      "rights.opposition.marketing_opposition",
      "Oposición de marketing prevista.",
      ["revisión de campañas/profiling", "procedimiento de marketing/direct profiling"],
      "check-marketing-cessation",
    ),
    node(
      "check-marketing-cessation",
      "Marketing directo: cese",
      "¿El procedimiento dispone el cese operacional correspondiente del marketing y su profiling vinculado?",
      "La oposición de marketing se traduce en cese operacional verificable.",
      "rights.opposition.marketing_cessation",
      "Cese operacional previsto y verificable con walkthrough.",
      ["proceso de cese", "walkthrough de cese"],
      "check-public-source",
    ),
    node(
      "check-public-source",
      "Fuente de acceso público",
      "¿El procedimiento contempla la oposición cuando los datos provengan de fuente de acceso público y no exista otro fundamento legal?",
      "Rama de fuente pública: sin otra base, la oposición procede.",
      "rights.opposition.public_source_covered",
      "Rama de fuente pública contemplada.",
      ["matriz de ramas y excepciones"],
      "check-research-exception",
    ),
    node(
      "check-research-exception",
      "Excepción científica, histórica y estadística",
      "¿El procedimiento reconoce que no procede oposición cuando el tratamiento sea para investigación científica o histórica o fines estadísticos y sea necesario para función pública o actividad de interés público?",
      "Excepción acumulativa: fin científico/histórico/estadístico más necesidad pública.",
      "rights.opposition.research_exception",
      "Excepción documentada en la matriz.",
      ["matriz jurídica"],
      "check-cause",
    ),
    node(
      "check-cause",
      "Causal invocada",
      "¿El procedimiento identifica la causal de oposición invocada en cada caso?",
      "Sin causal identificada no hay cauce aplicable.",
      "rights.opposition.cause_identified",
      "Identificación de causal prevista.",
      ["procedimiento", "templates"],
      "check-reasoning",
    ),
    node(
      "check-reasoning",
      "Fundamentación breve",
      "¿El procedimiento contempla la fundamentación breve requerida en la rama de interés legítimo?",
      "La fundamentación breve habilita evaluar la oposición sin prejuzgar su resultado.",
      "rights.opposition.brief_reasoning",
      "Recepción de fundamentación prevista.",
      ["templates", "escenarios controlados"],
      "check-records",
    ),
    node(
      "check-records",
      "Antecedentes adicionales",
      "¿El procedimiento permite acompañar antecedentes adicionales a la oposición?",
      "Los antecedentes permiten fundar sin imponer cargas indebidas.",
      "rights.opposition.additional_records",
      "Recepción de antecedentes prevista.",
      ["templates"],
      "check-blocking",
    ),
    node(
      "check-blocking",
      "Bloqueo temporal",
      "¿El procedimiento coordina el bloqueo temporal mientras se resuelve la oposición?",
      "El bloqueo protege mientras la oposición está pendiente.",
      "rights.opposition.blocking_coordinated",
      "Coordinación con bloqueo prevista.",
      ["procedimiento"],
      "check-third-parties",
      ["rights.blocking_enable"],
    ),
    node(
      "check-third-parties",
      "Comunicación a terceros",
      "¿El procedimiento comunica los cambios a terceros receptores cuando corresponda?",
      "La oposición exitosa debe alcanzar los tratamientos informados a terceros.",
      "rights.opposition.third_parties_notified",
      "Comunicación a terceros prevista.",
      ["procedimiento", "walkthrough de cese"],
      "check-common",
    ),
    node(
      "check-common",
      "Procedimiento común",
      "¿La oposición utiliza el procedimiento y los plazos comunes de D4.01, sin decidir solicitudes individuales en Stage 1?",
      "Cauces y plazos comunes; Stage 1 no decide casos.",
      "rights.opposition.common_procedure",
      "Uso del procedimiento común verificado.",
      ["escenarios controlados"],
      "synthesis",
      ["rights.exercise_mechanism_design"],
    ),
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la oposición",
      prompt:
        "El sistema verifica el mecanismo general de D4.01 y la cobertura de ramas y criterios de oposición.",
      answer_type: "none",
      required_facts: [MECHANISM_FACT, ...CHECKS],
      transitions: [
        {
          rule_id: "mechanism-not-designed",
          description:
            "El mecanismo general aún no está diseñado en D4.01: la habilitación no puede concluir.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: MECHANISM_FACT,
              value: "designed",
            },
          },
          goto_outcome_key: "mechanism_pending",
          explanation:
            "La atención de la oposición solo está completa sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un punto del marco de oposición requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas en ramas, criterios o cese operacional.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún punto está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan puntos por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "opposition-complete",
          description:
            "Mecanismo diseñado con ramas y criterios de oposición cubiertos.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: MECHANISM_FACT,
                value: "designed",
              },
              ...CHECKS.map(satisfied),
            ],
          },
          goto_outcome_key: "opposition_enabled",
          explanation:
            "El procedimiento puede identificar causales y aplicar el cese cuando corresponda.",
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
      outcome_key: "opposition_enabled",
      label: "Atención de la oposición habilitada",
      classification: "agency_standard",
      explanation:
        "La empresa dispone de matriz de oposición y procedimiento de cese. Esto valida ramas y criterios, sin resolver balances individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.opposition_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz de ramas y excepciones, el procedimiento, el mapping de tratamientos por base/finalidad, el proceso de cese, el procedimiento de marketing, los templates y el walkthrough.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "La atención de la oposición solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Diseñar el mecanismo general en D4.01",
          activity_key: "rights.exercise_mechanism_design",
        },
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere correcciones de oposición",
      classification: "agency_standard",
      explanation:
        "Al menos un punto del marco requiere corrección. Completa ramas, criterios o cese.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada punto pendiente y vuelve a verificar el marco de oposición.",
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
        "Existen puntos pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
  ],
};
