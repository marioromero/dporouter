import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.06.
 *
 * activity_key = consent.withdrawal_enable (procedure, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia y effects del contenido canónico
 * D3.06. Diseña y habilita el retiro con efecto hacia futuro; nunca
 * registra revocaciones individuales ni afirma retroactividad
 * (frontera Stage 1).
 *
 * Bridge operativo/read-only idéntico a D3.03: compuerta sobre
 * `lawful.consent_applies = consent_yes` de D2.05, sin materializar
 * `purpose.lawful_basis`, sin modificar D2.05.
 * `reasoning_record_required = false`.
 */

const BRIDGE_FACT = "lawful.consent_applies";

const CHECKS = [
  "consent.withdrawal.anytime",
  "consent.withdrawal.no_cause",
  "consent.withdrawal.equivalent_means",
  "consent.withdrawal.expeditious",
  "consent.withdrawal.reliable",
  "consent.withdrawal.gratuitous",
  "consent.withdrawal.permanent",
  "consent.withdrawal.future_effect",
  "consent.withdrawal.public_coherence",
];

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function verifyOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "El punto fue verificado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "El punto aún no está cubierto en el diseño.",
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

export const CONSENT_WITHDRAWAL_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "consent.withdrawal_enable.v1",
  activity_key: "consent.withdrawal_enable",
  version: 1,
  mode: "procedure",
  execution_scope: "purpose",
  title: "Habilitación guiada del retiro del consentimiento",
  description:
    "Diseña y habilita el retiro del consentimiento para la finalidad activa: en cualquier momento, sin causa, por medios equivalentes, expeditos, fidedignos, gratuitos y disponibles, con efecto hacia futuro y coherencia pública.",
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
          goto_node_key: "check-anytime",
          explanation:
            "D2.05 determinó consentimiento para esta finalidad: procede la habilitación del retiro.",
        },
        {
          rule_id: "fallback-route",
          description: "Sin ruta de consentimiento no inicia la habilitación.",
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
      node_key: "check-anytime",
      node_type: "question",
      title: "Retiro en cualquier momento",
      prompt:
        "¿El diseño permite retirar el consentimiento en cualquier momento?",
      why_it_matters:
        "Sin retiro oportuno el mecanismo incumple la condición temporal.",
      fact_key: "consent.withdrawal.anytime",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.anytime"),
      evidence_to_review: ["flujo de retiro", "formulario o canal"],
      required_facts: [],
      default_next_node_key: "check-no-cause",
      provenance: "agency_standard",
    },
    {
      node_key: "check-no-cause",
      node_type: "question",
      title: "Sin expresión de causa",
      prompt:
        "¿El retiro opera sin necesidad de expresar causa?",
      why_it_matters:
        "Exigir causa condiciona indebidamente el retiro.",
      fact_key: "consent.withdrawal.no_cause",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.no_cause"),
      evidence_to_review: ["flujo de retiro", "procedimiento"],
      required_facts: [],
      default_next_node_key: "check-means",
      provenance: "agency_standard",
    },
    {
      node_key: "check-means",
      node_type: "question",
      title: "Medios equivalentes",
      prompt:
        "¿El retiro se ofrece por medios similares o equivalentes a los utilizados para otorgar el consentimiento?",
      why_it_matters:
        "Sin equivalencia de medios el retiro queda dificultado respecto del otorgamiento.",
      fact_key: "consent.withdrawal.equivalent_means",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.equivalent_means"),
      evidence_to_review: ["formulario o canal", "capturas"],
      required_facts: [],
      default_next_node_key: "check-expeditious",
      provenance: "agency_standard",
    },
    {
      node_key: "check-expeditious",
      node_type: "question",
      title: "Medios expeditos",
      prompt: "¿Los medios de retiro son expeditos?",
      why_it_matters:
        "Sin expedición el retiro se dilata y pierde efectividad.",
      fact_key: "consent.withdrawal.expeditious",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.expeditious"),
      evidence_to_review: ["prueba funcional del canal"],
      required_facts: [],
      default_next_node_key: "check-reliable",
      provenance: "agency_standard",
    },
    {
      node_key: "check-reliable",
      node_type: "question",
      title: "Medios fidedignos",
      prompt: "¿Los medios de retiro son fidedignos?",
      why_it_matters:
        "Sin fidedignidad no hay certeza de que el retiro quede registrado.",
      fact_key: "consent.withdrawal.reliable",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.reliable"),
      evidence_to_review: ["prueba funcional del canal", "procedimiento"],
      required_facts: [],
      default_next_node_key: "check-gratuity",
      provenance: "agency_standard",
    },
    {
      node_key: "check-gratuity",
      node_type: "question",
      title: "Gratuidad",
      prompt: "¿El retiro es gratuito?",
      why_it_matters:
        "Cobrar por retirar condiciona indebidamente el derecho.",
      fact_key: "consent.withdrawal.gratuitous",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.gratuitous"),
      evidence_to_review: ["formulario o canal"],
      required_facts: [],
      default_next_node_key: "check-permanent",
      provenance: "agency_standard",
    },
    {
      node_key: "check-permanent",
      node_type: "question",
      title: "Disponibilidad permanente",
      prompt: "¿El mecanismo de retiro está permanentemente disponible?",
      why_it_matters:
        "Sin disponibilidad permanente el derecho queda intermitente.",
      fact_key: "consent.withdrawal.permanent",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.permanent"),
      evidence_to_review: [
        "evidencia de disponibilidad del mecanismo",
        "capturas",
      ],
      required_facts: [],
      default_next_node_key: "check-future",
      provenance: "agency_standard",
    },
    {
      node_key: "check-future",
      node_type: "question",
      title: "Efecto hacia futuro",
      prompt:
        "¿Existe ruta operacional para que el retiro deje de sustentar en ese consentimiento el tratamiento futuro, sin afirmar retroactividad?",
      why_it_matters:
        "Sin ruta operacional el retiro no produce efecto; afirmar retroactividad excede el canon.",
      fact_key: "consent.withdrawal.future_effect",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.future_effect"),
      evidence_to_review: [
        "procedimiento",
        "integración funcional prevista",
      ],
      required_facts: [],
      default_next_node_key: "check-coherence",
      provenance: "agency_standard",
    },
    {
      node_key: "check-coherence",
      node_type: "question",
      title: "Coherencia pública",
      prompt:
        "¿El retiro es coherente con la información pública entregada al titular sobre este derecho?",
      why_it_matters:
        "Sin coherencia pública el titular recibe mensajes contradictorios.",
      fact_key: "consent.withdrawal.public_coherence",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.public_coherence"),
      evidence_to_review: ["capturas", "procedimiento"],
      required_facts: [],
      default_next_node_key: "synthesis",
      related_activity_keys: ["transparency.policy_assemble"],
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la habilitación",
      prompt:
        "El sistema verifica si el retiro quedó habilitado bajo las condiciones legales.",
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
            "Sin ruta de consentimiento vigente no hay retiro que habilitar.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos una condición del retiro está pendiente.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen condiciones del retiro por habilitar antes de declarar su cierre.",
        },
        {
          rule_id: "missing-info",
          description:
            "Alguna condición está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan condiciones por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "withdrawal-ok",
          description: "Retiro habilitado bajo las condiciones legales.",
          when: {
            op: "all",
            conditions: [
              ...CHECKS.map((f) => ({
                op: "fact_equals" as const,
                fact_key: f,
                value: "yes",
              })),
            ],
          },
          goto_outcome_key: "withdrawal_enabled",
          explanation:
            "El retiro opera en cualquier momento, sin causa, por medios equivalentes, expeditos, fidedignos, gratuitos y disponibles, con efecto hacia futuro.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La habilitación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "withdrawal_enabled",
      label: "Retiro habilitado",
      classification: "agency_standard",
      explanation:
        "El mecanismo permite retirar el consentimiento bajo las condiciones legales, con efecto hacia futuro. Esto habilita el retiro, no registra revocaciones individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.withdrawal_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Continuar el diseño en D3.03",
          activity_key: "consent.mechanism_design",
        },
        {
          kind: "info",
          label: "Conservar el procedimiento",
          note: "Archiva el flujo de retiro con formulario o canal, capturas, procedimiento e integración funcional prevista.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere habilitar el retiro",
      classification: "agency_standard",
      explanation:
        "Al menos una condición del retiro está pendiente de habilitación.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.withdrawal_status", value: "remediation_required" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Habilitar las condiciones pendientes",
          note: "Atiende cada condición pendiente y vuelve a verificar el retiro.",
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
        "Existen condiciones pendientes o con información insuficiente.",
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
