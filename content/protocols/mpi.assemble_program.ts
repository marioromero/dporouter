import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.18.
 *
 * activity_key = mpi.assemble_program (procedure). Contenido aprobado
 * por la iteración vigente; usa exclusivamente pasos, evidencia, legal
 * basis, dependencias y aplicabilidad del contenido canónico D1.18. Los
 * diez componentes son verificaciones independientes: no se convierten
 * en árbol artificial.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04 o Diagnóstico (`mpi.lifecycle_status` declarado en
 * `external_fact_keys`): es prerrequisito de entrada y objeto del
 * efecto definitivo, nunca una re-evaluación de adopción. Las
 * dependencias con actividades previas se presentan como actividades
 * relacionadas y evidencia de entrada, sin duplicar su trabajo.
 *
 * Los diez pasos canónicos se verifican como nueve componentes: el
 * décimo paso (actualizar el ciclo de vida) es el efecto definitivo,
 * no una verificación.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";

const COMPONENT_FACTS = [
  "mpi.assembly.responsible_identified",
  "mpi.assembly.dpo_verified",
  "mpi.assembly.treatments_characterized",
  "mpi.assembly.risks_identified",
  "mpi.assembly.protocols_verified",
  "mpi.assembly.obligations_verified",
  "mpi.assembly.integration_verified",
  "mpi.assembly.diffusion_verified",
  "mpi.assembly.evidence_consolidated",
];

/** Estados de adopción que habilitan el ensamblaje (canon D1.18).
 * `implemented` se incluye para re-verificación idempotente: el propio
 * state_effect produce ese valor y la aplicabilidad textual cubre la
 * entrada inicial al programa. */
const ASSEMBLY_ELIGIBLE = ["adoption_formalized", "implementing", "implemented"];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function lifecycleEligible(): FactCondition {
  return { op: "fact_in", fact_key: LIFECYCLE_FACT, values: ASSEMBLY_ELIGIBLE };
}

function stateOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "Implementado y respaldado con evidencia.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "Aún no implementado o sin evidencia suficiente.",
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

function componentNode(
  node_key: string,
  title: string,
  prompt: string,
  factKey: string,
  evidence_to_review: string[],
  next: string,
  extra?: {
    help_text?: string[];
    related_activity_keys?: string[];
  },
) {
  return {
    node_key,
    node_type: "question" as const,
    title,
    prompt,
    fact_key: factKey,
    answer_type: "single_select" as const,
    options: stateOptions(factKey),
    evidence_to_review,
    ...(extra?.help_text ? { help_text: extra.help_text } : {}),
    required_facts: [] as string[],
    default_next_node_key: next,
    ...(extra?.related_activity_keys
      ? { related_activity_keys: extra.related_activity_keys }
      : {}),
    provenance: "legal_requirement" as const,
  };
}

