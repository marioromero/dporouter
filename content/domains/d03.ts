import type { ActivityDefinition } from "../../src/types";
import { basis } from "../sources";

/**
 * CANONICAL SOURCE OF TRUTH — D3 Transparencia, políticas y consentimiento.
 * Única fuente estructurada de las 6 actividades D3. Contenido aprobado
 * textualmente por la iteración vigente; no inventar, completar ni
 * reinterpretar. `docs/domains/D03.md` es una proyección humana generada
 * desde esta representación (ver `npm run content:docs`).
 * La aplicación consume estas definiciones; no las duplica.
 *
 * Frontera Stage 1 congelada:
 * - D3 evalúa y diseña el mecanismo de consentimiento, su capacidad de
 *   generar/conservar evidencia y su retiro;
 * - D3 NO registra consentimientos individuales por titular
 *   (sin ConsentRecord, sin eventos, sin timestamps por persona,
 *   sin historiales). Esos pertenecen a Stage 2.
 *
 * Reglas conceptuales preservadas:
 * - la política pública refleja facts de otros dominios sin convertirse
 *   en segunda fuente canónica (finalidades, bases, fuentes y
 *   conservación mantienen su verdad en D2);
 * - la rama consentimiento es purpose-specific, nunca global por treatment;
 * - D3.03 puede comenzar con la ruta/candidatura de consentimiento
 *   establecida; su completitud integral depende de D3.04–D3.06
 *   (`completion_dependency`, sin ciclo de inicio);
 * - sin periodicidad, sin WCAG, sin scoring, sin ponderaciones automáticas.
 */

const REVIEW = "2026-09-21";
const TRANSITIONAL = "transitional" as const;

