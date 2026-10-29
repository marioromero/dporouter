import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.02.
 *
 * activity_key = rights.access_enable (checklist, company scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, dependencias y state effect del contenido
 * canónico D4.02. Verifica la capacidad para responder accesos sin
 * construir la respuesta real de ningún titular.
 *
 * Dependencia de completitud: la guía puede navegarse y revisarse
 * desde el inicio (can start), pero su conclusión definitiva
 * requiere el mecanismo general diseñado en D4.01 (can complete).
 * Se expresa consumiendo el fact externo
 * `rights.exercise_mechanism_status`: sin `designed` no hay outcome
 * definitivo. No convierte el acceso en un export técnico genérico:
 * cada categoría legal de información es un check propio.
 *
 * Metodología `agency_standard` (matriz, mapeo, walkthrough): la
 * obligación de acceso es legal; los artefactos de verificación son
 * método interno.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.access.confirmation_capacity",
  "rights.access.data_access_capacity",
  "rights.access.origin_reported",
  "rights.access.purposes_reported",
  "rights.access.recipient_categories_reported",
  "rights.access.recipient_identity_covered",
  "rights.access.retention_period_reported",
  "rights.access.legitimate_interests_covered",
  "rights.access.automated_logic_covered",
  "rights.access.denial_criteria",
  "rights.access.identification_sufficient",
  "rights.access.gratuity_coordinated",
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

export const RIGHTS_ACCESS_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.access_enable.v1",
  activity_key: "rights.access_enable",
  version: 1,
  mode: "checklist",
  execution_scope: "company",
  title: "Habilitación guiada del derecho de acceso",
  description:
    "Verifica que el responsable pueda identificar, compilar y entregar la información exigida cuando un titular ejerza su derecho de acceso. Evalúa capacidad organizacional, sin construir respuestas reales.",
  entry_node_key: "check-confirmation",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "check-confirmation",
      node_type: "question",
      title: "Confirmación del tratamiento",
      prompt:
        "¿La empresa puede confirmar si trata o no datos personales del titular que ejerce el acceso?",
      why_it_matters:
        "La confirmación es el primer contenido exigible de la respuesta de acceso.",
      fact_key: "rights.access.confirmation_capacity",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.confirmation_capacity",
        "Capacidad de confirmar el tratamiento verificada.",
      ),
      evidence_to_review: ["matriz de información a entregar", "mapeo de fuentes/repositorios"],
      evidence_review_help: [
        {
          evidence_item: "matriz de información a entregar",
          review_guide:
            "Examinar si la matriz contempla una respuesta expresa que confirme si el responsable trata datos personales del titular, diferenciando el supuesto en que existen datos del supuesto en que no se identifican tratamientos pertinentes. Revisar la relación con las fuentes consultadas y las reglas para informar un resultado sin omitir repositorios relevantes ni inferir la existencia de tratamientos no acreditados.",
          no_evidence_guidance:
            "Solicitar a privacidad y responsables de datos los criterios utilizados para confirmar la existencia o ausencia de tratamientos vinculados con una persona. Si no existe una matriz, identificar la información mínima que debe poder reunirse y los repositorios que requieren comprobación, evitando asumir que la ausencia de resultados en un sistema demuestra ausencia de tratamientos en toda la empresa.",
          expected_result:
            "Una matriz que permita preparar una respuesta de confirmación sustentada en las fuentes pertinentes, incluso cuando no existan datos identificados del titular. Las limitaciones de cobertura, responsabilidades no asignadas y búsquedas aún no verificadas deben quedar reconocidas antes de considerar habilitada la capacidad.",
        },
        {
          evidence_item: "mapeo de fuentes/repositorios",
          review_guide:
            "Verificar que el mapeo identifique los repositorios y procesos en los que podrían tratarse datos del titular, incluyendo fuentes principales y sistemas relacionados cuando corresponda. Contrastar las rutas de búsqueda con el inventario de tratamientos, distinguiendo fuentes efectivamente consultables de repositorios documentados cuya cobertura aún no esté demostrada.",
          no_evidence_guidance:
            "Recabar inventarios, diagramas y antecedentes de responsables técnicos para reconstruir las fuentes pertinentes y cómo podrían consultarse. Si existen sistemas sin identificar o métodos de búsqueda no definidos, registrar las brechas sin presumir que el repositorio principal representa todos los tratamientos de la organización.",
          expected_result:
            "Un mapa suficientemente trazable para sustentar la capacidad de confirmar tratamientos en las fuentes relevantes, con responsables y mecanismos de consulta identificados. Deben diferenciarse sistemas comprobados, integraciones previstas y fuentes cuya cobertura permanezca incierta.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-data-access",
      provenance: "agency_standard",
    },
    {
      node_key: "check-data-access",
      node_type: "question",
      title: "Acceso a los datos",
      prompt: "¿La empresa puede dar acceso a los datos tratados del titular?",
      why_it_matters:
        "El acceso efectivo a los datos es el núcleo del derecho.",
      fact_key: "rights.access.data_access_capacity",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.data_access_capacity",
        "Capacidad de dar acceso verificada con procedimiento de extracción.",
      ),
      evidence_to_review: ["procedimiento de extracción", "ejemplo controlado o walkthrough"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de extracción",
          review_guide:
            "Comprobar que el procedimiento permita identificar, recuperar y reunir los datos personales tratados que correspondan al titular, considerando los sistemas y formatos utilizados por la organización. Revisar cómo se evita mezclar información de otras personas y cómo se prepara una entrega comprensible, sin confundir la mera exportación técnica de un repositorio con el cumplimiento íntegro del artículo 5.",
          no_evidence_guidance:
            "Consultar los mecanismos disponibles de consulta y extracción, junto con los responsables de cada sistema. Si el proceso no está documentado, identificar los pasos, permisos y controles que requieren definición, sin suponer que disponer de una función de exportación asegura una entrega completa y correcta.",
          expected_result:
            "Un procedimiento revisable para reunir los datos pertinentes al ejercicio de acceso, con fuentes, controles y responsables identificados. Las limitaciones de cobertura o comprensión del resultado deben quedar explícitas, manteniendo separada la preparación de datos de la información legal adicional exigida.",
        },
        {
          evidence_item: "ejemplo controlado o walkthrough",
          review_guide:
            "Recorrer con información ficticia un supuesto de acceso que incluya localización de registros, extracción y preparación de una respuesta, observando posibles omisiones, mezclas de datos o dificultades de interpretación. Contrastar lo demostrado con el procedimiento escrito y señalar las etapas que solo estén descritas, pero no efectivamente probadas.",
          no_evidence_guidance:
            "Solicitar una demostración en un entorno adecuado o antecedentes equivalentes de pruebas controladas existentes. Si no puede ejecutarse un recorrido, identificar los pasos sin comprobación funcional y los sistemas excluidos de la prueba, sin utilizar datos personales reales de titulares.",
          expected_result:
            "Una demostración revisable de la capacidad de reunir y preparar datos para el acceso, con resultados y limitaciones documentados. La prueba debe permitir detectar brechas operacionales sin transformarse en una solicitud individual persistida dentro de Nexo DPO.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-origin",
      provenance: "agency_standard",
    },
    {
      node_key: "check-origin",
      node_type: "question",
      title: "Origen de los datos",
      prompt: "¿La empresa puede informar el origen de los datos del titular?",
      why_it_matters: "El origen es información exigible de la respuesta.",
      fact_key: "rights.access.origin_reported",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.origin_reported",
        "Fuente de origen trazable en el mapeo.",
      ),
      evidence_to_review: ["mapeo de fuentes/repositorios"],
      evidence_review_help: [
        {
          evidence_item: "mapeo de fuentes/repositorios",
          review_guide:
            "Examinar si las fuentes permiten identificar de dónde provienen los datos personales tratados, distinguiendo información obtenida directamente del titular, procedente de terceros o generada mediante procesos internos cuando corresponda. Verificar que el origen pueda asociarse con los datos pertinentes y no únicamente con una descripción genérica del sistema donde actualmente se almacenan.",
          no_evidence_guidance:
            "Consultar registros de incorporación de datos, integraciones e inventarios de origen con los responsables de cada proceso. Cuando la procedencia no sea trazable, identificar los flujos y antecedentes pendientes, sin inventar fuentes originales a partir del nombre del repositorio actual.",
          expected_result:
            "Un mapeo capaz de sustentar la información sobre el origen de los datos, con fuentes identificadas y relaciones verificables con los tratamientos pertinentes. Las procedencias desconocidas y limitaciones de trazabilidad deben quedar reconocidas para su revisión.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-purposes",
      provenance: "agency_standard",
    },
    {
      node_key: "check-purposes",
      node_type: "question",
      title: "Finalidades",
      prompt: "¿La empresa puede informar la finalidad o finalidades del tratamiento?",
      why_it_matters: "Las finalidades informadas deben corresponder al tratamiento real.",
      fact_key: "rights.access.purposes_reported",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.purposes_reported",
        "Finalidades informables verificadas.",
      ),
      evidence_to_review: ["matriz de información a entregar"],
      evidence_review_help: [
        {
          evidence_item: "matriz de información a entregar",
          review_guide:
            "Contrastar las finalidades consignadas en la matriz con las definiciones y tratamientos identificados en D2, comprobando que puedan informarse las finalidades efectivamente asociadas a los datos del titular. Revisar diferencias entre finalidades documentadas, usos reales y descripciones públicas, evitando respuestas excesivamente genéricas o finalidades no acreditadas.",
          no_evidence_guidance:
            "Recabar el inventario de tratamientos y las definiciones de finalidades disponibles, consultando las áreas responsables cuando falten correspondencias. Si la matriz no permite vincular datos y finalidades, señalar esa limitación sin crear finalidades nuevas ni modificar las decisiones canónicas de D2.",
          expected_result:
            "Una matriz que permita comunicar finalidades específicas y coherentes con los tratamientos correspondientes, con su procedencia documental identificable. Las contradicciones, ausencias o usos no suficientemente determinados deben quedar explícitos sin redefinir bases o finalidades.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-recipient-categories",
      provenance: "agency_standard",
    },
    {
      node_key: "check-recipient-categories",
      node_type: "question",
      title: "Categorías de destinatarios",
      prompt:
        "¿La empresa puede informar las categorías, clases o tipos de destinatarios?",
      why_it_matters: "Las categorías de destinatarios son contenido exigible.",
      fact_key: "rights.access.recipient_categories_reported",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.recipient_categories_reported",
        "Categorías de destinatarios identificadas.",
      ),
      evidence_to_review: ["matriz de información a entregar"],
      evidence_review_help: [
        {
          evidence_item: "matriz de información a entregar",
          review_guide:
            "Verificar que la matriz permita informar las categorías, clases o tipos de destinatarios a quienes se comunicaron o cedieron los datos, o a quienes se prevé comunicarlos. Contrastar las categorías con los flujos y relaciones documentados, diferenciando destinatarios pertinentes de proveedores o terceros que no reciben esos datos.",
          no_evidence_guidance:
            "Solicitar inventarios de destinatarios, registros de comunicaciones y antecedentes de terceros asociados a los tratamientos. Si no pueden establecerse categorías fiables, identificar las relaciones pendientes de análisis sin presentar como destinatario a cualquier empresa vinculada comercialmente con el responsable.",
          expected_result:
            "Categorías de destinatarios informables y relacionadas con las comunicaciones realizadas o previstas, sustentadas por antecedentes revisables. Deben quedar identificadas las omisiones, categorías excesivamente amplias y relaciones cuya pertinencia no esté comprobada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-recipient-identity",
      provenance: "agency_standard",
    },
    {
      node_key: "check-recipient-identity",
      node_type: "question",
      title: "Identidad de destinatarios",
      prompt:
        "¿La empresa puede informar la identidad de cada destinatario cuando el titular lo solicite?",
      why_it_matters:
        "La identidad individual se entrega a solicitud del titular, más allá de las categorías.",
      fact_key: "rights.access.recipient_identity_covered",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.recipient_identity_covered",
        "Capacidad de individualizar destinatarios verificada.",
      ),
      evidence_to_review: ["matriz de información a entregar", "template de respuesta"],
      evidence_review_help: [
        {
          evidence_item: "matriz de información a entregar",
          review_guide:
            "Comprobar que la matriz distinga entre informar categorías de destinatarios y proporcionar la identidad de cada destinatario cuando el titular lo solicite expresamente. Revisar la trazabilidad de las comunicaciones realizadas o previstas para evaluar si es posible individualizar a las entidades pertinentes sin confundirlas con categorías abstractas.",
          no_evidence_guidance:
            "Consultar los registros de destinatarios y las áreas que administran las comunicaciones o cesiones de datos. Si la información disponible solo identifica tipos de destinatario, señalar la capacidad de individualización pendiente sin inventar nombres ni presumir que una categoría satisface una solicitud expresa de identidades.",
          expected_result:
            "Una matriz y fuentes de respaldo que permitan pasar de categorías generales a destinatarios identificables cuando corresponda, considerando comunicaciones realizadas o previstas. Las relaciones no trazables y los destinatarios aún no comprobados deben quedar reconocidos.",
        },
        {
          evidence_item: "template de respuesta",
          review_guide:
            "Examinar si el modelo de respuesta contempla informar la identidad de cada destinatario cuando así lo requiera el titular y permite asociar esa información con las comunicaciones pertinentes. Verificar que el modelo no limite de manera automática todas las respuestas a categorías generales ni incluya destinatarios no respaldados.",
          no_evidence_guidance:
            "Recabar las versiones de respuesta utilizadas o previstas y consultar cómo se incorporaría la identificación individual de destinatarios. Si el modelo carece de ese supuesto, identificar la adaptación necesaria sin crear una lista ficticia de receptores.",
          expected_result:
            "Un modelo capaz de incorporar destinatarios individualizados cuando corresponda, de forma coherente con las fuentes de trazabilidad disponibles. Las exigencias de información no cubiertas deben quedar identificadas sin generar respuestas a solicitudes reales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-retention",
      provenance: "agency_standard",
    },
    {
      node_key: "check-retention",
      node_type: "question",
      title: "Período de tratamiento",
      prompt:
        "¿La empresa puede informar el período durante el cual los datos serán tratados?",
      why_it_matters: "El período de conservación forma parte de la respuesta.",
      fact_key: "rights.access.retention_period_reported",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.retention_period_reported",
        "Período informable verificado.",
      ),
      evidence_to_review: ["matriz de información a entregar"],
      evidence_review_help: [
        {
          evidence_item: "matriz de información a entregar",
          review_guide:
            "Verificar que la matriz permita informar el período durante el cual los datos serán tratados, contrastándolo con las políticas y criterios de conservación aplicables a cada finalidad. Revisar si se distinguen plazos definidos de situaciones sujetas a criterios de duración, evitando inventar fechas de eliminación o trasladar a todos los datos un plazo genérico no justificado.",
          no_evidence_guidance:
            "Consultar las decisiones de conservación documentadas en D2 y a los responsables de los sistemas pertinentes. Si los períodos no están definidos o no pueden relacionarse con los tratamientos, identificar las brechas sin establecer nuevos plazos mediante esta actividad.",
          expected_result:
            "Una matriz que permita comunicar el período de tratamiento correspondiente con respaldo suficiente y coherencia con las decisiones de conservación existentes. Las duraciones inciertas o no documentadas deben quedar visibles, sin asumir que una política genérica acredita el plazo de cada dato.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-legitimate-interests",
      provenance: "agency_standard",
    },
    {
      node_key: "check-legitimate-interests",
      node_type: "question",
      title: "Intereses legítimos",
      prompt:
        "¿La empresa puede informar los intereses legítimos cuando ésa sea la base aplicable, o no opera con esa base?",
      why_it_matters:
        "Condicional: solo exigible cuando el tratamiento se basa en interés legítimo.",
      fact_key: "rights.access.legitimate_interests_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "rights.access.legitimate_interests_covered",
        "Ningún tratamiento relevante se basa en interés legítimo.",
      ),
      evidence_to_review: ["matriz de información a entregar"],
      evidence_review_help: [
        {
          evidence_item: "matriz de información a entregar",
          review_guide:
            "Comprobar si existen tratamientos relevantes basados en el interés legítimo del artículo 13, letra d), y, cuando corresponda, si la matriz permite informar los intereses concretos del responsable. Contrastar la información con las decisiones de base de licitud de D2 y distinguir los intereses realmente evaluados de justificaciones genéricas o inventadas.",
          no_evidence_guidance:
            "Consultar el inventario de finalidades y las evaluaciones jurídicas existentes para determinar si la base de interés legítimo resulta aplicable. Si no puede verificarse su utilización o el contenido informable, registrar la incertidumbre y no seleccionar «No aplica» únicamente por falta de documentación.",
          expected_result:
            "Información trazable sobre los intereses legítimos cuando esa base sustenta tratamientos pertinentes, o una inaplicabilidad debidamente respaldada. Las evaluaciones ausentes o inconsistencias con D2 deben señalarse sin crear nuevas bases de licitud ni juicios sustantivos en D4.02.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-automated-logic",
      provenance: "agency_standard",
    },
    {
      node_key: "check-automated-logic",
      node_type: "question",
      title: "Lógica automatizada",
      prompt:
        "¿La empresa puede entregar información significativa sobre la lógica aplicada cuando exista tratamiento comprendido por el artículo 8 bis, o no existe tal tratamiento?",
      why_it_matters:
        "Condicional: solo cuando exista decisión automatizada o perfil bajo el artículo 8 bis. No redefine el alcance de D4.08.",
      fact_key: "rights.access.automated_logic_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "rights.access.automated_logic_covered",
        "No existe tratamiento comprendido por el artículo 8 bis.",
      ),
      evidence_to_review: [
        "matriz de información a entregar",
        "coordinación con D4.08 respecto de lógica automatizada cuando corresponda",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz de información a entregar",
          review_guide:
            "Examinar si la matriz contempla información significativa sobre la lógica aplicada cuando existan tratamientos comprendidos en el artículo 8 bis, con explicaciones comprensibles sobre los elementos relevantes del proceso automatizado. Distinguir esta información de una simple mención de algoritmos o tecnologías y contrastar la aplicabilidad con la evaluación de D4.08.",
          no_evidence_guidance:
            "Consultar los antecedentes de tratamientos automatizados y las evaluaciones de alcance disponibles para identificar qué explicación podría proporcionarse al titular. Si no existe información suficiente, reconocer las dependencias pendientes sin inventar lógicas, modelos o conclusiones jurídicas sobre el artículo 8 bis.",
          expected_result:
            "Una matriz que permita incluir información significativa y sustentada sobre la lógica automatizada cuando corresponda, o una inaplicabilidad justificada. Las dificultades de explicación y brechas técnicas deben quedar reconocidas sin redefinir el alcance funcional de D4.08.",
        },
        {
          evidence_item: "coordinación con D4.08 respecto de lógica automatizada cuando corresponda",
          review_guide:
            "Verificar que exista una ruta para consultar el resultado y los antecedentes pertinentes de D4.08 antes de determinar qué tratamientos requieren información sobre lógica automatizada en una respuesta de acceso. Examinar cómo se trasladará esa información a la preparación de respuestas, sin convertir D4.02 en una segunda evaluación autónoma del alcance del artículo 8 bis.",
          no_evidence_guidance:
            "Consultar la evaluación de usos automatizados y las responsabilidades definidas para comunicar sus resultados al procedimiento de acceso. Cuando esa coordinación no esté documentada, identificar las conexiones y decisiones pendientes sin presumir que todo uso de software constituye una decisión automatizada comprendida en la norma.",
          expected_result:
            "Una coordinación verificable que permita utilizar las conclusiones y antecedentes pertinentes de D4.08 para preparar información de acceso cuando sea exigible. La ausencia de usos comprendidos debe sustentarse; las incertidumbres no equivalen automáticamente a una inaplicabilidad legal.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-denial",
      related_activity_keys: ["automated_decision.scope_assess"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-denial",
      node_type: "question",
      title: "Criterio de negativa",
      prompt:
        "¿El procedimiento reconoce que la negativa de acceso solo procede cuando una ley disponga expresamente lo contrario?",
      why_it_matters:
        "La negativa es excepcional y legalmente acotada; no admite discrecionalidad.",
      fact_key: "rights.access.denial_criteria",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.denial_criteria",
        "Criterio de negativa excepcional documentado.",
      ),
      evidence_to_review: ["criterios para excepciones legales"],
      evidence_review_help: [
        {
          evidence_item: "criterios para excepciones legales",
          review_guide:
            "Examinar que las reglas internas reconozcan la obligación general de entregar información y permitir el acceso, reservando la negativa para supuestos expresamente establecidos por ley. Verificar que cualquier eventual denegación exija identificar su fundamento jurídico y que no se utilicen motivos operacionales, comerciales o de conveniencia como excepciones autónomas.",
          no_evidence_guidance:
            "Consultar los criterios jurídicos y procedimientos de denegación de acceso para identificar excepciones legales verdaderamente aplicables. Si solo existen políticas generales de confidencialidad o discrecionalidad interna, señalar la brecha sin considerarlas automáticamente una habilitación legal para negar el derecho.",
          expected_result:
            "Criterios documentados que limiten la negativa de acceso a excepciones expresamente previstas por ley y permitan fundamentar su aplicación cuando proceda. Los supuestos dudosos deben quedar identificados sin resolver casos individuales ni crear nuevas causales de denegación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-identification",
      provenance: "agency_standard",
    },
    {
      node_key: "check-identification",
      node_type: "question",
      title: "Individualización suficiente",
      prompt:
        "¿El procedimiento respeta que para el acceso basta la individualización del titular, sin requisitos adicionales?",
      why_it_matters:
        "Imponer requisitos extra al acceso vulnera su umbral procedimental propio.",
      fact_key: "rights.access.identification_sufficient",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.identification_sufficient",
        "Umbral de individualización respetado en formularios y procedimiento.",
      ),
      evidence_to_review: ["template de respuesta"],
      evidence_review_help: [
        {
          evidence_item: "template de respuesta",
          review_guide:
            "Revisar el modelo y las instrucciones asociadas para comprobar que reconocen que, tratándose del derecho de acceso, basta la individualización del titular como requisito especial de la solicitud. Contrastar el circuito con D4.01 para detectar exigencias adicionales de justificación, antecedentes o causales que puedan impedir el ejercicio, sin eliminar las comprobaciones de identidad que correspondan conforme a las reglas aplicables.",
          no_evidence_guidance:
            "Solicitar el modelo de respuesta y las instrucciones de recepción vinculadas al acceso, complementándolo con la revisión de los formularios generales cuando sea necesario. Si el template no permite conocer los requisitos exigidos al solicitar acceso, reconocer esa limitación probatoria y pedir evidencia adicional, sin presumir conformidad únicamente por revisar una respuesta.",
          expected_result:
            "Un procedimiento y modelo compatibles con el requisito especial de individualización del acceso, sin cargas adicionales improcedentes y con verificaciones de identidad jurídicamente justificadas. Debe quedar explícito cuando el template, por sí solo, sea insuficiente para demostrar cómo se recibe la solicitud.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-gratuity",
      provenance: "agency_standard",
    },
    {
      node_key: "check-gratuity",
      node_type: "question",
      title: "Gratuidad coordinada",
      prompt:
        "¿La regla de gratuidad está aplicada y cualquier costo admisible está coordinado con D4.01?",
      why_it_matters:
        "Los costos del acceso siguen las reglas generales del mecanismo, sin duplicarlas.",
      fact_key: "rights.access.gratuity_coordinated",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "rights.access.gratuity_coordinated",
        "Gratuidad y costos coordinados con el mecanismo general.",
      ),
      evidence_to_review: ["template de respuesta"],
      evidence_review_help: [
        {
          evidence_item: "template de respuesta",
          review_guide:
            "Examinar si el modelo comunica condiciones de gratuidad del derecho de acceso coherentes con el artículo 10 y con las reglas definidas en D4.01, incluida la gratuidad al menos trimestral. Cuando se contemplen solicitudes reiteradas dentro del trimestre, verificar que cualquier referencia a costos se limite a los costos directos legalmente permitidos y a las instrucciones regulatorias aplicables, sin inventar tarifas.",
          no_evidence_guidance:
            "Recabar los modelos de comunicación y las reglas generales de gratuidad y costos del mecanismo D4.01. Si el template no informa las condiciones económicas o remite a políticas no verificadas, identificar la comprobación pendiente sin interpretar automáticamente ese silencio como un cobro ni afirmar que los costos fueron correctamente definidos.",
          expected_result:
            "Un modelo de respuesta coherente con las reglas de gratuidad y eventuales costos admisibles del mecanismo general, con diferencias o limitaciones identificadas. La coordinación con D4.01 debe quedar sustentada sin introducir tarifas, cálculos de frecuencia o seguimiento de solicitudes individuales en Stage 1.",
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
      title: "Síntesis del acceso",
      prompt:
        "El sistema verifica el mecanismo general de D4.01 y el estado de cada contenido de acceso.",
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
            "La atención del acceso solo está completa sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un contenido de acceso requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de capacidad de acceso que requieren corrección.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún contenido está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan contenidos por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "access-complete",
          description:
            "Mecanismo diseñado y todos los contenidos satisfactorios o no aplicables.",
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
          goto_outcome_key: "access_enabled",
          explanation:
            "La empresa puede responder accesos con los contenidos exigidos.",
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
      outcome_key: "access_enabled",
      label: "Atención del acceso habilitada",
      classification: "agency_standard",
      explanation:
        "La empresa puede identificar, compilar y entregar la información exigida del acceso. Esto valida la capacidad, no respuestas reales ni el cumplimiento integral.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.access_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz de información, el mapeo de fuentes, el procedimiento de extracción, el template de respuesta y el walkthrough de capacidad.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "La atención del acceso solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
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
      label: "Requiere correcciones de acceso",
      classification: "agency_standard",
      explanation:
        "Al menos un contenido de acceso requiere corrección. Completa la capacidad faltante.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada contenido pendiente y vuelve a verificar la capacidad de acceso.",
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
        "Existen contenidos pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
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
