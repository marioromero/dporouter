import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.01.
 *
 * activity_key = transparency.policy_assemble (procedure, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, dependencias y state effect del
 * contenido canónico D3.01. Verifica la cobertura del artefacto
 * público frente a los bloques del artículo 14 ter; nunca declara
 * cumplimiento integral de la empresa.
 *
 * Sin segunda fuente de verdad: finalidades, bases de licitud,
 * fuentes, conservación y demás materias conservan su verdad
 * estructurada en D2 (u otros dominios futuros). Esta guía solo
 * verifica su reflejo en la política pública, como revisión
 * documental honesta cuando no exista structured source disponible.
 *
 * Sin Policy entity, sin versiones persistentes, sin document blob:
 * la política es evidencia y deliverable; fecha/versión se verifican
 * como puntos de revisión, no se capturan como escalares ni se
 * almacenan contenidos. Los 17 pasos canónicos se agrupan en 10
 * verificaciones sin perder ningún requisito ni inventar
 * obligaciones (cada ítem permanece trazable en `why_it_matters`).
 *
 * Ítems condicionales (encargado de prevención, transferencias,
 * retiro, decisiones automatizadas) usan la opción explícita
 * "No aplica en este caso" en lugar de forzar incumplimiento: la
 * ausencia legítima nunca es brecha. `reasoning_record_required =
 * false`: sin juicio, sin ReasoningRecord.
 */

const CHECKS = [
  "transparency.policy.adoption_recorded",
  "transparency.policy.identity_contact_covered",
  "transparency.policy.prevention_officer_covered",
  "transparency.policy.data_subjects_covered",
  "transparency.policy.recipients_purposes_bases_covered",
  "transparency.policy.security_rights_covered",
  "transparency.policy.transfers_covered",
  "transparency.policy.retention_sources_covered",
  "transparency.policy.withdrawal_covered",
  "transparency.policy.automated_covered",
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
      description: "El punto aún no está cubierto en la política.",
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
      description: "El punto aún no está cubierto en la política.",
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

export const TRANSPARENCY_POLICY_ASSEMBLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "transparency.policy_assemble.v1",
  activity_key: "transparency.policy_assemble",
  version: 1,
  mode: "procedure",
  execution_scope: "company",
  title: "Verificación guiada de la política pública",
  description:
    "Verifica que la política o información pública de tratamiento cubra los bloques exigidos por el artículo 14 ter: adopción, identidad y contacto, datos y titulares, destinatarios, finalidades y bases, seguridad y derechos, transferencias, conservación, fuentes, retiro y decisiones automatizadas.",
  entry_node_key: "check-adoption",
  decision_fact_keys: [...CHECKS],
  last_review: "2026-09-23",
  provenance: "legal_requirement",
  nodes: [
    {
      node_key: "check-adoption",
      node_type: "question",
      title: "Política adoptada con fecha y versión",
      prompt:
        "¿La política o información pública está adoptada, con fecha y versión identificables?",
      why_it_matters:
        "Cubre el paso canónico 1: existencia de política adoptada, fecha y versión.",
      fact_key: "transparency.policy.adoption_recorded",
      answer_type: "yes_no_unknown",
      options: verifyOptions("transparency.policy.adoption_recorded"),
      evidence_to_review: [
        "política vigente",
        "evidencia de fecha y versión",
      ],
      required_facts: [],
      default_next_node_key: "check-identity-contact",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-identity-contact",
      node_type: "question",
      title: "Responsable y contacto",
      prompt:
        "¿La política individualiza al responsable y su representante legal, e informa domicilio, correo, formulario o medio de contacto aplicable?",
      why_it_matters:
        "Cubre los pasos canónicos 2 y 4: individualización del responsable y medio de contacto.",
      fact_key: "transparency.policy.identity_contact_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("transparency.policy.identity_contact_covered"),
      evidence_to_review: ["política vigente"],
      required_facts: [],
      default_next_node_key: "check-prevention-officer",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-prevention-officer",
      node_type: "question",
      title: "Encargado de prevención",
      prompt:
        "¿La política identifica al encargado de prevención, o no existe uno que deba informarse?",
      why_it_matters:
        "Cubre el paso canónico 3, condicional: solo cuando existiere encargado de prevención.",
      fact_key: "transparency.policy.prevention_officer_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "transparency.policy.prevention_officer_covered",
        "No existe encargado de prevención que deba informarse en este caso.",
      ),
      evidence_to_review: ["política vigente"],
      required_facts: [],
      default_next_node_key: "check-data-subjects",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-data-subjects",
      node_type: "question",
      title: "Datos y titulares",
      prompt:
        "¿La política describe las categorías, clases o tipos de datos tratados y el universo genérico de titulares?",
      why_it_matters:
        "Cubre los pasos canónicos 5 y 6: categorías de datos y universo de titulares.",
      fact_key: "transparency.policy.data_subjects_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("transparency.policy.data_subjects_covered"),
      evidence_to_review: ["política vigente"],
      required_facts: [],
      default_next_node_key: "check-recipients-purposes-bases",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-recipients-purposes-bases",
      node_type: "question",
      title: "Destinatarios, finalidades y bases",
      prompt:
        "¿La política informa destinatarios previstos, finalidades, bases de licitud y, cuando corresponda, intereses legítimos?",
      why_it_matters:
        "Cubre los pasos canónicos 7, 8 y 9. Verifica su reflejo en el artefacto público sin convertir esta guía en fuente de finalidades o bases: esas verdades viven en D2.",
      fact_key: "transparency.policy.recipients_purposes_bases_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions(
        "transparency.policy.recipients_purposes_bases_covered",
      ),
      evidence_to_review: [
        "política vigente",
        "matriz de cobertura del artículo 14 ter",
      ],
      help_text: [
        "Que la política describa finalidades o bases no certifica que sean jurídicamente correctas: eso corresponde a D2.",
      ],
      required_facts: [],
      default_next_node_key: "check-security-rights",
      related_activity_keys: [
        "treatment.purpose_define",
        "lawful_basis.assign",
      ],
      provenance: "legal_requirement",
    },
    {
      node_key: "check-security-rights",
      node_type: "question",
      title: "Seguridad, derechos y recurso",
      prompt:
        "¿La política informa la política o medidas de seguridad, los derechos de acceso, rectificación, supresión, oposición y portabilidad, y el derecho a recurrir ante la Agencia en los supuestos legales?",
      why_it_matters:
        "Cubre los pasos canónicos 10, 11 y 12: seguridad, derechos AR SOP y recurso ante la Agencia.",
      fact_key: "transparency.policy.security_rights_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("transparency.policy.security_rights_covered"),
      evidence_to_review: ["política vigente"],
      required_facts: [],
      default_next_node_key: "check-transfers",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-transfers",
      node_type: "question",
      title: "Transferencias internacionales",
      prompt:
        "¿La política informa las transferencias internacionales con nivel adecuado o garantías, o no existen transferencias que deban informarse?",
      why_it_matters:
        "Cubre el paso canónico 13, condicional: solo cuando correspondan transferencias.",
      fact_key: "transparency.policy.transfers_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "transparency.policy.transfers_covered",
        "No existen transferencias internacionales que deban informarse en este caso.",
      ),
      evidence_to_review: ["política vigente"],
      required_facts: [],
      default_next_node_key: "check-retention-sources",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-retention-sources",
      node_type: "question",
      title: "Conservación y fuentes",
      prompt:
        "¿La política informa el período de conservación, la fuente de los datos y, cuando corresponda, la fuente de acceso público?",
      why_it_matters:
        "Cubre los pasos canónicos 14 y 15: conservación y fuentes. Verifica el reflejo documental sin certificar la corrección material que corresponde a D2.",
      fact_key: "transparency.policy.retention_sources_covered",
      answer_type: "yes_no_unknown",
      options: verifyOptions("transparency.policy.retention_sources_covered"),
      evidence_to_review: ["política vigente"],
      required_facts: [],
      default_next_node_key: "check-withdrawal",
      related_activity_keys: [
        "retention.schedule",
        "treatment.source_traceability",
      ],
      provenance: "legal_requirement",
    },
    {
      node_key: "check-withdrawal",
      node_type: "question",
      title: "Derecho a retirar el consentimiento",
      prompt:
        "¿La política informa el derecho a retirar el consentimiento y la ausencia de efecto sobre la licitud previa, o no existe tratamiento basado en consentimiento?",
      why_it_matters:
        "Cubre el paso canónico 16, condicional: solo cuando exista tratamiento basado en consentimiento.",
      fact_key: "transparency.policy.withdrawal_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "transparency.policy.withdrawal_covered",
        "No existe tratamiento basado en consentimiento en este caso.",
      ),
      evidence_to_review: ["política vigente"],
      required_facts: [],
      default_next_node_key: "check-automated",
      provenance: "legal_requirement",
    },
    {
      node_key: "check-automated",
      node_type: "question",
      title: "Decisiones automatizadas",
      prompt:
        "¿La política informa la lógica significativa y las consecuencias previstas de decisiones automatizadas o perfiles, o no existen?",
      why_it_matters:
        "Cubre el paso canónico 17, condicional: solo cuando existan decisiones automatizadas o perfiles.",
      fact_key: "transparency.policy.automated_covered",
      answer_type: "single_select",
      options: conditionalOptions(
        "transparency.policy.automated_covered",
        "No existen decisiones automatizadas ni perfiles en este caso.",
      ),
      evidence_to_review: ["política vigente"],
      required_facts: [],
      default_next_node_key: "synthesis",
      provenance: "legal_requirement",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la cobertura",
      prompt:
        "El sistema verifica si la política cubre todos los bloques exigibles.",
      answer_type: "none",
      required_facts: [...CHECKS],
      transitions: [
        {
          rule_id: "gaps-found",
          description: "Al menos un bloque exigible no está cubierto.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen bloques por incorporar antes de declarar la política estructurada.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún bloque está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan bloques por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "policy-covered",
          description:
            "Todos los bloques exigibles verificados o legítimamente no aplicables.",
          when: { op: "all", conditions: CHECKS.map(satisfied) },
          goto_outcome_key: "policy_assembled",
          explanation:
            "La política cubre los bloques del artículo 14 ter exigibles en este caso.",
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
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "policy_assembled",
      label: "Política estructurada",
      classification: "legal_requirement",
      explanation:
        "La política cubre los bloques del artículo 14 ter exigibles en este caso. Esto valida la cobertura del artefacto, no el cumplimiento integral de la empresa.",
      provenance: "legal_requirement",
      canonical_fact_effects: [
        { fact_key: "transparency.policy_status", value: "assembled" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Validar la publicación en D3.02",
          activity_key: "transparency.publication_validate",
        },
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la política vigente con su URL o ubicación, la matriz de cobertura del artículo 14 ter y la evidencia de fecha y versión.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere completar la política",
      classification: "agency_standard",
      explanation:
        "Al menos un bloque exigible no está cubierto. Incorpora los contenidos faltantes con sus documentos fuente.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Completar los bloques pendientes",
          note: "Incorpora cada bloque faltante usando los documentos fuente y actualiza la matriz de cobertura.",
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
        "Existen bloques pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
  ],
};
