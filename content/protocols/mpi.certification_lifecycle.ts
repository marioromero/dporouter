import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.19.
 *
 * activity_key = mpi.certification_lifecycle (procedure). Contenido
 * aprobado por la iteración vigente; usa exclusivamente pasos,
 * evidencia, legal basis, dependencias y aplicabilidad del contenido
 * canónico D1.19. Verifica la completitud del expediente de
 * certificación sin confundir el estado de certificación con el ciclo
 * de vida interno: nunca escribe ni modifica el lifecycle.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04, D1.18 o Diagnóstico (`mpi.lifecycle_status`
 * declarado en `external_fact_keys`): el programa debe estar
 * implementado antes de preparar la solicitud.
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce al expediente verificable);
 * - product-ready: false (sin estado canónico materializable);
 * - motivo: la certificación es un ciclo temporal de 8 estados con
 *   vigencia, expiración y renovación histórica; ningún `set` simple
 *   representa esa máquina de estados ni sus fechas.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";
const DECISION_FACT = "mpi.certification.case_known";

const OWN_FACTS = [
  DECISION_FACT,
  "mpi.certification.implemented_confirmed",
  "mpi.certification.antecedents_prepared",
  "mpi.certification.request_recorded",
  "mpi.certification.grant_recorded",
  "mpi.certification.renewal_controlled",
  "mpi.certification.closures_recorded",
];

const VERIFICATION_FACTS = [LIFECYCLE_FACT, ...OWN_FACTS];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
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

