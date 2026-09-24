import type { ActivityDefinition } from "../../src/types";
import { basis } from "../sources";

/**
 * CANONICAL SOURCE OF TRUTH — D5 Tratamientos especiales.
 * Única fuente estructurada de las 7 actividades D5. Contenido aprobado
 * textualmente por la iteración vigente; no inventar, completar ni
 * reinterpretar. `docs/domains/D05.md` es una proyección humana generada
 * desde esta representación (ver `npm run content:docs`).
 * La aplicación consume estas definiciones; no las duplica.
 *
 * Frontera Stage 1 congelada:
 * - D5 Stage 1 registra exclusivamente características y conclusiones
 *   sobre el tratamiento: qué régimen especial resulta aplicable, qué
 *   finalidad se analiza, qué condiciones jurídicas se verificaron, qué
 *   controles existen, qué vía jurídica fue evaluada y qué evidencia
 *   respalda la evaluación;
 * - D5 evalúa el tratamiento, NO almacena los datos objeto del
 *   tratamiento: prohibido en Stage 1 cualquier dato personal especial
 *   real de titulares (diagnósticos, información genética, datos
 *   biométricos reales, huellas, iris, voz biométrica, edad o fecha de
 *   nacimiento de titulares reales, identidad de NNA, afiliaciones,
 *   orientación sexual, información de salud individual,
 *   geolocalización individual, deudas u obligaciones de personas
 *   concretas, historial financiero individual);
 * - prohibido en Stage 1: registros por titular, casos individuales,
 *   solicitudes individuales, historiales individuales,
 *   temporizadores operacionales y cálculo de vencimientos
 *   individuales; los plazos legales se modelan como
 *   capacidad/procedimiento que el responsable debe poder cumplir.
 *
 * Regla transversal de scope (conceptual; `ActivityDefinition` no porta
 * campo scope — el scope de ejecución vive en la futura capa de protocolo):
 * - D5.01–D5.07 evalúan la finalidad activa (purpose) como unidad
 *   jurídica principal. Las verificaciones pueden consultar el
 *   TreatmentContext padre, DataItemRecord, DataPurposeLink, sources,
 *   el contexto de licitud D2 y el consentimiento D3, sin cuarto scope,
 *   sin nueva entidad global y sin ClientActivityInstance;
 * - D5.07 permanece purpose-scoped aunque sus verificaciones materiales
 *   examinen datos/operaciones vinculados a la finalidad; no existe
 *   scope de operación financiera.
 *
 * Diferimiento de aplicabilidad y captura (gate obligatorio):
 * - el canon exige saber qué regímenes especiales aplican, pero NO
 *   existe taxonomía machine-readable aprobada; por tanto
 *   `conditions_applicability` es `[]` en D5.01–D5.07 y la
 *   aplicabilidad conceptual vive en trigger, objetivo, pasos y notas;
 * - NO inventar facts canónicos para resolverla; antes de los
 *   protocolos se realizará la auditoría de captura de regímenes
 *   especiales (`D5 SPECIAL-REGIME CAPTURE AUDIT`);
 * - no modificar `DataItemRecord.category`, no convertirlo en enum, no
 *   agregar arreglos de banderas ni clasificaciones persistentes.
 *
 * Reglas conceptuales preservadas:
 * - D5 no duplica verdades de D2 (finalidades, datos, licitud general),
 *   D3 (mecanismo de consentimiento) ni D4 (derechos); las consume como
 *   contexto sin dependencias rígidas nuevas y sin escrituras
 *   cross-scope (D5 no modifica facts canónicos de D2);
 * - D5.02–D5.05 operan con rutas propias y NO dependen por completitud
 *   de D5.01; D5.01 puede ser contexto relacionado;
 * - D5.05 identifica y mitiga riesgos conforme a su propia regla sin
 *   afirmar que ello reemplaza una futura EIPD (sin dependencia a D8);
 * - D5.06 no redefine la licitud general ya evaluada en D2;
 * - D5.07 no crea dependencia inversa hacia D2.05 (sin ciclo);
 *   la relación D2.05 → D5.07 vive únicamente en D2.05;
 * - ninguna actividad D5 utiliza scoring, weights, thresholds o
 *   porcentajes; no se crea ReasoningRecord nuevo (se usa el existente).
 */

