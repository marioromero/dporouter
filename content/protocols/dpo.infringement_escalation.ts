import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.15.
 *
 * activity_key = dpo.infringement_escalation (procedure). Contenido
 * aprobado por la iteración vigente; usa exclusivamente pasos,
 * evidencia, legal basis, dependencias y aplicabilidad del contenido
 * canónico D1.15. Sin clasificación de gravedad, scoring ni criterios
 * de escalamiento inventados: el flujo verifica el caso conocido, su
 * comunicación directa y su registro.
 *
 * La compuerta de designación reutiliza el fact dpo.designated ya
 * producido por D1.09/D1.11. El modelo operativo, si existe, se usa
 * como insumo del canal directo (input_dependency canónica).
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce al escalamiento verificable);
 * - product-ready: false (sin lifecycle effects canónicos);
 * - motivo: el state_effect canónico exige crear un hallazgo
 *   (`create compliance_finding`), una fecha dinámica de comunicación
 *   y un flag de requerimiento cuya semántica post-cierre no es un
 *   `set` inequívoco; nada de eso cabe en el patrón simple soportado.
 */

const VERIFICATION_FACTS = [
  "dpo.designated",
  "dpo.escalation.case_known",
  "dpo.escalation.registered",
  "dpo.escalation.determined",
  "dpo.escalation.communicated",
  "dpo.escalation.measures",
  "dpo.escalation.findings_derivation",
];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function verifiedOrNa(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
}

function stateOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "Realizado y respaldado con evidencia.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "Aún no realizado o sin evidencia suficiente.",
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

