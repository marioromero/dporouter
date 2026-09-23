import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.05.
 *
 * activity_key = mpi.internal_reporting_and_whistleblowing (procedure).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D1.05. Guía el mecanismo, no casos individuales
 * de denuncia: ninguna pregunta modela un denunciante o un caso.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04 o Diagnóstico (`mpi.lifecycle_status` declarado en
 * `external_fact_keys`): es prerrequisito de entrada, nunca una
 * re-evaluación de adopción.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";

const COMPONENT_FACTS = [
  "mpi.whistleblowing.channel_defined",
  "mpi.whistleblowing.identity_reserve",
  "mpi.whistleblowing.non_retaliation",
  "mpi.whistleblowing.handling_defined",
  "mpi.whistleblowing.tested",
];

/** Estados de adopción que habilitan la implementación (canon D1.05). */
const ELIGIBLE = ["adoption_formalized", "implementing", "implemented"];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function lifecycleEligible(): FactCondition {
  return { op: "fact_in", fact_key: LIFECYCLE_FACT, values: ELIGIBLE };
}

function stateOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "Implementado y respaldado con evidencia.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "Aún no implementado o sin evidencia suficiente.",
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

export const MPI_REPORTING_WHISTLEBLOWING_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.internal_reporting_and_whistleblowing.v1",
  activity_key: "mpi.internal_reporting_and_whistleblowing",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del mecanismo interno de reporte",
  description:
    "Verifica que el mecanismo interno de reporte y denuncias ante el DPO esté definido, protegido y operativo: canal, reserva de identidad, no represalia, flujo de tratamiento y prueba.",
  entry_node_key: "define-channel",
  decision_fact_keys: COMPONENT_FACTS,
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "define-channel",
      node_type: "question",
      title: "Canal de denuncia ante el DPO",
      prompt: "¿Quedó definido el canal de denuncia ante el DPO?",
      why_it_matters:
        "Sin canal definido no existe vía operativa para reportar infracciones ni denunciar ante el DPO.",
      fact_key: "mpi.whistleblowing.channel_defined",
      answer_type: "single_select",
      options: stateOptions("mpi.whistleblowing.channel_defined"),
      evidence_to_review: [
        "procedimiento de denuncia",
        "evidencia del canal operativo",
      ],
      required_facts: [],
      default_next_node_key: "identity-reserve",
      provenance: "legal_requirement",
    },
    {
      node_key: "identity-reserve",
      node_type: "question",
      title: "Reserva de identidad",
      prompt:
        "¿El mecanismo permite solicitar reserva de identidad al denunciar?",
      why_it_matters:
        "Sin reserva de identidad el canal inhibe las denuncias que debe recibir.",
      fact_key: "mpi.whistleblowing.identity_reserve",
      answer_type: "single_select",
      options: stateOptions("mpi.whistleblowing.identity_reserve"),
      evidence_to_review: [
        "regla de reserva de identidad",
        "procedimiento de denuncia",
      ],
      required_facts: [],
      default_next_node_key: "non-retaliation",
      provenance: "legal_requirement",
    },
    {
      node_key: "non-retaliation",
      node_type: "question",
      title: "Protección frente a represalias",
      prompt:
        "¿Quedaron establecidas medidas para evitar consecuencias desfavorables por denunciar?",
      why_it_matters:
        "Sin protección frente a represalias el canal queda formalmente creado pero inoperante.",
      fact_key: "mpi.whistleblowing.non_retaliation",
      answer_type: "single_select",
      options: stateOptions("mpi.whistleblowing.non_retaliation"),
      evidence_to_review: [
        "regla de no represalia",
        "procedimiento de denuncia",
      ],
      required_facts: [],
      default_next_node_key: "handling-flow",
      provenance: "legal_requirement",
    },
    {
      node_key: "handling-flow",
      node_type: "question",
      title: "Recepción y seguimiento",
      prompt:
        "¿Quedaron definidos la recepción, el escalamiento, la custodia y el seguimiento de las denuncias?",
      why_it_matters:
        "Sin flujo definido cada denuncia se trata de forma improvisada y pierde trazabilidad.",
      fact_key: "mpi.whistleblowing.handling_defined",
      answer_type: "single_select",
      options: stateOptions("mpi.whistleblowing.handling_defined"),
      evidence_to_review: ["procedimiento de denuncia"],
      help_text: [
        "Verifica cada elemento: recepción, escalamiento, custodia y seguimiento.",
      ],
      required_facts: [],
      default_next_node_key: "test-channel",
      provenance: "legal_requirement",
    },
    {
      node_key: "test-channel",
      node_type: "question",
      title: "Prueba de operatividad",
      prompt: "¿Se probó la operatividad del mecanismo con evidencia?",
      why_it_matters:
        "Sin prueba el mecanismo puede existir en papel y fallar en la práctica.",
      fact_key: "mpi.whistleblowing.tested",
      answer_type: "single_select",
      options: stateOptions("mpi.whistleblowing.tested"),
      evidence_to_review: [
        "registro de prueba del mecanismo",
        "evidencia del canal operativo",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del mecanismo",
      prompt:
        "El sistema verifica el prerrequisito de adopción y que cada verificación esté realizada.",
      answer_type: "none",
      required_facts: [LIFECYCLE_FACT, ...COMPONENT_FACTS],
      transitions: [
        {
          rule_id: "not-adopted",
          description:
            "Sin adopción formalizada no inicia la implementación.",
          when: { op: "not", condition: lifecycleEligible() },
          goto_outcome_key: "not_started",
          explanation:
            "El mecanismo se implementa como parte del programa adoptado. Primero corresponde formalizar la adopción.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el mecanismo sigue en implementación.",
          when: { op: "any", conditions: COMPONENT_FACTS.map(unresolved) },
          goto_outcome_key: "mechanism_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El mecanismo aún no queda implementado.",
        },
        {
          rule_id: "all-verified",
          description:
            "Adopción vigente y los cinco elementos operativos.",
          when: {
            op: "all",
            conditions: [lifecycleEligible(), ...COMPONENT_FACTS.map(isDone)],
          },
          goto_outcome_key: "mechanism_implemented",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en implementación.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "mechanism_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "mechanism_implemented",
      label: "Mecanismo implementado y operativo",
      classification: "legal_requirement",
      explanation:
        "La adopción está vigente y el canal, la reserva de identidad, la no represalia, el flujo y la prueba quedaron verificados.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "mpi.whistleblowing_status", value: "implemented" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente del mecanismo",
          note: "Archiva el procedimiento de denuncia, la evidencia del canal operativo, las reglas de reserva de identidad y no represalia, y el registro de prueba del mecanismo.",
        },
      ],
    },
    {
      outcome_key: "mechanism_in_progress",
      label: "Mecanismo en implementación",
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
      label: "Aún sin adopción formalizada",
      classification: "agency_standard",
      explanation:
        "Sin adopción vigente no inicia la implementación.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Formalizar la adopción en D1.04",
          activity_key: "mpi.formalize_adoption",
        },
      ],
    },
  ],
};
