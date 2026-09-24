import type { ExecutionProtocol } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.08.
 *
 * activity_key = automated_decision.scope_assess (decision,
 * treatment scope). Contenido aprobado por la iteración vigente;
 * usa exclusivamente pasos, evidencia, dependencias y state effects
 * del contenido canónico D4.08. Identifica y evalúa separadamente
 * los usos automatizados del treatment bajo el artículo 8 bis.
 *
 * Unidad de ejecución: el treatment. Nunca el uso individual: no
 * hay sub-sesiones, nodos dinámicos, fact keys por ID ni progreso
 * por uso. Los usos viven en la colección local compartida
 * `automatedUses[]` (ADR-052) y se trabajan en el workspace del
 * treatment; la guía consume proyecciones `derived.*` y una
 * confirmación estática de inventario revisado.
 *
 * Juicio profesional con UN ReasoningRecord treatment-scoped para
 * el conjunto (el canon no exige uno por uso). La cobertura exacta
 * de IDs (`automated_use:<id>` en `facts_considered[]`) y la
 * compatibilidad conclusión↔estado las garantiza el guard
 * D4.08 en la finalización; derivar el outcome esperado NO
 * equivale a adoptar la conclusión. Sin auto-finalization:
 * inventario vacío y revisado solo habilita `no_covered_use`
 * mediante juicio finalizado.
 */

const REVIEWED_FACT = "automated_scope.inventory_reviewed";
const DRAFT_FACT = "automated_scope.working_conclusion";

const DERIVED = [
  "derived.treatment.automated_uses_exist",
  "derived.treatment.automated_uses_coverage_complete",
  "derived.treatment.automated_uses_coverage_pending",
  "derived.treatment.automated_uses_covered_exist",
  "derived.treatment.automated_uses_legal_path_complete",
];

