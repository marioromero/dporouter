import type { ExecutionProtocol, EvidenceReviewHelp, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.04.
 *
 * activity_key = rights.suppression_enable (checklist, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente el marco causal, las excepciones, los pasos
 * adicionales, la evidencia, las dependencias y el state effect del
 * contenido canónico D4.04.
 *
 * Stage 1 verifica que el marco cubra las 6 causales y las 6
 * familias de excepciones; NO convierte la guía en juicio
 * profesional sobre casos individuales ni adopta decisiones de
 * supresión (`reasoning_record_required = false`). Cada causal y
 * cada excepción es un check propio: la matriz causal/excepciones
 * es el deliverable, no una decisión automatizada.
 *
 * Dependencia de completitud hacia D4.01 vía fact externo
 * `rights.exercise_mechanism_status`. Metodología `agency_standard`.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.suppression.cause_unnecessary",
  "rights.suppression.cause_consent_withdrawn",
  "rights.suppression.cause_unlawful",
  "rights.suppression.cause_outdated",
  "rights.suppression.cause_legal_order",
  "rights.suppression.cause_opposition",
  "rights.suppression.exception_expression",
  "rights.suppression.exception_legal_contract",
  "rights.suppression.exception_public_function",
  "rights.suppression.exception_public_health",
  "rights.suppression.exception_research",
  "rights.suppression.exception_claims",
  "rights.suppression.request_records",
  "rights.suppression.data_located",
  "rights.suppression.deletion_executed",
  "rights.suppression.third_parties_identified",
  "rights.suppression.changes_communicated",
  "rights.suppression.blocking_integrated",
  "rights.suppression.no_case_decisions",
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
  "check-cause-unnecessary": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Contrastar los criterios de la matriz con la causal del artículo 7, letra a), verificando cómo se determina que los datos dejaron de ser necesarios respecto de las finalidades para las que fueron recogidos. Examinar la relación con el inventario de tratamientos y los períodos de conservación definidos, diferenciando la pérdida de necesidad de una simple decisión operativa de dejar de utilizar un sistema.",
      no_evidence_guidance:
        "Recabar las reglas de conservación y las finalidades documentadas en D2 para identificar cómo se evaluaría la necesidad de mantener datos personales. Si no existen criterios que permitan relacionar datos y finalidades, señalar la brecha sin establecer nuevos plazos de conservación ni concluir que todo dato antiguo debe eliminarse.",
      expected_result:
        "Una matriz que reconozca la causal de datos no necesarios y permita analizarla respecto de finalidades y criterios de conservación identificables. Las relaciones no demostradas y las excepciones potencialmente pertinentes deben quedar reconocidas, sin producir decisiones automáticas de supresión.",
    },
  ],
  "check-cause-consent": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Comprobar que la matriz incluya la revocación del consentimiento junto con la condición legal de inexistencia de otro fundamento para el tratamiento. Contrastar el criterio con las definiciones de bases de licitud de D2 y con el procedimiento de retiro de D3.06, distinguiendo la revocación válida de una conclusión automática de que todos los datos deben eliminarse.",
      no_evidence_guidance:
        "Consultar los criterios jurídicos de supresión y las rutas existentes para registrar o aplicar el retiro del consentimiento. Si no está definida la comprobación de otros fundamentos legales, identificar esa ausencia sin inventar bases alternativas ni modificar las decisiones jurídicas de D2.",
      expected_result:
        "Un criterio verificable que contemple la causal de consentimiento revocado y la comprobación de inexistencia de otro fundamento legal, con dependencias identificadas respecto de D2 y D3.06. La matriz no debe atribuir retroactividad al retiro ni exigir eliminación automática e indiscriminada.",
    },
  ],
  "check-cause-unlawful": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Verificar que el marco contemple la supresión cuando los datos hayan sido obtenidos o tratados ilícitamente por el responsable, identificando qué antecedentes permitirían evaluar esa circunstancia. Distinguir problemas documentales, dudas de cumplimiento y hechos que podrían sustentar una conclusión jurídica de ilicitud, sin convertir cualquier deficiencia administrativa en causal automáticamente acreditada.",
      no_evidence_guidance:
        "Consultar los criterios de cumplimiento y las evaluaciones existentes sobre licitud de los tratamientos, identificando quién debería examinar situaciones potencialmente ilícitas. Si no existen reglas para evaluar esta causal, registrar la brecha sin declarar ilícitos tratamientos concretos ni crear conclusiones jurídicas no sustentadas.",
      expected_result:
        "Una matriz que contemple la obtención o tratamiento ilícito como causal legal y una ruta para su evaluación fundada. Deben quedar claras las responsabilidades y las incertidumbres, sin que la actividad adopte decisiones sobre casos reales.",
    },
  ],
  "check-cause-outdated": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Examinar cómo la matriz contempla los datos caducos y qué criterios permiten distinguir esa condición de la mera antigüedad de un registro o de un dato simplemente desactualizado. Contrastar los criterios con las reglas de vigencia y conservación aplicables al tratamiento, evitando equiparar automáticamente caducidad con inexactitud o con un plazo interno arbitrario.",
      no_evidence_guidance:
        "Solicitar las definiciones de vigencia, conservación y caducidad aplicadas por la organización, junto con los antecedentes que las respaldan. Si no existen criterios suficientes para distinguirlas, identificar las definiciones pendientes sin inventar plazos universales ni declarar caducos todos los registros antiguos.",
      expected_result:
        "Un criterio documentado para reconocer y analizar la causal de datos caducos, con sustento en las condiciones aplicables al tratamiento. Las diferencias respecto de rectificación, actualización y conservación deben permanecer claras.",
    },
  ],
  "check-cause-order": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Comprobar que la matriz incluya la supresión necesaria para cumplir una sentencia judicial, una resolución de la autoridad de protección de datos o una obligación legal. Revisar cómo se identificarían el mandato aplicable, los datos alcanzados y las responsabilidades de ejecución, sin extender los efectos de una decisión concreta a información no comprendida en ella.",
      no_evidence_guidance:
        "Recabar los criterios internos para recibir e interpretar mandatos judiciales, administrativos y legales relacionados con la supresión. Cuando no exista una ruta definida, identificar los pasos y responsables pendientes sin inventar resoluciones ni decisiones aplicables a la empresa.",
      expected_result:
        "Un marco que reconozca la causal de supresión por mandato jurídico y contemple cómo delimitar su alcance y ejecutar sus consecuencias. La matriz debe permitir distinguir la existencia del criterio general de la ejecución de una resolución particular.",
    },
  ],
  "check-cause-opposition": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Verificar que la matriz contemple el supuesto de oposición ejercida conforme al artículo 8, junto con la inexistencia de otro fundamento legal para continuar el tratamiento. Examinar cómo se coordinaría la evaluación de esta causal con D4.05 y las bases de licitud ya definidas, sin considerar suficiente la mera presentación de una oposición para ordenar automáticamente toda eliminación.",
      no_evidence_guidance:
        "Consultar los criterios existentes de oposición y su conexión con el procedimiento de supresión. Si falta una regla para verificar la procedencia de la oposición o la ausencia de otro fundamento legal, señalar la brecha sin crear nuevas bases jurídicas ni resolver solicitudes individuales.",
      expected_result:
        "Una matriz que contemple correctamente la causal derivada de la oposición y las condiciones legales que la acompañan, con una ruta de coordinación identificable. Las evaluaciones pendientes deben quedar reconocidas sin reemplazar el procedimiento específico de D4.05.",
    },
  ],
  "check-exception-expression": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Examinar si la matriz contempla la excepción cuando el tratamiento sea necesario para ejercer las libertades de emitir opinión e informar. Revisar que su aplicación prevista exija examinar la necesidad concreta del tratamiento y los derechos involucrados, sin transformar una invocación genérica de libertad de expresión en una autorización indiscriminada para conservar datos.",
      no_evidence_guidance:
        "Consultar los criterios jurídicos de conservación vinculados con actividades informativas o expresivas y los responsables de su evaluación. Si no existen pautas suficientes, documentar la brecha sin inventar una excepción general aplicable a cualquier publicación o dato disponible públicamente.",
      expected_result:
        "Un criterio de excepción vinculado con las libertades legalmente protegidas y sujeto a evaluación de necesidad, con fundamentos y límites identificables. La matriz no debe adoptar anticipadamente conclusiones sobre publicaciones o tratamientos específicos.",
    },
  ],
  "check-exception-contract": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Verificar que la matriz considere la necesidad del tratamiento para cumplir una obligación legal o ejecutar un contrato suscrito entre el titular y el responsable. Examinar cómo se identificarían la obligación o relación contractual pertinente, los datos necesarios y la duración de su conservación, evitando equiparar cualquier relación comercial con una excepción automáticamente aplicable.",
      no_evidence_guidance:
        "Recabar criterios de conservación legal y contractual, consultando las áreas jurídicas y operacionales sobre los fundamentos pertinentes. Si no pueden identificarse obligaciones específicas o la necesidad del tratamiento, señalar las comprobaciones pendientes sin construir justificaciones genéricas de retención.",
      expected_result:
        "Un marco que contemple esta excepción con verificación de fundamento, necesidad y alcance de los datos conservados. Las obligaciones no acreditadas y los usos distintos de aquellos que justifican la conservación deben permanecer diferenciados.",
    },
  ],
  "check-exception-public": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Comprobar que se contemple la excepción relacionada con el cumplimiento de funciones públicas o el ejercicio de actividades de interés público, incluyendo la necesidad del tratamiento correspondiente. Revisar cómo se acreditaría el fundamento aplicable y qué datos serían pertinentes, sin presumir que toda finalidad socialmente conveniente constituye una actividad amparada por esta excepción.",
      no_evidence_guidance:
        "Consultar los antecedentes jurídicos y funcionales que podrían sustentar la actividad de interés público o la función correspondiente. Si no existen definiciones que permitan verificar su procedencia, registrar la incertidumbre sin atribuir competencias públicas ni fundamentos legales no documentados.",
      expected_result:
        "Un criterio documentado que permita evaluar la excepción por función pública o interés público dentro de sus condiciones legales. Deben quedar identificados los fundamentos y límites pertinentes, sin declarar su aplicabilidad automática a tratamientos concretos.",
    },
  ],
  "check-exception-health": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Examinar que la matriz contemple el tratamiento necesario por razones de interés público en el ámbito de la salud pública, sujeto a las condiciones y garantías establecidas legalmente. Distinguir esta excepción de la simple existencia de datos de salud o de una actividad privada relacionada con servicios sanitarios, revisando cómo se comprobaría el fundamento específico.",
      no_evidence_guidance:
        "Consultar las reglas jurídicas y los criterios del responsable para identificar los supuestos de interés público sanitario y sus garantías aplicables. Si no están definidos, registrar la brecha sin atribuir automáticamente la excepción a todo tratamiento de datos de salud ni inventar condiciones reglamentarias.",
      expected_result:
        "Un criterio que contemple la excepción sanitaria bajo sus requisitos legales y permita identificar qué condiciones deberían verificarse. Las garantías, fundamentos o supuestos no determinados deben permanecer expresamente pendientes de evaluación.",
    },
  ],
  "check-exception-research": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Verificar que la matriz contemple tratamientos con fines históricos, estadísticos o científicos y estudios o investigaciones que atiendan fines de interés público, examinando cómo se evaluaría la necesidad de conservar los datos. Distinguir una investigación efectivamente pertinente de la mera posibilidad de que los registros puedan resultar útiles en el futuro, considerando las garantías legales que correspondan.",
      no_evidence_guidance:
        "Recabar los criterios aplicados a proyectos de investigación y conservación de información para identificar los fundamentos y condiciones previstos. Si no existe una pauta de evaluación, señalar las definiciones pendientes sin presumir que cualquier análisis interno o interés estadístico permite conservar indefinidamente datos personales.",
      expected_result:
        "Un marco documentado para valorar la excepción relativa a fines históricos, estadísticos, científicos o investigaciones de interés público, con alcance y necesidad verificables. Las condiciones no acreditadas deben reconocerse sin adoptar decisiones de retención sobre casos reales.",
    },
  ],
  "check-exception-claims": [
    {
      evidence_item: "matriz causal/excepciones",
      review_guide:
        "Comprobar que la matriz contemple la necesidad de tratamiento para formular, ejercer o defender reclamaciones administrativas o judiciales. Examinar cómo se delimitarían los datos pertinentes y el vínculo con la reclamación, evitando que una posibilidad abstracta de litigio funcione como justificación universal para mantener toda la información.",
      no_evidence_guidance:
        "Consultar los criterios de conservación asociados a procedimientos y controversias administrativas o judiciales, identificando cómo se evaluaría su pertinencia. Si no existen pautas para relacionar los datos con la defensa o ejercicio de reclamaciones, señalar la brecha sin inventar litigios ni obligaciones de conservación.",
      expected_result:
        "Un criterio documentado de excepción para reclamaciones administrativas o judiciales, que permita examinar necesidad, pertinencia y alcance de la conservación. La matriz no debe presumir que cualquier eventual controversia justifica conservar indefinidamente todos los datos.",
    },
  ],
  "check-request": [
    {
      evidence_item: "procedimiento de supresión",
      review_guide:
        "Examinar cómo se identifica la causal invocada por el titular y cómo se reciben los antecedentes que resulten pertinentes para evaluarla conforme al artículo 11. Verificar que el procedimiento permita aclarar solicitudes incompletas y derivar su evaluación jurídica, sin exigir documentación uniforme para todas las causales ni anticipar una decisión favorable o denegatoria.",
      no_evidence_guidance:
        "Solicitar las instrucciones de recepción y clasificación del derecho de supresión, consultando los requisitos previstos para cada causal. Si el procedimiento no distingue causales o antecedentes, identificar las correcciones necesarias sin imponer exigencias adicionales no justificadas legalmente.",
      expected_result:
        "Un procedimiento capaz de recibir y orientar solicitudes de supresión según la causal y los antecedentes pertinentes, con responsabilidades de evaluación identificadas. Las reglas incompletas deben quedar señaladas sin generar expedientes individuales ni decidir solicitudes reales en Stage 1.",
    },
    {
      evidence_item: "templates",
      review_guide:
        "Revisar si los modelos de solicitud permiten señalar la causal de supresión y aportar información suficiente para identificar los datos o tratamientos afectados. Contrastar sus campos e instrucciones con el procedimiento general D4.01, detectando barreras innecesarias o mensajes que sugieran que todas las solicitudes producen eliminación automática.",
      no_evidence_guidance:
        "Recabar los formularios o modelos previstos para presentar solicitudes y consultar cómo se usarían en los canales habilitados. Si faltan materiales o se desconocen sus condiciones de uso, identificar las comprobaciones pendientes sin inventar formularios publicados ni requisitos adicionales.",
      expected_result:
        "Modelos que permitan presentar una solicitud comprensible y reunir los antecedentes pertinentes sin cargas injustificadas, coherentes con el procedimiento general. Las limitaciones de versiones y etapas de implementación deben quedar reconocidas.",
    },
  ],
  "check-location": [
    {
      evidence_item: "data mapping",
      review_guide:
        "Verificar que el mapeo permita localizar los datos susceptibles de supresión en las fuentes, sistemas y procesos pertinentes, incluyendo copias o repositorios dependientes cuando corresponda. Examinar la asociación entre los datos, sus finalidades y los responsables técnicos, diferenciando sistemas efectivamente identificados de aquellos que podrían mantener información sin trazabilidad suficiente.",
      no_evidence_guidance:
        "Consultar inventarios de tratamientos, fuentes de datos y diagramas de sistemas para reconstruir las ubicaciones relevantes. Cuando existan repositorios no identificados o dependencias sin analizar, registrar esas brechas sin presumir que eliminar un registro en la aplicación principal cubre todo el tratamiento.",
      expected_result:
        "Un mapeo revisable de los sistemas y datos potencialmente alcanzados por una supresión procedente, con fuentes y responsables identificados. Las ubicaciones pendientes y los límites de cobertura deben quedar visibles para orientar la ejecución posterior.",
    },
    {
      evidence_item: "revisión de retention/data flows",
      review_guide:
        "Contrastar los flujos y criterios de conservación para identificar dónde se mantienen los datos y qué procesos pueden seguir utilizándolos o replicándolos. Examinar la conexión con las reglas de retención de D2 y las eventuales obligaciones de conservación, evitando confundir una política de eliminación periódica con capacidad para localizar los datos afectados por un ejercicio de supresión.",
      no_evidence_guidance:
        "Recabar políticas de conservación, flujos documentados e información de responsables de procesos para reconstruir rutas y períodos pertinentes. Si faltan antecedentes sobre copias o destinos, señalar las limitaciones sin fijar nuevos plazos ni concluir automáticamente que todos los repositorios deben eliminarse.",
      expected_result:
        "Una relación trazable entre ubicación, circulación y criterios de conservación de los datos, suficiente para preparar una eventual supresión procedente. Las dependencias técnicas y jurídicas que requieren evaluación adicional deben quedar identificadas.",
    },
  ],
  "check-deletion": [
    {
      evidence_item: "reglas de eliminación",
      review_guide:
        "Examinar cómo las reglas operacionales permiten ejecutar una supresión cuando se ha determinado su procedencia, definiendo sistemas alcanzados, responsables y comprobaciones de resultado. Revisar la relación con restricciones de conservación jurídicamente justificadas y con copias pertinentes, distinguiendo eliminación efectiva de simples cambios de visibilidad, desactivación de cuentas o promesas de borrado.",
      no_evidence_guidance:
        "Consultar procedimientos de eliminación y responsables técnicos para identificar qué operaciones se aplicarían y cómo se verificarían. Si las reglas no permiten distinguir eliminación de otras formas de restricción o conservación, documentar esa brecha sin imponer una tecnología universal ni ejecutar borrados reales.",
      expected_result:
        "Un procedimiento de eliminación trazable, capaz de aplicar la supresión procedente en los sistemas pertinentes y distinguir los datos que deban conservarse por fundamento legal. Las etapas no implementadas y los límites de verificación deben quedar explícitos.",
    },
    {
      evidence_item: "walkthrough controlado",
      review_guide:
        "Realizar o revisar una demostración con información ficticia para comprobar la ruta desde la decisión de supresión simulada hasta su ejecución y verificación en los sistemas pertinentes. Observar el resultado, las dependencias y los pasos manuales necesarios, sin confundir una prueba exitosa en un repositorio con cobertura demostrada de todas las fuentes.",
      no_evidence_guidance:
        "Solicitar una prueba segura en un entorno apropiado o antecedentes verificables de pruebas anteriores. Si no puede observarse la eliminación, identificar los pasos cuya ejecución permanece pendiente de comprobación, sin utilizar datos reales de titulares ni considerar una descripción documental prueba suficiente de funcionamiento.",
      expected_result:
        "Un recorrido controlado que permita valorar la capacidad operacional de eliminación, con operaciones observadas, comprobaciones y limitaciones documentadas. La prueba debe demostrar capacidad dentro de su alcance, sin constituir una decisión de supresión real ni garantizar resultados fuera de los sistemas evaluados.",
    },
  ],
  "check-third-parties": [
    {
      evidence_item: "procedimiento downstream",
      review_guide:
        "Verificar cómo el procedimiento identifica a los terceros a quienes se comunicaron o cedieron datos y determina qué actuaciones posteriores deben coordinarse cuando proceda la supresión. Examinar las responsabilidades, los medios de comunicación y la relación con las operaciones ejecutadas por terceros, sin asumir que el responsable puede eliminar directamente información almacenada en sistemas ajenos.",
      no_evidence_guidance:
        "Consultar las instrucciones de gestión de terceros y los responsables de relaciones de datos para reconstruir los pasos previstos. Si no existe una ruta para identificar receptores pertinentes, registrar las conexiones y responsabilidades pendientes sin inventar facultades técnicas sobre los sistemas de otras entidades.",
      expected_result:
        "Un procedimiento que permita identificar y abordar los destinatarios pertinentes para las comunicaciones o actuaciones derivadas de una supresión, cuando corresponda legalmente. Deben distinguirse las obligaciones del responsable, las gestiones con terceros y los efectos cuya realización no esté comprobada.",
    },
    {
      evidence_item: "revisión de propagación",
      review_guide:
        "Examinar la trazabilidad de comunicaciones y cesiones previas para identificar a qué destinatarios llegaron los datos y qué rutas podrían resultar relevantes tras una supresión procedente. Contrastar los flujos documentados con los registros disponibles, evitando tratar a todos los proveedores o entidades relacionadas como destinatarios de la información afectada.",
      no_evidence_guidance:
        "Recabar mapas de intercambio, registros de cesiones y antecedentes de flujos hacia terceros para identificar las relaciones pertinentes. Cuando las comunicaciones no puedan trazarse, señalar las fuentes y destinatarios pendientes de verificación sin inventar cesiones ni presumir propagación automática.",
      expected_result:
        "Una revisión documentada de los destinatarios y rutas externas vinculados con los datos, suficiente para evaluar actuaciones posteriores cuando correspondan. Las comunicaciones no trazables o las conexiones cuyo alcance no esté definido deben quedar reconocidas.",
    },
  ],
  "check-communication": [
    {
      evidence_item: "templates",
      review_guide:
        "Comprobar que los modelos permitan comunicar a los terceros receptores los cambios relacionados con una supresión cuando así corresponda conforme al artículo 11. Revisar que el contenido identifique la actuación pertinente y sus efectos de manera suficiente, evitando transmitir información personal adicional innecesaria o exigir idéntica comunicación para situaciones jurídicamente distintas.",
      no_evidence_guidance:
        "Solicitar los modelos de comunicación disponibles y consultar los criterios que determinan cuándo debe informarse a un tercero. Si no existen textos o reglas de uso, identificar las correcciones pendientes sin afirmar que toda supresión requiere una notificación universal ni que comunicaciones no realizadas están acreditadas.",
      expected_result:
        "Modelos de comunicación coherentes con las obligaciones aplicables y con la ruta de supresión prevista, capaces de orientar actuaciones con terceros cuando corresponda. Deben quedar reconocidas las condiciones y situaciones en que su utilización no esté definida.",
    },
    {
      evidence_item: "procedimiento downstream",
      review_guide:
        "Examinar cómo se coordinará la comunicación de cambios a los destinatarios pertinentes, identificando responsables, canales y formas previstas de conservar respaldo de las actuaciones. Contrastar el procedimiento con las obligaciones legales aplicables y con el alcance de los datos afectados, distinguiendo el envío de una comunicación de la ejecución efectiva de cambios en sistemas externos.",
      no_evidence_guidance:
        "Consultar las reglas operacionales y las responsabilidades de comunicación con terceros para determinar cómo se aplicarán las actuaciones exigibles. Si faltan instrucciones o medios, identificar las brechas sin inventar notificaciones, respuestas de destinatarios ni mecanismos automáticos de borrado remoto.",
      expected_result:
        "Una ruta documentada para comunicar los cambios pertinentes a terceros cuando corresponda, con responsabilidades y mecanismos de comprobación previstos. Las dependencias externas y los resultados no verificables deben quedar explícitos sin atribuir al responsable control técnico directo sobre todos los destinatarios.",
    },
  ],
  "check-blocking": [
    {
      evidence_item: "procedimiento de supresión",
      review_guide:
        "Verificar que el procedimiento contemple la posibilidad de solicitar bloqueo temporal mientras se resuelve una supresión, y que exista una ruta de coordinación con D4.06 conforme al artículo 8 ter. Examinar las condiciones de derivación, las responsabilidades y la distinción entre la suspensión temporal de operaciones de tratamiento y la eliminación definitiva de datos.",
      no_evidence_guidance:
        "Consultar los procedimientos generales y específicos de supresión y bloqueo para reconstruir cómo se coordinarían ambas actuaciones. Si no existe una ruta definida, registrar los pasos pendientes sin asumir que cualquier solicitud de supresión genera automáticamente un bloqueo ni incorporar suspensión efectiva de tratamientos en Stage 1.",
      expected_result:
        "Un procedimiento que contemple y derive adecuadamente el bloqueo temporal cuando corresponda, sin confundirlo con la supresión definitiva. Las dependencias con D4.06 y los controles aún no definidos deben quedar identificados.",
    },
  ],
  "check-no-decisions": [
    {
      evidence_item: "escenarios controlados",
      review_guide:
        "Revisar ejemplos ficticios que permitan comprobar si el procedimiento distingue adecuadamente causales, excepciones y posibles consecuencias operacionales sin producir decisiones sobre titulares reales. Observar si la guía orienta al DPO a identificar información faltante y derivar la valoración jurídica correspondiente, evitando que respuestas de Stage 1 se interpreten como órdenes de eliminación de datos concretos.",
      no_evidence_guidance:
        "Solicitar ejemplos simulados o preparar situaciones hipotéticas sin datos personales que permitan recorrer las distintas rutas del procedimiento. Cuando no existan pruebas de separación entre diseño organizacional y tramitación real, identificar esa limitación sin generar expedientes, registros individuales ni decisiones jurídicas sobre personas.",
      expected_result:
        "Escenarios controlados que permitan evaluar la cobertura del marco causal, las excepciones y la ejecución prevista, sin administrar solicitudes reales ni adoptar conclusiones individualizadas. Las limitaciones de la guía y los casos que requieren juicio profesional posterior deben quedar explícitos.",
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

export const RIGHTS_SUPPRESSION_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.suppression_enable.v1",
  activity_key: "rights.suppression_enable",
  version: 1,
  mode: "checklist",
  execution_scope: "company",
  title: "Habilitación guiada del derecho de supresión",
  description:
    "Verifica que el procedimiento cubra las seis causales legales de supresión, sus seis familias de excepciones y las consecuencias operacionales. Evalúa el marco de decisión, sin adoptar decisiones sobre casos reales.",
  entry_node_key: "check-cause-unnecessary",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    node(
      "check-cause-unnecessary",
      "Causal: datos no necesarios",
      "¿El procedimiento contempla la causal de datos no necesarios respecto de los fines para los cuales fueron recogidos?",
      "Primera causal legal: el dato que perdió su finalidad debe poder suprimirse.",
      "rights.suppression.cause_unnecessary",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-cause-consent",
    ),
    node(
      "check-cause-consent",
      "Causal: consentimiento revocado",
      "¿El procedimiento contempla la causal de revocación del consentimiento con ausencia de otro fundamento legal?",
      "Segunda causal: revocado el consentimiento sin otra base, procede evaluar la supresión. No redefine el consentimiento de D3.",
      "rights.suppression.cause_consent_withdrawn",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-cause-unlawful",
    ),
    node(
      "check-cause-unlawful",
      "Causal: tratamiento ilícito",
      "¿El procedimiento contempla la causal de obtención o tratamiento ilícito?",
      "Tercera causal: lo ilícitamente obtenido o tratado debe poder suprimirse.",
      "rights.suppression.cause_unlawful",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-cause-outdated",
    ),
    node(
      "check-cause-outdated",
      "Causal: datos caducos",
      "¿El procedimiento contempla la causal de datos caducos?",
      "Cuarta causal: el dato caduco pierde sustento de conservación.",
      "rights.suppression.cause_outdated",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-cause-order",
    ),
    node(
      "check-cause-order",
      "Causal: mandato legal o judicial",
      "¿El procedimiento contempla la causal de cumplimiento de sentencia, resolución de autoridad u obligación legal?",
      "Quinta causal: el mandato externo obliga a suprimir.",
      "rights.suppression.cause_legal_order",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-cause-opposition",
    ),
    node(
      "check-cause-opposition",
      "Causal: oposición sin otra base",
      "¿El procedimiento contempla la causal de oposición ejercida con ausencia de otro fundamento legal?",
      "Sexta causal: la oposición exitosa sin otra base deriva en supresión.",
      "rights.suppression.cause_opposition",
      "Causal contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-expression",
    ),
    node(
      "check-exception-expression",
      "Excepción: libertad de opinión e información",
      "¿El procedimiento contempla que la supresión no procede cuando el tratamiento sea necesario para las libertades de emitir opinión e informar?",
      "Primera familia de excepciones: la supresión cede ante estas libertades.",
      "rights.suppression.exception_expression",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-contract",
    ),
    node(
      "check-exception-contract",
      "Excepción: obligación legal o contrato",
      "¿El procedimiento contempla la excepción de obligación legal o ejecución de contrato?",
      "Segunda familia: el deber legal o contractual sostiene el tratamiento.",
      "rights.suppression.exception_legal_contract",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-public",
    ),
    node(
      "check-exception-public",
      "Excepción: función pública o interés público",
      "¿El procedimiento contempla la excepción de función pública o actividad de interés público?",
      "Tercera familia: la función pública sostiene el tratamiento.",
      "rights.suppression.exception_public_function",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-health",
    ),
    node(
      "check-exception-health",
      "Excepción: salud pública",
      "¿El procedimiento contempla la excepción de interés público en salud pública conforme a las condiciones legales?",
      "Cuarta familia, con condiciones legales propias.",
      "rights.suppression.exception_public_health",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-research",
    ),
    node(
      "check-exception-research",
      "Excepción: fines históricos, estadísticos o científicos",
      "¿El procedimiento contempla la excepción de fines históricos, estadísticos o científicos e investigaciones de interés público?",
      "Quinta familia: la investigación de interés público sostiene el tratamiento.",
      "rights.suppression.exception_research",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-exception-claims",
    ),
    node(
      "check-exception-claims",
      "Excepción: reclamaciones",
      "¿El procedimiento contempla la excepción de formulación, ejercicio o defensa de reclamación administrativa o judicial?",
      "Sexta familia: la defensa de reclamaciones sostiene el tratamiento.",
      "rights.suppression.exception_claims",
      "Excepción contemplada en la matriz.",
      ["matriz causal/excepciones"],
      "check-request",
    ),
    node(
      "check-request",
      "Causal y antecedentes de la solicitud",
      "¿El procedimiento verifica que la solicitud identifique causal y antecedentes cuando corresponda?",
      "Sin causal identificada no hay evaluación posible.",
      "rights.suppression.request_records",
      "Verificación de causal prevista.",
      ["procedimiento de supresión", "templates"],
      "check-location",
    ),
    node(
      "check-location",
      "Localización de datos",
      "¿El procedimiento define cómo localizar los datos a suprimir?",
      "Localizar es prerrequisito de eliminar.",
      "rights.suppression.data_located",
      "Localización prevista con data mapping.",
      ["data mapping", "revisión de retention/data flows"],
      "check-deletion",
    ),
    node(
      "check-deletion",
      "Eliminación",
      "¿El procedimiento ejecuta la eliminación cuando la supresión procede?",
      "La supresión procedente debe ejecutarse, no solo declararse.",
      "rights.suppression.deletion_executed",
      "Ejecución prevista con reglas de eliminación y walkthrough.",
      ["reglas de eliminación", "walkthrough controlado"],
      "check-third-parties",
    ),
    node(
      "check-third-parties",
      "Terceros receptores",
      "¿El procedimiento identifica las comunicaciones o cesiones previas de los datos?",
      "Sin identificar receptores no hay propagación.",
      "rights.suppression.third_parties_identified",
      "Identificación de receptores prevista.",
      ["procedimiento downstream", "revisión de propagación"],
      "check-communication",
    ),
    node(
      "check-communication",
      "Comunicación de cambios",
      "¿El procedimiento comunica los cambios a terceros receptores cuando corresponda conforme al art. 11?",
      "La supresión debe alcanzar los tratamientos de terceros informados.",
      "rights.suppression.changes_communicated",
      "Comunicación prevista con templates.",
      ["templates", "procedimiento downstream"],
      "check-blocking",
    ),
    node(
      "check-blocking",
      "Bloqueo temporal",
      "¿El procedimiento integra el bloqueo temporal cuando sea solicitado durante la resolución?",
      "El bloqueo protege mientras se decide la supresión.",
      "rights.suppression.blocking_integrated",
      "Integración con bloqueo prevista.",
      ["procedimiento de supresión"],
      "check-no-decisions",
      ["rights.blocking_enable"],
    ),
    node(
      "check-no-decisions",
      "Sin decisiones sobre casos reales",
      "¿El procedimiento y la guía evitan adoptar decisiones sobre casos reales de supresión en Stage 1?",
      "Stage 1 diseña el marco; decidir un caso pertenece a su expediente futuro.",
      "rights.suppression.no_case_decisions",
      "Marco sin decisiones individuales verificado.",
      ["escenarios controlados"],
      "synthesis",
      ["rights.exercise_mechanism_design"],
    ),
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la supresión",
      prompt:
        "El sistema verifica el mecanismo general de D4.01 y la cobertura del marco causal y de excepciones.",
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
            "La atención de la supresión solo está completa sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un punto del marco de supresión requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas en causales, excepciones o consecuencias operacionales.",
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
          rule_id: "suppression-complete",
          description:
            "Mecanismo diseñado con marco causal y de excepciones cubierto.",
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
          goto_outcome_key: "suppression_enabled",
          explanation:
            "El procedimiento puede evaluar causales, aplicar excepciones y ejecutar efectos de supresión.",
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
      outcome_key: "suppression_enabled",
      label: "Atención de la supresión habilitada",
      classification: "agency_standard",
      explanation:
        "La empresa dispone de matriz causal y de excepciones más procedimiento operacional. Esto valida el marco, sin decidir casos individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.suppression_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz causal/excepciones, el procedimiento de supresión, el data mapping, las reglas de eliminación, el procedimiento downstream, los templates y el walkthrough controlado.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "La atención de la supresión solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
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
      label: "Requiere correcciones de supresión",
      classification: "agency_standard",
      explanation:
        "Al menos un punto del marco requiere corrección. Completa causales, excepciones o efectos operacionales.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada punto pendiente y vuelve a verificar el marco de supresión.",
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
