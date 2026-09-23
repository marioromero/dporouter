import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.12.
 *
 * activity_key = dpo.confidentiality_duty (procedure). Contenido
 * aprobado por la iteración vigente; usa exclusivamente pasos,
 * evidencia, legal basis, dependencias y aplicabilidad del contenido
 * canónico D1.12. Verifica existencia, formalización, alcance y
 * medidas: el resultado constata un deber formalizado y respaldado,
 * nunca declara cumplimiento jurídico automático.
 *
 * El paso de formalización es genuinamente condicional en el canon
 * ("cuando corresponda"): usa la opción explícita "No aplica en este
 * caso" cuando el instrumento aplicable ya contiene el deber y solo se
 * verificó. La compuerta de designación reutiliza el fact
 * dpo.designated ya producido por D1.08/D1.09/D1.11.
 */

const VERIFICATION_FACTS = [
  "dpo.designated",
  "dpo.confidentiality.obligation_verified",
  "dpo.confidentiality.formalized",
  "dpo.confidentiality.scope_included",
  "dpo.confidentiality.measures_verified",
];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function verifiedOrNa(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
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

export const DPO_CONFIDENTIALITY_DUTY_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.confidentiality_duty.v1",
  activity_key: "dpo.confidentiality_duty",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del deber de confidencialidad",
  description:
    "Verifica que el DPO conozca, acepte y mantenga el deber de secreto, reserva o confidencialidad: obligación aplicable, formalización, alcance y medidas organizacionales.",
  entry_node_key: "designation-gate",
  decision_fact_keys: VERIFICATION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "designation-gate",
      node_type: "question",
      title: "DPO designado",
      prompt: "¿Existe actualmente un DPO designado?",
      why_it_matters:
        "El deber se vincula a la persona que ejerce la función. Sin designación corresponde designar primero.",
      fact_key: "dpo.designated",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe un DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "Aún no hay DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo.designated", value: "unknown" },
        },
      ],
      evidence_to_review: ["expediente de designación"],
      required_facts: [],
      default_next_node_key: "verify-obligation",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay deber que formalizar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. El deber requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "verify-obligation",
      node_type: "question",
      title: "Obligación aplicable",
      prompt:
        "¿Se verificó la existencia de la obligación de confidencialidad aplicable al DPO?",
      why_it_matters:
        "Sin obligación aplicable identificada no es posible formalizar ni controlar el deber.",
      fact_key: "dpo.confidentiality.obligation_verified",
      answer_type: "single_select",
      options: stateOptions("dpo.confidentiality.obligation_verified"),
      evidence_to_review: [
        "cláusula, compromiso o instrumento aplicable",
        "revisión contractual",
      ],
      required_facts: [],
      default_next_node_key: "formalize-instrument",
      provenance: "legal_requirement",
    },
    {
      node_key: "formalize-instrument",
      node_type: "question",
      title: "Formalización del deber",
      prompt:
        "¿Quedó formalizado el deber en instrumento interno o contractual, o se descartó fundadamente por ya contenido?",
      why_it_matters:
        "Sin formalización el deber queda sin instrumento que lo haga exigible y trazable.",
      fact_key: "dpo.confidentiality.formalized",
      answer_type: "single_select",
      options: [
        {
          value: "yes",
          label: "Verificado",
          description: "Formalizado y respaldado con evidencia.",
          fact_effect: {
            fact_key: "dpo.confidentiality.formalized",
            value: "yes",
          },
        },
        {
          value: "na",
          label: "No aplica en este caso",
          description:
            "El instrumento aplicable ya contiene el deber y solo se verificó.",
          fact_effect: {
            fact_key: "dpo.confidentiality.formalized",
            value: "na",
          },
        },
        {
          value: "no",
          label: "Pendiente",
          description: "Aún no realizado o sin evidencia suficiente.",
          fact_effect: {
            fact_key: "dpo.confidentiality.formalized",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo.confidentiality.formalized",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "cláusula, compromiso o instrumento aplicable",
        "evidencia de aceptación",
      ],
      help_text: [
        "Solo cuando corresponda formalizar. Si el instrumento aplicable ya contiene el deber, verifica y marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "verify-scope",
      provenance: "legal_requirement",
    },
    {
      node_key: "verify-scope",
      node_type: "question",
      title: "Alcance del deber",
      prompt:
        "¿El deber incluye la información personal y las demás materias sujetas a secreto, reserva o confidencialidad?",
      why_it_matters:
        "Un alcance incompleto deja materias sensibles fuera del deber.",
      fact_key: "dpo.confidentiality.scope_included",
      answer_type: "single_select",
      options: stateOptions("dpo.confidentiality.scope_included"),
      evidence_to_review: [
        "cláusula, compromiso o instrumento aplicable",
        "evidencia de aceptación",
      ],
      required_facts: [],
      default_next_node_key: "verify-measures",
      provenance: "legal_requirement",
    },
    {
      node_key: "verify-measures",
      node_type: "question",
      title: "Medidas organizacionales",
      prompt:
        "¿Se verificaron las medidas organizacionales que permiten cumplir el deber?",
      why_it_matters:
        "Sin medidas organizacionales el deber queda en declaración y pierde protección operativa.",
      fact_key: "dpo.confidentiality.measures_verified",
      answer_type: "single_select",
      options: stateOptions("dpo.confidentiality.measures_verified"),
      evidence_to_review: ["controles organizacionales relacionados"],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del deber",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el deber sigue en formalización.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "duty_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El deber aún no queda formalizado y respaldado.",
        },
        {
          rule_id: "all-verified",
          description:
            "Designación, obligación, formalización, alcance y medidas verificados.",
          when: {
            op: "all",
            conditions: [
              isDone("dpo.designated"),
              isDone("dpo.confidentiality.obligation_verified"),
              verifiedOrNa("dpo.confidentiality.formalized"),
              isDone("dpo.confidentiality.scope_included"),
              isDone("dpo.confidentiality.measures_verified"),
            ],
          },
          goto_outcome_key: "duty_formalized",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en formalización.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "duty_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "duty_formalized",
      label: "Deber formalizado y respaldado",
      classification: "legal_requirement",
      explanation:
        "La obligación aplicable, la formalización, el alcance y las medidas organizacionales quedaron verificados para el DPO designado.",
      detail:
        "Esta constatación no constituye una declaración automática de cumplimiento jurídico: registra el deber formalizado con su evidencia.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "dpo.confidentiality_status", value: "formalized" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia del deber",
          note: "Archiva la cláusula, compromiso o instrumento aplicable con su evidencia de aceptación y los controles organizacionales relacionados.",
        },
      ],
    },
    {
      outcome_key: "duty_in_progress",
      label: "Deber en formalización",
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
      label: "DPO aún no designado",
      classification: "agency_standard",
      explanation:
        "Sin DPO designado no hay deber que formalizar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Designar DPO en D1.08",
          activity_key: "dpo.designate",
        },
      ],
    },
  ],
};
