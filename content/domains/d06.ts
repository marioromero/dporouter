import type { ActivityDefinition } from "../../src/types";
import { basis } from "../sources";

/**
 * CANONICAL SOURCE OF TRUTH — D6 Cesiones, encargados y subencargados.
 * Única fuente estructurada de las 7 actividades D6. Contenido aprobado
 * textualmente por la iteración vigente; no inventar, completar ni
 * reinterpretar. `docs/domains/D06.md` es una proyección humana generada
 * desde esta representación (ver `npm run content:docs`).
 * La aplicación consume estas definiciones; no las duplica.
 *
 * Frontera Stage 1 congelada:
 * - D6 Stage 1 identifica y evalúa relaciones de tratamiento con terceros,
 *   cesiones, encargados y subencargados, sus fundamentos, contratos y
 *   controles, pero no administra cada comunicación, cesión, transferencia
 *   o incidente como una transacción/caso individual;
 * - Stage 1 puede registrar conceptualmente: terceros relevantes, rol
 *   jurídico de la relación, tratamientos/purposes/data items relacionados,
 *   fundamento de una cesión, contrato, instrucciones, subencargados,
 *   autorizaciones, controles, evidencia y dimensión internacional;
 * - prohibido en Stage 1: DisclosureEvent, CessionEvent, TransferEvent,
 *   ProcessorEvent, IncidentEvent, ThirdPartyContext, ThirdPartyScope,
 *   transaction history, timelines, per-disclosure records, per-subject
 *   records, timers/deadlines, workflow instances.
 *
 * Frontera D6 / D7 congelada:
 * - D6 puede identificar `international dimension = yes/no/unknown` como
 *   característica futura de una relación (routing futuro hacia D7);
 * - D6 NO determina la licitud de una transferencia internacional: esa
 *   licitud corresponde a D7. No se importan artículos 27+ como lógica D6
 *   y no existe dependencia D6→D7 en esta iteración.
 *
 * Frontera D6 / D2 calidad congelada:
 * - la calidad general del dato mantiene su source-of-truth en D2.09
 *   (`data.quality_control`). D6.03 puede verificar que la cesión no se
 *   ejecute utilizando información inexacta, incompleta o desactualizada y
 *   consumir/referenciar el estado de calidad existente cuando corresponda,
 *   pero no mantiene una segunda verdad canónica sobre calidad;
 * - prohibido: `cession.data_quality_status`,
 *   `third_party.data_quality_status` o cualquier duplicado de D2.09.
 *   D6.03 solo concluye sobre la formalización/aptitud de la cesión.
 *
 * Frontera D6 / D9 seguridad congelada:
 * - D6.07 verifica que la relación responsable–encargado incorpore
 *   obligaciones y capacidades apropiadas de confidencialidad, seguridad,
 *   reporte al responsable y devolución/supresión al finalizar. D9 sigue
 *   siendo el dominio primario de seguridad y gestión de incidentes
 *   concretos;
 * - D6.07 puede verificar cláusulas/procedimientos/canales/capacidad; no
 *   administra incidentes, no crea security findings globales, no sustituye
 *   la evaluación técnica D9 y no escribe canonical facts D9.
 *
 * Regla transversal de scope (conceptual; `ActivityDefinition` no porta
 * campo scope — el scope de ejecución vive en la futura capa de protocolo):
 * - D6.01 treatment, D6.02 purpose, D6.03 purpose, D6.04 treatment,
 *   D6.05 treatment, D6.06 treatment, D6.07 treatment;
 * - D6.01 permanece treatment-scoped aunque la estructura futura pueda
 *   relacionar terceros con purposes/data items. NO existe scope de tercero.
 *
 * Diferimiento de aplicabilidad y captura (gate obligatorio):
 * - no existe todavía estructura aprobada que represente N relaciones con
 *   terceros; por tanto `conditions_applicability` es `[]` en D6.01–D6.07
 *   y la aplicabilidad conceptual vive en trigger, objetivo, pasos y notas;
 * - NO inventar facts canónicos (`has_processor`, `has_cession`,
 *   `has_subprocessor`, `has_third_party`, `international_transfer`);
 * - antes de los protocolos se realizará la auditoría de captura de
 *   relaciones con terceros (`D6 THIRD-PARTY RELATIONSHIP CAPTURE AUDIT`);
 * - prohibido en esta iteración: `ThirdPartyRecord`,
 *   `ThirdPartyRelationshipRecord`, `ProcessorRecord`, `CessionRecord`,
 *   `SubprocessorRecord`, `ThirdPartyContext`, arrays nuevos,
 *   relationship IDs, scopes nuevos, dynamic facts, eventos de
 *   cesión/comunicación; no modificar `ActorRecord`; no crear nuevo scope.
 *
 * Source-of-truth preservado:
 * - D2: treatment inventory, actors, actor roles, purposes, data items,
 *   quality status;
 * - D6: evaluación jurídica/operacional de relaciones con terceros, cesión,
 *   instrumentos, contratos, instructions, subprocessing y controles
 *   operacionales a nivel de relación;
 * - D7: international transfer legality;
 * - D9: primary security/incident domain.
 * Sin truths duplicadas.
 */

