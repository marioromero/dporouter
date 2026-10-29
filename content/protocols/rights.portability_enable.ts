import type { ExecutionProtocol, EvidenceReviewHelp, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.07.
 *
 * activity_key = rights.portability_enable (checklist, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente elegibilidad, pasos, evidencia, dependencias y
 * state effect del contenido canónico D4.07.
 *
 * La elegibilidad (tratamiento automatizado Y base de
 * consentimiento, sobre datos facilitados por el titular) se
 * verifica como capacidad de evaluar, sin materializar ni
 * modificar facts de D2/D3: si existen se consumen como contexto,
 * si no, la empresa igualmente evalúa documentalmente. La
 * transmisión directa es condicional a posibilidad técnica: no se
 * impone interoperabilidad absoluta. Portabilidad no implica
 * supresión salvo solicitud conjunta.
 *
 * Dependencia de completitud hacia D4.01 vía fact externo
 * `rights.exercise_mechanism_status`. Metodología `agency_standard`.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.portability.eligibility_automated",
  "rights.portability.eligibility_consent",
  "rights.portability.provided_data",
  "rights.portability.structured_format",
  "rights.portability.interoperable",
  "rights.portability.transfer_to_controller",
  "rights.portability.expedient_means",
  "rights.portability.no_obstacles",
  "rights.portability.clear_instructions",
  "rights.portability.technical_characteristics",
  "rights.portability.direct_transmission",
  "rights.portability.no_auto_deletion",
  "rights.portability.gratuity_coordinated",
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

function conditionalOptions(factKey: string, naHint: string) {
  return [
    {
      value: "yes",
      label: "Revisado y satisfactorio",
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
  "check-eligibility-automated": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Comprobar que el procedimiento contemple la evaluación de si las operaciones correspondientes se realizan de forma automatizada, como primer requisito legal de elegibilidad de la portabilidad. Contrastar los criterios con los sistemas y tratamientos documentados, distinguiendo el procesamiento automatizado de una operación exclusivamente manual y evitando considerar suficiente la mera existencia de computadores o archivos digitales.",
      no_evidence_guidance:
        "Consultar a privacidad, TI y responsables de los tratamientos para identificar cómo se ejecutan las operaciones pertinentes y qué antecedentes permiten clasificarlas. Si no existe una pauta de evaluación, registrar los criterios pendientes sin presumir que todo almacenamiento electrónico acredita automatización ni concluir sobre tratamientos individuales no examinados.",
      expected_result:
        "Un procedimiento que permita determinar con respaldo suficiente si el tratamiento correspondiente es automatizado, con fuentes, criterios y responsables identificados. Las modalidades no verificadas deben quedar expresamente señaladas, sin alterar las definiciones canónicas de tratamientos de D2.",
    },
  ],
  "check-eligibility-consent": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Examinar cómo el procedimiento verifica que el tratamiento automatizado se basa en el consentimiento del titular, utilizando las decisiones jurídicas documentadas en D2 y los antecedentes de gestión de consentimiento de D3 cuando existan. Comprobar que se evalúe la base correspondiente a la operación concreta y que no se confunda la existencia de un consentimiento general con la fundamentación de cualquier tratamiento.",
      no_evidence_guidance:
        "Recabar las matrices de bases de licitud y la documentación disponible sobre consentimiento para reconstruir la relación con los tratamientos pertinentes. Si la base no está determinada o los antecedentes son contradictorios, registrar la incertidumbre sin asignar nuevas bases legales ni modificar hechos o conclusiones de D2 y D3.",
      expected_result:
        "Un criterio procedimental que permita comprobar el requisito de consentimiento aplicable al tratamiento automatizado correspondiente, mediante antecedentes jurídicos trazables. Las bases no verificadas y discrepancias documentales deben quedar reconocidas sin concluir automáticamente que toda operación automatizada es portable.",
    },
  ],
  "check-provided-data": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Verificar que las instrucciones permitan delimitar los datos personales concernientes al titular que este haya facilitado al responsable, relacionándolos con sus fuentes de incorporación y los tratamientos correspondientes. Examinar cómo se diferenciarían de datos de terceros u otra información que no pueda considerarse comprendida en el derecho, sin aplicar exclusiones automáticas a categorías que requieran análisis jurídico.",
      no_evidence_guidance:
        "Consultar los inventarios y flujos de incorporación de datos para identificar la procedencia de la información y su relación con el titular. Si no existe trazabilidad suficiente, señalar los repositorios y criterios pendientes de comprobación sin asumir que toda información conservada acerca de una persona fue facilitada por ella.",
      expected_result:
        "Un procedimiento capaz de identificar los datos comprendidos por el derecho de portabilidad y delimitar su extracción con sustento documental. Las categorías cuya procedencia o elegibilidad no esté acreditada deben quedar reconocidas, sin construir exportaciones reales de información personal.",
    },
  ],
  "check-format": [
    {
      evidence_item: "formato de exportación",
      review_guide:
        "Examinar el formato de exportación previsto para comprobar si permite entregar una copia electrónica estructurada, genérica y de uso común, con organización suficiente para distinguir datos y campos relevantes. Contrastar el formato con los datos que podrían ser portables y verificar que su utilización no dependa injustificadamente de una aplicación propietaria o interpretación exclusiva del responsable.",
      no_evidence_guidance:
        "Solicitar ejemplos ficticios o definiciones de formatos utilizados para exportar información y consultar las herramientas disponibles para producirlos. Si el formato no está establecido, identificar los requisitos funcionales pendientes sin imponer CSV, JSON u otra tecnología particular como formato legal obligatorio.",
      expected_result:
        "Un formato electrónico revisable y apropiado para representar los datos portables de manera estructurada y de uso común, con sus características y límites conocidos. Las conversiones, categorías o sistemas no cubiertos deben quedar identificados sin considerar suficiente una exportación técnica ilegible.",
    },
    {
      evidence_item: "especificación técnica",
      review_guide:
        "Revisar la documentación que describe la estructura, codificación, organización y condiciones de interpretación de los datos exportados, incluyendo campos y convenciones necesarias cuando corresponda. Comprobar que la especificación sea coherente con el formato efectivamente producido y facilite su utilización por otros sistemas, distinguiendo capacidades implementadas de funcionalidades todavía propuestas.",
      no_evidence_guidance:
        "Recabar descripciones técnicas, esquemas de datos y antecedentes de generación de archivos para reconstruir cómo podría interpretarse la copia entregada. Si falta documentación suficiente, identificar las características pendientes sin inventar esquemas o formatos que no hayan sido implementados.",
      expected_result:
        "Una especificación comprensible que describa cómo se representan los datos y permita valorar la consistencia del formato con las exigencias legales de portabilidad. Las características no definidas o no verificadas deben quedar explícitas para la evaluación técnica posterior.",
    },
  ],
  "check-interoperable": [
    {
      evidence_item: "prueba de interoperabilidad",
      review_guide:
        "Comprobar mediante una prueba controlada que el formato puede ser leído o utilizado por un sistema distinto del que lo genera, preservando el significado de los campos y la integridad de la información relevante. Examinar los resultados reales de la prueba y las transformaciones necesarias, sin exigir compatibilidad absoluta con cualquier plataforma ni considerar suficiente que el archivo pueda abrirse visualmente.",
      no_evidence_guidance:
        "Solicitar antecedentes de pruebas entre herramientas o sistemas distintos, o diseñar una simulación con datos ficticios representativos. Si la interoperabilidad no ha sido ensayada, registrar los componentes y condiciones pendientes sin afirmar que el uso de un formato conocido garantiza automáticamente compatibilidad funcional.",
      expected_result:
        "Evidencia revisable de que la copia puede utilizarse mediante sistemas diferentes dentro del alcance probado, con limitaciones y transformaciones documentadas. Las integraciones no verificadas deben quedar reconocidas sin convertir la prueba en una exigencia de compatibilidad universal.",
    },
    {
      evidence_item: "export test",
      review_guide:
        "Examinar una exportación controlada y verificar que el archivo producido corresponda con los datos de entrada, preserve los campos pertinentes y pueda utilizarse conforme a sus características documentadas. Revisar pérdidas, errores de codificación, duplicidades o alteraciones de estructura, diferenciando la capacidad de generar un archivo de la comprobación de su utilidad e integridad.",
      no_evidence_guidance:
        "Solicitar pruebas de generación de archivos o antecedentes de exportaciones ficticias realizadas por los sistemas pertinentes. Si no existen resultados comprobables, identificar las etapas de generación y validación pendientes sin utilizar datos personales reales ni atribuir cobertura total a una demostración parcial.",
      expected_result:
        "Una prueba de exportación que permita verificar la generación de la copia, la correspondencia de sus datos y las características necesarias para su uso posterior. Las operaciones o categorías no ensayadas deben permanecer identificadas como limitaciones de la capacidad comprobada.",
    },
  ],
  "check-transfer": [
    {
      evidence_item: "mecanismo de transmisión",
      review_guide:
        "Examinar cómo el procedimiento contempla que los datos portables puedan comunicarse o transferirse a otro responsable, identificando los medios y las condiciones operacionales previstos. Distinguir la entrega al titular para su posterior transferencia de la transmisión directa entre responsables, evitando imponer esta última cuando no resulte técnicamente posible.",
      no_evidence_guidance:
        "Consultar los canales disponibles para entregar o comunicar copias portables y los responsables de autorizar y ejecutar cada operación. Si faltan mecanismos definidos, señalar las dependencias técnicas y procedimentales sin inventar integraciones con entidades externas ni transferencias ya realizadas.",
      expected_result:
        "Un mecanismo documentado que permita ejercer la portabilidad hacia otro responsable mediante medios adecuados, con responsabilidades y condiciones técnicas identificadas. Deben distinguirse las modalidades disponibles, sus limitaciones y aquellas que requieren comprobación adicional.",
    },
    {
      evidence_item: "walkthrough",
      review_guide:
        "Recorrer un escenario ficticio en que se prepara una copia portable y se utiliza el mecanismo previsto para comunicarla o transferirla, verificando los pasos y controles relevantes. Observar si las instrucciones y medios permiten completar el recorrido previsto sin obstáculos innecesarios, separando la simulación de cualquier transferencia real de datos personales.",
      no_evidence_guidance:
        "Solicitar una demostración controlada de los pasos de preparación y transmisión, utilizando destinatarios y datos ficticios cuando corresponda. Si el recorrido no puede realizarse, identificar las etapas pendientes y sus responsables sin presentar una descripción verbal como prueba funcional suficiente.",
      expected_result:
        "Un recorrido revisable de la capacidad de comunicación o transferencia, con operaciones observadas, controles y límites de ejecución documentados. Las integraciones externas no demostradas deben distinguirse de las capacidades efectivamente verificadas.",
    },
  ],
  "check-expedient": [
    {
      evidence_item: "mecanismo de transmisión",
      review_guide:
        "Verificar que los medios previstos para ejercer la portabilidad sean expeditos y menos onerosos, examinando la cantidad de pasos, dependencias operativas y dificultades técnicas para obtener o transmitir los datos. Contrastar estas condiciones con alternativas razonablemente disponibles, sin inventar umbrales de tiempo o costo que la ley no haya establecido ni equiparar automáticamente menor costo con ausencia de controles necesarios.",
      no_evidence_guidance:
        "Consultar las rutas de entrega, requisitos operativos y eventuales costos directos asociados al procedimiento para identificar posibles cargas evitables. Si no existen antecedentes suficientes para valorar la facilidad y los costos del medio, registrar las comprobaciones pendientes sin presumir cumplimiento por disponer de un canal electrónico.",
      expected_result:
        "Un mecanismo de transmisión cuyas condiciones permitan valorar su carácter expedito y menos oneroso, con pasos, responsabilidades y limitaciones documentados. Las demoras, cargas innecesarias y costos no justificados deben quedar identificados para su corrección.",
    },
  ],
  "check-obstacles": [
    {
      evidence_item: "revisión procedimental",
      review_guide:
        "Examinar los requisitos y pasos para obtener los datos portables, identificando formalidades innecesarias, restricciones de canal o exigencias técnicas que puedan dificultar injustificadamente el ejercicio del derecho. Contrastar el procedimiento con las reglas generales de D4.01 y distinguir controles de identidad y seguridad proporcionados de trabas administrativas u operativas evitables.",
      no_evidence_guidance:
        "Consultar los formularios, instrucciones y criterios de recepción y entrega de datos para reconstruir el itinerario previsto del titular. Si no existe una revisión de obstáculos, identificar los pasos que requieren análisis sin suponer que toda verificación de seguridad constituye una restricción indebida.",
      expected_result:
        "Un procedimiento revisado que permita ejercer la portabilidad sin trabas injustificadas, manteniendo controles pertinentes de identidad y protección de datos. Las barreras o incertidumbres deben quedar documentadas sin crear requisitos adicionales ni administrar solicitudes reales.",
    },
    {
      evidence_item: "walkthrough",
      review_guide:
        "Recorrer con un supuesto ficticio todas las etapas necesarias para obtener una copia portable y detectar puntos de abandono, instrucciones confusas o dependencias que imposibiliten completar el proceso. Observar especialmente si una persona puede comprender los pasos sin conocimientos técnicos extraordinarios, diferenciando una dificultad de uso real de una preferencia estética o de interfaz.",
      no_evidence_guidance:
        "Solicitar una simulación de extremo a extremo o antecedentes verificables de pruebas internas del procedimiento de portabilidad. Si no se ha recorrido el proceso completo, identificar las etapas sin validación y los obstáculos potenciales sin afirmar que el procedimiento funciona por el solo hecho de estar documentado.",
      expected_result:
        "Un recorrido controlado que permita valorar la facilidad de ejercicio y detectar obstáculos procedimentales o técnicos concretos. Las etapas no probadas y las barreras identificadas deben quedar visibles para orientar acciones correctivas posteriores.",
    },
  ],
  "check-instructions": [
    {
      evidence_item: "instrucciones al titular",
      review_guide:
        "Examinar si las instrucciones explican de manera clara y precisa cómo solicitar y obtener los datos personales portables, qué pasos debe seguir el titular y cómo utilizar el mecanismo de entrega disponible. Verificar su coherencia con las capacidades reales de la empresa y comprobar que no se presenten modalidades técnicas no habilitadas ni requisitos que dificulten injustificadamente el ejercicio del derecho.",
      no_evidence_guidance:
        "Recabar las instrucciones, comunicaciones o materiales previstos para orientar al titular y contrastarlos con el procedimiento y los sistemas disponibles. Si las indicaciones no existen o son incompletas, identificar la información y los pasos pendientes sin inventar funcionalidades publicadas ni afirmar que el titular ya cuenta con una guía accesible.",
      expected_result:
        "Instrucciones comprensibles y coherentes con los mecanismos disponibles para ejercer la portabilidad y obtener los datos, con canales y pasos identificados. Las condiciones no definidas y las limitaciones de acceso deben quedar expresamente reconocidas.",
    },
  ],
  "check-technical": [
    {
      evidence_item: "especificación técnica",
      review_guide:
        "Comprobar que la documentación técnica permita explicar las características necesarias para llevar a cabo las operaciones de obtención o transferencia de datos, incluyendo formatos, estructura y condiciones de uso cuando corresponda. Revisar que esas características sean consistentes con el mecanismo implementado y que puedan comunicarse de manera comprensible, sin exigir a los titulares capacidades técnicas especializadas como condición general del ejercicio.",
      no_evidence_guidance:
        "Solicitar las especificaciones de formato, transmisión y utilización de archivos, consultando a los responsables técnicos sobre sus condiciones reales. Si falta información sobre aspectos necesarios para usar los datos, identificar los puntos pendientes sin inventar protocolos o estándares que no se hayan adoptado.",
      expected_result:
        "Una especificación suficiente para informar las características técnicas de la portabilidad y explicar cómo utilizar los datos entregados, con consistencia verificable respecto del mecanismo disponible. Las características no comprobadas o insuficientemente descritas deben quedar explícitas.",
    },
    {
      evidence_item: "instrucciones al titular",
      review_guide:
        "Revisar que las instrucciones destinadas al titular comuniquen de forma clara los aspectos técnicos relevantes para obtener y utilizar la copia portable, evitando lenguaje innecesariamente complejo o referencias incompletas. Contrastar las indicaciones con la especificación técnica y comprobar que distingan requisitos indispensables de recomendaciones de uso o herramientas opcionales.",
      no_evidence_guidance:
        "Recabar las instrucciones vigentes o previstas y compararlas con la documentación de los mecanismos de exportación y transferencia. Si las explicaciones son insuficientes o dependen de conocimientos no proporcionados, identificar las mejoras necesarias sin convertir ejemplos de software o formatos particulares en requisitos legales.",
      expected_result:
        "Instrucciones que permitan comprender las características técnicas necesarias para ejercer la portabilidad y utilizar los datos obtenidos, coherentes con la capacidad efectivamente disponible. Las ambigüedades y dependencias tecnológicas no explicadas deben quedar señaladas.",
    },
  ],
  "check-no-deletion": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Verificar que el procedimiento reconozca expresamente que el ejercicio de la portabilidad no supone la supresión de los datos conservados por el responsable cedente, salvo que el titular la solicite conjuntamente. Examinar cómo se distinguirían ambas pretensiones y sus rutas de evaluación, evitando que exportar o transferir información active por sí solo procesos de eliminación.",
      no_evidence_guidance:
        "Consultar las instrucciones de portabilidad y supresión para comprobar cómo se separan sus efectos y cómo se trataría una solicitud conjunta. Si no existe una regla clara, identificar la brecha sin introducir eliminación automática de datos ni presumir que la transmisión extingue toda otra base de tratamiento.",
      expected_result:
        "Un procedimiento que distinga portabilidad y supresión, permita reconocer su eventual solicitud conjunta y evite eliminar datos únicamente por haberse ejercido la portabilidad. Deben quedar identificadas las responsabilidades y condiciones de coordinación con D4.04, sin ejecutar borrados individuales.",
    },
  ],
  "check-gratuity": [
    {
      evidence_item: "procedimiento",
      review_guide:
        "Contrastar las reglas de gratuidad y eventuales costos directos de la portabilidad con el mecanismo común D4.01 y el artículo 10. Examinar si el procedimiento reconoce las condiciones para exigir costos cuando el titular ejerza nuevamente el derecho dentro del trimestre, junto con las exclusiones legales pertinentes, sin establecer tarifas arbitrarias ni convertir la primera solicitud del período en un servicio oneroso.",
      no_evidence_guidance:
        "Solicitar las políticas e instrucciones de gratuidad de D4.01 y revisar su aplicación prevista a la portabilidad. Si los criterios de cobro, sus condiciones o sus fundamentos no están definidos, identificar las comprobaciones jurídicas pendientes sin inventar montos, fórmulas de cálculo o registros individuales de frecuencia.",
      expected_result:
        "Un procedimiento coherente con las condiciones legales de gratuidad y costos admisibles, coordinado con D4.01 y sin tarifas inventadas. Las decisiones no verificadas y las posibles cargas indebidas deben quedar identificadas, sin introducir mecanismos de cobro o seguimiento de solicitudes individuales en Stage 1.",
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

export const RIGHTS_PORTABILITY_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.portability_enable.v1",
  activity_key: "rights.portability_enable",
  version: 1,
  mode: "checklist",
  execution_scope: "company",
  title: "Habilitación guiada de la portabilidad",
  description:
    "Verifica la capacidad técnica y procedimental para atender la portabilidad cuando concurran sus requisitos: elegibilidad, formato interoperable, transmisión y gratuidad. Evalúa capacidad, sin exportar datos reales.",
  entry_node_key: "check-eligibility-automated",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    node(
      "check-eligibility-automated",
      "Elegibilidad: tratamiento automatizado",
      "¿El procedimiento evalúa si el tratamiento es automatizado como primer requisito de elegibilidad?",
      "La portabilidad exige tratamiento automatizado; sin él no procede.",
      "rights.portability.eligibility_automated",
      "Evaluación de automatización prevista.",
      ["procedimiento"],
      "check-eligibility-consent",
    ),
    node(
      "check-eligibility-consent",
      "Elegibilidad: base de consentimiento",
      "¿El procedimiento evalúa si el tratamiento se basa en consentimiento, consumiendo D2/D3 como contexto cuando existan y sin modificar sus verdades?",
      "Segundo requisito de elegibilidad: la base debe ser consentimiento. D4 no redefine la base de licitud.",
      "rights.portability.eligibility_consent",
      "Evaluación de base prevista sin duplicar D2/D3.",
      ["procedimiento"],
      "check-provided-data",
    ),
    node(
      "check-provided-data",
      "Datos facilitados por el titular",
      "¿El procedimiento identifica los datos personales concernientes al titular que éste haya facilitado al responsable?",
      "La portabilidad alcanza los datos facilitados por el titular, no todo el repositorio.",
      "rights.portability.provided_data",
      "Delimitación de datos prevista.",
      ["procedimiento"],
      "check-format",
    ),
    node(
      "check-format",
      "Formato estructurado",
      "¿La empresa puede generar copia en formato electrónico estructurado, genérico y de uso común?",
      "El formato debe ser estructurado y de uso común, no propietario.",
      "rights.portability.structured_format",
      "Formato de exportación verificado.",
      ["formato de exportación", "especificación técnica"],
      "check-interoperable",
    ),
    node(
      "check-interoperable",
      "Interoperabilidad",
      "¿El formato puede ser operado por distintos sistemas, verificado con prueba de interoperabilidad?",
      "Interoperable significa operable por otros sistemas, no promesa abstracta.",
      "rights.portability.interoperable",
      "Interoperabilidad probada.",
      ["prueba de interoperabilidad", "export test"],
      "check-transfer",
    ),
    node(
      "check-transfer",
      "Comunicación a otro responsable",
      "¿El procedimiento permite la comunicación o transferencia de los datos a otro responsable?",
      "El titular puede llevar sus datos a otro responsable.",
      "rights.portability.transfer_to_controller",
      "Mecanismo de transmisión previsto.",
      ["mecanismo de transmisión", "walkthrough"],
      "check-expedient",
    ),
    node(
      "check-expedient",
      "Medios expeditos y menos onerosos",
      "¿La transmisión utiliza medios expeditos y menos onerosos?",
      "La portabilidad no admite dilaciones ni encarecimientos artificiales.",
      "rights.portability.expedient_means",
      "Medios expeditos verificados.",
      ["mecanismo de transmisión"],
      "check-obstacles",
    ),
    node(
      "check-obstacles",
      "Sin trabas ni obstáculos",
      "¿El procedimiento evita imponer trabas u obstáculos a la portabilidad?",
      "Las trabas convierten el derecho en ilusorio.",
      "rights.portability.no_obstacles",
      "Ausencia de obstáculos verificada.",
      ["revisión procedimental", "walkthrough"],
      "check-instructions",
    ),
    node(
      "check-instructions",
      "Instrucciones al titular",
      "¿El procedimiento informa clara y precisamente las medidas necesarias para obtener los datos?",
      "El titular debe saber cómo obtener sus datos.",
      "rights.portability.clear_instructions",
      "Instrucciones claras previstas.",
      ["instrucciones al titular"],
      "check-technical",
    ),
    node(
      "check-technical",
      "Características técnicas",
      "¿El procedimiento informa las características técnicas de la operación?",
      "La transparencia técnica permite ejercer el derecho con conocimiento.",
      "rights.portability.technical_characteristics",
      "Información técnica prevista.",
      ["especificación técnica", "instrucciones al titular"],
      "check-direct",
    ),
    {
      node_key: "check-direct",
      node_type: "question",
      title: "Transmisión directa",
      prompt:
        "¿El procedimiento habilita la transmisión directa responsable a responsable cuando sea técnicamente posible, o no es técnicamente posible en este caso?",
      why_it_matters:
        "Condicional: la transmisión directa se exige cuando sea técnicamente posible, sin imponer interoperabilidad absoluta.",
      fact_key: "rights.portability.direct_transmission",
      answer_type: "single_select",
      options: conditionalOptions(
        "rights.portability.direct_transmission",
        "La transmisión directa no es técnicamente posible; se mantiene la entrega al titular.",
      ),
      evidence_to_review: ["análisis de transmisión directa", "mecanismo de transmisión"],
      evidence_review_help: [
        {
          evidence_item: "análisis de transmisión directa",
          review_guide:
            "Examinar el análisis que determina si los datos pueden transmitirse directamente desde el responsable de origen a otro responsable, considerando los sistemas, formatos, interfaces y restricciones técnicas pertinentes. Verificar que la posibilidad o imposibilidad técnica esté fundamentada en antecedentes concretos, sin presumir interoperabilidad universal ni usar dificultades comerciales o de conveniencia como equivalentes automáticos de imposibilidad técnica.",
          no_evidence_guidance:
            "Solicitar a TI y a los responsables de datos los antecedentes sobre compatibilidad y mecanismos disponibles para una transmisión directa. Cuando no exista análisis suficiente, registrar la incertidumbre y no seleccionar «No aplica» por mera ausencia de herramientas implementadas o documentación, sin imponer integraciones técnicas universales.",
          expected_result:
            "Un análisis revisable que sustente la viabilidad de la transmisión directa o su imposibilidad técnica en el escenario pertinente, con limitaciones y alternativas identificadas. La opción `na` solo debe respaldarse en una conclusión técnica suficientemente fundamentada y no eliminar la entrega portable al titular.",
        },
        {
          evidence_item: "mecanismo de transmisión",
          review_guide:
            "Comprobar que, cuando exista viabilidad técnica, el procedimiento prevea cómo ejecutar una transmisión directa entre responsables y qué controles permitirían realizarla de manera adecuada. Distinguir esta modalidad de la entrega al titular y verificar que, cuando no sea técnicamente posible, el mecanismo de portabilidad conserve una ruta efectiva para obtener la copia correspondiente.",
          no_evidence_guidance:
            "Consultar las funciones y canales existentes para transmitir información a otros responsables, contrastándolos con el análisis de factibilidad técnica. Si la transmisión directa no está implementada, identificar si se trata de una brecha de capacidad o de una imposibilidad técnicamente fundamentada, sin asumir automáticamente ninguna de ambas conclusiones.",
          expected_result:
            "Un mecanismo revisable para transmisión directa cuando resulte técnicamente posible, o una alternativa de entrega al titular cuando no lo sea, con condiciones y límites identificados. Debe preservarse la distinción entre capacidad implementada, viabilidad no resuelta e inaplicabilidad respaldada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-no-deletion",
      provenance: "agency_standard",
    },
    node(
      "check-no-deletion",
      "Portabilidad sin supresión automática",
      "¿El procedimiento reconoce que la portabilidad no implica supresión ante el responsable cedente salvo solicitud conjunta?",
      "Portar no es borrar: la supresión requiere su propia solicitud.",
      "rights.portability.no_auto_deletion",
      "Regla reconocida en el procedimiento.",
      ["procedimiento"],
      "check-gratuity",
    ),
    node(
      "check-gratuity",
      "Gratuidad coordinada",
      "¿Las reglas de gratuidad y costos están coordinadas con D4.01, sin inventar montos?",
      "Los costos siguen las reglas generales del mecanismo.",
      "rights.portability.gratuity_coordinated",
      "Coordinación con D4.01 verificada.",
      ["procedimiento"],
      "synthesis",
      ["rights.exercise_mechanism_design"],
    ),
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la portabilidad",
      prompt:
        "El sistema verifica el mecanismo general de D4.01, la elegibilidad y la capacidad técnica de portabilidad.",
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
            "La portabilidad solo está completa sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un punto de portabilidad requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de elegibilidad o capacidad técnica.",
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
          rule_id: "portability-complete",
          description:
            "Mecanismo diseñado con elegibilidad y capacidad técnica verificadas.",
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
          goto_outcome_key: "portability_enabled",
          explanation:
            "La empresa puede atender portabilidades elegibles con formato y transmisión adecuados.",
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
      outcome_key: "portability_enabled",
      label: "Portabilidad habilitada",
      classification: "agency_standard",
      explanation:
        "La empresa dispone de procedimiento y validación técnica de portabilidad. Esto valida la capacidad, sin exportar datos reales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.portability_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva el procedimiento, el formato de exportación, la especificación técnica, la prueba de interoperabilidad, el mecanismo de transmisión, las instrucciones al titular, el análisis de transmisión directa y el walkthrough.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "La portabilidad solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
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
      label: "Requiere correcciones de portabilidad",
      classification: "agency_standard",
      explanation:
        "Al menos un punto requiere corrección. Completa elegibilidad o capacidad técnica.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada punto pendiente y vuelve a verificar la capacidad de portabilidad.",
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