export const MPI_CERTIFICATION_LIFECYCLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.certification_lifecycle.v1",
  activity_key: "mpi.certification_lifecycle",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del expediente de certificación",
  description:
    "Verifica que el expediente de certificación esté completo y trazable sin confundir la certificación con el ciclo de vida interno: programa implementado, antecedentes, solicitud, otorgamiento, renovación y cierres.",
  entry_node_key: "case-gate",
  decision_fact_keys: OWN_FACTS,
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "case-gate",
      node_type: "question",
      title: "Gestión de certificación",
      prompt:
        "¿El responsable busca certificar, renovar o gestionar un cambio en la certificación?",
      why_it_matters:
        "La gestión activa el expediente: sin decisión de certificar, renovar o gestionar un cambio no hay trámite que verificar.",
      fact_key: DECISION_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "certify",
          label: "Certificar",
          description: "Se busca obtener la certificación.",
          fact_effect: { fact_key: DECISION_FACT, value: "certify" },
        },
        {
          value: "renew",
          label: "Renovar",
          description: "Se busca renovar la certificación.",
          fact_effect: { fact_key: DECISION_FACT, value: "renew" },
        },
        {
          value: "manage_change",
          label: "Gestionar un cambio",
          description: "Se gestiona un cambio en el estado de certificación.",
          fact_effect: { fact_key: DECISION_FACT, value: "manage_change" },
        },
        {
          value: "none",
          label: "Sin gestión",
          description: "No existe gestión de certificación en curso.",
          fact_effect: { fact_key: DECISION_FACT, value: "none" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: DECISION_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: ["seguimiento regulatorio"],
      evidence_review_help: [
        {
          evidence_item: "seguimiento regulatorio",
          review_guide:
            "Verificar que exista una decisión identificable del responsable sobre solicitar la certificación inicial, renovarla o gestionar un cambio en su estado, precisando la actuación prevista y su situación actual. Contrastar el seguimiento con los antecedentes disponibles y, cuando corresponda, con comunicaciones o actuaciones de la Agencia, sin confundir la intención de iniciar un trámite con su presentación o resolución efectiva.",
          no_evidence_guidance:
            "Revisar acuerdos, instrucciones internas, registros de seguimiento, comunicaciones con la Agencia u otros antecedentes equivalentes que permitan establecer si el responsable adoptó una decisión concreta. Si no existe tal decisión, dejar constancia de que no se ha activado una gestión de certificación, sin presumir incumplimiento por la sola ausencia de una solicitud voluntaria.",
          expected_result:
            "Una decisión y tipo de gestión claramente identificados, con trazabilidad suficiente de su estado y los antecedentes que justifican continuar, renovar, actualizar o cerrar el seguimiento. Distinguir entre certificación no solicitada, trámite en preparación, solicitud presentada y estados acreditados por actos o comunicaciones pertinentes, sin modificar automáticamente el ciclo de vida interno del MPI.",
        },
      ],
      required_facts: [],
      default_next_node_key: "confirm-implemented",
      transitions: [
        {
          rule_id: "no-case",
          description: "Sin gestión no hay expediente que verificar.",
          when: {
            op: "fact_equals",
            fact_key: DECISION_FACT,
            value: "none",
          },
          goto_outcome_key: "no_pending_case",
          explanation:
            "No existe gestión de certificación en curso. Nada que verificar por esta vía.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "confirm-implemented",
      node_type: "question",
      title: "Confirmación de programa implementado",
      prompt:
        "¿Quedó confirmado que el MPI está implementado antes de preparar la solicitud?",
      why_it_matters:
        "Preparar una solicitud sobre un programa no implementado invalida el trámite.",
      fact_key: "mpi.certification.implemented_confirmed",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.implemented_confirmed"),
      evidence_to_review: [
        "revisión del programa",
        "revisión documental",
      ],
      evidence_review_help: [
        {
          evidence_item: "revisión del programa",
          review_guide:
            "Comprobar que el MPI esté efectivamente implementado y comprenda los componentes obligatorios aplicables, contrastando su contenido con las verificaciones de consolidación y cierre de brechas previas. Distinguir entre existencia documental, adopción formal y aplicación real de medidas; la certificación no es requisito para verificar la implementación interna.",
          no_evidence_guidance:
            "Revisar el programa consolidado, sus componentes, registros de implementación, resultados de verificaciones anteriores y antecedentes equivalentes. Si solo hay un documento proyectado, aprobación formal sin ejecución o componentes obligatorios pendientes, registrar que la implementación no está suficientemente acreditada para preparar la solicitud.",
          expected_result:
            "Un MPI implementado y verificable, con componentes obligatorios aplicables incorporados y sin brechas sustantivas pendientes que impidan acreditar los requisitos del modelo. La confirmación sustenta la preparación de la solicitud, pero no declara que la autoridad haya certificado el programa ni altera su estado interno.",
        },
        {
          evidence_item: "revisión documental",
          review_guide:
            "Verificar que existan antecedentes documentales suficientes, coherentes y localizables para respaldar la implementación del MPI y las conclusiones de actividades previas. Contrastar los documentos con el estado real del programa, identificando inconsistencias, versiones desactualizadas o afirmaciones de cumplimiento sin soporte verificable.",
          no_evidence_guidance:
            "Revisar expedientes internos, registros de ejecución, instrumentos aprobados, constancias de difusión, matrices y otros respaldos relacionados con los componentes obligatorios. Si faltan antecedentes esenciales o no permiten comprobar la ejecución efectiva, registrar la insuficiencia y no presentar como acreditada una implementación que aún no puede verificarse.",
          expected_result:
            "Un expediente documental consistente y suficiente para sustentar la implementación efectiva del MPI y preparar fundadamente los antecedentes de certificación. No se exige un formato universal ni duplicar respaldos disponibles, pero cada conclusión relevante debe poder rastrearse a evidencia comprobable y actualizada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "prepare-antecedents",
      related_activity_keys: ["mpi.assemble_program"],
      provenance: "legal_requirement",
    },
    {
      node_key: "prepare-antecedents",
      node_type: "question",
      title: "Antecedentes requeridos",
      prompt: "¿Quedaron preparados los antecedentes requeridos?",
      why_it_matters:
        "Sin antecedentes completos la solicitud queda expuesta a observaciones o denegación.",
      fact_key: "mpi.certification.antecedents_prepared",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.antecedents_prepared"),
      evidence_to_review: ["antecedentes remitidos"],
      evidence_review_help: [
        {
          evidence_item: "antecedentes remitidos",
          review_guide:
            "Verificar que se hayan reunido y preparado antecedentes suficientes para sustentar la solicitud de certificación o renovación, comprobando su integridad, coherencia con el MPI implementado y correspondencia con los requisitos aplicables al procedimiento. Revisar que las versiones documentales sean identificables y estén disponibles para su presentación, distinguiendo la preparación del expediente de su remisión efectiva a la Agencia.",
          no_evidence_guidance:
            "Revisar el expediente del MPI, documentos de sus componentes obligatorios, verificaciones de implementación y registros de preparación para localizar antecedentes equivalentes o identificar faltantes. Si el conjunto aún es insuficiente, registrar qué debe resolverse antes de presentar la solicitud, sin exigir comprobantes de envío cuando el trámite todavía no se ha iniciado.",
          expected_result:
            "Antecedentes completos, consistentes y localizables para respaldar la solicitud de certificación o renovación, conforme a las exigencias e instrucciones oficiales aplicables al momento de presentarla. La preparación debe quedar acreditada sin presumir que los documentos ya se remitieron, que la solicitud fue admitida o que la certificación fue otorgada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "record-request",
      provenance: "legal_requirement",
    },
    {
      node_key: "record-request",
      node_type: "question",
      title: "Solicitud y estado registrados",
      prompt: "¿Quedaron registradas la solicitud y su estado?",
      why_it_matters:
        "Sin registro de la solicitud no hay trazabilidad del trámite.",
      fact_key: "mpi.certification.request_recorded",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.request_recorded"),
      evidence_to_review: ["solicitud", "evidencia de registro"],
      evidence_review_help: [
        {
          evidence_item: "solicitud",
          review_guide:
            "Verificar que exista una solicitud de certificación o renovación identificable, presentada por el responsable ante la Agencia, con antecedentes para reconocer su objeto, fecha y relación con el MPI correspondiente. Contrastar la solicitud con la decisión adoptada y los antecedentes preparados, distinguiendo un borrador, una presentación efectiva y una eventual resolución de la autoridad.",
          no_evidence_guidance:
            "Revisar el expediente de certificación, registros de presentación, comunicaciones con la Agencia y documentos conservados por el responsable para localizar la solicitud o determinar si el trámite aún no se inició. Si solo existen antecedentes preparados o una decisión de solicitar, registrar que no se acredita la presentación, sin presumir denegación ni procedimiento en curso.",
          expected_result:
            "Una solicitud identificada y respaldada que permita comprobar su presentación, objeto y vínculo con el MPI cuya certificación se gestiona. El registro permite seguir el procedimiento sin confundir la solicitud con su admisión, aprobación, inscripción registral o certificación otorgada.",
        },
        {
          evidence_item: "evidencia de registro",
          review_guide:
            "Comprobar que exista constancia verificable de presentación o recepción de la solicitud y un registro actualizado de su estado conocido, con fechas, referencias y comunicaciones oficiales cuando estén disponibles. Distinguir el seguimiento interno del expediente, la recepción por la Agencia y la eventual inscripción de una certificación otorgada en el registro público correspondiente.",
          no_evidence_guidance:
            "Revisar comprobantes de ingreso, acuses de recibo, números de expediente, comunicaciones de la Agencia u otros medios oficiales para acreditar la presentación y reconstruir el estado del procedimiento. Si la constancia es insuficiente, registrar la incertidumbre y verificar el canal utilizado, sin inventar un número de expediente ni considerar concedida la certificación.",
          expected_result:
            "Trazabilidad suficiente de la solicitud y de su estado administrativo conocido, respaldada por constancias de presentación o recepción y por actuaciones posteriores efectivamente ocurridas. El registro refleja hechos acreditados y fechas, sin atribuir a una solicitud en trámite efectos de certificación vigente ni exigir inscripción pública antes del otorgamiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "record-grant",
      provenance: "legal_requirement",
    },
    {
      node_key: "record-grant",
      node_type: "question",
      title: "Otorgamiento y vigencia",
      prompt:
        "¿Quedaron registradas la certificación y su vigencia cuando fue otorgada?",
      why_it_matters:
        "Sin registro de vigencia no es posible controlar renovación ni expiración.",
      fact_key: "mpi.certification.grant_recorded",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.grant_recorded"),
      evidence_to_review: [
        "certificado cuando exista",
        "fecha de vigencia",
        "evidencia de registro",
      ],
      evidence_review_help: [
        {
          evidence_item: "certificado cuando exista",
          review_guide:
            "Verificar, cuando la Agencia haya otorgado la certificación del MPI, que exista un certificado o antecedente oficial equivalente que identifique al responsable, el programa certificado y la decisión de otorgamiento. Comprobar su correspondencia con el expediente y distinguir entre certificación otorgada, solicitud presentada, trámite pendiente y antecedentes internos de implementación.",
          no_evidence_guidance:
            "Revisar resoluciones, comunicaciones oficiales, documentos del expediente y registros disponibles para determinar si la certificación fue otorgada y localizar su respaldo. Si aún no hay decisión favorable, registrar el estado acreditado del procedimiento y la ausencia legítima de certificado, sin considerar certificada a la organización ni exigir un documento que todavía no corresponde emitir.",
          expected_result:
            "Un certificado o respaldo oficial del otorgamiento identificable y asociado al MPI del responsable, cuando exista una decisión favorable de la autoridad. Si la certificación no fue otorgada, reflejarlo sin fabricar evidencia, atribuir vigencia inexistente ni confundir implementación interna con certificación.",
        },
        {
          evidence_item: "fecha de vigencia",
          review_guide:
            "Comprobar que, cuando exista certificación otorgada, estén registradas sus fechas de inicio y término conforme al certificado, la resolución y las disposiciones aplicables. Contrastar las fechas con antecedentes oficiales y considerar la vigencia normativa de tres años, sin apartarse del acto administrativo ni presumir renovación automática.",
          no_evidence_guidance:
            "Revisar el certificado, la resolución de otorgamiento, comunicaciones oficiales e información registral disponible para identificar las fechas y aclarar discrepancias. Si la certificación no se otorgó o sus fechas no pueden acreditarse, registrar esa condición sin asignar una fecha estimada como oficial.",
          expected_result:
            "Fechas de vigencia documentadas y coherentes con los antecedentes oficiales, suficientes para controlar la renovación, expiración o cambios posteriores. Distinguir una certificación efectivamente otorgada de solicitudes en trámite, sin prolongar automáticamente su duración ni alterar el ciclo de vida interno del MPI.",
        },
        {
          evidence_item: "evidencia de registro",
          review_guide:
            "Verificar, cuando la certificación haya sido otorgada, que exista respaldo de su inscripción o de la información registral oficial correspondiente, vinculando al responsable, el MPI certificado y su vigencia. Distinguir esta evidencia del comprobante de presentación de la solicitud, pues registrar una solicitud no equivale a registrar una certificación concedida.",
          no_evidence_guidance:
            "Consultar los antecedentes del expediente, comunicaciones de la Agencia y medios oficiales de consulta registral disponibles para localizar o verificar la inscripción. Si la certificación aún no fue otorgada, dejar constancia de que esa evidencia no corresponde en esta etapa; si fue otorgada pero no puede acreditarse la inscripción, registrar la falta de verificación sin presumir su existencia ni su inexistencia definitiva.",
          expected_result:
            "Un respaldo verificable de la situación registral de la certificación otorgada, relacionado con el responsable, el MPI y las fechas de vigencia acreditadas. El expediente debe distinguir la inscripción de una certificación concedida del registro de una solicitud y de los registros internos de seguimiento, que no producen por sí solos efectos oficiales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "control-renewal",
      provenance: "legal_requirement",
    },
    {
      node_key: "control-renewal",
      node_type: "question",
      title: "Control de renovación",
      prompt: "¿Quedó establecido el control de la renovación?",
      why_it_matters:
        "Sin control la certificación puede expirar sin gestión oportuna.",
      fact_key: "mpi.certification.renewal_controlled",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.renewal_controlled"),
      evidence_to_review: [
        "resoluciones de renovación, denegación, término o revocación",
      ],
      evidence_review_help: [
        {
          evidence_item: "resoluciones de renovación, denegación, término o revocación",
          review_guide:
            "Verificar que exista un mecanismo de seguimiento de la vigencia de la certificación, con responsables definidos, fechas acreditadas, revisión periódica y actuaciones previstas para gestionar oportunamente la renovación. Examinar resoluciones de renovación, denegación, término o revocación solo cuando hayan ocurrido, comprobando su correspondencia con el expediente y su impacto en el estado real de la certificación.",
          no_evidence_guidance:
            "Revisar el certificado vigente, las fechas de otorgamiento y vencimiento, el expediente, los registros de seguimiento y las comunicaciones con la Agencia para identificar controles equivalentes o actuaciones pendientes. Si aún no existe una resolución, no exigirla anticipadamente; registrar la falta de control efectivo cuando no puedan acreditarse responsables, momentos de revisión o actuaciones previstas.",
          expected_result:
            "Un control de renovación documentado, con responsables, seguimiento de fechas oficiales y criterios de actuación que permitan anticipar la expiración sin presumir renovación automática. Las resoluciones que existan deben reflejarse fielmente, distinguiendo la vigencia de la certificación del ciclo de vida interno del MPI.",
        },
      ],
      required_facts: [],
      default_next_node_key: "record-closures",
      provenance: "legal_requirement",
    },
    {
      node_key: "record-closures",
      node_type: "question",
      title: "Cierres y cambios de estado",
      prompt:
        "¿Quedaron registradas la expiración, denegación, término o revocación cuando corresponda?",
      why_it_matters:
        "Sin registro de cierres el expediente queda desactualizado frente a la Agencia.",
      fact_key: "mpi.certification.closures_recorded",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.closures_recorded"),
      evidence_to_review: [
        "resoluciones de renovación, denegación, término o revocación",
        "revisión de comunicaciones de Agencia",
        "evidencia de registro",
      ],
      evidence_review_help: [
        {
          evidence_item: "resoluciones de renovación, denegación, término o revocación",
          review_guide:
            "Verificar los actos oficiales de renovación, denegación, término o revocación cuando hayan sido dictados, identificando fecha, contenido, destinatario y efectos sobre el estado de certificación del MPI. Distinguirlos de la expiración por vencimiento del plazo, que se comprueba con las fechas oficiales y antecedentes aplicables, sin presumir una resolución específica de expiración.",
          no_evidence_guidance:
            "Revisar el expediente de certificación, antecedentes de renovación, resoluciones notificadas y comunicaciones oficiales para determinar si ocurrió un evento que requiera actualizar el estado. Si no existe una resolución porque el supuesto no ha ocurrido, dejar constancia sin exigir documentos inexistentes; si se conoce una decisión pero falta respaldo, registrar la insuficiencia y gestionar su localización o verificación.",
          expected_result:
            "Un expediente actualizado con las resoluciones efectivamente emitidas y el estado de certificación que resulte de ellas, distinguiendo renovación favorable, denegación, término y revocación. Documentar la expiración cuando corresponda según la vigencia acreditada y antecedentes oficiales, sin atribuir a la Agencia una resolución no dictada.",
        },
        {
          evidence_item: "revisión de comunicaciones de Agencia",
          review_guide:
            "Examinar las comunicaciones oficiales de la Agencia relativas a certificación, renovación y decisiones que puedan modificar su estado, verificando fechas, referencias y correspondencia con el expediente del responsable. Diferenciar comunicaciones informativas, requerimientos de antecedentes, notificaciones de resoluciones y actos con efectos jurídicos, sin tratar toda comunicación como decisión definitiva.",
          no_evidence_guidance:
            "Revisar los canales institucionales del procedimiento, notificaciones recibidas, registros de correspondencia y antecedentes conservados por quienes gestionan la certificación. Si no hay comunicaciones porque la Agencia no ha actuado, registrar esa circunstancia; si hay indicios de una comunicación omitida, dejar pendiente su verificación sin inventar decisiones ni presumir efectos no acreditados.",
          expected_result:
            "Una revisión documentada de las comunicaciones oficiales pertinentes, con trazabilidad de su recepción, contenido y relación con los cambios de estado que correspondan. El expediente refleja solo decisiones y efectos acreditados, separando requerimientos, comunicaciones de seguimiento y resoluciones que determinan el estado del procedimiento.",
        },
        {
          evidence_item: "evidencia de registro",
          review_guide:
            "Comprobar que los eventos de expiración, denegación, término o revocación ocurridos estén reflejados en el seguimiento del expediente, con fechas, fundamentos y estado actualizado de la certificación. Contrastar los registros internos con resoluciones, comunicaciones y datos oficiales, distinguiendo la trazabilidad interna de eventuales actualizaciones del registro público.",
          no_evidence_guidance:
            "Revisar el historial del expediente, registros de seguimiento, fechas de vigencia, resoluciones e información registral oficial disponible para reconstruir los cambios. Si no ocurrió un evento de cierre o cambio de estado, dejar constancia sin crear un cierre ficticio; si el evento está acreditado pero no registrado, identificar la omisión y la actualización necesaria.",
          expected_result:
            "Un registro trazable y coherente de cada evento de cierre o cambio ocurrido, con identificación del hecho, fecha y antecedentes oficiales que lo respaldan. La información permite conocer el estado real de la certificación sin mantenerla artificialmente vigente ni modificar por ello el estado interno de implementación del MPI.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del expediente",
      prompt:
        "El sistema verifica el programa implementado y que cada verificación esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "not-implemented",
          description:
            "Sin programa implementado no inicia la certificación.",
          when: {
            op: "all",
            conditions: [
              { op: "not", condition: unresolved(LIFECYCLE_FACT) },
              {
                op: "not",
                condition: {
                  op: "fact_equals",
                  fact_key: LIFECYCLE_FACT,
                  value: "implemented",
                },
              },
            ],
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "El ciclo vigente no muestra un programa implementado. Primero corresponde implementar el programa.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el expediente sigue en elaboración.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "dossier_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El expediente aún no queda completo.",
        },
        {
          rule_id: "all-verified",
          description:
            "Programa implementado, gestión activa y expediente completo.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: LIFECYCLE_FACT,
                value: "implemented",
              },
              {
                op: "fact_in",
                fact_key: DECISION_FACT,
                values: ["certify", "renew", "manage_change"],
              },
              isDone("mpi.certification.implemented_confirmed"),
              isDone("mpi.certification.antecedents_prepared"),
              isDone("mpi.certification.request_recorded"),
              isDone("mpi.certification.grant_recorded"),
              isDone("mpi.certification.renewal_controlled"),
              isDone("mpi.certification.closures_recorded"),
            ],
          },
          goto_outcome_key: "dossier_complete",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas, sin modificar el ciclo de vida interno.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en elaboración.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "dossier_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "dossier_complete",
      label: "Expediente de certificación completo",
      classification: "legal_requirement",
      explanation:
        "El programa implementado, la gestión activa y cada pieza del expediente quedaron verificados, sin alterar el ciclo de vida interno.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente de certificación",
          note: "Archiva la solicitud, los antecedentes remitidos, el certificado cuando exista con su fecha de vigencia, las resoluciones pertinentes y la evidencia de registro.",
        },
      ],
    },
    {
      outcome_key: "dossier_in_progress",
      label: "Expediente en elaboración",
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
      label: "Programa aún no implementado",
      classification: "agency_standard",
      explanation:
        "Sin programa implementado no inicia la certificación.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Implementar el programa en D1.18",
          activity_key: "mpi.assemble_program",
        },
      ],
    },
    {
      outcome_key: "no_pending_case",
      label: "Sin gestión en curso",
      classification: "agency_standard",
      explanation:
        "No existe gestión de certificación en curso. Nada que verificar por esta vía.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar ante una nueva gestión",
        },
      ],
    },
  ],
};
