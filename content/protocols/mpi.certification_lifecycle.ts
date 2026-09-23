import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.19.
 *
 * activity_key = mpi.certification_lifecycle (procedure). Contenido
 * aprobado por la iteración vigente; usa exclusivamente pasos,
 * evidencia, legal basis, dependencias y aplicabilidad del contenido
 * canónico D1.19. Verifica la completitud del expediente de
 * certificación sin confundir el estado de certificación con el ciclo
 * de vida interno: nunca escribe ni modifica el lifecycle.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04, D1.18 o Diagnóstico (`mpi.lifecycle_status`
 * declarado en `external_fact_keys`): el programa debe estar
 * implementado antes de preparar la solicitud.
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce al expediente verificable);
 * - product-ready: false (sin estado canónico materializable);
 * - motivo: la certificación es un ciclo temporal de 8 estados con
 *   vigencia, expiración y renovación histórica; ningún `set` simple
 *   representa esa máquina de estados ni sus fechas.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";
const DECISION_FACT = "mpi.certification.case_known";

const OWN_FACTS = [
  DECISION_FACT,
  "mpi.certification.implemented_confirmed",
  "mpi.certification.antecedents_prepared",
  "mpi.certification.request_recorded",
  "mpi.certification.grant_recorded",
  "mpi.certification.renewal_controlled",
  "mpi.certification.closures_recorded",
];

const VERIFICATION_FACTS = [LIFECYCLE_FACT, ...OWN_FACTS];

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

