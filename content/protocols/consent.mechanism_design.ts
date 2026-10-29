import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.03.
 *
 * activity_key = consent.mechanism_design (procedure, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, dependencias y state effect del
 * contenido canónico D3.03. Diseña y verifica la estructura del
 * mecanismo de obtención; nunca decide la base de licitud (D2 ya
 * determinó la ruta) ni registra consentimientos individuales.
 *
 * Bridge operativo/read-only: la ruta de consentimiento se lee del
 * fact purpose-scoped `lawful.consent_applies = consent_yes`
 * producido por D2.05 (`external_fact_keys`, compuerta de entrada).
 * No se materializa `purpose.lawful_basis`, no se modifica D2.05,
 * no se duplica ni deriva ningún fact.
 *
 * Pasos 11–13 del canon (libertad, prueba, retiro) no se duplican
 * como evaluaciones internas: se resuelven mediante las completion
 * dependencies D3.04/D3.05/D3.06, leídas como facts externos de la
 * misma purpose. La guía puede comenzar y navegarse libremente;
 * solo el resultado definitivo `mechanism_designed` exige libertad
 * `supported`, prueba `designed` y retiro `enabled` (sin orden
 * rígido entre D3.04–D3.06). `reasoning_record_required = false`.
 */

const BRIDGE_FACT = "lawful.consent_applies";
const FREEDOM_FACT = "consent.freedom_status";
const PROOF_FACT = "consent.proof_capability_status";
const WITHDRAWAL_FACT = "consent.withdrawal_status";

const CHECKS = [
  "consent.mechanism.purpose_confirmed",
  "consent.mechanism.channel_identified",
  "consent.mechanism.information_verified",
  "consent.mechanism.specificity_verified",
  "consent.mechanism.priority_verified",
  "consent.mechanism.affirmative_verified",
  "consent.mechanism.no_silence_ensured",
  "consent.mechanism.mandate_covered",
  "consent.mechanism.documented",
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
      description: "El punto aún no está cubierto en el diseño.",
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
      description: "El punto aún no está cubierto en el diseño.",
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

export const CONSENT_MECHANISM_DESIGN_PROTOCOL: ExecutionProtocol = {
  protocol_key: "consent.mechanism_design.v1",
  activity_key: "consent.mechanism_design",
  version: 1,
  mode: "procedure",
  execution_scope: "purpose",
  title: "Diseño guiado del mecanismo de consentimiento",
  description:
    "Diseña y verifica el mecanismo que obtiene consentimiento para la finalidad activa: finalidad concreta, canal, información, especificidad, carácter previo, acción afirmativa, mandatario y documentación, con libertad, prueba y retiro resueltos en sus actividades propias.",
  entry_node_key: "route-gate",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [BRIDGE_FACT, FREEDOM_FACT, PROOF_FACT, WITHDRAWAL_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "route-gate",
      node_type: "decision",
      title: "Ruta de consentimiento",
      prompt:
        "El sistema verifica que esta finalidad siga la ruta de consentimiento según D2.05.",
      answer_type: "none",
      required_facts: [BRIDGE_FACT],
      transitions: [
        {
          rule_id: "consent-route",
          description: "La finalidad sigue la ruta de consentimiento.",
          when: {
            op: "fact_equals",
            fact_key: BRIDGE_FACT,
            value: "consent_yes",
          },
          goto_node_key: "check-purpose",
          explanation:
            "D2.05 determinó consentimiento para esta finalidad: procede el diseño del mecanismo.",
        },
        {
          rule_id: "fallback-route",
          description: "Sin ruta de consentimiento no inicia el diseño.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "Esta guía solo procede cuando la finalidad utiliza consentimiento como base de licitud.",
        },
      ],
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-purpose",
      node_type: "question",
      title: "Finalidad concreta",
      prompt:
        "¿Está identificada la finalidad concreta para la cual se obtendrá el consentimiento?",
      why_it_matters:
        "Sin finalidad concreta no es posible verificar especificidad ni vincular la manifestación.",
      fact_key: "consent.mechanism.purpose_confirmed",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.purpose_confirmed"),
      evidence_to_review: ["diseño del flujo"],
      evidence_review_help: [
        {
          evidence_item: "diseño del flujo",
          review_guide:
            "Identificar en la secuencia propuesta qué utilización concreta de datos se someterá a autorización, comprobando su correspondencia con la finalidad documentada en D2 y la ruta jurídica de consentimiento. Verificar que el propósito sea reconocible y no quede confundido con otros usos independientes o autorizaciones generales para tratamientos futuros.",
          no_evidence_guidance:
            "Consultar las finalidades y bases de licitud registradas en D2, junto con los formularios o antecedentes del proceso previsto, para precisar qué uso necesita consentimiento. Si la finalidad no está determinada o existen discrepancias, señalar las aclaraciones pendientes sin inventar propósitos ni asignar una base jurídica desde esta guía.",
          expected_result:
            "Una finalidad concreta e identificable, vinculada al mecanismo previsto y coherente con la ruta de consentimiento establecida en D2. Las discrepancias o indefiniciones deben quedar reconocidas para su corrección, sin considerar acreditada todavía la especificidad de la manifestación ni la validez integral del consentimiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-channel",
      provenance: "agency_standard",
    },
    {
      node_key: "check-channel",
      node_type: "question",
      title: "Canal de obtención",
      prompt:
        "¿Está identificado el canal o modalidad mediante el cual se obtendrá el consentimiento?",
      why_it_matters:
        "El canal determina textos, evidencias y equivalencia del retiro.",
      fact_key: "consent.mechanism.channel_identified",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.channel_identified"),
      evidence_to_review: ["especificación funcional", "scripts y canales"],
      evidence_review_help: [
        {
          evidence_item: "especificación funcional",
          review_guide:
            "Identificar cómo se solicitará y recibirá la manifestación de voluntad, precisando la modalidad prevista, sus etapas y los componentes que intervienen. Verificar que la descripción corresponda a la finalidad activa y permita reconocer dónde se presenta la solicitud y cómo se expresa la decisión, distinguiendo funcionalidades implementadas de propuestas.",
          no_evidence_guidance:
            "Consultar diagramas de proceso, requisitos del sistema y antecedentes de las áreas responsables para reconstruir la secuencia prevista. Si el mecanismo no está definido, identificar las decisiones de diseño pendientes sin atribuir funcionalidades inexistentes ni presumir que utilizar un formulario equivale a obtener consentimiento válido.",
          expected_result:
            "Una modalidad de obtención identificable, vinculada a la finalidad correspondiente y con sus principales etapas y componentes descritos. Las funcionalidades pendientes o no comprobadas deben quedar diferenciadas, permitiendo continuar la revisión sin anticipar la validez integral del consentimiento.",
        },
        {
          evidence_item: "scripts y canales",
          review_guide:
            "Revisar los medios concretos mediante los cuales se solicitará consentimiento, como pantallas, formularios, comunicaciones escritas o guiones verbales, según corresponda. Comprobar que los textos y acciones previstos sean coherentes con la modalidad declarada y permitan identificar cómo interactúa el titular, sin imponer una interfaz tecnológica específica.",
          no_evidence_guidance:
            "Consultar formularios, guiones de atención, comunicaciones y antecedentes operativos para localizar los canales utilizados o previstos. Cuando falten materiales, señalar qué textos o interacciones requieren definición y evitar considerar implementado un canal que solo aparece mencionado en una propuesta.",
          expected_result:
            "Canales y materiales de obtención identificados, con correspondencia verificable respecto de la modalidad prevista y la finalidad activa. Las diferencias entre diseño, implementación y funcionamiento comprobado deben quedar reconocidas para las evaluaciones posteriores de información, prueba y retiro.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-information",
      provenance: "agency_standard",
    },
    {
      node_key: "check-information",
      node_type: "question",
      title: "Información al titular",
      prompt:
        "¿El diseño asegura que el titular disponga de la información relevante al momento de consentir?",
      why_it_matters:
        "Sin información disponible no hay consentimiento informado.",
      fact_key: "consent.mechanism.information_verified",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.information_verified"),
      evidence_to_review: ["formularios", "textos y pantallas"],
      evidence_review_help: [
        {
          evidence_item: "formularios",
          review_guide:
            "Comprobar qué información recibe el titular antes de expresar su decisión, verificando que pueda identificar al responsable, los datos involucrados y la finalidad que pretende autorizar. Revisar la ubicación de las explicaciones y su relación con la solicitud de consentimiento, distinguiendo información disponible oportunamente de contenidos presentados después de aceptar.",
          no_evidence_guidance:
            "Consultar modelos de formularios, requisitos funcionales y antecedentes del proceso de obtención para reconstruir la información prevista. Si faltan explicaciones o no puede comprobarse cuándo se presentan, identificar los ajustes pendientes sin presumir que una casilla de aceptación demuestra consentimiento informado.",
          expected_result:
            "Un formulario cuyo diseño permita conocer oportunamente la información relevante para decidir sobre el tratamiento, con omisiones y aspectos pendientes identificados. La revisión debe distinguir el contenido diseñado de su implementación efectiva, sin anticipar la validez integral del consentimiento.",
        },
        {
          evidence_item: "textos y pantallas",
          review_guide:
            "Revisar las explicaciones, mensajes y pantallas que acompañan la solicitud, comprobando que describan comprensiblemente el uso previsto de los datos y permitan acceder a la información relevante antes de consentir. Identificar textos ambiguos, referencias insuficientes o secuencias que oculten información necesaria hasta después de la manifestación.",
          no_evidence_guidance:
            "Recuperar prototipos, guiones, capturas y contenidos previstos para el canal de obtención, identificando qué verá o escuchará el titular y en qué momento. Cuando falten materiales o existan contradicciones, señalar las verificaciones pendientes sin atribuir claridad o disponibilidad a textos todavía no definidos.",
          expected_result:
            "Mensajes y pantallas coherentes con la finalidad activa, comprensibles y disponibles en el momento pertinente del flujo, con diferencias o limitaciones reconocibles. La evidencia debe respaldar el diseño informativo sin confundir una presentación adecuada con consentimientos efectivamente obtenidos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-specificity",
      provenance: "agency_standard",
    },
    {
      node_key: "check-specificity",
      node_type: "question",
      title: "Especificidad",
      prompt:
        "¿La manifestación queda vinculada específicamente a la finalidad, sin agrupamientos que la diluyan?",
      why_it_matters:
        "Sin vinculación específica no hay consentimiento específico respecto de la finalidad.",
      fact_key: "consent.mechanism.specificity_verified",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.specificity_verified"),
      evidence_to_review: ["formularios", "textos y pantallas"],
      evidence_review_help: [
        {
          evidence_item: "formularios",
          review_guide:
            "Comprobar que los controles de autorización permitan identificar qué finalidad concreta acepta el titular y distinguirla de otros usos independientes. Revisar si las opciones agrupadas mantienen una vinculación inequívoca con las finalidades descritas, evitando aceptaciones generales que incorporen tratamientos diferentes sin una decisión suficientemente específica.",
          no_evidence_guidance:
            "Consultar modelos de formularios, prototipos y antecedentes del flujo para reconstruir cómo se vinculará cada decisión con los usos previstos. Si faltan controles o no puede determinarse qué finalidad comprende la autorización, identificar los ajustes pendientes sin presumir especificidad por la sola existencia de una casilla.",
          expected_result:
            "Un diseño en el que la manifestación pueda asociarse claramente con la finalidad activa, diferenciando autorizaciones independientes cuando corresponda. Los agrupamientos confusos o las vinculaciones pendientes deben quedar identificados, sin atribuir consentimientos individuales efectivamente obtenidos.",
        },
        {
          evidence_item: "textos y pantallas",
          review_guide:
            "Revisar que las expresiones utilizadas junto a la solicitud describan con precisión las finalidades autorizadas y correspondan a las opciones disponibles. Detectar textos genéricos, referencias a usos futuros indeterminados o mensajes que mezclen propósitos diferentes, comprobando que el titular pueda reconocer el alcance de su decisión.",
          no_evidence_guidance:
            "Recuperar textos, guiones y pantallas previstos para la obtención, relacionándolos con las finalidades documentadas en D2. Cuando existan formulaciones incompletas o contradictorias, señalar las correcciones necesarias sin inventar autorizaciones ni considerar suficiente una referencia general a la política de privacidad.",
          expected_result:
            "Textos y pantallas que permitan comprender qué finalidad o finalidades comprende cada manifestación, con correspondencia verificable respecto del diseño del mecanismo. Las ambigüedades relevantes deben quedar reconocidas, sin considerar que una redacción específica demuestra por sí sola la validez integral del consentimiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-priority",
      provenance: "agency_standard",
    },
    {
      node_key: "check-priority",
      node_type: "question",
      title: "Carácter previo",
      prompt:
        "¿El diseño asegura que la manifestación ocurra antes del tratamiento basado en consentimiento?",
      why_it_matters:
        "Sin anterioridad no hay consentimiento previo.",
      fact_key: "consent.mechanism.priority_verified",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.priority_verified"),
      evidence_to_review: ["diseño del flujo", "especificación funcional"],
      evidence_review_help: [
        {
          evidence_item: "diseño del flujo",
          review_guide:
            "Comprobar el orden de las etapas previstas, identificando cuándo se solicita y manifiesta el consentimiento y cuándo comienzan las operaciones vinculadas a la finalidad activa. Detectar rutas que permitan iniciar ese tratamiento antes de la autorización, incluyendo continuaciones sin respuesta o activaciones automáticas, sin confundirlo con operaciones sustentadas en otra base jurídica.",
          no_evidence_guidance:
            "Consultar diagramas, recorridos del proceso y antecedentes de las áreas responsables para reconstruir la secuencia entre autorización e inicio del tratamiento. Si no puede determinarse el momento de activación, identificar las verificaciones pendientes sin asumir que mostrar primero un formulario garantiza consentimiento previo.",
          expected_result:
            "Una secuencia identificable en la que la manifestación anteceda al tratamiento que depende del consentimiento, con posibles rutas anticipadas o incertidumbres documentadas. El diseño debe permitir valorar la anterioridad sin considerar probado su funcionamiento efectivo por la sola existencia del diagrama.",
        },
        {
          evidence_item: "especificación funcional",
          review_guide:
            "Verificar que las reglas previstas condicionen el inicio de las operaciones basadas en consentimiento a la obtención de una manifestación válida. Revisar disparadores, estados y comportamientos ante aceptación, rechazo o ausencia de respuesta, identificando procesos que puedan ejecutarse anticipadamente o continuar sin autorización.",
          no_evidence_guidance:
            "Revisar requisitos, configuraciones y descripciones funcionales del mecanismo para determinar qué condición habilita el tratamiento. Si no existen reglas claras o faltan detalles sobre los disparadores, señalar las definiciones pendientes sin atribuir bloqueos o controles que no estén especificados.",
          expected_result:
            "Reglas funcionales que vinculen la habilitación del tratamiento con una manifestación previa de consentimiento, contemplando los casos sin autorización. Las condiciones incompletas o no verificadas deben quedar identificadas, sin afirmar que los controles están implementados o funcionan correctamente solo porque figuren en una especificación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-affirmative",
      provenance: "agency_standard",
    },
    {
      node_key: "check-affirmative",
      node_type: "question",
      title: "Acción afirmativa",
      prompt:
        "¿El mecanismo exige declaración o clara acción afirmativa del titular?",
      why_it_matters:
        "Sin declaración o acción afirmativa no hay consentimiento inequívoco.",
      fact_key: "consent.mechanism.affirmative_verified",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.affirmative_verified"),
      evidence_to_review: ["formularios", "textos y pantallas"],
      evidence_review_help: [
        {
          evidence_item: "formularios",
          review_guide:
            "Comprobar que los controles previstos requieran una intervención reconocible del titular para expresar su autorización, como seleccionar una opción o emitir una declaración expresa, según la modalidad utilizada. Revisar que la aceptación no aparezca predeterminada ni resulte de acciones que puedan ejecutarse sin una voluntad afirmativa identificable.",
          no_evidence_guidance:
            "Consultar modelos, prototipos y requisitos del proceso para identificar cómo se recogerá la manifestación. Si no existen controles definidos o se desconoce su comportamiento inicial, señalar las comprobaciones pendientes sin presumir una autorización válida por la presencia de botones o casillas.",
          expected_result:
            "Un diseño que permita reconocer una manifestación afirmativa e inequívoca, sin selecciones de aceptación predeterminadas ni mecanismos que sustituyan la decisión del titular. Las limitaciones pendientes deben quedar identificadas, sin considerar acreditado que se hayan obtenido consentimientos individuales.",
        },
        {
          evidence_item: "textos y pantallas",
          review_guide:
            "Revisar que las instrucciones y mensajes asociados a la decisión permitan distinguir claramente una autorización de otras interacciones del proceso. Comprobar que las expresiones utilizadas comuniquen el sentido de la acción solicitada y no presenten la continuación de una navegación o una aceptación ajena como consentimiento para el tratamiento.",
          no_evidence_guidance:
            "Recuperar mensajes, guiones y pantallas del canal previsto para establecer cómo se solicita y expresa la autorización. Si las instrucciones son ambiguas o todavía no están definidas, identificar los textos que requieren aclaración sin atribuir voluntad afirmativa a interacciones cuyo significado no puede determinarse.",
          expected_result:
            "Mensajes e interacciones cuyo significado permita reconocer inequívocamente la autorización solicitada, diferenciándola de acciones ordinarias sin finalidad de consentir. Las ambigüedades materiales deben quedar reconocidas, sin equiparar la claridad del texto con la eficacia funcional del mecanismo.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-no-silence",
      provenance: "agency_standard",
    },
    {
      node_key: "check-no-silence",
      node_type: "question",
      title: "Silencio no es consentimiento",
      prompt:
        "¿El diseño impide tratar el silencio o la inacción como consentimiento?",
      why_it_matters:
        "Tratar silencio como consentimiento invalida el mecanismo completo.",
      fact_key: "consent.mechanism.no_silence_ensured",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.no_silence_ensured"),
      evidence_to_review: ["diseño del flujo", "especificación funcional"],
      evidence_review_help: [
        {
          evidence_item: "diseño del flujo",
          review_guide:
            "Examinar las rutas previstas cuando el titular no responde, abandona el proceso o deja transcurrir el tiempo sin decidir. Comprobar que ninguna de estas situaciones se transforme en aceptación tácita ni habilite el tratamiento basado en consentimiento, distinguiendo las operaciones que puedan sustentarse válidamente en otra fuente de licitud.",
          no_evidence_guidance:
            "Consultar diagramas, recorridos y antecedentes del proceso para reconstruir qué sucede ante la ausencia de respuesta. Si no están definidos los caminos de inactividad o abandono, identificar las decisiones pendientes sin presumir que la falta de una opción de rechazo implica consentimiento.",
          expected_result:
            "Un flujo en el que la ausencia de manifestación no genere autorización ni habilite el tratamiento dependiente de consentimiento, con rutas de inactividad y abandono identificables. Las situaciones no definidas deben quedar reconocidas, sin atribuir eficacia funcional a un diseño todavía no comprobado.",
        },
        {
          evidence_item: "especificación funcional",
          review_guide:
            "Verificar las reglas que determinan el estado de autorización ante respuestas omitidas, plazos vencidos o interacciones incompletas. Comprobar que los valores iniciales, comportamientos automáticos y condiciones de activación no conviertan la inacción en aceptación ni ejecuten operaciones sujetas a consentimiento sin una manifestación válida.",
          no_evidence_guidance:
            "Revisar requisitos, configuraciones y reglas previstas para conocer cómo se interpretan los estados sin respuesta. Cuando falten definiciones o existan comportamientos contradictorios, identificar los controles pendientes sin dar por implementadas condiciones de bloqueo o rechazo automático.",
          expected_result:
            "Reglas funcionales que mantengan diferenciada la ausencia de consentimiento de una autorización afirmativa y eviten habilitaciones automáticas por silencio. Las inconsistencias o condiciones no verificadas deben quedar documentadas, sin considerar probado el funcionamiento del mecanismo por la sola existencia de una especificación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-mandate",
      provenance: "agency_standard",
    },
    {
      node_key: "check-mandate",
      node_type: "question",
      title: "Mandatario",
      prompt:
        "¿El diseño contempla comprobar facultad expresa cuando actúe mandatario, o no interviene mandatario?",
      why_it_matters:
        "La actuación por mandatario exige comprobación de facultad expresa en el diseño.",
      fact_key: "consent.mechanism.mandate_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "consent.mechanism.mandate_covered",
        "No interviene mandatario en este caso.",
      ),
      evidence_to_review: [
        "mecanismo previsto para mandatario cuando corresponda",
      ],
      evidence_review_help: [
        {
          evidence_item: "mecanismo previsto para mandatario cuando corresponda",
          review_guide:
            "Verificar si el canal de obtención admite que un mandatario consienta por el titular y, de ser así, cómo se comprobará su facultad expresa antes de aceptar esa manifestación. Revisar los antecedentes y controles previstos para distinguir una autorización acreditable de la sola declaración de actuar por otra persona. Si no interviene mandatario, comprobar que esa situación corresponda al diseño de la finalidad activa.",
          no_evidence_guidance:
            "Consultar los procedimientos de representación, formularios y antecedentes del canal para determinar si se contempla la actuación de mandatarios y cómo se verificarían sus facultades. Cuando falten definiciones, identificar las comprobaciones pendientes sin presumir que existe autorización expresa. Si esa modalidad no interviene, dejar identificada la razón para seleccionar «No aplica».",
          expected_result:
            "Un diseño que contemple la comprobación de facultades expresas cuando el consentimiento pueda otorgarse mediante mandatario, con controles y limitaciones identificables. Si no interviene mandatario, la inaplicabilidad debe estar justificada por el alcance del mecanismo, sin exigir documentos de mandato innecesarios ni considerar acreditadas representaciones individuales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-documented",
      provenance: "agency_standard",
    },
    {
      node_key: "check-documented",
      node_type: "question",
      title: "Documentación del mecanismo",
      prompt:
        "¿El mecanismo quedó documentado con sus conexiones a libertad, prueba y retiro?",
      why_it_matters:
        "Sin documentación no hay trazabilidad del diseño ni de sus dependencias.",
      fact_key: "consent.mechanism.documented",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.documented"),
      evidence_to_review: ["evidencia del mecanismo"],
      evidence_review_help: [
        {
          evidence_item: "evidencia del mecanismo",
          review_guide:
            "Comprobar que los antecedentes disponibles describan el mecanismo de obtención para la finalidad activa, incluyendo el canal, la información presentada, la manifestación exigida y su momento respecto del tratamiento. Verificar que el diseño identifique sus conexiones con libertad, capacidad de prueba y retiro, distinguiendo las evaluaciones realizadas de las pendientes.",
          no_evidence_guidance:
            "Recopilar especificaciones, formularios, guiones y antecedentes del flujo para reconstruir el mecanismo y sus relaciones con las evaluaciones correspondientes. Si la documentación es parcial o no permite identificar esas conexiones, señalar los elementos pendientes sin inventar controles, resultados ni consentimientos obtenidos.",
          expected_result:
            "Un mecanismo documentado de forma trazable para la finalidad activa, con sus componentes principales y conexiones con libertad, prueba y retiro identificables. Las condiciones no evaluadas o pendientes deben quedar diferenciadas, sin considerar que documentar el diseño acredita por sí solo la validez integral del consentimiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "synthesis",
      related_activity_keys: [
        "consent.freedom_assess",
        "consent.proof_design",
        "consent.withdrawal_enable",
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis del diseño",
      prompt:
        "El sistema verifica el diseño propio y las dependencias de libertad, prueba y retiro de esta misma finalidad.",
      answer_type: "none",
      required_facts: [BRIDGE_FACT, ...CHECKS, FREEDOM_FACT, PROOF_FACT, WITHDRAWAL_FACT],
      transitions: [
        {
          rule_id: "route-lost",
          description: "La finalidad ya no sigue la ruta de consentimiento.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: BRIDGE_FACT,
              value: "consent_yes",
            },
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "Sin ruta de consentimiento vigente no hay diseño que completar.",
        },
        {
          rule_id: "gaps-found",
          description: "Algún requisito estructural del mecanismo está pendiente.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen puntos del diseño por cubrir antes de declarar el mecanismo diseñado.",
        },
        {
          rule_id: "dependency-negative",
          description:
            "Libertad no soportada o prueba/retiro en remediación.",
          when: {
            op: "any",
            conditions: [
              { op: "fact_equals", fact_key: FREEDOM_FACT, value: "not_supported" },
              { op: "fact_equals", fact_key: PROOF_FACT, value: "remediation_required" },
              { op: "fact_equals", fact_key: WITHDRAWAL_FACT, value: "remediation_required" },
            ],
          },
          goto_outcome_key: "dependency_remediation_required",
          explanation:
            "El diseño no puede declararse mientras libertad, prueba o retiro de esta finalidad estén negativamente cerrados.",
        },
        {
          rule_id: "missing-info",
          description:
            "Diseño o dependencias con información pendiente o sin resolver.",
          when: {
            op: "any",
            conditions: [
              ...CHECKS.map(unresolved),
              unresolved(FREEDOM_FACT),
              unresolved(PROOF_FACT),
              unresolved(WITHDRAWAL_FACT),
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan puntos del diseño o dependencias por resolver en esta finalidad.",
        },
        {
          rule_id: "mechanism-complete",
          description:
            "Diseño verificado con dependencias positivamente cerradas.",
          when: {
            op: "all",
            conditions: [
              ...CHECKS.map(satisfied),
              { op: "fact_equals", fact_key: FREEDOM_FACT, value: "supported" },
              { op: "fact_equals", fact_key: PROOF_FACT, value: "designed" },
              { op: "fact_equals", fact_key: WITHDRAWAL_FACT, value: "enabled" },
            ],
          },
          goto_outcome_key: "mechanism_designed",
          explanation:
            "El mecanismo está diseñado y sus dependencias de esta finalidad están positivamente cerradas.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "El diseño no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "mechanism_designed",
      label: "Mecanismo diseñado",
      classification: "agency_standard",
      explanation:
        "El mecanismo está diseñado para esta finalidad, con libertad, prueba y retiro positivamente cerrados. Esto declara el diseño, no la validez de cada consentimiento individual.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.mechanism_status", value: "designed" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el diseño",
          note: "Archiva el diseño del flujo con formularios, textos, especificación funcional y evidencia del mecanismo.",
        },
      ],
    },
    {
      outcome_key: "dependency_remediation_required",
      label: "Dependencias por remediar",
      classification: "agency_standard",
      explanation:
        "Libertad, prueba o retiro de esta finalidad requieren remediación antes de declarar el mecanismo diseñado.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Evaluar la libertad en D3.04",
          activity_key: "consent.freedom_assess",
          show_when: {
            op: "not",
            condition: { op: "fact_equals", fact_key: FREEDOM_FACT, value: "supported" },
          },
        },
        {
          kind: "activity",
          label: "Verificar la prueba en D3.05",
          activity_key: "consent.proof_design",
          show_when: {
            op: "not",
            condition: { op: "fact_equals", fact_key: PROOF_FACT, value: "designed" },
          },
        },
        {
          kind: "activity",
          label: "Habilitar el retiro en D3.06",
          activity_key: "consent.withdrawal_enable",
          show_when: {
            op: "not",
            condition: { op: "fact_equals", fact_key: WITHDRAWAL_FACT, value: "enabled" },
          },
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere completar el diseño",
      classification: "agency_standard",
      explanation:
        "Al menos un requisito estructural del mecanismo está pendiente. Completa el diseño antes de declarar su cierre.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar los puntos pendientes",
          note: "Atiende cada punto del diseño marcado como pendiente.",
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
        "Existen puntos del diseño o dependencias pendientes o con información insuficiente.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "Sin ruta de consentimiento",
      classification: "agency_standard",
      explanation:
        "Esta guía solo procede cuando la finalidad utiliza consentimiento como base de licitud.",
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
};
