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
 *
 * La expresión "según corresponda" del canon introduce una única
 * condición real de aplicabilidad: la sujeción al Reglamento Interno
 * de los artículos 153 y siguientes del Código del Trabajo. Se resuelve
 * explícitamente en `bylaws-applicability`: solo cuando aplica son
 * exigibles `update-bylaws` y `verify-publicity`; cuando no aplica,
 * ambos se cierran legítimamente como No aplica sin constituir brecha.
 * No aplica es distinto de Pendiente y de Sin información, y nunca
 * puede omitir los requisitos contractuales generales.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";
const APPLICABILITY_FACT = "mpi.regulation.bylaws_applicable";

const COMPONENT_FACTS = [
  "mpi.regulation.subjects_identified",
  "mpi.regulation.instruments_identified",
  "mpi.regulation.obligations_incorporated",
  APPLICABILITY_FACT,
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
      default_next_node_key: "bylaws-applicability",
      provenance: "legal_requirement",
    },
    {
      node_key: "bylaws-applicability",
      node_type: "question",
      title: "Aplicabilidad del Reglamento Interno",
      prompt:
        "¿Está la organización sujeta al Reglamento Interno de los artículos 153 y siguientes del Código del Trabajo?",
      why_it_matters:
        "De esta determinación depende la exigibilidad de la rama de reglamento y publicidad: solo cuando aplica deben incorporarse y publicarse.",
      fact_key: "mpi.regulation.bylaws_applicable",
      answer_type: "single_select",
      options: [
        {
          value: "applies",
          label: "Sí, sujeta",
          description:
            "La organización está sujeta al Reglamento Interno: la rama es exigible.",
          fact_effect: {
            fact_key: "mpi.regulation.bylaws_applicable",
            value: "applies",
          },
        },
        {
          value: "not_applies",
          label: "No sujeta",
          description:
            "La organización no está sujeta: la rama puede cerrarse como No aplica.",
          fact_effect: {
            fact_key: "mpi.regulation.bylaws_applicable",
            value: "not_applies",
          },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "mpi.regulation.bylaws_applicable",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "revisión de reglamento interno",
        "revisión documental",
      ],
      help_text: [
        "Resuelve explícitamente la sujeción antes de verificar la rama: de ello depende qué resulta exigible.",
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
        "La organización no está sujeta al Reglamento Interno: la rama queda legítimamente fuera.",
      ),
      evidence_to_review: ["reglamento interno actualizado cuando corresponda"],
      help_text: [
        "Exigible solo cuando la organización está sujeta al Reglamento Interno. En caso contrario marca No aplica en este caso.",
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
        "La organización no está sujeta al Reglamento Interno: la rama queda legítimamente fuera.",
      ),
      evidence_to_review: ["evidencia de publicidad cuando corresponda"],
      help_text: [
        "Exigible solo cuando la organización está sujeta al Reglamento Interno. En caso contrario marca No aplica en este caso.",
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
          rule_id: "branch-required-but-skipped",
          description:
            "La rama aplica pero se marcó No aplica: no omite requisitos exigibles.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: APPLICABILITY_FACT,
                value: "applies",
              },
              {
                op: "any",
                conditions: [
                  {
                    op: "fact_equals",
                    fact_key: "mpi.regulation.bylaws_updated",
                    value: "na",
                  },
                  {
                    op: "fact_equals",
                    fact_key: "mpi.regulation.publicity_verified",
                    value: "na",
                  },
                ],
              },
            ],
          },
          goto_outcome_key: "integration_in_progress",
          explanation:
            "La organización está sujeta al Reglamento Interno: la rama de reglamento y publicidad es exigible y No aplica no la omite.",
        },
        {
          rule_id: "branch-dismissed-but-verified",
          description:
            "Determinación contradictoria entre aplicabilidad y verificación.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: APPLICABILITY_FACT,
                value: "not_applies",
              },
              {
                op: "any",
                conditions: [
                  isDone("mpi.regulation.bylaws_updated"),
                  isDone("mpi.regulation.publicity_verified"),
                ],
              },
            ],
          },
          goto_outcome_key: "integration_in_progress",
          explanation:
            "La rama se declaró no aplicable pero figura como verificada: revisa la determinación de sujeción o la verificación.",
        },
        {
          rule_id: "all-verified",
          description:
            "Adopción vigente, requisitos contractuales verificados y rama resuelta según su aplicabilidad.",
          when: {
            op: "all",
            conditions: [
              lifecycleEligible(),
              isDone("mpi.regulation.subjects_identified"),
              isDone("mpi.regulation.instruments_identified"),
              isDone("mpi.regulation.obligations_incorporated"),
              {
                op: "fact_in",
                fact_key: APPLICABILITY_FACT,
                values: ["applies", "not_applies"],
              },
              verifiedOrNa("mpi.regulation.bylaws_updated"),
              verifiedOrNa("mpi.regulation.publicity_verified"),
            ],
          },
          goto_outcome_key: "integration_complete",
          explanation:
            "Todas las verificaciones exigibles están realizadas y respaldadas; la rama no aplicable quedó legítimamente fuera sin constituir brecha.",
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
