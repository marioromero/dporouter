import type { ActivityDefinition } from "../../src/types";
import { basis } from "../sources";

/**
 * CANONICAL SOURCE OF TRUTH — D4 Derechos de titulares y decisiones automatizadas.
 * Única fuente estructurada de las 9 actividades D4. Contenido aprobado
 * textualmente por la iteración vigente; no inventar, completar ni
 * reinterpretar. `docs/domains/D04.md` es una proyección humana generada
 * desde esta representación (ver `npm run content:docs`).
 * La aplicación consume estas definiciones; no las duplica.
 *
 * Frontera Stage 1 congelada:
 * - D4 diseña y valida la capacidad del responsable para recibir, tramitar
 *   y atender los derechos de los titulares y para evaluar decisiones
 *   automatizadas, pero NO administra solicitudes individuales de titulares;
 * - Stage 1 responde si la empresa tiene canales, procedimiento, criterios,
 *   plazos, evidencia y controles adecuados; Stage 2 responderá quién
 *   presentó una solicitud, cuándo ingresó, cuándo vence, qué decisión se
 *   adoptó, qué se respondió y cuál es la evidencia individual;
 * - prohibido en Stage 1: RightsRequest, DataSubject, RequestEvent,
 *   solicitud/caso individual persistente, timers vivos, dueAt, estados
 *   received→closed, timeline, historial de solicitudes, evidencia por
 *   solicitud, timestamps por titular, tickets, workflow individual;
 * - los plazos legales (respuesta general 30 días corridos, una prórroga
 *   hasta 30 días corridos, bloqueo 2 días hábiles, reclamación 30 días
 *   hábiles) pertenecen al canon como capacidad que el procedimiento debe
 *   poder cumplir; no son timers operacionales Stage 1;
 * - no almacenar identidad/datos personales de solicitantes en Stage 1.
 *
 * Regla transversal de scope (conceptual; `ActivityDefinition` no porta
 * campo scope — el scope de ejecución vive en la futura capa de protocolo):
 * - D4.01–D4.07 evalúan capacidad organizacional y procedimiento
 *   (company). NO representan una solicitud específica;
 * - D4.08–D4.09 evalúan usos automatizados dentro de un treatment
 *   (treatment). Un TreatmentContext puede contener más de un uso de
 *   decisión automatizada: cada uso relevante se revisa separadamente
 *   dentro del mismo treatment, sin cuarto scope, sin AutomatedDecisionContext,
 *   sin nueva entidad global y sin ClientActivityInstance. El mecanismo
 *   técnico de captura repetible se resolverá al diseñar los protocolos;
 *   el canon preserva la necesidad mediante pasos/evidencia/deliverable.
 *
 * Reglas conceptuales preservadas:
 * - D4 no duplica verdades de D2 (bases, finalidades), D3 (mecanismo de
 *   consentimiento, transparencia); puede consumirlas como contexto;
 * - D4.08 es source funcional para la evaluación de alcance bajo art. 8 bis;
 *   D4.09 es source funcional para el estado de salvaguardas; D3 solo
 *   verifica exposición pública/transparencia relacionada;
 * - D4.04/D4.05 diseñan el marco para resolver casos, NO adoptan
 *   conclusiones sobre solicitudes individuales (sin ReasoningRecord);
 * - ninguna actividad D4 utiliza scoring, weights o porcentajes;
 * - portabilidad no implica supresión ante el cedente salvo solicitud
 *   conjunta; no convertirla en interoperabilidad absoluta cuando la
 *   transmisión directa no sea técnicamente posible.
 */

const REVIEW = "2026-09-21";
const TRANSITIONAL = "transitional" as const;
const RESPONSIBLE = ["responsible"];

