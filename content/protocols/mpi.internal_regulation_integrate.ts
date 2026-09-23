import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.07.
 *
 * activity_key = mpi.internal_regulation_integrate (procedure).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D1.07. Los pasos genuinamente condicionales del
 * canon (reglamento interno y publicidad, "cuando corresponda") usan la
 * opción explícita "No aplica en este caso" en lugar de forzar una
 * verificación inexistente. Los estados Pendiente e Incorporado se
 * distinguen por los valores de cada verificación.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04 o Diagnóstico (`mpi.lifecycle_status` declarado en
 * `external_fact_keys`): es prerrequisito de entrada, nunca una
 * re-evaluación de adopción.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";

const COMPONENT_FACTS = [
  "mpi.regulation.subjects_identified",
  "mpi.regulation.instruments_identified",
  "mpi.regulation.obligations_incorporated",
  "mpi.regulation.bylaws_updated",
  "mpi.regulation.publicity_verified",
];

/** Estados de adopción que habilitan la integración (canon D1.07). */
const ELIGIBLE = ["adoption_formalized", "implementing", "implemented"];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function verifiedOrNa(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
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

function conditionalOptions(factKey: string, naHint: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "Realizado y respaldado con evidencia.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "na",
      label: "No aplica en este caso",
      description: naHint,
      fact_effect: { fact_key: factKey, value: "na" },
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

export const MPI_REGULATION_INTEGRATE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.internal_regulation_integrate.v1",
  activity_key: "mpi.internal_regulation_integrate",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de integración regulatoria interna",
  description:
    "Verifica que las obligaciones del programa queden incorporadas en los instrumentos laborales y contractuales que correspondan, con publicidad cuando aplique.",
  entry_node_key: "identify-subjects",
  decision_fact_keys: COMPONENT_FACTS,
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "identify-subjects",
      node_type: "question",
      title: "Alcanzados por el programa",
      prompt:
        "¿Quedaron identificados los trabajadores, empleados y prestadores alcanzados por el programa?",
      why_it_matters:
        "Sin identificar a los alcanzados no es posible determinar qué instrumentos deben integrarse.",
      fact_key: "mpi.regulation.subjects_identified",
      answer_type: "single_select",
      options: stateOptions("mpi.regulation.subjects_identified"),
      evidence_to_review: ["evidencia de incorporación"],
      required_facts: [],
      default_next_node_key: "identify-instruments",
      provenance: "legal_requirement",
    },
    {
      node_key: "identify-instruments",
      node_type: "question",
      title: "Instrumentos por integrar",
      prompt:
        "¿Quedaron identificados los instrumentos contractuales e internos que requieren integración?",
      why_it_matters:
        "Sin identificar los instrumentos no es posible incorporar las obligaciones donde corresponden.",
      fact_key: "mpi.regulation.instruments_identified",
      answer_type: "single_select",
      options: stateOptions("mpi.regulation.instruments_identified"),
      evidence_to_review: [
        "cláusulas o anexos actualizados",
        "reglamento interno actualizado cuando corresponda",
      ],
      required_facts: [],
      default_next_node_key: "incorporate-obligations",
      provenance: "legal_requirement",
    },
    {
      node_key: "incorporate-obligations",
      node_type: "question",
      title: "Obligaciones incorporadas",
      prompt:
        "¿Quedaron incorporadas las obligaciones del programa según corresponda?",
      why_it_matters:
        "Sin incorporación efectiva las obligaciones del programa no rigen en la relación interna o contractual.",
      fact_key: "mpi.regulation.obligations_incorporated",
      answer_type: "single_select",
      options: stateOptions("mpi.regulation.obligations_incorporated"),
      evidence_to_review: [
        "cláusulas o anexos actualizados",
        "evidencia de incorporación",
      ],
      required_facts: [],
      default_next_node_key: "update-bylaws",
      provenance: "legal_requirement",
    },
    {
      node_key: "update-bylaws",
      node_type: "question",
      title: "Reglamento interno",
      prompt:
        "¿Se coordinó la incorporación al reglamento interno, o se descartó fundadamente su aplicación?",
      why_it_matters:
        "Cuando resulta aplicable, el reglamento interno debe reflejar las obligaciones del programa.",
      fact_key: "mpi.regulation.bylaws_updated",
      answer_type: "single_select",
      options: conditionalOptions(
        "mpi.regulation.bylaws_updated",
        "El reglamento interno no requiere incorporación en este caso.",
      ),
      evidence_to_review: ["reglamento interno actualizado cuando corresponda"],
      help_text: [
        "Solo cuando resulte aplicable. En caso contrario marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "verify-publicity",
      provenance: "legal_requirement",
    },
    {
      node_key: "verify-publicity",
      node_type: "question",
      title: "Publicidad correspondiente",
      prompt:
        "¿Se verificaron las medidas de publicidad correspondientes, o se descartó fundadamente su aplicación?",
      why_it_matters:
        "Sin publicidad la integración queda sin el conocimiento exigible de los alcanzados.",
      fact_key: "mpi.regulation.publicity_verified",
      answer_type: "single_select",
      options: conditionalOptions(
        "mpi.regulation.publicity_verified",
        "Este caso no exige medidas de publicidad.",
      ),
      evidence_to_review: ["evidencia de publicidad cuando corresponda"],
      help_text: [
        "Solo cuando corresponda. En caso contrario marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de la integración",
      prompt:
        "El sistema verifica el prerrequisito de adopción y que cada verificación esté realizada.",
      answer_type: "none",
      required_facts: [LIFECYCLE_FACT, ...COMPONENT_FACTS],
      transitions: [
        {
          rule_id: "not-adopted",
          description:
            "Sin adopción formalizada no inicia la integración.",
          when: { op: "not", condition: lifecycleEligible() },
          goto_outcome_key: "not_started",
          explanation:
            "La integración materializa obligaciones del programa adoptado. Primero corresponde formalizar la adopción.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: la integración sigue en curso.",
          when: { op: "any", conditions: COMPONENT_FACTS.map(unresolved) },
          goto_outcome_key: "integration_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La integración aún no queda incorporada.",
        },
        {
          rule_id: "all-verified",
          description:
            "Adopción vigente e integración verificada o descartada fundadamente.",
          when: {
            op: "all",
            conditions: [
              lifecycleEligible(),
              isDone("mpi.regulation.subjects_identified"),
              isDone("mpi.regulation.instruments_identified"),
              isDone("mpi.regulation.obligations_incorporated"),
              verifiedOrNa("mpi.regulation.bylaws_updated"),
              verifiedOrNa("mpi.regulation.publicity_verified"),
            ],
          },
          goto_outcome_key: "integration_complete",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "integration_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "integration_complete",
      label: "Integración incorporada y evidenciada",
      classification: "legal_requirement",
      explanation:
        "La adopción está vigente y los alcanzados, instrumentos, obligaciones, reglamento y publicidad quedaron verificados o fundadamente descartados.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "mpi.internal_regulation_status", value: "integrated" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente de integración",
          note: "Archiva las cláusulas o anexos actualizados, el reglamento interno actualizado cuando corresponda, y la evidencia de incorporación y de publicidad cuando corresponda.",
        },
      ],
    },
    {
      outcome_key: "integration_in_progress",
      label: "Integración en curso",
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
        "Sin adopción vigente no inicia la integración.",
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
