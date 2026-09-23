import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.17.
 *
 * activity_key = dpo.terminate_or_replace (decision). Contenido aprobado
 * por la iteración vigente; usa exclusivamente pasos, evidencia, legal
 * basis, dependencias y aplicabilidad del contenido canónico D1.17.
 *
 * El canon distingue dos situaciones con consecuencias distintas:
 * término con MPI activo (vacancia y reemplazo hasta nueva designación)
 * frente a término exclusivamente voluntario sin otra fuente de
 * obligación (cierre sin deber automático de reemplazo). Esa divergencia
 * genuina justifica el modo decision: tres determinaciones alimentan
 * reglas determinísticas hacia la consecuencia correcta, sin reducirlas
 * a una sola pregunta.
 *
 * El estado del MPI se reutiliza como fact externo ya producido por
 * D1.02, D1.04 o Diagnóstico (`mpi.lifecycle_status` declarado en
 * `external_fact_keys`): esta guía no re-evalúa la necesidad ni la
 * adopción, solo lee el ciclo de vida vigente. La compuerta de
 * designación reutiliza `dpo.designated` de D1.09/D1.11.
 *
 * Este protocolo decide la consecuencia (reemplazo vs cierre). Los pasos
 * operativos comunes a ambas (registro de fecha y causa, preservación
 * de historial, comunicación a la Agencia y actualización de
 * publicación) se instruyen en cada outcome definitivo con su evidencia
 * canónica; no se verifican como facts porque no discriminan la
 * consecuencia.
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce a la consecuencia correcta);
 * - product-ready: false (sin lifecycle effects canónicos);
 * - motivo: el state_effect canónico exige append de historial,
 *   transición temporal de estado (`terminated`) y sets condicionales
 *   de requerimiento/vacancia; nada de eso cabe en el patrón simple
 *   `set` soportado.
 */

const EVENT_FACT = "dpo.termination.event_occurred";
const LIFECYCLE_FACT = "mpi.lifecycle_status";
const OTHER_SOURCE_FACT = "dpo.termination.other_source";

/** Ciclo de vida que mantiene vigente el requerimiento (canon D1.17). */
const ACTIVE_LIFECYCLE = ["adoption_formalized", "implementing", "implemented"];

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function lifecycleActive(): FactCondition {
  return { op: "fact_in", fact_key: LIFECYCLE_FACT, values: ACTIVE_LIFECYCLE };
}

