import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D5.03.
 *
 * activity_key = sensitive.biometric_assess (decision, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente definición, requisitos de información, rutas y
 * state effect del contenido canónico D5.03. Sin dependency rígida
 * hacia D5.01/D5.02 y sin inferir biometría desde flags de datos:
 * el régimen deriva del uso técnico declarado en el perfil de la
 * finalidad.
 *
 * Reglas preservadas:
 * - dato biométrico exige tratamiento técnico específico dirigido a
 *   identificación única (no confundir identificadores comunes);
 * - cuatro elementos de información verificables con independencia
 *   de la licitud base: sin ellos no hay supported;
 * - sin consentimiento solo caben hipótesis del inciso segundo del
 *   art. 16 bis;
 * - warning estructural visible pero no mutante: no cambia
 *   candidatura, no bloquea por sí solo, debe considerarse en el
 *   razonamiento;
 * - se exige al menos un dato vinculado referenciado (selección
 *   profesional), sin crear relación biométrica persistente.
 */

const CANDIDATE = "derived.purpose.d5_biometric_candidate";
const USE = "bio03.use_reviewed";
const READY = "bio03.analysis_ready";
const DRAFT = "bio03.working_conclusion";

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function verifiedOptions(factKey: string, verifiedLabel: string) {
  return [
    {
      value: "yes",
      label: "Verificado con respaldo",
      description: verifiedLabel,
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente de verificar",
      description: "Aún no se verifica con respaldo revisable.",
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

function consideredOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Analizada con respaldo",
      description: "La hipótesis fue analizada con respaldo revisable (aplica o descartada fundadamente).",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No analizada",
      description: "La hipótesis aún no ha sido analizada.",
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

export const SENSITIVE_BIOMETRIC_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "sensitive.biometric_assess.v1",
  activity_key: "sensitive.biometric_assess",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada del tratamiento biométrico",
  description:
    "Estructura el análisis del tratamiento biométrico para la finalidad activa: verifica el tratamiento técnico de identificación única, los cuatro elementos de información, la vía con o sin consentimiento, y documenta la conclusión profesional.",
  entry_node_key: "structural-gate",
  decision_fact_keys: [CANDIDATE, USE, READY],
  external_fact_keys: [CANDIDATE],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Candidatura estructural",
      prompt:
        "El sistema verifica si la finalidad declara uso de identificación biométrica.",
      answer_type: "none",
      required_facts: [CANDIDATE],
      transitions: [
        {
          rule_id: "candidate-yes",
          description: "La finalidad declara uso de identificación biométrica.",
          when: isYes(CANDIDATE),
          goto_node_key: "use-review",
          explanation:
            "La finalidad utiliza tratamiento técnico para identificación única: corresponde el análisis biométrico.",
        },
        {
          rule_id: "candidate-no",
          description: "La finalidad declara no usar identificación biométrica.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "Sin uso declarado de identificación biométrica esta revisión no está indicada.",
        },
        {
          rule_id: "fallback-classification",
          description: "Sin declaración no inicia el análisis.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "classification_incomplete",
          explanation:
            "Declara si la finalidad utiliza tratamiento técnico para identificación única antes del análisis jurídico.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "use-review",
      node_type: "question",
      title: "Uso técnico revisado",
      prompt:
        "¿Se revisó que la finalidad utiliza datos obtenidos mediante tratamiento técnico específico para permitir o confirmar la identificación única de una persona?",
      why_it_matters:
        "Sin tratamiento técnico dirigido a identificación única no hay dato biométrico en sentido jurídico, aunque existan rasgos físicos.",
      fact_key: USE,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        USE,
        "El uso técnico de identificación única fue revisado con respaldo.",
      ),
      evidence_to_review: [
        "descripción del sistema",
        "arquitectura funcional",
        "finalidad declarada",
      ],
      help_text: [
        "No confundir un identificador común con dato biométrico si no existe el tratamiento técnico específico.",
      ],
      required_facts: [],
      default_next_node_key: "technical-identification",
      provenance: "agency_standard",
    },
    {
      node_key: "technical-identification",
      node_type: "question",
      title: "Identificación única",
      prompt:
        "¿Se confirmó que el tratamiento técnico tiene por objetivo permitir o confirmar la identificación única?",
      why_it_matters:
        "El objetivo de identificación única distingue el dato biométrico de otros datos técnicos.",
      fact_key: "bio03.technical_identification",
      answer_type: "yes_no_unknown",
      options: consideredOptions("bio03.technical_identification"),
      evidence_to_review: [
        "revisión funcional y técnica",
        "documentación del proveedor o del sistema",
      ],
      required_facts: [],
      default_next_node_key: "system-identified",
      provenance: "legal_requirement",
    },
    {
      node_key: "system-identified",
      node_type: "question",
      title: "Sistema biométrico",
      prompt: "¿Se identificó el sistema biométrico utilizado?",
      why_it_matters:
        "Informar el sistema es el primero de los cuatro elementos exigidos al titular.",
      fact_key: "bio03.system_identified",
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        "bio03.system_identified",
        "El sistema biométrico utilizado está identificado.",
      ),
      evidence_to_review: ["descripción del sistema"],
      required_facts: [],
      default_next_node_key: "specific-purpose",
      provenance: "legal_requirement",
    },
    {
      node_key: "specific-purpose",
      node_type: "question",
      title: "Finalidad específica",
      prompt: "¿Se identificó la finalidad específica del tratamiento biométrico?",
      why_it_matters:
        "La finalidad específica es el segundo elemento exigido y delimita el uso legítimo.",
      fact_key: "bio03.specific_purpose",
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        "bio03.specific_purpose",
        "La finalidad específica está identificada.",
      ),
      evidence_to_review: ["finalidad declarada"],
      required_facts: [],
      default_next_node_key: "usage-period",
      provenance: "legal_requirement",
    },
    {
      node_key: "usage-period",
      node_type: "question",
      title: "Período de utilización",
      prompt: "¿Se identificó el período de utilización de los datos biométricos?",
      why_it_matters:
        "El período acota temporalmente el tratamiento informado al titular.",
      fact_key: "bio03.usage_period",
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        "bio03.usage_period",
        "El período de utilización está identificado.",
      ),
      evidence_to_review: ["período declarado"],
      required_facts: [],
      default_next_node_key: "rights-info",
      provenance: "legal_requirement",
    },
    {
      node_key: "rights-info",
      node_type: "question",
      title: "Ejercicio de derechos",
      prompt:
        "¿Se verificó cómo se informa al titular la forma de ejercer sus derechos?",
      why_it_matters:
        "Es el cuarto elemento exigido; sin él la información especial está incompleta aunque exista vía jurídica.",
      fact_key: "bio03.rights_info",
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        "bio03.rights_info",
        "La información sobre ejercicio de derechos fue verificada.",
      ),
      evidence_to_review: [
        "aviso e información entregada",
        "mecanismo de derechos",
      ],
      required_facts: [],
      default_next_node_key: "consent-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "consent-route",
      node_type: "question",
      title: "Vía por consentimiento",
      prompt:
        "Si se utiliza consentimiento: ¿se verificó el cumplimiento de la regla del inciso primero del art. 16?",
      why_it_matters:
        "El consentimiento biométrico debe cumplir el estándar expreso sin reimplementar D3.",
      fact_key: "bio03.consent_verified",
      answer_type: "yes_no_unknown",
      options: consideredOptions("bio03.consent_verified"),
      evidence_to_review: [
        "documentación de consentimiento",
        "mecanismo de consentimiento (contexto D3)",
      ],
      required_facts: [],
      default_next_node_key: "noconsent-route",
      related_activity_keys: ["consent.mechanism_design"],
      provenance: "legal_requirement",
    },
    {
      node_key: "noconsent-route",
      node_type: "question",
      title: "Vía sin consentimiento",
      prompt:
        "Si se pretende tratar sin consentimiento: ¿se analizó exclusivamente alguna hipótesis del inciso segundo del art. 16 bis?",
      why_it_matters:
        "Sin consentimiento no caben excepciones generales del art. 16 por analogía: solo el inciso segundo del art. 16 bis.",
      fact_key: "bio03.noconsent_16bis",
      answer_type: "yes_no_unknown",
      options: consideredOptions("bio03.noconsent_16bis"),
      evidence_to_review: ["fundamento del art. 16 bis cuando no exista consentimiento"],
      required_facts: [],
      default_next_node_key: "analysis-ready",
      provenance: "legal_requirement",
    },
    {
      node_key: "analysis-ready",
      node_type: "question",
      title: "Análisis suficiente",
      prompt:
        "¿El uso técnico, los cuatro elementos de información y la vía jurídica están verificados con respaldo suficiente para concluir?",
      why_it_matters:
        "Solo con definición técnica, información completa y vía analizada existe base para concluir.",
      fact_key: READY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        READY,
        "Uso, información y vía están verificados y documentados.",
      ),
      evidence_to_review: ["Reasoning Record biométrico"],
      required_facts: [],
      default_next_node_key: "sufficiency-gate",
      provenance: "agency_standard",
    },
    {
      node_key: "sufficiency-gate",
      node_type: "decision",
      title: "Suficiencia del análisis",
      prompt:
        "El sistema verifica candidatura, revisión del uso y análisis suficiente antes de la conclusión.",
      answer_type: "none",
      required_facts: [CANDIDATE, USE, READY],
      transitions: [
        {
          rule_id: "ready-for-conclusion",
          description: "Candidatura vigente, uso revisado y análisis suficiente.",
          when: {
            op: "all",
            conditions: [isYes(CANDIDATE), isYes(USE), isYes(READY)],
          },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Existe base mínima para que el profesional adopte una conclusión documentada.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La evaluación no puede concluir con el estado actual de antecedentes. Sin datos vinculados, la evaluación operacional queda incompleta.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "adopt-conclusion",
      node_type: "question",
      title: "Adopción de la conclusión",
      prompt:
        "¿Cuál conclusión profesional adoptas sobre el tratamiento biométrico de esta finalidad?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema.",
      fact_key: DRAFT,
      answer_type: "single_select",
      options: [
        {
          value: "biometric_conditions_supported",
          label: "Condiciones cumplidas",
          description:
            "Juicio profesional: el tratamiento biométrico cumple licitud e información especial.",
          fact_effect: { fact_key: DRAFT, value: "biometric_conditions_supported" },
        },
        {
          value: "biometric_conditions_not_supported",
          label: "Condiciones no cumplidas",
          description:
            "Juicio profesional: el tratamiento no cumple las condiciones con los antecedentes actuales.",
          fact_effect: { fact_key: DRAFT, value: "biometric_conditions_not_supported" },
        },
      ],
      evidence_to_review: ["Reasoning Record biométrico"],
      help_text: [
        "Si existe advertencia estructural (contexto biométrico), considérala expresamente en el razonamiento: no cambia la candidatura pero forma parte de los hechos relevantes.",
        "No uses la falta de información como fundamento de incumplimiento: si faltan antecedentes, la evaluación queda incompleta.",
      ],
      required_facts: [CANDIDATE, USE, READY],
    },
  ],
  outcomes: [
    {
      outcome_key: "biometric_conditions_supported",
      label: "Condiciones cumplidas",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el tratamiento biométrico cumple las condiciones especiales de licitud e información.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "sensitive.biometric_status", value: "supported" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con el sistema, la finalidad, el período, la información entregada y la vía analizada. No archives plantillas ni datos biométricos reales.",
        },
      ],
    },
    {
      outcome_key: "biometric_conditions_not_supported",
      label: "Condiciones no cumplidas",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el tratamiento no cumple las condiciones con los antecedentes actuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "sensitive.biometric_status", value: "not_supported" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Revisar la base de licitud en D2.05",
          activity_key: "lawful_basis.assign",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o sin información suficiente, o no hay datos vinculados para una evaluación operacional. Esto no es una conclusión sobre el tratamiento.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
    {
      outcome_key: "classification_incomplete",
      label: "Clasificación incompleta",
      classification: "agency_standard",
      explanation:
        "Aún no está declarado si la finalidad utiliza tratamiento técnico para identificación única.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar declaración de uso",
          note: "Declara el uso biométrico de la finalidad (sí, no o por determinar) antes del análisis jurídico.",
        },
      ],
    },
    {
      outcome_key: "regime_not_indicated",
      label: "Régimen no indicado",
      classification: "agency_standard",
      explanation:
        "La finalidad declara no usar identificación biométrica. No es una conclusión jurídica ni marca la actividad como no aplicable.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Si el uso declarado cambia, esta revisión puede corresponder en el futuro.",
        },
      ],
    },
  ],
  reasoning_requirements: {
    required_fields: [
      "conclusion",
      "legal_question",
      "facts_considered",
      "legal_factors",
      "alternatives_considered",
      "rationale",
      "decided_by",
      "decided_at",
      "legal_basis",
    ],
  },
};