export const D04_ACTIVITIES: ActivityDefinition[] = [
  {
    activity_key: "rights.exercise_mechanism_design",
    human_code: "D4.01",
    name: "Diseñar el mecanismo general para el ejercicio de derechos",
    objective:
      "Diseñar y validar el mecanismo general mediante el cual los titulares pueden ejercer sus derechos ante el responsable, asegurando canales adecuados, autenticación, recepción, tramitación, respuesta, cumplimiento de plazos y conservación de la evidencia exigida por la ley. No administrar solicitudes reales.",
    trigger_question:
      "¿La empresa dispone de un mecanismo general, operativo y documentado para recibir, tramitar y responder el ejercicio de los derechos de los titulares conforme a los requisitos legales aplicables?",
    interlocutors: [
      "Área legal / privacidad / compliance",
      "Responsable o representante del responsable",
      "Atención al cliente o canal de derechos",
      "TI/desarrollo cuando el canal sea electrónico",
      "Responsables de procesos y datos",
      "Seguridad cuando participe en autenticación",
    ],
    data_collection_methods: [
      "Revisión documental",
      "Walkthrough del canal",
      "Revisión de formularios y templates",
      "Entrevistas con responsables internos",
      "Simulación controlada sin datos reales de titulares",
    ],
    steps_operational: [
      "Identificar el o los canales mediante los cuales se reciben solicitudes: correo electrónico, formulario de contacto o medio electrónico equivalente.",
      "Verificar que los mecanismos y herramientas sean sencillos en su operación y permitan un ejercicio expedito, ágil y eficaz.",
      "Definir la atención de solicitudes formuladas por el propio titular, representante legal o mandatario, según corresponda.",
      "Incorporar el supuesto de ejercicio por herederos cuando legalmente proceda y sus limitaciones.",
      "Diseñar el mecanismo de autenticación conforme a los procedimientos, formas y modalidades que establezca la Agencia.",
      "Capturar como mínimo la individualización correspondiente y un medio válido para comunicar la respuesta.",
      "Permitir identificar los datos personales o tratamiento determinado respecto de los cuales se ejerce el derecho.",
      "Incorporar los antecedentes adicionales exigibles según el derecho específico: rectificación, supresión u oposición.",
      "No imponer al derecho de acceso requisitos adicionales incompatibles con la regla legal específica.",
      "Generar acuse de recibo.",
      "Clasificar correctamente el derecho ejercido y derivarlo a su procedimiento específico.",
      "Asegurar capacidad para responder dentro del plazo general máximo de 30 días corridos desde el ingreso.",
      "Contemplar una sola prórroga, cuando corresponda, por hasta 30 días corridos adicionales.",
      "Asegurar respuesta escrita al domicilio, correo electrónico u otro medio fijado por el titular.",
      "Conservar la capacidad de demostrar remisión, fecha y contenido íntegro de la respuesta.",
      "Ante denegación total o parcial, exigir fundamentación de la causa y antecedentes que la justifican.",
      "Incorporar en la denegación la información sobre el derecho a reclamar ante la Agencia y el plazo legal aplicable.",
      "Incorporar la ruta especial de bloqueo temporal hacia D4.06 cuando corresponda.",
      "Definir reglas de gratuidad: rectificación, supresión y oposición siempre gratuitas; acceso gratuito al menos trimestralmente.",
      "Para acceso y portabilidad ejercidos más de una vez en el trimestre, no prever cobros distintos de los costos directos permitidos y determinados conforme a las instrucciones aplicables de la Agencia. No inventar montos de costos. No crear scheduler.",
      "Si el responsable es una persona jurídica no constituida en Chile y resulta aplicable la regla legal correspondiente, verificar el medio/representación electrónica exigida para ejercicio de derechos y comunicaciones.",
    ],
    evidence_required: [
      "Procedimiento general de ejercicio de derechos",
      "Canales habilitados",
      "Formularios/templates",
      "Diseño de autenticación",
      "Matriz de requisitos por derecho",
      "Matriz de plazos",
      "Reglas de gratuidad/costos",
      "Modelos de acuse/respuesta/denegación",
      "Mecanismo previsto para conservar respaldo de remisión",
      "Roles y responsables internos",
      "Prueba o walkthrough del proceso",
    ],
    evidence_basis: "legal_requirement",
    deliverable:
      "Procedimiento general de ejercicio de derechos y matriz de canales, requisitos y plazos",
    estimated_time: "3–8 h",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 4"),
      basis("cl_ley_19628_2026", "Artículo 10"),
      basis("cl_ley_19628_2026", "Artículo 11"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: ["rights.exercise_mechanism_status = designed"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [],
  },
  {
    activity_key: "rights.access_enable",
    human_code: "D4.02",
    name: "Habilitar la atención del derecho de acceso",
    objective:
      "Verificar que el responsable pueda responder correctamente solicitudes de acceso y entregar la información exigida legalmente, sin administrar solicitudes individuales en Stage 1.",
    trigger_question:
      "¿La empresa está preparada para identificar, compilar y entregar correctamente la información exigida cuando un titular ejerza su derecho de acceso?",
    interlocutors: [
      "Área legal / privacidad",
      "Responsables de procesos/datos",
      "Data governance",
      "TI/sistemas",
      "Atención de derechos",
    ],
    data_collection_methods: [
      "Revisión de repositorios",
      "Data walkthrough",
      "Simulación de solicitud",
      "Revisión de templates",
      "Contraste contra información exigida",
    ],
    steps_operational: [
      "Verificar capacidad para confirmar si se tratan datos personales del titular.",
      "Verificar capacidad para dar acceso a los datos tratados.",
      "Verificar capacidad para informar el origen de los datos.",
      "Verificar capacidad para informar la finalidad o finalidades.",
      "Verificar capacidad para informar las categorías/clases/tipos de destinatarios.",
      "Verificar capacidad para informar la identidad de cada destinatario cuando el titular lo solicite.",
      "Verificar capacidad para informar el período durante el cual los datos serán tratados.",
      "Verificar capacidad para informar los intereses legítimos cuando ésa sea la base aplicable.",
      "Verificar capacidad para entregar información significativa sobre la lógica aplicada cuando exista tratamiento comprendido por el artículo 8 bis.",
      "Reconocer que la negativa de acceso solo procede cuando una ley disponga expresamente lo contrario.",
      "Respetar el requisito procedimental especial según el cual para acceso basta la individualización del titular.",
      "Aplicar la regla de gratuidad correspondiente y coordinar cualquier costo admisible con D4.01. No convertir el derecho de acceso en un export técnico genérico que ignore los contenidos legales.",
    ],
    evidence_required: [
      "Matriz de información a entregar",
      "Mapeo de fuentes/repositorios",
      "Procedimiento de extracción",
      "Template de respuesta",
      "Ejemplo controlado o walkthrough",
      "Criterios para excepciones legales",
      "Coordinación con D4.08 respecto de lógica automatizada cuando corresponda",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Procedimiento y matriz de respuesta al derecho de acceso",
    estimated_time: "1–3 h",
    complexity: "Media",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 5"),
      basis("cl_ley_19628_2026", "Artículo 10"),
      basis("cl_ley_19628_2026", "Artículo 11"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: ["rights.access_status = enabled"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "rights.exercise_mechanism_design",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "general exercise mechanism designed",
        rationale:
          "La atención del acceso puede revisarse antes; su completitud depende del mecanismo general.",
      },
    ],
  },
  {
    activity_key: "rights.rectification_enable",
    human_code: "D4.03",
    name: "Habilitar la atención del derecho de rectificación",
    objective:
      "Diseñar y validar la capacidad para rectificar datos inexactos, desactualizados o incompletos y propagar correctamente las rectificaciones cuando corresponda.",
    trigger_question:
      "¿La empresa dispone de un procedimiento y capacidad operacional para rectificar datos personales y aplicar las consecuencias legales de dicha rectificación?",
    interlocutors: [
      "Área legal / privacidad",
      "Responsables de datos",
      "TI/sistemas",
      "Owners de procesos",
      "Atención de derechos",
    ],
    data_collection_methods: [
      "Revisión de procedimiento",
      "Trazabilidad de datos",
      "Walkthrough de modificación",
      "Análisis de propagación",
      "Simulación controlada",
    ],
    steps_operational: [
      "Identificar datos inexactos, desactualizados o incompletos objeto de rectificación.",
      "Recibir la modificación o actualización precisa solicitada.",
      "Recibir antecedentes de respaldo cuando corresponda.",
      "Ejecutar la modificación en las fuentes/sistemas aplicables.",
      "Impedir que los datos sin rectificar vuelvan a tratarse una vez efectuada la rectificación.",
      "Identificar destinatarios a quienes los datos fueron comunicados o cedidos.",
      "Comunicar la rectificación a esos destinatarios.",
      "Contemplar la excepción cuando dicha comunicación resulte imposible o exija esfuerzo desproporcionado.",
      "Exigir que cualquier invocación de esa excepción quede fundamentada/evidenciada.",
      "Coordinar la eventual solicitud de bloqueo temporal mientras se resuelve la rectificación.",
      "Utilizar el procedimiento/plazos comunes de D4.01. No decidir casos individuales en Stage 1.",
    ],
    evidence_required: [
      "Procedimiento de rectificación",
      "Data/system mapping",
      "Propagación/corrección downstream",
      "Template de comunicación a destinatarios",
      "Criterio documentado para imposibilidad/esfuerzo desproporcionado",
      "Walkthrough de corrección",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Procedimiento de rectificación y propagación de modificaciones",
    estimated_time: "1–3 h",
    complexity: "Media",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 6"),
      basis("cl_ley_19628_2026", "Artículo 10"),
      basis("cl_ley_19628_2026", "Artículo 11"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: ["rights.rectification_status = enabled"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "rights.exercise_mechanism_design",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "general exercise mechanism designed",
        rationale:
          "La atención de la rectificación puede revisarse antes; su completitud depende del mecanismo general.",
      },
    ],
  },
  {
    activity_key: "rights.suppression_enable",
    human_code: "D4.04",
    name: "Habilitar la atención del derecho de supresión",
    objective:
      "Diseñar y validar un procedimiento capaz de evaluar las causales legales de supresión, sus excepciones y las consecuencias operacionales de una supresión procedente.",
    trigger_question:
      "¿La empresa dispone de criterios y procedimientos suficientes para determinar cuándo procede la supresión y ejecutar correctamente sus efectos?",
    interlocutors: [
      "Área legal / privacidad",
      "Owners de datos/procesos",
      "TI",
      "Records/retention",
      "Atención de derechos",
    ],
    data_collection_methods: [
      "Matriz jurídica",
      "Revisión de retention/data flows",
      "Walkthrough de eliminación",
      "Escenarios controlados",
      "Revisión de propagación",
    ],
    steps_operational: [
      "Contemplar la causal de datos no necesarios respecto de los fines para los cuales fueron recogidos.",
      "Contemplar la causal de revocación del consentimiento y ausencia de otro fundamento legal.",
      "Contemplar la causal de obtención o tratamiento ilícito.",
      "Contemplar la causal de datos caducos.",
      "Contemplar la causal de cumplimiento de sentencia, resolución de autoridad u obligación legal.",
      "Contemplar la causal de oposición ejercida y ausencia de otro fundamento legal.",
      "Contemplar la excepción cuando el tratamiento sea necesario para las libertades de emitir opinión e informar.",
      "Contemplar la excepción de obligación legal o ejecución de contrato.",
      "Contemplar la excepción de función pública o actividad de interés público.",
      "Contemplar la excepción de interés público en salud pública conforme a las condiciones legales.",
      "Contemplar la excepción de fines históricos, estadísticos o científicos e investigaciones de interés público.",
      "Contemplar la excepción de formulación, ejercicio o defensa de reclamación administrativa o judicial.",
      "Verificar que la solicitud identifica causal y antecedentes cuando corresponda.",
      "Definir cómo localizar los datos.",
      "Ejecutar eliminación cuando proceda.",
      "Identificar comunicaciones/cesiones previas.",
      "Comunicar los cambios a terceros receptores cuando corresponda conforme al art. 11.",
      "Integrar bloqueo temporal cuando sea solicitado durante la resolución.",
      "Evitar que la guía Stage 1 adopte decisiones sobre casos reales.",
    ],
    evidence_required: [
      "Matriz causal/excepciones",
      "Procedimiento de supresión",
      "Data mapping",
      "Reglas de eliminación",
      "Procedimiento downstream",
      "Templates",
      "Walkthrough controlado",
    ],
    evidence_basis: "agency_standard",
    deliverable:
      "Matriz de causales y excepciones de supresión + procedimiento operacional",
    estimated_time: "2–4 h",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 7"),
      basis("cl_ley_19628_2026", "Artículo 10"),
      basis("cl_ley_19628_2026", "Artículo 11"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: ["rights.suppression_status = enabled"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "rights.exercise_mechanism_design",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "general exercise mechanism designed",
        rationale:
          "La atención de la supresión puede revisarse antes; su completitud depende del mecanismo general.",
      },
    ],
  },
  {
    activity_key: "rights.opposition_enable",
    human_code: "D4.05",
    name: "Habilitar la atención del derecho de oposición",
    objective:
      "Diseñar y validar el procedimiento para resolver las distintas hipótesis legales del derecho de oposición y detener los tratamientos cuando corresponda.",
    trigger_question:
      "¿La empresa dispone de criterios y procedimientos para identificar las distintas causales de oposición y aplicar correctamente sus consecuencias?",
    interlocutors: [
      "Área legal / privacidad",
      "Marketing/comercial",
      "Responsables de tratamientos",
      "Analytics/producto cuando corresponda",
      "Atención de derechos",
      "TI",
    ],
    data_collection_methods: [
      "Mapping de bases/finalidades",
      "Revisión de campañas/profiling",
      "Matriz jurídica",
      "Walkthrough de cese",
      "Escenarios controlados",
    ],
    steps_operational: [
      "Cuando la base sea interés legítimo: permitir oposición en cualquier momento.",
      "Cuando la base sea interés legítimo: contemplar cese del tratamiento salvo que el responsable acredite motivos legítimos imperiosos que prevalezcan, o necesidad para formular, ejercer o defender reclamaciones.",
      "Cuando el tratamiento sea exclusivamente para marketing directo, incluida elaboración de perfiles vinculada a dicho marketing: contemplar oposición.",
      "Cuando el tratamiento sea exclusivamente para marketing directo, incluida elaboración de perfiles vinculada a dicho marketing: disponer cese operacional correspondiente.",
      "Cuando los datos provengan de fuente de acceso público: contemplar oposición cuando no exista otro fundamento legal.",
      "No procede oposición cuando el tratamiento sea para investigación científica/histórica o fines estadísticos y sea necesario para función pública o actividad de interés público.",
      "Identificar la causal invocada.",
      "Contemplar la fundamentación breve requerida en la rama de interés legítimo.",
      "Permitir antecedentes adicionales.",
      "Coordinar bloqueo temporal.",
      "Comunicar cambios a terceros receptores cuando corresponda.",
      "No decidir solicitudes individuales en Stage 1.",
    ],
    evidence_required: [
      "Matriz de ramas y excepciones",
      "Procedimiento",
      "Mapping de tratamientos por base/finalidad",
      "Proceso de cese",
      "Procedimiento de marketing/direct profiling",
      "Templates",
      "Walkthrough",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Matriz de oposición y procedimiento de cese del tratamiento",
    estimated_time: "2–4 h",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 8"),
      basis("cl_ley_19628_2026", "Artículo 10"),
      basis("cl_ley_19628_2026", "Artículo 11"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: ["rights.opposition_status = enabled"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "rights.exercise_mechanism_design",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "general exercise mechanism designed",
        rationale:
          "La atención de la oposición puede revisarse antes; su completitud depende del mecanismo general.",
      },
    ],
  },
  {
    activity_key: "rights.blocking_enable",
    human_code: "D4.06",
    name: "Habilitar el bloqueo temporal del tratamiento",
    objective:
      "Asegurar que la empresa pueda suspender temporalmente operaciones de tratamiento cuando corresponda, conservar el almacenamiento y atender la solicitud de bloqueo dentro de las reglas especiales aplicables.",
    trigger_question:
      "¿La empresa puede recibir, decidir y ejecutar oportunamente una solicitud de bloqueo temporal sin continuar las operaciones de tratamiento afectadas?",
    interlocutors: [
      "Área legal / privacidad",
      "Atención de derechos",
      "TI/sistemas",
      "Owners de datos",
      "Operaciones",
    ],
    data_collection_methods: [
      "Walkthrough técnico",
      "Simulación de suspensión",
      "Revisión procedimental",
      "Prueba de almacenamiento sin tratamiento",
      "Revisión de templates",
    ],
    steps_operational: [
      "Reconocer que puede solicitarse bloqueo junto con rectificación, supresión u oposición mientras la solicitud principal esté pendiente.",
      "Reconocer el bloqueo como alternativa a supresión en los casos previstos por el art. 7.",
      "Recibir una solicitud fundada.",
      "Disponer capacidad para responder dentro de 2 días hábiles desde la recepción. NO crear timer vivo. NO crear BlockingRequest.",
      "Mientras la solicitud de bloqueo no sea resuelta, impedir el tratamiento de los datos comprendidos en el requerimiento.",
      "Mantener permitido el almacenamiento.",
      "Si se concede, ejecutar la suspensión temporal correspondiente.",
      "Si se rechaza, exigir fundamentación de la respuesta.",
      "Prever comunicación electrónica del rechazo a la Agencia.",
      "Informar/gestionar la ruta de reclamación legal aplicable.",
      "Resolver la transición cuando termine la solicitud principal, sin crear lifecycle Stage 1.",
    ],
    evidence_required: [
      "Procedimiento",
      "Capacidad técnica de suspensión",
      "Configuración/controles",
      "Matriz de plazo especial",
      "Template de decisión",
      "Mecanismo de comunicación a Agencia",
      "Walkthrough o prueba controlada",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Procedimiento y prueba de capacidad de bloqueo temporal",
    estimated_time: "2–4 h",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 8 ter"),
      basis("cl_ley_19628_2026", "Artículo 11"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: ["rights.blocking_status = enabled"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "rights.exercise_mechanism_design",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "general exercise mechanism designed",
        rationale:
          "La atención del bloqueo puede revisarse antes; su completitud depende del mecanismo general.",
      },
    ],
  },
  {
    activity_key: "rights.portability_enable",
    human_code: "D4.07",
    name: "Habilitar la atención del derecho a la portabilidad",
    objective:
      "Diseñar y validar la capacidad para atender solicitudes de portabilidad cuando concurran sus requisitos legales y entregar o transmitir los datos mediante formatos y mecanismos adecuados.",
    trigger_question:
      "¿La empresa dispone de capacidad técnica y procedimental para atender correctamente el derecho a la portabilidad cuando concurran sus requisitos legales?",
    interlocutors: [
      "Área legal / privacidad",
      "TI/data",
      "Responsables de sistemas",
      "Producto",
      "Atención de derechos",
    ],
    data_collection_methods: [
      "Revisión técnica",
      "Export test",
      "Interoperability walkthrough",
      "Revisión de formatos",
      "Revisión procedimental",
    ],
    steps_operational: [
      "Evaluar elegibilidad: tratamiento automatizado Y tratamiento basado en consentimiento, sobre datos personales concernientes al titular que éste haya facilitado al responsable.",
      "Identificar los datos comprendidos.",
      "Generar copia en formato electrónico estructurado, genérico y de uso común.",
      "Asegurar que el formato pueda ser operado por distintos sistemas.",
      "Permitir comunicación/transferencia a otro responsable.",
      "Utilizar medios expeditos y menos onerosos.",
      "No imponer trabas u obstáculos.",
      "Informar clara y precisamente las medidas necesarias para obtener los datos.",
      "Informar características técnicas de la operación.",
      "Habilitar transmisión directa responsable-a-responsable cuando sea técnicamente posible. No convertir portabilidad en obligación de interoperabilidad absoluta cuando la transmisión directa no sea técnicamente posible.",
      "Reconocer que portabilidad no implica supresión ante el responsable cedente salvo que ésta sea solicitada conjuntamente.",
      "Coordinar reglas de gratuidad/costos con D4.01 sin inventar montos.",
    ],
    evidence_required: [
      "Procedimiento",
      "Formato de exportación",
      "Especificación técnica",
      "Prueba de interoperabilidad",
      "Mecanismo de transmisión",
      "Instrucciones al titular",
      "Análisis de transmisión directa",
      "Walkthrough",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Procedimiento y validación técnica de portabilidad",
    estimated_time: "2–5 h",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 9"),
      basis("cl_ley_19628_2026", "Artículo 10"),
      basis("cl_ley_19628_2026", "Artículo 11"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: ["rights.portability_status = enabled"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "rights.exercise_mechanism_design",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "general exercise mechanism designed",
        rationale:
          "La atención de la portabilidad puede revisarse antes; su completitud depende del mecanismo general.",
      },
    ],
  },
  {
    activity_key: "automated_decision.scope_assess",
    human_code: "D4.08",
    name: "Evaluar el alcance de decisiones automatizadas",
    objective:
      "Identificar y evaluar separadamente los distintos usos de decisiones basadas en tratamiento automatizado dentro de un treatment, incluida la elaboración de perfiles, para determinar cuáles quedan comprendidos por el artículo 8 bis y si existe una vía legal exceptuada que permita su utilización.",
    trigger_question:
      "¿El tratamiento utiliza, o podría utilizar, decisiones basadas en tratamiento automatizado o elaboración de perfiles que deban evaluarse bajo el artículo 8 bis?",
    interlocutors: [
      "Área legal / privacidad",
      "Owner del tratamiento/proceso",
      "Producto",
      "Data/analytics/data science",
      "TI/desarrollo",
      "Responsables de la decisión de negocio",
    ],
    data_collection_methods: [
      "Inventario de usos",
      "Walkthrough de decisiones",
      "Revisión de lógica y proceso",
      "Entrevistas",
      "Análisis jurídico mediante ReasoningRecord",
    ],
    steps_operational: [
      "Identificar el uso/proceso concreto. Un mismo treatment puede contener cero, uno o múltiples usos automatizados distintos; cada uso identificado debe evaluarse separadamente.",
      "Identificar finalidad y contexto del uso.",
      "Identificar la decisión o resultado producido por el uso.",
      "Determinar si la decisión se basa en tratamiento automatizado, incluida elaboración de perfiles.",
      "Evaluar si produce efectos jurídicos sobre el titular o le afecta significativamente de modo similar.",
      "Si no alcanza ese umbral, documentar la clasificación del uso.",
      "Si alcanza el umbral, evaluar si es necesaria para celebración o ejecución de contrato.",
      "Evaluar si existe consentimiento previo y expreso conforme al art. 12.",
      "Evaluar si existe habilitación legal que disponga el empleo de salvaguardas.",
      "Identificar cuando ninguna de las excepciones anteriores permite la decisión.",
      "Documentar la conclusión individual del uso.",
      "Consolidar la conclusión del treatment sin perder el detalle por uso.",
      "Derivar TODOS los usos cubiertos por art. 8 bis hacia D4.09, incluida cualquier decisión amparada en las excepciones a), b) o c). Que exista una excepción NO elimina las salvaguardas.",
    ],
    evidence_required: [
      "Inventario/matriz de usos automatizados",
      "Process maps",
      "Especificaciones funcionales/técnicas",
      "Documentación de profiling",
      "Lógica/inputs/outputs relevantes",
      "Consecuencias para titulares",
      "Contratos",
      "Evidencia de consentimiento cuando corresponda como diseño/antecedente, no consent records Stage 2",
      "Habilitación legal cuando se invoque",
      "Análisis profesional",
    ],
    evidence_basis: "agency_standard",
    deliverable:
      "Matriz de usos automatizados y evaluación de alcance del artículo 8 bis. Debe permitir distinguir cada uso dentro del treatment.",
    estimated_time: "2–6 h por treatment",
    complexity: "Alta",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 8 bis")],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: true,
    state_effect: [
      "automated_decision.scope_status = no_covered_use | covered_use_present",
      "automated_decision.legal_path_status = exception_identified | remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "automated_decision.safeguards_enable",
    human_code: "D4.09",
    name: "Habilitar salvaguardas para decisiones automatizadas",
    objective:
      "Verificar y habilitar las salvaguardas exigidas para cada uso de decisión automatizada comprendido por el artículo 8 bis, incluyendo aquellos que operen bajo las excepciones legales.",
    trigger_question:
      "¿Todos los usos de decisión automatizada comprendidos por el artículo 8 bis cuentan con las salvaguardas legales exigidas para proteger al titular?",
    interlocutors: [
      "Área legal / privacidad",
      "Owner del tratamiento",
      "Producto",
      "Data/analytics",
      "TI/desarrollo",
      "Operadores responsables de revisión humana",
      "Atención al titular cuando corresponda",
    ],
    data_collection_methods: [
      "Matriz por uso",
      "Walkthrough funcional",
      "Revisión del flujo de intervención",
      "Prueba de explicación",
      "Prueba del canal de revisión",
      "Entrevistas con operadores",
    ],
    steps_operational: [
      "Verificar por cada uso cubierto identificado en D4.08 el derecho a información y transparencia. No basta comprobar una capacidad genérica si distintos usos tienen mecanismos diferentes.",
      "Verificar por cada uso cubierto la capacidad de entregar una explicación.",
      "Verificar por cada uso cubierto la posibilidad efectiva de intervención humana.",
      "Verificar por cada uso cubierto la posibilidad de que el titular exprese su punto de vista.",
      "Verificar por cada uso cubierto la posibilidad de solicitar revisión de la decisión.",
      "Evaluar estas salvaguardas cuando no existe excepción, cuando la decisión es necesaria para contrato, cuando se basa en consentimiento previo y expreso y cuando existe habilitación legal. Las excepciones a), b) y c) NO eliminan estas salvaguardas.",
      "Identificar responsables internos.",
      "Definir canal para intervención/revisión.",
      "Verificar que la explicación sea operacionalmente obtenible.",
      "Comprobar que la intervención humana sea real y no meramente nominal.",
      "Verificar que punto de vista y revisión puedan incorporarse al proceso.",
      "Mantener coherencia con la información/transparencia pública cubierta en D3, sin duplicar esa fuente de verdad. No inventar plazo específico para intervención/revisión si la ley no lo fija.",
    ],
    evidence_required: [
      "Matriz de salvaguardas por uso automatizado",
      "Procedimiento",
      "Flujo de revisión",
      "Diseño de intervención humana",
      "Mecanismo para explicación",
      "Canal para punto de vista",
      "Canal/proceso de revisión",
      "Walkthrough/prueba controlada",
    ],
    evidence_basis: "agency_standard",
    deliverable:
      "Matriz de salvaguardas por uso automatizado y procedimiento de intervención/revisión",
    estimated_time: "2–6 h por treatment",
    complexity: "Alta",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 8 bis")],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [
      "automated_decision.scope_status = covered_use_present",
    ],
    reasoning_record_required: false,
    state_effect: [
      "automated_decision.safeguards_status = enabled | remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "automated_decision.scope_assess",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "automated decision scope assessed",
        rationale:
          "Las salvaguardas pueden revisarse preliminarmente antes; su completitud depende de la evaluación de alcance de D4.08.",
      },
    ],
  },
];

/** Claves en orden canónico D4.01–D4.09. */
export const D4_ACTIVITY_KEYS: string[] = D04_ACTIVITIES.map((a) => a.activity_key);

/**
 * Notas de procedencia del canon D4 (guía de implementación, no campos
 * operativos). Se preservan en la proyección humana D04.md sin modificar
 * el contrato `ActivityDefinition`.
 */
export const D04_PROVENANCE_NOTES: Record<string, string> = {
  "rights.exercise_mechanism_design":
    "La ley exige directamente al responsable implementar mecanismos y herramientas para el ejercicio de los derechos (evidence_basis = legal_requirement). La metodología concreta de revisión sigue sin presentarse como prescrita por ley.",
  "automated_decision.scope_assess":
    "REPEATABLE-USE RULE: un treatment puede contener cero, uno o múltiples usos automatizados; cada uso se evalúa separadamente. El canon no autoriza nuevo scope, AutomatedDecisionContext ni entidad persistente. Si el runtime no puede capturar usos repetibles honestamente, reportar AUTOMATED_USE_REPEATABLE_CAPTURE_GAP en la iteración de protocolos. No empaquetar múltiples usos como JSON/text blob.",
  "automated_decision.safeguards_enable":
    "Las salvaguardas se verifican por cada uso cubierto identificado en D4.08, con correspondencia uso→salvaguardas. Las excepciones a), b) y c) no eliminan salvaguardas. Sin nuevo scope/entidad; si la correspondencia no es representable, reportar AUTOMATED_USE_REPEATABLE_CAPTURE_GAP.",
};
