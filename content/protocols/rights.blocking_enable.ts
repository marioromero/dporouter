import type { ExecutionProtocol, EvidenceReviewHelp, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.06.
 *
 * activity_key = rights.blocking_enable (procedure, company scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, dependencias y state effect del contenido
 * canónico D4.06. Verifica la capacidad de suspender temporalmente
 * operaciones de tratamiento sin administrar bloqueos reales.
 *
 * El plazo especial de 2 días hábiles se verifica como requisito
 * de capacidad del procedimiento (matriz de plazo especial,
 * template de decisión): NO se crea timer, dueAt, calendar engine
 * ni scheduler de días hábiles. Sin BlockingRequest, sin lifecycle
 * persistente: la transición al resolver el derecho principal se
 * verifica como regla, no como historial.
 *
 * Dependencia de completitud hacia D4.01 vía fact externo
 * `rights.exercise_mechanism_status`. Metodología `agency_standard`.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.blocking.joint_request_covered",
  "rights.blocking.alternative_covered",
  "rights.blocking.founded_request",
  "rights.blocking.two_day_capacity",
  "rights.blocking.treatment_halted",
  "rights.blocking.storage_permitted",
  "rights.blocking.suspension_executed",
  "rights.blocking.rejection_founded",
  "rights.blocking.agency_communication",
  "rights.blocking.complaint_route",
  "rights.blocking.transition_resolved",
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

function verifyOptions(factKey: string, yesHint: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: yesHint,
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "El punto aún no está cubierto en el procedimiento.",
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

const EVIDENCE_REVIEW_HELP: Record<string, EvidenceReviewHelp[]> = {
  "check-joint-request": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Examinar cómo el procedimiento permite reconocer y tramitar una solicitud de bloqueo temporal vinculada con el ejercicio de rectificación, supresión u oposición mientras el derecho principal permanece pendiente de resolución. Comprobar que estén identificadas las rutas de recepción, los responsables de la derivación y la delimitación de los datos afectados, evitando tratar el bloqueo como una consecuencia automática de cualquier solicitud principal.",
      no_evidence_guidance:
        "Consultar los procedimientos de ejercicio de derechos y a las áreas responsables para determinar cómo se recibiría y coordinaría una solicitud conjunta. Si no existe una ruta definida, identificar los pasos, responsables y condiciones pendientes de diseño, sin presumir que los mecanismos generales de D4.01 contemplan por sí solos esta protección especial.",
      expected_result:
        "Un procedimiento revisable que permita reconocer y derivar el bloqueo temporal solicitado durante una rectificación, supresión u oposición, con sus condiciones y responsables identificados. Las brechas de coordinación o de identificación de los datos afectados deben quedar explícitas, sin generar solicitudes individuales en Nexo DPO.",
    },
  ],
  "check-alternative": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Verificar que las instrucciones contemplen el ejercicio del bloqueo como alternativa a la supresión en los supuestos legalmente previstos por el artículo 7, distinguiéndolo del bloqueo solicitado mientras se resuelve un derecho principal. Revisar cómo se identificaría la opción ejercida, quién evaluaría sus condiciones y qué consecuencias operacionales se preverían, sin equiparar la conservación bloqueada con una supresión ejecutada.",
      no_evidence_guidance:
        "Solicitar los criterios jurídicos y operacionales relativos al bloqueo alternativo, consultando su correspondencia con el procedimiento D4.04. Si esta modalidad no está prevista o se confunde con una suspensión meramente provisional durante la tramitación, identificar la definición pendiente sin inventar causales ni resolver situaciones individuales.",
      expected_result:
        "Un marco procedimental que distinga el bloqueo alternativo de la supresión y del bloqueo vinculado a una solicitud principal pendiente, con criterios jurídicos y consecuencias previstas. Las condiciones de aplicación que requieran evaluación posterior deben quedar identificadas, sin ordenar retenciones o eliminaciones reales.",
    },
    {
      evidence_item: "matriz de plazo especial",
      review_guide:
        "Contrastar cómo la matriz distingue las distintas modalidades de bloqueo y las reglas de tramitación pertinentes, sin trasladar automáticamente el plazo especial de dos días hábiles a cualquier actuación ajena a su supuesto legal. Revisar que las referencias temporales sean coherentes con el artículo 11 y que el procedimiento identifique los momentos relevantes de recepción, respuesta y coordinación con el derecho principal.",
      no_evidence_guidance:
        "Recabar las reglas de plazos y los criterios jurídicos aplicables a las modalidades de bloqueo, contrastándolos con los artículos 8 ter y 11. Si las condiciones temporales no están diferenciadas, señalar las comprobaciones pendientes sin inventar plazos adicionales, fechas de vencimiento ni reglas de cómputo automáticas.",
      expected_result:
        "Una matriz que represente adecuadamente las reglas temporales pertinentes para el bloqueo y distinga los supuestos en que resultan exigibles. Las dudas de aplicabilidad o coordinación deben permanecer reconocidas, sin transformar el documento en un calendario de solicitudes individuales.",
    },
  ],
  "check-founded": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Examinar cómo se recibe una solicitud fundada de bloqueo temporal, qué información permite identificar los datos comprendidos y de qué manera se consideran los motivos expuestos por el titular. Comprobar que exista una ruta para evaluar la solicitud sin imponer formalidades arbitrarias ni exigir una prueba exhaustiva que convierta la fundamentación en una barrera injustificada.",
      no_evidence_guidance:
        "Consultar las instrucciones de recepción y los criterios utilizados por privacidad para determinar qué antecedentes permiten examinar la solicitud de bloqueo. Si no existe un procedimiento definido, identificar la información y las responsabilidades pendientes sin inventar causales obligatorias, documentos uniformes o decisiones anticipadas.",
      expected_result:
        "Un procedimiento que contemple la recepción de solicitudes fundadas y permita identificar los datos afectados, los motivos presentados y la ruta de evaluación pertinente. Las dificultades para determinar el alcance de una solicitud deben quedar reconocidas sin resolver requerimientos individuales en Stage 1.",
    },
    {
      evidence_item: "template de decisión",
      review_guide:
        "Revisar que el modelo permita documentar de forma comprensible los antecedentes considerados y la decisión prevista frente a una solicitud de bloqueo, diferenciando su eventual concesión o rechazo. Contrastar su estructura con la exigencia legal de fundamentación y verificar que no induzca respuestas genéricas o decisiones automáticas desvinculadas de los datos comprendidos.",
      no_evidence_guidance:
        "Solicitar modelos de respuesta y criterios de evaluación de solicitudes de bloqueo para identificar cómo se reflejarían los fundamentos pertinentes. Si no existe un template, señalar los elementos que requieren definición sin presentar un formato específico como obligación legal universal ni inventar decisiones adoptadas.",
      expected_result:
        "Un modelo de decisión que permita expresar de manera fundada el resultado de la evaluación de bloqueo y relacionarlo con el requerimiento correspondiente. Las condiciones no previstas y las necesidades de revisión jurídica deben quedar identificadas sin generar respuestas reales a titulares.",
    },
  ],
  "check-two-day": [
    {
      evidence_item: "matriz de plazo especial",
      review_guide:
        "Comprobar que la matriz recoja correctamente el plazo máximo de dos días hábiles siguientes a la recepción de la solicitud de bloqueo y distinga ese plazo de los treinta días corridos del procedimiento general de derechos. Examinar las etapas y responsabilidades previstas para recibir, evaluar y responder oportunamente, considerando la necesidad de gestionar días inhábiles sin exigir que Nexo DPO calcule vencimientos individuales.",
      no_evidence_guidance:
        "Recabar las instrucciones de plazos, horarios de recepción y responsabilidades operacionales para reconstruir cómo se aseguraría la respuesta en el período legal. Si faltan reglas o controles, identificar las brechas sin inventar mecanismos de calendario, porcentajes de cumplimiento o plazos internos que la ley no establece.",
      expected_result:
        "Una matriz revisable que refleje el plazo legal de dos días hábiles y permita evaluar la capacidad organizacional para responder oportunamente. Las dependencias y verificaciones pendientes deben quedar identificadas, sin crear timers, fechas de vencimiento ni expedientes individuales.",
    },
    {
      evidence_item: "walkthrough o prueba controlada",
      review_guide:
        "Examinar una simulación con datos ficticios que recorra recepción, derivación, evaluación y preparación de la respuesta a una solicitud de bloqueo, considerando un escenario representativo del plazo especial. Verificar que las responsabilidades y actuaciones previstas puedan ejecutarse oportunamente y distinguir una demostración controlada de una garantía de cumplimiento en todos los casos futuros.",
      no_evidence_guidance:
        "Solicitar pruebas internas o una demostración controlada del circuito de respuesta, incluyendo las intervenciones necesarias de privacidad y operaciones. Si no existen pruebas suficientes, identificar las etapas cuya duración o coordinación no ha sido comprobada, sin utilizar datos personales reales ni calcular vencimientos operativos en Stage 1.",
      expected_result:
        "Una demostración revisable de la capacidad del procedimiento para preparar y emitir respuesta dentro del plazo especial aplicable, con etapas observadas y posibles puntos de demora identificados. Las capacidades solo documentadas deben distinguirse de las efectivamente probadas.",
    },
  ],
  "check-halt": [
    {
      evidence_item: "capacidad técnica de suspensión",
      review_guide:
        "Verificar que existan mecanismos para impedir las operaciones de tratamiento sobre los datos comprendidos en la solicitud desde que resulta aplicable la prohibición mientras se resuelve el bloqueo. Examinar cómo se delimitan los datos y procesos afectados, considerando accesos, usos, transferencias, sincronizaciones y operaciones automatizadas pertinentes, sin confundir la detención del tratamiento con la eliminación del almacenamiento permitido.",
      no_evidence_guidance:
        "Consultar las especificaciones y los responsables de los sistemas para identificar qué mecanismos permitirían suspender las operaciones correspondientes durante la evaluación. Cuando no exista cobertura suficiente, señalar las rutas y controles pendientes sin presumir que desactivar un registro o interfaz impide todo tratamiento posterior.",
      expected_result:
        "Una capacidad técnica documentada para impedir las operaciones comprendidas mientras el responsable resuelve la solicitud de bloqueo, conservando el almacenamiento legalmente permitido. Las operaciones no cubiertas o las integraciones no verificadas deben quedar reconocidas de manera explícita.",
    },
    {
      evidence_item: "walkthrough técnico",
      review_guide:
        "Recorrer mediante un escenario técnico controlado qué ocurre con las operaciones sobre los datos afectados cuando se activa la suspensión durante la evaluación del bloqueo. Observar intentos representativos de uso o actualización y comprobar si los controles previstos impiden esas actuaciones, diferenciando resultados observados de prohibiciones declaradas solamente en un procedimiento.",
      no_evidence_guidance:
        "Solicitar una demostración segura con datos ficticios o antecedentes verificables de pruebas técnicas anteriores. Si no es posible demostrar la detención, identificar las operaciones que permanecen sin comprobación y las condiciones necesarias para probarlas, sin atribuir eficacia a controles únicamente descritos.",
      expected_result:
        "Un recorrido técnico que permita valorar la interrupción de las operaciones pertinentes durante la tramitación del bloqueo, con controles y resultados observados. Las limitaciones de alcance y los procesos no probados deben quedar identificados sin ejecutar suspensiones sobre datos reales.",
    },
    {
      evidence_item: "simulación de suspensión",
      review_guide:
        "Examinar una simulación del estado de suspensión correspondiente a una solicitud pendiente y comprobar que los procesos afectados respeten la restricción mientras no exista una resolución. Contrastar los resultados con las instrucciones del procedimiento, observando si se mantienen operaciones no autorizadas o rutas que podrían eludir los controles previstos.",
      no_evidence_guidance:
        "Recabar escenarios ficticios y criterios de prueba que representen solicitudes pendientes de bloqueo y operaciones relevantes sobre los datos afectados. Si no existen simulaciones, identificar las condiciones que deben ensayarse sin inventar bloqueos concedidos, resultados satisfactorios o historiales de casos.",
      expected_result:
        "Una simulación revisable de la suspensión durante la evaluación, suficiente para identificar operaciones impedidas, dependencias y eventuales brechas técnicas. Debe quedar diferenciada de la ejecución de un bloqueo concedido y de la administración individual de solicitudes.",
    },
  ],
  "check-storage": [
    {
      evidence_item: "prueba de almacenamiento sin tratamiento",
      review_guide:
        "Comprobar mediante una prueba controlada que los datos afectados pueden permanecer almacenados durante el bloqueo sin quedar disponibles para operaciones de tratamiento incompatibles con la suspensión. Examinar la separación entre conservación y usos posteriores, incluyendo procesos que pudieran acceder, modificar o comunicar la información, sin interpretar el almacenamiento permitido como autorización general para continuar tratándola.",
      no_evidence_guidance:
        "Solicitar una demostración de conservación bajo restricciones o antecedentes técnicos que permitan distinguir almacenamiento de operaciones suspendidas. Si no existe prueba suficiente, identificar los usos potenciales que requieren comprobación sin asumir que conservar un archivo o mantener una base de datos equivale automáticamente a cumplir el bloqueo.",
      expected_result:
        "Una verificación que permita valorar la conservación de los datos durante el bloqueo junto con la restricción de las demás operaciones pertinentes. Las limitaciones técnicas y los controles no probados deben quedar reconocidos, sin exigir eliminación definitiva ni imponer una arquitectura específica.",
    },
    {
      evidence_item: "configuración/controles",
      review_guide:
        "Revisar las configuraciones y controles previstos para restringir las operaciones sobre datos bloqueados mientras se mantiene su almacenamiento, identificando permisos, estados funcionales o mecanismos equivalentes que resulten pertinentes. Contrastar las configuraciones con los procesos realmente afectados y comprobar si existen excepciones operativas no justificadas o rutas de acceso que puedan eludir la suspensión.",
      no_evidence_guidance:
        "Consultar especificaciones de seguridad, configuraciones de sistemas y responsables técnicos para determinar cómo se separarán almacenamiento y operaciones restringidas. Cuando los controles no estén definidos o no pueda verificarse su aplicación, señalar las brechas sin imponer una tecnología, etiqueta de estado o esquema de permisos universal.",
      expected_result:
        "Controles documentados y revisables que permitan preservar los datos almacenados sin mantener habilitadas las operaciones de tratamiento suspendidas. Deben distinguirse configuraciones previstas, controles implementados y funcionamiento comprobado, con sus incertidumbres identificadas.",
    },
  ],
  "check-suspension": [
    {
      evidence_item: "capacidad técnica de suspensión",
      review_guide:
        "Verificar que el procedimiento contemple cómo ejecutar y mantener la suspensión temporal correspondiente cuando se conceda el bloqueo, identificando los sistemas, responsables y operaciones alcanzadas. Contrastar el diseño con las dependencias técnicas y las actuaciones necesarias para materializar la decisión, diferenciando la capacidad de recibir una solicitud de la capacidad de aplicar efectivamente sus consecuencias.",
      no_evidence_guidance:
        "Recabar especificaciones de bloqueo, responsabilidades técnicas e instrucciones de ejecución para determinar cómo se aplicaría una decisión favorable. Si no existe una ruta completa, identificar los componentes pendientes sin afirmar que una resolución administrativa bloquea automáticamente todos los sistemas afectados.",
      expected_result:
        "Una ruta técnica y operacional para ejecutar una decisión favorable de bloqueo temporal, con responsabilidades, controles y sistemas pertinentes identificados. Las etapas no implementadas o no verificadas deben quedar reconocidas sin realizar suspensiones individuales desde Nexo DPO.",
    },
    {
      evidence_item: "walkthrough o prueba controlada",
      review_guide:
        "Examinar una prueba con datos ficticios en la que se simule la concesión del bloqueo y la aplicación de la suspensión sobre los procesos correspondientes. Comprobar que el resultado pueda verificarse y que la restricción se mantenga conforme a las reglas previstas, distinguiendo el efecto técnico observado de la mera existencia de una decisión documentada.",
      no_evidence_guidance:
        "Solicitar una demostración controlada de la ejecución y mantenimiento del bloqueo o antecedentes de validaciones funcionales previas. Si la prueba no cubre todos los sistemas pertinentes, señalar los puntos pendientes sin extrapolar un resultado positivo de un componente al funcionamiento integral.",
      expected_result:
        "Una prueba revisable de la capacidad de ejecutar el bloqueo concedido, con operaciones suspendidas, controles observados y limitaciones de alcance identificadas. La demostración no debe crear decisiones jurídicas reales ni registrar solicitudes individuales en Stage 1.",
    },
  ],
  "check-rejection": [
    {
      evidence_item: "template de decisión",
      review_guide:
        "Examinar que el modelo de rechazo exija expresar los fundamentos de la decisión y los antecedentes que justifican no conceder el bloqueo solicitado. Comprobar que la respuesta permita identificar el alcance del requerimiento y la razón pertinente, evitando fórmulas genéricas o denegaciones automáticas basadas exclusivamente en conveniencia técnica u organizacional.",
      no_evidence_guidance:
        "Recabar modelos de respuesta y criterios jurídicos de denegación para identificar cómo se fundamentaría una decisión desfavorable. Si faltan instrucciones o espacios para expresar motivos y antecedentes, señalar las correcciones pendientes sin inventar causales legales ni preparar rechazos de solicitudes reales.",
      expected_result:
        "Un modelo de rechazo que permita comunicar una decisión fundada y sustentada en los antecedentes pertinentes, de forma compatible con el artículo 11. Las causas no definidas y las limitaciones de revisión deben quedar identificadas sin resolver casos particulares.",
    },
  ],
  "check-agency": [
    {
      evidence_item: "mecanismo de comunicación a Agencia",
      review_guide:
        "Verificar que el procedimiento contemple la comunicación electrónica a la Agencia de la decisión que rechaza una solicitud de bloqueo temporal, distinguiéndola de la notificación dirigida al titular. Examinar qué área sería responsable de emitirla, qué información debería reunir y cómo se conservaría evidencia del envío, considerando los medios regulatorios disponibles sin inventar plataformas específicas.",
      no_evidence_guidance:
        "Consultar a privacidad y a las áreas responsables de comunicaciones regulatorias sobre la ruta prevista para informar electrónicamente los rechazos. Si no existe un mecanismo definido o faltan instrucciones sobre el canal aplicable, registrar las dependencias pendientes sin suponer que enviar una respuesta al titular satisface también la comunicación a la Agencia.",
      expected_result:
        "Un mecanismo documentado para comunicar electrónicamente los rechazos de bloqueo a la Agencia, con responsables, contenido pertinente y respaldo de remisión previstos. Las dependencias regulatorias o técnicas no verificadas deben quedar reconocidas sin afirmar comunicaciones efectivamente realizadas.",
    },
  ],
  "check-complaint": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Examinar si el procedimiento explica la vía de reclamación del titular ante la Agencia cuando el responsable rechaza una solicitud de bloqueo temporal, incluyendo las condiciones de presentación y los antecedentes correspondientes. Comprobar que distinga el plazo de dos días hábiles para la respuesta del responsable, el plazo de treinta días hábiles para reclamar y el plazo especial máximo de tres días hábiles para que la Agencia resuelva las reclamaciones y solicitudes de suspensión formuladas tras el rechazo, sin necesidad de oír previamente a las partes.",
      no_evidence_guidance:
        "Solicitar al área jurídica o de privacidad las instrucciones vigentes sobre reclamación ante la Agencia y contrastarlas con los artículos 11 y 41. Si el procedimiento no contempla el rechazo del bloqueo o confunde los plazos del titular, del responsable y de la Agencia, registrar la brecha y los ajustes documentales necesarios sin crear registros de reclamaciones reales ni mecanismos de seguimiento individual.",
      expected_result:
        "Un procedimiento que permita orientar correctamente al titular sobre la reclamación por rechazo de bloqueo temporal, sus condiciones y los plazos legales diferenciados. Debe reconocer expresamente que la resolución especial de la Agencia tiene un máximo de tres días hábiles y no requiere audiencia previa de las partes, sin atribuir ese plazo al responsable ni alterar la tramitación de la solicitud principal.",
    },
    {
      evidence_item: "template de decisión",
      review_guide:
        "Revisar el modelo de comunicación de rechazo del bloqueo temporal para comprobar que identifique la decisión y sus fundamentos, informe la posibilidad de reclamar ante la Agencia y describa adecuadamente el plazo de treinta días hábiles para presentar la reclamación. Verificar que la orientación complementaria distinga el plazo especial máximo de tres días hábiles que corresponde a la Agencia para resolver la reclamación y eventual solicitud de suspensión, sin presentar ese plazo como una obligación de respuesta del responsable.",
      no_evidence_guidance:
        "Solicitar los modelos de respuesta o rechazo utilizados por privacidad y atención de derechos, contrastando sus instrucciones con los artículos 11 y 41. Si falta información sobre la reclamación o se confunden los plazos legales, identificar las correcciones necesarias y validar su contenido jurídico sin emitir decisiones reales ni inventar comunicaciones ya realizadas.",
      expected_result:
        "Un modelo de rechazo fundado que informe correctamente la vía de reclamación ante la Agencia y el plazo aplicable al titular, con orientación coherente sobre el procedimiento especial de resolución en tres días hábiles por parte de la Agencia. Debe evitar atribuir competencias o plazos a un actor equivocado y permanecer consistente con el procedimiento general de D4.01.",
    },
  ],
  "check-transition": [
    {
      evidence_item: "revisión procedimental",
      review_guide:
        "Examinar qué reglas prevé el procedimiento para revisar la continuidad o terminación del bloqueo cuando se resuelva la solicitud principal de rectificación, supresión u oposición. Verificar que se contemplen las consecuencias jurídicas y operacionales pertinentes, distinguiendo los supuestos de bloqueo vinculado a una solicitud pendiente del bloqueo ejercido como alternativa a la supresión y evitando una reanudación automática de tratamientos sin fundamento.",
      no_evidence_guidance:
        "Consultar las instrucciones de cierre del derecho principal y los criterios de coordinación con los responsables técnicos para reconstruir cómo se evaluaría el estado posterior de los datos. Si faltan reglas sobre continuidad, levantamiento o sustitución de restricciones, identificar las decisiones pendientes sin crear estados de casos, eventos históricos ni automatismos de reactivación.",
      expected_result:
        "Un procedimiento que contemple la revisión de las restricciones de bloqueo al producirse la resolución pertinente y permita identificar las acciones posteriores que correspondan jurídicamente. Las condiciones no definidas deben quedar explícitas, sin crear un ciclo de vida persistente ni presumir que resolver el derecho principal autoriza siempre reanudar el tratamiento.",
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
    options: verifyOptions(factKey, yesHint),
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

export const RIGHTS_BLOCKING_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.blocking_enable.v1",
  activity_key: "rights.blocking_enable",
  version: 1,
  mode: "procedure",
  execution_scope: "company",
  title: "Habilitación guiada del bloqueo temporal",
  description:
    "Verifica que la empresa pueda recibir, decidir y ejecutar oportunamente el bloqueo temporal: suspensión de operaciones con almacenamiento permitido y respuesta en 2 días hábiles como capacidad. Sin timers ni casos reales.",
  entry_node_key: "check-joint-request",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    node(
      "check-joint-request",
      "Bloqueo junto al derecho principal",
      "¿El procedimiento reconoce que puede solicitarse bloqueo junto con rectificación, supresión u oposición mientras la solicitud principal esté pendiente?",
      "El bloqueo vive acompañado del derecho principal en trámite.",
      "rights.blocking.joint_request_covered",
      "Solicitud conjunta contemplada.",
      ["procedimiento"],
      "check-alternative",
    ),
    node(
      "check-alternative",
      "Bloqueo como alternativa a supresión",
      "¿El procedimiento reconoce el bloqueo como alternativa a la supresión en los casos previstos por el art. 7?",
      "En esos casos el bloqueo sustituye a la eliminación.",
      "rights.blocking.alternative_covered",
      "Alternativa del art. 7 contemplada.",
      ["procedimiento", "matriz de plazo especial"],
      "check-founded",
    ),
    node(
      "check-founded",
      "Solicitud fundada",
      "¿El procedimiento recibe una solicitud de bloqueo fundada?",
      "La fundación habilita decidir sin arbitrariedad.",
      "rights.blocking.founded_request",
      "Recepción de solicitud fundada prevista.",
      ["procedimiento", "template de decisión"],
      "check-two-day",
    ),
    node(
      "check-two-day",
      "Capacidad de responder en 2 días hábiles",
      "¿El procedimiento asegura capacidad para responder dentro de 2 días hábiles desde la recepción, sin implementar timers ni vencimientos calculados?",
        "El plazo especial es un requisito de capacidad: la empresa debe poder responder a tiempo, sin motor de vencimientos.",
      "rights.blocking.two_day_capacity",
      "Capacidad de respuesta en plazo verificada con matriz y prueba controlada.",
      ["matriz de plazo especial", "walkthrough o prueba controlada"],
      "check-halt",
    ),
    node(
      "check-halt",
      "Detención del tratamiento",
      "¿El procedimiento impide el tratamiento de los datos comprendidos mientras la solicitud de bloqueo no sea resuelta?",
      "Bloquear sin detener es una suspensión nominal.",
      "rights.blocking.treatment_halted",
      "Detención verificada con walkthrough técnico.",
      ["capacidad técnica de suspensión", "walkthrough técnico", "simulación de suspensión"],
      "check-storage",
    ),
    node(
      "check-storage",
      "Almacenamiento permitido",
      "¿El procedimiento mantiene permitido el almacenamiento de los datos bloqueados?",
      "El bloqueo suspende operaciones, no borra el depósito.",
      "rights.blocking.storage_permitted",
      "Almacenamiento sin tratamiento verificado.",
      ["prueba de almacenamiento sin tratamiento", "configuración/controles"],
      "check-suspension",
    ),
    node(
      "check-suspension",
      "Ejecución de la suspensión",
      "¿La empresa puede ejecutar la suspensión temporal correspondiente cuando el bloqueo se concede?",
      "Conceder sin ejecutar deja el bloqueo en el papel.",
      "rights.blocking.suspension_executed",
      "Ejecución verificada con prueba controlada.",
      ["capacidad técnica de suspensión", "walkthrough o prueba controlada"],
      "check-rejection",
    ),
    node(
      "check-rejection",
      "Rechazo fundado",
      "¿El procedimiento exige fundamentación cuando el bloqueo se rechaza?",
      "Todo rechazo debe poder defenderse con razones.",
      "rights.blocking.rejection_founded",
      "Fundamentación del rechazo exigida con template.",
      ["template de decisión"],
      "check-agency",
    ),
    node(
      "check-agency",
      "Comunicación a la Agencia",
      "¿El procedimiento prevé la comunicación electrónica del rechazo a la Agencia?",
      "El rechazo se comunica electrónicamente a la autoridad.",
      "rights.blocking.agency_communication",
      "Mecanismo de comunicación previsto.",
      ["mecanismo de comunicación a Agencia"],
      "check-complaint",
    ),
    node(
      "check-complaint",
      "Ruta de reclamación",
      "¿El procedimiento informa y gestiona la ruta de reclamación legal aplicable al bloqueo?",
      "El titular debe conocer su vía frente al rechazo.",
      "rights.blocking.complaint_route",
      "Ruta de reclamación incorporada.",
      ["procedimiento", "template de decisión"],
      "check-transition",
    ),
    node(
      "check-transition",
      "Transición al resolver el derecho principal",
      "¿El procedimiento resuelve la transición cuando termina la solicitud principal, sin crear lifecycle persistente en Stage 1?",
      "La transición es una regla del procedimiento, no un historial de casos.",
      "rights.blocking.transition_resolved",
      "Regla de transición verificada en revisión procedimental.",
      ["revisión procedimental"],
      "synthesis",
      ["rights.exercise_mechanism_design"],
    ),
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis del bloqueo",
      prompt:
        "El sistema verifica el mecanismo general de D4.01 y la capacidad de bloqueo temporal.",
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
            "El bloqueo solo está completo sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un punto del bloqueo requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de capacidad de bloqueo que requieren corrección.",
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
          rule_id: "blocking-complete",
          description:
            "Mecanismo diseñado con capacidad de bloqueo verificada.",
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
          goto_outcome_key: "blocking_enabled",
          explanation:
            "La empresa puede suspender temporalmente operaciones con almacenamiento permitido y responder en plazo como capacidad.",
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
      outcome_key: "blocking_enabled",
      label: "Bloqueo temporal habilitado",
      classification: "agency_standard",
      explanation:
        "La empresa dispone de procedimiento y capacidad técnica de bloqueo temporal. Esto valida la capacidad, sin administrar bloqueos reales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.blocking_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva el procedimiento, la evidencia de capacidad técnica de suspensión, la configuración y controles, la matriz de plazo especial, el template de decisión, el mecanismo de comunicación a la Agencia y el walkthrough o prueba controlada.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "El bloqueo solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
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
      label: "Requiere correcciones de bloqueo",
      classification: "agency_standard",
      explanation:
        "Al menos un punto del bloqueo requiere corrección. Completa la capacidad faltante.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada punto pendiente y vuelve a verificar la capacidad de bloqueo.",
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
