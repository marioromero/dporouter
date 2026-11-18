export interface TriageOption {
  id: string;
  label: string;
}

export interface TriageQuestion {
  id: string;
  title: string;
  prompt: string;
  responseIds: readonly string[];
  help?: string;
}

export const QUESTION_IDS = {
  activity: "T01_economic_activity",
  size: "T02_company_size",
  people: "T02_worker_count",
  scopeCount: "T03_people_scope",
  scopeDiversity: "T03_treatment_diversity",
  groups: "T04_people_groups",
  characteristics: "T05_operation_characteristics",
  roles: "T06_processing_roles",
  thirdParties: "T07_external_relationships",
  territory: "T08_territorial_scope",
} as const;

export const TRIAGE_QUESTIONS: readonly TriageQuestion[] = [
  {
    id: "T01",
    title: "Actividad económica",
    prompt: "¿A qué actividades económicas se dedica la empresa?",
    responseIds: [QUESTION_IDS.activity],
  },
  {
    id: "T02",
    title: "Tamaño de la empresa",
    prompt: "¿Cuál es el tamaño aproximado de la empresa según sus ventas anuales?",
    responseIds: [QUESTION_IDS.size, QUESTION_IDS.people],
    help: "Tramos de referencia general conforme a la Ley 20.416; no constituyen una certificación de clasificación tributaria y pueden existir condiciones y excepciones legales.",
  },
  {
    id: "T03",
    title: "Alcance de los tratamientos",
    prompt: "¿Qué alcance tienen aproximadamente las operaciones con datos personales?",
    responseIds: [QUESTION_IDS.scopeCount, QUESTION_IDS.scopeDiversity],
  },
  {
    id: "T04",
    title: "Grupos de personas",
    prompt: "¿De qué grupos de personas trata datos personales la empresa?",
    responseIds: [QUESTION_IDS.groups],
  },
  {
    id: "T05",
    title: "Características generales de las operaciones",
    prompt: "¿Cuáles de estas características describen las operaciones de la empresa?",
    responseIds: [QUESTION_IDS.characteristics],
  },
  {
    id: "T06",
    title: "Participación en tratamientos de datos",
    prompt: "¿Cómo participa habitualmente la empresa en el tratamiento de datos personales?",
    responseIds: [QUESTION_IDS.roles],
    help: "Una empresa puede desempeñar funciones diferentes según cada operación. Esta respuesta es solamente una caracterización general.",
  },
  {
    id: "T07",
    title: "Relaciones con terceros",
    prompt: "¿Qué tipos de relaciones externas intervienen en las operaciones con datos personales?",
    responseIds: [QUESTION_IDS.thirdParties],
  },
  {
    id: "T08",
    title: "Dimensión territorial e internacional",
    prompt: "¿Qué situaciones describen el alcance territorial de las operaciones de la empresa?",
    responseIds: [QUESTION_IDS.territory],
  },
] as const;