export const DPO_INFRINGEMENT_ESCALATION_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.infringement_escalation.v1",
  activity_key: "dpo.infringement_escalation",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de escalamiento de infracciones",
  description:
    "Guía al DPO desde el caso conocido hasta su comunicación directa a la autoridad con registro trazable: antecedente, hechos y norma, comunicación, medidas y derivación a hallazgos.",
  entry_node_key: "designation-gate",
  decision_fact_keys: VERIFICATION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "designation-gate",
      node_type: "question",
      title: "DPO designado",
      prompt: "¿Existe actualmente un DPO designado?",
      why_it_matters:
        "El deber de escalamiento recae sobre el DPO designado. Sin designación corresponde designar primero.",
      fact_key: "dpo.designated",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe un DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "Aún no hay DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo.designated", value: "unknown" },
        },
      ],
      evidence_to_review: ["expediente de designación"],
      evidence_review_help: [
        {
          evidence_item: "expediente de designación",
          review_guide:
            "Corresponde comprobar que exista una designación formal y vigente del DPO, identificando a la persona designada y la autoridad ante la cual rinde cuenta. Revisar los antecedentes de nombramiento y eventuales modificaciones para determinar quién debe ejercer el deber de comunicación directa.",
          no_evidence_guidance:
            "Pueden revisarse resoluciones, instrumentos de designación, comunicaciones institucionales o registros equivalentes que acrediten el nombramiento. Debe distinguirse entre un expediente no localizado, una designación cuya vigencia no está clara y la ausencia efectiva de un DPO designado.",
          expected_result:
            "Una designación vigente y acreditable, con identificación del DPO y de la autoridad correspondiente para el escalamiento. Si no existe designación, registrar esa situación y seguir la ruta prevista por el protocolo, sin presumir automáticamente una infracción por falta de nombramiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "case-gate",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay escalamiento que gestionar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. El escalamiento requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "case-gate",
      node_type: "question",
      title: "Caso conocido",
      prompt:
        "¿Tomó el DPO conocimiento de una posible infracción que deba comunicarse?",
      why_it_matters:
        "El caso conocido activa el proceso: sin antecedente no hay escalamiento que gestionar.",
      fact_key: "dpo.escalation.case_known",
      answer_type: "single_select",
      options: [
        {
          value: "known",
          label: "Sí, caso identificado",
          description: "El DPO conoce una posible infracción.",
          fact_effect: {
            fact_key: "dpo.escalation.case_known",
            value: "known",
          },
        },
        {
          value: "none",
          label: "Sin caso",
          description: "No existe caso conocido por escalar.",
          fact_effect: {
            fact_key: "dpo.escalation.case_known",
            value: "none",
          },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo.escalation.case_known",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: ["antecedentes del caso conocido por el DPO"],
      evidence_review_help: [
        {
          evidence_item: "antecedentes del caso conocido por el DPO",
          review_guide:
            "Corresponde identificar los hechos o comunicaciones que llegaron al conocimiento del DPO, su origen y la fecha en que fueron conocidos, cuando estos datos estén disponibles. Revisar si contienen elementos concretos que permitan advertir una posible infracción, diferenciando hechos conocidos, indicios e información aún no confirmada.",
          no_evidence_guidance:
            "Pueden revisarse comunicaciones recibidas, denuncias internas, registros de incidentes, entrevistas o antecedentes de supervisión que permitan reconstruir cómo se conoció el caso. Distinguir entre información existente pero no localizada, una referencia vaga sin elementos suficientes y la ausencia efectiva de un caso conocido por el DPO.",
          expected_result:
            "Antecedentes identificables que permitan determinar si existe un caso que deba continuar hacia la evaluación y comunicación previstas en el protocolo. No se exige una investigación concluida ni una infracción definitivamente acreditada, pero tampoco debe calificarse automáticamente cualquier rumor como un caso comunicable.",
        },
      ],
      required_facts: [],
      default_next_node_key: "register-case",
      transitions: [
        {
          rule_id: "no-case",
          description: "Sin caso conocido no inicia el escalamiento.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.escalation.case_known",
            value: "none",
          },
          goto_outcome_key: "no_pending_case",
          explanation:
            "No existe caso conocido. El deber de comunicar persiste ante nuevos antecedentes.",
        },
      ],
      provenance: "legal_requirement",
    },
    {
      node_key: "register-case",
      node_type: "question",
      title: "Registro del antecedente",
      prompt: "¿Quedó registrado el antecedente conocido por el DPO?",
      why_it_matters:
        "Sin registro del antecedente no hay trazabilidad del caso escalado.",
      fact_key: "dpo.escalation.registered",
      answer_type: "single_select",
      options: stateOptions("dpo.escalation.registered"),
      evidence_to_review: [
        "antecedentes remitidos",
        "revisión de antecedentes",
      ],
      evidence_review_help: [
        {
          evidence_item: "antecedentes remitidos",
          review_guide:
            "Corresponde verificar que los antecedentes del caso estén identificados y registrados de manera que permitan reconocer los hechos conocidos por el DPO, su origen y la información disponible. Si ya fueron remitidos, comprobar qué documentación se incluyó y conservar la distinción entre el registro inicial y la comunicación posterior a la autoridad.",
          no_evidence_guidance:
            "Pueden revisarse comunicaciones recibidas, registros de incidentes, denuncias internas o documentos equivalentes que permitan reconstruir el antecedente. Distinguir entre información existente pero no localizada, antecedentes todavía no organizados y ausencia efectiva de un registro suficiente del caso.",
          expected_result:
            "Antecedentes identificables y trazables, disponibles para sustentar la evaluación y eventual comunicación del caso. No se exige que la remisión a la autoridad ya haya ocurrido en esta etapa ni que los hechos estén definitivamente acreditados.",
        },
        {
          evidence_item: "revisión de antecedentes",
          review_guide:
            "Verificar que los antecedentes conocidos hayan sido examinados para identificar los hechos relevantes, las fuentes disponibles y los aspectos que requieren aclaración. La revisión debe permitir diferenciar información comprobada, indicios e incertidumbres, sin adelantar una conclusión definitiva sobre la existencia de una infracción.",
          no_evidence_guidance:
            "Pueden revisarse notas de análisis, entrevistas, comunicaciones internas o registros equivalentes que reflejen la revisión realizada. Distinguir entre una revisión efectuada sin respaldo localizado y la ausencia de examen suficiente de los antecedentes disponibles.",
          expected_result:
            "Una revisión trazable que permita comprender qué antecedentes fueron considerados y qué cuestiones permanecen abiertas. No se exige cerrar la investigación ni resolver anticipadamente la calificación jurídica del caso para dejar constancia de su conocimiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "determine-facts",
      provenance: "legal_requirement",
    },
    {
      node_key: "determine-facts",
      node_type: "question",
      title: "Hechos y norma afectada",
      prompt:
        "¿Quedaron determinados los hechos y la norma potencialmente afectada, sin cerrar anticipadamente la investigación?",
      why_it_matters:
        "La determinación sostiene la comunicación sin prejuzgar el resultado de la investigación.",
      fact_key: "dpo.escalation.determined",
      answer_type: "single_select",
      options: stateOptions("dpo.escalation.determined"),
      evidence_to_review: [
        "antecedentes remitidos",
        "revisión de evidencia",
      ],
      evidence_review_help: [
        {
          evidence_item: "antecedentes remitidos",
          review_guide:
            "Corresponde comprobar que los antecedentes del caso permitan identificar los hechos conocidos, las circunstancias relevantes y la disposición de protección de datos potencialmente afectada. Distinguir la información comprobada de los indicios o afirmaciones pendientes de verificación, sin presentar la calificación jurídica preliminar como una conclusión definitiva.",
          no_evidence_guidance:
            "Pueden revisarse comunicaciones, registros del caso, documentos recibidos o antecedentes equivalentes que permitan reconstruir los hechos y su posible relevancia normativa. Distinguir entre información no localizada, antecedentes incompletos y ausencia de elementos suficientes para describir razonablemente el caso.",
          expected_result:
            "Antecedentes organizados que permitan comunicar los hechos y la norma potencialmente comprometida, indicando las incertidumbres relevantes. No se exige que la investigación esté concluida ni que exista una resolución que declare formalmente la infracción.",
        },
        {
          evidence_item: "revisión de evidencia",
          review_guide:
            "Verificar que la evidencia disponible haya sido examinada para sustentar la descripción de los hechos y la identificación preliminar de la norma posiblemente afectada. La revisión debe reconocer fuentes, contradicciones y aspectos todavía pendientes, evitando conclusiones categóricas que excedan lo acreditado.",
          no_evidence_guidance:
            "Pueden revisarse notas de análisis, entrevistas, registros de supervisión o antecedentes que reflejen el examen realizado. Distinguir entre una revisión efectuada sin constancia localizada y la ausencia de evaluación suficiente de la evidencia disponible.",
          expected_result:
            "Una revisión trazable que permita comprender por qué los hechos podrían constituir una infracción y qué aspectos requieren aclaración. La evaluación debe ser suficiente para sustentar el escalamiento cuando corresponda, sin sustituir una investigación posterior ni retrasar injustificadamente la comunicación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "communicate-authority",
      provenance: "legal_requirement",
    },
    {
      node_key: "communicate-authority",
      node_type: "question",
      title: "Comunicación directa a la autoridad",
      prompt:
        "¿Se comunicó directamente a la autoridad ante la cual rinde cuenta el DPO?",
      why_it_matters:
        "La comunicación directa a la autoridad es el deber legal central de esta actividad.",
      fact_key: "dpo.escalation.communicated",
      answer_type: "single_select",
      options: stateOptions("dpo.escalation.communicated"),
      evidence_to_review: [
        "registro de comunicación",
        "fecha y destinatario",
        "modelo operativo si existe",
      ],
      evidence_review_help: [
        {
          evidence_item: "registro de comunicación",
          review_guide:
            "Verificar que exista constancia de una comunicación realizada directamente por el DPO a la autoridad ante la cual rinde cuenta, con antecedentes suficientes para comprender el caso comunicado. Comprobar que el registro distinga la comunicación efectiva de un borrador, una recomendación interna o una gestión dirigida solo a intermediarios.",
          no_evidence_guidance:
            "Pueden revisarse correos enviados, comunicaciones institucionales, registros de reuniones, constancias de entrega u otros medios que acrediten la comunicación directa. Distinguir entre una comunicación efectuada sin respaldo localizado, una comunicación pendiente y actuaciones preparatorias que por sí solas no acreditan el cumplimiento del deber.",
          expected_result:
            "Una constancia verificable de que el DPO comunicó directamente a la autoridad correspondiente los hechos y la posible infracción conocidos, con las incertidumbres pertinentes. No se exige un formato universal ni una investigación concluida, pero la sola preparación del mensaje no equivale a su comunicación.",
        },
        {
          evidence_item: "fecha y destinatario",
          review_guide:
            "Comprobar que puedan identificarse cuándo se efectuó la comunicación y quién la recibió, verificando que el destinatario corresponda a la autoridad ante la cual rinde cuenta el DPO. Contrastar estos datos con el registro de comunicación y, cuando exista, con el instrumento de designación o la estructura de reporte vigente.",
          no_evidence_guidance:
            "Pueden revisarse encabezados de correos, acuses de recibo, registros institucionales, actas o constancias equivalentes que permitan establecer fecha y destinatario. Si los datos no pueden corroborarse, registrar esa limitación sin presumir que la comunicación llegó a la autoridad correcta.",
          expected_result:
            "Fecha y destinatario identificables que permitan verificar la trazabilidad y el carácter directo de la comunicación. La evidencia debe distinguir a la autoridad correspondiente de otras personas u órganos informados, sin exigir un medio de envío específico.",
        },
        {
          evidence_item: "modelo operativo si existe",
          review_guide:
            "Si existe un modelo operativo del DPO, revisar cómo identifica la línea de reporte y el canal de comunicación directa con la autoridad correspondiente. Contrastar esa referencia con la comunicación realizada, sin convertir el modelo en un requisito previo ni exigir un documento independiente.",
          no_evidence_guidance:
            "Puede consultarse el expediente de designación, la estructura institucional u otros antecedentes que permitan identificar a la autoridad ante la cual rinde cuenta el DPO. La falta de un modelo operativo documentado debe distinguirse de la falta de comunicación y no elimina ni suspende el deber legal de informar directamente.",
          expected_result:
            "Cuando exista, el modelo operativo aporta una referencia coherente para identificar el canal y destinatario de la comunicación directa. Si no existe, la verificación puede apoyarse en el registro de comunicación y la identificación de la autoridad competente, sin penalizar automáticamente esa ausencia.",
        },
      ],
      help_text: [
        "Si existe modelo operativo, su canal directo es el insumo; su ausencia no elimina el deber de comunicar.",
      ],
      required_facts: [],
      default_next_node_key: "record-measures",
      related_activity_keys: ["dpo.operating_model"],
      provenance: "legal_requirement",
    },
    {
      node_key: "record-measures",
      node_type: "question",
      title: "Medidas definidas por la autoridad",
      prompt:
        "¿Quedaron registradas las medidas organizativas, funcionales o disciplinarias definidas por la autoridad?",
      why_it_matters:
        "Sin registro de medidas no hay seguimiento posible de lo instruido.",
      fact_key: "dpo.escalation.measures",
      answer_type: "single_select",
      options: stateOptions("dpo.escalation.measures"),
      evidence_to_review: ["medidas adoptadas o instruidas"],
      evidence_review_help: [
        {
          evidence_item: "medidas adoptadas o instruidas",
          review_guide:
            "Verificar si, tras recibir la comunicación del DPO, la autoridad definió o instruyó medidas organizativas, funcionales o disciplinarias relacionadas con el caso y si quedaron registradas. Cuando existan, identificar su contenido, la autoridad que las dispuso y los responsables o plazos expresamente establecidos, sin presumir que deban concurrir todas las categorías.",
          no_evidence_guidance:
            "Pueden revisarse respuestas de la autoridad, actas, instrucciones internas, comunicaciones institucionales o registros de seguimiento que permitan determinar si se adoptaron decisiones. Distinguir entre medidas existentes sin respaldo localizado, decisiones pendientes y ausencia de medidas definidas, sin inventar instrucciones ni equiparar esta última situación automáticamente con incumplimiento.",
          expected_result:
            "Un registro trazable de las medidas efectivamente adoptadas o instruidas, cuando existan, que permita conocer su contenido y facilitar el seguimiento correspondiente. Si la autoridad no definió medidas, dejar constancia de esa circunstancia y reflejarla conforme a las opciones existentes, sin exigir decisiones ficticias ni trasladar al DPO la responsabilidad de adoptarlas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "derive-findings",
      provenance: "legal_requirement",
    },
    {
      node_key: "derive-findings",
      node_type: "question",
      title: "Derivación a hallazgos",
      prompt:
        "¿Se derivó el seguimiento al sistema de hallazgos, o se descartó fundadamente su aplicación?",
      why_it_matters:
        "La derivación conecta el caso con el seguimiento correctivo cuando corresponde.",
      fact_key: "dpo.escalation.findings_derivation",
      answer_type: "single_select",
      options: [
        {
          value: "yes",
          label: "Verificado",
          description: "Derivado al sistema de hallazgos con evidencia.",
          fact_effect: {
            fact_key: "dpo.escalation.findings_derivation",
            value: "yes",
          },
        },
        {
          value: "na",
          label: "No aplica en este caso",
          description:
            "El caso no requiere seguimiento en el sistema de hallazgos.",
          fact_effect: {
            fact_key: "dpo.escalation.findings_derivation",
            value: "na",
          },
        },
        {
          value: "no",
          label: "Pendiente",
          description: "Aún no realizado o sin evidencia suficiente.",
          fact_effect: {
            fact_key: "dpo.escalation.findings_derivation",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo.escalation.findings_derivation",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "registro de comunicación",
        "medidas adoptadas o instruidas",
      ],
      evidence_review_help: [
        {
          evidence_item: "registro de comunicación",
          review_guide:
            "Verificar que el registro de comunicación permita identificar el caso informado por el DPO y relacionarlo con la decisión de derivar su seguimiento al sistema de hallazgos. Si se descarta la derivación, comprobar que el fundamento se vincule con las características del caso, sin equiparar la comunicación a la autoridad con la apertura automática de un hallazgo.",
          no_evidence_guidance:
            "Pueden revisarse las comunicaciones enviadas a la autoridad, sus respuestas y los registros internos que permitan reconstruir el tratamiento posterior del caso. Distinguir entre una comunicación efectuada sin respaldo localizado, una decisión de seguimiento pendiente y un descarte de derivación sin fundamento documentado.",
          expected_result:
            "Trazabilidad entre el caso comunicado y su destino posterior: derivación al sistema de hallazgos cuando corresponda o descarte fundado. La comunicación directa a la autoridad no sustituye la derivación cuando esta resulta necesaria ni obliga a abrir un hallazgo en todos los casos.",
        },
        {
          evidence_item: "medidas adoptadas o instruidas",
          review_guide:
            "Examinar las medidas efectivamente adoptadas o instruidas por la autoridad para determinar si requieren seguimiento mediante el sistema de hallazgos y, de ser así, comprobar su derivación. Si no existen medidas definidas o estas no requieren ese sistema, revisar el fundamento sin presumir que su ausencia excluye automáticamente el seguimiento.",
          no_evidence_guidance:
            "Pueden revisarse instrucciones de la autoridad, registros de decisiones, antecedentes del caso y constancias del sistema de hallazgos que permitan identificar si se dispuso seguimiento correctivo. Distinguir entre medidas existentes sin respaldo localizado, decisiones pendientes y una determinación fundada de que el sistema no corresponde al caso.",
          expected_result:
            "Cuando proceda, constancia que vincule las medidas o necesidades correctivas del caso con un seguimiento identificable en el sistema de hallazgos. Si no procede, se requiere fundamento suficiente para «No aplica»; no usar esa opción para ocultar una derivación pendiente o falta de información.",
        },
      ],
      help_text: [
        "Solo cuando corresponda: si el caso no requiere seguimiento en hallazgos, marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del escalamiento",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el escalamiento sigue en curso.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "escalation_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El caso aún no queda escalado y registrado.",
        },
        {
          rule_id: "all-verified",
          description:
            "Caso, registro, determinación, comunicación, medidas y derivación verificados.",
          when: {
            op: "all",
            conditions: [
              isDone("dpo.designated"),
              {
                op: "fact_equals",
                fact_key: "dpo.escalation.case_known",
                value: "known",
              },
              isDone("dpo.escalation.registered"),
              isDone("dpo.escalation.determined"),
              isDone("dpo.escalation.communicated"),
              isDone("dpo.escalation.measures"),
              verifiedOrNa("dpo.escalation.findings_derivation"),
            ],
          },
          goto_outcome_key: "escalation_complete",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "escalation_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "escalation_complete",
      label: "Infracción escalada y registrada",
      classification: "legal_requirement",
      explanation:
        "El caso conocido quedó registrado, determinado, comunicado directamente a la autoridad y con medidas y derivación verificadas.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el registro de escalamiento",
          note: "Archiva el registro de comunicación, los antecedentes remitidos, la fecha y destinatario, y las medidas adoptadas o instruidas.",
        },
      ],
    },
    {
      outcome_key: "escalation_in_progress",
      label: "Escalamiento en curso",
      classification: "agency_standard",
      explanation:
        "Quedan verificaciones pendientes o sin información. Completa cada punto y conserva su evidencia.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "DPO aún no designado",
      classification: "agency_standard",
      explanation:
        "Sin DPO designado no hay escalamiento que gestionar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Designar DPO en D1.08",
          activity_key: "dpo.designate",
        },
      ],
    },
    {
      outcome_key: "no_pending_case",
      label: "Sin caso por escalar",
      classification: "agency_standard",
      explanation:
        "No existe caso conocido. El deber de comunicar persiste ante nuevos antecedentes.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar ante un nuevo caso",
        },
      ],
    },
  ],
};
