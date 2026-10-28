import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.10.
 *
 * activity_key = precontractual_data.cleanup (decision, treatment
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos operativos, evidencia, dependencias y state
 * effect del contenido canónico D2.10. Sin criterios inventados de
 * eliminación, conservación, compatibilidad o licitud: la conclusión
 * la adopta explícitamente el profesional junto a un ReasoningRecord
 * treatment-scoped válido.
 *
 * Unidad jurídica: el tratamiento actual que obtuvo datos para medidas
 * precontractuales ("Determinar si el tratamiento actual continúa
 * apoyándose únicamente en esa situación precontractual"). El eventual
 * tratamiento posterior NO es un segundo objeto de ejecución: es una
 * referencia (treatmentId) registrada expresamente cuando existe, como
 * fact treatment-scoped del tratamiento que ejecuta. Sin grafo, sin
 * workflow, sin nueva entidad.
 *
 * Arquitectura espejo de D2.06: nodos de consideración registran si
 * cada factor canónico fue considerado con respaldo; la compuerta de
 * suficiencia solo decide si existe base mínima para concluir; la
 * conclusión la adopta el profesional. Los outcomes determinísticos
 * (sin datos precontractuales, evaluación incompleta, referencia
 * pendiente) no llevan efectos ni razonamiento, igual que en D2.06.
 */

const TRIGGER_FACT = "precontractual.precontractual_data";

const DECISION_FACTS = [
  TRIGGER_FACT,
  "precontractual.scope_reviewed",
  "precontractual.action_evidenced",
  "precontractual.posterior_treatment",
];

const DRAFT_FACT = "precontractual.working_conclusion";

/** Referencia al tratamiento posterior: id de tratamiento o ausencia explícita. */
const NO_POSTERIOR = "no_posterior";

function considered(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function notConsidered(fact_key: string): FactCondition {
  return { op: "not", condition: considered(fact_key) };
}

function considerationOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Considerado con respaldo",
      description: "El factor fue considerado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No considerado",
      description: "El factor aún no ha sido considerado.",
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

export const PRECONTRACTUAL_DATA_CLEANUP_PROTOCOL: ExecutionProtocol = {
  protocol_key: "precontractual_data.cleanup.v1",
  activity_key: "precontractual_data.cleanup",
  version: 1,
  mode: "decision",
  execution_scope: "treatment",
  title: "Depuración guiada de datos precontractuales",
  description:
    "Estructura la revisión de datos obtenidos para medidas precontractuales en el tratamiento activo: identifica la situación, verifica la acción realizada, registra el tratamiento posterior cuando existe y documenta la conclusión profesional con su razonamiento.",
  entry_node_key: "trigger",
  decision_fact_keys: DECISION_FACTS,
  last_review: "2026-09-23",
  provenance: "legal_requirement",
  nodes: [
    {
      node_key: "trigger",
      node_type: "question",
      title: "Situación activadora",
      prompt:
        "¿Se obtuvieron datos específicamente para ejecutar medidas precontractuales solicitadas por el titular?",
      why_it_matters:
        "Sin datos precontractuales no existe obligación de depuración que revisar.",
      fact_key: TRIGGER_FACT,
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí, existen datos precontractuales",
          description: "Se obtuvieron datos para medidas precontractuales solicitadas.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "No existen datos precontractuales",
          description: "La revisión acredita que no se obtuvieron tales datos.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "Aún no es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "formularios de captación",
        "procesos comerciales",
        "contratos",
      ],
      evidence_review_help: [
        {
          evidence_item: "formularios de captación",
          review_guide:
            "Revisar qué información se solicitó y para qué gestión concreta, comprobando si el formulario respondía a una actuación precontractual iniciada por el titular. Diferenciar los datos necesarios para preparar una contratación de aquellos recopilados para publicidad, contacto general u otras finalidades, sin clasificar toda captación comercial como precontractual.",
          no_evidence_guidance:
            "Consultar versiones de formularios, registros de solicitudes y antecedentes de canales de atención para reconstruir la finalidad de la recopilación. Si no puede comprobarse quién solicitó la gestión o qué datos se obtuvieron, registrar la incertidumbre sin atribuir una situación precontractual no acreditada.",
          expected_result:
            "Datos recopilados y vinculados con gestiones precontractuales identificables, diferenciados de información obtenida para otras finalidades. Las solicitudes y circunstancias no comprobadas deben quedar señaladas, permitiendo establecer si existe el supuesto que requiere revisión posterior.",
        },
        {
          evidence_item: "procesos comerciales",
          review_guide:
            "Comprobar en qué etapas se obtienen datos para preparar propuestas, evaluaciones o gestiones previas a contratar, identificando la solicitud que dio origen a cada actuación. Distinguir esas actividades de campañas comerciales no solicitadas y operaciones contractuales posteriores, considerando los usos reales de la información.",
          no_evidence_guidance:
            "Consultar procedimientos, registros de atención y antecedentes de las áreas comerciales para identificar las gestiones realizadas. Si los procesos no permiten reconocer el origen de una solicitud, documentar los casos pendientes sin presumir que todo contacto de un potencial cliente activa esta obligación específica.",
          expected_result:
            "Gestiones comerciales caracterizadas según su origen y propósito, con identificación de aquellas solicitadas por titulares que implicaron obtener datos personales. Las actividades ajenas al supuesto precontractual y las situaciones inciertas deben quedar diferenciadas.",
        },
        {
          evidence_item: "contratos",
          review_guide:
            "Verificar si los antecedentes contractuales permiten relacionar la información recopilada con negociaciones o solicitudes previas realizadas por el titular. Identificar los datos obtenidos antes de contratar y distinguirlos de aquellos recabados durante la ejecución contractual, sin considerar que la firma posterior del contrato demuestra por sí sola el origen precontractual de todos los datos.",
          no_evidence_guidance:
            "Consultar solicitudes, propuestas, expedientes y documentación contractual disponible para reconstruir la secuencia de obtención de datos. Cuando no existan antecedentes suficientes, registrar las relaciones pendientes de comprobación sin asumir que hubo contrato ni que toda negociación constituyó una medida solicitada.",
          expected_result:
            "Antecedentes que permitan reconocer los datos obtenidos para actuaciones precontractuales solicitadas, con su relación contractual posterior cuando exista. Las diferencias de origen y las incertidumbres deben quedar documentadas, sin anticipar decisiones sobre conservación o depuración.",
        },
      ],
      required_facts: [],
      transitions: [
        {
          rule_id: "trigger-present",
          description: "Existen datos precontractuales por revisar.",
          when: considered(TRIGGER_FACT),
          goto_node_key: "scope-review",
          explanation:
            "La revisión de depuración procede sobre los datos identificados.",
        },
        {
          rule_id: "trigger-absent",
          description: "La revisión acredita ausencia de datos precontractuales.",
          when: {
            op: "fact_equals",
            fact_key: TRIGGER_FACT,
            value: "no",
          },
          goto_outcome_key: "cleanup_not_required",
          explanation:
            "Sin datos obtenidos para medidas precontractuales no hay depuración pendiente.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Sin determinar la situación no es posible avanzar.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Primero debe determinarse si existen datos precontractuales.",
        },
      ],
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "legal_requirement",
    },
    {
      node_key: "scope-review",
      node_type: "question",
      title: "Identificación de datos precontractuales",
      prompt:
        "¿Se identificaron los datos obtenidos específicamente para esas medidas, con respaldo revisable?",
      why_it_matters:
        "Sin identificar los datos no es posible depurarlos ni vincularlos a un tratamiento posterior.",
      fact_key: "precontractual.scope_reviewed",
      answer_type: "yes_no_unknown",
      options: considerationOptions("precontractual.scope_reviewed"),
      evidence_to_review: [
        "identificación de datos precontractuales",
        "revisión de formularios y sistemas",
        "muestreo",
      ],
      evidence_review_help: [
        {
          evidence_item: "identificación de datos precontractuales",
          review_guide:
            "Comprobar qué categorías y campos fueron obtenidos para atender solicitudes precontractuales concretas, relacionándolos con la gestión que motivó su recopilación. Verificar su origen, finalidad y ubicación conocida, diferenciándolos de información obtenida para publicidad, relaciones contractuales u otras actividades independientes.",
          no_evidence_guidance:
            "Consultar inventarios, solicitudes y antecedentes de los procesos involucrados para reconstruir los datos efectivamente recopilados. Si existen conjuntos sin origen o finalidad comprobable, registrar las incertidumbres y verificaciones pendientes, sin clasificarlos automáticamente como precontractuales.",
          expected_result:
            "Conjuntos de datos identificados y vinculados con medidas precontractuales solicitadas, con su origen y ubicación reconocibles. Las categorías ajenas al supuesto y las situaciones pendientes deben quedar diferenciadas para delimitar la revisión posterior.",
        },
        {
          evidence_item: "revisión de formularios y sistemas",
          review_guide:
            "Comparar los campos solicitados en formularios con la información almacenada en los sistemas utilizados durante la gestión precontractual. Identificar registros, copias o transferencias internas pertinentes, comprobando si existen diferencias entre lo originalmente recopilado y lo que permanece disponible.",
          no_evidence_guidance:
            "Consultar versiones de formularios, configuraciones, registros técnicos y áreas administradoras para localizar los datos obtenidos. Si no puede establecerse su recorrido completo, documentar los sistemas revisados y las ubicaciones pendientes, sin presumir que un dato desapareció por no figurar en la interfaz principal.",
          expected_result:
            "Correspondencia verificable entre los campos recopilados y los datos localizados en los sistemas pertinentes, con diferencias y ubicaciones no comprobadas identificadas. El alcance de la revisión debe quedar claro, sin atribuir supresiones o continuidades todavía no evaluadas.",
        },
        {
          evidence_item: "muestreo",
          review_guide:
            "Revisar una selección razonada de solicitudes y registros para comprobar qué información se obtuvo realmente y si corresponde a medidas precontractuales iniciadas por el titular. Considerar distintas etapas o canales relevantes, señalando discrepancias y límites de la selección utilizada, sin generalizar sus resultados a todos los registros.",
          no_evidence_guidance:
            "Consultar expedientes, registros de solicitudes y controles disponibles para localizar comprobaciones previas o seleccionar casos pertinentes. Si faltan antecedentes suficientes, indicar las áreas no verificadas y las revisiones pendientes, sin presentar una muestra inexistente como realizada ni imponer un método estadístico universal.",
          expected_result:
            "Resultados documentados de los casos comprobados, con criterios de selección, datos identificados y diferencias observadas. Las limitaciones deben quedar reconocidas para sustentar el alcance de la identificación, sin considerar una muestra parcial como cobertura completa.",
        },
      ],
      required_facts: [TRIGGER_FACT],
      default_next_node_key: "action-evidence",
      provenance: "legal_requirement",
    },
    {
      node_key: "action-evidence",
      node_type: "question",
      title: "Evidencia de la acción realizada",
      prompt:
        "¿Existe evidencia revisable de la acción realizada: supresión o anonimización de lo que permanece solo bajo el supuesto precontractual, o vinculación documentada a un tratamiento posterior?",
      why_it_matters:
        "La depuración exige acreditar qué se hizo con los datos: eliminar, anonimizar o vincular con justificación propia.",
      fact_key: "precontractual.action_evidenced",
      answer_type: "yes_no_unknown",
      options: considerationOptions("precontractual.action_evidenced"),
      evidence_to_review: [
        "evidencia de supresión o anonimización",
        "evaluación de continuidad del tratamiento",
        "nueva base documentada cuando exista un tratamiento posterior independiente",
      ],
      evidence_review_help: [
        {
          evidence_item: "evidencia de supresión o anonimización",
          review_guide:
            "Corroborar qué conjuntos de datos fueron eliminados o anonimizados, mediante registros de ejecución, comprobaciones técnicas u otros respaldos disponibles. Verificar que las actuaciones correspondan a la información cuya conservación dejó de justificarse por la gestión precontractual, distinguiendo anonimización irreversible de seudonimización y medidas ejecutadas de acciones pendientes.",
          no_evidence_guidance:
            "Consultar registros de sistemas, procedimientos y antecedentes de las áreas responsables para localizar constancias de depuración. Si no se acredita la ejecución, identificar los datos afectados y las actuaciones pendientes, sin presumir que su ausencia en una interfaz demuestra eliminación ni atribuir anonimización a transformaciones reversibles.",
          expected_result:
            "Actuaciones de supresión o anonimización respaldadas, con datos afectados, alcance y limitaciones identificables. Las medidas pendientes y los conjuntos sujetos a otra justificación deben quedar diferenciados, sin considerar acreditada una depuración que no pudo comprobarse.",
        },
        {
          evidence_item: "evaluación de continuidad del tratamiento",
          review_guide:
            "Determinar si la gestión solicitada continúa, concluyó o dio lugar a operaciones con una finalidad distinta, considerando las circunstancias y fechas relevantes. Comprobar qué datos siguen utilizándose, por qué motivo y si existe una justificación independiente, sin asumir que la relación comercial permite conservar indefinidamente la información recopilada.",
          no_evidence_guidance:
            "Consultar expedientes, antecedentes comerciales y registros de los tratamientos para reconstruir el estado de la gestión y los usos posteriores. Cuando no pueda acreditarse la continuidad o su fundamento, registrar las incertidumbres y comprobaciones pendientes, sin inventar una finalidad alternativa para evitar la depuración.",
          expected_result:
            "Una evaluación trazable del estado de la gestión precontractual y del destino previsto o aplicado a sus datos, distinguiendo información que requiere depuración de operaciones posteriores cuya licitud debe sustentarse separadamente. Las situaciones no resueltas deben quedar identificadas.",
        },
        {
          evidence_item: "nueva base documentada cuando exista un tratamiento posterior independiente",
          review_guide:
            "Verificar que el tratamiento posterior identificado tenga una finalidad específica y una fuente de licitud respaldada por hechos comprobables. Revisar qué datos comprende, su necesidad y la relación con la gestión original, diferenciando una justificación jurídica efectiva del simple cambio de clasificación en el inventario.",
          no_evidence_guidance:
            "Consultar el inventario de tratamientos, las finalidades declaradas y los antecedentes de licitud para localizar el fundamento posterior. Si existe una operación sin respaldo suficiente, registrar lo pendiente sin atribuirle una base no acreditada. Cuando no haya tratamiento posterior independiente, dejar constancia de esa circunstancia sin exigir una nueva base ficticia.",
          expected_result:
            "Un tratamiento posterior identificable, con finalidad, datos comprendidos y fundamento jurídico revisable, cuando efectivamente exista. Las justificaciones insuficientes y la ausencia acreditada de tratamiento posterior deben quedar diferenciadas, sin anticipar la decisión profesional definitiva.",
        },
      ],
      required_facts: [TRIGGER_FACT, "precontractual.scope_reviewed"],
      default_next_node_key: "posterior-select",
      provenance: "legal_requirement",
    },
    {
      node_key: "posterior-select",
      node_type: "question",
      title: "Tratamiento posterior",
      prompt:
        "Si existe un tratamiento posterior con finalidad y fuente de licitud diferente, selecciónalo para registrarlo expresamente. Si no existe, indícalo.",
      why_it_matters:
        "El canon exige distinguir el supuesto precontractual de un eventual tratamiento posterior con justificación propia.",
      fact_key: "precontractual.posterior_treatment",
      answer_type: "single_select",
      options: [
        {
          value: NO_POSTERIOR,
          label: "Sin tratamiento posterior",
          description:
            "No existe un tratamiento posterior con finalidad y fuente de licitud diferente.",
          fact_effect: {
            fact_key: "precontractual.posterior_treatment",
            value: NO_POSTERIOR,
          },
        },
      ],
      options_source: "same_company_treatments",
      evidence_to_review: ["nueva base documentada del tratamiento posterior"],
      evidence_review_help: [
        {
          evidence_item: "nueva base documentada del tratamiento posterior",
          review_guide:
            "Verificar que la operación posterior identificada tenga una finalidad específica, una fuente de licitud fundamentada y una relación comprobable con los datos previamente obtenidos. Comprobar que el tratamiento seleccionado corresponda al registro existente y que su justificación comprenda los datos utilizados, sin considerar suficiente una reclasificación administrativa.",
          no_evidence_guidance:
            "Consultar el inventario, las finalidades y los antecedentes jurídicos para localizar el tratamiento correspondiente. Si existe una operación posterior sin justificación acreditada, registrar las cuestiones pendientes antes de respaldar su continuidad. Cuando no exista un tratamiento independiente, dejar constancia de ello y utilizar la opción «Sin tratamiento posterior», sin crear registros ficticios.",
          expected_result:
            "Una referencia identificable al tratamiento posterior existente, con finalidad y fuente de licitud respaldadas, o una constatación fundada de su inexistencia. Las dudas sobre el alcance de los datos o la suficiencia jurídica deben quedar reconocidas, sin anticipar la conclusión profesional sobre la depuración.",
        },
      ],
      required_facts: [
        TRIGGER_FACT,
        "precontractual.scope_reviewed",
        "precontractual.action_evidenced",
      ],
      default_next_node_key: "sufficiency-gate",
      related_activity_keys: ["lawful_basis.assign", "retention.schedule"],
      provenance: "legal_requirement",
    },
    {
      node_key: "sufficiency-gate",
      node_type: "decision",
      title: "Suficiencia de la revisión",
      prompt:
        "El sistema verifica si la revisión está completa y el tratamiento posterior determinado.",
      answer_type: "none",
      required_facts: [...DECISION_FACTS],
      transitions: [
        {
          rule_id: "factors-pending",
          description:
            "Algún factor no fue considerado, está sin responder o sin información.",
          when: {
            op: "any",
            conditions: [
              notConsidered(TRIGGER_FACT),
              notConsidered("precontractual.scope_reviewed"),
              notConsidered("precontractual.action_evidenced"),
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan antecedentes por considerar. Sin la revisión completa no se habilita la conclusión profesional.",
        },
        {
          rule_id: "ready-for-conclusion",
          description:
            "La revisión está completa y el tratamiento posterior determinado.",
          when: { op: "all", conditions: [] },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Existe base mínima para que el profesional adopte una conclusión documentada.",
        },
      ],
      provenance: "legal_requirement",
    },
    {
      node_key: "adopt-conclusion",
      node_type: "question",
      title: "Adopción de la conclusión",
      prompt:
        "¿Cuál conclusión profesional adoptas sobre la depuración de los datos precontractuales de este tratamiento?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: el sistema solo verificó que existe base suficiente para concluir.",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "cleanup_completed",
          label: "Depuración completada",
          description:
            "Juicio profesional: los datos que permanecían solo bajo el supuesto precontractual fueron suprimidos o anonimizados según corresponde.",
          fact_effect: { fact_key: DRAFT_FACT, value: "cleanup_completed" },
        },
        {
          value: "linked_posterior",
          label: "Vinculado a tratamiento posterior",
          description:
            "Juicio profesional: los datos se preservan bajo un tratamiento posterior con finalidad y fuente de licitud diferente, registrado expresamente.",
          fact_effect: { fact_key: DRAFT_FACT, value: "linked_posterior" },
        },
      ],
      evidence_to_review: ["Registro de Depuración de Datos Precontractuales"],
      evidence_review_help: [
        {
          evidence_item: "Registro de Depuración de Datos Precontractuales",
          review_guide:
            "Valorar conjuntamente los datos identificados, el estado de la gestión precontractual y los antecedentes sobre su destino. Comprobar si la supresión o anonimización quedó acreditada, o si existe un tratamiento posterior con finalidad y licitud propias que justifique utilizar determinados datos. Verificar que la conclusión elegida refleje las actuaciones comprobadas, sus límites y el razonamiento profesional, sin considerar suficiente la sola completitud de la revisión.",
          no_evidence_guidance:
            "Recuperar los resultados de las etapas anteriores, los respaldos de depuración y la documentación del eventual tratamiento posterior. Si existen actuaciones sin acreditar, datos sin destino claro o fundamentos insuficientes, identificar las verificaciones pendientes antes de concluir. No declarar una depuración completada ni atribuir licitud a un tratamiento posterior únicamente porque el sistema permite avanzar.",
          expected_result:
            "Una conclusión profesional fundamentada y trazable que determine si la depuración fue completada o si los datos se vinculan a un tratamiento posterior debidamente justificado. El registro debe precisar las actuaciones y antecedentes considerados, reconocer posibles limitaciones y explicar la alternativa adoptada, sin sustituir el juicio jurídico por una validación automática.",
        },
      ],
      help_text: [
        "Selecciona la alternativa y documenta tu razonamiento a continuación. La conclusión solo queda registrada al adoptar con razonamiento válido.",
      ],
      required_facts: [...DECISION_FACTS],
    },
  ],
  outcomes: [
    {
      outcome_key: "assessment_incomplete",
      label: "Revisión incompleta",
      classification: "legal_requirement",
      explanation:
        "Existen antecedentes pendientes o con información insuficiente. Esto no es una conclusión sobre la depuración.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar revisión",
        },
      ],
    },
    {
      outcome_key: "cleanup_not_required",
      label: "Sin depuración requerida",
      classification: "legal_requirement",
      explanation:
        "La revisión acredita que no se obtuvieron datos para medidas precontractuales: no hay depuración pendiente.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la revisión",
          note: "Archiva la revisión que acredita la ausencia de datos precontractuales. Si existen reglas de conservación, verifica coherencia en D2.08.",
        },
        {
          kind: "activity",
          label: "Revisar conservación en D2.08",
          activity_key: "retention.schedule",
        },
      ],
    },
    {
      outcome_key: "cleanup_completed",
      label: "Depuración completada",
      classification: "legal_requirement",
      explanation:
        "Juicio profesional documentado: la depuración de los datos precontractuales fue completada.",
      provenance: "legal_requirement",
      canonical_fact_effects: [
        { fact_key: "treatment.precontractual_cleanup_status", value: "completed" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el registro",
          note: "Archiva el Registro de Depuración de Datos Precontractuales con la evidencia de supresión o anonimización. Si existen reglas de conservación, verifica coherencia en D2.08.",
        },
        {
          kind: "activity",
          label: "Revisar conservación en D2.08",
          activity_key: "retention.schedule",
        },
      ],
    },
    {
      outcome_key: "linked_posterior",
      label: "Vinculado a tratamiento posterior",
      classification: "legal_requirement",
      explanation:
        "Juicio profesional documentado: los datos se preservan bajo un tratamiento posterior con justificación propia, registrado expresamente.",
      provenance: "legal_requirement",
      canonical_fact_effects: [
        { fact_key: "treatment.precontractual_cleanup_status", value: "completed" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Distinguir la base del tratamiento posterior en D2.05",
          activity_key: "lawful_basis.assign",
        },
        {
          kind: "info",
          label: "Conservar el registro",
          note: "Archiva el Registro de Depuración con la referencia expresa al tratamiento posterior y su nueva base documentada.",
        },
      ],
    },
  ],
  reasoning_requirements: {
    required_fields: [
      "conclusion",
      "legal_question",
      "facts_considered",
      "legal_factors",
      "alternatives_considered",
      "rationale",
      "decided_by",
      "decided_at",
      "legal_basis",
    ],
  },
};
