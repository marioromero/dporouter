import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.10.
 *
 * activity_key = dpo.contact_and_agency_notification (procedure).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D1.10. La compuerta de designación reutiliza el
 * fact dpo.designated ya producido por D1.08/D1.09/D1.11.
 */

const VERIFICATION_FACTS = [
  "dpo.designated",
  "dpo.contact.medium_defined",
  "dpo.contact.published",
  "dpo.contact.agency_notified",
  "dpo.contact.internal_notified",
  "dpo.contact.change_mechanism",
];

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

export const DPO_CONTACT_NOTIFICATION_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.contact_and_agency_notification.v1",
  activity_key: "dpo.contact_and_agency_notification",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de contacto y comunicación del DPO",
  description:
    "Verifica que los titulares puedan contactar directamente al DPO y que la Agencia, la organización y los encargados conozcan su identidad y medio de contacto.",
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
        "Solo puede comunicarse una designación efectiva. Sin designación corresponde designar primero.",
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
            "Examinar el acto o documento de designación para verificar que identifique al DPO, la autoridad que realiza la designación y la fecha efectiva. Contrastar esos antecedentes con la situación actual de la organización para determinar si la designación está vigente y corresponde a la persona que ejercerá la función.",
          no_evidence_guidance:
            "Registrar que no se ha podido verificar una designación efectiva y solicitar antecedentes adicionales. La ausencia del expediente no demuestra por sí sola que nunca se haya designado a un DPO; distinguir entre falta de documentación, designación pendiente y designación acreditada por otros medios verificables.",
          expected_result:
            "Una conclusión trazable sobre la existencia y vigencia de la designación, con identificación de los antecedentes examinados y de cualquier brecha que deba resolverse antes de avanzar con la publicación y comunicación de los datos de contacto.",
        },
      ],
      required_facts: [],
      default_next_node_key: "define-medium",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay contacto que publicar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. La comunicación requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "define-medium",
      node_type: "question",
      title: "Medio directo de contacto",
      prompt:
        "¿Quedó definido un medio directo y expedito para contactar al DPO?",
      why_it_matters:
        "Sin medio directo los titulares no pueden ejercer su derecho de contacto con el DPO.",
      fact_key: "dpo.contact.medium_defined",
      answer_type: "single_select",
      options: stateOptions("dpo.contact.medium_defined"),
      evidence_to_review: ["evidencia de publicación"],
      evidence_review_help: [
        {
          evidence_item: "evidencia de publicación",
          review_guide:
            "Examinar la publicación del medio de contacto del DPO en el sitio web institucional o en el medio equivalente utilizado por la organización. Verificar que el canal permita establecer comunicación directa y expedita, que los datos sean legibles y utilizables, y que correspondan al DPO actualmente designado. Considerar si el medio es accesible para los titulares sin depender de intermediarios innecesarios.",
          no_evidence_guidance:
            "Registrar que no se ha podido verificar la publicación y comprobar si existe otro medio institucional accesible que cumpla efectivamente la función de contacto. Distinguir entre ausencia de captura o registro, publicación no localizable y falta real de un medio directo; no asumir cumplimiento por la mera existencia de un correo interno.",
          expected_result:
            "Una conclusión trazable sobre la disponibilidad, accesibilidad y vigencia del medio directo de contacto, identificando la ubicación de la publicación, los datos que se muestran y cualquier ajuste necesario para que los titulares puedan contactar al DPO de manera expedita.",
        },
      ],
      required_facts: [],
      default_next_node_key: "publish-contact",
      provenance: "legal_requirement",
    },
    {
      node_key: "publish-contact",
      node_type: "question",
      title: "Publicación del contacto",
      prompt:
        "¿Quedaron publicados los datos de contacto en el sitio web o medio equivalente?",
      why_it_matters:
        "Sin publicación los titulares no conocen el medio de contacto.",
      fact_key: "dpo.contact.published",
      answer_type: "single_select",
      options: stateOptions("dpo.contact.published"),
      evidence_to_review: ["evidencia de publicación"],
      evidence_review_help: [
        {
          evidence_item: "evidencia de publicación",
          review_guide:
            "Examinar el sitio web institucional o el medio equivalente utilizado por la organización y verificar que publique los datos de contacto del DPO actualmente designado. Comprobar que la información sea visible, comprensible, accesible para los titulares y suficiente para establecer contacto directo, y que no esté desactualizada ni remita a un canal que ya no funcione.",
          no_evidence_guidance:
            "Registrar que no se ha podido confirmar la publicación y revisar los canales institucionales que podrían utilizarse como medio equivalente. Distinguir entre falta de una captura o registro, publicación no localizable y ausencia efectiva de datos publicados. No considerar suficiente una comunicación interna que no permita a los titulares conocer cómo contactar al DPO.",
          expected_result:
            "Una conclusión trazable sobre si los datos de contacto están publicados y disponibles para los titulares, indicando dónde se localizaron, qué información se verificó y qué brechas deben corregirse. La evaluación debe distinguir la publicación efectiva de la mera existencia de datos de contacto en registros internos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "notify-agency",
      provenance: "legal_requirement",
    },
    {
      node_key: "notify-agency",
      node_type: "question",
      title: "Comunicación a la Agencia",
      prompt:
        "¿Se informó a la Agencia el nombre y contacto del DPO?",
      why_it_matters:
        "La Agencia debe conocer la identidad y el medio de contacto del DPO.",
      fact_key: "dpo.contact.agency_notified",
      answer_type: "single_select",
      options: stateOptions("dpo.contact.agency_notified"),
      evidence_to_review: ["evidencia de comunicación a Agencia"],
      evidence_review_help: [
        {
          evidence_item: "evidencia de comunicación a Agencia",
          review_guide:
            "Examinar los antecedentes disponibles para verificar si se comunicaron a la Agencia el nombre del DPO designado y sus datos de contacto. Comprobar el destinatario, la fecha, el contenido comunicado y la existencia de una constancia de envío o recepción, cuando esté disponible. Contrastar la información con la designación vigente y con los datos publicados para detectar discrepancias.",
          no_evidence_guidance:
            "Registrar que no se ha podido verificar la comunicación y comprobar si existen constancias en los canales institucionales utilizados para relacionarse con la Agencia. Distinguir entre ausencia del registro, comunicación pendiente y comunicación realizada cuyo respaldo no se ha localizado. No considerar que la publicación en el sitio web o la comunicación interna sustituyen por sí solas la comunicación a la Agencia.",
          expected_result:
            "Una conclusión trazable sobre si la Agencia fue informada de la identidad y los datos de contacto del DPO, indicando la evidencia examinada, la fecha o referencia disponible y cualquier diferencia o acción pendiente. Si no se confirma la comunicación, dejar registrado qué antecedente falta para verificarla.",
        },
      ],
      required_facts: [],
      default_next_node_key: "notify-internal",
      provenance: "legal_requirement",
    },
    {
      node_key: "notify-internal",
      node_type: "question",
      title: "Comunicación interna y a encargados",
      prompt:
        "¿Se informó a dependientes, miembros de la organización y encargados cuando corresponda?",
      why_it_matters:
        "La organización y sus encargados deben conocer a quién dirigirse en materias de protección de datos.",
      fact_key: "dpo.contact.internal_notified",
      answer_type: "single_select",
      options: stateOptions("dpo.contact.internal_notified"),
      evidence_to_review: [
        "evidencia de comunicación interna",
        "evidencia de comunicación a encargados cuando corresponda",
      ],
      evidence_review_help: [
        {
          evidence_item: "evidencia de comunicación interna",
          review_guide:
            "Examinar los registros de comunicación dirigidos a los dependientes y miembros de la organización que corresponda. Verificar que identifiquen al DPO designado y proporcionen datos suficientes para contactarlo, que el contenido coincida con la designación vigente y que el canal utilizado permita que los destinatarios accedan a la información. Considerar el alcance de la comunicación y su fecha.",
          no_evidence_guidance:
            "Registrar que no se ha podido verificar la comunicación y buscar constancias en los canales institucionales utilizados, como comunicaciones internas o registros equivalentes. Distinguir entre ausencia del respaldo, comunicación realizada sin registro localizado y falta efectiva de comunicación. No asumir que la publicación externa del contacto demuestra por sí sola que la organización fue informada.",
          expected_result:
            "Una conclusión trazable sobre si los destinatarios internos pertinentes fueron informados de la identidad y los datos de contacto del DPO. Identificar el alcance acreditado, la evidencia examinada y las brechas de comunicación que deban subsanarse.",
        },
        {
          evidence_item: "evidencia de comunicación a encargados cuando corresponda",
          review_guide:
            "Identificar los encargados pertinentes según los tratamientos y las relaciones contractuales vigentes, y examinar los antecedentes que acrediten la comunicación de la identidad y los datos de contacto del DPO. Comprobar que la información enviada sea coherente con la designación actual y que exista una constancia suficiente del destinatario, contenido y fecha, cuando esos datos estén disponibles.",
          no_evidence_guidance:
            "Verificar primero si existen encargados a los que corresponda comunicar la información. Si corresponde, buscar constancias en los canales contractuales u operativos utilizados y distinguir entre falta de registro y ausencia de comunicación. Si no corresponde comunicarla a encargados en el caso evaluado, dejar constancia de la razón; no marcar la evidencia como incumplida automáticamente por falta de un documento.",
          expected_result:
            "Una conclusión trazable que identifique si la comunicación a los encargados pertinentes fue acreditada o si no resulta aplicable, indicando las relaciones examinadas, la evidencia disponible y las brechas pendientes. La conclusión debe limitarse a los encargados y tratamientos relevantes para el caso.",
        },
      ],
      required_facts: [],
      default_next_node_key: "change-mechanism",
      provenance: "legal_requirement",
    },
    {
      node_key: "change-mechanism",
      node_type: "question",
      title: "Mecanismo ante cambios",
      prompt:
        "¿Quedó establecido el mecanismo para comunicar cambios posteriores de contacto?",
      why_it_matters:
        "Sin mecanismo los cambios dejan obsoletos la publicación y los destinatarios informados.",
      fact_key: "dpo.contact.change_mechanism",
      answer_type: "single_select",
      options: stateOptions("dpo.contact.change_mechanism"),
      evidence_to_review: ["evidencia de comunicación interna"],
      evidence_review_help: [
        {
          evidence_item: "evidencia de comunicación interna",
          review_guide:
            "Examinar los procedimientos o registros internos que indiquen cómo se comunicarán los cambios posteriores en la identidad o los datos de contacto del DPO. Verificar si está definido quién debe iniciar la actualización, qué información debe revisarse, quiénes deben recibirla y cómo se mantendrán coherentes la publicación y las comunicaciones previas. Distinguir la existencia de un mecanismo establecido de la evidencia de que ya se haya utilizado.",
          no_evidence_guidance:
            "Registrar que no se ha podido verificar un mecanismo definido y revisar procedimientos, instrucciones internas o registros equivalentes que puedan acreditarlo. Distinguir entre falta de documentación, mecanismo existente pero no formalizado y ausencia efectiva de un proceso para gestionar cambios. No asumir que una publicación actualmente correcta garantiza que los cambios futuros se comunicarán.",
          expected_result:
            "Una conclusión trazable sobre si existe un mecanismo para gestionar y comunicar cambios posteriores en los datos de contacto del DPO. Identificar las etapas y responsabilidades que puedan acreditarse, los destinatarios contemplados y las brechas que podrían dejar desactualizadas la publicación o las comunicaciones anteriores.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de la comunicación",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: la comunicación sigue en curso.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "communication_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El contacto aún no queda publicado ni comunicado.",
        },
        {
          rule_id: "all-verified",
          description:
            "Designación, medio, publicación, comunicaciones y mecanismo verificados.",
          when: { op: "all", conditions: VERIFICATION_FACTS.map(isDone) },
          goto_outcome_key: "communication_complete",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "communication_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "communication_complete",
      label: "Contacto publicado y comunicado",
      classification: "legal_requirement",
      explanation:
        "El medio directo quedó definido y publicado, y la Agencia, la organización y los encargados fueron informados, con mecanismo ante cambios.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco a los valores canónicos declarados
      // por la actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "dpo.contact_publication_status", value: "published" },
        { fact_key: "dpo.agency_notification_status", value: "notified" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente de contacto",
          note: "Archiva la evidencia de publicación, de comunicación a la Agencia, de comunicación interna y a encargados cuando corresponda.",
        },
      ],
    },
    {
      outcome_key: "communication_in_progress",
      label: "Comunicación en curso",
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
        "Sin DPO designado no hay contacto que publicar ni comunicar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Designar DPO en D1.08",
          activity_key: "dpo.designate",
        },
      ],
    },
  ],
};
