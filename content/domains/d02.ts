import type { ActivityDefinition } from "../../src/types";
import { basis } from "../sources";

/**
 * CANONICAL SOURCE OF TRUTH — D2 Inventario, licitud y ciclo de vida.
 * Única fuente estructurada de las 12 actividades D2. Contenido aprobado
 * textualmente por la iteración vigente; no inventar, completar ni
 * reinterpretar. `docs/domains/D02.md` es una proyección humana generada
 * desde esta representación (ver `npm run content:docs`).
 * La aplicación consume estas definiciones; no las duplica.
 *
 * Reglas conceptuales preservadas:
 * - licitud por finalidad (`treatment.purposes[]` / `purpose.lawful_basis[]`);
 * - inventario maestro como estándar metodológico, no RAT universal;
 * - consentimiento: D2 determina aplicabilidad, D3 administra el mecanismo;
 * - categorías especiales: D2 licitud general, D5 análisis adicional.
 */

const REVIEW = "2026-09-21";
const TRANSITIONAL = "transitional" as const;

export const D02_ACTIVITIES: ActivityDefinition[] = [
  {
    activity_key: "treatment.inventory_create",
    human_code: "D2.01",
    name: "Crear inventario maestro de tratamientos",
    objective:
      "Construir una fuente estructurada de trazabilidad de las operaciones de tratamiento del cliente que permita relacionar finalidades, actores, datos, titulares, fuentes, flujos y obligaciones aplicables.",
    trigger_question:
      "¿Las operaciones de tratamiento relevantes del cliente están identificadas de forma estructurada y trazable?",
    interlocutors: [
      "Responsables de procesos",
      "Dueños de sistemas",
      "TI",
      "Asesoría jurídica",
      "Recursos Humanos",
      "Comercial",
      "Operaciones",
      "DPO, si existe",
    ],
    data_collection_methods: [
      "Entrevistas",
      "Talleres",
      "Revisión documental",
      "Revisión de sistemas",
      "Walkthrough de procesos",
      "Encuestas estructuradas cuando resulte útil",
    ],
    steps_operational: [
      "Identificar procesos de negocio que impliquen tratamiento de datos personales.",
      "Asignar un treatment_id estable a cada operación o conjunto coherente de operaciones.",
      "Registrar denominación y descripción operacional.",
      "Relacionar titulares, categorías de datos, actores, sistemas, fuentes y flujos conocidos.",
      "Registrar finalidades y demás atributos mediante las actividades especializadas de D2.",
      "Mantener trazabilidad entre el inventario y las evidencias utilizadas para construirlo.",
    ],
    evidence_required: [
      "Inventario Maestro de Tratamientos",
      "Relación de procesos y sistemas revisados",
      "Evidencia de levantamiento",
      "Identificadores estables de tratamientos",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Inventario Maestro de Tratamientos",
    estimated_time: "Variable según cantidad y complejidad de tratamientos",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículos 3, 14 y 14 ter"),
    ],
    applicable_role: ["responsible", "processor"],
    conditions_applicability: [
      "client has at least one personal_data_processing_operation",
    ],
    reasoning_record_required: false,
    state_effect: [
      "treatment_inventory.status = established",
      "create treatment_id for each identified treatment",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [],
  },
  {
    activity_key: "treatment.actor_roles",
    human_code: "D2.02",
    name: "Identificar actores y roles por tratamiento",
    objective:
      "Determinar quién decide los fines y medios de cada tratamiento y registrar los roles que corresponden a cada actor, evitando asignar un único rol global a toda la organización.",
    trigger_question:
      "¿Están identificados los actores de cada tratamiento y el rol que cada uno desempeña en esa operación específica?",
    interlocutors: [
      "Responsables de procesos",
      "Asesoría jurídica",
      "Compras",
      "TI",
      "Gestión de proveedores",
      "DPO, si existe",
    ],
    data_collection_methods: [
      "Entrevista",
      "Revisión contractual",
      "Revisión de flujos",
      "Revisión documental",
    ],
    steps_operational: [
      "Identificar las organizaciones o personas que intervienen en el tratamiento.",
      "Determinar quién decide fines y medios.",
      "Determinar quién trata datos por cuenta de otro actor.",
      "Registrar el rol por actor y por tratamiento.",
      "Preservar la posibilidad de que el mismo cliente tenga roles diferentes en tratamientos distintos.",
      "Registrar evidencia utilizada para justificar la clasificación.",
    ],
    evidence_required: [
      "Matriz de actores por tratamiento",
      "Rol asignado a cada actor",
      "Contratos o antecedentes revisados",
      "Evidencia de clasificación",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Matriz de Actores y Roles por Tratamiento",
    estimated_time: "0,5–2 h por tratamiento",
    complexity: "Alta",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 2")],
    applicable_role: ["responsible", "processor"],
    conditions_applicability: ["treatment exists"],
    reasoning_record_required: true,
    state_effect: [
      "actor.role_current = determined for treatment",
      "initialize actor.role_history when applicable",
    ],
    relationship_effect: [
      "processor_relationship identified when actor role = processor",
    ],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [
      {
        target_activity_key: "treatment.inventory_create",
        scope: "same_domain",
        type: "execution_prerequisite",
        condition: "treatment exists",
        rationale:
          "El rol se determina respecto de una operación de tratamiento identificada.",
      },
    ],
  },
  {
    activity_key: "treatment.purpose_define",
    human_code: "D2.03",
    name: "Definir finalidades del tratamiento",
    objective:
      "Identificar y documentar finalidades específicas, explícitas y lícitas para cada tratamiento, manteniéndolas separadas cuando una misma operación persiga más de un propósito.",
    trigger_question:
      "¿Cada uso de los datos responde a una finalidad específica, explícita y lícita que pueda explicarse y justificarse?",
    interlocutors: [
      "Dueño del proceso",
      "Asesoría jurídica",
      "DPO, si existe",
      "Producto o comercial cuando corresponda",
    ],
    data_collection_methods: [
      "Entrevista",
      "Revisión documental",
      "Revisión de formularios",
      "Revisión de procesos",
    ],
    steps_operational: [
      "Identificar por qué se recolectan o utilizan los datos.",
      "Separar finalidades materialmente distintas.",
      "Evitar formulaciones excesivamente genéricas que impidan evaluar necesidad o licitud.",
      "Relacionar cada finalidad con las categorías de datos utilizadas.",
      "Registrar las finalidades en el tratamiento correspondiente.",
    ],
    evidence_required: [
      "Registro de finalidades por tratamiento",
      "Evidencia del proceso que origina cada finalidad",
      "Relación finalidad-datos",
    ],
    evidence_basis: "legal_requirement",
    deliverable: "Matriz de Finalidades por Tratamiento",
    estimated_time: "0,5–1,5 h por tratamiento",
    complexity: "Media-Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 3 letra b)"),
      basis("cl_ley_19628_2026", "Artículo 14 letra b)"),
      basis("cl_ley_19628_2026", "Artículo 14 ter letra d)"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: ["actor.role_current = responsible"],
    reasoning_record_required: false,
    state_effect: ["treatment.purposes = defined"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [
      {
        target_activity_key: "treatment.inventory_create",
        scope: "same_domain",
        type: "execution_prerequisite",
        condition: "treatment exists",
        rationale:
          "Las finalidades se registran respecto de un tratamiento identificado.",
      },
    ],
  },
  {
    activity_key: "treatment.source_traceability",
    human_code: "D2.04",
    name: "Trazar origen y fuente de los datos",
    objective:
      "Identificar de dónde provienen los datos utilizados en cada tratamiento y verificar que su recolección tenga un origen lícito y trazable.",
    trigger_question:
      "¿Se conoce y puede acreditarse de qué fuente provienen los datos tratados?",
    interlocutors: [
      "Dueño del proceso",
      "TI",
      "Comercial",
      "Recursos Humanos",
      "Proveedores",
      "Asesoría jurídica",
    ],
    data_collection_methods: [
      "Entrevista",
      "Revisión de formularios",
      "Revisión de integraciones",
      "Revisión documental",
      "Muestreo de registros",
    ],
    steps_operational: [
      "Identificar si los datos provienen directamente del titular, de otra organización, de fuentes públicas u otra fuente.",
      "Registrar la fuente por categoría de datos cuando resulte necesario.",
      "Verificar que la fuente pueda ser utilizada lícitamente.",
      "Identificar expresamente cuando se trate de una fuente de acceso público.",
      "Preservar evidencia del origen para transparencia y ejercicio de derechos.",
    ],
    evidence_required: [
      "Registro de fuentes por tratamiento",
      "Evidencia de procedencia",
      "Identificación de fuentes de acceso público cuando corresponda",
      "Integraciones o terceros de origen identificados",
    ],
    evidence_basis: "legal_requirement",
    deliverable: "Matriz de Origen y Trazabilidad de Datos",
    estimated_time: "0,5–2 h por tratamiento",
    complexity: "Media-Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 2"),
      basis("cl_ley_19628_2026", "Artículo 14 letra b)"),
      basis("cl_ley_19628_2026", "Artículo 14 ter letra j)"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: ["actor.role_current = responsible"],
    reasoning_record_required: false,
    state_effect: ["treatment.source_traceability_status = documented"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [
      {
        target_activity_key: "treatment.inventory_create",
        scope: "same_domain",
        type: "execution_prerequisite",
        condition: "treatment exists",
        rationale:
          "La trazabilidad se registra respecto del tratamiento identificado.",
      },
    ],
  },
  {
    activity_key: "lawful_basis.assign",
    human_code: "D2.05",
    name: "Asignar base de licitud por finalidad",
    objective:
      "Determinar y documentar la fuente de licitud aplicable a cada finalidad del tratamiento, evitando asignar una única base jurídica global cuando existen finalidades distintas.",
    trigger_question:
      "¿Cada finalidad del tratamiento cuenta con una fuente de licitud aplicable que el responsable puede acreditar?",
    interlocutors: [
      "Asesoría jurídica",
      "Dueño del proceso",
      "DPO, si existe",
      "Compliance",
    ],
    data_collection_methods: [
      "Revisión legal",
      "Entrevista",
      "Revisión contractual",
      "Revisión de finalidad",
      "Revisión de consentimiento cuando corresponda",
    ],
    steps_operational: [
      "Analizar cada finalidad por separado.",
      "Determinar si la licitud deriva del consentimiento del titular.",
      "Si no depende de consentimiento, evaluar las fuentes previstas en el artículo 13.",
      "Distinguir obligación legal, contrato o medidas precontractuales, interés legítimo, defensa de derechos y tratamientos económicos-financieros sujetos al Título III.",
      "Cuando se considere interés legítimo, derivar a su evaluación específica.",
      "Cuando se utilice consentimiento, derivar su implementación y prueba a D3.",
      "Cuando existan categorías sujetas a régimen especial, conservar la necesidad de la evaluación adicional D5.",
      "Registrar la base correspondiente por finalidad y su evidencia.",
    ],
    evidence_required: [
      "Matriz finalidad-base de licitud",
      "Norma, contrato, consentimiento o antecedente justificativo",
      "Evaluación específica cuando corresponda",
    ],
    evidence_basis: "legal_requirement",
    deliverable: "Matriz de Licitud por Finalidad",
    estimated_time: "0,5–2 h por finalidad",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 3 letra a)"),
      basis("cl_ley_19628_2026", "Artículos 12 y 13"),
      basis("cl_ley_19628_2026", "Artículo 14 letra a)"),
      basis("cl_ley_19628_2026", "Artículo 14 ter letra d)"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: [
      "actor.role_current = responsible",
      "treatment.purposes defined",
    ],
    reasoning_record_required: false,
    state_effect: [
      "purpose.lawful_basis = assigned",
      "treatment.lawfulness_status = determined when every active purpose has valid basis",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [
      {
        target_activity_key: "treatment.purpose_define",
        scope: "same_domain",
        type: "execution_prerequisite",
        condition: "purpose exists",
        rationale: "La base de licitud se asigna por finalidad.",
      },
      {
        target_activity_key: "legitimate_interest.assessment",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "candidate lawful basis = legitimate_interest",
        rationale:
          "El interés legítimo solo puede sostener la finalidad cuando supera su evaluación específica.",
      },
      {
        target_activity_key: "consent.mechanism_design",
        scope: "cross_domain",
        type: "completion_dependency",
        condition: "lawful basis = consent",
        rationale:
          "Cuando la finalidad depende del consentimiento, D3 debe implementar un mecanismo válido y demostrable.",
      },
      {
        target_activity_key: "sensitive.lawfulness_assess",
        scope: "cross_domain",
        type: "completion_dependency",
        condition:
          "processing includes data requiring special-category legality assessment",
        rationale:
          "La licitud general no reemplaza las reglas especiales aplicables a determinadas categorías de datos.",
      },
      {
        target_activity_key: "financial.titleIII_scope",
        scope: "cross_domain",
        type: "completion_dependency",
        condition: "candidate lawful basis relies on Article 13(a) / Title III",
        rationale:
          "La fuente de licitud económica-financiera solo opera dentro del ámbito material del Título III.",
      },
    ],
  },
  {
    activity_key: "legitimate_interest.assessment",
    human_code: "D2.06",
    name: "Evaluar interés legítimo",
    objective:
      "Determinar si una finalidad puede sustentarse en un interés legítimo del responsable o de un tercero, verificando su necesidad y que el tratamiento no afecte los derechos y libertades del titular.",
    trigger_question:
      "¿El tratamiento es necesario para satisfacer un interés legítimo y puede realizarse sin afectar los derechos y libertades del titular?",
    interlocutors: [
      "Asesoría jurídica",
      "Dueño del proceso",
      "DPO, si existe",
      "Compliance",
    ],
    data_collection_methods: [
      "Análisis jurídico",
      "Entrevista",
      "Revisión de proceso",
      "Revisión de riesgos",
      "Revisión de alternativas",
    ],
    steps_operational: [
      "Definir concretamente el interés perseguido por el responsable o tercero.",
      "Verificar que el tratamiento sea necesario para satisfacer ese interés.",
      "Identificar los derechos y libertades del titular que podrían resultar afectados.",
      "Examinar alternativas menos intrusivas razonablemente disponibles.",
      "Identificar salvaguardas que reduzcan impactos.",
      "Determinar si la base puede sostener válidamente la finalidad.",
      "Documentar hechos, factores, alternativas y conclusión mediante reasoning_record.",
    ],
    evidence_required: [
      "Reasoning Record de interés legítimo",
      "Antecedentes del interés",
      "Análisis de necesidad",
      "Evaluación de efectos sobre titulares",
      "Alternativas consideradas",
      "Salvaguardas",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Evaluación Documentada de Interés Legítimo",
    estimated_time: "1–4 h por finalidad",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 13 letra d)"),
      basis("cl_ley_19628_2026", "Artículo 14 ter letra d)"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: ["candidate lawful basis = legitimate_interest"],
    reasoning_record_required: true,
    state_effect: [
      "purpose.legitimate_interest_outcome = supports_basis | remediation_required | does_not_support_basis",
      "If outcome = does_not_support_basis: legitimate_interest cannot be assigned as lawful basis for that purpose",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [
      {
        target_activity_key: "treatment.purpose_define",
        scope: "same_domain",
        type: "input_dependency",
        condition: "purpose exists",
        rationale:
          "El interés y su necesidad deben evaluarse respecto de una finalidad determinada.",
      },
    ],
  },
  {
    activity_key: "data.minimization_review",
    human_code: "D2.07",
    name: "Revisar proporcionalidad y minimización de datos",
    objective:
      "Verificar que las categorías y campos de datos tratados sean estrictamente necesarios, adecuados y pertinentes respecto de cada finalidad.",
    trigger_question:
      "¿Se están tratando únicamente los datos necesarios, adecuados y pertinentes para las finalidades declaradas?",
    interlocutors: [
      "Dueño del proceso",
      "TI",
      "Producto",
      "Asesoría jurídica",
      "DPO, si existe",
    ],
    data_collection_methods: [
      "Revisión de formularios",
      "Revisión de campos",
      "Revisión de sistemas",
      "Muestreo",
      "Entrevista",
    ],
    steps_operational: [
      "Relacionar cada categoría o campo relevante con una finalidad.",
      "Identificar datos que no sean necesarios, adecuados o pertinentes.",
      "Cuestionar recolecciones opcionales o históricas sin justificación vigente.",
      "Definir eliminación, reducción o cese de recolección cuando corresponda.",
      "Registrar brechas y acciones de remediación.",
    ],
    evidence_required: [
      "Matriz dato-finalidad",
      "Registro de campos revisados",
      "Brechas detectadas",
      "Evidencia de eliminación o reducción cuando corresponda",
    ],
    evidence_basis: "legal_requirement",
    deliverable: "Revisión de Minimización y Proporcionalidad",
    estimated_time: "1–4 h por tratamiento",
    complexity: "Media-Alta",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 3 letra c)")],
    applicable_role: ["responsible"],
    conditions_applicability: ["actor.role_current = responsible"],
    reasoning_record_required: false,
    state_effect: ["treatment.minimization_status = conform | remediation_required"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [
      {
        target_activity_key: "treatment.purpose_define",
        scope: "same_domain",
        type: "input_dependency",
        condition: "purposes defined",
        rationale:
          "La necesidad y pertinencia solo pueden juzgarse respecto de finalidades definidas.",
      },
    ],
  },
  {
    activity_key: "retention.schedule",
    human_code: "D2.08",
    name: "Definir conservación, supresión y anonimización",
    objective:
      "Definir criterios verificables de conservación para que los datos no permanezcan identificables más tiempo del necesario para sus finalidades, salvo autorización legal o consentimiento que justifique un período mayor.",
    trigger_question:
      "¿Cada conjunto relevante de datos cuenta con un criterio de conservación y un destino definido al finalizar el período necesario?",
    interlocutors: [
      "Dueño del proceso",
      "Asesoría jurídica",
      "TI",
      "Gestión documental",
      "DPO, si existe",
    ],
    data_collection_methods: [
      "Revisión legal",
      "Revisión documental",
      "Revisión de sistemas",
      "Entrevista",
      "Muestreo",
    ],
    steps_operational: [
      "Relacionar conservación con finalidad.",
      "Identificar obligaciones legales que exijan conservación.",
      "Definir período o criterio de término cuando no exista un plazo legal fijo.",
      "Identificar casos en que un período superior se apoye en autorización legal o consentimiento.",
      "Definir evento de supresión o anonimización.",
      "Asignar responsables operacionales para ejecutar el criterio.",
      "Documentar excepciones y evidencia.",
    ],
    evidence_required: [
      "Matriz de conservación",
      "Fundamentos legales cuando correspondan",
      "Reglas de supresión o anonimización",
      "Responsables",
      "Evidencia de configuración o ejecución cuando corresponda",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Matriz de Conservación, Supresión y Anonimización",
    estimated_time: "2–6 h",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 3 letra c)"),
      basis("cl_ley_19628_2026", "Artículo 14 ter letra i)"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: ["actor.role_current = responsible"],
    reasoning_record_required: false,
    state_effect: ["treatment.retention_status = defined"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "treatment.purpose_define",
        scope: "same_domain",
        type: "input_dependency",
        condition: "purposes defined",
        rationale: "La duración necesaria se determina respecto de la finalidad.",
      },
      {
        target_activity_key: "lawful_basis.assign",
        scope: "same_domain",
        type: "input_dependency",
        condition:
          "retention relies on legal authorization, consent or another continuing legal basis",
        rationale: "La justificación de períodos superiores debe quedar trazable.",
      },
    ],
  },
  {
    activity_key: "data.quality_control",
    human_code: "D2.09",
    name: "Controlar calidad y actualización de datos",
    objective:
      "Mantener datos exactos, completos, actuales y pertinentes respecto de su origen y finalidad, identificando mecanismos para detectar y corregir deterioro de calidad.",
    trigger_question:
      "¿Existen controles razonables para detectar datos inexactos, incompletos, desactualizados o no pertinentes?",
    interlocutors: [
      "Dueño del proceso",
      "TI",
      "Operaciones",
      "Atención de titulares",
      "DPO, si existe",
    ],
    data_collection_methods: [
      "Muestreo",
      "Revisión de sistemas",
      "Entrevista",
      "Revisión de reglas de actualización",
      "Revisión de incidencias",
    ],
    steps_operational: [
      "Identificar datos cuyo deterioro de calidad pueda afectar al titular o al proceso.",
      "Revisar exactitud, completitud, actualidad y pertinencia mediante muestra o controles disponibles.",
      "Identificar fuentes de actualización.",
      "Definir corrección o depuración cuando corresponda.",
      "Coordinar con el proceso de rectificación de titulares cuando resulte aplicable.",
      "Registrar resultados y remediaciones.",
    ],
    evidence_required: [
      "Resultado de revisión o muestreo",
      "Reglas de actualización",
      "Incidencias detectadas",
      "Evidencia de corrección",
    ],
    evidence_basis: "legal_requirement",
    deliverable: "Control de Calidad de Datos",
    estimated_time: "1–4 h por tratamiento",
    complexity: "Media",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 3 letra d)"),
      basis("cl_ley_19628_2026", "Artículo 14 letra c)"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: ["actor.role_current = responsible"],
    reasoning_record_required: false,
    state_effect: ["treatment.data_quality_status = conform | remediation_required"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "monitoring",
    activity_dependencies: [
      {
        target_activity_key: "treatment.source_traceability",
        scope: "same_domain",
        type: "input_dependency",
        condition: "source information available",
        rationale: "La calidad se evalúa también respecto de la proveniencia del dato.",
      },
    ],
  },
  {
    activity_key: "precontractual_data.cleanup",
    human_code: "D2.10",
    name: "Depurar datos obtenidos para medidas precontractuales",
    objective:
      "Identificar y gestionar la supresión o anonimización de datos obtenidos para ejecutar medidas precontractuales, evitando mantener esa base como justificación una vez que deja de corresponder.",
    trigger_question:
      "¿Existen datos obtenidos específicamente para medidas precontractuales que requieren supresión, anonimización o reclasificación del tratamiento posterior?",
    interlocutors: [
      "Comercial",
      "Asesoría jurídica",
      "Dueño del proceso",
      "TI",
      "DPO, si existe",
    ],
    data_collection_methods: [
      "Revisión de formularios",
      "Revisión de procesos comerciales",
      "Revisión contractual",
      "Revisión de sistemas",
      "Muestreo",
    ],
    steps_operational: [
      "Identificar datos obtenidos específicamente para ejecutar medidas precontractuales solicitadas por el titular.",
      "Determinar si el tratamiento actual continúa apoyándose únicamente en esa situación precontractual.",
      "Cuando exista un tratamiento posterior con finalidad y fuente de licitud diferente, registrarlo expresamente como tal.",
      "Suprimir o anonimizar los datos que permanezcan únicamente bajo el supuesto precontractual cuando corresponda aplicar la obligación específica de depuración.",
      "Registrar evidencia de la acción realizada.",
    ],
    evidence_required: [
      "Identificación de datos precontractuales",
      "Evaluación de continuidad del tratamiento",
      "Evidencia de supresión o anonimización",
      "Nueva base documentada cuando exista un tratamiento posterior independiente",
    ],
    evidence_basis: "legal_requirement",
    deliverable: "Registro de Depuración de Datos Precontractuales",
    estimated_time: "1–3 h",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 13 letra c)"),
      basis("cl_ley_19628_2026", "Artículo 14 letra d)"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: [
      "personal data obtained for requested precontractual measures = yes",
    ],
    reasoning_record_required: true,
    state_effect: [
      "precontractual_data.cleanup_status = not_required | pending | completed",
      "If later processing has separate purpose and lawful basis: preserve as separately justified processing",
      "If no separate justification exists: suppress or anonymize as applicable",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "lawful_basis.assign",
        scope: "same_domain",
        type: "input_dependency",
        condition: "later processing may rely on another lawful basis",
        rationale:
          "Debe distinguirse el supuesto precontractual de un eventual tratamiento posterior con justificación propia.",
      },
      {
        target_activity_key: "retention.schedule",
        scope: "same_domain",
        type: "input_dependency",
        condition: "retention rules exist",
        rationale:
          "La depuración debe mantenerse coherente con las reglas generales de conservación.",
      },
    ],
  },
  {
    activity_key: "treatment.change_review",
    human_code: "D2.11",
    name: "Revisar cambios del tratamiento",
    objective:
      "Reevaluar un tratamiento cuando cambien sus finalidades, datos, fuentes, actores, medios, tecnología u otras condiciones que puedan alterar su licitud u obligaciones aplicables.",
    trigger_question:
      "¿El tratamiento cambió de manera que sea necesario reevaluar su finalidad, licitud, proporcionalidad, conservación u obligaciones relacionadas?",
    interlocutors: [
      "Dueño del proceso",
      "DPO, si existe",
      "Asesoría jurídica",
      "TI",
      "Producto",
      "Compliance",
    ],
    data_collection_methods: [
      "Revisión de cambio",
      "Entrevista",
      "Comparación antes/después",
      "Revisión documental",
      "Revisión de sistemas",
    ],
    steps_operational: [
      "Registrar el cambio y su fecha.",
      "Identificar qué atributos del tratamiento fueron modificados.",
      "Revisar si existe una finalidad nueva o modificada.",
      "Cuando se pretenda un uso distinto, determinar si resulta compatible con la finalidad original o requiere otra justificación admitida.",
      "Reevaluar base de licitud cuando corresponda.",
      "Revisar minimización, conservación, calidad, actores y fuentes afectados.",
      "Actualizar el inventario y disparar la recomputación de obligaciones y flags dependientes.",
      "Documentar el juicio profesional cuando el cambio requiera interpretación.",
    ],
    evidence_required: [
      "Registro de cambio",
      "Comparación de condición anterior y nueva",
      "Evaluación de impacto sobre finalidad y licitud",
      "Actualización de inventario",
      "Reasoning Record cuando corresponda",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Revisión de Cambio de Tratamiento",
    estimated_time: "1–4 h",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 3 letras a), b), c), d) y e)"),
      basis("cl_ley_19628_2026", "Artículo 14"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: ["material treatment change detected"],
    reasoning_record_required: true,
    state_effect: [
      "treatment.change_review_status = completed",
      "update affected treatment attributes",
      "recompute applicability",
      "recompute derived_flags",
      "recompute affected obligations",
    ],
    relationship_effect: [
      "review affected third-party relationships when actors or flows changed",
    ],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [
      {
        target_activity_key: "treatment.inventory_create",
        scope: "same_domain",
        type: "execution_prerequisite",
        condition: "treatment exists",
        rationale:
          "La revisión compara el tratamiento existente con su nueva condición.",
      },
    ],
  },
  {
    activity_key: "inventory.periodic_revalidation",
    human_code: "D2.12",
    name: "Revalidar periódicamente el inventario de tratamientos",
    objective:
      "Comprobar de forma periódica que el inventario siga representando la realidad operacional y que roles, finalidades, fuentes, bases de licitud, datos, conservación y calidad permanezcan actualizados.",
    trigger_question:
      "¿El inventario refleja actualmente cómo la organización trata realmente los datos personales?",
    interlocutors: [
      "Dueños de procesos",
      "DPO, si existe",
      "TI",
      "Asesoría jurídica",
      "Compliance",
    ],
    data_collection_methods: [
      "Revisión periódica",
      "Entrevista",
      "Muestreo",
      "Comparación documental",
      "Revisión de cambios",
    ],
    steps_operational: [
      "Seleccionar los tratamientos a revalidar según el plan de revisión.",
      "Confirmar que el proceso continúa existiendo.",
      "Revalidar actores y roles.",
      "Revalidar finalidades.",
      "Revalidar fuentes y categorías de datos.",
      "Revalidar bases de licitud.",
      "Revisar minimización, conservación y calidad.",
      "Identificar tratamientos nuevos o no documentados.",
      "Actualizar el inventario y abrir remediaciones cuando corresponda.",
    ],
    evidence_required: [
      "Registro de revalidación",
      "Tratamientos revisados",
      "Cambios detectados",
      "Inventario actualizado",
      "Hallazgos o remediaciones",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Revalidación del Inventario de Tratamientos",
    estimated_time: "Variable según alcance",
    complexity: "Media-Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 3 letra e)"),
      basis("cl_ley_19628_2026", "Artículo 14"),
    ],
    applicable_role: ["responsible", "processor"],
    conditions_applicability: ["treatment inventory exists"],
    reasoning_record_required: false,
    state_effect: [
      "treatment_inventory.last_revalidated_at = review date",
      "treatment_inventory.status = current | remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "monitoring",
    activity_dependencies: [
      {
        target_activity_key: "treatment.inventory_create",
        scope: "same_domain",
        type: "execution_prerequisite",
        condition: "treatment inventory exists",
        rationale: "Solo puede revalidarse un inventario previamente establecido.",
      },
    ],
  },
];

/** Claves en orden canónico D2.01–D2.12. */
export const D2_ACTIVITY_KEYS: string[] = D02_ACTIVITIES.map((a) => a.activity_key);

/**
 * Notas de procedencia del prompt D2 (guía de implementación, no campos
 * operativos). Se preservan en la proyección humana D02.md sin modificar
 * el contrato `ActivityDefinition`.
 */
export const D02_PROVENANCE_NOTES: Record<string, string> = {
  "treatment.inventory_create":
    "La existencia del inventario maestro como artefacto formal es un estándar metodológico de la agencia. No lo presentes como una obligación universal de mantener un RAT.",
  "legitimate_interest.assessment":
    "El `reasoning_record` y la metodología documentada son estándar de la agencia para acreditar el juicio profesional. No los presentes como un formato documental expresamente prescrito por la ley.",
  "retention.schedule":
    "El artefacto formal `Matriz de Conservación` es estándar metodológico. La limitación temporal y las condiciones de conservación derivan de la ley.",
  "inventory.periodic_revalidation":
    "La periodicidad formal y este artefacto de revalidación son estándares metodológicos de la agencia. No presentes una frecuencia anual o fija como obligación textual de la ley.",
};
