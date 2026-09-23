import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.08.
 *
 * activity_key = dpo.designate (procedure). Contenido aprobado por la
 * iteración vigente; usa exclusivamente pasos, evidencia, legal basis,
 * state effects, dependencias y condiciones de aplicabilidad del
 * contenido canónico D1.08.
 *
 * Calibración de modo: los pasos operativos se representan como
 * verificaciones de hechos, no como preguntas de descubrimiento. Los
 * pasos genuinamente condicionales del canon (persona natural cuando el
 * prestador es persona jurídica; condiciones cuando existe DPO común de
 * grupo) usan la opción explícita "No aplica en este caso" en lugar de
 * forzar una verificación inexistente o de ramificar un árbol
 * decisional. La modalidad y el antecedente de designación son
 * determinaciones reales del paso canónico, no preguntas artificiales.
 *
 * Esta guía NO re-resuelve D1.02 ni D1.04: la compuerta registra el
 * antecedente (requerimiento vigente o decisión voluntaria) y deriva a
 * D1.02 cuando aún está sin definir. La evaluación previa de D1.02, si
 * existe, se revisa como evidencia de entrada (input_dependency).
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce al acto verificable);
 * - product-ready: false (sin lifecycle effects canónicos);
 * - motivo: el state_effect canónico es un bundle temporal/histórico
 *   (fecha efectiva, append de historial, vacancy/replacement) no
 *   representable como pares {fact_key, value}; no se materializa
 *   parcialmente ni con workarounds.
 */

const TRIGGER_FACT = "dpo.designation_trigger";
const MODALITY_FACT = "dpo.designation_modality";

const VERIFICATION_FACTS = [
  TRIGGER_FACT,
  "dpo.designation_authority",
  MODALITY_FACT,
  "dpo.designation_natural_person",
  "dpo.designation_group_conditions",
  "dpo.designation_suitability",
  "dpo.designation_formalization",
];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function verifiedOrNa(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
}

function stateOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "Realizado y respaldado con evidencia.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "Aún no realizado o sin evidencia suficiente.",
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
      description: "Realizado y respaldado con evidencia.",
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
      description: "Aún no realizado o sin evidencia suficiente.",
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