const REVIEW = "2026-12-01";
const TRANSITIONAL = "transitional" as const;
const RESPONSIBLE = ["responsible"];

export const D06_ACTIVITIES: ActivityDefinition[] = [
  {
    activity_key: "third_party.relationship_map",
    human_code: "D6.01",
    name: "Identificar y clasificar relaciones de tratamiento con terceros",
    objective:
      "Identificar los terceros que intervienen en un tratamiento y clasificar jurídicamente la naturaleza de la relación o flujo para determinar qué revisiones posteriores corresponden, sin crear todavía una entidad o scope propio de tercero.",
    trigger_question:
      "¿El tratamiento involucra terceros que reciben, conocen, tratan o gestionan datos personales y requiere clasificar la naturaleza de esas relaciones?",
    interlocutors: [
      "Área legal / privacidad",
      "Dueño del tratamiento",
      "Gestión de proveedores / compras",
      "TI / arquitectura",
      "DPO, si existe",
    ],
    data_collection_methods: [
      "Mapeo de terceros",
      "Revisión contractual",
      "Walkthrough de flujos de datos",
      "Análisis de roles",
      "Registro de razonamiento profesional",
    ],
    steps_operational: [
      "Identificar terceros relevantes del tratamiento.",
      "Revisar contexto disponible en D2.02/ActorRecord sin modificarlo ni duplicar D2.02.",
      "Identificar quién determina finalidades/medios jurídicamente relevantes.",
      "Identificar quién trata por cuenta/instrucciones.",
      "Identificar comunicaciones que no constituyen cesión: el responsable da a conocer datos personales a personas distintas del titular, sin llegar a cederlos y sin transferirlos internacionalmente por ese solo hecho.",
      "Identificar cesiones responsable→responsable: transferencia de datos personales desde un responsable hacia otro responsable.",
      "Identificar encargados: tercero mandatario o encargado que trata datos personales por cuenta del responsable conforme al encargo/instrucciones.",
      "Identificar posibles subencargados: otro encargado al que el encargado pretende delegar parte o totalidad del encargo.",
      "Identificar si existe dimensión internacional de la relación/flujos, solo para routing futuro D7 y sin concluir licitud internacional.",
      "Identificar purposes relacionadas.",
      "Identificar tipos/categorías abstractas de datos involucrados, sin almacenar datos personales reales.",
      "Contrastar denominación contractual/comercial con operación real: la clasificación no debe depender únicamente del nombre contractual del tercero.",
      "Documentar ambigüedades.",
      "Adoptar clasificación profesional mediante ReasoningRecord.",
      "Identificar siguientes revisiones D6 requeridas.",
    ],
    evidence_required: [
      "ActorRecord/contexto D2",
      "Contratos",
      "Órdenes de servicio",
      "Data flows",
      "Diagramas de arquitectura/proveedores",
      "Declaraciones de servicio",
      "Listado de proveedores/partners",
      "Mapeo finalidad-datos",
      "Evidencias de subcontratación",
      "Registro de razonamiento profesional",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Mapa y clasificación de relaciones de tratamiento con terceros",
    estimated_time: "2–6 h por treatment",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 2 letra c)"),
      basis("cl_ley_19628_2026", "Artículo 2 letra v)"),
      basis("cl_ley_19628_2026", "Artículo 2 letra x)"),
      basis("cl_ley_19628_2026", "Artículo 15"),
      basis("cl_ley_19628_2026", "Artículo 15 bis"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: true,
    state_effect: ["third_party.relationship_map_status = complete"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "cession.lawfulness_assess",
    human_code: "D6.02",
    name: "Evaluar la licitud de la cesión de datos personales",
    objective:
      "Determinar si una cesión de datos personales entre responsables cuenta con una vía jurídica válida bajo el artículo 15 y si la finalidad de la cesión se encuentra jurídicamente respaldada.",
    trigger_question:
      "¿La finalidad contempla una cesión responsable→responsable y requiere determinar si esa cesión cuenta con fundamento jurídico válido?",
    interlocutors: [
      "Área legal / privacidad",
      "Dueño de la finalidad/tratamiento",
      "DPO, si existe",
      "Contraparte cedente/cesionaria cuando corresponda",
    ],
    data_collection_methods: [
      "Revisión documental",
      "Contraste de vía jurídica",
      "Revisión de consentimiento",
      "Revisión contractual",
      "Registro de razonamiento profesional",
    ],
    steps_operational: [
      "Confirmar que la relación evaluada constituye cesión (responsable→responsable) y no mero encargo/comunicación.",
      "Identificar finalidad de la cesión.",
      "Evaluar consentimiento del titular y correspondencia con fines del tratamiento.",
      "Si el consentimiento original no contempló la cesión: verificar necesidad de recabarlo antes de producirse y reconocer la cesión como nueva operación de tratamiento.",
      "Evaluar necesidad para cumplimiento/ejecución de contrato en que el titular es parte.",
      "Evaluar interés legítimo del cedente o cesionario conforme artículo 13 letra d).",
      "Evaluar habilitación legal.",
      "Distinguir ausencia de fundamento de simple falta de información: no presentar una cesión sin fundamento como mero pendiente informativo.",
      "Documentar alternativas consideradas.",
      "Adoptar conclusión profesional. Las vías son alternativas: no exigirlas cumulativamente. D6.02 evalúa específicamente la operación de cesión, sin duplicar la licitud general D2.",
      "Preservar la regla de nulidad: cuando el consentimiento es jurídicamente necesario y la cesión se realiza sin él, la cesión es nula y el cesionario debe suprimir los datos recibidos, sin perjuicio de responsabilidades. No crear enforcement workflow.",
    ],
    evidence_required: [
      "Descripción de la finalidad de la cesión",
      "Contexto de licitud D2",
      "Consentimiento",
      "Contrato con titular",
      "Evaluación de interés legítimo cuando corresponda",
      "Norma legal invocada",
      "Relación cedente/cesionario",
      "Acuerdos de respaldo",
      "Registro de razonamiento profesional",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Evaluación de licitud de cesión",
    estimated_time: "1–3 h por purpose",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 13 letra d)"),
      basis("cl_ley_19628_2026", "Artículo 15"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: true,
    state_effect: [
      "cession.lawfulness_status = supported",
      "cession.lawfulness_status = not_supported",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "cession.instrument_validate",
    human_code: "D6.03",
    name: "Validar la formalización e instrumento de cesión",
    objective:
      "Verificar que una cesión jurídicamente respaldada se encuentre formalizada en la forma exigida y que su instrumento identifique adecuadamente las partes, datos, finalidades y demás estipulaciones relevantes, sin duplicar la evaluación general de calidad de D2.09.",
    trigger_question:
      "¿Existe o se proyecta una cesión de datos y debe verificarse su correcta formalización e instrumento?",
    interlocutors: [
      "Área legal / privacidad",
      "Dueño de la finalidad/tratamiento",
      "Contraparte cedente/cesionaria cuando corresponda",
    ],
    data_collection_methods: [
      "Revisión documental",
      "Revisión contractual",
      "Mapeo finalidad-datos",
      "Contraste con estado de calidad D2.09 existente",
    ],
    steps_operational: [
      "Verificar que la cesión conste por escrito o mediante medio electrónico idóneo.",
      "Verificar individualización de cedente.",
      "Verificar individualización de cesionario.",
      "Verificar identificación de los datos objeto de cesión.",
      "Verificar finalidades previstas para el tratamiento.",
      "Verificar demás antecedentes/estipulaciones acordadas.",
      "Verificar que el instrumento obligue/permita al cesionario a tratar conforme a las finalidades establecidas.",
      "Verificar reconocimiento operacional de que, perfeccionada la cesión, el cesionario adquiere calidad de responsable y el cedente sigue siendo responsable respecto de tratamientos que continúe realizando.",
      "Revisar si el estado de calidad D2.09 existente presenta problemas relevantes para ejecutar la cesión (información inexacta, incompleta o desactualizada como riesgo).",
      "Si no existe estado D2.09 suficiente, dejar next action/revisión correspondiente sin crear una conclusión canónica propia sobre calidad.",
      "No crear fact canónico D6 sobre calidad ni alterar D2.09: D2.09 permanece source-of-truth de calidad.",
    ],
    evidence_required: [
      "Acuerdo/instrumento de cesión",
      "Cláusulas",
      "Anexos",
      "Mapeo finalidad-datos",
      "Estado/evidencia D2.09 cuando exista",
      "Revisión documental",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Validación de instrumento de cesión",
    estimated_time: "0.5–2 h por purpose",
    complexity: "Media",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 3 letra d)"),
      basis("cl_ley_19628_2026", "Artículo 15"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: [
      "cession.instrument_status = validated",
      "cession.instrument_status = remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "cession.lawfulness_assess",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "lawfulness supported",
        rationale:
          "El instrumento puede ser revisado antes, pero no declararse correctamente cerrado ignorando que la cesión carece de fundamento jurídico.",
      },
    ],
  },
  {
    activity_key: "processor.contract_validate",
    human_code: "D6.04",
    name: "Validar el contrato responsable–encargado",
    objective:
      "Verificar que el tratamiento realizado a través de un tercero mandatario o encargado se encuentre regido por un contrato válido que incorpore los contenidos mínimos exigidos por el artículo 15 bis.",
    trigger_question:
      "¿El tratamiento utiliza uno o más encargados y debe verificarse la suficiencia del contrato que regula el encargo?",
    interlocutors: [
      "Área legal / privacidad",
      "Gestión de proveedores / compras",
      "Dueño del tratamiento",
      "DPO, si existe",
    ],
    data_collection_methods: [
      "Revisión contractual",
      "Revisión documental",
      "Mapeo de flujos de datos",
      "Contraste tratamiento real vs contrato",
    ],
    steps_operational: [
      "Verificar objeto del encargo.",
      "Verificar duración.",
      "Verificar finalidad del tratamiento.",
      "Verificar tipo de datos personales tratados.",
      "Verificar categorías de titulares.",
      "Verificar derechos de las partes.",
      "Verificar obligaciones de las partes.",
      "Verificar coherencia con el tratamiento real: no asumir que el nombre del proveedor determina calidad de encargado.",
      "Verificar que las instrucciones/alcance contractuales sean identificables.",
      "Registrar gaps/remediaciones.",
      "Preservar nota de boundary: la Agencia pondrá modelos tipo de contratos a disposición del público; no convertir un futuro modelo tipo en fuente exclusiva de cumplimiento.",
    ],
    evidence_required: [
      "Contrato",
      "DPA/anexo",
      "Statement of work",
      "Órdenes de servicio",
      "Instrucciones",
      "Mapeo de flujos de datos",
      "Documentación del proveedor",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Validación del contrato de encargado",
    estimated_time: "1–3 h por treatment",
    complexity: "Media",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 15 bis")],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: [
      "processor.contract_status = validated",
      "processor.contract_status = remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [],
  },
  {
    activity_key: "processor.instruction_controls_validate",
    human_code: "D6.05",
    name: "Validar instrucciones y límites operacionales del encargado",
    objective:
      "Verificar que el encargado trate los datos conforme al encargo y a las instrucciones del responsable, sin utilizarlos para un objeto distinto ni cederlos o entregarlos fuera de las autorizaciones expresas y específicas aplicables.",
    trigger_question:
      "¿Existen encargados y debe verificarse que su operación real permanezca dentro del encargo e instrucciones autorizadas?",
    interlocutors: [
      "Área legal / privacidad",
      "Dueño del tratamiento",
      "Gestión de proveedores",
      "Operaciones/TI cuando corresponda",
    ],
    data_collection_methods: [
      "Revisión contractual",
      "Revisión de procedimientos operacionales",
      "Walkthrough operacional",
      "Revisión de controles del proveedor",
      "Revisión de autorizaciones",
    ],
    steps_operational: [
      "Verificar instrucciones identificables/documentadas.",
      "Verificar correspondencia entre tratamiento real y objeto del encargo.",
      "Verificar prohibición/control de uso para objeto distinto.",
      "Verificar controles frente a cesión/entrega no autorizada.",
      "Cuando exista cesión/entrega permitida: verificar autorización expresa, verificar autorización específica y verificar que sea necesaria para cumplir el objeto del encargo.",
      "Verificar mecanismo para modificaciones de instrucciones.",
      "Verificar control/revisión de desviaciones.",
      "Verificar escalamiento cuando el encargado actúa fuera del encargo.",
      "Preservar consecuencia legal en guidance: si el encargado trata con objeto distinto o cede/entrega sin autorización exigida, la ley puede considerarlo responsable para todos los efectos legales, con las responsabilidades correspondientes. No crear cambio automático de ActorRecord ni modificar rol D2.02 automáticamente.",
    ],
    evidence_required: [
      "Contrato/DPA",
      "Instrucciones",
      "Procedimientos operacionales",
      "Controles del proveedor",
      "Evidencia de auditoría",
      "Flujos de datos",
      "Registros abstractos de autorización",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Validación de límites e instrucciones del encargado",
    estimated_time: "1–3 h por treatment",
    complexity: "Media",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 15 bis")],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: [
      "processor.instructions_status = controlled",
      "processor.instructions_status = remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [],
  },
  {
    activity_key: "subprocessor.authorization_validate",
    human_code: "D6.06",
    name: "Validar autorización y control de subencargados",
    objective:
      "Verificar que toda delegación del encargo a otro encargado cuente con autorización específica y escrita del responsable y que la delegación preserve las responsabilidades legales del encargado original.",
    trigger_question:
      "¿El encargado delega o pretende delegar parte o la totalidad del encargo a otro encargado?",
    interlocutors: [
      "Área legal / privacidad",
      "Gestión de proveedores",
      "Dueño del tratamiento",
      "Encargado principal cuando corresponda",
    ],
    data_collection_methods: [
      "Revisión contractual",
      "Revisión documental",
      "Revisión de autorizaciones",
      "Revisión de cláusulas de subencargo",
    ],
    steps_operational: [
      "Determinar si existen subencargados.",
      "Identificar alcance abstracto de la delegación.",
      "Verificar autorización del responsable.",
      "Verificar que la autorización sea específica.",
      "Verificar que conste por escrito.",
      "Verificar correspondencia entre delegación y encargo principal.",
      "Verificar obligaciones trasladadas al subencargado.",
      "Verificar que el diseño contractual/operacional no pretenda liberar al encargado original de responsabilidad.",
      "Documentar gaps/remediación.",
      "Preservar regla de responsabilidad: el encargado que delega sigue siendo solidariamente responsable sobre el encargo y no puede eximirse alegando la delegación.",
      "Preservar semántica de no-subencargo: si no existen subencargados, conceptualmente not_applicable; no controlled, no validated, no cumplimiento por conjunción vacía. Sin effect para not applicable. La forma machine-readable de determinar existencia se decidirá después del capture audit; durante canon, conditions_applicability es [] y no se inventa flag.",
    ],
    evidence_required: [
      "Contrato principal",
      "Lista de subcontratistas",
      "Autorizaciones",
      "Cláusulas de subencargo",
      "Términos contractuales downstream",
      "Evidencia del proveedor",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Validación de subencargados y autorizaciones",
    estimated_time: "0.5–2 h por treatment",
    complexity: "Media",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 15 bis")],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: [
      "subprocessor.authorization_status = controlled",
      "subprocessor.authorization_status = remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [],
  },
  {
    activity_key: "processor.security_exit_validate",
    human_code: "D6.07",
    name: "Validar obligaciones operacionales, seguridad y cierre del encargado",
    objective:
      "Verificar que la relación responsable–encargado incorpore y pueda ejecutar obligaciones de confidencialidad, seguridad, reporte de vulneraciones y devolución o supresión de datos al finalizar el servicio, sin sustituir al dominio primario de seguridad D9.",
    trigger_question:
      "¿El tratamiento utiliza encargados y deben verificarse sus obligaciones operacionales de confidencialidad, seguridad, reporte y término del servicio?",
    interlocutors: [
      "Área legal / privacidad",
      "Seguridad / TI",
      "Gestión de proveedores",
      "Dueño del tratamiento",
      "DPO, si existe",
    ],
    data_collection_methods: [
      "Revisión contractual",
      "Revisión documental",
      "Revisión de procedimientos de reporte y cierre",
      "Revisión de evidencia de capacidad",
    ],
    steps_operational: [
      "Verificar deber de confidencialidad aplicable al encargado.",
      "Verificar obligaciones/capacidades de seguridad.",
      "Verificar consideración de estándares diferenciados aplicables.",
      "Verificar mecanismo para reportar al responsable vulneraciones de medidas de seguridad.",
      "Verificar canal/escalamiento operacional.",
      "Verificar reglas para término del servicio.",
      "Verificar devolución de datos al responsable cuando corresponda.",
      "Verificar supresión cuando corresponda.",
      "Verificar criterios/evidencia de cierre.",
      "Identificar gaps que requieran revisión técnica/operacional en D9.",
      "Preservar frontera D9: D6.07 solo valida obligaciones contractuales/de relación, capacidad, procedimiento, canal de reporte y controles de salida. D6.07 no investiga incidentes, no registra incident events, no evalúa técnicamente todo el security posture, no reemplaza controles D9 y no escribe facts D9.",
    ],
    evidence_required: [
      "Contrato/DPA",
      "Términos de confidencialidad",
      "Anexo de seguridad",
      "Obligaciones de seguridad",
      "Procedimiento de reporte de incidentes",
      "Cláusula de término/salida",
      "Procedimiento de devolución/supresión",
      "Declaraciones",
      "Evidencia de capacidad",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Validación operacional y de cierre del encargado",
    estimated_time: "1–3 h por treatment",
    complexity: "Media",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 14 bis"),
      basis("cl_ley_19628_2026", "Artículo 14 quinquies"),
      basis("cl_ley_19628_2026", "Artículo 14 septies"),
      basis("cl_ley_19628_2026", "Artículo 15 bis"),
    ],
    applicable_role: [...RESPONSIBLE],
    conditions_applicability: [],
    reasoning_record_required: false,
    state_effect: [
      "processor.operational_status = controlled",
      "processor.operational_status = remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [],
  },
];

/** Claves en orden canónico D6.01–D6.07. */
export const D6_ACTIVITY_KEYS: string[] = D06_ACTIVITIES.map((a) => a.activity_key);

/**
 * Notas de procedencia del canon D6 (guía de implementación, no campos
 * operativos). Se preservan en la proyección humana D06.md sin modificar
 * el contrato `ActivityDefinition`.
 */
export const D06_PROVENANCE_NOTES: Record<string, string> = {
  "third_party.relationship_map":
    "Clasificación jurídica con juicio profesional documentado (reasoning_record_required = true): la denominación contractual/comercial no determina por sí sola la naturaleza de la relación. D2.02/ActorRecord es contexto de entrada relacionado, no completion dependency; D6.01 no modifica ActorRecord ni duplica D2.02. GATE DE CAPTURA: la aplicabilidad conceptual vive en trigger, objetivo y pasos; no existen facts canónicos ni taxonomía machine-readable para N relaciones con terceros (ver auditoría de captura diferida antes de los protocolos). Scopes conceptuales: D6.01 treatment.",
  "cession.lawfulness_assess":
    "La selección de vía del artículo 15 requiere juicio profesional documentado (reasoning_record_required = true). Las cuatro rutas (consentimiento, contrato, interés legítimo art. 13(d), habilitación legal) son alternativas, no cumulativas. Si el consentimiento original no contempló la cesión, debe recabarse antes y la cesión reconocerse como nueva operación de tratamiento. Nulidad preservada: cesión sin consentimiento necesario es nula con deber de supresión del cesionario, sin enforcement workflow. Scopes conceptuales: D6.02 purpose.",
  "cession.instrument_validate":
    "Formalización escrita o medio electrónico idóneo con partes, datos, finalidades y estipulaciones; perfeccionada la cesión, el cesionario adquiere calidad de responsable y el cedente conserva la propia sobre lo que continúe tratando. Artículo 3 letra d) solo como principio general de calidad/contexto complementario, no como obligación exclusiva D6. FRONTERA D2.09: D2.09 permanece source-of-truth de calidad; D6.03 detecta riesgo de inexactitud pero no crea fact canónico de calidad. Completion dependency D6.03 → D6.02: el instrumento puede revisarse antes, pero no cerrarse ignorando falta de fundamento. Scopes conceptuales: D6.03 purpose.",
  "processor.contract_validate":
    "Verificación de los siete contenidos mínimos del artículo 15 bis (objeto, duración, finalidad, tipo de datos, categorías de titulares, derechos y obligaciones) más coherencia con el tratamiento real e instrucciones identificables. Nota de boundary: la Agencia pondrá modelos tipo a disposición del público sin convertirse en fuente exclusiva de cumplimiento. Sin juicio profesional (reasoning_record_required = false). Scopes conceptuales: D6.04 treatment.",
  "processor.instruction_controls_validate":
    "El encargado debe permanecer dentro del encargo/instrucciones; cesión/entrega permitida solo con autorización expresa, específica y necesaria para el objeto del encargo. Consecuencia legal preservada en guidance: apartarse del encargo puede convertirlo en responsable, sin auto-role-write sobre ActorRecord ni modificación automática de D2.02. D6.04 es contexto relacionado, no completion dependency rígida. Scopes conceptuales: D6.05 treatment.",
  "subprocessor.authorization_validate":
    "Delegación solo con autorización específica y escrita del responsable, preservando la responsabilidad solidaria del encargado original sin eximición por delegación. Semántica de no-subencargo: sin subencargados, conceptualmente not_applicable (no controlled/validated, no conjunción vacía, sin effect); la determinación machine-readable espera al capture audit. Scopes conceptuales: D6.06 treatment.",
  "processor.security_exit_validate":
    "Verifica obligaciones y capacidades de confidencialidad, seguridad, reporte de vulneraciones y devolución/supresión al cierre. FRONTERA D9: D6.07 no investiga incidentes, no registra incident events, no evalúa el security posture completo, no reemplaza controles D9 y no escribe facts D9 (D9 será dominio primario). Base en artículos 14 bis, 14 quinquies y 14 septies en la medida remitida por el artículo 15 bis. Scopes conceptuales: D6.07 treatment.",
};
