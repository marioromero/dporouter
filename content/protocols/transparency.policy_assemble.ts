import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.01.
 *
 * activity_key = transparency.policy_assemble (procedure, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, dependencias y state effect del
 * contenido canónico D3.01. Verifica la cobertura del artefacto
 * público frente a los bloques del artículo 14 ter; nunca declara
 * cumplimiento integral de la empresa.
 *
 * Sin segunda fuente de verdad: finalidades, bases de licitud,
 * fuentes, conservación y demás materias conservan su verdad
 * estructurada en D2 (u otros dominios futuros). Esta guía solo
 * verifica su reflejo en la política pública, como revisión
 * documental honesta cuando no exista structured source disponible.
 *
 * Sin Policy entity, sin versiones persistentes, sin document blob:
 * la política es evidencia y deliverable; fecha/versión se verifican
 * como puntos de revisión, no se capturan como escalares ni se
 * almacenan contenidos. Los 17 pasos canónicos se agrupan en 10
 * verificaciones sin perder ningún requisito ni inventar
 * obligaciones (cada ítem permanece trazable en `why_it_matters`).
 *
 * Ítems condicionales (encargado de prevención, transferencias,
 * retiro, decisiones automatizadas) usan la opción explícita
 * "No aplica en este caso" en lugar de forzar incumplimiento: la
 * ausencia legítima nunca es brecha. `reasoning_record_required =
 * false`: sin juicio, sin ReasoningRecord.
 */

const CHECKS = [
  "transparency.policy.adoption_recorded",
  "transparency.policy.identity_contact_covered",
  "transparency.policy.prevention_officer_covered",
  "transparency.policy.data_subjects_covered",
  "transparency.policy.recipients_purposes_bases_covered",
  "transparency.policy.security_rights_covered",
  "transparency.policy.transfers_covered",
  "transparency.policy.retention_sources_covered",
  "transparency.policy.withdrawal_covered",
  "transparency.policy.automated_covered",
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

function verifyOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "El punto fue verificado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "El punto aún no está cubierto en la política.",
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

function conditionalOptions(factKey: string, naHint: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
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
      label: "Pendiente",
      description: "El punto aún no está cubierto en la política.",
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

export const TRANSPARENCY_POLICY_ASSEMBLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "transparency.policy_assemble.v1",
  activity_key: "transparency.policy_assemble",
  version: 1,
  mode: "procedure",
  execution_scope: "company",
  title: "Verificación guiada de la política pública",
  description:
    "Verifica que la política o información pública de tratamiento cubra los bloques exigidos por el artículo 14 ter: adopción, identidad y contacto, datos y titulares, destinatarios, finalidades y bases, seguridad y derechos, transferencias, conservación, fuentes, retiro y decisiones automatizadas.",
  entry_node_key: "check-adoption",
  decision_fact_keys: [...CHECKS],
  last_review: "2026-09-23",
  provenance: "legal_requirement",
  nodes: [
    {
      node_key: "check-adoption",
      node_type: "question",
      title: "Política adoptada con fecha y versión",
      prompt:
        "¿La política o información pública está adoptada, con fecha y versión identificables?",
      why_it_matters:
        "Cubre el paso canónico 1: existencia de política adoptada, fecha y versión.",
      fact_key: "transparency.policy.adoption_recorded",
      answer_type: "yes_no_unknown",
      options: verifyOptions("transparency.policy.adoption_recorded"),
      evidence_to_review: [
        "política vigente",
        "evidencia de fecha y versión",
      ],
      evidence_review_help: [
        {
          evidence_item: "política vigente",
          review_guide:
            "Verificar que exista un documento de tratamiento de datos personales formalmente adoptado por la organización, identificando su estado de aprobación y ámbito de aplicación. Comprobar que corresponda a la política utilizada actualmente, distinguiéndola de borradores, propuestas o documentos sustituidos, sin dar por acreditada su publicación.",
          no_evidence_guidance:
            "Consultar a las áreas responsables y revisar repositorios documentales, aprobaciones o comunicaciones internas para localizar la política adoptada. Si solo existen borradores o antecedentes incompletos, identificar las gestiones pendientes sin presentar su elaboración como aprobación efectiva.",
          expected_result:
            "Una política adoptada e identificable, con antecedentes suficientes para distinguirla de documentos preliminares o reemplazados. Si no puede comprobarse su adopción, la situación debe quedar reconocida sin presumir cumplimiento ni publicación efectiva.",
        },
        {
          evidence_item: "evidencia de fecha y versión",
          review_guide:
            "Comprobar que el documento adoptado indique una fecha y una versión identificables, coherentes con los antecedentes disponibles de aprobación o actualización. Distinguir la fecha de la política de otras fechas administrativas y verificar que la versión examinada corresponda al documento vigente.",
          no_evidence_guidance:
            "Revisar constancias de aprobación, documentación interna y antecedentes de actualización para identificar la fecha y versión aplicables. Cuando existan referencias contradictorias o faltantes, señalar las aclaraciones necesarias sin inventar identificadores ni asumir que la última fecha de edición corresponde a la adopción.",
          expected_result:
            "Fecha y versión verificables, asociadas a la política adoptada y respaldadas por antecedentes coherentes. Las discrepancias pendientes deben quedar identificadas, permitiendo reconocer el documento aplicable sin crear un historial de versiones en el sistema.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-identity-contact",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-identity-contact",
      node_type: "question",
      title: "Responsable y contacto",
      prompt:
        "¿La política individualiza al responsable y su representante legal, e informa domicilio, correo, formulario o medio de contacto aplicable?",
      why_it_matters:
        "Cubre los pasos canónicos 2 y 4: individualización del responsable y medio de contacto.",
      fact_key: "transparency.policy.identity_contact_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("transparency.policy.identity_contact_covered"),
      evidence_to_review: ["política vigente"],
      evidence_review_help: [
        {
          evidence_item: "política vigente",
          review_guide:
            "Comprobar que se identifique inequívocamente al responsable del tratamiento y a su representante legal, utilizando antecedentes organizacionales vigentes. Verificar que se informe un domicilio postal, correo electrónico, formulario u otro medio equivalente de uso común y fácil acceso para recibir solicitudes, distinguiendo los canales efectivos de referencias generales sin utilidad práctica.",
          no_evidence_guidance:
            "Consultar antecedentes institucionales, registros de representación y canales de atención disponibles para reconstruir la información que debe incorporarse. Si faltan identificaciones o medios verificables, señalar las correcciones pendientes sin inventar datos de contacto ni considerar suficiente un canal cuya finalidad o disponibilidad no pueda comprobarse.",
          expected_result:
            "Una identificación coherente del responsable y su representante legal, acompañada de al menos un medio de contacto adecuado e identificable para las solicitudes de titulares. Las omisiones o discrepancias deben quedar reconocidas, sin dar por acreditada la recepción efectiva de solicitudes únicamente por la existencia del documento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-prevention-officer",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-prevention-officer",
      node_type: "question",
      title: "Encargado de prevención",
      prompt:
        "¿La política identifica al encargado de prevención, o no existe uno que deba informarse?",
      why_it_matters:
        "Cubre el paso canónico 3, condicional: solo cuando existiere encargado de prevención.",
      fact_key: "transparency.policy.prevention_officer_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "transparency.policy.prevention_officer_covered",
        "No existe encargado de prevención que deba informarse en este caso.",
      ),
      evidence_to_review: ["política vigente"],
      evidence_review_help: [
        {
          evidence_item: "política vigente",
          review_guide:
            "Comprobar si la organización cuenta con un encargado de prevención designado y verificar que su identificación figure correctamente en la información pública cuando corresponda. Revisar los antecedentes institucionales disponibles para distinguir una designación efectiva de funciones informales, sin presumir que toda organización debe contar con esta figura.",
          no_evidence_guidance:
            "Consultar antecedentes de designación, documentación organizacional y responsables internos para establecer si existe un encargado de prevención que deba identificarse. Si no puede determinarse su existencia, mantener la situación como pendiente de verificación; no seleccionar «No aplica» únicamente porque la política omite mencionarlo.",
          expected_result:
            "Identificación verificable del encargado de prevención cuando exista, o ausencia de esta figura suficientemente comprobada para justificar «No aplica en este caso». Las omisiones e incertidumbres deben quedar diferenciadas, sin considerar cumplido el requisito mediante una declaración sin respaldo.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-data-subjects",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-data-subjects",
      node_type: "question",
      title: "Datos y titulares",
      prompt:
        "¿La política describe las categorías, clases o tipos de datos tratados y el universo genérico de titulares?",
      why_it_matters:
        "Cubre los pasos canónicos 5 y 6: categorías de datos y universo de titulares.",
      fact_key: "transparency.policy.data_subjects_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("transparency.policy.data_subjects_covered"),
      evidence_to_review: ["política vigente"],
      evidence_review_help: [
        {
          evidence_item: "política vigente",
          review_guide:
            "Verificar que se describan las categorías de información efectivamente tratadas, distinguiendo datos identificativos, de contacto, financieros, sensibles u otros cuando correspondan. Comprobar que también se reconozcan los grupos de personas involucrados, como clientes, trabajadores o proveedores, y que ambas descripciones coincidan con los tratamientos documentados.",
          no_evidence_guidance:
            "Consultar el inventario de tratamientos, formularios y antecedentes operativos para identificar los tipos de datos utilizados y las poblaciones involucradas. Si faltan categorías o grupos verificables, señalar las incorporaciones pendientes sin inventar información ni publicar listados de personas o datos individuales.",
          expected_result:
            "Una descripción pública comprensible de las categorías de datos y del universo genérico de titulares, coherente con las operaciones reales. Las omisiones o discrepancias deben quedar identificadas, sin considerar suficientes expresiones demasiado generales que impidan reconocer qué información y personas comprende el tratamiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-recipients-purposes-bases",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-recipients-purposes-bases",
      node_type: "question",
      title: "Destinatarios, finalidades y bases",
      prompt:
        "¿La política informa destinatarios previstos, finalidades, bases de licitud y, cuando corresponda, intereses legítimos?",
      why_it_matters:
        "Cubre los pasos canónicos 7, 8 y 9. Verifica su reflejo en el artefacto público sin convertir esta guía en fuente de finalidades o bases: esas verdades viven en D2.",
      fact_key: "transparency.policy.recipients_purposes_bases_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "transparency.policy.recipients_purposes_bases_covered",
      ),
      evidence_to_review: [
        "política vigente",
        "matriz de cobertura del artículo 14 ter",
      ],
      evidence_review_help: [
        {
          evidence_item: "política vigente",
          review_guide:
            "Comprobar que se describan los destinatarios a quienes se prevé comunicar o ceder datos, las finalidades de cada tratamiento y sus bases de licitud, contrastando su contenido con los antecedentes vigentes de D2. Cuando se invoque interés legítimo, verificar que se identifiquen los intereses concretos y no solo una referencia genérica a esa base jurídica.",
          no_evidence_guidance:
            "Consultar el inventario, las finalidades y las bases documentadas en D2 para reconstruir la información que debe reflejarse públicamente. Si faltan destinatarios, fundamentos o intereses identificables, señalar las incorporaciones pendientes sin inventar habilitaciones jurídicas ni atribuir comunicaciones de datos no comprobadas.",
          expected_result:
            "Información pública comprensible sobre destinatarios previstos, finalidades y bases de licitud, incluidos los intereses legítimos cuando correspondan, coherente con los antecedentes disponibles. Las omisiones o discrepancias deben quedar reconocidas sin considerar que su inclusión documental certifica la corrección jurídica de las decisiones de D2.",
        },
        {
          evidence_item: "matriz de cobertura del artículo 14 ter",
          review_guide:
            "Verificar que la matriz permita reconocer la cobertura de destinatarios previstos, finalidades, bases jurídicas e intereses legítimos aplicables, relacionando cada elemento con la sección correspondiente de la política. Identificar contenidos ausentes, ambiguos o inconsistentes con D2, distinguiendo cobertura documental de validez jurídica.",
          no_evidence_guidance:
            "Revisar las secciones de la política y los antecedentes estructurados de D2 para reconstruir la correspondencia entre requisitos legales y contenido publicado o preparado. Si no existe matriz, identificar los puntos comprobados y las brechas pendientes sin considerar obligatorio un formato documental específico.",
          expected_result:
            "Una comprobación trazable de los contenidos exigidos por el artículo 14 ter, letra d), con secciones cubiertas y omisiones identificables. La matriz debe apoyar la verificación de transparencia, sin convertirse en fuente independiente de finalidades, bases de licitud o conclusiones jurídicas.",
        },
      ],
      help_text: [
        "Que la política describa finalidades o bases no certifica que sean jurídicamente correctas: eso corresponde a D2.",
      ],
      required_facts: [],
      default_next_node_key: "check-security-rights",
      related_activity_keys: [
        "treatment.purpose_define",
        "lawful_basis.assign",
      ],
      provenance: "legal_requirement",
    },
    {
      node_key: "check-security-rights",
      node_type: "question",
      title: "Seguridad, derechos y recurso",
      prompt:
        "¿La política informa la política o medidas de seguridad, los derechos de acceso, rectificación, supresión, oposición y portabilidad, y el derecho a recurrir ante la Agencia en los supuestos legales?",
      why_it_matters:
        "Cubre los pasos canónicos 10, 11 y 12: seguridad, derechos AR SOP y recurso ante la Agencia.",
      fact_key: "transparency.policy.security_rights_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("transparency.policy.security_rights_covered"),
      evidence_to_review: ["política vigente"],
      evidence_review_help: [
        {
          evidence_item: "política vigente",
          review_guide:
            "Verificar que se describan la política y las medidas de seguridad adoptadas, sin exponer configuraciones sensibles que comprometan la protección. Comprobar que se informen los derechos de acceso, rectificación, supresión, oposición y portabilidad, junto con la posibilidad de recurrir ante la Agencia cuando una solicitud sea rechazada o no respondida oportunamente.",
          no_evidence_guidance:
            "Consultar la documentación institucional de seguridad, los procedimientos de derechos y los antecedentes de atención de solicitudes para reconstruir los contenidos que deben informarse. Si faltan elementos verificables, identificar las incorporaciones pendientes sin atribuir medidas inexistentes ni presentar procedimientos no implementados como operativos.",
          expected_result:
            "Información pública clara sobre seguridad, los cinco derechos señalados y el recurso ante la Agencia en los supuestos legales, coherente con los antecedentes disponibles. Las omisiones o discrepancias deben quedar identificadas, sin considerar que su descripción documental acredita por sí sola la eficacia de las medidas o procedimientos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-transfers",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-transfers",
      node_type: "question",
      title: "Transferencias internacionales",
      prompt:
        "¿La política informa las transferencias internacionales con nivel adecuado o garantías, o no existen transferencias que deban informarse?",
      why_it_matters:
        "Cubre el paso canónico 13, condicional: solo cuando correspondan transferencias.",
      fact_key: "transparency.policy.transfers_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "transparency.policy.transfers_covered",
        "No existen transferencias internacionales que deban informarse en este caso.",
      ),
      evidence_to_review: ["política vigente"],
      evidence_review_help: [
        {
          evidence_item: "política vigente",
          review_guide:
            "Verificar si existen comunicaciones o transferencias de datos personales a terceros países u organizaciones internacionales y comprobar que la política las informe cuando corresponda. Revisar si identifica la existencia o ausencia de un nivel adecuado de protección y, cuando este falte, las garantías que justifican la operación, conforme a los antecedentes disponibles.",
          no_evidence_guidance:
            "Consultar el inventario, los contratos con proveedores y los antecedentes de flujos internacionales para determinar si existen transferencias que deban informarse. Si no puede confirmarse su existencia, destino o garantías, identificar las verificaciones pendientes sin presumir que no hay transferencias ni seleccionar «No aplica» por la sola omisión documental.",
          expected_result:
            "Información pública verificable sobre las transferencias internacionales aplicables, su nivel de protección y las garantías pertinentes cuando correspondan, o ausencia de transferencias suficientemente comprobada para justificar «No aplica en este caso». Las omisiones e incertidumbres deben quedar identificadas, sin considerar que informar la transferencia acredita automáticamente su licitud.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-retention-sources",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-retention-sources",
      node_type: "question",
      title: "Conservación y fuentes",
      prompt:
        "¿La política informa el período de conservación, la fuente de los datos y, cuando corresponda, la fuente de acceso público?",
      why_it_matters:
        "Cubre los pasos canónicos 14 y 15: conservación y fuentes. Verifica el reflejo documental sin certificar la corrección material que corresponde a D2.",
      fact_key: "transparency.policy.retention_sources_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("transparency.policy.retention_sources_covered"),
      evidence_to_review: ["política vigente"],
      evidence_review_help: [
        {
          evidence_item: "política vigente",
          review_guide:
            "Comprobar que se indiquen los períodos de conservación aplicables a los datos tratados, con información suficientemente clara para comprender su duración según las finalidades correspondientes. Verificar que se identifique su procedencia y, cuando corresponda, su obtención desde fuentes de acceso público, cotejando estos antecedentes con las evaluaciones vigentes de D2.",
          no_evidence_guidance:
            "Consultar los criterios de conservación y la trazabilidad de fuentes documentados en D2 para identificar la información que debe reflejarse públicamente. Si faltan períodos, procedencias o antecedentes sobre fuentes de acceso público, señalar las incorporaciones pendientes sin inventar plazos ni atribuir orígenes no comprobados.",
          expected_result:
            "Información pública identificable sobre los períodos de conservación y la procedencia de los datos, incluida su obtención desde fuentes de acceso público cuando corresponda. Las omisiones o diferencias respecto de D2 deben quedar reconocidas, sin considerar que su descripción demuestra por sí sola la licitud de las fuentes o la justificación de los plazos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-withdrawal",
      related_activity_keys: [
        "retention.schedule",
        "treatment.source_traceability",
      ],
      provenance: "legal_requirement",
    },
    {
      node_key: "check-withdrawal",
      node_type: "question",
      title: "Derecho a retirar el consentimiento",
      prompt:
        "¿La política informa el derecho a retirar el consentimiento y la ausencia de efecto sobre la licitud previa, o no existe tratamiento basado en consentimiento?",
      why_it_matters:
        "Cubre el paso canónico 16, condicional: solo cuando exista tratamiento basado en consentimiento.",
      fact_key: "transparency.policy.withdrawal_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "transparency.policy.withdrawal_covered",
        "No existe tratamiento basado en consentimiento en este caso.",
      ),
      evidence_to_review: ["política vigente"],
      evidence_review_help: [
        {
          evidence_item: "política vigente",
          review_guide:
            "Verificar en las bases de licitud documentadas en D2 si existen tratamientos sustentados en consentimiento y comprobar que la política informe el derecho a revocarlo en cualquier momento, sin expresión de causa. Revisar que también explique que el retiro no invalida retroactivamente las operaciones realizadas bajo un consentimiento válido, sin confundir esta información con la ejecución efectiva del mecanismo.",
          no_evidence_guidance:
            "Consultar el inventario, las bases de licitud y los antecedentes de consentimiento para establecer si corresponde informar este derecho. Si faltan fundamentos o menciones verificables, identificar las incorporaciones pendientes sin presumir que no existen tratamientos basados en consentimiento ni seleccionar «No aplica» por la sola omisión de la política.",
          expected_result:
            "Información pública clara sobre el derecho de revocación y sus efectos no retroactivos cuando existan tratamientos basados en consentimiento, o ausencia de tales tratamientos suficientemente comprobada para justificar «No aplica en este caso». Las omisiones e incertidumbres deben quedar reconocidas, sin considerar que informar el derecho acredita su funcionamiento efectivo.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-automated",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-automated",
      node_type: "question",
      title: "Decisiones automatizadas",
      prompt:
        "¿La política informa la lógica significativa y las consecuencias previstas de decisiones automatizadas o perfiles, o no existen?",
      why_it_matters:
        "Cubre el paso canónico 17, condicional: solo cuando existan decisiones automatizadas o perfiles.",
      fact_key: "transparency.policy.automated_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "transparency.policy.automated_covered",
        "No existen decisiones automatizadas ni perfiles en este caso.",
      ),
      evidence_to_review: ["política vigente"],
      evidence_review_help: [
        {
          evidence_item: "política vigente",
          review_guide:
            "Identificar si la organización utiliza tratamientos automatizados para evaluar o perfilar personas o adoptar decisiones sobre ellas, comprobando su correspondencia con la información pública. Cuando existan, verificar que se explique de forma comprensible la lógica significativa utilizada y las consecuencias previstas para los titulares, sin limitar la revisión a sistemas de inteligencia artificial.",
          no_evidence_guidance:
            "Consultar el inventario, los procedimientos y los antecedentes de sistemas que clasifican, evalúan o generan decisiones sobre personas. Si no puede determinarse su existencia o funcionamiento, identificar las verificaciones pendientes sin presumir que no existen ni seleccionar «No aplica» por su ausencia en la política.",
          expected_result:
            "Información pública verificable sobre las decisiones automatizadas o perfiles aplicables, su lógica significativa y consecuencias previstas, o ausencia de estas operaciones suficientemente comprobada para justificar «No aplica en este caso». Las omisiones e incertidumbres deben quedar reconocidas, sin atribuir cumplimiento operativo por la sola descripción documental.",
        },
      ],
      required_facts: [],
      default_next_node_key: "synthesis",
      provenance: "legal_requirement",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la cobertura",
      prompt:
        "El sistema verifica si la política cubre todos los bloques exigibles.",
      answer_type: "none",
      required_facts: [...CHECKS],
      transitions: [
        {
          rule_id: "gaps-found",
          description: "Al menos un bloque exigible no está cubierto.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen bloques por incorporar antes de declarar la política estructurada.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún bloque está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan bloques por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "policy-covered",
          description:
            "Todos los bloques exigibles verificados o legítimamente no aplicables.",
          when: { op: "all", conditions: CHECKS.map(satisfied) },
          goto_outcome_key: "policy_assembled",
          explanation:
            "La política cubre los bloques del artículo 14 ter exigibles en este caso.",
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
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "policy_assembled",
      label: "Política estructurada",
      classification: "legal_requirement",
      explanation:
        "La política cubre los bloques del artículo 14 ter exigibles en este caso. Esto valida la cobertura del artefacto, no el cumplimiento integral de la empresa.",
      provenance: "legal_requirement",
      canonical_fact_effects: [
        { fact_key: "transparency.policy_status", value: "assembled" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Validar la publicación en D3.02",
          activity_key: "transparency.publication_validate",
        },
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la política vigente con su URL o ubicación, la matriz de cobertura del artículo 14 ter y la evidencia de fecha y versión.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere completar la política",
      classification: "agency_standard",
      explanation:
        "Al menos un bloque exigible no está cubierto. Incorpora los contenidos faltantes con sus documentos fuente.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Completar los bloques pendientes",
          note: "Incorpora cada bloque faltante usando los documentos fuente y actualiza la matriz de cobertura.",
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
        "Existen bloques pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
  ],
};