export const DPO_DESIGNATE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.designate.v1",
  activity_key: "dpo.designate",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de designación del DPO",
  description:
    "Guía al profesional desde el antecedente de designación hasta su formalización trazable: autoridad competente, modalidad, persona natural, condiciones de grupo, idoneidad y acto con fecha efectiva.",
  entry_node_key: "trigger-gate",
  decision_fact_keys: VERIFICATION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "trigger-gate",
      node_type: "question",
      title: "Antecedente de designación",
      prompt:
        "¿Existe requerimiento vigente de contar con DPO o decisión voluntaria documentada de designar?",
      why_it_matters:
        "La designación procede ante requerimiento activo o decisión voluntaria. Sin antecedente definido corresponde evaluar la necesidad antes de designar.",
      fact_key: TRIGGER_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "mpi_requirement",
          label: "Requerimiento vigente",
          description:
            "Evaluación previa o programa vigente que exige contar con DPO.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "mpi_requirement" },
        },
        {
          value: "voluntary",
          label: "Decisión voluntaria documentada",
          description:
            "La organización decidió designar sin requerimiento vigente.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "voluntary" },
        },
        {
          value: "undecided",
          label: "Aún sin definir",
          description:
            "Todavía no se define si corresponde designar un DPO.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "undecided" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "evaluación de necesidad D1.02 si existe",
        "decisión de adopción MPI si existe",
        "decisión voluntaria documentada",
      ],
      help_text: [
        "Esta guía no re-evalúa la necesidad de DPO: registra el antecedente disponible. Si aún está sin definir, deriva a D1.02.",
      ],
      required_facts: [],
      default_next_node_key: "confirm-authority",
      transitions: [
        {
          rule_id: "trigger-undefined",
          description:
            "Sin antecedente definido no inicia la designación.",
          when: {
            op: "fact_equals",
            fact_key: TRIGGER_FACT,
            value: "undecided",
          },
          goto_outcome_key: "prerequisite_pending",
          explanation:
            "Aún no se define si corresponde designar. Esta guía parte del antecedente; primero corresponde evaluar la necesidad.",
        },
      ],
      related_activity_keys: ["dpo.need_assessment"],
      provenance: "agency_standard",
    },
    {
      node_key: "confirm-authority",
      node_type: "question",
      title: "Autoridad competente",
      prompt: "¿Se confirmó la autoridad competente para designar?",
      why_it_matters:
        "Solo la máxima autoridad directiva o administrativa puede formalizar una designación válida y trazable.",
      fact_key: "dpo.designation_authority",
      answer_type: "single_select",
      options: stateOptions("dpo.designation_authority"),
      evidence_to_review: [
        "acto o documento de designación",
        "identificación de la máxima autoridad directiva o administrativa",
      ],
      required_facts: [],
      default_next_node_key: "modality",
      provenance: "legal_requirement",
    },
    {
      node_key: "modality",
      node_type: "question",
      title: "Modalidad de prestación",
      prompt: "¿Qué modalidad tendrá el DPO: interno o externo?",
      why_it_matters:
        "La modalidad determina la evidencia exigible: contrato cuando sea externo e identificación expresa de persona natural cuando el prestador sea persona jurídica.",
      fact_key: MODALITY_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "internal",
          label: "Interno",
          description: "Persona de la propia organización.",
          fact_effect: { fact_key: MODALITY_FACT, value: "internal" },
        },
        {
          value: "external_individual",
          label: "Externo, persona natural",
          description: "Prestador externo que es persona natural.",
          fact_effect: { fact_key: MODALITY_FACT, value: "external_individual" },
        },
        {
          value: "external_entity",
          label: "Externo, persona jurídica",
          description:
            "Prestador externo que es persona jurídica: exige identificar expresamente a la persona natural.",
          fact_effect: { fact_key: MODALITY_FACT, value: "external_entity" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: MODALITY_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: ["contrato cuando sea externo"],
      required_facts: [],
      default_next_node_key: "natural-person",
      provenance: "legal_requirement",
    },
    {
      node_key: "natural-person",
      node_type: "question",
      title: "Persona natural identificada",
      prompt:
        "¿Quedó identificada expresamente la persona natural que actuará como DPO?",
      why_it_matters:
        "Cuando el servicio lo presta una persona jurídica, la designación solo queda individualizada con la persona natural expresamente identificada.",
      fact_key: "dpo.designation_natural_person",
      answer_type: "single_select",
      options: conditionalOptions(
        "dpo.designation_natural_person",
        "El DPO es interno o persona natural directa: la individualización queda en el acto de designación.",
      ),
      evidence_to_review: [
        "identificación de persona natural cuando el prestador sea persona jurídica",
      ],
      help_text: [
        "Solo exigible cuando el servicio lo presta una persona jurídica. En los demás casos marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "group-conditions",
      provenance: "legal_requirement",
    },
    {
      node_key: "group-conditions",
      node_type: "question",
      title: "Condiciones de DPO común de grupo",
      prompt:
        "¿Quedaron verificadas las condiciones aplicables al DPO común de grupo empresarial?",
      why_it_matters:
        "Un DPO común para un grupo empresarial solo es válido cuando cumple sus condiciones aplicables.",
      fact_key: "dpo.designation_group_conditions",
      answer_type: "single_select",
      options: conditionalOptions(
        "dpo.designation_group_conditions",
        "No existe DPO común para grupo empresarial en este caso.",
      ),
      evidence_to_review: [
        "condiciones aplicables al DPO común cuando exista",
      ],
      help_text: [
        "Cuando no exista DPO común para grupo empresarial, marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "suitability",
      provenance: "legal_requirement",
    },
    {
      node_key: "suitability",
      node_type: "question",
      title: "Idoneidad inicial",
      prompt: "¿Se verificó la idoneidad inicial del DPO?",
      why_it_matters:
        "La designación exige una verificación inicial de idoneidad respaldada en antecedentes revisables.",
      fact_key: "dpo.designation_suitability",
      answer_type: "single_select",
      options: stateOptions("dpo.designation_suitability"),
      evidence_to_review: ["antecedentes de idoneidad"],
      required_facts: [],
      default_next_node_key: "formalization",
      provenance: "legal_requirement",
    },
    {
      node_key: "formalization",
      node_type: "question",
      title: "Formalización con fecha efectiva",
      prompt:
        "¿Quedó formalizada la designación con fecha efectiva e identificación completa?",
      why_it_matters:
        "Sin acto formal con fecha efectiva e identificación, la designación no queda trazable ni oponible.",
      fact_key: "dpo.designation_formalization",
      answer_type: "single_select",
      options: stateOptions("dpo.designation_formalization"),
      evidence_to_review: [
        "acto o documento de designación",
        "fecha efectiva",
        "identificación del DPO",
        "contrato cuando sea externo",
      ],
      help_text: [
        "Verifica acto existente, fecha efectiva explícita, identificación completa y, cuando corresponda, contrato e identificación de persona natural.",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de la designación",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "trigger-still-undefined",
          description:
            "El antecedente sigue sin definirse: deriva a evaluar necesidad.",
          when: {
            op: "fact_equals",
            fact_key: TRIGGER_FACT,
            value: "undecided",
          },
          goto_outcome_key: "prerequisite_pending",
          explanation:
            "Aún no se define si corresponde designar. Primero corresponde evaluar la necesidad.",
        },
        {
          rule_id: "entity-without-natural-person",
          description:
            "Prestador persona jurídica sin persona natural identificada.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: MODALITY_FACT,
                value: "external_entity",
              },
              {
                op: "fact_equals",
                fact_key: "dpo.designation_natural_person",
                value: "na",
              },
            ],
          },
          goto_outcome_key: "designation_in_progress",
          explanation:
            "La modalidad externa con persona jurídica exige identificación expresa de la persona natural: no admite No aplica.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: la designación sigue en curso.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "designation_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La designación aún no queda formalizada.",
        },
        {
          rule_id: "all-verified",
          description:
            "Antecedente, autoridad, modalidad, individualización, grupo, idoneidad y formalización verificados.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_in",
                fact_key: TRIGGER_FACT,
                values: ["mpi_requirement", "voluntary"],
              },
              isDone("dpo.designation_authority"),
              {
                op: "fact_in",
                fact_key: MODALITY_FACT,
                values: ["internal", "external_individual", "external_entity"],
              },
              verifiedOrNa("dpo.designation_natural_person"),
              verifiedOrNa("dpo.designation_group_conditions"),
              isDone("dpo.designation_suitability"),
              isDone("dpo.designation_formalization"),
            ],
          },
          goto_outcome_key: "designation_complete",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "designation_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "designation_complete",
      label: "Designación formalizada y trazable",
      classification: "legal_requirement",
      explanation:
        "El antecedente, la autoridad, la modalidad, la individualización, las condiciones de grupo, la idoneidad y la formalización con fecha efectiva quedaron verificados.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Validar la gobernanza inicial del DPO en D1.09",
          activity_key: "dpo.initial_governance_validation",
        },
        {
          kind: "info",
          label: "Conservar el expediente de designación",
          note: "Archiva acto o documento de designación, fecha efectiva, identificación del DPO, contrato cuando sea externo e identificación de persona natural cuando corresponda, con antecedentes de idoneidad.",
        },
      ],
    },
    {
      outcome_key: "designation_in_progress",
      label: "Designación en curso",
      classification: "agency_standard",
      explanation:
        "Quedan verificaciones pendientes o sin información. Completa cada punto y conserva su evidencia.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "prerequisite_pending",
      label: "Antecedente aún sin definir",
      classification: "agency_standard",
      explanation:
        "Sin requerimiento vigente ni decisión voluntaria no inicia la designación.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Definir la necesidad en D1.02",
          activity_key: "dpo.need_assessment",
        },
      ],
    },
  ],
};
