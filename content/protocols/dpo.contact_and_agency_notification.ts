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
