import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D5.05.
 *
 * activity_key = research.public_interest_assess (decision, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente condiciones, evidencia y state effect del contenido
 * canónico D5.05. Exclusividad de finalidad e interés público son
 * juicio profesional verificado por attestación, nunca deducción:
 * la señal contextual no prueba ninguno.
 *
 * Reglas preservadas:
 * - sin dependency a D8: riesgos/mitigación se evalúan aquí sin
 *   afirmar reemplazo de EIPD;
 * - rama de riesgo solo exigible con sensibles vinculados;
 * - publicación con anonimización previa; sin publication entity;
 * - la regla de conservación especial es contexto para D2, sin
 *   sobrescribir retention ni facts (sin escrituras cross-scope).
 */

const CANDIDATE = "derived.purpose.d5_research_candidate";
const ITEMS = "res05.items_reviewed";
const EXCLUSIVITY = "res05.exclusivity_verified";
const PUBLIC_INTEREST = "res05.public_interest_verified";
const READY = "res05.analysis_ready";
const ROUTE = "res05.purpose_nature";
const DRAFT = "res05.working_conclusion";

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function consideredOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Analizada con respaldo",
      description: "La condición fue analizada con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No analizada",
      description: "La condición aún no ha sido analizada.",
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

export const RESEARCH_PUBLIC_INTEREST_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "research.public_interest_assess.v1",
  activity_key: "research.public_interest_assess",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada del régimen de investigación de interés público",
  description:
    "Estructura el análisis del art. 16 quinquies para la finalidad activa: naturaleza y exclusividad de la finalidad, interés público, calidad y seguridad, riesgos con sensibles, conservación y anonimización de publicaciones.",
  entry_node_key: "structural-gate",
  decision_fact_keys: [CANDIDATE, ITEMS, EXCLUSIVITY, PUBLIC_INTEREST, READY],
  external_fact_keys: [CANDIDATE],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Candidatura estructural",
      prompt:
        "El sistema verifica si la finalidad declara contexto histórico, estadístico, científico o de investigación.",
      answer_type: "none",
      required_facts: [CANDIDATE],
      transitions: [
        {
          rule_id: "candidate-yes",
          description: "La finalidad declara contexto de investigación.",
          when: isYes(CANDIDATE),
          goto_node_key: "items-review",
          explanation:
            "La finalidad pretende operar bajo contexto de investigación: corresponde el análisis del art. 16 quinquies.",
        },
        {
          rule_id: "candidate-no",
          description: "La finalidad declara otro contexto.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "Sin contexto de investigación declarado esta revisión no está indicada.",
        },
        {
          rule_id: "fallback-classification",
          description: "Sin declaración no inicia el análisis.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "classification_incomplete",
          explanation:
            "Declara el contexto de la finalidad antes del análisis jurídico.",
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
        "La obligación de riesgos y mitigación depende de si intervienen datos sensibles.",
      fact_key: ITEMS,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        ITEMS,
        "Los datos vinculados y su clasificación fueron revisados.",
      ),
      evidence_to_review: [
        "descripción de finalidad",
        "mapeo de datos",
      ],
      required_facts: [],
      default_next_node_key: "purpose-nature",
      provenance: "agency_standard",
    },
    {
      node_key: "purpose-nature",
      node_type: "question",
      title: "Naturaleza de la finalidad",
      prompt: "¿Cuál es la naturaleza principal de la finalidad evaluada?",
      why_it_matters:
        "El régimen especial exige encaje en fines históricos, estadísticos, científicos o de estudio e investigación.",
      fact_key: ROUTE,
      answer_type: "single_select",
      options: [
        {
          value: "historic",
          label: "Fines históricos",
          description: "La finalidad es predominantemente histórica.",
          fact_effect: { fact_key: ROUTE, value: "historic" },
        },
        {
          value: "statistical",
          label: "Fines estadísticos",
          description: "La finalidad es predominantemente estadística.",
          fact_effect: { fact_key: ROUTE, value: "statistical" },
        },
        {
          value: "scientific",
          label: "Fines científicos",
          description: "La finalidad es predominantemente científica.",
          fact_effect: { fact_key: ROUTE, value: "scientific" },
        },
        {
          value: "study_research",
          label: "Estudio o investigación",
          description: "La finalidad es un estudio o investigación.",
          fact_effect: { fact_key: ROUTE, value: "study_research" },
        },
        {
          value: "mixed",
          label: "Naturaleza mixta",
          description: "Combina varias naturalezas; documenta cada una en el razonamiento.",
          fact_effect: { fact_key: ROUTE, value: "mixed" },
        },
        {
          value: "none_identified",
          label: "Ninguna identificada",
          description: "No encaja en las naturalezas del régimen especial.",
          fact_effect: { fact_key: ROUTE, value: "none_identified" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: ROUTE, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "protocolo o proyecto de investigación",
        "descripción de finalidad",
      ],
      required_facts: [],
      default_next_node_key: "exclusivity-check",
      provenance: "legal_requirement",
    },
    {
      node_key: "exclusivity-check",
      node_type: "question",
      title: "Exclusividad de finalidad",
      prompt:
        "¿Se verificó que el tratamiento se realiza exclusivamente con alguno de esos fines (y que una finalidad mixta no se presenta como régimen especial)?",
      why_it_matters:
        "Sin exclusividad no hay régimen del art. 16 quinquies, por más que exista un componente de investigación.",
      fact_key: EXCLUSIVITY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        EXCLUSIVITY,
        "La exclusividad de la finalidad especial fue verificada.",
      ),
      evidence_to_review: [
        "descripción de finalidad",
        "mapeo de datos",
      ],
      required_facts: [],
      default_next_node_key: "public-interest-check",
      provenance: "legal_requirement",
    },
    {
      node_key: "public-interest-check",
      node_type: "question",
      title: "Interés público",
      prompt:
        "¿Se verificó que el tratamiento atiende fines de interés público, documentando el interés legítimo reconocido por el art. 16 quinquies?",
      why_it_matters:
        "El interés público es condición del régimen y requiere análisis profesional documentado.",
      fact_key: PUBLIC_INTEREST,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        PUBLIC_INTEREST,
        "El interés público fue verificado y documentado.",
      ),
      evidence_to_review: ["justificación de interés público"],
      required_facts: [],
      default_next_node_key: "quality-measures",
      provenance: "legal_requirement",
    },
    {
      node_key: "quality-measures",
      node_type: "question",
      title: "Medidas de calidad",
      prompt: "¿Se verificaron las medidas de calidad necesarias del tratamiento?",
      why_it_matters:
        "La calidad es condición del régimen especial.",
      fact_key: "res05.quality_measures",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.quality_measures"),
      evidence_to_review: ["medidas de calidad"],
      required_facts: [],
      default_next_node_key: "security-measures",
      provenance: "legal_requirement",
    },
    {
      node_key: "security-measures",
      node_type: "question",
      title: "Medidas de seguridad",
      prompt: "¿Se verificaron las medidas de seguridad necesarias del tratamiento?",
      why_it_matters:
        "La seguridad es condición del régimen especial.",
      fact_key: "res05.security_measures",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.security_measures"),
      evidence_to_review: ["medidas de seguridad"],
      required_facts: [],
      default_next_node_key: "exclusive-use",
      provenance: "legal_requirement",
    },
    {
      node_key: "exclusive-use",
      node_type: "question",
      title: "Resguardo del uso exclusivo",
      prompt:
        "¿Se comprobó que las medidas resguardan el uso exclusivo para la finalidad especial?",
      why_it_matters:
        "Sin resguardo del uso exclusivo las medidas no sostienen el régimen.",
      fact_key: "res05.exclusive_use",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.exclusive_use"),
      evidence_to_review: ["medidas de calidad", "medidas de seguridad"],
      required_facts: [],
      default_next_node_key: "storage-regime",
      provenance: "legal_requirement",
    },
    {
      node_key: "storage-regime",
      node_type: "question",
      title: "Conservación bajo el régimen",
      prompt:
        "¿Se documentó que el almacenamiento o utilización por período indeterminado solo se considera bajo las condiciones del art. 16 quinquies?",
      why_it_matters:
        "La conservación extendida solo se sostiene dentro del régimen.",
      fact_key: "res05.storage_regime",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.storage_regime"),
      evidence_to_review: ["diseño de conservación"],
      help_text: [
        "Esta regla puede ser contexto para la conservación D2; no sobrescribe reglas de conservación ni facts canónicos de D2.",
      ],
      required_facts: [],
      default_next_node_key: "risk-assessment",
      provenance: "legal_requirement",
    },
    {
      node_key: "risk-assessment",
      node_type: "question",
      title: "Riesgos con sensibles",
      prompt:
        "Si intervienen datos sensibles: ¿se identificaron los riesgos posibles del tratamiento?",
      why_it_matters:
        "Con sensibles, la identificación de riesgos es exigible dentro de este régimen (sin reemplazar una futura EIPD).",
      fact_key: "res05.risk_assessed",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.risk_assessed"),
      evidence_to_review: ["evaluación de riesgos cuando existan sensibles"],
      required_facts: [],
      default_next_node_key: "mitigation-measures",
      provenance: "legal_requirement",
    },
    {
      node_key: "mitigation-measures",
      node_type: "question",
      title: "Mitigación de riesgos",
      prompt:
        "Si intervienen datos sensibles: ¿se verificaron medidas de reducción o mitigación de los riesgos identificados?",
      why_it_matters:
        "Sin mitigación verificada la rama de riesgo bloquea la conclusión favorable.",
      fact_key: "res05.mitigation_sufficient",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.mitigation_sufficient"),
      evidence_to_review: ["medidas de mitigación"],
      required_facts: [],
      default_next_node_key: "publishes-results",
      provenance: "legal_requirement",
    },
    {
      node_key: "publishes-results",
      node_type: "question",
      title: "Publicación de resultados",
      prompt: "¿Se publican o difunden resultados o análisis del tratamiento?",
      why_it_matters:
        "Solo si hay publicación aplica la exigencia de anonimización previa.",
      fact_key: "res05.publishes_results",
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        "res05.publishes_results",
        "Se determinó si existen publicaciones o difusión de resultados.",
      ),
      evidence_to_review: ["proceso de publicación"],
      required_facts: [],
      default_next_node_key: "publication-anonymized",
      provenance: "agency_standard",
    },
    {
      node_key: "publication-anonymized",
      node_type: "question",
      title: "Anonimización previa",
      prompt:
        "Si se publican resultados: ¿se verificó la anonimización previa de los datos publicados?",
      why_it_matters:
        "Sin anonimización previa la publicación invalida la vía especial.",
      fact_key: "res05.publication_anonymized",
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        "res05.publication_anonymized",
        "Se verificó la anonimización previa de lo publicado.",
      ),
      evidence_to_review: ["diseño de anonimización"],
      required_facts: [],
      default_next_node_key: "analysis-ready",
      provenance: "legal_requirement",
    },
    {
      node_key: "analysis-ready",
      node_type: "question",
      title: "Análisis suficiente",
      prompt:
        "¿La aplicabilidad y condiciones del régimen están verificadas y documentadas con respaldo suficiente para concluir?",
      why_it_matters:
        "Solo con el régimen analizado existe base para concluir.",
      fact_key: READY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        READY,
        "Aplicabilidad, condiciones, riesgos y publicaciones están documentados.",
      ),
      evidence_to_review: ["Reasoning Record del régimen de investigación"],
      required_facts: [],
      default_next_node_key: "sufficiency-gate",
      provenance: "agency_standard",
    },
    {
      node_key: "sufficiency-gate",
      node_type: "decision",
      title: "Suficiencia del análisis",
      prompt:
        "El sistema verifica candidatura, revisión de datos, exclusividad, interés público y análisis suficiente.",
      answer_type: "none",
      required_facts: [CANDIDATE, ITEMS, EXCLUSIVITY, PUBLIC_INTEREST, READY],
      transitions: [
        {
          rule_id: "ready-for-conclusion",
          description: "Base analizada suficiente para concluir.",
          when: {
            op: "all",
            conditions: [
              isYes(CANDIDATE),
              isYes(ITEMS),
              isYes(EXCLUSIVITY),
              isYes(PUBLIC_INTEREST),
              isYes(READY),
            ],
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
        "¿Cuál conclusión profesional adoptas sobre el régimen del art. 16 quinquies de esta finalidad?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema.",
      fact_key: DRAFT,
      answer_type: "single_select",
      options: [
        {
          value: "special_regime_supported",
          label: "Régimen aplicable cumplido",
          description:
            "Juicio profesional: la finalidad puede acogerse al régimen especial cumpliendo sus condiciones.",
          fact_effect: { fact_key: DRAFT, value: "special_regime_supported" },
        },
        {
          value: "special_regime_not_supported",
          label: "Régimen no aplicable o incumplido",
          description:
            "Juicio profesional: la finalidad no satisface aplicabilidad o condiciones con los antecedentes actuales.",
          fact_effect: { fact_key: DRAFT, value: "special_regime_not_supported" },
        },
      ],
      evidence_to_review: ["Reasoning Record del régimen de investigación"],
      help_text: [
        "Documenta exclusividad, interés público, alternativas y riesgo cuando corresponda.",
      ],
      required_facts: [CANDIDATE, ITEMS, EXCLUSIVITY, PUBLIC_INTEREST, READY],
    },
  ],
  outcomes: [
    {
      outcome_key: "special_regime_supported",
      label: "Régimen aplicable cumplido",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la finalidad satisface aplicabilidad y condiciones del art. 16 quinquies.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "research.public_interest_status", value: "supported" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con naturaleza, exclusividad, interés público, medidas, riesgos y diseño de anonimización.",
        },
      ],
    },
    {
      outcome_key: "special_regime_not_supported",
      label: "Régimen no aplicable o incumplido",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la finalidad no satisface aplicabilidad o condiciones con los antecedentes actuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "research.public_interest_status", value: "not_supported" },
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
        "Aún no está declarado el contexto de la finalidad. Decláralo antes del análisis jurídico.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar declaración de contexto",
          note: "Declara el contexto histórico, estadístico, científico o de investigación (sí, no o por determinar) antes del análisis.",
        },
      ],
    },
    {
      outcome_key: "regime_not_indicated",
      label: "Régimen no indicado",
      classification: "agency_standard",
      explanation:
        "La finalidad declara otro contexto. No es una conclusión jurídica ni marca la actividad como no aplicable.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Si el contexto de la finalidad cambia, esta revisión puede corresponder en el futuro.",
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
