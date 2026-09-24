import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.05.
 *
 * activity_key = consent.proof_design (checklist, purpose scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * checks, evidencia y effects del contenido canónico D3.05. Verifica
 * la CAPACIDAD del mecanismo para generar, conservar y recuperar
 * evidencia suficiente cuando ocurra un consentimiento; nunca exige
 * prueba de titulares individuales, timestamps por persona ni
 * registros reales (frontera Stage 1).
 *
 * Bridge operativo/read-only idéntico a D3.03: compuerta sobre
 * `lawful.consent_applies = consent_yes` de D2.05, sin materializar
 * `purpose.lawful_basis`, sin modificar D2.05. Sin plazo de
 * conservación inventado. Mandatario condicional con `na`.
 * `reasoning_record_required = false`.
 */

const BRIDGE_FACT = "lawful.consent_applies";

const CHECKS = [
  "consent.proof.manifestation_recordable",
  "consent.proof.purpose_linked",
  "consent.proof.information_recorded",
  "consent.proof.priority_provable",
  "consent.proof.mandate_recorded",
  "consent.proof.retention_recoverable",
];

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function satisfied(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
}

function checkOptions(factKey: string, yesHint: string) {
  return [
    {
      value: "yes",
      label: "Revisado y satisfactorio",
      description: yesHint,
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Requiere acción o corrección",
      description: "Existe brecha que requiere acción o corrección.",
      fact_effect: { fact_key: factKey, value: "no" },
    },
    {
      value: "unknown",
      label: "Información insuficiente",
      description: "No es posible determinarlo con respaldo disponible.",
      fact_effect: { fact_key: factKey, value: "unknown" },
    },
  ];
}

function conditionalOptions(factKey: string, naHint: string) {
  return [
    {
      value: "yes",
      label: "Revisado y satisfactorio",
      description: "Verificado conforme al criterio evaluado.",
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
      label: "Requiere acción o corrección",
      description: "Existe brecha que requiere acción o corrección.",
      fact_effect: { fact_key: factKey, value: "no" },
    },
    {
      value: "unknown",
      label: "Información insuficiente",
      description: "No es posible determinarlo con respaldo disponible.",
      fact_effect: { fact_key: factKey, value: "unknown" },
    },
  ];
}

export const CONSENT_PROOF_DESIGN_PROTOCOL: ExecutionProtocol = {
  protocol_key: "consent.proof_design.v1",
  activity_key: "consent.proof_design",
  version: 1,
  mode: "checklist",
  execution_scope: "purpose",
  title: "Verificación guiada de la capacidad de prueba",
  description:
    "Verifica que el mecanismo esté diseñado para generar, conservar y recuperar evidencia suficiente del consentimiento de la finalidad activa: manifestación, finalidad, información, anterioridad, mandatario y recuperación.",
  entry_node_key: "route-gate",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [BRIDGE_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "route-gate",
      node_type: "decision",
      title: "Ruta de consentimiento",
      prompt:
        "El sistema verifica que esta finalidad siga la ruta de consentimiento según D2.05.",
      answer_type: "none",
      required_facts: [BRIDGE_FACT],
      transitions: [
        {
          rule_id: "consent-route",
          description: "La finalidad sigue la ruta de consentimiento.",
          when: {
            op: "fact_equals",
            fact_key: BRIDGE_FACT,
            value: "consent_yes",
          },
          goto_node_key: "check-manifestation",
          explanation:
            "D2.05 determinó consentimiento para esta finalidad: procede la verificación.",
        },
        {
          rule_id: "fallback-route",
          description: "Sin ruta de consentimiento no inicia la verificación.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "Esta guía solo procede cuando la finalidad utiliza consentimiento como base de licitud.",
        },
      ],
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-manifestation",
      node_type: "question",
      title: "Manifestación registrable",
      prompt:
        "¿El mecanismo es capaz de registrar la manifestación, declaración o acción afirmativa cuando ocurra?",
      why_it_matters:
        "Sin registro de la manifestación no es posible acreditar el consentimiento.",
      fact_key: "consent.proof.manifestation_recordable",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "consent.proof.manifestation_recordable",
        "Manifestación registrable por diseño.",
      ),
      evidence_to_review: [
        "especificación de logs y registros del sistema externo",
        "pruebas del mecanismo",
      ],
      required_facts: [],
      default_next_node_key: "check-purpose",
      provenance: "agency_standard",
    },
    {
      node_key: "check-purpose",
      node_type: "question",
      title: "Vínculo con la finalidad",
      prompt:
        "¿La evidencia generable vincula el consentimiento con la finalidad específica?",
      why_it_matters:
        "Sin vínculo con la finalidad no se acredita consentimiento específico.",
      fact_key: "consent.proof.purpose_linked",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "consent.proof.purpose_linked",
        "Vínculo con la finalidad específica por diseño.",
      ),
      evidence_to_review: ["modelo de evidencia", "diseño técnico o funcional"],
      required_facts: [],
      default_next_node_key: "check-information",
      provenance: "agency_standard",
    },
    {
      node_key: "check-information",
      node_type: "question",
      title: "Información registrada",
      prompt:
        "¿La evidencia registra la información y condiciones relevantes presentadas al consentir?",
      why_it_matters:
        "Sin registro de lo informado no se acredita consentimiento informado.",
      fact_key: "consent.proof.information_recorded",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "consent.proof.information_recorded",
        "Información y condiciones registrables por diseño.",
      ),
      evidence_to_review: ["modelo de evidencia", "captura de ejemplo"],
      required_facts: [],
      default_next_node_key: "check-priority",
      provenance: "agency_standard",
    },
    {
      node_key: "check-priority",
      node_type: "question",
      title: "Anterioridad acreditable",
      prompt:
        "¿La evidencia permite acreditar que el consentimiento antecedió al tratamiento sustentado en él?",
      why_it_matters:
        "Sin anterioridad acreditable no se sostiene el carácter previo.",
      fact_key: "consent.proof.priority_provable",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "consent.proof.priority_provable",
        "Anterioridad acreditable por diseño.",
      ),
      evidence_to_review: [
        "especificación de logs y registros del sistema externo",
        "pruebas del mecanismo",
      ],
      required_facts: [],
      default_next_node_key: "check-mandate",
      provenance: "agency_standard",
    },
    {
      node_key: "check-mandate",
      node_type: "question",
      title: "Mandatario registrable",
      prompt:
        "¿El diseño registra la actuación del representante o mandatario y la facultad expresa, o no interviene mandatario?",
      why_it_matters:
        "La actuación por mandatario debe quedar trazable con su facultad expresa.",
      fact_key: "consent.proof.mandate_recorded",
      answer_type: "single_select",
      options: conditionalOptions(
        "consent.proof.mandate_recorded",
        "No interviene representante ni mandatario en este caso.",
      ),
      evidence_to_review: ["modelo de evidencia"],
      required_facts: [],
      default_next_node_key: "check-recovery",
      provenance: "agency_standard",
    },
    {
      node_key: "check-recovery",
      node_type: "question",
      title: "Conservación y recuperación",
      prompt:
        "¿Están verificadas la conservación y la recuperación posterior de la evidencia?",
      why_it_matters:
        "Sin conservación y recuperación la evidencia no sirve ante la carga de prueba.",
      fact_key: "consent.proof.retention_recoverable",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "consent.proof.retention_recoverable",
        "Conservación y recuperación verificadas.",
      ),
      evidence_to_review: [
        "procedimiento de conservación y recuperación",
        "pruebas del mecanismo",
      ],
      required_facts: [],
      default_next_node_key: "synthesis",
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la capacidad",
      prompt:
        "El sistema verifica si el mecanismo puede generar y conservar evidencia suficiente.",
      answer_type: "none",
      required_facts: [BRIDGE_FACT, ...CHECKS],
      transitions: [
        {
          rule_id: "route-lost",
          description: "La finalidad ya no sigue la ruta de consentimiento.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: BRIDGE_FACT,
              value: "consent_yes",
            },
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "Sin ruta de consentimiento vigente no hay capacidad que verificar.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un criterio de capacidad requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de capacidad probatoria que requieren corrección.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún criterio está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan criterios por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "capability-ok",
          description: "Capacidad probatoria diseñada.",
          when: { op: "all", conditions: CHECKS.map(satisfied) },
          goto_outcome_key: "proof_capability_designed",
          explanation:
            "El mecanismo puede generar, conservar y recuperar evidencia suficiente.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La verificación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "proof_capability_designed",
      label: "Capacidad de prueba diseñada",
      classification: "agency_standard",
      explanation:
        "El mecanismo puede generar, conservar y recuperar evidencia suficiente del consentimiento. Esto declara capacidad, no prueba de titulares individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.proof_capability_status", value: "designed" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Continuar el diseño en D3.03",
          activity_key: "consent.mechanism_design",
        },
        {
          kind: "info",
          label: "Conservar el diseño",
          note: "Archiva el modelo de evidencia con el diseño técnico o funcional y el procedimiento de conservación y recuperación.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere correcciones de capacidad",
      classification: "agency_standard",
      explanation:
        "Al menos un criterio de capacidad probatoria requiere corrección.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.proof_capability_status", value: "remediation_required" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada criterio pendiente y vuelve a verificar la capacidad.",
        },
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Verificación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen criterios pendientes o con información insuficiente.",
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
      label: "Sin ruta de consentimiento",
      classification: "agency_standard",
      explanation:
        "Esta guía solo procede cuando la finalidad utiliza consentimiento como base de licitud.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Determinar la base en D2.05",
          activity_key: "lawful_basis.assign",
        },
      ],
    },
  ],
};