export const MPI_ASSEMBLE_PROGRAM_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.assemble_program.v1",
  activity_key: "mpi.assemble_program",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de ensamblaje del programa MPI",
  description:
    "Verifica que cada componente mínimo del MPI esté operativo, detecta faltantes con su evidencia y conduce hasta el programa implementado cuando corresponde.",
  entry_node_key: "verify-responsible",
  decision_fact_keys: COMPONENT_FACTS,
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    componentNode(
      "verify-responsible",
      "Individualización del responsable",
      "¿Quedó verificada la individualización del responsable y su representante cuando corresponda?",
      "mpi.assembly.responsible_identified",
      ["evidencia de cada componente", "programa de cumplimiento consolidado"],
      "verify-dpo",
    ),
    componentNode(
      "verify-dpo",
      "DPO, medios y facultades",
      "¿Quedaron verificados el DPO, sus medios y facultades dentro del programa?",
      "mpi.assembly.dpo_verified",
      ["evidencia de cada componente", "expediente de designación DPO"],
      "characterize-treatments",
      {
        help_text: [
          "Usa la designación y validación D1.08/D1.09 como insumo cuando existan; esta verificación constata su integración al programa.",
        ],
        related_activity_keys: ["dpo.designate"],
      },
    ),
    componentNode(
      "characterize-treatments",
      "Caracterización de tratamientos y titulares",
      "¿Quedó verificada la caracterización de tratamientos y titulares del programa?",
      "mpi.assembly.treatments_characterized",
      ["evidencia de cada componente", "inventario de tratamientos D2 si existe"],
      "identify-risks",
      {
        help_text: [
          "Cuando D2 haya sido importado, su inventario alimenta este componente.",
        ],
        related_activity_keys: ["treatment.inventory_create"],
      },
    ),
    componentNode(
      "identify-risks",
      "Actividades y riesgos relevantes",
      "¿Quedó verificada la identificación de actividades y riesgos relevantes del programa?",
      "mpi.assembly.risks_identified",
      ["evidencia de cada componente", "matriz de brechas"],
      "verify-protocols",
    ),
    componentNode(
      "verify-protocols",
      "Protocolos y procedimientos preventivos",
      "¿Quedaron verificados los protocolos, reglas y procedimientos preventivos del programa?",
      "mpi.assembly.protocols_verified",
      ["evidencia de cada componente", "programa de cumplimiento consolidado"],
      "verify-obligations",
      {
        related_activity_keys: ["governance.preventive_framework"],
      },
    ),
    componentNode(
      "verify-obligations",
      "Obligaciones internas y canal de denuncia",
      "¿Quedaron verificadas las obligaciones internas, el régimen disciplinario y el canal de denuncia?",
      "mpi.assembly.obligations_verified",
      ["evidencia de cada componente"],
      "verify-integration",
      {
        help_text: [
          "Usa el reporte interno, el régimen disciplinario y la regulación integrada como insumo cuando existan.",
        ],
        related_activity_keys: [
          "mpi.internal_reporting_and_whistleblowing",
          "mpi.internal_disciplinary_framework",
          "mpi.internal_regulation_integrate",
        ],
      },
    ),
    componentNode(
      "verify-integration",
      "Integración contractual e interna",
      "¿Quedó verificada la integración contractual e interna exigible del programa?",
      "mpi.assembly.integration_verified",
      ["evidencia de cada componente", "programa de cumplimiento consolidado"],
      "verify-diffusion",
    ),
    componentNode(
      "verify-diffusion",
      "Difusión del programa",
      "¿Quedó verificada la difusión del programa a sus destinatarios?",
      "mpi.assembly.diffusion_verified",
      ["evidencia de cada componente"],
      "consolidate-evidence",
    ),
    componentNode(
      "consolidate-evidence",
      "Evidencia y brechas",
      "¿Quedó consolidada la evidencia con su matriz de brechas y el cierre de las obligatorias?",
      "mpi.assembly.evidence_consolidated",
      [
        "índice de componentes",
        "matriz de brechas",
        "evidencia de cierre de brechas obligatorias",
      ],
      "final-confirmation",
    ),
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del programa",
      prompt:
        "El sistema verifica el prerrequisito de adopción y que cada componente esté operativo.",
      answer_type: "none",
      required_facts: [LIFECYCLE_FACT, ...COMPONENT_FACTS],
      transitions: [
        {
          rule_id: "not-adopted",
          description:
            "Sin adopción formalizada no inicia el ensamblaje.",
          when: { op: "not", condition: lifecycleEligible() },
          goto_outcome_key: "not_started",
          explanation:
            "El programa se implementa después de la decisión de adopción. Primero corresponde formalizarla.",
        },
        {
          rule_id: "pending-components",
          description:
            "Algún componente está pendiente o sin información: el programa sigue en ensamblaje.",
          when: { op: "any", conditions: COMPONENT_FACTS.map(unresolved) },
          goto_outcome_key: "assembly_in_progress",
          explanation:
            "Existen componentes pendientes o sin información suficiente. El programa aún no queda implementado.",
        },
        {
          rule_id: "all-operative",
          description:
            "Adopción vigente y los nueve componentes operativos.",
          when: {
            op: "all",
            conditions: [
              lifecycleEligible(),
              ...COMPONENT_FACTS.map(isDone),
            ],
          },
          goto_outcome_key: "assembly_complete",
          explanation:
            "Todos los componentes exigibles están implementados y respaldados.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en ensamblaje.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assembly_in_progress",
          explanation:
            "El procedimiento no está completo: revisa los componentes pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "assembly_complete",
      label: "Programa MPI implementado",
      classification: "legal_requirement",
      explanation:
        "La adopción está vigente y los nueve componentes quedaron verificados como operativos.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "mpi.lifecycle_status", value: "implemented" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Seguimiento del ciclo de vida del programa",
          activity_key: "mpi.lifecycle_review",
        },
        {
          kind: "info",
          label: "Conservar el programa consolidado",
          note: "Archiva el programa de cumplimiento consolidado con su índice de componentes, la evidencia de cada uno, la matriz de brechas y la evidencia de cierre de las obligatorias.",
        },
      ],
    },
    {
      outcome_key: "assembly_in_progress",
      label: "Programa en ensamblaje",
      classification: "agency_standard",
      explanation:
        "Quedan componentes pendientes o sin información. Completa cada punto y conserva su evidencia.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "not_started",
      label: "Aún sin adopción formalizada",
      classification: "agency_standard",
      explanation:
        "Sin adopción vigente no inicia el ensamblaje.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Formalizar la adopción en D1.04",
          activity_key: "mpi.formalize_adoption",
        },
      ],
    },
  ],
};
