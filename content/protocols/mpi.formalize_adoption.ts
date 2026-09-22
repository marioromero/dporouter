import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.04.
 *
 * activity_key = mpi.formalize_adoption (procedure). Contenido aprobado
 * por la iteración vigente; usa exclusivamente requisitos, pasos, state
 * effects, dependencias, legal basis y evidencia del contenido canónico
 * D1.04. No recrea D1.03: la ausencia de decisión deriva a D1.03.
 *
 * Calibración de modo: los pasos procedurales se representan como
 * verificaciones de hechos ("¿quedó verificado y registrado?"), no como
 * preguntas de descubrimiento. answer_type single_select con estados
 * explícitos Pendiente / Verificado; nunca yes_no_unknown ambiguo.
 */

const VERIFICATION_FACTS = [
  "mpi.adoption_decided",
  "mpi.adoption_evidence_ready",
  "mpi.lifecycle_update_recorded",
  "mpi.dpo_requirement_activated",
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

export const MPI_FORMALIZE_ADOPTION_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.formalize_adoption.v1",
  activity_key: "mpi.formalize_adoption",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de formalización de adopción MPI",
  description:
    "Guía al profesional desde la decisión de adoptar el MPI hasta su formalización efectiva con evidencia suficiente: decisión, evidencia, fecha efectiva, ciclo de vida y requerimiento de DPO.",
  entry_node_key: "adoption-decision",
  decision_fact_keys: VERIFICATION_FACTS,
  last_review: "2026-09-22",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "adoption-decision",
      node_type: "question",
      title: "Decisión efectiva de adoptar",
      prompt: "¿La máxima autoridad decidió adoptar efectivamente un MPI?",
      why_it_matters:
        "Este procedimiento parte de una decisión ya tomada. Sin decisión efectiva no hay nada que formalizar; corresponde evaluar conveniencia.",
      fact_key: "mpi.adoption_decided",
      answer_type: "single_select",
      options: [
        {
          value: "yes",
          label: "Sí, decisión adoptada",
          description: "La máxima autoridad decidió adoptar el MPI.",
          fact_effect: { fact_key: "mpi.adoption_decided", value: "yes" },
        },
        {
          value: "no",
          label: "No hay decisión",
          description: "Aún no se decide adoptar un MPI.",
          fact_effect: { fact_key: "mpi.adoption_decided", value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "mpi.adoption_decided", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "actas o registros de decisión interna",
        "comunicaciones de la máxima autoridad",
      ],
      required_facts: [],
      default_next_node_key: "adoption-evidence",
      transitions: [
        {
          rule_id: "no-decision",
          description: "Sin decisión de adoptar no inicia la formalización.",
          when: {
            op: "fact_equals",
            fact_key: "mpi.adoption_decided",
            value: "no",
          },
          goto_outcome_key: "not_started",
          explanation:
            "No existe decisión efectiva de adoptar. Este procedimiento parte de la decisión; primero corresponde evaluar conveniencia.",
        },
      ],
      related_activity_keys: ["mpi.need_assessment"],
      provenance: "agency_standard",
    },
    {
      node_key: "adoption-evidence",
      node_type: "question",
      title: "Evidencia interna de la decisión",
      prompt:
        "¿Existe evidencia interna fechada de la decisión con autoridad y referencia documental?",
      why_it_matters:
        "La formalización exige trazabilidad: sin evidencia interna fechada la adopción no queda registrada.",
      fact_key: "mpi.adoption_evidence_ready",
      answer_type: "single_select",
      options: stateOptions("mpi.adoption_evidence_ready"),
      evidence_to_review: [
        "acta, resolución, acuerdo o evidencia interna equivalente",
        "fecha efectiva",
        "autoridad que adopta",
        "referencia documental",
      ],
      help_text: [
        "Verifica cada elemento: documento existente, fecha efectiva explícita, autoridad identificada y referencia archivable.",
      ],
      required_facts: [],
      default_next_node_key: "lifecycle-update",
      provenance: "agency_standard",
    },
    {
      node_key: "lifecycle-update",
      node_type: "question",
      title: "Actualización del ciclo de vida MPI",
      prompt: "¿Quedó registrado el ciclo de vida del MPI como adopción formalizada?",
      why_it_matters:
        "El registro del ciclo de vida activa los estados organizacionales que se derivan de la adopción.",
      fact_key: "mpi.lifecycle_update_recorded",
      answer_type: "single_select",
      options: stateOptions("mpi.lifecycle_update_recorded"),
      evidence_to_review: ["registro interno del lifecycle MPI"],
      required_facts: [],
      default_next_node_key: "dpo-requirement",
      related_activity_keys: ["mpi.lifecycle_review"],
      provenance: "agency_standard",
    },
    {
      node_key: "dpo-requirement",
      node_type: "question",
      title: "Requerimiento de DPO activado",
      prompt:
        "¿Quedó activado el requerimiento de contar con DPO derivado del MPI?",
      why_it_matters:
        "Un MPI formalmente activo requiere DPO como componente del programa. Esta verificación no redefine la lógica de DPO: solo constata la activación del requerimiento ya previsto.",
      fact_key: "mpi.dpo_requirement_activated",
      answer_type: "single_select",
      options: stateOptions("mpi.dpo_requirement_activated"),
      evidence_to_review: [
        "registro del requerimiento de DPO",
        "fuente del requerimiento (MPI)",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de formalización",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: la formalización sigue en curso.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "formalization_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La adopción aún no queda formalizada.",
        },
        {
          rule_id: "all-verified",
          description:
            "Decisión, evidencia, ciclo de vida y requerimiento de DPO verificados.",
          when: { op: "all", conditions: VERIFICATION_FACTS.map(isDone) },
          goto_outcome_key: "formalization_complete",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "formalization_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "formalization_complete",
      label: "Adopción formalizada y evidenciada",
      classification: "agency_standard",
      explanation:
        "La decisión, la evidencia interna fechada, el ciclo de vida y el requerimiento de DPO quedaron verificados.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Con el requerimiento activo, continuar con designación de DPO",
          activity_key: "dpo.designate",
        },
      ],
    },
    {
      outcome_key: "formalization_in_progress",
      label: "Formalización en curso",
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
      outcome_key: "not_started",
      label: "Aún sin decisión de adoptar",
      classification: "agency_standard",
      explanation:
        "Sin decisión efectiva de la máxima autoridad no inicia la formalización.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Evaluar conveniencia de adoptar en D1.03",
          activity_key: "mpi.need_assessment",
        },
      ],
    },
  ],
};
