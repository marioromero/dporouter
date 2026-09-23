import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo piloto de ejecución guiada.
 *
 * activity_key = dpo.need_assessment (D1.02).
 * Contenido canónico aprobado por la iteración vigente; no inventar,
 * completar ni reinterpretar. La UI lo consume de forma genérica y nunca
 * duplica sus preguntas.
 *
 * Distinción obligatoria preservada en todo el protocolo:
 * - obligación derivada del MPI (consecuencia del estado MPI);
 * - recomendación profesional de la agencia (estándar metodológico).
 * Nunca se mezclan.
 *
 * Auditoría de materialización (reconciliación D1): el state_effect
 * `dpo.recommendation_outcome` es un valor singular autónomo
 * (divisible: la prohibición de activar obligación por recomendación
 * ya se honra vía clasificación), pero sus outcomes deterministas no
 * tienen vía de materialización compatible con contratos actuales — la
 * finalización explícita genérica cubre solo procedure/checklist y su
 * extensión a decision excede lo autorizado. Sin efectos declarados:
 * execution-ready, product-ready=false (gap estructural: vía de
 * materialización para outcomes deterministas de decision).
 */

/** Hechos de recomendación profesional que deben estar resueltos. */
const DECISION_FACTS = [
  "dpo_assessment.high_impact_data",
  "dpo_assessment.large_scale",
  "dpo_assessment.automated_significant_effects",
  "dpo_assessment.systematic_public_monitoring",
  "dpo_assessment.international_transfers",
  "dpo_assessment.processor_complexity",
  "dpo_assessment.low_maturity",
];

/** Factores de soporte contables para recommended / not_priority. */
const SUPPORT_FACTS = [
  "dpo_assessment.high_impact_data",
  "dpo_assessment.large_scale",
  "dpo_assessment.international_transfers",
  "dpo_assessment.processor_complexity",
  "dpo_assessment.low_maturity",
];

/** Subconjunto para la regla F (low_maturity + dos factores). */
const RULE_F_FACTS = [
  "dpo_assessment.high_impact_data",
  "dpo_assessment.large_scale",
  "dpo_assessment.international_transfers",
  "dpo_assessment.processor_complexity",
];

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function countYes(facts: string[], at_least: number): FactCondition {
  return { op: "count_true", facts, equals: "yes", at_least };
}

