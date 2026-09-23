import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.12.
 *
 * activity_key = inventory.periodic_revalidation (procedure, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos operativos, evidencia, dependencias y state
 * effect del contenido canónico D2.12. Sin períodos, sin review
 * instances, sin arrays de revisiones, sin scheduler: cada
 * revalidación reemplaza el estado vigente y su fecha, y el registro
 * documental conserva evidencia según mecanismos existentes.
 *
 * Unidad jurídica: el inventario de la empresa como un todo. La
 * selección de tratamientos a revalidar es input actual de la
 * sesión (nota de alcance en texto), no entidad persistente: el
 * execution scope es company sin scope nuevo.
 *
 * `reasoning_record_required = false`: sin juicio, sin ReasoningRecord
 * artificial. Los outcomes definitivos materializan el estado
 * canónico estático mediante la finalización procedure existente
 * (company scope). La fecha de revisión se captura como answer
 * escalar y persiste como tal; NO se materializa como canonical fact
 * dinámico (el contrato solo admite pares estáticos):
 * `DYNAMIC_VALUE_EFFECT_GAP` reportado, product-ready pendiente.
 */

const TREATMENTS_EXIST = "derived.company.treatments_exist";

const SCOPE_FACT = "review.treatments_covered";
const DATE_FACT = "review.date";
const REMEDIATION_FACT = "review.remediation_needed";

const CHECKS = [
  "review.existence_confirmed",
  "review.actors_revalidated",
  "review.purposes_revalidated",
  "review.sources_data_revalidated",
  "review.bases_revalidated",
  "review.mmq_reviewed",
  "review.new_treatments_checked",
];

function verified(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function notVerified(fact_key: string): FactCondition {
  return { op: "not", condition: verified(fact_key) };
}

function checkOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "El punto fue revalidado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "El punto aún no ha sido revalidado.",
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

export const INVENTORY_PERIODIC_REVALIDATION_PROTOCOL: ExecutionProtocol = {
  protocol_key: "inventory.periodic_revalidation.v1",
  activity_key: "inventory.periodic_revalidation",
  version: 1,
  mode: "procedure",
  execution_scope: "company",
  title: "Revalidación guiada del inventario",
  description:
    "Estructura la revalidación del inventario de tratamientos: verifica que siga representando la realidad operacional, registra la fecha de revisión y deja el estado vigente (al día o con remediación requerida).",
  entry_node_key: "inventory-gate",
  decision_fact_keys: [],
  external_fact_keys: [TREATMENTS_EXIST],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "inventory-gate",
      node_type: "decision",
      title: "Inventario existente",
      prompt:
        "El sistema verifica que exista un inventario (al menos un tratamiento registrado).",
      answer_type: "none",
      required_facts: [TREATMENTS_EXIST],
      transitions: [
        {
          rule_id: "inventory-present",
          description: "Existe inventario por revalidar.",
          when: verified(TREATMENTS_EXIST),
          goto_node_key: "scope-note",
          explanation: "La revalidación procede sobre el inventario existente.",
        },
        {
          rule_id: "fallback-missing",
          description: "Sin inventario no hay revalidación posible.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "inventory_missing",
          explanation:
            "Solo puede revalidarse un inventario previamente establecido.",
        },
      ],
      related_activity_keys: ["treatment.inventory_create"],
      provenance: "agency_standard",
    },
    {
      node_key: "scope-note",
      node_type: "question",
      title: "Alcance de la revalidación",
      prompt:
        "Indica qué tratamientos abarca esta revalidación según el plan de revisión.",
      why_it_matters:
        "La revalidación puede cubrir todo el inventario o los tratamientos del plan; el alcance queda registrado en esta ejecución.",
      fact_key: SCOPE_FACT,
      answer_type: "text",
      evidence_to_review: ["plan de revisión", "tratamientos revisados"],
      help_text: [
        "Texto libre con el alcance actual. No crea registros por tratamiento ni instancias.",
      ],
      required_facts: [TREATMENTS_EXIST],
      default_next_node_key: "check-existence",
      provenance: "agency_standard",
    },
    {
      node_key: "check-existence",
      node_type: "question",
      title: "Procesos vigentes",
      prompt:
        "¿Se confirmó que los procesos revisados continúan existiendo?",
      why_it_matters:
        "Un proceso extinguido no se revalida: se retira del inventario.",
      fact_key: "review.existence_confirmed",
      answer_type: "yes_no_unknown",
      options: checkOptions("review.existence_confirmed"),
      required_facts: [TREATMENTS_EXIST, SCOPE_FACT],
      default_next_node_key: "check-actors",
      provenance: "agency_standard",
    },
    {
      node_key: "check-actors",
      node_type: "question",
      title: "Actores y roles",
      prompt: "¿Se revalidaron actores y roles de los tratamientos revisados?",
      why_it_matters:
        "Los responsables y encargados deben seguir siendo los reales.",
      fact_key: "review.actors_revalidated",
      answer_type: "yes_no_unknown",
      options: checkOptions("review.actors_revalidated"),
      required_facts: [TREATMENTS_EXIST],
      default_next_node_key: "check-purposes",
      provenance: "agency_standard",
    },
    {
      node_key: "check-purposes",
      node_type: "question",
      title: "Finalidades",
      prompt: "¿Se revalidaron las finalidades de los tratamientos revisados?",
      why_it_matters:
        "Las finalidades deben seguir siendo las efectivamente perseguidas.",
      fact_key: "review.purposes_revalidated",
      answer_type: "yes_no_unknown",
      options: checkOptions("review.purposes_revalidated"),
      required_facts: [TREATMENTS_EXIST],
      default_next_node_key: "check-sources",
      provenance: "agency_standard",
    },
    {
      node_key: "check-sources",
      node_type: "question",
      title: "Fuentes y datos",
      prompt:
        "¿Se revalidaron fuentes y categorías de datos de los tratamientos revisados?",
      why_it_matters:
        "Las fuentes y los datos deben corresponder a la operación real.",
      fact_key: "review.sources_data_revalidated",
      answer_type: "yes_no_unknown",
      options: checkOptions("review.sources_data_revalidated"),
      required_facts: [TREATMENTS_EXIST],
      default_next_node_key: "check-bases",
      provenance: "agency_standard",
    },
    {
      node_key: "check-bases",
      node_type: "question",
      title: "Bases de licitud",
      prompt:
        "¿Se revalidaron las bases de licitud de los tratamientos revisados?",
      why_it_matters:
        "Cada tratamiento debe conservar una base vigente que lo sostenga.",
      fact_key: "review.bases_revalidated",
      answer_type: "yes_no_unknown",
      options: checkOptions("review.bases_revalidated"),
      required_facts: [TREATMENTS_EXIST],
      default_next_node_key: "check-mmq",
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-mmq",
      node_type: "question",
      title: "Minimización, conservación y calidad",
      prompt:
        "¿Se revisaron minimización, conservación y calidad de los tratamientos revisados?",
      why_it_matters:
        "Los datos deben seguir siendo necesarios, conservados con criterio y de calidad.",
      fact_key: "review.mmq_reviewed",
      answer_type: "yes_no_unknown",
      options: checkOptions("review.mmq_reviewed"),
      required_facts: [TREATMENTS_EXIST],
      default_next_node_key: "check-new",
      related_activity_keys: ["retention.schedule"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-new",
      node_type: "question",
      title: "Tratamientos nuevos",
      prompt:
        "¿Se identificaron tratamientos nuevos o no documentados durante la revisión?",
      why_it_matters:
        "Lo no documentado debe ingresar al inventario o quedar registrado como hallazgo.",
      fact_key: "review.new_treatments_checked",
      answer_type: "yes_no_unknown",
      options: checkOptions("review.new_treatments_checked"),
      required_facts: [TREATMENTS_EXIST],
      default_next_node_key: "review-date",
      related_activity_keys: ["treatment.inventory_create"],
      provenance: "agency_standard",
    },
    {
      node_key: "review-date",
      node_type: "question",
      title: "Fecha de revisión",
      prompt:
        "¿En qué fecha se realizó esta revalidación? Indica la fecha civil de la revisión.",
      why_it_matters:
        "La fecha registra cuándo quedó vigente esta revalidación.",
      fact_key: DATE_FACT,
      answer_type: "date",
      evidence_to_review: ["registro de revalidación"],
      help_text: [
        "Una fecha por revalidación: la próxima reemplaza esta. No se conservan revisiones anteriores en el runtime.",
      ],
      required_facts: [TREATMENTS_EXIST],
      default_next_node_key: "remediation-check",
      provenance: "agency_standard",
    },
    {
      node_key: "remediation-check",
      node_type: "question",
      title: "Hallazgos",
      prompt:
        "¿La revisión detectó hallazgos que exigen remediación (tratamientos por documentar, bases por corregir, datos por depurar)?",
      why_it_matters:
        "Con hallazgos abiertos el inventario no queda al día: queda en remediación requerida.",
      fact_key: REMEDIATION_FACT,
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Con hallazgos",
          description: "Existen hallazgos que exigen remediación.",
          fact_effect: { fact_key: REMEDIATION_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "Sin hallazgos",
          description: "La revisión no detectó hallazgos pendientes.",
          fact_effect: { fact_key: REMEDIATION_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "Aún no es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: REMEDIATION_FACT, value: "unknown" },
        },
      ],
      required_facts: [TREATMENTS_EXIST, DATE_FACT],
      default_next_node_key: "synthesis",
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la revalidación",
      prompt:
        "El sistema verifica si la revalidación está completa y su resultado.",
      answer_type: "none",
      required_facts: [
        TREATMENTS_EXIST,
        SCOPE_FACT,
        ...CHECKS,
        DATE_FACT,
        REMEDIATION_FACT,
      ],
      transitions: [
        {
          rule_id: "checks-pending",
          description:
            "Algún punto no fue verificado, está sin responder o sin información.",
          when: {
            op: "any",
            conditions: [
              ...CHECKS.map(notVerified),
              { op: "fact_unresolved", fact_key: SCOPE_FACT },
              { op: "fact_unresolved", fact_key: DATE_FACT },
              { op: "fact_unresolved", fact_key: REMEDIATION_FACT },
            ],
          },
          goto_outcome_key: "revalidation_incomplete",
          explanation:
            "Faltan puntos por revalidar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "remediation-open",
          description: "La revisión detectó hallazgos pendientes.",
          when: {
            op: "fact_equals",
            fact_key: REMEDIATION_FACT,
            value: "yes",
          },
          goto_outcome_key: "remediation_required",
          explanation:
            "Con hallazgos abiertos el inventario queda en remediación requerida.",
        },
        {
          rule_id: "inventory-current",
          description: "Revalidación completa sin hallazgos.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "inventory_current",
          explanation:
            "El inventario refleja la realidad operacional a la fecha de revisión.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "revalidation_incomplete",
      label: "Revalidación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen puntos pendientes o con información insuficiente. Esto no es una conclusión sobre el inventario.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar revalidación",
        },
      ],
    },
    {
      outcome_key: "inventory_missing",
      label: "Sin inventario",
      classification: "agency_standard",
      explanation:
        "No existe inventario por revalidar: primero debe establecerse en D2.01.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Levantar inventario en D2.01",
          activity_key: "treatment.inventory_create",
        },
      ],
    },
    {
      outcome_key: "inventory_current",
      label: "Inventario al día",
      classification: "agency_standard",
      explanation:
        "Revalidación completa sin hallazgos: el inventario refleja la realidad operacional.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "inventory.revalidation_status", value: "current" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el registro",
          note: "Archiva el Registro de Revalidación con tratamientos revisados, cambios detectados y fecha de revisión.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Remediación requerida",
      classification: "agency_standard",
      explanation:
        "La revalidación detectó hallazgos: el inventario queda en remediación requerida hasta corregirlos.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "inventory.revalidation_status", value: "remediation_required" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Documentar tratamientos nuevos en D2.01",
          activity_key: "treatment.inventory_create",
        },
        {
          kind: "info",
          label: "Corregir hallazgos y revalidar",
          note: "Atiende los hallazgos registrados y ejecuta una nueva revalidación.",
        },
      ],
    },
  ],
};
