import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.03.
 *
 * activity_key = rights.rectification_enable (procedure, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, dependencias y state effect del
 * contenido canónico D4.03. Verifica capacidad y propagación de
 * rectificaciones sin decidir casos individuales.
 *
 * La excepción de imposibilidad o esfuerzo desproporcionado se
 * verifica como criterio y procedimiento existente, con exigencia
 * de fundamentación; Stage 1 nunca adopta conclusiones sobre un
 * caso real ni persiste juicios (`reasoning_record_required =
 * false`). Coordinación con bloqueo como capacidad, sin lifecycle.
 *
 * Dependencia de completitud hacia D4.01 vía fact externo
 * `rights.exercise_mechanism_status` (can start libre, can complete
 * gated). Metodología `agency_standard`.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.rectification.inexact_data_identified",
  "rights.rectification.precise_modification",
  "rights.rectification.supporting_records",
  "rights.rectification.systems_corrected",
  "rights.rectification.reuse_prevented",
  "rights.rectification.recipients_identified",
  "rights.rectification.recipients_notified",
  "rights.rectification.exception_criterion",
  "rights.rectification.exception_evidenced",
  "rights.rectification.blocking_coordinated",
  "rights.rectification.common_procedure",
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

export const RIGHTS_RECTIFICATION_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.rectification_enable.v1",
  activity_key: "rights.rectification_enable",
  version: 1,
  mode: "procedure",
  execution_scope: "company",
  title: "Habilitación guiada de la rectificación",
  description:
    "Verifica que la empresa pueda rectificar datos inexactos, desactualizados o incompletos y propagar las rectificaciones a destinatarios. Evalúa el procedimiento y sus criterios, sin decidir casos individuales.",
  entry_node_key: "check-inexact-data",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "check-inexact-data",
      node_type: "question",
      title: "Identificación del dato",
      prompt:
        "¿El procedimiento permite identificar los datos inexactos, desactualizados o incompletos objeto de rectificación?",
      why_it_matters:
        "Sin identificación precisa no hay objeto rectificable.",
      fact_key: "rights.rectification.inexact_data_identified",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.inexact_data_identified",
        "Criterio de identificación del dato verificado.",
      ),
      evidence_to_review: ["procedimiento de rectificación"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de rectificación",
          review_guide:
            "Examinar cómo el procedimiento permite localizar y distinguir los datos personales que el titular considera inexactos, desactualizados o incompletos, incluyendo su relación con las fuentes y procesos donde se utilizan. Comprobar que existan criterios para identificar el dato afectado, precisar el problema advertido y derivarlo al área responsable, evitando modificaciones sobre registros equivocados o ajenos a la solicitud.",
          no_evidence_guidance:
            "Solicitar a privacidad, responsables de datos y áreas operacionales las instrucciones utilizadas para localizar información susceptible de rectificación. Si no existen criterios documentados, reconstruir mediante entrevistas o ejemplos controlados cómo se identificarían los datos y señalar las dependencias pendientes, sin presumir que disponer de una base de datos permite localizar correctamente cualquier registro.",
          expected_result:
            "Un procedimiento revisable que permita identificar con suficiente precisión los datos objeto de rectificación, su ubicación y los responsables de evaluar la corrección. Deben quedar reconocidas las fuentes no identificadas, las limitaciones de trazabilidad y las comprobaciones adicionales necesarias, sin utilizar datos reales de solicitantes en Nexo DPO.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-modification",
      provenance: "agency_standard",
    },
    {
      node_key: "check-modification",
      node_type: "question",
      title: "Modificación precisa",
      prompt:
        "¿El procedimiento recibe la modificación o actualización precisa solicitada?",
      why_it_matters:
        "La rectificación exige conocer el valor correcto pretendido.",
      fact_key: "rights.rectification.precise_modification",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.precise_modification",
        "Recepción de la modificación precisa verificada.",
      ),
      evidence_to_review: ["procedimiento de rectificación"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de rectificación",
          review_guide:
            "Verificar cómo se recoge la modificación, actualización o complemento solicitado y cómo se vincula con el dato originalmente identificado. Revisar que el procedimiento permita conocer qué información se pretende corregir y cuál sería el contenido actualizado, distinguiendo una solicitud suficientemente precisa de una comunicación ambigua que requiera aclaración razonable.",
          no_evidence_guidance:
            "Consultar formularios, instrucciones y responsables del canal para determinar cómo se documentaría la corrección pretendida. Cuando no exista una ruta clara, identificar los antecedentes que permitirían precisar el cambio sin imponer formalidades o requisitos adicionales injustificados ni convertir la falta de un formato específico en incumplimiento automático.",
          expected_result:
            "Un mecanismo documentado para recibir y comprender la modificación concreta solicitada, con correspondencia entre el dato afectado y el valor o complemento propuesto. Deben quedar identificados los casos que requerirían aclaración y las limitaciones del procedimiento, sin que Stage 1 determine la procedencia de una petición individual.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-supporting",
      provenance: "agency_standard",
    },
    {
      node_key: "check-supporting",
      node_type: "question",
      title: "Antecedentes de respaldo",
      prompt:
        "¿El procedimiento recibe antecedentes de respaldo cuando corresponda?",
      why_it_matters:
        "El respaldo acredita la corrección sin convertirlo en barrera.",
      fact_key: "rights.rectification.supporting_records",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.supporting_records",
        "Recepción de antecedentes prevista.",
      ),
      evidence_to_review: ["procedimiento de rectificación"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de rectificación",
          review_guide:
            "Revisar cómo se reciben y valoran los antecedentes que correspondan para sustentar una rectificación, considerando la naturaleza del dato y la modificación solicitada. Comprobar que el procedimiento diferencie documentación pertinente de exigencias innecesarias, permita incorporar antecedentes cuando proceda y establezca cómo se derivan a quienes deben evaluar la exactitud de la información.",
          no_evidence_guidance:
            "Recabar criterios internos sobre documentación de respaldo y consultar a las áreas responsables qué antecedentes podrían resultar relevantes según el tipo de dato. Si las reglas son insuficientes, identificar las definiciones pendientes sin presumir que toda rectificación exige los mismos documentos ni establecer exigencias documentales universales que no se desprendan de la ley.",
          expected_result:
            "Un procedimiento que contemple la recepción y evaluación proporcionada de antecedentes pertinentes, sin transformar el respaldo documental en una barrera injustificada para ejercer el derecho. Deben distinguirse las exigencias legalmente aplicables, los criterios operacionales y las situaciones que requieren definición adicional.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-systems",
      provenance: "agency_standard",
    },
    {
      node_key: "check-systems",
      node_type: "question",
      title: "Corrección en sistemas",
      prompt:
        "¿La empresa puede ejecutar la modificación en las fuentes y sistemas aplicables?",
      why_it_matters:
        "La rectificación no concluida en sistemas es una declaración sin efecto.",
      fact_key: "rights.rectification.systems_corrected",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.systems_corrected",
        "Capacidad de corrección verificada con data/system mapping y walkthrough.",
      ),
      evidence_to_review: ["data/system mapping", "walkthrough de corrección"],
      evidence_review_help: [
        {
          evidence_item: "data/system mapping",
          review_guide:
            "Examinar el mapeo de datos y sistemas para identificar dónde se conserva o utiliza la información susceptible de rectificación, incluidas fuentes principales, aplicaciones relacionadas y repositorios que puedan mantener copias operativas. Verificar que el diseño permita determinar qué componentes necesitan actualizarse, quién es responsable de intervenirlos y cómo se reconocerán dependencias que podrían dejar información incorrecta sin modificar.",
          no_evidence_guidance:
            "Consultar inventarios, diagramas de flujo y responsables técnicos para reconstruir la ubicación y circulación de los datos pertinentes. Si no existe mapeo suficiente, identificar los sistemas o interfaces aún no revisados y las comprobaciones necesarias, sin dar por completa la capacidad de rectificación por la posibilidad de editar un único registro.",
          expected_result:
            "Un mapeo revisable de las fuentes y sistemas relevantes, asociado a rutas y responsables de actualización, que permita evaluar la cobertura de la corrección. Las copias, dependencias y repositorios cuya actualización no esté definida deben quedar reconocidos como brechas o asuntos pendientes de verificación.",
        },
        {
          evidence_item: "walkthrough de corrección",
          review_guide:
            "Comprobar mediante un recorrido controlado cómo se ejecutaría una modificación desde la identificación del dato hasta su actualización en los sistemas pertinentes. Revisar los pasos, permisos, validaciones y confirmaciones de resultado, distinguiendo una demostración efectiva con datos ficticios de una descripción verbal del procedimiento o de una funcionalidad todavía proyectada.",
          no_evidence_guidance:
            "Solicitar una demostración en un entorno adecuado o antecedentes equivalentes de pruebas previamente realizadas, evitando utilizar información personal de titulares reales. Si no es posible observar la ejecución, identificar las etapas no comprobadas y los requisitos de una futura validación, sin atribuir capacidad operacional probada a diagramas o especificaciones.",
          expected_result:
            "Un recorrido verificable que permita valorar si el procedimiento puede modificar los datos en las fuentes y sistemas aplicables, con pasos, resultados y eventuales fallos identificados. Las funcionalidades solo diseñadas o no probadas deben distinguirse claramente de las efectivamente observadas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-reuse",
      provenance: "agency_standard",
    },
    {
      node_key: "check-reuse",
      node_type: "question",
      title: "No reutilización del valor incorrecto",
      prompt:
        "¿El procedimiento impide que los datos sin rectificar vuelvan a tratarse una vez efectuada la rectificación?",
      why_it_matters:
        "Reutilizar el valor incorrecto anula la rectificación ya ejecutada.",
      fact_key: "rights.rectification.reuse_prevented",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.reuse_prevented",
        "Control contra reutilización verificado.",
      ),
      evidence_to_review: ["walkthrough de corrección", "análisis de propagación"],
      evidence_review_help: [
        {
          evidence_item: "walkthrough de corrección",
          review_guide:
            "Examinar qué sucede después de aplicar una rectificación y verificar si las operaciones posteriores utilizan el dato actualizado en lugar del valor anterior incorrecto. Observar, cuando el entorno lo permita, consultas, actualizaciones o procesos de intercambio representativos, prestando especial atención a cachés, réplicas y sincronizaciones que puedan reintroducir información sin corregir.",
          no_evidence_guidance:
            "Solicitar una prueba controlada de lectura y uso posterior del dato corregido o consultar las especificaciones de actualización pertinentes. Si no existe evidencia de lo que ocurre después de modificar el registro, identificar los puntos de reutilización que requieren revisión, sin afirmar que la corrección de una pantalla elimina automáticamente todos los valores obsoletos.",
          expected_result:
            "Antecedentes suficientes para valorar si los procesos pertinentes evitan volver a tratar el dato sin rectificar una vez efectuada la corrección. Deben quedar identificadas las rutas no verificadas, dependencias técnicas y posibles mecanismos de reintroducción del valor incorrecto, sin exigir una arquitectura tecnológica específica.",
        },
        {
          evidence_item: "análisis de propagación",
          review_guide:
            "Contrastar las rutas internas de circulación de datos con los mecanismos que actualizan copias, procesos dependientes e intercambios posteriores a la rectificación. Examinar si las fuentes secundarias reciben el valor corregido y si existen situaciones en que procesos programados, importaciones o replicaciones podrían restaurar información antigua, diferenciando propagación interna de comunicación a destinatarios externos.",
          no_evidence_guidance:
            "Recabar diagramas, especificaciones y antecedentes de sincronización entre sistemas para identificar las rutas por las que circula el dato. Si faltan definiciones sobre actualización o prevención de reingreso de valores antiguos, registrar las brechas sin suponer sincronización automática ni exigir herramientas técnicas determinadas.",
          expected_result:
            "Un análisis trazable de los mecanismos que mantienen la corrección en los sistemas y procesos internos relevantes, incluyendo controles o dependencias para evitar la reutilización del dato incorrecto. Las rutas pendientes deben quedar señaladas y diferenciadas de las obligaciones de comunicación externa revisadas en otros nodos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-recipients",
      provenance: "agency_standard",
    },
    {
      node_key: "check-recipients",
      node_type: "question",
      title: "Destinatarios identificados",
      prompt:
        "¿El procedimiento identifica a los destinatarios a quienes los datos fueron comunicados o cedidos?",
      why_it_matters:
        "Sin identificar destinatarios no hay propagación posible.",
      fact_key: "rights.rectification.recipients_identified",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.recipients_identified",
        "Identificación de destinatarios prevista con trazabilidad de datos.",
      ),
      evidence_to_review: ["trazabilidad de datos", "propagación/corrección downstream"],
      evidence_review_help: [
        {
          evidence_item: "trazabilidad de datos",
          review_guide:
            "Verificar cómo el responsable identifica a las personas, entidades u organismos a quienes comunicó o cedió los datos susceptibles de rectificación. Examinar registros de flujos, relaciones con terceros y antecedentes de comunicaciones relevantes, distinguiendo destinatarios efectivamente alcanzados de categorías generales o receptores meramente previstos.",
          no_evidence_guidance:
            "Consultar inventarios de cesiones, contratos, mapas de flujo y responsables de procesos para reconstruir las comunicaciones efectuadas. Si no puede determinarse quién recibió el dato, identificar las fuentes de información faltantes y las limitaciones de trazabilidad sin inventar destinatarios ni presumir que todos los terceros relacionados con la empresa recibieron esos datos.",
          expected_result:
            "Una ruta verificable para identificar los destinatarios pertinentes de los datos comunicados o cedidos, suficiente para evaluar la futura obligación de informarles sobre una rectificación. Las comunicaciones sin trazabilidad y los destinatarios aún no determinados deben quedar explícitos, sin gestionar comunicaciones individuales en Stage 1.",
        },
        {
          evidence_item: "propagación/corrección downstream",
          review_guide:
            "Examinar la representación de flujos posteriores a la comunicación o cesión para determinar qué destinatarios podrían mantener el dato original y cómo se los vincularía con la rectificación correspondiente. Contrastar los flujos documentados con los sistemas o procesos de origen, distinguiendo la identificación del destinatario de la ejecución posterior de su notificación.",
          no_evidence_guidance:
            "Recabar diagramas, matrices de intercambio y criterios de comunicación con terceros para identificar las rutas relevantes. Cuando la propagación externa no esté descrita, señalar qué conexiones deben investigarse sin asumir que una corrección interna actualiza automáticamente los datos en poder de otros responsables.",
          expected_result:
            "Un análisis de destinatarios y rutas externas suficientemente claro para orientar futuras comunicaciones de rectificación, con dependencias y límites documentados. Deben distinguirse relaciones identificadas, intercambios comprobados y conexiones cuya pertinencia aún no haya podido verificarse.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-notify",
      provenance: "agency_standard",
    },
    {
      node_key: "check-notify",
      node_type: "question",
      title: "Comunicación a destinatarios",
      prompt: "¿El procedimiento comunica la rectificación a esos destinatarios?",
      why_it_matters:
        "La rectificación debe alcanzar los tratamientos downstream.",
      fact_key: "rights.rectification.recipients_notified",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.recipients_notified",
        "Comunicación a destinatarios prevista con template.",
      ),
      evidence_to_review: ["template de comunicación a destinatarios"],
      evidence_review_help: [
        {
          evidence_item: "template de comunicación a destinatarios",
          review_guide:
            "Comprobar que el modelo permita comunicar de forma clara a los destinatarios pertinentes que los datos previamente transmitidos fueron rectificados, identificando la corrección necesaria de manera suficiente y proporcionada. Revisar que el procedimiento defina quién emite la comunicación, por qué medio y cómo se contemplará su respaldo, sin divulgar información personal adicional innecesaria.",
          no_evidence_guidance:
            "Solicitar los modelos disponibles y consultar a los responsables de las relaciones con destinatarios cómo se comunicarían los cambios. Si no existen instrucciones o formatos, identificar las definiciones pendientes sin afirmar que las notificaciones ya se realizan ni transformar un template determinado en requisito legal universal.",
          expected_result:
            "Un modelo de comunicación y una ruta operacional que permitan informar a los destinatarios correspondientes sobre la rectificación realizada, con responsabilidades y medios previstos. Las capacidades no implementadas, limitaciones de alcance y necesidades de comprobación deben quedar reconocidas sin registrar comunicaciones reales de titulares.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-exception",
      provenance: "agency_standard",
    },
    {
      node_key: "check-exception",
      node_type: "question",
      title: "Criterio de imposibilidad o esfuerzo desproporcionado",
      prompt:
        "¿El procedimiento contempla la excepción cuando la comunicación resulte imposible o exija esfuerzo desproporcionado, como criterio a aplicar y no como decisión anticipada de un caso?",
      why_it_matters:
        "La excepción existe como marco; invocarla en un caso real pertenece a Stage 2.",
      fact_key: "rights.rectification.exception_criterion",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.exception_criterion",
        "Criterio documentado para imposibilidad/esfuerzo desproporcionado.",
      ),
      evidence_to_review: [
        "criterio documentado para imposibilidad/esfuerzo desproporcionado",
      ],
      evidence_review_help: [
        {
          evidence_item: "criterio documentado para imposibilidad/esfuerzo desproporcionado",
          review_guide:
            "Examinar si el procedimiento define cómo evaluar, de forma individualizada y justificable, los supuestos en que comunicar una rectificación a destinatarios resulte imposible o exija un esfuerzo desproporcionado. Verificar que se contemplen antecedentes objetivos de las dificultades y alternativas razonables, sin presentar la excepción como una dispensa automática por costo, incomodidad o ausencia de un canal habitual.",
          no_evidence_guidance:
            "Consultar las instrucciones jurídicas y operacionales aplicables para identificar quién evaluaría la excepción y qué circunstancias deberían examinarse. Si no existe un criterio definido, documentar esa carencia sin inventar umbrales de costo, porcentajes o supuestos de aplicación automática, ni adoptar conclusiones sobre casos reales.",
          expected_result:
            "Un criterio documentado y verificable para evaluar las excepciones legales a la comunicación de rectificaciones, con responsables y circunstancias pertinentes identificadas. Debe quedar claro que la excepción afecta la comunicación a destinatarios y no autoriza, por sí misma, omitir la rectificación que corresponda realizar al responsable.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-exception-evidence",
      provenance: "agency_standard",
    },
    {
      node_key: "check-exception-evidence",
      node_type: "question",
      title: "Fundamentación de la excepción",
      prompt:
        "¿El procedimiento exige que cualquier invocación de esa excepción quede fundamentada y evidenciada?",
      why_it_matters:
        "Una excepción sin fundamento es una vía de elusión de la propagación.",
      fact_key: "rights.rectification.exception_evidenced",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.exception_evidenced",
        "Exigencia de fundamentación verificada.",
      ),
      evidence_to_review: [
        "criterio documentado para imposibilidad/esfuerzo desproporcionado",
      ],
      evidence_review_help: [
        {
          evidence_item: "criterio documentado para imposibilidad/esfuerzo desproporcionado",
          review_guide:
            "Comprobar que el procedimiento exija fundamentar y respaldar cualquier futura invocación de imposibilidad o esfuerzo desproporcionado, identificando las circunstancias concretas, las verificaciones realizadas y la justificación de no comunicar la rectificación. Revisar quién evaluaría los antecedentes y cómo quedaría documentada la decisión, sin confundir disponer de un criterio general con haber demostrado una excepción en un caso particular.",
          no_evidence_guidance:
            "Recabar instrucciones, modelos de justificación o criterios de revisión interna para determinar cómo se sustentaría una decisión excepcional. Si no se define qué antecedentes deben examinarse o quién autoriza la decisión, señalar las brechas sin construir justificaciones hipotéticas como si fueran hechos comprobados.",
          expected_result:
            "Un procedimiento que exija fundamentación y respaldo revisable antes de utilizar la excepción legal a la comunicación, con responsabilidades y criterios de evaluación identificados. La existencia de esta capacidad no supone que una excepción concreta haya sido acreditada ni requiere crear expedientes individuales en Stage 1.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-blocking",
      provenance: "agency_standard",
    },
    {
      node_key: "check-blocking",
      node_type: "question",
      title: "Coordinación con bloqueo",
      prompt:
        "¿El procedimiento coordina la eventual solicitud de bloqueo temporal mientras se resuelve la rectificación?",
      why_it_matters:
        "El bloqueo protege los datos mientras la rectificación está pendiente.",
      fact_key: "rights.rectification.blocking_coordinated",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.blocking_coordinated",
        "Coordinación con bloqueo prevista.",
      ),
      evidence_to_review: ["procedimiento de rectificación"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de rectificación",
          review_guide:
            "Verificar que las instrucciones contemplen cómo reconocer y derivar una eventual petición de bloqueo temporal vinculada con una solicitud de rectificación pendiente. Contrastar la ruta con D4.06 y con las reglas del artículo 8 ter, identificando responsables, condiciones de coordinación y el plazo especial aplicable, sin equiparar cualquier solicitud de rectificación con un bloqueo obligatorio.",
          no_evidence_guidance:
            "Consultar los procedimientos de rectificación y bloqueo para reconstruir cómo se gestionaría su eventual concurrencia. Si no existe coordinación definida, identificar las decisiones y responsabilidades pendientes sin inventar suspensión automática de tratamientos ni incorporar gestión de solicitudes individuales.",
          expected_result:
            "Una ruta operacional documentada para coordinar la rectificación con el bloqueo temporal cuando legalmente corresponda, diferenciando el procedimiento principal de la medida provisional y su plazo especial. Las integraciones o actuaciones aún no previstas deben quedar identificadas sin alterar el protocolo específico de D4.06.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-common",
      related_activity_keys: ["rights.blocking_enable"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-common",
      node_type: "question",
      title: "Procedimiento y plazos comunes",
      prompt:
        "¿La rectificación utiliza el procedimiento y los plazos comunes de D4.01?",
      why_it_matters:
        "Los plazos y cauces son los del mecanismo general, sin duplicarlos.",
      fact_key: "rights.rectification.common_procedure",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "rights.rectification.common_procedure",
        "Uso del procedimiento común verificado.",
      ),
      evidence_to_review: ["simulación controlada"],
      evidence_review_help: [
        {
          evidence_item: "simulación controlada",
          review_guide:
            "Recorrer con datos ficticios el itinerario previsto de una solicitud de rectificación, desde su recepción y acuse hasta la revisión, ejecución y respuesta escrita, contrastándolo con el mecanismo general D4.01. Comprobar la coordinación de responsables, la capacidad para cumplir el plazo general de treinta días corridos y la eventual prórroga única, sin crear vencimientos reales ni duplicar las reglas comunes en otro procedimiento.",
          no_evidence_guidance:
            "Solicitar un recorrido de demostración o revisar pruebas controladas existentes que permitan observar la conexión entre el procedimiento general y la rectificación. Si no es posible realizarlo, identificar qué etapas, responsables o plazos necesitan comprobación, sin utilizar datos de titulares reales ni considerar una descripción del proceso como prueba funcional suficiente.",
          expected_result:
            "Una simulación revisable que permita comprobar la articulación entre D4.01 y la capacidad específica de rectificación, incluidas recepción, derivación, corrección y respuesta dentro del marco temporal legal. Las etapas no verificadas deben quedar expresamente identificadas y la prueba no debe transformarse en un expediente operativo de Stage 2.",
        },
      ],
      required_facts: [],
      default_next_node_key: "synthesis",
      related_activity_keys: ["rights.exercise_mechanism_design"],
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la rectificación",
      prompt:
        "El sistema verifica el mecanismo general de D4.01 y la capacidad de rectificación y propagación.",
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
            "La atención de la rectificación solo está completa sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un punto de rectificación requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de capacidad de rectificación que requieren corrección.",
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
          rule_id: "rectification-complete",
          description:
            "Mecanismo diseñado y capacidad de rectificación verificada.",
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
          goto_outcome_key: "rectification_enabled",
          explanation:
            "La empresa puede rectificar y propagar rectificaciones con sus criterios y controles.",
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
      outcome_key: "rectification_enabled",
      label: "Atención de la rectificación habilitada",
      classification: "agency_standard",
      explanation:
        "La empresa dispone de procedimiento y capacidad para rectificar y propagar modificaciones. Esto valida la capacidad, sin decidir casos individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.rectification_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva el procedimiento de rectificación, el data/system mapping, la evidencia de propagación downstream, el template de comunicación y el criterio de excepción con su walkthrough.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "La atención de la rectificación solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
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
      label: "Requiere correcciones de rectificación",
      classification: "agency_standard",
      explanation:
        "Al menos un punto de rectificación requiere corrección. Completa la capacidad faltante.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada punto pendiente y vuelve a verificar la capacidad de rectificación.",
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
