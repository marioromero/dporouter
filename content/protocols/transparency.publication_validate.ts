import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.02.
 *
 * activity_key = transparency.publication_validate (checklist,
 * company scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, dependencias y state effect del
 * contenido canónico D3.02. Verifica disponibilidad y condiciones
 * de publicación; nunca declara cumplimiento global.
 *
 * Dependencia de completitud: la guía puede navegarse y revisarse
 * desde el inicio (can start), pero su conclusión definitiva
 * requiere la política estructurada en D3.01 (can complete). Se
 * expresa consumiendo el fact externo `transparency.policy_status`
 * que materializa la finalización D3.01: sin `assembled` no hay
 * outcome definitivo. Sin WCAG, SLA, performance, SEO ni requisitos
 * técnicos no canónicos. Sin Publication entity, URL registry,
 * version history ni scores.
 *
 * Metodología `agency_standard` (URL, capturas, prueba de acceso,
 * comparación de versiones): la obligación de transparencia es
 * legal; los artefactos de verificación son método interno y nunca
 * se presentan como documentos formalmente exigidos por la ley.
 */

const POLICY_FACT = "transparency.policy_status";

const CHECKS = [
  "transparency.publication.medium_exists",
  "transparency.publication.permanent_available",
  "transparency.publication.effective_access",
  "transparency.publication.gratuity",
  "transparency.publication.presentation_clear",
  "transparency.publication.contact_channel",
  "transparency.publication.version_match",
];

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

export const TRANSPARENCY_PUBLICATION_VALIDATE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "transparency.publication_validate.v1",
  activity_key: "transparency.publication_validate",
  version: 1,
  mode: "checklist",
  execution_scope: "company",
  title: "Validación guiada de la publicación",
  description:
    "Verifica que la información de transparencia esté efectivamente publicada y disponible: medio público, permanencia, acceso efectivo, gratuidad, precisión y claridad, canal de contacto y correspondencia con la política vigente.",
  entry_node_key: "check-medium",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [POLICY_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "check-medium",
      node_type: "question",
      title: "Medio público",
      prompt:
        "¿Existe un medio público donde se informa la política o información de tratamiento?",
      why_it_matters:
        "Sin medio público no hay transparencia efectiva, aunque el documento exista.",
      fact_key: "transparency.publication.medium_exists",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.medium_exists",
        "Medio público de información identificado.",
      ),
      evidence_to_review: ["URL", "medio equivalente"],
      required_facts: [],
      default_next_node_key: "check-permanence",
      provenance: "agency_standard",
    },
    {
      node_key: "check-permanence",
      node_type: "question",
      title: "Disponibilidad permanente",
      prompt:
        "¿La información se encuentra disponible de forma permanente?",
      why_it_matters:
        "La transparencia exige disponibilidad sostenida, no publicaciones transitorias.",
      fact_key: "transparency.publication.permanent_available",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.permanent_available",
        "Disponibilidad permanente verificada.",
      ),
      evidence_to_review: ["URL", "prueba de acceso"],
      required_facts: [],
      default_next_node_key: "check-access",
      provenance: "agency_standard",
    },
    {
      node_key: "check-access",
      node_type: "question",
      title: "Acceso efectivo",
      prompt:
        "¿Cualquier interesado puede acceder efectivamente a la información?",
      why_it_matters:
        "Un medio existente pero inaccesible no cumple la condición de acceso efectivo.",
      fact_key: "transparency.publication.effective_access",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.effective_access",
        "Acceso efectivo comprobado con prueba de acceso.",
      ),
      evidence_to_review: ["prueba de acceso"],
      required_facts: [],
      default_next_node_key: "check-gratuity",
      provenance: "agency_standard",
    },
    {
      node_key: "check-gratuity",
      node_type: "question",
      title: "Gratuidad",
      prompt: "¿El acceso a la información es gratuito?",
      why_it_matters:
        "La información de transparencia debe ofrecerse sin costo para el interesado.",
      fact_key: "transparency.publication.gratuity",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.gratuity",
        "Acceso gratuito verificado.",
      ),
      evidence_to_review: ["prueba de acceso"],
      required_facts: [],
      default_next_node_key: "check-presentation",
      provenance: "agency_standard",
    },
    {
      node_key: "check-presentation",
      node_type: "question",
      title: "Precisión y claridad",
      prompt:
        "¿La información se presenta de forma precisa, clara y sin ambigüedad material?",
      why_it_matters:
        "La presentación ambigua o imprecisa impide al titular comprender el tratamiento.",
      fact_key: "transparency.publication.presentation_clear",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.presentation_clear",
        "Presentación precisa, clara y sin ambigüedad material.",
      ),
      evidence_to_review: ["capturas", "versión publicada"],
      required_facts: [],
      default_next_node_key: "check-contact",
      provenance: "agency_standard",
    },
    {
      node_key: "check-contact",
      node_type: "question",
      title: "Canal de contacto",
      prompt:
        "¿El canal de contacto informado es accesible desde el medio público?",
      why_it_matters:
        "El contacto informado en la política debe ser efectivamente alcanzable.",
      fact_key: "transparency.publication.contact_channel",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.contact_channel",
        "Canal de contacto accesible y operativo.",
      ),
      evidence_to_review: ["prueba de acceso"],
      required_facts: [],
      default_next_node_key: "check-version",
      provenance: "agency_standard",
    },
    {
      node_key: "check-version",
      node_type: "question",
      title: "Correspondencia de versiones",
      prompt:
        "¿La versión publicada corresponde a la política vigente?",
      why_it_matters:
        "Una versión desactualizada desinforma aunque el medio funcione.",
      fact_key: "transparency.publication.version_match",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.version_match",
        "Versión publicada idéntica a la vigente.",
      ),
      evidence_to_review: [
        "versión publicada",
        "evidencia documental de revisión",
      ],
      required_facts: [],
      default_next_node_key: "synthesis",
      related_activity_keys: ["transparency.policy_assemble"],
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la publicación",
      prompt:
        "El sistema verifica la política estructurada en D3.01 y el estado de cada condición de publicación.",
      answer_type: "none",
      required_facts: [POLICY_FACT, ...CHECKS],
      transitions: [
        {
          rule_id: "policy-not-assembled",
          description:
            "La política aún no está estructurada en D3.01: la validación no puede concluir.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: POLICY_FACT,
              value: "assembled",
            },
          },
          goto_outcome_key: "policy_assembly_pending",
          explanation:
            "Solo puede validarse la publicación de una política estructurada. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos una condición de publicación requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de publicación que requieren corrección antes de declarar la validación.",
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
          rule_id: "publication-ok",
          description:
            "Política estructurada y todas las condiciones satisfactorias.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: POLICY_FACT,
                value: "assembled",
              },
              ...CHECKS.map((f) => ({
                op: "fact_equals" as const,
                fact_key: f,
                value: "yes",
              })),
            ],
          },
          goto_outcome_key: "publication_validated",
          explanation:
            "La información está publicada y disponible bajo las condiciones verificadas.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La validación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "publication_validated",
      label: "Publicación validada",
      classification: "agency_standard",
      explanation:
        "La información de transparencia está publicada y disponible bajo las condiciones verificadas, sobre una política estructurada. Esto valida la publicación, no el cumplimiento integral de la empresa.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "transparency.publication_status", value: "validated" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la URL, las capturas, la prueba de acceso, la versión publicada y la evidencia documental de revisión.",
        },
      ],
    },
    {
      outcome_key: "policy_assembly_pending",
      label: "Política pendiente de estructurar",
      classification: "agency_standard",
      explanation:
        "La publicación solo puede validarse sobre una política estructurada en D3.01. Lo revisado hasta ahora queda como avance preliminar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Estructurar la política en D3.01",
          activity_key: "transparency.policy_assemble",
        },
        {
          kind: "restart",
          label: "Reiniciar validación",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere correcciones de publicación",
      classification: "agency_standard",
      explanation:
        "Al menos una condición de publicación requiere corrección. Corrige el medio, el acceso o la versión publicada.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada condición pendiente y vuelve a verificar la publicación.",
        },
        {
          kind: "restart",
          label: "Reiniciar validación",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Validación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen condiciones pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar validación",
        },
      ],
    },
  ],
};