const REVIEW = "2026-09-21";
const TRANSITIONAL = "transitional" as const;
const RESPONSIBLE = ["responsible"];

export const D05_ACTIVITIES: ActivityDefinition[] = [
  {
    activity_key: "sensitive.lawfulness_assess",
    human_code: "D5.01",
    name: "Evaluar la licitud del tratamiento de datos personales sensibles",
    objective:
      "Determinar si una finalidad que involucra datos personales sensibles cuenta con una vía jurídica válida bajo el régimen general del artículo 16, documentando la conclusión profesional y las condiciones que deben cumplirse.",
    trigger_question:
      "¿La finalidad involucra datos personales sensibles y requiere determinar la vía jurídica especial que permite su tratamiento?",
    interlocutors: [
      "Área legal / privacidad",
      "Dueño de la finalidad/tratamiento",
      "Compliance",
      "Recursos Humanos cuando corresponda",
      "Responsables funcionales del dato",
    ],
    data_collection_methods: [
      "Revisión documental",
      "Mapeo dato-finalidad",
      "Entrevistas",
      "Contraste de vía jurídica",
      "Registro de razonamiento profesional",
    ],
    steps_operational: [
      "Identificar los datos vinculados a la finalidad que presentan características compatibles con la definición legal de datos personales sensibles.",
      "Verificar si la finalidad se apoya en consentimiento expreso del titular.",
      "Cuando se invoque consentimiento, verificar que sea expreso y que su obtención esté respaldada por el mecanismo correspondiente, sin duplicar D3.",
      "Si no existe consentimiento expreso, evaluar separadamente las hipótesis del artículo 16.",
      "Evaluar si los datos sensibles fueron hechos manifiestamente públicos por el titular y si el tratamiento se relaciona con los fines para los cuales fueron publicados.",
      "Evaluar la hipótesis de interés legítimo de persona jurídica pública o privada sin fines de lucro únicamente cuando concurran todos los requisitos legales: finalidad política, filosófica, religiosa, cultural, sindical o gremial; tratamiento exclusivamente respecto de miembros o afiliados; vinculación con las finalidades específicas de la institución; garantías contra filtración, sustracción o uso/tratamiento no autorizado; inexistencia de comunicación o cesión a terceros.",
      "Para esa hipótesis, verificar además el mecanismo de anonimización o supresión cuando una persona deja de pertenecer a la organización.",
      "Evaluar la necesidad indispensable para salvaguardar vida, salud o integridad física o psíquica cuando corresponda.",
      "Cuando el titular se encuentre impedido de consentir, verificar la obligación de informar posteriormente una vez que cese el impedimento.",
      "Evaluar la necesidad para la formulación, ejercicio o defensa de derechos ante tribunal u órgano administrativo.",
      "Evaluar la necesidad en el ámbito laboral o de seguridad social para el ejercicio de derechos o el cumplimiento de obligaciones conforme a la ley.",
      "Evaluar la autorización o mandato legal expreso.",
      "Documentar qué vía fue analizada, los hechos relevantes, las alternativas descartadas y la conclusión.",
      "Identificar si además corresponde aplicar alguno de los regímenes especializados D5.02–D5.05.",
      "No asumir que la mera sensibilidad del dato determina por sí sola la vía jurídica.",
    ],
    evidence_required: [
      "Descripción de la finalidad",
      "Mapeo dato-finalidad disponible",
      "Documentación de consentimiento cuando sea la vía",
      "Antecedentes de publicidad manifiesta cuando corresponda",
      "Estatutos y finalidad de la entidad sin fines de lucro",
      "Reglas de membresía",
      "Controles de seguridad y confidencialidad",
      "Evidencia sobre comunicaciones a terceros",
      "Antecedentes vitales, laborales o judiciales cuando corresponda",
      "Norma legal invocada",
      "Análisis profesional",
    ],
    evidence_basis: "agency_standard",
    deliverable:
      "Evaluación de licitud para tratamiento de datos personales sensibles",
    estimated_time: "1–3 h por purpose",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 2 letra g)"),
      basis("cl_ley_19628_2026", "Artículo 16"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: true,
    state_effect: ["sensitive.lawfulness_status = supported | not_supported"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "sensitive.health_biological_assess",
    human_code: "D5.02",
    name: "Evaluar el tratamiento de datos de salud y perfil biológico",
    objective:
      "Determinar si el tratamiento de datos relativos a salud o perfil biológico humano cumple las condiciones específicas del artículo 16 bis, distinguiendo correctamente la vía con consentimiento de las hipótesis legales sin consentimiento y las prohibiciones especiales.",
    trigger_question:
      "¿La finalidad involucra datos relativos a la salud o al perfil biológico humano y requiere evaluar el régimen especial del artículo 16 bis?",
    interlocutors: [
      "Área legal / privacidad",
      "Responsable sanitario cuando exista",
      "Recursos Humanos cuando corresponda",
      "Seguridad",
      "Dueño del tratamiento",
    ],
    data_collection_methods: [
      "Revisión normativa",
      "Revisión finalidad/dato",
      "Análisis de contexto de recolección",
      "Contraste de vía jurídica",
      "Registro de razonamiento profesional",
    ],
    steps_operational: [
      "En la vía con consentimiento: verificar consentimiento expreso conforme al artículo 16, identificar la ley especial sanitaria aplicable y la finalidad sanitaria autorizada por dicha ley, y comprobar la correspondencia entre esa finalidad y el tratamiento evaluado. Cuando se cumple la regla de consentimiento expreso del inciso primero del artículo 16, los datos relativos a salud y perfil biológico sólo pueden tratarse para los fines previstos por leyes especiales en materia sanitaria. No asumir que el consentimiento expreso por sí solo habilita cualquier finalidad sanitaria. No inventar catálogo de leyes sanitarias: la evidencia debe identificar la norma especial realmente invocada.",
      "Evaluar separadamente la necesidad indispensable para salvaguardar la vida o la integridad física o psíquica, incluyendo el impedimento físico o jurídico para consentir; en este caso verificar el mecanismo de información posterior al cesar el impedimento.",
      "Evaluar la hipótesis de alerta sanitaria legalmente decretada.",
      "Evaluar la hipótesis de fines históricos, estadísticos o científicos, estudios o investigaciones de interés público o en beneficio de la salud humana, o desarrollo de productos o insumos médicos que no podrían desarrollarse de otra forma; si existen publicaciones o difusión de resultados, verificar la anonimización previa.",
      "Evaluar la formulación, ejercicio o defensa de un derecho ante un tribunal u órgano administrativo.",
      "Evaluar la hipótesis de medicina preventiva o laboral, evaluación de la capacidad laboral, diagnóstico médico, asistencia o tratamiento sanitario o social, o gestión de sistemas, servicios sanitarios y sociales.",
      "Evaluar la autorización legal que indique expresamente la finalidad.",
      "Evaluar expresamente la prohibición relativa al tratamiento, cesión, muestras biológicas asociadas a persona identificada o identificable y almacenamiento de material biológico cuando los datos o muestras fueron recolectados en ámbitos laboral, educativo, deportivo, social, de seguros, de seguridad o de identificación. Solo considerar habilitada la excepción cuando una ley autorice expresamente el tratamiento en casos calificados Y se refiera a alguno de los casos del propio artículo 16 bis. No suavizar esta regla.",
      "No almacenar datos de salud reales.",
    ],
    evidence_required: [
      "Descripción de datos y categoría",
      "Finalidad",
      "Consentimiento expreso cuando corresponda",
      "Ley especial sanitaria y finalidad legal invocada",
      "Decreto de alerta sanitaria",
      "Documentación clínica u operacional abstracta",
      "Fundamento judicial o administrativo",
      "Marco de medicina o asistencia",
      "Norma habilitante",
      "Origen y contexto de recolección",
      "Controles sobre muestras y material biológico",
      "Anonimización de publicaciones cuando corresponda",
      "Registro de razonamiento profesional",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Evaluación de régimen especial de salud y perfil biológico",
    estimated_time: "1.5–4 h por purpose",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 16"),
      basis("cl_ley_19628_2026", "Artículo 16 bis"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: true,
    state_effect: [
      "sensitive.health_biological_status = supported | not_supported",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "sensitive.biometric_assess",
    human_code: "D5.03",
    name: "Evaluar el tratamiento de datos biométricos",
    objective:
      "Determinar si una finalidad que utiliza datos obtenidos mediante tratamiento técnico específico para permitir o confirmar identificación única cumple las condiciones especiales de licitud e información de datos biométricos.",
    trigger_question:
      "¿La finalidad utiliza datos obtenidos mediante tratamiento técnico específico para permitir o confirmar la identificación única de una persona?",
    interlocutors: [
      "Área legal / privacidad",
      "TI / seguridad",
      "Dueño del sistema biométrico",
      "Dueño del proceso",
      "Proveedor cuando corresponda",
    ],
    data_collection_methods: [
      "Recorrido del sistema",
      "Revisión funcional y técnica",
      "Revisión de avisos e información entregada",
      "Análisis jurídico",
      "Registro de razonamiento profesional",
    ],
    steps_operational: [
      "Determinar si el tratamiento corresponde jurídicamente a datos biométricos.",
      "Identificar el sistema biométrico utilizado.",
      "Identificar la finalidad específica.",
      "Identificar el período de utilización.",
      "Verificar cómo se informa al titular la forma de ejercer sus derechos.",
      "Si existe consentimiento, verificar el cumplimiento de la regla del inciso primero del artículo 16.",
      "Verificar la entrega de los cuatro elementos de información específica: sistema biométrico, finalidad específica, período de utilización y forma de ejercer derechos.",
      "Si se pretende tratar sin consentimiento, evaluar exclusivamente las hipótesis permitidas por el inciso segundo del artículo 16 bis.",
      "Documentar la vía y la conclusión profesional.",
      "No confundir un identificador común con dato biométrico si no existe el tratamiento técnico específico dirigido a identificación única.",
      "No almacenar plantillas biométricas ni datos biométricos reales.",
    ],
    evidence_required: [
      "Descripción del sistema",
      "Arquitectura funcional",
      "Finalidad",
      "Período",
      "Aviso e información entregada",
      "Mecanismo de derechos",
      "Documentación de consentimiento",
      "Fundamento del artículo 16 bis cuando no exista consentimiento",
      "Documentación del proveedor o del sistema",
      "Registro de razonamiento profesional",
    ],
    evidence_basis: "agency_standard",
    deliverable:
      "Evaluación de licitud y requisitos del tratamiento biométrico",
    estimated_time: "1–3 h por purpose",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 16"),
      basis("cl_ley_19628_2026", "Artículo 16 bis"),
      basis("cl_ley_19628_2026", "Artículo 16 ter"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: true,
    state_effect: ["sensitive.biometric_status = supported | not_supported"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "minors.processing_assess",
    human_code: "D5.04",
    name: "Evaluar el tratamiento de datos de niños, niñas y adolescentes",
    objective:
      "Determinar si una finalidad que involucra datos personales de niños, niñas o adolescentes respeta las reglas especiales de autorización, interés superior, autonomía progresiva y protección reforzada establecidas en el artículo 16 quáter.",
    trigger_question:
      "¿La finalidad involucra datos personales de niños, niñas o adolescentes y requiere evaluar las reglas especiales aplicables a su tratamiento?",
    interlocutors: [
      "Área legal / privacidad",
      "Dueño del producto o proceso",
      "Educación cuando corresponda",
      "Compliance",
      "UX/producto cuando exista interacción directa",
    ],
    data_collection_methods: [
      "Revisión de política y proceso",
      "Recorrido del flujo",
      "Revisión de consentimiento y autorización",
      "Evaluación jurídica",
      "Registro de razonamiento profesional",
    ],
    steps_operational: [
      "Identificar si la finalidad involucra personas comprendidas por las categorías legales de niño, niña o adolescente, preservando las categorías y umbrales conforme al texto legal sin reformularlos en una taxonomía técnica.",
      "Evaluar el interés superior.",
      "Evaluar el respeto de la autonomía progresiva.",
      "Para niños y niñas, verificar el consentimiento de padres, representantes legales o quien tenga a su cargo el cuidado personal, salvo autorización o mandato legal expreso.",
      "Para adolescentes, evaluar las reglas de autorización aplicables conforme al régimen previsto para adultos.",
      "Aplicar separadamente la regla especial de datos sensibles de adolescentes menores de dieciséis años.",
      "En ese caso, verificar el consentimiento de padres, representantes o cuidado personal salvo autorización o mandato legal expreso.",
      "Identificar la norma legal si se invoca autorización o mandato.",
      "Verificar que exista diseño o procedimiento para distinguir correctamente las reglas anteriores sin almacenar edades o identidades reales en el workspace.",
      "Verificar los mecanismos destinados al uso lícito y la protección reforzada de la información de niños, niñas y adolescentes.",
      "Cuando intervengan establecimientos educacionales u otras entidades o personas que traten o administren estos datos, verificar cómo cumplen su obligación especial de protección.",
      "No almacenar nombre, fecha de nacimiento, edad individual, identidad del representante ni datos reales del menor.",
    ],
    evidence_required: [
      "Diseño del proceso",
      "Reglas de segmentación y autorización",
      "Avisos y formularios",
      "Diseño de consentimiento",
      "Autorización o mandato legal",
      "Políticas para niños, niñas y adolescentes",
      "Controles",
      "Procedimiento educativo cuando corresponda",
      "Análisis profesional",
    ],
    evidence_basis: "agency_standard",
    deliverable:
      "Evaluación del régimen de tratamiento de datos de niños, niñas y adolescentes",
    estimated_time: "1–3 h por purpose",
    complexity: "Alta",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 16 quáter")],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: true,
    state_effect: ["minors.processing_status = supported | not_supported"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "research.public_interest_assess",
    human_code: "D5.05",
    name: "Evaluar tratamientos históricos, estadísticos, científicos y de investigación de interés público",
    objective:
      "Determinar si una finalidad puede acogerse al régimen especial del artículo 16 quinquies y verificar sus condiciones de exclusividad de finalidad, interés público, calidad, seguridad, mitigación de riesgos y anonimización de publicaciones.",
    trigger_question:
      "¿La finalidad pretende tratar datos exclusivamente con fines históricos, estadísticos, científicos o de estudio/investigación y acogerse al régimen especial del artículo 16 quinquies?",
    interlocutors: [
      "Área legal / privacidad",
      "Dueño de la investigación",
      "Datos/ciencia",
      "Seguridad",
      "Gobernanza de investigación cuando corresponda",
    ],
    data_collection_methods: [
      "Revisión de protocolo",
      "Evaluación de finalidad",
      "Revisión de seguridad y calidad",
      "Revisión de evidencia de riesgos",
      "Revisión de publicaciones",
      "Registro de razonamiento profesional",
    ],
    steps_operational: [
      "Identificar la finalidad concreta.",
      "Determinar si corresponde a fines históricos, estadísticos, científicos, estudios o investigaciones.",
      "Verificar que el tratamiento se realice exclusivamente con alguno de dichos fines.",
      "Verificar que el tratamiento atienda fines de interés público.",
      "Documentar la conclusión sobre la existencia del interés legítimo reconocido por el artículo 16 quinquies.",
      "Verificar las medidas de calidad necesarias.",
      "Verificar las medidas de seguridad necesarias.",
      "Comprobar que las medidas resguardan el uso exclusivo para la finalidad especial.",
      "Si intervienen datos personales sensibles: identificar los riesgos posibles y verificar las medidas de reducción o mitigación.",
      "Documentar que el almacenamiento o utilización por período indeterminado solo se considera bajo las condiciones del artículo 16 quinquies.",
      "Si se publican resultados o análisis, verificar la anonimización previa de los datos publicados.",
      "Evitar que una finalidad mixta sea presentada como régimen del artículo 16 quinquies si no satisface la exigencia de exclusividad.",
      "La regla especial de conservación puede ser contexto para la conservación D2; no sobrescribir automáticamente reglas de conservación ni facts canónicos de D2 y no realizar escrituras cross-scope.",
    ],
    evidence_required: [
      "Protocolo o proyecto de investigación",
      "Descripción de finalidad",
      "Justificación de interés público",
      "Mapeo de datos",
      "Medidas de calidad",
      "Medidas de seguridad",
      "Evaluación de riesgos cuando existan sensibles",
      "Medidas de mitigación",
      "Diseño de anonimización",
      "Proceso de publicación",
      "Registro de razonamiento profesional",
    ],
    evidence_basis: "agency_standard",
    deliverable:
      "Evaluación de aplicabilidad y condiciones del régimen del artículo 16 quinquies",
    estimated_time: "1.5–4 h por purpose",
    complexity: "Alta",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 16 quinquies")],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: true,
    state_effect: ["research.public_interest_status = supported | not_supported"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "geolocation.requirements_assess",
    human_code: "D5.06",
    name: "Evaluar requisitos del tratamiento de datos de geolocalización",
    objective:
      "Verificar que una finalidad que trata datos personales de geolocalización utilice una fuente de licitud válida de los artículos 12 o 13 y cumpla los requisitos especiales de información del artículo 16 sexies.",
    trigger_question:
      "¿La finalidad trata datos personales de geolocalización y cumple las condiciones adicionales de licitud e información del artículo 16 sexies?",
    interlocutors: [
      "Área legal / privacidad",
      "Producto",
      "TI/móvil",
      "Dueño del tratamiento",
      "Proveedor o tercero cuando corresponda",
    ],
    data_collection_methods: [
      "Recorrido del flujo",
      "Revisión de avisos",
      "Revisión técnica",
      "Revisión de terceros",
    ],
    steps_operational: [
      "Identificar que la finalidad trata geolocalización.",
      "Confirmar que existe una fuente de licitud evaluada bajo los artículos 12 o 13.",
      "No duplicar ni modificar el fact de licitud de D2.",
      "Verificar información clara, suficiente y oportuna al titular.",
      "Verificar información sobre el tipo de datos de geolocalización tratados.",
      "Verificar información sobre la finalidad.",
      "Verificar información sobre la duración del tratamiento.",
      "Determinar si existe comunicación o cesión a terceros para la prestación de un servicio con valor añadido.",
      "Si existe, verificar que esa circunstancia sea informada.",
      "Documentar las deficiencias y remediaciones.",
      "No almacenar ubicaciones reales.",
    ],
    evidence_required: [
      "Aviso de privacidad",
      "Flujo de permisos",
      "Capturas",
      "Flujo de sistema y datos",
      "Contexto de licitud",
      "Información de conservación y duración",
      "Descripción de intercambio con terceros",
      "Contratos como evidencia contextual cuando corresponda",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Validación de requisitos especiales de geolocalización",
    estimated_time: "0.5–2 h por purpose",
    complexity: "Media",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 12"),
      basis("cl_ley_19628_2026", "Artículo 13"),
      basis("cl_ley_19628_2026", "Artículo 16 sexies"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: [
      "geolocation.requirements_status = satisfied | remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "financial.titleIII_scope",
    human_code: "D5.07",
    name: "Evaluar el ámbito y requisitos del Título III",
    objective:
      "Determinar si la vía de licitud contemplada en el artículo 13 letra a) resulta aplicable a la finalidad por encontrarse materialmente dentro del Título III y verificar que la información y operaciones vinculadas a esa finalidad respeten las restricciones de los artículos 17, 18 y 19.",
    trigger_question:
      "¿La finalidad pretende fundar el tratamiento en la regla del artículo 13 letra a) y las operaciones vinculadas se encuentran efectivamente dentro del ámbito y límites del Título III?",
    interlocutors: [
      "Área legal / privacidad",
      "Finanzas/crédito",
      "Cobranza",
      "Operaciones",
      "Gobernanza de datos",
      "TI",
      "Compliance",
    ],
    data_collection_methods: [
      "Revisión de alcance jurídico",
      "Mapeo de datos y operaciones",
      "Revisión de procedimientos",
      "Matriz de inclusiones y exclusiones",
      "Recorrido de actualización y supresión",
      "Registro de razonamiento profesional",
    ],
    steps_operational: [
      "Confirmar que la ruta jurídica candidata de D2 corresponde al artículo 13 letra a).",
      "Identificar las operaciones y datos vinculados a la finalidad que se pretende amparar.",
      "Determinar si se refieren efectivamente a obligaciones de carácter económico, financiero, bancario o comercial.",
      "Verificar que la información cuya comunicación o tratamiento se pretende justificar está comprendida dentro del ámbito material permitido por el artículo 17.",
      "Distinguir las obligaciones expresamente comunicables de aquellas legalmente excluidas.",
      "Cuando se invoquen otras obligaciones de dinero determinadas mediante decreto supremo, verificar la existencia del decreto, el instrumento de pago o crédito válidamente emitido, el consentimiento expreso del deudor u obligado y la fecha de vencimiento.",
      "Documentar las exclusiones aplicables.",
      "Contemplar la información comunicable y sus exclusiones legales según corresponda: letras de cambio y pagarés protestados; cheques protestados; cumplimiento o incumplimiento de obligaciones derivadas de créditos o préstamos dentro del ámbito legal; otras obligaciones de dinero habilitadas mediante decreto conforme a requisitos legales; exclusiones legales de determinadas obligaciones; tratamiento de obligaciones repactadas, renegociadas, novadas o sujetas a modalidad pendiente; restricciones relativas a servicios básicos; determinadas obligaciones educacionales; determinadas obligaciones de salud; deudas con concesionarios de autopistas; reglas especiales asociadas a cesantía cuando correspondan. No convertir esta lista en taxonomía persistente durante el import.",
      "Verificar la capacidad para suprimir de registros o bases toda información personal relativa a obligaciones prescritas sin requerir solicitud del titular, orden judicial o instrucción de la autoridad.",
      "Verificar que no se comunique información comprendida por el artículo 17 después de transcurridos cinco años desde que la obligación se hizo exigible.",
      "Verificar que no se continúe comunicándola después de haber sido pagada o extinguida por otro modo legal.",
      "Preservar la regla relativa a información requerida por tribunales en juicios pendientes.",
      "Verificar la capacidad para distinguir los efectos del pago o extinción respecto del fundamento o caducidad de los datos de la prohibición de continuar comunicándolos.",
      "Cuando interviene directamente el acreedor, verificar la comunicación del pago o extinción al responsable del registro o base accesible al público dentro del plazo legal aplicable.",
      "Contemplar la alternativa del deudor de requerir directamente la modificación cuando concurran las condiciones legales.",
      "Verificar la actualización de los datos provenientes de la fuente pública una vez comunicado el pago o extinción, aplicando el plazo legal de actualización correspondiente.",
      "Verificar el bloqueo temporal de los datos cuando la actualización no pueda realizarse oportunamente.",
      "Los plazos legales se modelan como capacidad o procedimiento, sin temporizadores operacionales, sin registros de deuda y sin registros de deudores.",
      "No asumir que un dato financiero o económico conduce automáticamente al artículo 13 letra a): la ruta solo puede considerarse soportada cuando el tratamiento queda dentro del ámbito material del Título III.",
      "No almacenar obligaciones o deudas reales de titulares.",
    ],
    evidence_required: [
      "Descripción de finalidad",
      "Análisis de licitud D2",
      "Categorías abstractas de obligaciones",
      "Mapeo de datos y operaciones",
      "Instrumentos y modelos utilizados",
      "Normativa y decretos invocados",
      "Matriz de inclusiones y exclusiones",
      "Procedimiento de prescripción y supresión",
      "Reglas de antigüedad",
      "Procedimiento de pago y extinción",
      "Procedimiento de actualización",
      "Procedimiento de bloqueo",
      "Muestras de evidencia anonimizadas y no reales",
      "Registro de razonamiento profesional",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Evaluación de ámbito material y requisitos del Título III",
    estimated_time: "2–5 h por purpose",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 13 letra a)"),
      basis("cl_ley_19628_2026", "Artículo 17"),
      basis("cl_ley_19628_2026", "Artículo 18"),
      basis("cl_ley_19628_2026", "Artículo 19"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: true,
    state_effect: [
      "financial.titleIII_scope_status = in_scope | out_of_scope",
      "financial.titleIII_requirements_status = satisfied | remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
];

/** Claves en orden canónico D5.01–D5.07. */
export const D5_ACTIVITY_KEYS: string[] = D05_ACTIVITIES.map((a) => a.activity_key);

/**
 * Notas de procedencia del canon D5 (guía de implementación, no campos
 * operativos). Se preservan en la proyección humana D05.md sin modificar
 * el contrato `ActivityDefinition`.
 */
export const D05_PROVENANCE_NOTES: Record<string, string> = {
  "sensitive.lawfulness_assess":
    "La selección y encaje de una excepción del artículo 16 requiere juicio profesional documentado (reasoning_record_required = true). D5.02–D5.05 son contexto relacionado, no dependencias de completitud: el artículo 16 bis contiene rutas propias. GATE DE CAPTURA: la aplicabilidad conceptual vive en trigger, objetivo y pasos; no existen facts canónicos ni taxonomía machine-readable para resolverla (ver auditoría de captura diferida antes de los protocolos).",
  "sensitive.health_biological_assess":
    "Regla de consentimiento congelada: con consentimiento expreso del inciso primero del artículo 16, salud y perfil biológico solo pueden tratarse para los fines previstos por leyes especiales en materia sanitaria; la evidencia debe identificar la norma realmente invocada. La prohibición sobre muestras y material biológico recolectados en ámbitos laboral, educativo, deportivo, social, de seguros, de seguridad o de identificación solo cede ante ley expresa referida a casos del propio artículo 16 bis.",
  "sensitive.biometric_assess":
    "Dato biométrico exige tratamiento técnico específico dirigido a identificación única; no confundir con identificadores comunes. Sin consentimiento solo operan las hipótesis del inciso segundo del artículo 16 bis. La información específica de cuatro elementos (sistema, finalidad, período, ejercicio de derechos) es verificable sin almacenar plantillas ni datos reales.",
  "minors.processing_assess":
    "Preservar categorías y umbrales del artículo 16 quáter conforme al texto legal, incluida la regla especial de sensibles de adolescentes menores de dieciséis años. El diseño debe distinguir las reglas sin almacenar edades ni identidades reales. No todo dato de NNA es sensible: sin dependencia rígida a D5.01.",
  "research.public_interest_assess":
    "Exclusividad de finalidad e interés público requieren análisis profesional. El almacenamiento o utilización por período indeterminado solo se considera bajo las condiciones del artículo 16 quinquies; las publicaciones exigen anonimización previa. La mitigación de riesgos de esta actividad no reemplaza una futura EIPD (sin dependencia a D8) y no sobrescribe conservación ni facts de D2.",
  "geolocation.requirements_assess":
    "Verificación de requisitos adicionales sin redefinir la licitud general: la fuente de los artículos 12 o 13 se consume como contexto D2 sin duplicar ni modificar su fact. Sin juicio profesional (reasoning_record_required = false).",
  "financial.titleIII_scope":
    "Determinar el ámbito material no se reduce a un booleano mecánico (reasoning_record_required = true). La relación D2.05 → D5.07 vive únicamente en D2.05; sin dependencia inversa (sin ciclo). Los plazos de los artículos 18 y 19 se modelan como capacidad o procedimiento, sin temporizadores ni registros individuales. La lista operacional del artículo 17 no es taxonomía persistente.",
};
