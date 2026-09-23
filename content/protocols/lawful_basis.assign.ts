import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.05.
 *
 * activity_key = lawful_basis.assign (decision, purpose scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D2.05. Auditoría D2.05: PURPOSE_SCOPED_VALID —
 * la base se determina jurídicamente por finalidad; no existe
 * decisión conjunta treatment-level.
 *
 * La base seleccionada NO se duplica como fact propio: es el outcome
 * determinista de `consent_applies` + `art13_source` (los dos hechos
 * de determinación persistidos por purpose). `purpose.lawful_basis =
 * assigned` requiere scoped finalization diferida: sin efectos.
 * El scope de ejecución (la purpose seleccionada) ya es el
 * prerrequisito estructural: sin scope válido no hay evaluación.
 */

const CONSENT_FACT = "lawful.consent_applies";
const SOURCE_FACT = "lawful.art13_source";

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function sourceIs(value: string): FactCondition {
  return { op: "fact_equals", fact_key: SOURCE_FACT, value };
}

export const LAWFUL_BASIS_ASSIGN_PROTOCOL: ExecutionProtocol = {
  protocol_key: "lawful_basis.assign.v1",
  activity_key: "lawful_basis.assign",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada de base de licitud",
  description:
    "Determina la fuente de licitud aplicable a la finalidad activa: consentimiento o fuentes del artículo 13, con derivación a interés legítimo, consentimiento o categorías especiales cuando corresponda.",
  entry_node_key: "consent-basis",
  decision_fact_keys: [CONSENT_FACT, SOURCE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "consent-basis",
      node_type: "question",
      title: "Base de consentimiento",
      prompt:
        "¿La licitud de esta finalidad deriva del consentimiento del titular?",
      why_it_matters:
        "Si depende de consentimiento, la implementación y prueba corresponden a D3 y el resto de fuentes no aplica.",
      fact_key: CONSENT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "consent_yes",
          label: "Sí, por consentimiento",
          description: "La finalidad se sostiene en consentimiento del titular.",
          fact_effect: { fact_key: CONSENT_FACT, value: "consent_yes" },
        },
        {
          value: "consent_no",
          label: "No depende de consentimiento",
          description: "Corresponde evaluar las fuentes del artículo 13.",
          fact_effect: { fact_key: CONSENT_FACT, value: "consent_no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: CONSENT_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "revisión de consentimiento cuando corresponda",
        "norma, contrato, consentimiento o antecedente justificativo",
      ],
      required_facts: [],
      default_next_node_key: "art13-source",
      related_activity_keys: ["treatment.purpose_define"],
      provenance: "legal_requirement",
    },
    {
      node_key: "art13-source",
      node_type: "question",
      title: "Fuente del artículo 13",
      prompt:
        "¿Qué fuente del artículo 13 sostiene esta finalidad, si no depende de consentimiento?",
      why_it_matters:
        "Cada finalidad requiere exactamente una fuente aplicable y acreditable.",
      fact_key: SOURCE_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "legal_obligation",
          label: "Obligación legal",
          description: "Tratamiento necesario para cumplir una obligación legal.",
          fact_effect: { fact_key: SOURCE_FACT, value: "legal_obligation" },
        },
        {
          value: "contract_precontractual",
          label: "Contrato o medidas precontractuales",
          description: "Necesario para el contrato o medidas precontractuales.",
          fact_effect: { fact_key: SOURCE_FACT, value: "contract_precontractual" },
        },
        {
          value: "legitimate_interest",
          label: "Interés legítimo",
          description: "Candidato a evaluar en D2.06 antes de asignarlo.",
          fact_effect: { fact_key: SOURCE_FACT, value: "legitimate_interest" },
        },
        {
          value: "rights_defense",
          label: "Defensa de derechos",
          description: "Necesario para la defensa de derechos.",
          fact_effect: { fact_key: SOURCE_FACT, value: "rights_defense" },
        },
        {
          value: "financial_titleIII",
          label: "Tratamiento económico-financiero (Título III)",
          description: "Solo dentro del ámbito material del Título III.",
          fact_effect: { fact_key: SOURCE_FACT, value: "financial_titleIII" },
        },
        {
          value: "none_identified",
          label: "Ninguna identificada",
          description: "Aún no se identifica fuente aplicable.",
          fact_effect: { fact_key: SOURCE_FACT, value: "none_identified" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: SOURCE_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "revisión legal",
        "revisión contractual",
        "revisión de finalidad",
      ],
      required_facts: [],
      default_next_node_key: "basis-synthesis",
      related_activity_keys: ["treatment.purpose_define"],
      provenance: "legal_requirement",
    },
    {
      node_key: "basis-synthesis",
      node_type: "decision",
      title: "Síntesis de la base aplicable",
      prompt:
        "El sistema determina la base aplicable desde las determinaciones registradas.",
      answer_type: "none",
      required_facts: [CONSENT_FACT, SOURCE_FACT],
      transitions: [
        {
          rule_id: "basis-consent",
          description: "Licitud por consentimiento del titular.",
          when: {
            op: "fact_equals",
            fact_key: CONSENT_FACT,
            value: "consent_yes",
          },
          goto_outcome_key: "basis_consent",
          explanation:
            "La finalidad depende de consentimiento: su implementación y prueba corresponden a D3.",
        },
        {
          rule_id: "basis-legal-obligation",
          description: "Licitud por obligación legal.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              sourceIs("legal_obligation"),
            ],
          },
          goto_outcome_key: "basis_legal_obligation",
          explanation:
            "La finalidad se sostiene en obligación legal acreditada.",
        },
        {
          rule_id: "basis-contract",
          description: "Licitud por contrato o medidas precontractuales.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              sourceIs("contract_precontractual"),
            ],
          },
          goto_outcome_key: "basis_contract",
          explanation:
            "La finalidad se sostiene en contrato o medidas precontractuales.",
        },
        {
          rule_id: "basis-legitimate-interest",
          description:
            "Candidato a interés legítimo: requiere evaluación D2.06.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              sourceIs("legitimate_interest"),
            ],
          },
          goto_outcome_key: "basis_legitimate_interest",
          explanation:
            "El interés legítimo solo sostiene la finalidad si supera su evaluación específica en D2.06 para esta misma purpose.",
        },
        {
          rule_id: "basis-rights-defense",
          description: "Licitud por defensa de derechos.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              sourceIs("rights_defense"),
            ],
          },
          goto_outcome_key: "basis_rights_defense",
          explanation:
            "La finalidad se sostiene en defensa de derechos.",
        },
        {
          rule_id: "basis-financial",
          description:
            "Licitud económico-financiera dentro del Título III.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              sourceIs("financial_titleIII"),
            ],
          },
          goto_outcome_key: "basis_financial",
          explanation:
            "La fuente económico-financiera solo opera dentro del ámbito material del Título III.",
        },
        {
          rule_id: "basis-unassigned",
          description: "Sin fuente identificada para la finalidad.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              {
                op: "fact_equals",
                fact_key: SOURCE_FACT,
                value: "none_identified",
              },
            ],
          },
          goto_outcome_key: "basis_unassigned",
          explanation:
            "Ninguna fuente resulta aplicable con los antecedentes actuales.",
        },
        {
          rule_id: "pending-determination",
          description:
            "Falta información para determinar la base aplicable.",
          when: {
            op: "any",
            conditions: [unresolved(CONSENT_FACT), unresolved(SOURCE_FACT)],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Existen determinaciones pendientes o sin información suficiente.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La evaluación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "basis_consent",
      label: "Base: consentimiento",
      classification: "legal_requirement",
      explanation:
        "La finalidad se sostiene en consentimiento del titular.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Implementar el mecanismo en D3",
          activity_key: "consent.mechanism_design",
        },
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Archiva el consentimiento o antecedente justificativo de esta finalidad.",
        },
      ],
    },
    {
      outcome_key: "basis_legal_obligation",
      label: "Base: obligación legal",
      classification: "legal_requirement",
      explanation:
        "La finalidad se sostiene en obligación legal acreditada.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Archiva la norma y el antecedente justificativo de esta finalidad.",
        },
      ],
    },
    {
      outcome_key: "basis_contract",
      label: "Base: contrato o precontrato",
      classification: "legal_requirement",
      explanation:
        "La finalidad se sostiene en contrato o medidas precontractuales.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Archiva el contrato o antecedente justificativo de esta finalidad.",
        },
      ],
    },
    {
      outcome_key: "basis_legitimate_interest",
      label: "Candidata: interés legítimo",
      classification: "legal_requirement",
      explanation:
        "El interés legítimo es candidato para esta finalidad, pendiente de su evaluación específica.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Evaluar el interés legítimo de esta finalidad en D2.06",
          activity_key: "legitimate_interest.assessment",
        },
      ],
    },
    {
      outcome_key: "basis_rights_defense",
      label: "Base: defensa de derechos",
      classification: "legal_requirement",
      explanation:
        "La finalidad se sostiene en defensa de derechos.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Archiva el antecedente justificativo de esta finalidad.",
        },
      ],
    },
    {
      outcome_key: "basis_financial",
      label: "Base: Título III económico-financiero",
      classification: "legal_requirement",
      explanation:
        "La finalidad se sostiene en el régimen económico-financiero del Título III.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Verificar ámbito y categorías especiales",
          note: "Confirma el ámbito material del Título III y conserva la evaluación adicional D5 si hay categorías especiales.",
        },
      ],
    },
    {
      outcome_key: "basis_unassigned",
      label: "Base sin asignar",
      classification: "agency_standard",
      explanation:
        "Ninguna fuente resulta aplicable con los antecedentes actuales. Revisa la finalidad o sus antecedentes.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen determinaciones pendientes o sin información suficiente.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
  ],
};