export const DPO_NEED_ASSESSMENT_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.need_assessment.v1",
  activity_key: "dpo.need_assessment",
  version: 1,
  mode: "decision",
  title: "Evaluación guiada de necesidad y recomendación de DPO",
  description:
    "Determina si existe obligación de contar con DPO derivada del estado del MPI y, cuando no existe obligación, establece el nivel de recomendación profesional aplicable según metodología de la agencia.",
  entry_node_key: "mpi-status",
  decision_fact_keys: DECISION_FACTS,
  last_review: "2026-09-22",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "mpi-status",
      node_type: "question",
      title: "Estado actual del MPI",
      prompt: "¿Cuál es el estado actual del Modelo de Prevención de Infracciones?",
      why_it_matters:
        "Un MPI formalmente adoptado o en implementación activa el requerimiento de contar con DPO como componente del programa. Esta comprobación se realiza antes de cualquier recomendación profesional.",
      fact_key: "mpi.lifecycle_status",
      answer_type: "single_select",
      options: [
        {
          value: "not_assessed",
          label: "No evaluado",
          description: "Aún no se ha evaluado la conveniencia de adoptar un MPI.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "not_assessed" },
        },
        {
          value: "not_adopted",
          label: "No adoptado",
          description: "Se evaluó y se decidió no adoptar un MPI.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "not_adopted" },
        },
        {
          value: "under_evaluation",
          label: "En evaluación",
          description: "La conveniencia de adoptar un MPI está en estudio.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "under_evaluation" },
        },
        {
          value: "adoption_formalized",
          label: "Adopción formalizada",
          description: "Existe acuerdo, acta o evidencia de adopción formal.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "adoption_formalized" },
        },
        {
          value: "implementing",
          label: "En implementación",
          description: "El programa MPI está en proceso de implementación.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "implementing" },
        },
        {
          value: "implemented",
          label: "Implementado",
          description: "El programa MPI se encuentra implementado y operativo.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "implemented" },
        },
        {
          value: "discontinued",
          label: "Discontinuado",
          description: "El MPI fue terminado y ya no se encuentra vigente.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "discontinued" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinar el estado con respaldo disponible.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "acuerdo, acta o evidencia de adopción",
        "registro interno del lifecycle MPI",
        "programa MPI existente",
        "evidencia de implementación",
      ],
      required_facts: [],
      default_next_node_key: "high-impact-data",
      transitions: [
        {
          rule_id: "mpi-active",
          description: "MPI formalmente adoptado, en implementación o implementado.",
          when: {
            op: "fact_in",
            fact_key: "mpi.lifecycle_status",
            values: ["adoption_formalized", "implementing", "implemented"],
          },
          goto_outcome_key: "required_by_mpi",
          explanation:
            "El MPI se encuentra formalmente adoptado, en implementación o implementado. El DPO debe formar parte del programa.",
        },
        {
          rule_id: "mpi-unknown",
          description: "Estado MPI desconocido impide concluir.",
          when: {
            op: "fact_equals",
            fact_key: "mpi.lifecycle_status",
            value: "unknown",
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "El estado del MPI es desconocido. Sin este antecedente no es posible determinar obligación ni recomendación.",
        },
      ],
      related_activity_keys: ["mpi.lifecycle_review"],
      provenance: "agency_standard",
    },
    {
      node_key: "high-impact-data",
      node_type: "question",
      title: "Datos de impacto especial",
      prompt:
        "¿La organización trata datos de impacto especial en al menos uno de sus tratamientos como responsable?",
      why_it_matters:
        "El tratamiento de categorías de mayor impacto eleva la recomendación profesional de contar con DPO como criterio metodológico.",
      fact_key: "dpo_assessment.high_impact_data",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe al menos una de las categorías indicadas.",
          fact_effect: { fact_key: "dpo_assessment.high_impact_data", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "Ninguna de las categorías indicadas está presente.",
          fact_effect: { fact_key: "dpo_assessment.high_impact_data", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo_assessment.high_impact_data", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "inventario de tratamientos",
        "categorías de datos",
        "formularios",
        "sistemas",
        "contratos o procesos relevantes",
      ],
      help_text: [
        "Considera como factor positivo si existe al menos una de estas categorías: datos sensibles; datos de salud; perfil biológico; datos biométricos; datos de menores de 14 años; datos económicos, financieros, bancarios o comerciales comprendidos en el Título III.",
        "Este factor no convierte por sí solo al DPO en obligatorio. Se utiliza como criterio metodológico de recomendación.",
      ],
      required_facts: [],
      default_next_node_key: "large-scale",
      provenance: "agency_standard",
    },
    {
      node_key: "large-scale",
      node_type: "question",
      title: "Escala del tratamiento",
      prompt: "¿Existe tratamiento masivo o a gran escala?",
      why_it_matters:
        "La escala del tratamiento es un criterio metodológico central de la recomendación profesional.",
      fact_key: "dpo_assessment.large_scale",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe tratamiento masivo o a gran escala documentado.",
          fact_effect: { fact_key: "dpo_assessment.large_scale", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "No existe tratamiento masivo o a gran escala.",
          fact_effect: { fact_key: "dpo_assessment.large_scale", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "La escala no puede determinarse con respaldo.",
          fact_effect: { fact_key: "dpo_assessment.large_scale", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "número aproximado de titulares",
        "volumen de datos",
        "duración",
        "extensión geográfica",
        "continuidad del tratamiento",
        "clasificación de escala documentada",
      ],
      help_text: [
        "No existe en esta metodología un umbral legal numérico inventado. Utiliza la clasificación ya documentada cuando exista. Si la escala no puede determinarse con respaldo, responde Desconocido.",
      ],
      required_facts: [],
      default_next_node_key: "automated-significant-effects",
      provenance: "agency_standard",
    },
    {
      node_key: "automated-significant-effects",
      node_type: "question",
      title: "Automatización con efectos significativos",
      prompt:
        "¿Existe evaluación sistemática o perfilamiento automatizado que produzca efectos jurídicos o afecte significativamente al titular?",
      why_it_matters:
        "La automatización con efectos significativos activa por sí sola la recomendación fuerte según metodología de la agencia.",
      fact_key: "dpo_assessment.automated_significant_effects",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe evaluación sistemática o perfilamiento con efectos significativos.",
          fact_effect: {
            fact_key: "dpo_assessment.automated_significant_effects",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "No",
          description: "No existe tal automatización.",
          fact_effect: {
            fact_key: "dpo_assessment.automated_significant_effects",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo_assessment.automated_significant_effects",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "scoring",
        "perfiles",
        "decisiones automatizadas",
        "elegibilidad",
        "rechazo automático",
        "decisiones laborales",
        "acceso a productos o servicios",
      ],
      required_facts: [],
      default_next_node_key: "systematic-public-monitoring",
      provenance: "agency_standard",
    },
    {
      node_key: "systematic-public-monitoring",
      node_type: "question",
      title: "Monitoreo sistemático de zonas públicas",
      prompt: "¿La organización realiza monitoreo sistemático de zonas de acceso público?",
      why_it_matters:
        "El monitoreo sistemático de zonas públicas activa por sí solo la recomendación fuerte según metodología de la agencia.",
      fact_key: "dpo_assessment.systematic_public_monitoring",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe monitoreo sistemático de zonas de acceso público.",
          fact_effect: {
            fact_key: "dpo_assessment.systematic_public_monitoring",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "No",
          description: "No existe tal monitoreo.",
          fact_effect: {
            fact_key: "dpo_assessment.systematic_public_monitoring",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo_assessment.systematic_public_monitoring",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "videovigilancia",
        "seguimiento sistemático",
        "analítica asociada",
        "tecnologías equivalentes",
      ],
      required_facts: [],
      default_next_node_key: "international-transfers",
      provenance: "agency_standard",
    },
    {
      node_key: "international-transfers",
      node_type: "question",
      title: "Transferencias internacionales",
      prompt: "¿Existen transferencias internacionales activas de datos personales?",
      why_it_matters:
        "Las transferencias internacionales combinadas con escala u otros factores elevan la recomendación profesional.",
      fact_key: "dpo_assessment.international_transfers",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existen transferencias internacionales activas.",
          fact_effect: {
            fact_key: "dpo_assessment.international_transfers",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "No",
          description: "No existen transferencias internacionales activas.",
          fact_effect: {
            fact_key: "dpo_assessment.international_transfers",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo_assessment.international_transfers",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "proveedores cloud",
        "matrices o filiales",
        "plataformas",
        "encargados extranjeros",
        "almacenamiento o acceso desde otro país",
      ],
      required_facts: [],
      default_next_node_key: "processor-complexity",
      provenance: "agency_standard",
    },
    {
      node_key: "processor-complexity",
      node_type: "question",
      title: "Complejidad de encargados",
      prompt: "¿Existe una estructura de encargados que requiera supervisión recurrente?",
      why_it_matters:
        "La complejidad de encargados combinada con escala eleva la recomendación profesional como criterio metodológico.",
      fact_key: "dpo_assessment.processor_complexity",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Se cumple el criterio metodológico de complejidad.",
          fact_effect: {
            fact_key: "dpo_assessment.processor_complexity",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "No",
          description: "No se cumple el criterio metodológico de complejidad.",
          fact_effect: {
            fact_key: "dpo_assessment.processor_complexity",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo_assessment.processor_complexity",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "inventario de encargados",
        "contratos",
        "subencargados",
        "diagramas de flujo",
      ],
      help_text: [
        "Para esta metodología de agencia responde Sí cuando ocurra cualquiera: existen dos o más encargados activos relevantes; o existe al menos una cadena de subencargamiento.",
        "Este criterio cuantitativo es un estándar metodológico interno y no un umbral legal.",
      ],
      required_facts: [],
      default_next_node_key: "privacy-maturity",
      provenance: "agency_standard",
    },
    {
      node_key: "privacy-maturity",
      node_type: "question",
      title: "Madurez operacional",
      prompt: "¿La organización presenta baja madurez operacional en protección de datos?",
      why_it_matters:
        "La baja madurez combinada con otros factores eleva la recomendación profesional como criterio metodológico.",
      fact_key: "dpo_assessment.low_maturity",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Se cumple el criterio 3 de 7 de baja madurez.",
          fact_effect: { fact_key: "dpo_assessment.low_maturity", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "No se cumple el criterio de baja madurez.",
          fact_effect: { fact_key: "dpo_assessment.low_maturity", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo_assessment.low_maturity", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "inventario",
        "política",
        "atención de derechos",
        "contratos con encargados",
        "gestión de incidentes",
        "capacitación",
        "EIPD",
      ],
      help_text: [
        "Para este protocolo se considera baja madurez cuando al menos 3 de estas 7 áreas están inexistente o informal: inventario; política; atención de derechos; contratos con encargados; gestión de incidentes; capacitación; EIPD.",
        "La regla 3 de 7 es un estándar metodológico de la agencia y no una clasificación establecida por la ley.",
      ],
      required_facts: [],
      default_next_node_key: "final-decision",
      provenance: "agency_standard",
    },
    {
      node_key: "final-decision",
      node_type: "decision",
      title: "Determinación del resultado",
      prompt: "El sistema aplica las reglas determinísticas sobre los hechos resueltos.",
      answer_type: "none",
      // Requisitos semánticos explícitos: estado MPI + 7 factores.
      // El orden del array no define dependencias.
      required_facts: ["mpi.lifecycle_status", ...DECISION_FACTS],
      transitions: [
        {
          rule_id: "incomplete",
          description: "Al menos un antecedente obligatorio está desconocido o sin responder.",
          when: { op: "any", conditions: DECISION_FACTS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan antecedentes obligatorios por resolver. Con hechos desconocidos no se emite recomendación profesional definitiva.",
        },
        {
          rule_id: "strong-A",
          description:
            "Datos de impacto especial y tratamiento a gran escala (Regla A).",
          when: {
            op: "all",
            conditions: [
              isYes("dpo_assessment.high_impact_data"),
              isYes("dpo_assessment.large_scale"),
            ],
          },
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla A activada: la organización trata datos de impacto especial a gran escala.",
        },
        {
          rule_id: "strong-B",
          description:
            "Evaluación sistemática o perfilamiento automatizado con efectos significativos (Regla B).",
          when: isYes("dpo_assessment.automated_significant_effects"),
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla B activada: existe evaluación sistemática o perfilamiento automatizado que produce efectos jurídicos o afecta significativamente al titular.",
        },
        {
          rule_id: "strong-C",
          description: "Monitoreo sistemático de zonas de acceso público (Regla C).",
          when: isYes("dpo_assessment.systematic_public_monitoring"),
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla C activada: la organización realiza monitoreo sistemático de zonas de acceso público.",
        },
        {
          rule_id: "strong-D",
          description: "Gran escala con transferencias internacionales (Regla D).",
          when: {
            op: "all",
            conditions: [
              isYes("dpo_assessment.large_scale"),
              isYes("dpo_assessment.international_transfers"),
            ],
          },
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla D activada: existe tratamiento a gran escala junto con transferencias internacionales activas.",
        },
        {
          rule_id: "strong-E",
          description: "Gran escala con complejidad de encargados (Regla E).",
          when: {
            op: "all",
            conditions: [
              isYes("dpo_assessment.large_scale"),
              isYes("dpo_assessment.processor_complexity"),
            ],
          },
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla E activada: existe tratamiento a gran escala junto con una estructura de encargados que requiere supervisión recurrente.",
        },
        {
          rule_id: "strong-F",
          description:
            "Baja madurez con al menos dos factores adicionales (Regla F).",
          when: {
            op: "all",
            conditions: [
              isYes("dpo_assessment.low_maturity"),
              countYes(RULE_F_FACTS, 2),
            ],
          },
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla F activada: la organización presenta baja madurez y al menos dos factores positivos entre datos de impacto especial, gran escala, transferencias internacionales y complejidad de encargados.",
        },
        {
          rule_id: "recommended-two",
          description: "Al menos dos factores de soporte positivos sin regla fuerte.",
          when: countYes(SUPPORT_FACTS, 2),
          goto_outcome_key: "recommended",
          explanation:
            "Ninguna regla fuerte se cumple, pero existen al menos dos factores de soporte positivos.",
        },
        {
          rule_id: "fallback-not-priority",
          description:
            "Cero o un factor de soporte positivo y ninguna regla fuerte.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "not_priority",
          explanation:
            "Ninguna regla de recomendación fuerte se cumple y los factores documentados no alcanzan los criterios internos de recomendación prioritaria.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "required_by_mpi",
      label: "DPO requerido por MPI",
      classification: "legal_requirement",
      explanation:
        "El MPI se encuentra formalmente adoptado, en implementación o implementado. El DPO debe formar parte del programa.",
      detail:
        "Esto es una consecuencia del estado del MPI, no una recomendación metodológica.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Continuar con designación de DPO",
          activity_key: "dpo.designate",
        },
      ],
    },
    {
      outcome_key: "strongly_recommended",
      label: "DPO fuertemente recomendado",
      classification: "agency_standard",
      explanation:
        "Los factores documentados activan al menos una regla de recomendación fuerte de la metodología de la agencia.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Si la organización decide designarlo, continuar con D1.08",
          activity_key: "dpo.designate",
        },
      ],
    },
    {
      outcome_key: "recommended",
      label: "DPO recomendado",
      classification: "agency_standard",
      explanation:
        "Los factores documentados alcanzan el umbral metodológico de recomendación sin activar una regla fuerte.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Si la organización decide designarlo, continuar con D1.08",
          activity_key: "dpo.designate",
        },
      ],
    },
    {
      outcome_key: "not_priority",
      label: "DPO no prioritario según metodología actual",
      classification: "agency_standard",
      explanation:
        "Los factores actualmente documentados no alcanzan los criterios internos de recomendación prioritaria. La conclusión debe reevaluarse ante cambios materiales o adopción de un MPI.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación ante nuevos antecedentes",
        },
        {
          kind: "info",
          label: "Reevaluar si cambian hechos relevantes o se adopta un MPI",
          note: "La conclusión depende de los hechos registrados en esta sesión y no constituye un pronunciamiento permanente.",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes obligatorios desconocidos o sin responder. Con información faltante no se emite recomendación profesional definitiva.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Revisar ciclo de vida del MPI (D1.20)",
          activity_key: "mpi.lifecycle_review",
          show_when: {
            op: "fact_equals",
            fact_key: "mpi.lifecycle_status",
            value: "unknown",
          },
        },
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
  ],
};