export const AUTOMATED_DECISION_SCOPE_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "automated_decision.scope_assess.v1",
  activity_key: "automated_decision.scope_assess",
  version: 1,
  mode: "decision",
  execution_scope: "treatment",
  title: "Evaluación del alcance de decisiones automatizadas",
  description:
    "Verifica el inventario de usos automatizados del tratamiento y documenta la conclusión profesional sobre su alcance bajo el artículo 8 bis: sin usos comprendidos, con vía legal o sin ella. La evaluación por uso vive en la colección del tratamiento; el juicio es conjunto.",
  entry_node_key: "confirm-inventory",
  decision_fact_keys: [REVIEWED_FACT],
  external_fact_keys: [...DERIVED],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "confirm-inventory",
      node_type: "question",
      title: "Inventario revisado",
      prompt:
        "¿Revisaste el inventario de usos automatizados de este tratamiento, incluyendo la conclusión documentada de que no existen usos relevantes cuando sea el caso?",
      why_it_matters:
        "Un inventario vacío por sí solo no significa ausencia de usos: solo la revisión afirmada habilita concluir.",
      fact_key: REVIEWED_FACT,
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Inventario revisado",
          description:
            "El tratamiento fue revisado y sus usos (o su ausencia) quedaron registrados.",
          fact_effect: { fact_key: REVIEWED_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "Pendiente de revisar",
          description: "El inventario aún no se revisa.",
          fact_effect: { fact_key: REVIEWED_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: REVIEWED_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "inventario/matriz de usos automatizados",
        "process maps",
      ],
      required_facts: [],
      default_next_node_key: "structural-gate",
      provenance: "agency_standard",
    },
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Completitud de la evaluación",
      prompt:
        "El sistema verifica que el inventario esté revisado y que cada uso identificado tenga cobertura y vía legal evaluadas.",
      answer_type: "none",
      required_facts: [REVIEWED_FACT, ...DERIVED],
      transitions: [
        {
          rule_id: "inventory-missing",
          description:
            "Inventario sin revisar: no hay base para concluir.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: REVIEWED_FACT,
              value: "yes",
            },
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Sin revisión afirmada del inventario no hay conclusión posible, exista o no estructura cargada.",
        },
        {
          rule_id: "coverage-pending",
          description: "Algún uso sigue sin clasificación de cobertura.",
          when: {
            op: "fact_equals",
            fact_key: "derived.treatment.automated_uses_coverage_pending",
            value: "yes",
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Cada uso identificado debe quedar covered, not_covered o con revisión pendiente explícita antes de concluir.",
        },
        {
          rule_id: "paths-pending",
          description:
            "Uso cubierto con vía legal aún pendiente.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: "derived.treatment.automated_uses_coverage_complete",
                value: "yes",
              },
              {
                op: "fact_equals",
                fact_key: "derived.treatment.automated_uses_covered_exist",
                value: "yes",
              },
              {
                op: "not",
                condition: {
                  op: "fact_equals",
                  fact_key:
                    "derived.treatment.automated_uses_legal_path_complete",
                  value: "yes",
                },
              },
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Todo uso cubierto requiere vía legal determinada (excepción, ausencia determinada o pendiente explícito) antes de concluir.",
        },
        {
          rule_id: "ready-for-conclusion",
          description:
            "Base mínima completa: el profesional puede adoptar la conclusión documentada.",
          when: {
            op: "any",
            conditions: [
              {
                op: "fact_equals",
                fact_key: "derived.treatment.automated_uses_exist",
                value: "no",
              },
              {
                op: "all",
                conditions: [
                  {
                    op: "fact_equals",
                    fact_key:
                      "derived.treatment.automated_uses_coverage_complete",
                    value: "yes",
                  },
                  {
                    op: "any",
                    conditions: [
                      {
                        op: "fact_equals",
                        fact_key:
                          "derived.treatment.automated_uses_covered_exist",
                        value: "no",
                      },
                      {
                        op: "fact_equals",
                        fact_key:
                          "derived.treatment.automated_uses_legal_path_complete",
                        value: "yes",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Inventario revisado con evaluación completa: existe base mínima para el juicio profesional conjunto.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado queda sin concluir.",
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
        "¿Cuál es la conclusión profesional sobre el alcance del artículo 8 bis en este tratamiento, considerando cada uso evaluado?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: pondera por cada uso el tratamiento automatizado o profiling, la decisión producida, el efecto jurídico o afectación significativa y la vía legal (contrato, consentimiento, habilitación o ausencia determinada).",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "no_covered_use",
          label: "Sin usos comprendidos",
          description:
            "Juicio profesional: ningún uso del tratamiento queda comprendido por el artículo 8 bis.",
          fact_effect: { fact_key: DRAFT_FACT, value: "no_covered_use" },
        },
        {
          value: "covered_uses_with_legal_path",
          label: "Usos comprendidos con vía legal",
          description:
            "Juicio profesional: existen usos comprendidos y todos cuentan con vía legal de las letras a), b) o c).",
          fact_effect: {
            fact_key: DRAFT_FACT,
            value: "covered_uses_with_legal_path",
          },
        },
        {
          value: "covered_use_without_legal_path",
          label: "Uso comprendido sin vía legal",
          description:
            "Juicio profesional: existe al menos un uso comprendido sin excepción que permita la decisión.",
          fact_effect: {
            fact_key: DRAFT_FACT,
            value: "covered_use_without_legal_path",
          },
        },
      ],
      evidence_to_review: [
        "matriz de usos automatizados",
        "documentación de profiling",
        "lógica/inputs/outputs relevantes",
        "consecuencias para titulares",
        "contratos",
        "habilitación legal cuando se invoque",
        "análisis profesional",
      ],
      help_text: [
        "Evalúa por cada uso: ¿decisión basada en tratamiento automatizado o profiling? ¿Produce efectos jurídicos o afectación significativa similar? ¿Necesaria para contrato? ¿Consentimiento previo y expreso? ¿Habilitación legal con salvaguardas? Documenta la conclusión individual de cada uso en el razonamiento.",
        "Que exista una excepción no elimina las salvaguardas: todos los usos cubiertos se derivan a D4.09.",
      ],
      required_facts: [REVIEWED_FACT, ...DERIVED],
      related_activity_keys: ["automated_decision.safeguards_enable"],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "no_covered_use",
      label: "Sin usos comprendidos por el artículo 8 bis",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el tratamiento no presenta usos comprendidos. Esto valida la evaluación de alcance, no el cumplimiento integral.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "automated_decision.scope_status", value: "no_covered_use" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz de usos, el análisis profesional y el razonamiento con los usos considerados.",
        },
      ],
    },
    {
      outcome_key: "covered_uses_with_legal_path",
      label: "Usos comprendidos con vía legal",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: existen usos comprendidos y todos cuentan con vía legal. Las salvaguardas siguen exigibles en D4.09.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        {
          fact_key: "automated_decision.scope_status",
          value: "covered_use_present",
        },
        {
          fact_key: "automated_decision.legal_path_status",
          value: "exception_identified",
        },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Habilitar salvaguardas en D4.09",
          activity_key: "automated_decision.safeguards_enable",
        },
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz de usos, el análisis profesional y el razonamiento con los usos considerados.",
        },
      ],
    },
    {
      outcome_key: "covered_use_without_legal_path",
      label: "Uso comprendido sin vía legal",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: existe al menos un uso comprendido sin excepción que permita la decisión. Requiere remediación jurídica.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        {
          fact_key: "automated_decision.scope_status",
          value: "covered_use_present",
        },
        {
          fact_key: "automated_decision.legal_path_status",
          value: "remediation_required",
        },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Remediar la vía legal",
          note: "Define una vía legal válida para cada uso cubierto sin ella o ajusta el tratamiento; luego reevalúa el alcance.",
        },
        {
          kind: "activity",
          label: "Revisar salvaguardas en D4.09",
          activity_key: "automated_decision.safeguards_enable",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Falta revisión del inventario o evaluación de cobertura o vías. Sin la base completa no hay conclusión definitiva.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar inventario y evaluación",
          note: "Registra y evalúa cada uso en la colección del tratamiento y vuelve a la guía.",
        },
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
  ],
  reasoning_requirements: {
    // Sin nodos de consideración más allá de la base estructural:
    // el registro exige conclusión, pregunta, hechos, razonamiento,
    // autoría, fecha, fundamento y evidencia. Las referencias exactas
    // a usos (`automated_use:<id>`) las compone el guard de
    // finalización, no el borrador manual.
    required_fields: [
      "conclusion",
      "legal_question",
      "facts_considered",
      "rationale",
      "decided_by",
      "decided_at",
      "legal_basis",
      "evidence_refs",
    ],
  },
};