export const DPO_TERMINATE_OR_REPLACE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.terminate_or_replace.v1",
  activity_key: "dpo.terminate_or_replace",
  version: 1,
  mode: "decision",
  title: "Evaluación guiada de término o reemplazo del DPO",
  description:
    "Determina la consecuencia correcta ante el término o cambio del DPO: reemplazo con vacancia cuando el requerimiento sigue vigente, o cierre sin deber automático cuando era exclusivamente voluntario.",
  entry_node_key: "designation-gate",
  decision_fact_keys: [EVENT_FACT, OTHER_SOURCE_FACT],
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "designation-gate",
      node_type: "question",
      title: "Designación previa",
      prompt: "¿El DPO estaba designado antes del término o cambio?",
      why_it_matters:
        "Esta actividad modifica el ciclo de vida de una designación existente. Sin designación previa no hay término que gestionar.",
      fact_key: "dpo.designated",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existía un DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "Nunca hubo DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo.designated", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "expediente de designación",
        "registro de término o cambio",
      ],
      required_facts: [],
      default_next_node_key: "event-confirmation",
      transitions: [
        {
          rule_id: "no-prior-designation",
          description: "Sin designación previa no hay término que gestionar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "Nunca existió designación. Esta actividad presupone modificar el ciclo de vida de una existente.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "event-confirmation",
      node_type: "question",
      title: "Evento de término o cambio",
      prompt:
        "¿El DPO cesó, fue reemplazado o cambió la persona natural que ejerce la función?",
      why_it_matters:
        "El evento activa la gestión: sin término o cambio no hay consecuencia que determinar.",
      fact_key: EVENT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "occurred",
          label: "Sí, evento ocurrido",
          description: "Cesó, fue reemplazado o cambió la persona natural.",
          fact_effect: { fact_key: EVENT_FACT, value: "occurred" },
        },
        {
          value: "none",
          label: "Sin evento",
          description: "No ocurrió término ni cambio.",
          fact_effect: { fact_key: EVENT_FACT, value: "none" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: EVENT_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "registro de término o cambio",
        "fecha efectiva",
      ],
      required_facts: [],
      default_next_node_key: "other-source",
      transitions: [
        {
          rule_id: "no-event",
          description: "Sin evento no hay gestión de término.",
          when: {
            op: "fact_equals",
            fact_key: EVENT_FACT,
            value: "none",
          },
          goto_outcome_key: "no_pending_event",
          explanation:
            "No ocurrió término ni cambio. Nada que gestionar por esta vía.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "other-source",
      node_type: "question",
      title: "Otra fuente de obligación",
      prompt:
        "¿Existe alguna otra fuente, distinta del MPI, que mantenga vigente la obligación de contar con DPO?",
      why_it_matters:
        "El cierre sin reemplazo solo procede cuando el DPO era exclusivamente voluntario y no existe otra fuente de obligación.",
      fact_key: OTHER_SOURCE_FACT,
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Otra fuente mantiene vigente el requerimiento.",
          fact_effect: { fact_key: OTHER_SOURCE_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "Sin otra fuente: solo voluntario o MPI.",
          fact_effect: { fact_key: OTHER_SOURCE_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: OTHER_SOURCE_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "evaluación de necesidad D1.02 si existe",
        "registro de término o cambio",
      ],
      help_text: [
        "Esta guía no re-evalúa la necesidad de DPO: registra si existe otra fuente vigente además del MPI.",
      ],
      required_facts: [],
      default_next_node_key: "requirement-assessment",
      related_activity_keys: ["dpo.need_assessment"],
      provenance: "agency_standard",
    },
    {
      node_key: "requirement-assessment",
      node_type: "decision",
      title: "Vigencia del requerimiento",
      prompt:
        "El sistema determina si el requerimiento sigue vigente según el ciclo de vida del MPI y otras fuentes.",
      answer_type: "none",
      required_facts: [EVENT_FACT, LIFECYCLE_FACT, OTHER_SOURCE_FACT],
      transitions: [
        {
          rule_id: "mpi-active-replacement",
          description:
            "MPI activo mantiene vigente el requerimiento de DPO.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: EVENT_FACT,
                value: "occurred",
              },
              lifecycleActive(),
            ],
          },
          goto_outcome_key: "replacement_required",
          explanation:
            "El MPI se encuentra formalmente adoptado, en implementación o implementado: el requerimiento sigue vigente y corresponde vacancia con reemplazo hasta nueva designación.",
        },
        {
          rule_id: "other-source-replacement",
          description:
            "Otra fuente vigente mantiene el requerimiento aunque el MPI no esté activo.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: EVENT_FACT,
                value: "occurred",
              },
              { op: "not", condition: unresolved(LIFECYCLE_FACT) },
              { op: "not", condition: lifecycleActive() },
              {
                op: "fact_equals",
                fact_key: OTHER_SOURCE_FACT,
                value: "yes",
              },
            ],
          },
          goto_outcome_key: "replacement_required",
          explanation:
            "Existe otra fuente que mantiene vigente el requerimiento: corresponde vacancia con reemplazo hasta nueva designación.",
        },
        {
          rule_id: "voluntary-closure",
          description:
            "DPO exclusivamente voluntario sin otra fuente: cierre sin deber automático.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: EVENT_FACT,
                value: "occurred",
              },
              { op: "not", condition: unresolved(LIFECYCLE_FACT) },
              { op: "not", condition: lifecycleActive() },
              {
                op: "fact_equals",
                fact_key: OTHER_SOURCE_FACT,
                value: "no",
              },
            ],
          },
          goto_outcome_key: "voluntary_closure",
          explanation:
            "El DPO era exclusivamente voluntario y no existe otra fuente de obligación: no se crea automáticamente deber de reemplazo.",
        },
        {
          rule_id: "pending-determination",
          description:
            "Falta información para determinar la vigencia del requerimiento.",
          when: {
            op: "any",
            conditions: [
              unresolved(EVENT_FACT),
              unresolved(LIFECYCLE_FACT),
              unresolved(OTHER_SOURCE_FACT),
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Existen antecedentes pendientes o sin información suficiente. Sin ellos no se emite la consecuencia.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La evaluación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "replacement_required",
      label: "Vacancia con reemplazo requerido",
      classification: "legal_requirement",
      explanation:
        "El requerimiento sigue vigente. Corresponde marcar vacancia y necesidad de reemplazo hasta nueva designación, preservando historial y continuidad.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Designar al reemplazante en D1.08",
          activity_key: "dpo.designate",
        },
        {
          kind: "info",
          label: "Conservar el expediente de término",
          note: "Archiva el registro de término o cambio con fecha efectiva y causa, el historial de designación preservado, la evidencia de comunicación a la Agencia y el estado de vacancia y reemplazo.",
        },
      ],
    },
    {
      outcome_key: "voluntary_closure",
      label: "Cierre sin reemplazo automático",
      classification: "legal_requirement",
      explanation:
        "DPO exclusivamente voluntario sin otra fuente de obligación. Se cierra sin crear automáticamente deber de reemplazo; corresponde reevaluar si surge una fuente de obligación.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente de término",
          note: "Archiva el registro de término o cambio con fecha efectiva y causa, el historial de designación preservado y la evidencia de comunicación a la Agencia.",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o sin información suficiente. Revisa el ciclo de vida del MPI y los demás puntos antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Revisar el ciclo de vida del MPI",
          activity_key: "mpi.lifecycle_review",
        },
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "Sin designación previa",
      classification: "agency_standard",
      explanation:
        "Sin designación previa no hay término que gestionar.",
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
      outcome_key: "no_pending_event",
      label: "Sin evento por gestionar",
      classification: "agency_standard",
      explanation:
        "No ocurrió término ni cambio. Nada que gestionar por esta vía.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar ante un nuevo evento",
        },
      ],
    },
  ],
};
