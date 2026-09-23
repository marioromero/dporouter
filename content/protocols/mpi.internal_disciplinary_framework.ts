import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.06.
 *
 * activity_key = mpi.internal_disciplinary_framework (procedure).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D1.06. Verifica existencia, integración,
 * procedimiento, coherencia y aprobación: no inventa sanciones,
 * gravedades, scoring ni reglas disciplinarias.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04 o Diagnóstico (`mpi.lifecycle_status` declarado en
 * `external_fact_keys`): es prerrequisito de entrada, nunca una
 * re-evaluación de adopción.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";

const COMPONENT_FACTS = [
  "mpi.disciplinary.existing_mapped",
  "mpi.disciplinary.breaches_integrated",
  "mpi.disciplinary.procedure_defined",
  "mpi.disciplinary.coherence_verified",
  "mpi.disciplinary.approved",
];

/** Estados de adopción que habilitan la implementación (canon D1.06). */
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

export const MPI_DISCIPLINARY_FRAMEWORK_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.internal_disciplinary_framework.v1",
  activity_key: "mpi.internal_disciplinary_framework",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del régimen disciplinario interno",
  description:
    "Verifica que el régimen disciplinario interno asociado al MPI exista, integre los incumplimientos, defina su procedimiento y quede aprobado con coherencia laboral y contractual.",
  entry_node_key: "map-existing",
  decision_fact_keys: COMPONENT_FACTS,
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "map-existing",
      node_type: "question",
      title: "Mecanismos disciplinarios existentes",
      prompt:
        "¿Quedaron identificados los mecanismos disciplinarios existentes?",
      why_it_matters:
        "El régimen se construye sobre lo existente: sin levantamiento no es posible integrar ni detectar vacíos.",
      fact_key: "mpi.disciplinary.existing_mapped",
      answer_type: "single_select",
      options: stateOptions("mpi.disciplinary.existing_mapped"),
      evidence_to_review: [
        "régimen interno de sanciones",
        "revisión de normativa laboral interna",
      ],
      required_facts: [],
      default_next_node_key: "integrate-breaches",
      provenance: "legal_requirement",
    },
    {
      node_key: "integrate-breaches",
      node_type: "question",
      title: "Integración de incumplimientos",
      prompt:
        "¿Quedaron integrados los incumplimientos de protección de datos y del MPI?",
      why_it_matters:
        "Sin integración los incumplimientos del programa quedan fuera del régimen aplicable.",
      fact_key: "mpi.disciplinary.breaches_integrated",
      answer_type: "single_select",
      options: stateOptions("mpi.disciplinary.breaches_integrated"),
      evidence_to_review: ["régimen interno de sanciones"],
      required_facts: [],
      default_next_node_key: "define-procedure",
      provenance: "legal_requirement",
    },
    {
      node_key: "define-procedure",
      node_type: "question",
      title: "Procedimiento interno aplicable",
      prompt: "¿Quedó definido el procedimiento interno aplicable?",
      why_it_matters:
        "Sin procedimiento las consecuencias quedan a discreción y pierden trazabilidad.",
      fact_key: "mpi.disciplinary.procedure_defined",
      answer_type: "single_select",
      options: stateOptions("mpi.disciplinary.procedure_defined"),
      evidence_to_review: ["procedimiento disciplinario"],
      required_facts: [],
      default_next_node_key: "verify-coherence",
      provenance: "legal_requirement",
    },
    {
      node_key: "verify-coherence",
      node_type: "question",
      title: "Coherencia laboral y contractual",
      prompt:
        "¿Se verificó la coherencia con la regulación laboral y contractual aplicable?",
      why_it_matters:
        "Un régimen incoherente con la regulación aplicable queda expuesto a impugnación.",
      fact_key: "mpi.disciplinary.coherence_verified",
      answer_type: "single_select",
      options: stateOptions("mpi.disciplinary.coherence_verified"),
      evidence_to_review: [
        "trazabilidad con regulación interna aplicable",
        "régimen interno de sanciones",
      ],
      required_facts: [],
      default_next_node_key: "formalize-approved",
      provenance: "legal_requirement",
    },
    {
      node_key: "formalize-approved",
      node_type: "question",
      title: "Versión aprobada",
      prompt: "¿Quedó formalizada la versión aprobada del régimen?",
      why_it_matters:
        "Sin aprobación y formalización el régimen no rige como instrumento interno.",
      fact_key: "mpi.disciplinary.approved",
      answer_type: "single_select",
      options: stateOptions("mpi.disciplinary.approved"),
      evidence_to_review: [
        "evidencia de aprobación",
        "régimen interno de sanciones",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del régimen",
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
            "El régimen forma parte del programa adoptado. Primero corresponde formalizar la adopción.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el régimen sigue en elaboración.",
          when: { op: "any", conditions: COMPONENT_FACTS.map(unresolved) },
          goto_outcome_key: "framework_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El régimen aún no queda establecido.",
        },
        {
          rule_id: "all-verified",
          description:
            "Adopción vigente y los cinco elementos verificados.",
          when: {
            op: "all",
            conditions: [lifecycleEligible(), ...COMPONENT_FACTS.map(isDone)],
          },
          goto_outcome_key: "framework_established",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en elaboración.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "framework_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "framework_established",
      label: "Régimen disciplinario establecido y aprobado",
      classification: "legal_requirement",
      explanation:
        "La adopción está vigente y el levantamiento, la integración, el procedimiento, la coherencia y la aprobación quedaron verificados.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "mpi.disciplinary_framework_status", value: "implemented" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente del régimen",
          note: "Archiva el régimen interno de sanciones, el procedimiento disciplinario, la evidencia de aprobación y la trazabilidad con la regulación interna aplicable.",
        },
      ],
    },
    {
      outcome_key: "framework_in_progress",
      label: "Régimen en elaboración",
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
