import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.03.
 *
 * activity_key = consent.mechanism_design (procedure, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, dependencias y state effect del
 * contenido canónico D3.03. Diseña y verifica la estructura del
 * mecanismo de obtención; nunca decide la base de licitud (D2 ya
 * determinó la ruta) ni registra consentimientos individuales.
 *
 * Bridge operativo/read-only: la ruta de consentimiento se lee del
 * fact purpose-scoped `lawful.consent_applies = consent_yes`
 * producido por D2.05 (`external_fact_keys`, compuerta de entrada).
 * No se materializa `purpose.lawful_basis`, no se modifica D2.05,
 * no se duplica ni deriva ningún fact.
 *
 * Pasos 11–13 del canon (libertad, prueba, retiro) no se duplican
 * como evaluaciones internas: se resuelven mediante las completion
 * dependencies D3.04/D3.05/D3.06, leídas como facts externos de la
 * misma purpose. La guía puede comenzar y navegarse libremente;
 * solo el resultado definitivo `mechanism_designed` exige libertad
 * `supported`, prueba `designed` y retiro `enabled` (sin orden
 * rígido entre D3.04–D3.06). `reasoning_record_required = false`.
 */

const BRIDGE_FACT = "lawful.consent_applies";
const FREEDOM_FACT = "consent.freedom_status";
const PROOF_FACT = "consent.proof_capability_status";
const WITHDRAWAL_FACT = "consent.withdrawal_status";

const CHECKS = [
  "consent.mechanism.purpose_confirmed",
  "consent.mechanism.channel_identified",
  "consent.mechanism.information_verified",
  "consent.mechanism.specificity_verified",
  "consent.mechanism.priority_verified",
  "consent.mechanism.affirmative_verified",
  "consent.mechanism.no_silence_ensured",
  "consent.mechanism.mandate_covered",
  "consent.mechanism.documented",
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

function conditionalOptions(factKey: string, naHint: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "El punto fue verificado con respaldo revisable.",
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

export const CONSENT_MECHANISM_DESIGN_PROTOCOL: ExecutionProtocol = {
  protocol_key: "consent.mechanism_design.v1",
  activity_key: "consent.mechanism_design",
  version: 1,
  mode: "procedure",
  execution_scope: "purpose",
  title: "Diseño guiado del mecanismo de consentimiento",
  description:
    "Diseña y verifica el mecanismo que obtiene consentimiento para la finalidad activa: finalidad concreta, canal, información, especificidad, carácter previo, acción afirmativa, mandatario y documentación, con libertad, prueba y retiro resueltos en sus actividades propias.",
  entry_node_key: "route-gate",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [BRIDGE_FACT, FREEDOM_FACT, PROOF_FACT, WITHDRAWAL_FACT],
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
          goto_node_key: "check-purpose",
          explanation:
            "D2.05 determinó consentimiento para esta finalidad: procede el diseño del mecanismo.",
        },
        {
          rule_id: "fallback-route",
          description: "Sin ruta de consentimiento no inicia el diseño.",
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
      node_key: "check-purpose",
      node_type: "question",
      title: "Finalidad concreta",
      prompt:
        "¿Está identificada la finalidad concreta para la cual se obtendrá el consentimiento?",
      why_it_matters:
        "Sin finalidad concreta no es posible verificar especificidad ni vincular la manifestación.",
      fact_key: "consent.mechanism.purpose_confirmed",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.purpose_confirmed"),
      evidence_to_review: ["diseño del flujo"],
      required_facts: [],
      default_next_node_key: "check-channel",
      provenance: "agency_standard",
    },
    {
      node_key: "check-channel",
      node_type: "question",
      title: "Canal de obtención",
      prompt:
        "¿Está identificado el canal o modalidad mediante el cual se obtendrá el consentimiento?",
      why_it_matters:
        "El canal determina textos, evidencias y equivalencia del retiro.",
      fact_key: "consent.mechanism.channel_identified",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.channel_identified"),
      evidence_to_review: ["especificación funcional", "scripts y canales"],
      required_facts: [],
      default_next_node_key: "check-information",
      provenance: "agency_standard",
    },
    {
      node_key: "check-information",
      node_type: "question",
      title: "Información al titular",
      prompt:
        "¿El diseño asegura que el titular disponga de la información relevante al momento de consentir?",
      why_it_matters:
        "Sin información disponible no hay consentimiento informado.",
      fact_key: "consent.mechanism.information_verified",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.information_verified"),
      evidence_to_review: ["formularios", "textos y pantallas"],
      required_facts: [],
      default_next_node_key: "check-specificity",
      provenance: "agency_standard",
    },
    {
      node_key: "check-specificity",
      node_type: "question",
      title: "Especificidad",
      prompt:
        "¿La manifestación queda vinculada específicamente a la finalidad, sin agrupamientos que la diluyan?",
      why_it_matters:
        "Sin vinculación específica no hay consentimiento específico respecto de la finalidad.",
      fact_key: "consent.mechanism.specificity_verified",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.specificity_verified"),
      evidence_to_review: ["formularios", "textos y pantallas"],
      required_facts: [],
      default_next_node_key: "check-priority",
      provenance: "agency_standard",
    },
    {
      node_key: "check-priority",
      node_type: "question",
      title: "Carácter previo",
      prompt:
        "¿El diseño asegura que la manifestación ocurra antes del tratamiento basado en consentimiento?",
      why_it_matters:
        "Sin anterioridad no hay consentimiento previo.",
      fact_key: "consent.mechanism.priority_verified",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.priority_verified"),
      evidence_to_review: ["diseño del flujo", "especificación funcional"],
      required_facts: [],
      default_next_node_key: "check-affirmative",
      provenance: "agency_standard",
    },
    {
      node_key: "check-affirmative",
      node_type: "question",
      title: "Acción afirmativa",
      prompt:
        "¿El mecanismo exige declaración o clara acción afirmativa del titular?",
      why_it_matters:
        "Sin declaración o acción afirmativa no hay consentimiento inequívoco.",
      fact_key: "consent.mechanism.affirmative_verified",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.affirmative_verified"),
      evidence_to_review: ["formularios", "textos y pantallas"],
      required_facts: [],
      default_next_node_key: "check-no-silence",
      provenance: "agency_standard",
    },
    {
      node_key: "check-no-silence",
      node_type: "question",
      title: "Silencio no es consentimiento",
      prompt:
        "¿El diseño impide tratar el silencio o la inacción como consentimiento?",
      why_it_matters:
        "Tratar silencio como consentimiento invalida el mecanismo completo.",
      fact_key: "consent.mechanism.no_silence_ensured",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.no_silence_ensured"),
      evidence_to_review: ["diseño del flujo", "especificación funcional"],
      required_facts: [],
      default_next_node_key: "check-mandate",
      provenance: "agency_standard",
    },
    {
      node_key: "check-mandate",
      node_type: "question",
      title: "Mandatario",
      prompt:
        "¿El diseño contempla comprobar facultad expresa cuando actúe mandatario, o no interviene mandatario?",
      why_it_matters:
        "La actuación por mandatario exige comprobación de facultad expresa en el diseño.",
      fact_key: "consent.mechanism.mandate_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "consent.mechanism.mandate_covered",
        "No interviene mandatario en este caso.",
      ),
      evidence_to_review: [
        "mecanismo previsto para mandatario cuando corresponda",
      ],
      required_facts: [],
      default_next_node_key: "check-documented",
      provenance: "agency_standard",
    },
    {
      node_key: "check-documented",
      node_type: "question",
      title: "Documentación del mecanismo",
      prompt:
        "¿El mecanismo quedó documentado con sus conexiones a libertad, prueba y retiro?",
      why_it_matters:
        "Sin documentación no hay trazabilidad del diseño ni de sus dependencias.",
      fact_key: "consent.mechanism.documented",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.mechanism.documented"),
      evidence_to_review: ["evidencia del mecanismo"],
      required_facts: [],
      default_next_node_key: "synthesis",
      related_activity_keys: [
        "consent.freedom_assess",
        "consent.proof_design",
        "consent.withdrawal_enable",
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis del diseño",
      prompt:
        "El sistema verifica el diseño propio y las dependencias de libertad, prueba y retiro de esta misma finalidad.",
      answer_type: "none",
      required_facts: [BRIDGE_FACT, ...CHECKS, FREEDOM_FACT, PROOF_FACT, WITHDRAWAL_FACT],
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
            "Sin ruta de consentimiento vigente no hay diseño que completar.",
        },
        {
          rule_id: "gaps-found",
          description: "Algún requisito estructural del mecanismo está pendiente.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen puntos del diseño por cubrir antes de declarar el mecanismo diseñado.",
        },
        {
          rule_id: "dependency-negative",
          description:
            "Libertad no soportada o prueba/retiro en remediación.",
          when: {
            op: "any",
            conditions: [
              { op: "fact_equals", fact_key: FREEDOM_FACT, value: "not_supported" },
              { op: "fact_equals", fact_key: PROOF_FACT, value: "remediation_required" },
              { op: "fact_equals", fact_key: WITHDRAWAL_FACT, value: "remediation_required" },
            ],
          },
          goto_outcome_key: "dependency_remediation_required",
          explanation:
            "El diseño no puede declararse mientras libertad, prueba o retiro de esta finalidad estén negativamente cerrados.",
        },
        {
          rule_id: "missing-info",
          description:
            "Diseño o dependencias con información pendiente o sin resolver.",
          when: {
            op: "any",
            conditions: [
              ...CHECKS.map(unresolved),
              unresolved(FREEDOM_FACT),
              unresolved(PROOF_FACT),
              unresolved(WITHDRAWAL_FACT),
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan puntos del diseño o dependencias por resolver en esta finalidad.",
        },
        {
          rule_id: "mechanism-complete",
          description:
            "Diseño verificado con dependencias positivamente cerradas.",
          when: {
            op: "all",
            conditions: [
              ...CHECKS.map(satisfied),
              { op: "fact_equals", fact_key: FREEDOM_FACT, value: "supported" },
              { op: "fact_equals", fact_key: PROOF_FACT, value: "designed" },
              { op: "fact_equals", fact_key: WITHDRAWAL_FACT, value: "enabled" },
            ],
          },
          goto_outcome_key: "mechanism_designed",
          explanation:
            "El mecanismo está diseñado y sus dependencias de esta finalidad están positivamente cerradas.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "El diseño no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "mechanism_designed",
      label: "Mecanismo diseñado",
      classification: "agency_standard",
      explanation:
        "El mecanismo está diseñado para esta finalidad, con libertad, prueba y retiro positivamente cerrados. Esto declara el diseño, no la validez de cada consentimiento individual.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.mechanism_status", value: "designed" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el diseño",
          note: "Archiva el diseño del flujo con formularios, textos, especificación funcional y evidencia del mecanismo.",
        },
      ],
    },
    {
      outcome_key: "dependency_remediation_required",
      label: "Dependencias por remediar",
      classification: "agency_standard",
      explanation:
        "Libertad, prueba o retiro de esta finalidad requieren remediación antes de declarar el mecanismo diseñado.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Evaluar la libertad en D3.04",
          activity_key: "consent.freedom_assess",
          show_when: {
            op: "not",
            condition: { op: "fact_equals", fact_key: FREEDOM_FACT, value: "supported" },
          },
        },
        {
          kind: "activity",
          label: "Verificar la prueba en D3.05",
          activity_key: "consent.proof_design",
          show_when: {
            op: "not",
            condition: { op: "fact_equals", fact_key: PROOF_FACT, value: "designed" },
          },
        },
        {
          kind: "activity",
          label: "Habilitar el retiro en D3.06",
          activity_key: "consent.withdrawal_enable",
          show_when: {
            op: "not",
            condition: { op: "fact_equals", fact_key: WITHDRAWAL_FACT, value: "enabled" },
          },
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere completar el diseño",
      classification: "agency_standard",
      explanation:
        "Al menos un requisito estructural del mecanismo está pendiente. Completa el diseño antes de declarar su cierre.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar los puntos pendientes",
          note: "Atiende cada punto del diseño marcado como pendiente.",
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
        "Existen puntos del diseño o dependencias pendientes o con información insuficiente.",
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
