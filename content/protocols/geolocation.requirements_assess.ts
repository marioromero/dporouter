import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D5.06.
 *
 * activity_key = geolocation.requirements_assess (checklist, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente requisitos, evidencia y effects del contenido
 * canónico D5.06. Verifica requisitos adicionales sin redefinir la
 * licitud general: la fuente de los arts. 12 o 13 se consume como
 * contexto D2 (bridge read-only sobre las truths que ya usa el
 * puente D5.07), sin duplicar ni modificar facts de D2 y sin crear
 * `geolocation.lawful_basis`. `reasoning_record_required = false`:
 * finalización scope-aware procedure/checklist existente, sin
 * ReasoningRecord.
 *
 * Reglas preservadas:
 * - candidate yes + datos clasificados + vía evaluada como
 *   precondiciones de síntesis;
 * - información en cuatro elementos verificable con independencia;
 * - comunicación a tercero para valor añadido como rama separada
 *   (no mezclada con el dato): yes exige disclosure; unknown deja
 *   incompleto, nunca remediación;
 * - unknown material nunca es remediación.
 */

const CANDIDATE = "derived.purpose.d5_geolocation_candidate";
const CONSENT_FACT = "lawful.consent_applies";
const SOURCE_FACT = "lawful.art13_source";

const CLASSIFIED = "geo06.items_classified";
const INFO_CLEAR = "geo06.info_clear";
const INFO_TYPE = "geo06.info_type";
const INFO_PURPOSE = "geo06.info_purpose";
const INFO_DURATION = "geo06.info_duration";
const SHARING = "geo06.third_party_sharing";
const DISCLOSED = "geo06.third_party_disclosed";

const ART13_ROUTES = [
  "legal_obligation",
  "contract_precontractual",
  "legitimate_interest",
  "rights_defense",
  "financial_titleIII",
];

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
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

/** Vía de licitud evaluada bajo art. 12 o 13 (solo lectura D2). */
function lawfulnessKnown(): FactCondition {
  return {
    op: "any",
    conditions: [
      { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_yes" },
      { op: "fact_in", fact_key: SOURCE_FACT, values: ART13_ROUTES },
    ],
  };
}

export const GEOLOCATION_REQUIREMENTS_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "geolocation.requirements_assess.v1",
  activity_key: "geolocation.requirements_assess",
  version: 1,
  mode: "checklist",
  execution_scope: "purpose",
  title: "Verificación guiada de requisitos de geolocalización",
  description:
    "Verifica que la finalidad con geolocalización use una vía de licitud evaluada y cumpla la información especial del art. 16 sexies, incluida la comunicación a terceros para valor añadido.",
  entry_node_key: "structural-gate",
  decision_fact_keys: [
    CLASSIFIED,
    INFO_CLEAR,
    INFO_TYPE,
    INFO_PURPOSE,
    INFO_DURATION,
    SHARING,
    DISCLOSED,
  ],
  external_fact_keys: [CANDIDATE, CONSENT_FACT, SOURCE_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Candidatura estructural",
      prompt:
        "El sistema verifica si la captura estructural actual identifica geolocalización en esta finalidad.",
      answer_type: "none",
      required_facts: [CANDIDATE],
      transitions: [
        {
          rule_id: "candidate-yes",
          description: "La finalidad trata geolocalización.",
          when: isYes(CANDIDATE),
          goto_node_key: "lawfulness-gate",
          explanation:
            "Al menos un dato vinculado está clasificado como geolocalización: corresponde la verificación.",
        },
        {
          rule_id: "candidate-no",
          description: "La captura estructural no identifica geolocalización.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "Todos los datos vinculados están clasificados explícitamente fuera de geolocalización.",
        },
        {
          rule_id: "fallback-classification",
          description: "Sin clasificación suficiente no inicia la verificación.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "classification_incomplete",
          explanation:
            "Completa la clasificación estructural de los datos vinculados para saber si esta revisión corresponde.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "lawfulness-gate",
      node_type: "decision",
      title: "Vía de licitud evaluada",
      prompt:
        "El sistema verifica que exista una vía de licitud evaluada bajo art. 12 o 13 para esta finalidad (contexto D2, sin reevaluarla aquí).",
      answer_type: "none",
      required_facts: [CONSENT_FACT],
      transitions: [
        {
          rule_id: "route-known",
          description: "Existe vía evaluada bajo art. 12 o 13.",
          when: lawfulnessKnown(),
          goto_node_key: "check-classified",
          explanation:
            "D2 evaluó una vía de licitud para esta finalidad: procede la verificación de requisitos adicionales.",
        },
        {
          rule_id: "fallback-lawfulness",
          description: "Sin vía evaluada no hay requisitos que verificar.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Aún no puede saberse si existe vía de licitud evaluada para esta finalidad.",
        },
      ],
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-classified",
      node_type: "question",
      title: "Datos clasificados",
      prompt:
        "¿Están clasificados todos los datos actualmente vinculados a la finalidad respecto de geolocalización (sin ubicaciones reales)?",
      why_it_matters:
        "Sin clasificación completa no se sabe qué datos activan los requisitos.",
      fact_key: CLASSIFIED,
      answer_type: "yes_no_unknown",
      options: checkOptions(
        CLASSIFIED,
        "Clasificación de geolocalización completa y sin datos reales.",
      ),
      evidence_to_review: [
        "flujo de sistema y datos",
        "clasificación estructural de los datos",
      ],
      required_facts: [],
      default_next_node_key: "check-clear-info",
      provenance: "agency_standard",
    },
    {
      node_key: "check-clear-info",
      node_type: "question",
      title: "Información clara, suficiente y oportuna",
      prompt:
        "¿Se informa al titular de forma clara, suficiente y oportuna sobre el tratamiento de geolocalización?",
      why_it_matters:
        "La calidad de la información es el primer requisito especial.",
      fact_key: INFO_CLEAR,
      answer_type: "yes_no_unknown",
      options: checkOptions(
        INFO_CLEAR,
        "Información clara, suficiente y oportuna verificada.",
      ),
      evidence_to_review: ["aviso de privacidad", "flujo de permisos", "capturas"],
      required_facts: [],
      default_next_node_key: "check-type",
      provenance: "agency_standard",
    },
    {
      node_key: "check-type",
      node_type: "question",
      title: "Tipo de geolocalización",
      prompt: "¿Se informa el tipo de datos de geolocalización tratados?",
      why_it_matters:
        "El titular debe conocer qué tipo de localización se trata.",
      fact_key: INFO_TYPE,
      answer_type: "yes_no_unknown",
      options: checkOptions(
        INFO_TYPE,
        "Tipo de geolocalización informado.",
      ),
      evidence_to_review: ["aviso de privacidad", "flujo de sistema y datos"],
      required_facts: [],
      default_next_node_key: "check-purpose",
      provenance: "agency_standard",
    },
    {
      node_key: "check-purpose",
      node_type: "question",
      title: "Finalidad informada",
      prompt: "¿Se informa la finalidad del tratamiento de geolocalización?",
      why_it_matters:
        "Sin finalidad informada no hay tratamiento limitado verificable.",
      fact_key: INFO_PURPOSE,
      answer_type: "yes_no_unknown",
      options: checkOptions(
        INFO_PURPOSE,
        "Finalidad informada.",
      ),
      evidence_to_review: ["aviso de privacidad", "contexto de licitud"],
      required_facts: [],
      default_next_node_key: "check-duration",
      provenance: "agency_standard",
    },
    {
      node_key: "check-duration",
      node_type: "question",
      title: "Duración informada",
      prompt: "¿Se informa la duración del tratamiento de geolocalización?",
      why_it_matters:
        "La duración acota temporalmente lo informado al titular.",
      fact_key: INFO_DURATION,
      answer_type: "yes_no_unknown",
      options: checkOptions(
        INFO_DURATION,
        "Duración informada.",
      ),
      evidence_to_review: [
        "aviso de privacidad",
        "información de conservación y duración",
      ],
      required_facts: [],
      default_next_node_key: "check-sharing",
      provenance: "agency_standard",
    },
    {
      node_key: "check-sharing",
      node_type: "question",
      title: "Comunicación a terceros",
      prompt:
        "¿Existe comunicación o cesión a terceros para prestación de un servicio con valor añadido?",
      why_it_matters:
        "Esta dimensión es independiente del dato: exige información propia cuando existe.",
      fact_key: SHARING,
      answer_type: "yes_no_unknown",
      options: checkOptions(
        SHARING,
        "Situación de comunicación a terceros determinada.",
      ),
      evidence_to_review: [
        "descripción de intercambio con terceros",
        "contratos como evidencia contextual cuando corresponda",
      ],
      required_facts: [],
      default_next_node_key: "check-disclosure",
      provenance: "agency_standard",
    },
    {
      node_key: "check-disclosure",
      node_type: "question",
      title: "Información de la comunicación",
      prompt:
        "Si existe comunicación a terceros para valor añadido: ¿esa circunstancia es informada al titular?",
      why_it_matters:
        "La comunicación para valor añadido debe ser informada.",
      fact_key: DISCLOSED,
      answer_type: "single_select",
      options: conditionalOptions(
        DISCLOSED,
        "No existe comunicación o cesión a terceros para valor añadido.",
      ),
      evidence_to_review: [
        "aviso de privacidad",
        "descripción de intercambio con terceros",
      ],
      required_facts: [],
      default_next_node_key: "synthesis",
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de requisitos",
      prompt:
        "El sistema verifica candidatura, vía evaluada, clasificación, información y rama de terceros.",
      answer_type: "none",
      required_facts: [
        CANDIDATE,
        CONSENT_FACT,
        CLASSIFIED,
        INFO_CLEAR,
        INFO_TYPE,
        INFO_PURPOSE,
        INFO_DURATION,
        SHARING,
        DISCLOSED,
      ],
      transitions: [
        {
          rule_id: "candidate-lost",
          description: "La captura ya no indica geolocalización.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "Sin candidatura estructural vigente no hay requisitos que verificar.",
        },
        {
          rule_id: "candidate-unresolved",
          description: "La candidatura quedó sin determinar.",
          when: {
            op: "not",
            condition: isYes(CANDIDATE),
          },
          goto_outcome_key: "classification_incomplete",
          explanation:
            "Sin candidatura determinada no puede concluirse la verificación.",
        },
        {
          rule_id: "route-lost",
          description: "Ya no hay vía evaluada bajo art. 12 o 13.",
          when: { op: "not", condition: lawfulnessKnown() },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Sin vía de licitud evaluada no puede concluirse la verificación.",
        },
        {
          rule_id: "sharing-unknown",
          description: "La rama de terceros quedó sin determinar.",
          when: unresolved(SHARING),
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Sin saber si existe comunicación a terceros no puede concluirse: lo desconocido no es remediación.",
        },
        {
          rule_id: "sharing-undisclosed",
          description: "Comunicación existente sin información.",
          when: {
            op: "all",
            conditions: [
              isYes(SHARING),
              { op: "fact_equals", fact_key: DISCLOSED, value: "no" },
            ],
          },
          goto_outcome_key: "remediation_required",
          explanation:
            "La comunicación a terceros para valor añadido no está informada.",
        },
        {
          rule_id: "sharing-pending-disclosure",
          description: "Comunicación existente con información sin determinar.",
          when: {
            op: "all",
            conditions: [
              isYes(SHARING),
              unresolved(DISCLOSED),
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Con comunicación existente, la información sin determinar deja incompleta la verificación.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un requisito informativo requiere corrección.",
          when: {
            op: "any",
            conditions: [
              isNo(CLASSIFIED),
              isNo(INFO_CLEAR),
              isNo(INFO_TYPE),
              isNo(INFO_PURPOSE),
              isNo(INFO_DURATION),
            ],
          },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas en clasificación o información que requieren corrección.",
        },
        {
          rule_id: "missing-info",
          description: "Algún requisito está sin responder o sin información.",
          when: {
            op: "any",
            conditions: [
              unresolved(CLASSIFIED),
              unresolved(INFO_CLEAR),
              unresolved(INFO_TYPE),
              unresolved(INFO_PURPOSE),
              unresolved(INFO_DURATION),
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan requisitos por verificar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "requirements-ok",
          description: "Requisitos especiales verificados.",
          when: {
            op: "all",
            conditions: [
              isYes(CANDIDATE),
              lawfulnessKnown(),
              isYes(CLASSIFIED),
              isYes(INFO_CLEAR),
              isYes(INFO_TYPE),
              isYes(INFO_PURPOSE),
              isYes(INFO_DURATION),
              {
                op: "any",
                conditions: [
                  isNo(SHARING),
                  {
                    op: "all",
                    conditions: [
                      isYes(SHARING),
                      { op: "fact_equals", fact_key: DISCLOSED, value: "yes" },
                    ],
                  },
                ],
              },
            ],
          },
          goto_outcome_key: "requirements_satisfied",
          explanation:
            "La finalidad usa vía evaluada y cumple la información especial, incluida la rama de terceros.",
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
      outcome_key: "requirements_satisfied",
      label: "Requisitos cumplidos",
      classification: "agency_standard",
      explanation:
        "La finalidad usa una vía evaluada y cumple los requisitos especiales de información del art. 16 sexies.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "geolocation.requirements_status", value: "satisfied" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la verificación",
          note: "Archiva aviso, flujos, contexto de licitud y descripción de intercambios con terceros.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere remediación",
      classification: "agency_standard",
      explanation:
        "La evaluación está suficientemente completa y existe al menos una deficiencia en requisitos.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "geolocation.requirements_status", value: "remediation_required" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Corregir las deficiencias detectadas",
          note: "Atiende cada requisito pendiente y vuelve a verificar.",
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
        "Falta vía evaluada, clasificación o información por determinar. Esto no es una deficiencia declarada.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Determinar la base en D2.05",
          activity_key: "lawful_basis.assign",
        },
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "classification_incomplete",
      label: "Clasificación incompleta",
      classification: "agency_standard",
      explanation:
        "La captura estructural aún no permite saber si esta revisión corresponde. Completa la clasificación de geolocalización.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar clasificación estructural",
          note: "Clasifica los datos vinculados (geolocalización: sí, no o por determinar) antes de verificar requisitos.",
        },
      ],
    },
    {
      outcome_key: "regime_not_indicated",
      label: "Régimen no indicado",
      classification: "agency_standard",
      explanation:
        "La captura estructural actual no identifica geolocalización para esta finalidad. No es una conclusión jurídica ni marca la actividad como no aplicable.",
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
};
