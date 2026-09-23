import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.01.
 *
 * activity_key = governance.preventive_framework (procedure). Contenido
 * aprobado por la iteración vigente; usa exclusivamente pasos, evidencia,
 * legal basis y state effect del contenido canónico D1.01. Sin
 * dependencias: la actividad no declara ninguna.
 *
 * Calibración de modo: los pasos operativos se representan como
 * verificaciones de hechos ("¿quedó verificado y registrado?"), no como
 * preguntas de descubrimiento. answer_type single_select con estados
 * explícitos Verificado / Pendiente / Sin información; nunca
 * yes_no_unknown ambiguo para verificaciones. La compuerta de
 * aplicabilidad (rol de responsable) usa el ternario Sí / No /
 * Desconocido porque determina si el marco procede.
 *
 * Este marco preventivo general es independiente de la adopción de un
 * MPI: no lo confunde con el programa D1.03/D1.04 y así lo declara.
 */

const VERIFICATION_FACTS = [
  "governance.client_is_responsible",
  "governance.actions_identified",
  "governance.gaps_determined",
  "governance.framework_defined",
  "governance.followup_established",
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

export const GOVERNANCE_PREVENTIVE_FRAMEWORK_PROTOCOL: ExecutionProtocol = {
  protocol_key: "governance.preventive_framework.v1",
  activity_key: "governance.preventive_framework",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del marco general de prevención",
  description:
    "Guía al profesional desde la confirmación del rol de responsable hasta un marco preventivo operativo con responsables, acciones y seguimiento: antecedentes, vacíos, definición del marco y mecanismo de control. No es adopción de MPI.",
  entry_node_key: "role-gate",
  decision_fact_keys: VERIFICATION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "role-gate",
      node_type: "question",
      title: "Rol de responsable",
      prompt:
        "¿El cliente actúa como responsable en al menos un tratamiento?",
      why_it_matters:
        "El marco preventivo general recae sobre el responsable. Sin ese rol no existe marco que establecer en esta actividad.",
      fact_key: "governance.client_is_responsible",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Actúa como responsable en al menos un tratamiento.",
          fact_effect: {
            fact_key: "governance.client_is_responsible",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "No",
          description: "No actúa como responsable en ningún tratamiento.",
          fact_effect: {
            fact_key: "governance.client_is_responsible",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "governance.client_is_responsible",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "inventario de tratamientos",
        "evaluación de roles por tratamiento",
      ],
      required_facts: [],
      default_next_node_key: "identify-actions",
      transitions: [
        {
          rule_id: "not-responsible",
          description:
            "Sin rol de responsable no procede el marco preventivo general.",
          when: {
            op: "fact_equals",
            fact_key: "governance.client_is_responsible",
            value: "no",
          },
          goto_outcome_key: "not_applicable",
          explanation:
            "El cliente no actúa como responsable. Esta actividad aplica cuando existe al menos un tratamiento en calidad de responsable.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "identify-actions",
      node_type: "question",
      title: "Acciones preventivas existentes",
      prompt:
        "¿Quedaron identificadas las acciones preventivas existentes y sus responsables?",
      why_it_matters:
        "El marco se construye sobre lo existente: sin levantar acciones y responsables no es posible detectar vacíos ni distribuir responsabilidades.",
      fact_key: "governance.actions_identified",
      answer_type: "single_select",
      options: stateOptions("governance.actions_identified"),
      evidence_to_review: [
        "matriz o registro de acciones preventivas",
        "asignación de responsables",
        "revisión de controles existentes",
      ],
      help_text: [
        "Levanta cada acción preventiva vigente con su responsable mediante revisión documental, entrevistas y revisión de controles existentes.",
      ],
      required_facts: [],
      default_next_node_key: "determine-gaps",
      provenance: "agency_standard",
    },
    {
      node_key: "determine-gaps",
      node_type: "question",
      title: "Vacíos de gobierno y coordinación",
      prompt:
        "¿Quedaron determinados los vacíos de gobierno, documentación o coordinación?",
      why_it_matters:
        "Los vacíos determinan qué debe crear el marco: sin este diagnóstico la definición posterior carece de base.",
      fact_key: "governance.gaps_determined",
      answer_type: "single_select",
      options: stateOptions("governance.gaps_determined"),
      evidence_to_review: [
        "matriz o registro de acciones preventivas",
        "revisión de controles existentes",
      ],
      help_text: [
        "Contrasta las acciones existentes contra gobierno, documentación y coordinación para registrar cada vacío detectado.",
      ],
      required_facts: [],
      default_next_node_key: "define-framework",
      provenance: "agency_standard",
    },
    {
      node_key: "define-framework",
      node_type: "question",
      title: "Definición del marco preventivo",
      prompt:
        "¿Quedó definido un marco preventivo que distribuye responsabilidades y conecta los controles especializados?",
      why_it_matters:
        "El marco distribuye responsabilidades y articula los controles de los demás dominios: es el entregable central de la actividad.",
      fact_key: "governance.framework_defined",
      answer_type: "single_select",
      options: stateOptions("governance.framework_defined"),
      evidence_to_review: [
        "marco o política interna de prevención",
        "asignación de responsables",
        "evidencia de aprobación o comunicación interna cuando corresponda",
      ],
      help_text: [
        "Este marco preventivo general es independiente de la adopción de un MPI: no lo confundas con el programa de los dominios D1.03/D1.04.",
      ],
      required_facts: [],
      default_next_node_key: "followup-mechanism",
      provenance: "agency_standard",
    },
    {
      node_key: "followup-mechanism",
      node_type: "question",
      title: "Mecanismo de seguimiento",
      prompt:
        "¿Quedó establecido el mecanismo de seguimiento de las acciones preventivas?",
      why_it_matters:
        "Sin seguimiento el marco queda en declaración: el mecanismo sostiene su operación en el tiempo.",
      fact_key: "governance.followup_established",
      answer_type: "single_select",
      options: stateOptions("governance.followup_established"),
      evidence_to_review: [
        "matriz o registro de acciones preventivas",
        "evidencia de aprobación o comunicación interna cuando corresponda",
      ],
      help_text: [
        "Define quién sigue cada acción, con qué cadencia y con qué registro verificable.",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del marco",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el marco sigue en construcción.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "framework_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El marco aún no queda establecido.",
        },
        {
          rule_id: "all-verified",
          description:
            "Rol, acciones, vacíos, marco y seguimiento verificados.",
          when: { op: "all", conditions: VERIFICATION_FACTS.map(isDone) },
          goto_outcome_key: "framework_established",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en construcción.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "framework_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "framework_established",
      label: "Marco preventivo establecido y evidenciado",
      classification: "agency_standard",
      explanation:
        "El rol, las acciones existentes, los vacíos, el marco con responsabilidades y el seguimiento quedaron verificados.",
      provenance: "agency_standard",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "governance.prevention_framework_status", value: "established" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente del marco",
          note: "Archiva el marco o política interna, la asignación de responsables, la matriz de acciones preventivas y la evidencia de aprobación o comunicación interna.",
        },
        {
          kind: "info",
          label: "Distinguir este marco de un MPI",
          note: "Este marco preventivo general es independiente de la adopción de un MPI: no lo presentes como programa de prevención de infracciones.",
        },
      ],
    },
    {
      outcome_key: "framework_in_progress",
      label: "Marco en construcción",
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
      outcome_key: "not_applicable",
      label: "No aplica: sin rol de responsable",
      classification: "agency_standard",
      explanation:
        "Sin al menos un tratamiento en calidad de responsable no procede establecer este marco.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Revisar roles por actor y tratamiento",
          activity_key: "treatment.actor_roles",
        },
      ],
    },
  ],
};