export const MPI_CERTIFICATION_LIFECYCLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.certification_lifecycle.v1",
  activity_key: "mpi.certification_lifecycle",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del expediente de certificación",
  description:
    "Verifica que el expediente de certificación esté completo y trazable sin confundir la certificación con el ciclo de vida interno: programa implementado, antecedentes, solicitud, otorgamiento, renovación y cierres.",
  entry_node_key: "case-gate",
  decision_fact_keys: OWN_FACTS,
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "case-gate",
      node_type: "question",
      title: "Gestión de certificación",
      prompt:
        "¿El responsable busca certificar, renovar o gestionar un cambio en la certificación?",
      why_it_matters:
        "La gestión activa el expediente: sin decisión de certificar, renovar o gestionar un cambio no hay trámite que verificar.",
      fact_key: DECISION_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "certify",
          label: "Certificar",
          description: "Se busca obtener la certificación.",
          fact_effect: { fact_key: DECISION_FACT, value: "certify" },
        },
        {
          value: "renew",
          label: "Renovar",
          description: "Se busca renovar la certificación.",
          fact_effect: { fact_key: DECISION_FACT, value: "renew" },
        },
        {
          value: "manage_change",
          label: "Gestionar un cambio",
          description: "Se gestiona un cambio en el estado de certificación.",
          fact_effect: { fact_key: DECISION_FACT, value: "manage_change" },
        },
        {
          value: "none",
          label: "Sin gestión",
          description: "No existe gestión de certificación en curso.",
          fact_effect: { fact_key: DECISION_FACT, value: "none" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: DECISION_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: ["seguimiento regulatorio"],
      required_facts: [],
      default_next_node_key: "confirm-implemented",
      transitions: [
        {
          rule_id: "no-case",
          description: "Sin gestión no hay expediente que verificar.",
          when: {
            op: "fact_equals",
            fact_key: DECISION_FACT,
            value: "none",
          },
          goto_outcome_key: "no_pending_case",
          explanation:
            "No existe gestión de certificación en curso. Nada que verificar por esta vía.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "confirm-implemented",
      node_type: "question",
      title: "Confirmación de programa implementado",
      prompt:
        "¿Quedó confirmado que el MPI está implementado antes de preparar la solicitud?",
      why_it_matters:
        "Preparar una solicitud sobre un programa no implementado invalida el trámite.",
      fact_key: "mpi.certification.implemented_confirmed",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.implemented_confirmed"),
      evidence_to_review: [
        "revisión del programa",
        "revisión documental",
      ],
      required_facts: [],
      default_next_node_key: "prepare-antecedents",
      related_activity_keys: ["mpi.assemble_program"],
      provenance: "legal_requirement",
    },
    {
      node_key: "prepare-antecedents",
      node_type: "question",
      title: "Antecedentes requeridos",
      prompt: "¿Quedaron preparados los antecedentes requeridos?",
      why_it_matters:
        "Sin antecedentes completos la solicitud queda expuesta a observaciones o denegación.",
      fact_key: "mpi.certification.antecedents_prepared",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.antecedents_prepared"),
      evidence_to_review: ["antecedentes remitidos"],
      required_facts: [],
      default_next_node_key: "record-request",
      provenance: "legal_requirement",
    },
    {
      node_key: "record-request",
      node_type: "question",
      title: "Solicitud y estado registrados",
      prompt: "¿Quedaron registradas la solicitud y su estado?",
      why_it_matters:
        "Sin registro de la solicitud no hay trazabilidad del trámite.",
      fact_key: "mpi.certification.request_recorded",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.request_recorded"),
      evidence_to_review: ["solicitud", "evidencia de registro"],
      required_facts: [],
      default_next_node_key: "record-grant",
      provenance: "legal_requirement",
    },
    {
      node_key: "record-grant",
      node_type: "question",
      title: "Otorgamiento y vigencia",
      prompt:
        "¿Quedaron registradas la certificación y su vigencia cuando fue otorgada?",
      why_it_matters:
        "Sin registro de vigencia no es posible controlar renovación ni expiración.",
      fact_key: "mpi.certification.grant_recorded",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.grant_recorded"),
      evidence_to_review: [
        "certificado cuando exista",
        "fecha de vigencia",
        "evidencia de registro",
      ],
      required_facts: [],
      default_next_node_key: "control-renewal",
      provenance: "legal_requirement",
    },
    {
      node_key: "control-renewal",
      node_type: "question",
      title: "Control de renovación",
      prompt: "¿Quedó establecido el control de la renovación?",
      why_it_matters:
        "Sin control la certificación puede expirar sin gestión oportuna.",
      fact_key: "mpi.certification.renewal_controlled",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.renewal_controlled"),
      evidence_to_review: [
        "resoluciones de renovación, denegación, término o revocación",
      ],
      required_facts: [],
      default_next_node_key: "record-closures",
      provenance: "legal_requirement",
    },
    {
      node_key: "record-closures",
      node_type: "question",
      title: "Cierres y cambios de estado",
      prompt:
        "¿Quedaron registradas la expiración, denegación, término o revocación cuando corresponda?",
      why_it_matters:
        "Sin registro de cierres el expediente queda desactualizado frente a la Agencia.",
      fact_key: "mpi.certification.closures_recorded",
      answer_type: "single_select",
      options: stateOptions("mpi.certification.closures_recorded"),
      evidence_to_review: [
        "resoluciones de renovación, denegación, término o revocación",
        "revisión de comunicaciones de Agencia",
        "evidencia de registro",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del expediente",
      prompt:
        "El sistema verifica el programa implementado y que cada verificación esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "not-implemented",
          description:
            "Sin programa implementado no inicia la certificación.",
          when: {
            op: "all",
            conditions: [
              { op: "not", condition: unresolved(LIFECYCLE_FACT) },
              {
                op: "not",
                condition: {
                  op: "fact_equals",
                  fact_key: LIFECYCLE_FACT,
                  value: "implemented",
                },
              },
            ],
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "El ciclo vigente no muestra un programa implementado. Primero corresponde implementar el programa.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el expediente sigue en elaboración.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "dossier_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El expediente aún no queda completo.",
        },
        {
          rule_id: "all-verified",
          description:
            "Programa implementado, gestión activa y expediente completo.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: LIFECYCLE_FACT,
                value: "implemented",
              },
              {
                op: "fact_in",
                fact_key: DECISION_FACT,
                values: ["certify", "renew", "manage_change"],
              },
              isDone("mpi.certification.implemented_confirmed"),
              isDone("mpi.certification.antecedents_prepared"),
              isDone("mpi.certification.request_recorded"),
              isDone("mpi.certification.grant_recorded"),
              isDone("mpi.certification.renewal_controlled"),
              isDone("mpi.certification.closures_recorded"),
            ],
          },
          goto_outcome_key: "dossier_complete",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas, sin modificar el ciclo de vida interno.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en elaboración.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "dossier_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "dossier_complete",
      label: "Expediente de certificación completo",
      classification: "legal_requirement",
      explanation:
        "El programa implementado, la gestión activa y cada pieza del expediente quedaron verificados, sin alterar el ciclo de vida interno.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente de certificación",
          note: "Archiva la solicitud, los antecedentes remitidos, el certificado cuando exista con su fecha de vigencia, las resoluciones pertinentes y la evidencia de registro.",
        },
      ],
    },
    {
      outcome_key: "dossier_in_progress",
      label: "Expediente en elaboración",
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
      label: "Programa aún no implementado",
      classification: "agency_standard",
      explanation:
        "Sin programa implementado no inicia la certificación.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Implementar el programa en D1.18",
          activity_key: "mpi.assemble_program",
        },
      ],
    },
    {
      outcome_key: "no_pending_case",
      label: "Sin gestión en curso",
      classification: "agency_standard",
      explanation:
        "No existe gestión de certificación en curso. Nada que verificar por esta vía.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar ante una nueva gestión",
        },
      ],
    },
  ],
};
