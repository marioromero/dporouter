import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.01.
 *
 * activity_key = rights.exercise_mechanism_design (procedure, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, dependencias y state effect del
 * contenido canónico D4.01. Diseña y valida el mecanismo general para
 * el ejercicio de derechos; nunca administra solicitudes reales.
 *
 * Sin RightRequest, sin DataSubject, sin timers: los plazos legales
 * (30 días corridos, una prórroga hasta 30 días, reclamo ante la
 * Agencia) se verifican como capacidad del procedimiento, nunca como
 * vencimientos calculados. Sin montos de costos: solo reglas de
 * gratuidad y coordinación con instrucciones de la Agencia.
 *
 * Condicionales honestos (representante/mandatario, herederos,
 * prórroga, denegación, responsable no constituido en Chile, acceso
 * repetido, bloqueo) usan la opción explícita "No aplica en este
 * caso" donde la ausencia es legítima: la ausencia legítima nunca es
 * incumplimiento. `reasoning_record_required = false`: sin juicio,
 * sin ReasoningRecord. Sin dependencias: D4.01 es raíz del dominio.
 *
 * Metodología `legal_requirement` en el outcome positivo (la ley
 * exige el mecanismo); templates, walkthrough y matrices son método
 * y nunca se presentan como prescritos por ley.
 */

const CHECKS = [
  "rights.mechanism.channels_defined",
  "rights.mechanism.ease_effectiveness",
  "rights.mechanism.standing_covered",
  "rights.mechanism.heirs_covered",
  "rights.mechanism.authentication_designed",
  "rights.mechanism.request_data_covered",
  "rights.mechanism.per_right_records",
  "rights.mechanism.access_simplicity",
  "rights.mechanism.receipt_issued",
  "rights.mechanism.classification_routing",
  "rights.mechanism.deadline_30_capacity",
  "rights.mechanism.extension_covered",
  "rights.mechanism.response_form",
  "rights.mechanism.remission_proof",
  "rights.mechanism.denial_founded",
  "rights.mechanism.complaint_info",
  "rights.mechanism.blocking_routed",
  "rights.mechanism.gratuity_rules",
  "rights.mechanism.foreign_entity_covered",
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

function verifyOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "El punto fue verificado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "El punto aún no está cubierto en el mecanismo.",
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

function conditionalOptions(factKey: string, naHint: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "El punto fue verificado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "na",
      label: "No aplica en este caso",
      description: naHint,
      fact_effect: { fact_key: factKey, value: "na" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "El punto aún no está cubierto en el mecanismo.",
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

export const RIGHTS_EXERCISE_MECHANISM_DESIGN_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.exercise_mechanism_design.v1",
  activity_key: "rights.exercise_mechanism_design",
  version: 1,
  mode: "procedure",
  execution_scope: "company",
  title: "Diseño guiado del mecanismo general de ejercicio de derechos",
  description:
    "Verifica que el responsable disponga de un mecanismo general, operativo y documentado para recibir, tramitar y responder el ejercicio de derechos: canales, autenticación, acuse, plazos como capacidad, respuesta, denegación fundada, reclamo, gratuidad y coordinación con bloqueo. No administra solicitudes reales.",
  entry_node_key: "check-channels",
  decision_fact_keys: [...CHECKS],
  last_review: "2026-09-24",
  provenance: "legal_requirement",
  nodes: [
    {
      node_key: "check-channels",
      node_type: "question",
      title: "Canales de recepción",
      prompt:
        "¿Están identificados el o los canales para recibir solicitudes: correo electrónico, formulario de contacto o medio electrónico equivalente?",
      why_it_matters:
        "Cubre el paso canónico 1: sin canal identificado no hay ejercicio posible.",
      fact_key: "rights.mechanism.channels_defined",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.channels_defined"),
      evidence_to_review: ["canales habilitados", "formularios/templates"],
      evidence_review_help: [
        {
          evidence_item: "canales habilitados",
          review_guide:
            "Verificar los medios definidos para recibir solicitudes de ejercicio de derechos, comprobando que existan vías identificables y adecuadas a los requisitos del artículo 11. Contrastar las declaraciones de habilitación con la configuración y accesibilidad del canal, sin asumir funcionamiento por su sola mención.",
          no_evidence_guidance:
            "Consultar a las áreas responsables sobre los canales previstos, sus direcciones o puntos de acceso y las condiciones para recibir solicitudes. Si no pueden acreditarse, identificar las definiciones pendientes sin inventar medios operativos.",
          expected_result:
            "Una relación verificable de canales para presentar solicitudes, con sus condiciones y responsables identificados. Los canales aún no implementados o sin comprobación deben quedar diferenciados de los efectivamente habilitados.",
        },
        {
          evidence_item: "formularios/templates",
          review_guide:
            "Examinar los modelos de solicitud para determinar cómo orientan al titular hacia un medio de recepción válido y qué instrucciones contienen para presentar su requerimiento. Identificar referencias a canales inexistentes, inconsistentes o no disponibles.",
          no_evidence_guidance:
            "Recabar los modelos utilizados o proyectados y consultar cómo se presentan al titular. Cuando no existan, señalar las piezas pendientes sin atribuir a un borrador el carácter de formulario publicado.",
          expected_result:
            "Modelos coherentes con los canales identificados y con instrucciones comprensibles para iniciar el ejercicio de derechos. Las diferencias entre versiones, borradores y medios operativos deben quedar reconocidas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-ease",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-ease",
      node_type: "question",
      title: "Sencillez y eficacia",
      prompt:
        "¿Los mecanismos y herramientas son sencillos en su operación y permiten un ejercicio expedito, ágil y eficaz?",
      why_it_matters:
        "Cubre el paso canónico 2: la ley exige sencillez operativa y eficacia del ejercicio.",
      fact_key: "rights.mechanism.ease_effectiveness",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.ease_effectiveness"),
      evidence_to_review: ["prueba o walkthrough del proceso"],
      evidence_review_help: [
        {
          evidence_item: "prueba o walkthrough del proceso",
          review_guide:
            "Recorrer de forma controlada la presentación de una solicitud, examinando claridad de instrucciones, pasos exigidos y obstáculos para completar el trámite. Diferenciar requisitos justificados de cargas innecesarias que comprometan un ejercicio sencillo, expedito, ágil y eficaz.",
          no_evidence_guidance:
            "Solicitar una demostración con datos ficticios o revisar resultados de recorridos existentes. Si el proceso no puede probarse, identificar las comprobaciones pendientes sin considerar sencilla una interfaz solo por su apariencia.",
          expected_result:
            "Una evaluación funcional con pasos observados, dificultades y limitaciones identificadas, suficiente para valorar la facilidad y eficacia del mecanismo. La prueba puntual no debe presentarse como garantía absoluta de funcionamiento futuro.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-standing",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-standing",
      node_type: "question",
      title: "Titular, representante y mandatario",
      prompt:
        "¿El procedimiento atiende solicitudes del propio titular, su representante legal o mandatario, según corresponda?",
      why_it_matters:
        "Cubre el paso canónico 3: la legitimación para ejercer determina quién puede solicitar.",
      fact_key: "rights.mechanism.standing_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.standing_covered"),
      evidence_to_review: ["procedimiento general de ejercicio de derechos"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento general de ejercicio de derechos",
          review_guide:
            "Comprobar que las instrucciones contemplen solicitudes del titular, su representante legal o mandatario, distinguiendo las facultades y comprobaciones pertinentes a cada modalidad. Revisar que la legitimación pueda verificarse sin imponer barreras desproporcionadas.",
          no_evidence_guidance:
            "Consultar las reglas internas de recepción y acreditación de representación. Si faltan criterios para alguna modalidad, identificar los supuestos pendientes sin asumir que toda actuación por terceros está autorizada o prohibida.",
          expected_result:
            "Un procedimiento que reconozca las modalidades legales de ejercicio y contemple verificaciones apropiadas para cada una. Los vacíos de legitimación o representación deben quedar documentados sin exigir formatos universales no establecidos por la ley.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-heirs",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-heirs",
      node_type: "question",
      title: "Ejercicio por herederos",
      prompt:
        "¿El procedimiento incorpora el ejercicio por herederos cuando legalmente proceda, con sus limitaciones, o no procede en este caso?",
      why_it_matters:
        "Cubre el paso canónico 4, condicional: solo cuando el ejercicio por herederos proceda legalmente.",
      fact_key: "rights.mechanism.heirs_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "rights.mechanism.heirs_covered",
        "El ejercicio por herederos no procede legalmente en este caso.",
      ),
      evidence_to_review: ["procedimiento general de ejercicio de derechos"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento general de ejercicio de derechos",
          review_guide:
            "Examinar cómo se contempla el ejercicio por herederos tras el fallecimiento del titular y cómo se verifican las limitaciones legales, particularmente una prohibición expresa del causante o una restricción establecida por ley. Contrastar cualquier declaración de inaplicabilidad con el contexto real del responsable.",
          no_evidence_guidance:
            "Recabar los criterios internos sobre solicitudes de herederos y la comprobación de su legitimación. Si no puede determinarse su procedencia, identificar la cuestión pendiente sin descartar automáticamente estos derechos por tratarse de una persona fallecida.",
          expected_result:
            "Un procedimiento que contemple el ejercicio por herederos cuando legalmente proceda y las limitaciones correspondientes, o una inaplicabilidad justificada. La falta de antecedentes no debe tratarse como fundamento suficiente de «No aplica».",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-authentication",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-authentication",
      node_type: "question",
      title: "Autenticación",
      prompt:
        "¿El mecanismo de autenticación está diseñado conforme a los procedimientos, formas y modalidades que establezca la Agencia?",
      why_it_matters:
        "Cubre el paso canónico 5: autenticar sin bloquear ilegítimamente el ejercicio.",
      fact_key: "rights.mechanism.authentication_designed",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.authentication_designed"),
      evidence_to_review: ["diseño de autenticación", "roles y responsables internos"],
      evidence_review_help: [
        {
          evidence_item: "diseño de autenticación",
          review_guide:
            "Verificar cómo se comprobará la identidad de quien ejerza el derecho y, cuando corresponda, su legitimación para actuar por otra persona. Contrastar las medidas previstas con el artículo 11 y las instrucciones aplicables de la Agencia, distinguiendo requisitos vigentes de mecanismos técnicos propuestos.",
          no_evidence_guidance:
            "Consultar especificaciones de identificación y las instrucciones regulatorias disponibles para identificar las comprobaciones previstas y sus incertidumbres. No inventar modalidades exigidas por la Agencia ni considerar conforme un mecanismo no evaluado.",
          expected_result:
            "Un diseño documentado de autenticación adecuado al ejercicio de derechos y a las reglas aplicables, con controles y restricciones identificados. Las definiciones pendientes de instrucciones regulatorias deben distinguirse de incumplimientos acreditados.",
        },
        {
          evidence_item: "roles y responsables internos",
          review_guide:
            "Identificar quién administra la autenticación, quién resuelve incidencias y qué áreas intervienen en la comprobación de representación. Revisar la coordinación prevista para evitar divulgaciones indebidas o rechazos injustificados.",
          no_evidence_guidance:
            "Consultar a privacidad, atención y seguridad sobre las responsabilidades asignadas. Cuando existan funciones sin titular definido, identificar las asignaciones pendientes sin presumir controles efectivos.",
          expected_result:
            "Responsabilidades trazables para comprobar identidades y gestionar dificultades de autenticación, con puntos de coordinación identificados. Los roles sin asignar deben quedar explícitos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-request-data",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-request-data",
      node_type: "question",
      title: "Datos mínimos de la solicitud",
      prompt:
        "¿La solicitud captura como mínimo la individualización correspondiente, un medio válido para comunicar la respuesta y permite identificar los datos o el tratamiento respecto de los cuales se ejerce el derecho?",
      why_it_matters:
        "Cubre los pasos canónicos 6 y 7: individualización, medio de respuesta e identificación del objeto del derecho.",
      fact_key: "rights.mechanism.request_data_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.request_data_covered"),
      evidence_to_review: ["formularios/templates", "matriz de requisitos por derecho"],
      evidence_review_help: [
        {
          evidence_item: "formularios/templates",
          review_guide:
            "Examinar cómo los modelos permiten individualizar al solicitante, señalar un medio de respuesta e identificar los datos o el tratamiento pertinente cuando corresponda. Contrastar las exigencias del formulario con las reglas específicas de cada derecho, especialmente la simplicidad del acceso.",
          no_evidence_guidance:
            "Recabar los formularios existentes y comparar sus campos con los requisitos legales. Si faltan modelos o se desconocen los datos exigidos, señalar las verificaciones pendientes sin añadir campos obligatorios injustificados.",
          expected_result:
            "Modelos capaces de reunir los antecedentes legalmente pertinentes para tramitar las solicitudes, diferenciando requisitos generales y especiales. Las exigencias excesivas o ausentes deben quedar identificadas.",
        },
        {
          evidence_item: "matriz de requisitos por derecho",
          review_guide:
            "Contrastar los requisitos generales del artículo 11 con las particularidades de acceso, rectificación, supresión y oposición. Verificar que la matriz distinga las menciones obligatorias de antecedentes condicionales y no traslade indiscriminadamente exigencias de un derecho a otro.",
          no_evidence_guidance:
            "Revisar el procedimiento y las disposiciones legales aplicables para construir la correspondencia pendiente entre derecho y requisitos. Si existen interpretaciones inciertas, registrarlas sin tratarlas como requisitos definitivos.",
          expected_result:
            "Una relación trazable de requisitos por derecho que permita configurar la recepción sin imponer obligaciones adicionales incompatibles con la ley.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-per-right-records",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-per-right-records",
      node_type: "question",
      title: "Antecedentes por derecho específico",
      prompt:
        "¿El procedimiento incorpora los antecedentes adicionales exigibles según el derecho específico: rectificación, supresión u oposición?",
      why_it_matters:
        "Cubre el paso canónico 8: cada derecho exige antecedentes propios.",
      fact_key: "rights.mechanism.per_right_records",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.per_right_records"),
      evidence_to_review: ["matriz de requisitos por derecho"],
      evidence_review_help: [
        {
          evidence_item: "matriz de requisitos por derecho",
          review_guide:
            "Verificar que la matriz contemple las modificaciones precisas y eventuales respaldos para rectificación, la causal y antecedentes pertinentes para supresión, y la causal de oposición con fundamentación breve cuando corresponda al artículo 8, letra a). Distinguir los antecedentes exigibles de los meramente opcionales.",
          no_evidence_guidance:
            "Contrastar cada derecho con las reglas del artículo 11 y consultar los procedimientos específicos. Si las condiciones no están diferenciadas, identificar las correcciones pendientes sin exigir idénticos documentos para todas las solicitudes.",
          expected_result:
            "Una matriz que permita requerir los antecedentes específicos legalmente pertinentes, sin ampliar injustificadamente los requisitos ni omitir distinciones condicionales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-access-simplicity",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-access-simplicity",
      node_type: "question",
      title: "Acceso sin requisitos adicionales",
      prompt:
        "¿El procedimiento evita imponer al derecho de acceso requisitos adicionales incompatibles con su regla legal específica?",
      why_it_matters:
        "Cubre el paso canónico 9: el acceso tiene un umbral procedimental propio que no admite recargos.",
      fact_key: "rights.mechanism.access_simplicity",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.access_simplicity"),
      evidence_to_review: ["matriz de requisitos por derecho", "formularios/templates"],
      evidence_review_help: [
        {
          evidence_item: "matriz de requisitos por derecho",
          review_guide:
            "Comprobar que las reglas del derecho de acceso respeten la disposición especial del artículo 11, según la cual basta la individualización del titular. Identificar requisitos adicionales trasladados desde otros derechos o condiciones que dificulten indebidamente su ejercicio.",
          no_evidence_guidance:
            "Consultar las reglas de acceso y su correspondencia con el artículo 11. Si la matriz no distingue este derecho, señalar la corrección pendiente sin presumir legitimidad de exigencias documentales generales.",
          expected_result:
            "Un criterio específico para acceso que respete su umbral legal de solicitud, con cargas adicionales incompatibles identificadas y sin eliminar las comprobaciones de identidad que correspondan conforme a la regulación.",
        },
        {
          evidence_item: "formularios/templates",
          review_guide:
            "Revisar los campos y pasos exigidos al solicitar acceso, identificando solicitudes de justificación, causales o documentación ajena a su regla especial. Contrastar el formulario con las instrucciones y el procedimiento de autenticación aplicables.",
          no_evidence_guidance:
            "Solicitar el modelo de acceso o efectuar un recorrido de prueba con datos ficticios. Si no existe un modelo específico, identificar qué campos deben revisarse sin inventar requisitos adicionales.",
          expected_result:
            "Un modelo que permita solicitar acceso conforme a la exigencia legal específica y sin barreras documentales improcedentes, con diferencias entre diseño y funcionamiento identificadas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-receipt",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-receipt",
      node_type: "question",
      title: "Acuse de recibo",
      prompt: "¿El mecanismo genera acuse de recibo de cada solicitud?",
      why_it_matters:
        "Cubre el paso canónico 10: el acuse fija el ingreso y habilita el cómputo del plazo.",
      fact_key: "rights.mechanism.receipt_issued",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.receipt_issued"),
      evidence_to_review: ["modelos de acuse/respuesta/denegación"],
      evidence_review_help: [
        {
          evidence_item: "modelos de acuse/respuesta/denegación",
          review_guide:
            "Verificar que el mecanismo contemple un acuse reconocible de recepción de la solicitud y que su contenido permita identificar el ingreso relevante para gestionar el plazo legal. Revisar la relación entre el acuse previsto y el procedimiento de recepción.",
          no_evidence_guidance:
            "Recabar modelos de acuse y especificaciones de recepción, consultando cómo se generarán o emitirán. Si solo existe una confirmación visual no vinculada a una recepción comprobable, identificar la brecha sin inventar registros individuales.",
          expected_result:
            "Un modelo y mecanismo previsto de acuse que permita confirmar la recepción y sostener la gestión del plazo. Las capacidades no implementadas deben diferenciarse de las comprobadas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-classification",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-classification",
      node_type: "question",
      title: "Clasificación y derivación",
      prompt:
        "¿El procedimiento clasifica correctamente el derecho ejercido y lo deriva a su procedimiento específico?",
      why_it_matters:
        "Cubre el paso canónico 11: una mala clasificación desvía el caso a un cauce equivocado.",
      fact_key: "rights.mechanism.classification_routing",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.classification_routing"),
      evidence_to_review: ["procedimiento general de ejercicio de derechos"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento general de ejercicio de derechos",
          review_guide:
            "Examinar cómo se identifica el derecho ejercido y se deriva hacia el proceso específico, incluso cuando una solicitud contenga varias pretensiones. Revisar criterios para resolver ambigüedades sin alterar indebidamente el alcance de lo solicitado.",
          no_evidence_guidance:
            "Consultar las instrucciones de clasificación y a los responsables de las rutas específicas. Si faltan criterios o derivaciones, documentar las definiciones pendientes sin asumir que todas las solicitudes se tramitan mediante un procedimiento uniforme.",
          expected_result:
            "Una ruta documentada de clasificación y derivación hacia los derechos correspondientes, con responsabilidades e incertidumbres identificadas. No implica gestionar casos individuales en Nexo DPO.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-deadline",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-deadline",
      node_type: "question",
      title: "Plazo general de 30 días corridos",
      prompt:
        "¿El procedimiento asegura capacidad para responder dentro del plazo general máximo de 30 días corridos desde el ingreso, sin operar como un timer de casos reales?",
      why_it_matters:
        "Cubre el paso canónico 12: el plazo es un requisito de capacidad del procedimiento, no un vencimiento calculado en Stage 1.",
      fact_key: "rights.mechanism.deadline_30_capacity",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.deadline_30_capacity"),
      evidence_to_review: ["matriz de plazos"],
      evidence_review_help: [
        {
          evidence_item: "matriz de plazos",
          review_guide:
            "Comprobar que el procedimiento contemple el plazo general máximo de treinta días corridos desde el ingreso de la solicitud y las etapas necesarias para pronunciarse oportunamente. Diferenciar días corridos de hábiles y capacidad organizacional de seguimiento de un vencimiento individual.",
          no_evidence_guidance:
            "Consultar la planificación del proceso y las reglas del artículo 11 para reconstruir los plazos previstos. Si faltan responsabilidades o etapas de respuesta, identificarlas sin calcular vencimientos de solicitudes reales.",
          expected_result:
            "Una matriz que represente correctamente el plazo general y permita evaluar la capacidad del procedimiento para respetarlo, sin implementar temporizadores operacionales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-extension",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-extension",
      node_type: "question",
      title: "Prórroga única",
      prompt:
        "¿El procedimiento contempla una sola prórroga, cuando corresponda, por hasta 30 días corridos adicionales?",
      why_it_matters:
        "Cubre el paso canónico 13, condicional: la prórroga es única y acotada.",
      fact_key: "rights.mechanism.extension_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.extension_covered"),
      evidence_to_review: ["matriz de plazos"],
      evidence_review_help: [
        {
          evidence_item: "matriz de plazos",
          review_guide:
            "Verificar que la matriz contemple una sola posibilidad de prórroga por hasta treinta días corridos adicionales, cuando corresponda, y que distinga el plazo ordinario de su extensión. Identificar reglas que permitan prórrogas sucesivas o duraciones superiores.",
          no_evidence_guidance:
            "Consultar los criterios internos de extensión y la disposición legal pertinente. Si la prórroga no está definida, señalar la brecha sin presumir su aplicación obligatoria a toda solicitud ni crear reglas no respaldadas.",
          expected_result:
            "Una representación correcta del plazo ordinario y de la prórroga única legalmente permitida, con las condiciones de aplicación identificadas y sin cronómetros de casos individuales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-response-form",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-response-form",
      node_type: "question",
      title: "Forma de respuesta",
      prompt:
        "¿El procedimiento asegura respuesta escrita al domicilio, correo electrónico u otro medio fijado por el titular?",
      why_it_matters:
        "Cubre el paso canónico 14: la respuesta debe llegar por el medio fijado por el titular.",
      fact_key: "rights.mechanism.response_form",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.response_form"),
      evidence_to_review: ["modelos de acuse/respuesta/denegación"],
      evidence_review_help: [
        {
          evidence_item: "modelos de acuse/respuesta/denegación",
          review_guide:
            "Comprobar que los modelos contemplen respuesta escrita dirigida al domicilio o dirección de correo electrónico fijados por el titular, según corresponda. Revisar que el procedimiento vincule el contenido de la respuesta con el medio indicado en la solicitud.",
          no_evidence_guidance:
            "Recabar los modelos disponibles y consultar cómo se selecciona el destino de respuesta. Si no existe una ruta definida para responder por escrito al medio pertinente, identificarla sin inventar comunicaciones efectuadas.",
          expected_result:
            "Modelos de respuesta escrita y reglas de remisión compatibles con el artículo 11, con modalidades y limitaciones identificables.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-remission-proof",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-remission-proof",
      node_type: "question",
      title: "Respaldo de remisión",
      prompt:
        "¿El mecanismo conserva la capacidad de demostrar remisión, fecha y contenido íntegro de la respuesta?",
      why_it_matters:
        "Cubre el paso canónico 15: sin respaldo de remisión la respuesta no es acreditable.",
      fact_key: "rights.mechanism.remission_proof",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.remission_proof"),
      evidence_to_review: ["mecanismo previsto para conservar respaldo de remisión"],
      evidence_review_help: [
        {
          evidence_item: "mecanismo previsto para conservar respaldo de remisión",
          review_guide:
            "Verificar que el mecanismo permita conservar antecedentes para demostrar la remisión de la respuesta, la fecha correspondiente, el destinatario pertinente y su contenido íntegro. Distinguir la simple elaboración de una respuesta de la capacidad de acreditar su envío.",
          no_evidence_guidance:
            "Consultar especificaciones de registro, conservación y recuperación de las comunicaciones. Si no se puede reconstruir cómo se acreditará el envío, identificar la capacidad pendiente sin imponer un software o formato universal.",
          expected_result:
            "Un mecanismo previsto que permita conservar y recuperar evidencia suficiente de remisión, fecha y contenido íntegro, con las limitaciones o verificaciones funcionales pendientes reconocidas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-denial",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-denial",
      node_type: "question",
      title: "Denegación fundada",
      prompt:
        "¿El procedimiento exige, ante denegación total o parcial, fundamentación de la causa y de los antecedentes que la justifican?",
      why_it_matters:
        "Cubre el paso canónico 16: denegar sin fundamento deja al titular sin defensa.",
      fact_key: "rights.mechanism.denial_founded",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.denial_founded"),
      evidence_to_review: ["modelos de acuse/respuesta/denegación"],
      evidence_review_help: [
        {
          evidence_item: "modelos de acuse/respuesta/denegación",
          review_guide:
            "Comprobar que el modelo de denegación total o parcial exija identificar una causa jurídicamente sustentable y los antecedentes que la justifican. Revisar que no permita respuestas genéricas que omitan explicar el fundamento de la decisión.",
          no_evidence_guidance:
            "Consultar los modelos y criterios internos utilizados para denegar solicitudes. Si faltan espacios o instrucciones para fundamentar, identificar la corrección pendiente sin crear causales de denegación inexistentes.",
          expected_result:
            "Un modelo que permita comunicar decisiones denegatorias motivadas y respaldadas conforme al artículo 11, sin adoptar decisiones sobre solicitudes individuales durante Stage 1.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-complaint",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-complaint",
      node_type: "question",
      title: "Reclamo ante la Agencia",
      prompt:
        "¿La denegación incorpora información sobre el derecho a reclamar ante la Agencia y el plazo legal aplicable?",
      why_it_matters:
        "Cubre el paso canónico 17: el titular denegado debe conocer su vía de reclamo.",
      fact_key: "rights.mechanism.complaint_info",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.complaint_info"),
      evidence_to_review: ["modelos de acuse/respuesta/denegación"],
      evidence_review_help: [
        {
          evidence_item: "modelos de acuse/respuesta/denegación",
          review_guide:
            "Verificar que los modelos de denegación informen el derecho del titular a reclamar ante la Agencia y el plazo de treinta días hábiles previsto en la ley. Contrastar las indicaciones con el procedimiento aplicable, distinguiendo ese plazo de los treinta días corridos de respuesta del responsable.",
          no_evidence_guidance:
            "Recabar el modelo de denegación y contrastar sus instrucciones con los artículos 11 y 41. Si falta información o se confunden los plazos, identificar las correcciones pendientes sin atribuir notificaciones efectivamente realizadas.",
          expected_result:
            "Un modelo que comunique correctamente la vía de reclamación y su plazo legal, con diferencias de cómputo identificadas y sin generar expedientes ante la Agencia.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-blocking",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-blocking",
      node_type: "question",
      title: "Ruta de bloqueo temporal",
      prompt:
        "¿El procedimiento incorpora la ruta especial de bloqueo temporal hacia D4.06 cuando corresponda?",
      why_it_matters:
        "Cubre el paso canónico 18: el bloqueo protege mientras se resuelve el derecho principal.",
      fact_key: "rights.mechanism.blocking_routed",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.blocking_routed"),
      evidence_to_review: ["procedimiento general de ejercicio de derechos"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento general de ejercicio de derechos",
          review_guide:
            "Examinar si el procedimiento deriva las solicitudes pertinentes de bloqueo temporal hacia la ruta específica de D4.06, considerando su relación con rectificación, supresión u oposición. Verificar que se contemple la respuesta especial de dos días hábiles y sus efectos provisionales, sin sustituir el procedimiento especializado.",
          no_evidence_guidance:
            "Consultar las reglas de derivación y los antecedentes de D4.06 para identificar cómo se reconocerán las solicitudes de bloqueo. Si la conexión no está definida, registrar las comprobaciones pendientes sin inventar mecanismos de suspensión automática.",
          expected_result:
            "Una ruta identificable hacia el procedimiento especial de bloqueo, con condiciones y plazo aplicable correctamente diferenciados del trámite general. No implica procesar casos ni bloquear datos reales en Stage 1.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-gratuity",
      related_activity_keys: ["rights.blocking_enable"],
      provenance: "legal_requirement",
    },
    {
      node_key: "check-gratuity",
      node_type: "question",
      title: "Gratuidad y costos",
      prompt:
        "¿Las reglas de gratuidad están definidas (rectificación, supresión y oposición siempre gratuitas; acceso gratuito al menos trimestralmente) y, para acceso y portabilidad repetidos en el trimestre, solo prevén costos directos permitidos según instrucciones de la Agencia, sin inventar montos?",
      why_it_matters:
        "Cubre los pasos canónicos 19 y 20: la gratuidad es regla; el cobro es excepción acotada a costos directos.",
      fact_key: "rights.mechanism.gratuity_rules",
      answer_type: "yes_no_unknown",
      options: verifyOptions("rights.mechanism.gratuity_rules"),
      evidence_to_review: ["reglas de gratuidad/costos"],
      evidence_review_help: [
        {
          evidence_item: "reglas de gratuidad/costos",
          review_guide:
            "Comprobar que rectificación, supresión y oposición sean siempre gratuitas y que el acceso sea gratuito al menos trimestralmente. Revisar las condiciones previstas para eventuales costos directos en acceso o portabilidad reiterados durante el trimestre, respetando las limitaciones legales y las instrucciones aplicables de la Agencia.",
          no_evidence_guidance:
            "Consultar las políticas económicas y los criterios internos del canal, contrastándolos con el artículo 10 y las instrucciones regulatorias disponibles. Si no puede determinarse qué cobros serían admisibles, identificar la incertidumbre sin inventar tarifas, montos o métodos de cálculo.",
          expected_result:
            "Reglas verificables de gratuidad y costos directos legalmente admisibles, con excepciones y dependencias regulatorias diferenciadas. No deben crearse cobros automáticos ni cálculos por solicitudes individuales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-foreign-entity",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-foreign-entity",
      node_type: "question",
      title: "Responsable no constituido en Chile",
      prompt:
        "¿Se verificó el medio o representación electrónica exigida cuando el responsable es persona jurídica no constituida en Chile y aplica la regla legal correspondiente, o no aplica en este caso?",
      why_it_matters:
        "Cubre el paso canónico 21, condicional: solo para responsables no constituidos en Chile alcanzados por la regla.",
      fact_key: "rights.mechanism.foreign_entity_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "rights.mechanism.foreign_entity_covered",
        "El responsable está constituido en Chile o la regla no resulta aplicable.",
      ),
      evidence_to_review: ["procedimiento general de ejercicio de derechos"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento general de ejercicio de derechos",
          review_guide:
            "Verificar si resulta aplicable al responsable la regla del artículo 10 relativa a personas jurídicas no constituidas en Chile. Cuando corresponda, examinar cómo se contempla el medio electrónico válido y operativo y la persona capaz de actuar en su nombre, junto con la comunicación y actualización de la información exigida ante la Agencia.",
          no_evidence_guidance:
            "Consultar la constitución y situación jurídica del responsable y los antecedentes disponibles sobre su medio o representación de contacto. Si no puede establecerse la aplicabilidad, identificar las comprobaciones pendientes sin dar por justificado «No aplica» por la mera ausencia de documentación.",
          expected_result:
            "Un procedimiento que contemple los requisitos pertinentes para el responsable extranjero alcanzado por la regla, o una inaplicabilidad debidamente sustentada. Las condiciones aún no implementadas o verificadas deben quedar reconocidas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "synthesis",
      provenance: "legal_requirement",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis del mecanismo",
      prompt:
        "El sistema verifica si el mecanismo general cubre todos los puntos exigibles.",
      answer_type: "none",
      required_facts: [...CHECKS],
      transitions: [
        {
          rule_id: "gaps-found",
          description: "Al menos un punto exigible del mecanismo está pendiente.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen puntos del mecanismo por cubrir antes de declararlo diseñado.",
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
          rule_id: "mechanism-complete",
          description:
            "Todos los puntos exigibles verificados o legítimamente no aplicables.",
          when: { op: "all", conditions: CHECKS.map(satisfied) },
          goto_outcome_key: "mechanism_designed",
          explanation:
            "El mecanismo general cubre los puntos exigibles en este caso. Esto valida el diseño del procedimiento, no la atención de solicitudes reales.",
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
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "mechanism_designed",
      label: "Mecanismo general diseñado",
      classification: "legal_requirement",
      explanation:
        "El mecanismo general cubre los puntos exigibles en este caso. Esto valida el diseño del procedimiento y su capacidad, no la atención de solicitudes reales ni el cumplimiento integral de la empresa.",
      provenance: "legal_requirement",
      canonical_fact_effects: [
        { fact_key: "rights.exercise_mechanism_status", value: "designed" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Habilitar la atención del derecho de acceso en D4.02",
          activity_key: "rights.access_enable",
        },
        {
          kind: "activity",
          label: "Habilitar la atención de rectificación en D4.03",
          activity_key: "rights.rectification_enable",
        },
        {
          kind: "activity",
          label: "Habilitar la atención de supresión en D4.04",
          activity_key: "rights.suppression_enable",
        },
        {
          kind: "activity",
          label: "Habilitar la atención de oposición en D4.05",
          activity_key: "rights.opposition_enable",
        },
        {
          kind: "activity",
          label: "Habilitar el bloqueo temporal en D4.06",
          activity_key: "rights.blocking_enable",
        },
        {
          kind: "activity",
          label: "Habilitar la portabilidad en D4.07",
          activity_key: "rights.portability_enable",
        },
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva el procedimiento general, los canales habilitados, los formularios y templates, el diseño de autenticación, las matrices de requisitos y plazos, las reglas de gratuidad, los modelos de acuse/respuesta/denegación y la prueba o walkthrough del proceso.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "El mecanismo requiere completar puntos",
      classification: "agency_standard",
      explanation:
        "Al menos un punto exigible del mecanismo está pendiente. Completa el diseño antes de declararlo operativo.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Completar los puntos pendientes",
          note: "Atiende cada punto pendiente del procedimiento general y vuelve a verificar el mecanismo.",
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
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
  ],
};
