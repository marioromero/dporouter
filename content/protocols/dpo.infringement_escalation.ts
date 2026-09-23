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
