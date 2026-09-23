import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.20.
 *
 * activity_key = mpi.lifecycle_review (decision). Contenido aprobado
 * por la iteración vigente; usa exclusivamente pasos, evidencia, legal
 * basis, dependencias y aplicabilidad del contenido canónico D1.20. La
 * determinación genuina (el MPI continúa implementado frente a se
 * discontinúa, con consecuencias distintas) justifica el modo
 * decision: el ciclo vigente, los cambios revisados y la determinación
 * alimentan reglas determinísticas.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04, D1.18 o Diagnóstico (`mpi.lifecycle_status`
 * declarado en `external_fact_keys`): esta guía lo confirma y orienta
 * su documentación, nunca lo re-deriva ni lo escribe. La historia de
 * adopción e implementación, si existen, se usan como evidencia de
 * entrada (input_dependencies canónicas).
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce a la revisión documentada);
 * - product-ready: false (sin estado canónico materializable);
 * - motivo: la revisión escribe transiciones temporales del ciclo de
 *   vida con memoria del estado anterior y desactiva el requerimiento
 *   DPO condicionalmente; transición, condicionalidad e historial
 *   exceden el patrón simple `set` diferido. El canon además requiere
 *   ReasoningRecord, cuya vía queda diferida junto a la capa temporal.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";
const CHANGES_FACT = "mpi.lifecycle.changes_reviewed";
const DETERMINATION_FACT = "mpi.lifecycle.determination";

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

export const MPI_LIFECYCLE_REVIEW_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.lifecycle_review.v1",
  activity_key: "mpi.lifecycle_review",
  version: 1,
  mode: "decision",
  title: "Evaluación guiada de revisión del ciclo de vida",
  description:
    "Confirma que el estado registrado del MPI refleja su situación real y determina si continúa implementado o se discontinúa, con su documentación y resguardos.",
  entry_node_key: "changes-review",
  decision_fact_keys: [CHANGES_FACT, DETERMINATION_FACT],
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "changes-review",
      node_type: "question",
      title: "Cambios revisados",
      prompt:
        "¿Quedaron revisados los cambios organizacionales o decisiones que afectan la continuidad del MPI?",
      why_it_matters:
        "Sin revisar cambios no es posible determinar si el estado registrado sigue reflejando la realidad.",
      fact_key: CHANGES_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "yes",
          label: "Verificado",
          description: "Revisado y respaldado con evidencia.",
          fact_effect: { fact_key: CHANGES_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "Pendiente",
          description: "Aún no realizado o sin evidencia suficiente.",
          fact_effect: { fact_key: CHANGES_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: CHANGES_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "revisión de lifecycle",
        "evidencia de cambios",
        "historia de adopción si el MPI llegó a adopción",
        "evidencia de implementación si el MPI llegó a implementación",
      ],
      help_text: [
        "Si el MPI llegó a adopción o a implementación, usa esa historia y evidencia como insumo de la revisión.",
      ],
      required_facts: [],
      default_next_node_key: "continuity-determination",
      related_activity_keys: [
        "mpi.formalize_adoption",
        "mpi.assemble_program",
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "continuity-determination",
      node_type: "question",
      title: "Continuidad del programa",
      prompt:
        "¿El MPI sigue implementado o fue discontinuado?",
      why_it_matters:
        "La determinación define qué documentar: confirmación de vigencia o decisión de discontinuación con sus resguardos.",
      fact_key: DETERMINATION_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "continues",
          label: "Sigue implementado",
          description: "El programa continúa operativo.",
          fact_effect: { fact_key: DETERMINATION_FACT, value: "continues" },
        },
        {
          value: "discontinued",
          label: "Discontinuado",
          description: "El programa fue discontinuado.",
          fact_effect: { fact_key: DETERMINATION_FACT, value: "discontinued" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: DETERMINATION_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "revisión de componentes",
        "revisión de decisiones internas",
        "decisión interna cuando corresponda",
      ],
      required_facts: [],
      default_next_node_key: "lifecycle-assessment",
      provenance: "agency_standard",
    },
    {
      node_key: "lifecycle-assessment",
      node_type: "decision",
      title: "Síntesis de la revisión",
      prompt:
        "El sistema verifica el ciclo vigente y la determinación documentada.",
      answer_type: "none",
      required_facts: [LIFECYCLE_FACT, CHANGES_FACT, DETERMINATION_FACT],
      transitions: [
        {
          rule_id: "pending-review",
          description:
            "Falta información o revisión pendiente para concluir.",
          when: {
            op: "any",
            conditions: [
              unresolved(LIFECYCLE_FACT),
              unresolved(CHANGES_FACT),
              unresolved(DETERMINATION_FACT),
              {
                op: "fact_equals",
                fact_key: CHANGES_FACT,
                value: "no",
              },
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Existen antecedentes pendientes, sin información o con revisión aún no realizada. Sin ellos no se emite la revisión.",
        },
        {
          rule_id: "lifecycle-confirmed",
          description:
            "Cambios revisados y programa que sigue implementado.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: CHANGES_FACT,
                value: "yes",
              },
              {
                op: "fact_equals",
                fact_key: DETERMINATION_FACT,
                value: "continues",
              },
            ],
          },
          goto_outcome_key: "lifecycle_confirmed",
          explanation:
            "Los cambios fueron revisados y el programa sigue implementado: corresponde documentar la confirmación de vigencia.",
        },
        {
          rule_id: "discontinuation-documented",
          description:
            "Cambios revisados y programa discontinuado.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: CHANGES_FACT,
                value: "yes",
              },
              {
                op: "fact_equals",
                fact_key: DETERMINATION_FACT,
                value: "discontinued",
              },
            ],
          },
          goto_outcome_key: "discontinuation_path",
          explanation:
            "Los cambios fueron revisados y el programa fue discontinuado: corresponde documentar la decisión con sus resguardos.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La revisión no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "lifecycle_confirmed",
      label: "Vigencia confirmada y documentada",
      classification: "agency_standard",
      explanation:
        "El estado registrado refleja la situación real y el programa sigue implementado.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Documentar la confirmación de vigencia",
          note: "Archiva la revisión de lifecycle con la evidencia de cambios revisada y la decisión interna cuando corresponda, manteniendo el estado actualizado.",
        },
      ],
    },
    {
      outcome_key: "discontinuation_path",
      label: "Discontinuación con resguardos",
      classification: "agency_standard",
      explanation:
        "El programa fue discontinuado. Documenta la decisión con su justificación, revisa si corresponde desactivar el requerimiento DPO de fuente MPI exclusiva y preserva la designación voluntaria.",
      detail:
        "No infieras el ciclo desde la certificación ni modifiques automáticamente la certificación: ambos estados se gestionan por separado.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Documentar la discontinuación",
          note: "Archiva la justificación de discontinuación, la decisión interna, el estado actualizado y la revisión del requerimiento DPO cuando la única fuente era el MPI.",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Revisión incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o sin información suficiente. Completa la revisión de cambios y la determinación antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar revisión",
        },
      ],
    },
  ],
};