export const OPTIONS = {
  companySize: [
    { id: "micro", label: "Microempresa — hasta 2.400 UF anuales" },
    { id: "small", label: "Pequeña empresa — más de 2.400 y hasta 25.000 UF" },
    { id: "medium", label: "Mediana empresa — más de 25.000 y hasta 100.000 UF" },
    { id: "large", label: "Gran empresa — más de 100.000 UF" },
    { id: "no_sales", label: "Sin ventas o sin antecedentes de ventas" },
    { id: "unknown", label: "No tengo esta información" },
  ],
  workerCount: [
    { id: "none", label: "Ninguna persona contratada" },
    { id: "1_9", label: "1–9" },
    { id: "10_49", label: "10–49" },
    { id: "50_199", label: "50–199" },
    { id: "200_999", label: "200–999" },
    { id: "1000_plus", label: "1.000 o más" },
    { id: "unknown", label: "No lo sé" },
  ],
  scopeCount: [
    { id: "under_100", label: "Menos de 100" },
    { id: "100_999", label: "100–999" },
    { id: "1000_9999", label: "1.000–9.999" },
    { id: "10000_99999", label: "10.000–99.999" },
    { id: "100000_plus", label: "100.000 o más" },
    { id: "unknown", label: "No lo sé" },
  ],
  scopeDiversity: [
    { id: "one", label: "Principalmente una operación o finalidad" },
    { id: "several", label: "Varias operaciones o finalidades claramente diferenciadas" },
    { id: "many", label: "Numerosas operaciones en distintas áreas o unidades" },
    { id: "unknown", label: "No lo sé" },
  ],
  peopleGroups: [
    { id: "customers", label: "Clientes o consumidores" },
    { id: "service_users", label: "Usuarios de servicios o plataformas" },
    { id: "workers", label: "Trabajadores y colaboradores" },
    { id: "job_applicants", label: "Postulantes a empleos" },
    { id: "suppliers", label: "Proveedores, contratistas y sus representantes" },
    { id: "partners", label: "Socios, accionistas o representantes de empresas" },
    { id: "patients", label: "Pacientes o usuarios de servicios de salud" },
    { id: "students", label: "Estudiantes o integrantes de comunidades educativas" },
    { id: "beneficiaries", label: "Beneficiarios de programas o servicios" },
    { id: "visitors", label: "Visitantes o personas que ingresan a instalaciones" },
    { id: "public", label: "Público general o potenciales clientes" },
    { id: "other", label: "Otros grupos de personas" },
    { id: "none", label: "Ninguno de los anteriores" },
    { id: "unknown", label: "No lo sé" },
  ],
  characteristics: [
    { id: "internal_admin", label: "Gestión administrativa y laboral interna" },
    { id: "in_person_services", label: "Atención presencial o prestación de servicios a personas" },
    { id: "digital_services", label: "Comercio electrónico o prestación de servicios digitales" },
    { id: "marketing", label: "Marketing, publicidad o comunicaciones comerciales" },
    { id: "behavior_analysis", label: "Seguimiento o análisis del comportamiento de usuarios o clientes" },
    { id: "systematic_monitoring", label: "Monitoreo sistemático de personas, espacios o actividades" },
    { id: "profiling", label: "Perfilamiento o clasificación automatizada de personas" },
    { id: "automated_decisions", label: "Decisiones automatizadas que pueden afectar a personas" },
    { id: "special_care", label: "Tratamientos que requieren especial cuidado por su naturaleza" },
    { id: "research", label: "Investigación, análisis estadístico o estudios" },
    { id: "diverse_operations", label: "Operaciones diversas que no se ajustan a las opciones anteriores" },
    { id: "none", label: "Ninguna de las anteriores" },
    { id: "unknown", label: "No lo sé" },
  ],
  processingRoles: [
    { id: "determines_purposes", label: "Determina las finalidades y decisiones principales de sus propios tratamientos" },
    { id: "follows_instructions", label: "Trata datos personales siguiendo instrucciones de organizaciones clientes" },
    { id: "coordinated", label: "Participa en tratamientos coordinados con otras organizaciones" },
    { id: "unknown", label: "No tengo claridad sobre los roles que desempeña" },
  ],
  thirdParties: [
    { id: "technology", label: "Proveedores tecnológicos que pueden acceder o tratar datos" },
    { id: "admin_services", label: "Servicios externos de administración, contabilidad o recursos humanos" },
    { id: "support", label: "Empresas de soporte, mantenimiento o infraestructura" },
    { id: "hosting", label: "Proveedores de alojamiento, nube o almacenamiento" },
    { id: "own_purposes", label: "Otras empresas que reciben datos para sus propias finalidades" },
    { id: "services_for_us", label: "Empresas contratadas para ejecutar servicios por nuestra cuenta" },
    { id: "subcontracting", label: "Subcontratación de servicios que involucran datos personales" },
    { id: "collaboration", label: "Colaboración o intercambio de información entre organizaciones" },
    { id: "other", label: "Otras relaciones externas relevantes" },
    { id: "none", label: "No existen relaciones externas identificadas" },
    { id: "unknown", label: "No lo sé" },
  ],
  territory: [
    { id: "mainly_chile", label: "Realiza operaciones principalmente en Chile" },
    { id: "foreign_establishments", label: "Tiene establecimientos, sucursales u operaciones en otros países" },
    { id: "offers_abroad", label: "Ofrece bienes o servicios a personas que se encuentran fuera de Chile" },
    { id: "foreign_infrastructure", label: "Utiliza servicios tecnológicos o infraestructura que podrían tratar datos desde el extranjero" },
    { id: "foreign_organizations", label: "Comparte o recibe datos personales con organizaciones ubicadas fuera de Chile" },
    { id: "foreign_access", label: "Personal o proveedores ubicados en el extranjero pueden acceder a datos" },
    { id: "foreign_monitoring", label: "Realiza seguimiento o análisis de actividades de personas situadas fuera de Chile" },
    { id: "other", label: "Otras situaciones internacionales" },
    { id: "none", label: "No se han identificado operaciones internacionales" },
    { id: "unknown", label: "No lo sé" },
  ],
} as const satisfies Record<string, readonly TriageOption[]>;

export const QUESTION_OPTION_MAP: Readonly<Record<string, readonly TriageOption[]>> = {
  [QUESTION_IDS.size]: OPTIONS.companySize,
  [QUESTION_IDS.people]: OPTIONS.workerCount,
  [QUESTION_IDS.scopeCount]: OPTIONS.scopeCount,
  [QUESTION_IDS.scopeDiversity]: OPTIONS.scopeDiversity,
  [QUESTION_IDS.groups]: OPTIONS.peopleGroups,
  [QUESTION_IDS.characteristics]: OPTIONS.characteristics,
  [QUESTION_IDS.roles]: OPTIONS.processingRoles,
  [QUESTION_IDS.thirdParties]: OPTIONS.thirdParties,
  [QUESTION_IDS.territory]: OPTIONS.territory,
};

export const MULTI_SELECT_EXCLUSIVE_IDS: Readonly<Record<string, readonly string[]>> = {
  [QUESTION_IDS.groups]: ["none", "unknown"],
  [QUESTION_IDS.characteristics]: ["none", "unknown"],
  [QUESTION_IDS.roles]: ["unknown"],
  [QUESTION_IDS.thirdParties]: ["none", "unknown"],
  [QUESTION_IDS.territory]: ["none", "unknown"],
};
