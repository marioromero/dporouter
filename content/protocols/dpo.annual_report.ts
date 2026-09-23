import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.14.
 *
 * activity_key = dpo.annual_report (procedure). Contenido aprobado por
 * la iteración vigente; usa exclusivamente pasos, evidencia, legal
 * basis, dependencias y aplicabilidad del contenido canónico D1.14. La
 * compuerta de designación reutiliza el fact dpo.designated ya
 * producido. La compuerta del plan registra si existe plan del período
 * para contrastar (input_dependency canónica) y deriva a D1.13 cuando
 * falta, sin re-elaborarlo.
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce a la rendición verificable);
 * - product-ready: false (sin estado canónico materializable);
 * - motivo: el informe es anual por período (`issued` no distingue
 *   períodos) y exige fecha dinámica de rendición; período, historial
 *   y fechas exceden el patrón simple `set` diferido.
 */

const VERIFICATION_FACTS = [
  "dpo.designated",
  "dpo.reporting.plan_available",
  "dpo.reporting.execution_consolidated",
  "dpo.reporting.findings_identified",
  "dpo.reporting.rendering_prepared",
  "dpo.reporting.decisions_recorded",
  "dpo.reporting.diffused",
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

export const DPO_ANNUAL_REPORT_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.annual_report.v1",
  activity_key: "dpo.annual_report",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de rendición anual del DPO",
  description:
    "Verifica que la rendición de resultados del período quede consolidada, presentada ante la autoridad y difundida: ejecución del plan, hallazgos, rendición, decisiones y difusión.",
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
        "La rendición corresponde al DPO designado. Sin designación corresponde designar primero.",
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
      default_next_node_key: "plan-gate",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay rendición que gestionar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. La rendición requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "plan-gate",
      node_type: "question",
      title: "Plan del período",
      prompt:
        "¿Existe plan anual del período para contrastar los resultados?",
      why_it_matters:
        "El informe debe contrastar resultados con el plan correspondiente. Sin plan corresponde elaborarlo primero.",
      fact_key: "dpo.reporting.plan_available",
      answer_type: "single_select",
      options: [
        {
          value: "yes",
          label: "Sí, existe",
          description: "Existe plan anual del período.",
          fact_effect: {
            fact_key: "dpo.reporting.plan_available",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "Sin plan",
          description: "No existe plan anual del período.",
          fact_effect: {
            fact_key: "dpo.reporting.plan_available",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo.reporting.plan_available",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: ["plan anual fechado"],
      help_text: [
        "Esta guía no elabora el plan: registra si existe y deriva a D1.13 cuando falta.",
      ],
      required_facts: [],
      default_next_node_key: "consolidate-execution",
      transitions: [
        {
          rule_id: "no-plan",
          description: "Sin plan del período no hay contraste que rendir.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.reporting.plan_available",
            value: "no",
          },
          goto_outcome_key: "awaiting_plan",
          explanation:
            "No existe plan anual del período. Primero corresponde desarrollarlo.",
        },
      ],
      related_activity_keys: ["dpo.annual_plan"],
      provenance: "agency_standard",
    },
    {
      node_key: "consolidate-execution",
      node_type: "question",
      title: "Ejecución consolidada",
      prompt: "¿Quedó consolidada la ejecución del plan anual?",
      why_it_matters:
        "Sin consolidación no hay base para identificar resultados ni pendientes.",
      fact_key: "dpo.reporting.execution_consolidated",
      answer_type: "single_select",
      options: stateOptions("dpo.reporting.execution_consolidated"),
      evidence_to_review: ["informe anual", "revisión de plan anual"],
      required_facts: [],
      default_next_node_key: "identify-findings",
      provenance: "legal_requirement",
    },
    {
      node_key: "identify-findings",
      node_type: "question",
      title: "Resultados y hallazgos",
      prompt:
        "¿Quedaron identificados los resultados, pendientes, riesgos y principales hallazgos?",
      why_it_matters:
        "Sin hallazgos identificados la rendición queda en enumeración de actividades.",
      fact_key: "dpo.reporting.findings_identified",
      answer_type: "single_select",
      options: stateOptions("dpo.reporting.findings_identified"),
      evidence_to_review: ["informe anual", "revisión de resultados"],
      required_facts: [],
      default_next_node_key: "prepare-rendering",
      provenance: "legal_requirement",
    },
    {
      node_key: "prepare-rendering",
      node_type: "question",
      title: "Rendición ante la autoridad",
      prompt:
        "¿Se preparó y presentó la rendición ante la autoridad que designó al DPO?",
      why_it_matters:
        "Sin presentación ante la autoridad no hay rendición de cuenta efectiva.",
      fact_key: "dpo.reporting.rendering_prepared",
      answer_type: "single_select",
      options: stateOptions("dpo.reporting.rendering_prepared"),
      evidence_to_review: ["informe anual", "evidencia de presentación"],
      required_facts: [],
      default_next_node_key: "record-decisions",
      provenance: "legal_requirement",
    },
    {
      node_key: "record-decisions",
      node_type: "question",
      title: "Decisiones resultantes",
      prompt:
        "¿Quedaron registradas las decisiones o instrucciones resultantes de la rendición?",
      why_it_matters:
        "Sin registro de decisiones la rendición no produce consecuencias trazables.",
      fact_key: "dpo.reporting.decisions_recorded",
      answer_type: "single_select",
      options: stateOptions("dpo.reporting.decisions_recorded"),
      evidence_to_review: ["acuerdos o instrucciones resultantes"],
      required_facts: [],
      default_next_node_key: "diffuse-results",
      provenance: "legal_requirement",
    },
    {
      node_key: "diffuse-results",
      node_type: "question",
      title: "Difusión interna",
      prompt:
        "¿Se difundieron los resultados al interior de la organización?",
      why_it_matters:
        "Sin difusión la organización no conoce los resultados ni sus instrucciones.",
      fact_key: "dpo.reporting.diffused",
      answer_type: "single_select",
      options: stateOptions("dpo.reporting.diffused"),
      evidence_to_review: ["evidencia de difusión"],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de la rendición",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: la rendición sigue en elaboración.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "report_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La rendición aún no queda emitida.",
        },
        {
          rule_id: "all-verified",
          description:
            "Designación, plan, consolidación, hallazgos, rendición, decisiones y difusión verificados.",
          when: { op: "all", conditions: VERIFICATION_FACTS.map(isDone) },
          goto_outcome_key: "report_issued",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas para el período.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en elaboración.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "report_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "report_issued",
      label: "Rendición emitida y difundida",
      classification: "legal_requirement",
      explanation:
        "La ejecución quedó consolidada y contrastada con el plan, con hallazgos, presentación ante la autoridad, decisiones registradas y difusión verificadas.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el informe del período",
          note: "Archiva el informe anual con su evidencia de presentación y de difusión, y los acuerdos o instrucciones resultantes.",
        },
      ],
    },
    {
      outcome_key: "report_in_progress",
      label: "Rendición en elaboración",
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
      outcome_key: "awaiting_plan",
      label: "A la espera del plan del período",
      classification: "agency_standard",
      explanation:
        "Sin plan anual del período no hay contraste que rendir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Desarrollar el plan anual en D1.13",
          activity_key: "dpo.annual_plan",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "DPO aún no designado",
      classification: "agency_standard",
      explanation:
        "Sin DPO designado no hay rendición que gestionar.",
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
