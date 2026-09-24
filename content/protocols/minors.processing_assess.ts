import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D5.04.
 *
 * activity_key = minors.processing_assess (decision, purpose scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * reglas, categorías, evidencia y state effect del contenido
 * canónico D5.04. Sin taxonomía técnica de edades: las categorías y
 * umbrales legales se preservan en guidance; la población se captura
 * con answers abstractos (presencia por categoría), nunca personas,
 * edades ni identidades reales.
 *
 * Reglas preservadas:
 * - candidate del perfil (involvesMinors); sin derivar desde datos;
 * - precondición estructural: ≥1 dato vinculado y todos con
 *   sensitive != unknown (la subregla <16 lo exige);
 * - subregla sensibles <16 solo exigible con sensitive=yes
 *   vinculado; sensitive=yes no concluye edad ni población;
 * - sin dependency rígida a D5.01 (no todo dato NNA es sensible).
 */

const CANDIDATE = "derived.purpose.d5_minors_candidate";
const ITEMS = "minors04.items_reviewed";
const READY = "minors04.analysis_ready";
const DRAFT = "minors04.working_conclusion";

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function consideredOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Analizada con respaldo",
      description: "La regla fue analizada con respaldo revisable (aplica o descartada fundadamente).",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No analizada",
      description: "La regla aún no ha sido analizada.",
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

function presenceOptions(factKey: string, groupLabel: string) {
  return [
    {
      value: "yes",
      label: "Sí, presente",
      description: `${groupLabel} está presente en esta finalidad.`,
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No presente",
      description: `${groupLabel} no está presente en esta finalidad.`,
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

export const MINORS_PROCESSING_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "minors.processing_assess.v1",
  activity_key: "minors.processing_assess",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada del tratamiento de datos de NNA",
  description:
    "Estructura el análisis del art. 16 quáter para la finalidad activa: interés superior, autonomía progresiva, autorización por categoría, subregla de sensibles de adolescentes, diseño de distinción, protección reforzada y obligaciones educativas.",
  entry_node_key: "structural-gate",
  decision_fact_keys: [CANDIDATE, ITEMS, READY],
  external_fact_keys: [CANDIDATE],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Candidatura estructural",
      prompt:
        "El sistema verifica si la finalidad declara dirigirse a población de niños, niñas o adolescentes o involucrarla.",
      answer_type: "none",
      required_facts: [CANDIDATE],
      transitions: [
        {
          rule_id: "candidate-yes",
          description: "La finalidad involucra población NNA.",
          when: isYes(CANDIDATE),
          goto_node_key: "items-review",
          explanation:
            "La finalidad declara población de niños, niñas o adolescentes: corresponde el análisis del art. 16 quáter.",
        },
        {
          rule_id: "candidate-no",
          description: "La finalidad declara no involucrar población NNA.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "Sin población NNA involucrada esta revisión no está indicada.",
        },
        {
          rule_id: "fallback-classification",
          description: "Sin declaración no inicia el análisis.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "classification_incomplete",
          explanation:
            "Declara si la finalidad involucra población NNA antes del análisis jurídico.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "items-review",
      node_type: "question",
      title: "Datos vinculados revisados",
      prompt:
        "¿Se revisaron los datos actualmente vinculados a la finalidad y su clasificación como sensibles?",
      why_it_matters:
        "La subregla de sensibles de adolescentes exige conocer la sensibilidad del universo vinculado.",
      fact_key: ITEMS,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        ITEMS,
        "Los datos vinculados y su clasificación fueron revisados.",
      ),
      evidence_to_review: [
        "descripción de la finalidad",
        "mapeo dato-finalidad disponible",
        "clasificación estructural de los datos",
      ],
      required_facts: [],
      default_next_node_key: "children-present",
      provenance: "agency_standard",
    },
    {
      node_key: "children-present",
      node_type: "question",
      title: "Presencia de niños y niñas",
      prompt:
        "¿La finalidad involucra niños o niñas bajo el umbral legal (categoría abstracta del tratamiento, sin edades ni identidades reales)?",
      why_it_matters:
        "Los niños y niñas exigen consentimiento parental, representativo o de cuidado personal salvo norma expresa.",
      fact_key: "minors04.children_present",
      answer_type: "yes_no_unknown",
      options: presenceOptions(
        "minors04.children_present",
        "Población de niños y niñas",
      ),
      evidence_to_review: [
        "diseño del proceso",
        "reglas de segmentación y autorización",
      ],
      required_facts: [],
      default_next_node_key: "adolescents-present",
      provenance: "agency_standard",
    },
    {
      node_key: "adolescents-present",
      node_type: "question",
      title: "Presencia de adolescentes",
      prompt:
        "¿La finalidad involucra adolescentes (categoría abstracta, sin edades ni identidades reales)?",
      why_it_matters:
        "Los adolescentes siguen reglas de autorización propias y la subregla especial de sensibles.",
      fact_key: "minors04.adolescents_present",
      answer_type: "yes_no_unknown",
      options: presenceOptions(
        "minors04.adolescents_present",
        "Población adolescente",
      ),
      evidence_to_review: [
        "diseño del proceso",
        "reglas de segmentación y autorización",
      ],
      required_facts: [],
      default_next_node_key: "adolescent-sensitive-u16",
      provenance: "agency_standard",
    },
    {
      node_key: "adolescent-sensitive-u16",
      node_type: "question",
      title: "Sensibles de adolescentes menores de 16",
      prompt:
        "¿La finalidad involucra datos sensibles de adolescentes menores de dieciséis años (determinación profesional abstracta, sin datos reales)?",
      why_it_matters:
        "Esta subregla exige autorización parental, representativa o de cuidado personal salvo norma expresa.",
      fact_key: "minors04.adolescent_sensitive_u16",
      answer_type: "yes_no_unknown",
      options: presenceOptions(
        "minors04.adolescent_sensitive_u16",
        "Datos sensibles de adolescentes menores de dieciséis años",
      ),
      evidence_to_review: [
        "diseño de consentimiento",
        "autorización o mandato legal cuando se invoque",
      ],
      help_text: [
        "Un dato clasificado como sensible no determina por sí solo edad ni población: esta determinación es profesional y separada.",
      ],
      required_facts: [],
      default_next_node_key: "superior-interest",
      provenance: "legal_requirement",
    },
    {
      node_key: "superior-interest",
      node_type: "question",
      title: "Interés superior",
      prompt: "¿Se evaluó el interés superior de niños, niñas o adolescentes en el tratamiento?",
      why_it_matters:
        "El interés superior condiciona todo el régimen de tratamiento de NNA.",
      fact_key: "minors04.superior_interest",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.superior_interest"),
      evidence_to_review: ["análisis profesional"],
      required_facts: [],
      default_next_node_key: "progressive-autonomy",
      provenance: "legal_requirement",
    },
    {
      node_key: "progressive-autonomy",
      node_type: "question",
      title: "Autonomía progresiva",
      prompt: "¿Se evaluó el respeto de la autonomía progresiva según la categoría involucrada?",
      why_it_matters:
        "La autonomía progresiva modula la intervención según el desarrollo.",
      fact_key: "minors04.progressive_autonomy",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.progressive_autonomy"),
      evidence_to_review: ["análisis profesional"],
      required_facts: [],
      default_next_node_key: "children-consent",
      provenance: "legal_requirement",
    },
    {
      node_key: "children-consent",
      node_type: "question",
      title: "Autorización para niños y niñas",
      prompt:
        "Para niños y niñas: ¿se verificó consentimiento de padres, representantes legales o cuidado personal, salvo autorización o mandato legal expreso?",
      why_it_matters:
        "Sin autorización válida o norma expresa el tratamiento de niños y niñas no se sostiene.",
      fact_key: "minors04.children_consent",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.children_consent"),
      evidence_to_review: [
        "diseño de consentimiento",
        "autorización o mandato legal",
      ],
      required_facts: [],
      default_next_node_key: "adolescent-rules",
      provenance: "legal_requirement",
    },
    {
      node_key: "adolescent-rules",
      node_type: "question",
      title: "Reglas para adolescentes",
      prompt:
        "Para adolescentes: ¿se evaluaron las reglas de autorización aplicables conforme al régimen previsto, preservando categorías y umbrales legales?",
      why_it_matters:
        "Las categorías y umbrales legales no se reformulan en taxonomías técnicas.",
      fact_key: "minors04.adolescent_rules",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.adolescent_rules"),
      evidence_to_review: [
        "reglas de segmentación y autorización",
        "autorización o mandato legal cuando se invoque",
      ],
      required_facts: [],
      default_next_node_key: "adolescent-sensitive-rule",
      provenance: "legal_requirement",
    },
    {
      node_key: "adolescent-sensitive-rule",
      node_type: "question",
      title: "Subregla de sensibles <16",
      prompt:
        "Cuando aplica la subregla de sensibles de adolescentes menores de dieciséis: ¿se verificó autorización parental, representativa o de cuidado personal, salvo autorización o mandato legal expreso, e identificación de la norma invocada?",
      why_it_matters:
        "La subregla combina dato sensible con población adolescente menor de dieciséis años.",
      fact_key: "minors04.adolescent_sensitive_rule",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.adolescent_sensitive_rule"),
      evidence_to_review: [
        "diseño de consentimiento",
        "autorización o mandato legal",
      ],
      required_facts: [],
      default_next_node_key: "authorization-norm",
      provenance: "legal_requirement",
    },
    {
      node_key: "authorization-norm",
      node_type: "question",
      title: "Norma de autorización",
      prompt:
        "Si se invoca autorización o mandato legal: ¿se identificó la norma legal correspondiente?",
      why_it_matters:
        "Sin norma identificada la excepción por autorización no puede invocarse.",
      fact_key: "minors04.authorization_norm",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.authorization_norm"),
      evidence_to_review: ["autorización o mandato legal"],
      help_text: [
        "No existe catálogo cerrado: identifica la norma realmente invocada.",
      ],
      required_facts: [],
      default_next_node_key: "operational-design",
      provenance: "legal_requirement",
    },
    {
      node_key: "operational-design",
      node_type: "question",
      title: "Diseño de distinción",
      prompt:
        "¿Se verificó que existe diseño o procedimiento para distinguir correctamente las reglas anteriores sin almacenar edades o identidades reales?",
      why_it_matters:
        "Aplicar la regla correcta exige distinguir categorías sin registrar datos reales de menores.",
      fact_key: "minors04.operational_design",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.operational_design"),
      evidence_to_review: [
        "diseño del proceso",
        "reglas de segmentación y autorización",
      ],
      required_facts: [],
      default_next_node_key: "reinforced-protection",
      provenance: "legal_requirement",
    },
    {
      node_key: "reinforced-protection",
      node_type: "question",
      title: "Protección reforzada",
      prompt:
        "¿Se verificaron los mecanismos destinados al uso lícito y la protección reforzada de la información de NNA?",
      why_it_matters:
        "La protección reforzada es exigible más allá de la autorización inicial.",
      fact_key: "minors04.reinforced_protection",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.reinforced_protection"),
      evidence_to_review: [
        "políticas para niños, niñas y adolescentes",
        "controles",
      ],
      required_facts: [],
      default_next_node_key: "education-obligations",
      provenance: "legal_requirement",
    },
    {
      node_key: "education-obligations",
      node_type: "question",
      title: "Establecimientos y entidades",
      prompt:
        "Cuando intervienen establecimientos educacionales u otras entidades o personas que tratan o administran estos datos: ¿se verificó cómo cumplen su obligación especial de protección?",
      why_it_matters:
        "Estas entidades cargan con una obligación especial de protección.",
      fact_key: "minors04.education_obligations",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.education_obligations"),
      evidence_to_review: ["procedimiento educativo cuando corresponda"],
      required_facts: [],
      default_next_node_key: "analysis-ready",
      provenance: "legal_requirement",
    },
    {
      node_key: "analysis-ready",
      node_type: "question",
      title: "Análisis suficiente",
      prompt:
        "¿Las reglas aplicables están verificadas y documentadas con respaldo suficiente para adoptar la conclusión profesional?",
      why_it_matters:
        "Solo con las reglas verificadas existe base para concluir.",
      fact_key: READY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        READY,
        "Las reglas aplicables, hechos relevantes, alternativas descartadas y conclusión preliminar están documentados.",
      ),
      evidence_to_review: ["análisis profesional"],
      required_facts: [],
      default_next_node_key: "sufficiency-gate",
      provenance: "agency_standard",
    },
    {
      node_key: "sufficiency-gate",
      node_type: "decision",
      title: "Suficiencia del análisis",
      prompt:
        "El sistema verifica candidatura, revisión de datos y análisis suficiente antes de la conclusión.",
      answer_type: "none",
      required_facts: [CANDIDATE, ITEMS, READY],
      transitions: [
        {
          rule_id: "ready-for-conclusion",
          description: "Candidatura vigente, datos revisados y análisis suficiente.",
          when: {
            op: "all",
            conditions: [isYes(CANDIDATE), isYes(ITEMS), isYes(READY)],
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
            "La evaluación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "adopt-conclusion",
      node_type: "question",
      title: "Adopción de la conclusión",
      prompt:
        "¿Cuál conclusión profesional adoptas sobre el régimen de tratamiento de NNA de esta finalidad?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema.",
      fact_key: DRAFT,
      answer_type: "single_select",
      options: [
        {
          value: "minor_processing_supported",
          label: "Régimen cumplido",
          description:
            "Juicio profesional: la finalidad respeta las reglas especiales del art. 16 quáter.",
          fact_effect: { fact_key: DRAFT, value: "minor_processing_supported" },
        },
        {
          value: "minor_processing_not_supported",
          label: "Régimen no cumplido",
          description:
            "Juicio profesional: la finalidad no respeta las reglas con los antecedentes actuales.",
          fact_effect: { fact_key: DRAFT, value: "minor_processing_not_supported" },
        },
      ],
      evidence_to_review: ["Reasoning Record del régimen NNA"],
      help_text: [
        "No uses la falta de información como fundamento de incumplimiento: si faltan antecedentes, la evaluación queda incompleta.",
      ],
      required_facts: [CANDIDATE, ITEMS, READY],
    },
  ],
  outcomes: [
    {
      outcome_key: "minor_processing_supported",
      label: "Régimen cumplido",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la finalidad respeta las reglas especiales de tratamiento de NNA.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "minors.processing_status", value: "supported" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con categorías, autorizaciones, diseño de distinción y conclusión. No archives edades ni identidades reales.",
        },
      ],
    },
    {
      outcome_key: "minor_processing_not_supported",
      label: "Régimen no cumplido",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la finalidad no respeta las reglas con los antecedentes actuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "minors.processing_status", value: "not_supported" },
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
        "Existen antecedentes pendientes o sin información suficiente. Esto no es una conclusión sobre el régimen.",
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
        "Aún no está declarado si la finalidad involucra población NNA. Decláralo antes del análisis jurídico.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar declaración de población",
          note: "Declara si la finalidad involucra población NNA (sí, no o por determinar) antes del análisis.",
        },
      ],
    },
    {
      outcome_key: "regime_not_indicated",
      label: "Régimen no indicado",
      classification: "agency_standard",
      explanation:
        "La finalidad declara no involucrar población NNA. No es una conclusión jurídica ni marca la actividad como no aplicable.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Si la población involucrada cambia, esta revisión puede corresponder en el futuro.",
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