export const D03_ACTIVITIES: ActivityDefinition[] = [
  {
    activity_key: "transparency.policy_assemble",
    human_code: "D3.01",
    name: "Estructurar y verificar la política pública de tratamiento",
    objective:
      "Asegurar que el responsable disponga de una política/información pública de tratamiento que incorpore los contenidos mínimos exigidos por el artículo 14 ter.",
    trigger_question:
      "¿La política pública de tratamiento del responsable incorpora los contenidos mínimos exigidos por el artículo 14 ter y refleja la información vigente?",
    interlocutors: [
      "Asesoría jurídica",
      "DPO, si existe",
      "Comunicaciones",
      "Dueños de procesos",
    ],
    data_collection_methods: [
      "Revisión documental",
      "Entrevista",
      "Revisión de publicaciones",
    ],
    steps_operational: [
      "Revisar que exista una política adoptada, con fecha y versión.",
      "Verificar la individualización del responsable y su representante legal.",
      "Verificar la identificación del encargado de prevención, si existiere.",
      "Verificar domicilio, correo, formulario o medio de contacto aplicable.",
      "Verificar categorías, clases o tipos de datos tratados.",
      "Verificar la descripción genérica del universo de titulares.",
      "Verificar los destinatarios previstos.",
      "Verificar las finalidades informadas.",
      "Verificar las bases de licitud y, cuando corresponda, los intereses legítimos.",
      "Verificar la política o medidas de seguridad informadas.",
      "Verificar los derechos de acceso, rectificación, supresión, oposición y portabilidad.",
      "Verificar el derecho a recurrir ante la Agencia en los supuestos legales.",
      "Verificar las transferencias internacionales, cuando correspondan, incluyendo información sobre nivel adecuado o garantías.",
      "Verificar el período de conservación informado.",
      "Verificar la fuente de los datos y, cuando corresponda, la fuente de acceso público.",
      "Cuando exista tratamiento basado en consentimiento, verificar el derecho a retirarlo y la ausencia de efecto sobre la licitud previa.",
      "Cuando existan decisiones automatizadas o perfiles, verificar la información significativa sobre lógica y consecuencias previstas.",
    ],
    evidence_required: [
      "Política vigente",
      "URL o ubicación del documento",
      "Matriz de cobertura del artículo 14 ter",
      "Evidencia de fecha y versión",
      "Documentos fuente utilizados para su actualización",
    ],
    evidence_basis: "legal_requirement",
    deliverable: "Política de tratamiento / matriz de cobertura del artículo 14 ter",
    estimated_time: "Variable según extensión de la política",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 14 ter"),
      basis("cl_ley_19628_2026", "Artículo 3 letra g)"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: [
      "client acts as responsible for at least one personal_data_processing_operation",
    ],
    reasoning_record_required: false,
    state_effect: ["transparency.policy_status = assembled"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [],
  },
  {
    activity_key: "transparency.publication_validate",
    human_code: "D3.02",
    name: "Validar disponibilidad y condiciones de publicación",
    objective:
      "Verificar que la información de transparencia no solo exista documentalmente, sino que se encuentre realmente disponible al público bajo las condiciones legales.",
    trigger_question:
      "¿La información de transparencia preparada o modificada se encuentra efectivamente disponible al público bajo las condiciones legales?",
    interlocutors: [
      "Asesoría jurídica",
      "DPO, si existe",
      "Comunicaciones",
      "TI",
    ],
    data_collection_methods: [
      "Revisión de publicaciones",
      "Prueba de acceso",
      "Revisión documental",
    ],
    steps_operational: [
      "Verificar la existencia de un medio público de información.",
      "Verificar la disponibilidad permanente.",
      "Verificar el acceso efectivo para cualquier interesado.",
      "Verificar la gratuidad.",
      "Verificar la presentación precisa.",
      "Verificar la claridad.",
      "Verificar la ausencia de ambigüedad material.",
      "Verificar el acceso al canal de contacto informado.",
      "Verificar la correspondencia entre la versión publicada y la política vigente.",
    ],
    evidence_required: [
      "URL",
      "Capturas",
      "Medio equivalente",
      "Prueba de acceso",
      "Versión publicada",
      "Evidencia documental de revisión",
    ],
    evidence_basis: "legal_requirement",
    deliverable:
      "Validación de publicación y accesibilidad de información de transparencia",
    estimated_time: "0,5–2 h",
    complexity: "Media",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 3 letra g)"),
      basis("cl_ley_19628_2026", "Artículo 14 ter"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: ["transparency policy or information prepared"],
    reasoning_record_required: false,
    state_effect: ["transparency.publication_status = validated"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [
      {
        target_activity_key: "transparency.policy_assemble",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "policy or information identifiable",
        rationale:
          "La publicación solo puede revisarse sobre una política o información identificable.",
      },
    ],
  },
  {
    activity_key: "consent.mechanism_design",
    human_code: "D3.03",
    name: "Diseñar el mecanismo de consentimiento",
    objective:
      "Diseñar y verificar un mecanismo capaz de obtener una manifestación de consentimiento informada, específica respecto de la finalidad, previa, inequívoca y expresada mediante declaración o clara acción afirmativa.",
    trigger_question:
      "¿El mecanismo previsto es capaz de obtener, para la finalidad activa, un consentimiento informado, específico, previo, inequívoco y expresado mediante declaración o clara acción afirmativa?",
    interlocutors: [
      "Asesoría jurídica",
      "Dueño del proceso",
      "DPO, si existe",
      "Producto o comercial cuando corresponda",
      "TI",
    ],
    data_collection_methods: [
      "Revisión de formularios",
      "Revisión de flujos",
      "Revisión de textos y pantallas",
      "Entrevista",
      "Revisión documental",
    ],
    steps_operational: [
      "Confirmar la finalidad concreta.",
      "Confirmar que la ruta jurídica seleccionada en D2 es consentimiento.",
      "Identificar el canal o modalidad de obtención.",
      "Verificar la información disponible al titular al momento de consentir.",
      "Verificar la vinculación específica entre la manifestación y la finalidad.",
      "Verificar que la manifestación ocurra antes del tratamiento basado en consentimiento.",
      "Verificar la declaración o acción afirmativa clara.",
      "Impedir que el silencio o la inacción se trate como consentimiento.",
      "Cuando actúe mandatario, verificar que el diseño contemple la comprobación de facultad expresa.",
      "Documentar el mecanismo.",
      "Conectar con la evaluación de libertad.",
      "Conectar con la capacidad de prueba.",
      "Conectar con el mecanismo de retiro.",
    ],
    evidence_required: [
      "Diseño del flujo",
      "Formularios",
      "Textos y pantallas",
      "Especificación funcional",
      "Scripts y canales",
      "Evidencia del mecanismo",
      "Mecanismo previsto para mandatario cuando corresponda",
    ],
    evidence_basis: "legal_requirement",
    deliverable: "Diseño del mecanismo de consentimiento",
    estimated_time: "1–4 h por finalidad",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 2 letra p)"),
      basis("cl_ley_19628_2026", "Artículo 12"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: ["purpose.lawful_basis = consent"],
    reasoning_record_required: false,
    state_effect: ["consent.mechanism_status = designed"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [
      {
        target_activity_key: "consent.freedom_assess",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "freedom assessed for purpose",
        rationale:
          "El diseño solo está completo cuando la libertad del consentimiento fue evaluada para la finalidad.",
      },
      {
        target_activity_key: "consent.proof_design",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "proof capability verified for purpose",
        rationale:
          "El diseño solo está completo cuando su capacidad de generar y conservar evidencia fue verificada.",
      },
      {
        target_activity_key: "consent.withdrawal_enable",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "withdrawal enabled for purpose",
        rationale:
          "El diseño solo está completo cuando el retiro del consentimiento quedó habilitado.",
      },
    ],
  },
  {
    activity_key: "consent.freedom_assess",
    human_code: "D3.04",
    name: "Evaluar libertad del consentimiento",
    objective:
      "Adoptar una conclusión profesional respecto de si el consentimiento puede considerarse libre en el contexto concreto.",
    trigger_question:
      "¿El consentimiento previsto para la finalidad puede considerarse libre en el contexto concreto en que se solicita?",
    interlocutors: [
      "Asesoría jurídica",
      "Dueño del proceso",
      "DPO, si existe",
      "Compliance",
    ],
    data_collection_methods: [
      "Análisis jurídico",
      "Revisión contractual",
      "Revisión de oferta comercial",
      "Entrevista",
      "Revisión del mecanismo",
    ],
    steps_operational: [
      "Describir el contexto en que se solicita el consentimiento.",
      "Identificar la existencia de contrato o prestación de servicio.",
      "Determinar si la recolección o tratamiento basado en consentimiento es necesaria para dicho contrato o servicio.",
      "Verificar si opera la excepción legal de bienes, servicios o beneficios cuya única contraprestación sea el consentimiento.",
      "Examinar otros antecedentes materiales necesarios para concluir si la manifestación de voluntad es realmente libre.",
      "Adoptar la conclusión profesional y documentarla mediante reasoning_record.",
    ],
    evidence_required: [
      "Contrato o condiciones del servicio",
      "Descripción de la finalidad",
      "Necesidad alegada",
      "Mecanismo",
      "Oferta comercial relevante",
      "Antecedentes usados para el juicio",
    ],
    evidence_basis: "agency_standard",
    deliverable: "Evaluación de libertad del consentimiento",
    estimated_time: "1–4 h por finalidad",
    complexity: "Alta",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 12")],
    applicable_role: ["responsible"],
    conditions_applicability: ["purpose.lawful_basis = consent"],
    reasoning_record_required: true,
    state_effect: ["consent.freedom_status = supported | not_supported"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "consent.proof_design",
    human_code: "D3.05",
    name: "Verificar capacidad de prueba del consentimiento",
    objective:
      "Verificar que el mecanismo esté diseñado para generar, conservar y recuperar evidencia que permita al responsable acreditar que contó con consentimiento conforme a la ley.",
    trigger_question:
      "¿El mecanismo tiene capacidad real de producir y conservar evidencia suficiente cuando ocurra un consentimiento?",
    interlocutors: [
      "Asesoría jurídica",
      "Dueño del proceso",
      "DPO, si existe",
      "TI",
    ],
    data_collection_methods: [
      "Revisión de especificación funcional",
      "Revisión de diseño técnico",
      "Pruebas del mecanismo",
      "Entrevista",
    ],
    steps_operational: [
      "Verificar que el mecanismo sea capaz de registrar la manifestación, declaración o acción afirmativa.",
      "Verificar que la evidencia vincule el consentimiento con la finalidad específica.",
      "Verificar que la evidencia registre la información y condiciones relevantes presentadas al consentir.",
      "Verificar que la evidencia permita acreditar que el consentimiento antecedió al tratamiento sustentado en él.",
      "Cuando corresponda, verificar el registro de la actuación del representante o mandatario y la facultad expresa.",
      "Verificar la conservación y recuperación posterior de la evidencia.",
    ],
    evidence_required: [
      "Especificación de logs y registros del sistema externo",
      "Modelo de evidencia",
      "Diseño técnico o funcional",
      "Captura de ejemplo",
      "Procedimiento de conservación y recuperación",
      "Pruebas del mecanismo",
    ],
    evidence_basis: "legal_requirement",
    deliverable: "Diseño de evidencia y trazabilidad del consentimiento",
    estimated_time: "1–4 h por finalidad",
    complexity: "Alta",
    legal_basis: [
      basis("cl_ley_19628_2026", "Artículo 12"),
      basis("cl_ley_19628_2026", "Artículo 3 letra a)"),
    ],
    applicable_role: ["responsible"],
    conditions_applicability: ["purpose.lawful_basis = consent"],
    reasoning_record_required: false,
    state_effect: [
      "consent.proof_capability_status = designed | remediation_required",
    ],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "assessment",
    activity_dependencies: [],
  },
  {
    activity_key: "consent.withdrawal_enable",
    human_code: "D3.06",
    name: "Diseñar y habilitar el retiro del consentimiento",
    objective:
      "Asegurar que el mecanismo permita al titular retirar el consentimiento bajo las condiciones legales y que exista una ruta operacional para dejar de sustentar en ese consentimiento el tratamiento futuro correspondiente.",
    trigger_question:
      "¿El mecanismo permite al titular retirar el consentimiento en cualquier momento, sin causa, por medios equivalentes, expeditos, fidedignos, gratuitos y permanentemente disponibles?",
    interlocutors: [
      "Asesoría jurídica",
      "Dueño del proceso",
      "DPO, si existe",
      "TI",
      "Atención de titulares",
    ],
    data_collection_methods: [
      "Revisión de flujos",
      "Revisión de formularios y canales",
      "Prueba de disponibilidad",
      "Entrevista",
    ],
    steps_operational: [
      "Verificar que el retiro esté permitido en cualquier momento.",
      "Verificar que no se exija expresar causa.",
      "Verificar medios similares o equivalentes a los utilizados para otorgar el consentimiento.",
      "Verificar que los medios sean expeditos.",
      "Verificar que los medios sean fidedignos.",
      "Verificar la gratuidad.",
      "Verificar la disponibilidad permanente.",
      "Verificar la ruta operacional para que el retiro produzca efecto hacia futuro.",
      "Verificar la coherencia con la información pública del derecho a retirar el consentimiento.",
    ],
    evidence_required: [
      "Flujo de retiro",
      "Formulario o canal",
      "Capturas",
      "Procedimiento",
      "Integración funcional prevista",
      "Evidencia de disponibilidad del mecanismo",
    ],
    evidence_basis: "legal_requirement",
    deliverable: "Mecanismo/procedimiento de retiro del consentimiento",
    estimated_time: "1–3 h por finalidad",
    complexity: "Media-Alta",
    legal_basis: [basis("cl_ley_19628_2026", "Artículo 12")],
    applicable_role: ["responsible"],
    conditions_applicability: ["purpose.lawful_basis = consent"],
    reasoning_record_required: false,
    state_effect: ["consent.withdrawal_status = enabled | remediation_required"],
    relationship_effect: [],
    regulatory_status: TRANSITIONAL,
    last_legal_review: REVIEW,
    activity_type: "implementation",
    activity_dependencies: [],
  },
];

/** Claves en orden canónico D3.01–D3.06. */
export const D3_ACTIVITY_KEYS: string[] = D03_ACTIVITIES.map((a) => a.activity_key);

/**
 * Notas de procedencia del canon D3 (guía de implementación, no campos
 * operativos). Se preservan en la proyección humana D03.md sin modificar
 * el contrato `ActivityDefinition`.
 */
export const D03_PROVENANCE_NOTES: Record<string, string> = {
  "transparency.policy_assemble":
    "D3.01 verifica que la política refleje correctamente la información; finalidades, bases de licitud, fuentes y conservación mantienen su fuente canónica en D2. La matriz de cobertura no constituye una segunda fuente de verdad.",
  "consent.proof_design":
    "Los checks de capacidad de prueba son criterios operacionales derivados de la necesidad de acreditar los elementos legales del consentimiento. No constituyen requisitos legales autónomos adicionales.",
};
