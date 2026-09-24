import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D5.01.
 *
 * activity_key = sensitive.lawfulness_assess (decision, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, rutas, evidencia, legal basis y state effect
 * del contenido canónico D5.01. Sin scoring ni deducción automática:
 * el sistema verifica candidatura estructural, cobertura de datos
 * vinculados y base analizada; la conclusión la adopta el
 * profesional con ReasoningRecord purpose-scoped válido.
 *
 * Reglas preservadas:
 * - candidate yes habilita el análisis; candidate no deriva a
 *   régimen no indicado; candidate unknown a clasificación
 *   incompleta (routing, sin effects, sin barrera de navegación);
 * - las seis rutas del art. 16 son alternativas, nunca conjuntivas;
 * - consentimiento se consume como contexto (sin completion
 *   dependency a D3);
 * - supported en D5.01 no implica D5.02/D5.03 (solo next actions
 *   condicionales, sin dependencies).
 */

const CANDIDATE = "derived.purpose.d5_sensitive_candidate";
const ITEMS = "sens01.items_reviewed";
const READY = "sens01.analysis_ready";
const ROUTE = "sens01.route_main";
const DRAFT = "sens01.working_conclusion";

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

export const SENSITIVE_LAWFULNESS_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "sensitive.lawfulness_assess.v1",
  activity_key: "sensitive.lawfulness_assess",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada de licitud de datos sensibles",
  description:
    "Estructura el análisis de la vía jurídica del art. 16 para la finalidad activa: verifica la candidatura estructural, revisa los datos vinculados, analiza la ruta de consentimiento o las hipótesis sin consentimiento, y documenta la conclusión profesional.",
  entry_node_key: "structural-gate",
  decision_fact_keys: [CANDIDATE, ITEMS, READY],
  external_fact_keys: [
    CANDIDATE,
    "derived.purpose.d5_health_biological_candidate",
    "derived.purpose.d5_biometric_candidate",
  ],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Candidatura estructural",
      prompt:
        "El sistema verifica si la captura estructural actual identifica esta finalidad como candidata a revisión de datos sensibles.",
      answer_type: "none",
      required_facts: [CANDIDATE],
      transitions: [
        {
          rule_id: "candidate-yes",
          description: "La finalidad es candidata a revisión del régimen sensible.",
          when: isYes(CANDIDATE),
          goto_node_key: "items-review",
          explanation:
            "Al menos un dato vinculado está clasificado como sensible: corresponde el análisis jurídico.",
        },
        {
          rule_id: "candidate-no",
          description: "La captura estructural no identifica el régimen sensible.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "Todos los datos vinculados están clasificados explícitamente como no sensibles.",
        },
        {
          rule_id: "fallback-classification",
          description: "Sin clasificación suficiente no inicia el análisis.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "classification_incomplete",
          explanation:
            "Completa la clasificación estructural de los datos vinculados para saber si esta revisión corresponde.",
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
        "La conclusión debe cubrir el universo actual de datos vinculados, no una muestra parcial.",
      fact_key: ITEMS,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        ITEMS,
        "Los datos vinculados y su clasificación fueron revisados.",
      ),
      evidence_to_review: [
        "mapeo dato-finalidad disponible",
        "descripción de la finalidad",
        "clasificación estructural de los datos",
      ],
      required_facts: [],
      default_next_node_key: "route-select",
      provenance: "agency_standard",
    },
    {
      node_key: "route-select",
      node_type: "question",
      title: "Ruta principal analizada",
      prompt:
        "¿Cuál es la ruta principal del art. 16 analizada para esta finalidad?",
      why_it_matters:
        "Registrar la ruta analizada ordena la evidencia y las alternativas descartadas del razonamiento.",
      fact_key: ROUTE,
      answer_type: "single_select",
      options: [
        {
          value: "express_consent",
          label: "Consentimiento expreso",
          description: "La finalidad se apoya en consentimiento expreso del titular.",
          fact_effect: { fact_key: ROUTE, value: "express_consent" },
        },
        {
          value: "manifestly_public",
          label: "Datos manifiestamente públicos",
          description: "Datos hechos manifiestamente públicos por el titular, tratados para esos fines.",
          fact_effect: { fact_key: ROUTE, value: "manifestly_public" },
        },
        {
          value: "nonprofit",
          label: "Entidad sin fines de lucro",
          description: "Interés legítimo de persona jurídica pública o privada sin fines de lucro con todos los requisitos.",
          fact_effect: { fact_key: ROUTE, value: "nonprofit" },
        },
        {
          value: "vital_integrity",
          label: "Vida, salud o integridad",
          description: "Necesidad indispensable para salvaguardar vida, salud o integridad física o psíquica.",
          fact_effect: { fact_key: ROUTE, value: "vital_integrity" },
        },
        {
          value: "claims_defense",
          label: "Derechos ante tribunal u órgano",
          description: "Necesidad para formulación, ejercicio o defensa de derechos ante tribunal u órgano administrativo.",
          fact_effect: { fact_key: ROUTE, value: "claims_defense" },
        },
        {
          value: "labor_social_security",
          label: "Ámbito laboral o seguridad social",
          description: "Necesidad en ámbito laboral o de seguridad social conforme a la ley.",
          fact_effect: { fact_key: ROUTE, value: "labor_social_security" },
        },
        {
          value: "legal_authorization",
          label: "Autorización o mandato legal",
          description: "Autorización o mandato legal expreso.",
          fact_effect: { fact_key: ROUTE, value: "legal_authorization" },
        },
        {
          value: "none_identified",
          label: "Ninguna identificada",
          description: "Aún no se identifica una vía aplicable.",
          fact_effect: { fact_key: ROUTE, value: "none_identified" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: ROUTE, value: "unknown" },
        },
      ],
      evidence_to_review: ["antecedente justificativo de la vía invocada"],
      required_facts: [],
      default_next_node_key: "consent-check",
      provenance: "legal_requirement",
    },
    {
      node_key: "consent-check",
      node_type: "question",
      title: "Consentimiento expreso",
      prompt:
        "¿Se verificó si la finalidad se apoya en consentimiento expreso respaldado por el mecanismo correspondiente?",
      why_it_matters:
        "El consentimiento expreso es la primera vía a verificar; su mecanismo se revisa sin duplicar D3.",
      fact_key: "sens01.consent_verified",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.consent_verified"),
      evidence_to_review: [
        "documentación de consentimiento cuando sea la vía",
        "mecanismo de consentimiento (contexto D3)",
      ],
      required_facts: [],
      default_next_node_key: "manifestly-public",
      related_activity_keys: ["consent.mechanism_design"],
      provenance: "legal_requirement",
    },
    {
      node_key: "manifestly-public",
      node_type: "question",
      title: "Publicidad manifiesta",
      prompt:
        "¿Se analizó si los datos fueron hechos manifiestamente públicos por el titular y si el tratamiento se relaciona con esos fines?",
      why_it_matters:
        "La publicidad manifiesta solo habilita el tratamiento vinculado a los fines de publicación.",
      fact_key: "sens01.route_public",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_public"),
      evidence_to_review: ["antecedentes de publicidad manifiesta cuando corresponda"],
      required_facts: [],
      default_next_node_key: "nonprofit-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "nonprofit-route",
      node_type: "question",
      title: "Entidad sin fines de lucro",
      prompt:
        "¿Se analizó la hipótesis de interés legítimo de entidad sin fines de lucro con todos sus requisitos legales?",
      why_it_matters:
        "Esta hipótesis solo opera con todos los requisitos concurrentes; ninguno es prescindible.",
      fact_key: "sens01.route_nonprofit",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_nonprofit"),
      evidence_to_review: [
        "estatutos y finalidad de la entidad",
        "reglas de membresía",
      ],
      help_text: [
        "Requisitos acumulativos: finalidad política, filosófica, religiosa, cultural, sindical o gremial; tratamiento solo de miembros o afiliados; vinculación con fines específicos; garantías contra filtración, sustracción o uso no autorizado; sin comunicación ni cesión a terceros.",
      ],
      required_facts: [],
      default_next_node_key: "nonprofit-conditions",
      provenance: "legal_requirement",
    },
    {
      node_key: "nonprofit-conditions",
      node_type: "question",
      title: "Condiciones de la entidad",
      prompt:
        "Si se invoca la ruta de entidad sin fines de lucro: ¿se verificaron finalidad institucional, membresía, vinculación, garantías, no comunicación y anonimización o supresión al dejar la organización?",
      why_it_matters:
        "Cada condición es exigible; la salida de miembros exige anonimización o supresión.",
      fact_key: "sens01.nonprofit_conditions",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.nonprofit_conditions"),
      evidence_to_review: [
        "controles de seguridad y confidencialidad",
        "evidencia sobre comunicaciones a terceros",
        "mecanismo de anonimización o supresión al egresar",
      ],
      required_facts: [],
      default_next_node_key: "vital-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "vital-route",
      node_type: "question",
      title: "Vida, salud o integridad",
      prompt:
        "¿Se analizó la necesidad indispensable para salvaguardar vida, salud o integridad física o psíquica?",
      why_it_matters:
        "Solo la necesidad indispensable habilita esta vía, no cualquier conveniencia sanitaria.",
      fact_key: "sens01.route_vital",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_vital"),
      evidence_to_review: ["antecedentes vitales cuando corresponda"],
      required_facts: [],
      default_next_node_key: "vital-later-info",
      provenance: "legal_requirement",
    },
    {
      node_key: "vital-later-info",
      node_type: "question",
      title: "Información posterior",
      prompt:
        "Si el titular estaba impedido de consentir: ¿se verificó la obligación de informar posteriormente una vez que cese el impedimento?",
      why_it_matters:
        "El impedimento no elimina el deber de informar; solo lo difiere.",
      fact_key: "sens01.vital_later_info",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.vital_later_info"),
      evidence_to_review: ["mecanismo de información posterior"],
      required_facts: [],
      default_next_node_key: "claims-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "claims-route",
      node_type: "question",
      title: "Derechos ante tribunal u órgano",
      prompt:
        "¿Se analizó la necesidad para formulación, ejercicio o defensa de derechos ante tribunal u órgano administrativo?",
      why_it_matters:
        "La vía exige necesidad vinculada a un procedimiento o defensa concreta.",
      fact_key: "sens01.route_claims",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_claims"),
      evidence_to_review: ["antecedentes judiciales o administrativos cuando corresponda"],
      required_facts: [],
      default_next_node_key: "labor-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "labor-route",
      node_type: "question",
      title: "Ámbito laboral o seguridad social",
      prompt:
        "¿Se analizó la necesidad en ámbito laboral o de seguridad social para ejercicio de derechos o cumplimiento de obligaciones conforme a la ley?",
      why_it_matters:
        "La vía exige encaje en derechos u obligaciones previstos por la ley.",
      fact_key: "sens01.route_labor",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_labor"),
      evidence_to_review: ["antecedentes laborales cuando corresponda"],
      required_facts: [],
      default_next_node_key: "legal-auth-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "legal-auth-route",
      node_type: "question",
      title: "Autorización o mandato legal",
      prompt:
        "¿Se analizó si existe autorización o mandato legal expreso que habilite el tratamiento?",
      why_it_matters:
        "Sin norma expresa identificada esta vía no puede invocarse.",
      fact_key: "sens01.route_legal_auth",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_legal_auth"),
      evidence_to_review: ["norma legal invocada"],
      required_facts: [],
      default_next_node_key: "analysis-ready",
      provenance: "legal_requirement",
    },
    {
      node_key: "analysis-ready",
      node_type: "question",
      title: "Análisis suficiente",
      prompt:
        "¿La ruta principal está verificada y documentada con respaldo suficiente para adoptar la conclusión profesional?",
      why_it_matters:
        "Solo con la vía analizada y documentada existe base para concluir; la mera sensibilidad del dato no determina la vía.",
      fact_key: READY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        READY,
        "La vía analizada, hechos relevantes, alternativas descartadas y conclusión preliminar están documentados.",
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
        "¿Cuál conclusión profesional adoptas sobre la vía jurídica del tratamiento de datos sensibles de esta finalidad?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: el sistema solo verificó candidatura, cobertura de datos y análisis suficiente.",
      fact_key: DRAFT,
      answer_type: "single_select",
      options: [
        {
          value: "lawful_path_supported",
          label: "Vía jurídica soportada",
          description:
            "Juicio profesional: la finalidad cuenta con una vía válida del art. 16 bajo las condiciones documentadas.",
          fact_effect: { fact_key: DRAFT, value: "lawful_path_supported" },
        },
        {
          value: "lawful_path_not_supported",
          label: "Vía no soportada",
          description:
            "Juicio profesional: no existe vía soportada con los antecedentes actuales.",
          fact_effect: { fact_key: DRAFT, value: "lawful_path_not_supported" },
        },
      ],
      evidence_to_review: ["Reasoning Record de licitud de datos sensibles"],
      help_text: [
        "No uses la falta de información como fundamento de vía no soportada: si faltan antecedentes, la evaluación queda incompleta.",
        "Si además corresponde, deriva a los regímenes especializados D5.02–D5.05 desde las siguientes acciones.",
      ],
      required_facts: [CANDIDATE, ITEMS, READY],
    },
  ],
  outcomes: [
    {
      outcome_key: "lawful_path_supported",
      label: "Vía jurídica soportada",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la finalidad cuenta con una vía válida del art. 16. Esto no afirma nada sobre los regímenes especializados D5.02–D5.05.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "sensitive.lawfulness_status", value: "supported" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Evaluar el régimen de salud y perfil biológico si corresponde",
          activity_key: "sensitive.health_biological_assess",
          show_when: {
            op: "fact_equals",
            fact_key: "derived.purpose.d5_health_biological_candidate",
            value: "yes",
          },
        },
        {
          kind: "activity",
          label: "Evaluar el tratamiento biométrico si corresponde",
          activity_key: "sensitive.biometric_assess",
          show_when: {
            op: "fact_equals",
            fact_key: "derived.purpose.d5_biometric_candidate",
            value: "yes",
          },
        },
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con la vía analizada, hechos relevantes, alternativas descartadas y conclusión.",
        },
      ],
    },
    {
      outcome_key: "lawful_path_not_supported",
      label: "Vía no soportada",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: con los antecedentes actuales no existe vía del art. 16 que sostenga la finalidad.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "sensitive.lawfulness_status", value: "not_supported" },
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
        "Existen antecedentes pendientes o sin información suficiente. Esto no es una conclusión sobre la vía jurídica.",
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
        "La captura estructural aún no permite saber si esta revisión corresponde. Completa la clasificación de los datos vinculados.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar clasificación estructural",
          note: "Clasifica los datos vinculados a la finalidad (sensible: sí, no o por determinar) antes de analizar la vía jurídica.",
        },
      ],
    },
    {
      outcome_key: "regime_not_indicated",
      label: "Régimen no indicado",
      classification: "agency_standard",
      explanation:
        "La captura estructural actual no identifica el régimen de datos sensibles para esta finalidad. No es una conclusión jurídica ni marca la actividad como no aplicable.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Si la captura estructural cambia, esta revisión puede corresponder en el futuro.",
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
