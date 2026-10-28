import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.04.
 *
 * activity_key = mpi.formalize_adoption (procedure). Contenido aprobado
 * por la iteración vigente; usa exclusivamente requisitos, pasos, state
 * effects, dependencias, legal basis y evidencia del contenido canónico
 * D1.04. No recrea D1.03: la ausencia de decisión deriva a D1.03.
 *
 * Calibración de modo: los pasos procedurales se representan como
 * verificaciones de hechos ("¿quedó verificado y registrado?"), no como
 * preguntas de descubrimiento. answer_type single_select con estados
 * explícitos Pendiente / Verificado; nunca yes_no_unknown ambiguo.
 *
 * Auditoría de materialización (reconciliación D1): el state_effect es
 * un bundle indivisible del acto de adopción (lifecycle + fecha
 * efectiva + referencia de evidencia + activación del requerimiento
 * DPO con fuente y fecha). Separar `lifecycle = adoption_formalized`
 * dejaría un estado parcial sin trazabilidad (cuándo, con qué
 * evidencia, qué requerimiento activa): no se materializa ninguno
 * parcialmente. Sin efectos declarados: execution-ready,
 * product-ready=false (gap lifecycle/histórico del bundle de adopción).
 */

const VERIFICATION_FACTS = [
  "mpi.adoption_decided",
  "mpi.adoption_evidence_ready",
  "mpi.lifecycle_update_recorded",
  "mpi.dpo_requirement_activated",
];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
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

export const MPI_FORMALIZE_ADOPTION_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.formalize_adoption.v1",
  activity_key: "mpi.formalize_adoption",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de formalización de adopción MPI",
  description:
    "Guía al profesional desde la decisión de adoptar el MPI hasta su formalización efectiva con evidencia suficiente: decisión, evidencia, fecha efectiva, ciclo de vida y requerimiento de DPO.",
  entry_node_key: "adoption-decision",
  decision_fact_keys: VERIFICATION_FACTS,
  last_review: "2026-09-22",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "adoption-decision",
      node_type: "question",
      title: "Decisión efectiva de adoptar",
      prompt: "¿La máxima autoridad decidió adoptar efectivamente un MPI?",
      why_it_matters:
        "Este procedimiento parte de una decisión ya tomada. Sin decisión efectiva no hay nada que formalizar; corresponde evaluar conveniencia.",
      fact_key: "mpi.adoption_decided",
      answer_type: "single_select",
      options: [
        {
          value: "yes",
          label: "Sí, decisión adoptada",
          description: "La máxima autoridad decidió adoptar el MPI.",
          fact_effect: { fact_key: "mpi.adoption_decided", value: "yes" },
        },
        {
          value: "no",
          label: "No hay decisión",
          description: "Aún no se decide adoptar un MPI.",
          fact_effect: { fact_key: "mpi.adoption_decided", value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "mpi.adoption_decided", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "actas o registros de decisión interna",
        "comunicaciones de la máxima autoridad",
      ],
      evidence_review_help: [
        {
          evidence_item: "actas o registros de decisión interna",
          review_guide:
            "El registro debe permitir verificar que la máxima autoridad adoptó efectivamente la decisión de implementar un MPI. Debe distinguirse una decisión expresa de propuestas, evaluaciones de conveniencia o preparativos que todavía no acrediten la adopción.",
          no_evidence_guidance:
            "Se deben identificar los antecedentes internos pendientes de localizar y las áreas que podrían confirmar si la decisión fue adoptada. La falta de un acta localizada no demuestra por sí sola que no exista una decisión efectiva.",
          expected_result:
            "Una conclusión sustentada sobre la existencia o ausencia de evidencia suficiente de una decisión efectiva de adopción del MPI.",
        },
        {
          evidence_item: "comunicaciones de la máxima autoridad",
          review_guide:
            "Las comunicaciones deben permitir establecer si la máxima autoridad expresó una decisión efectiva de adoptar el MPI y cuál fue su alcance. Deben diferenciarse las instrucciones definitivas de las consultas, intenciones preliminares o manifestaciones de apoyo que no confirmen por sí solas la adopción.",
          no_evidence_guidance:
            "Se deben señalar las comunicaciones pendientes de verificar y las personas o áreas que podrían confirmar el sentido de la decisión. No debe inferirse la adopción únicamente a partir de conversaciones informales o señales indirectas.",
          expected_result:
            "Antecedentes que permitan confirmar si la máxima autoridad adoptó efectivamente la decisión o si corresponde continuar evaluando su conveniencia antes de formalizarla.",
        },
      ],
      required_facts: [],
      default_next_node_key: "adoption-evidence",
      transitions: [
        {
          rule_id: "no-decision",
          description: "Sin decisión de adoptar no inicia la formalización.",
          when: {
            op: "fact_equals",
            fact_key: "mpi.adoption_decided",
            value: "no",
          },
          goto_outcome_key: "not_started",
          explanation:
            "No existe decisión efectiva de adoptar. Este procedimiento parte de la decisión; primero corresponde evaluar conveniencia.",
        },
      ],
      related_activity_keys: ["mpi.need_assessment"],
      provenance: "agency_standard",
    },
    {
      node_key: "adoption-evidence",
      node_type: "question",
      title: "Evidencia interna de la decisión",
      prompt:
        "¿Existe evidencia interna fechada de la decisión con autoridad y referencia documental?",
      why_it_matters:
        "La formalización exige trazabilidad: sin evidencia interna fechada la adopción no queda registrada.",
      fact_key: "mpi.adoption_evidence_ready",
      answer_type: "single_select",
      options: stateOptions("mpi.adoption_evidence_ready"),
      evidence_to_review: [
        "acta, resolución, acuerdo o evidencia interna equivalente",
        "fecha efectiva",
        "autoridad que adopta",
        "referencia documental",
      ],
      evidence_review_help: [
        {
          evidence_item: "acta, resolución, acuerdo o evidencia interna equivalente",
          review_guide:
            "La evidencia debe permitir vincular un registro interno identificable con la decisión efectiva de adoptar el MPI. Debe distinguirse el documento que acredita la decisión de los antecedentes preparatorios o de las evaluaciones de conveniencia que no demuestran por sí solos que fue adoptada.",
          no_evidence_guidance:
            "Se deben señalar los registros pendientes de localizar y las áreas que podrían confirmar su existencia. La falta de un documento localizado no demuestra por sí sola que la decisión no haya ocurrido.",
          expected_result:
            "Un registro interno identificable que permita sustentar la decisión de adoptar el MPI o dejar constancia de que aún no se dispone de evidencia suficiente.",
        },
        {
          evidence_item: "fecha efectiva",
          review_guide:
            "La fecha debe permitir determinar cuándo se adoptó efectivamente la decisión, diferenciándola de la fecha de elaboración del documento, de una comunicación posterior o de una propuesta preliminar.",
          no_evidence_guidance:
            "Se debe indicar si la fecha no figura, resulta ambigua o no puede vincularse con la decisión efectiva. No debe inferirse una fecha únicamente a partir de la creación o archivo del documento.",
          expected_result:
            "Una fecha efectiva explícita y respaldada, o una limitación documentada cuando los antecedentes no permitan establecerla.",
        },
        {
          evidence_item: "autoridad que adopta",
          review_guide:
            "Los antecedentes deben identificar a la máxima autoridad que adoptó la decisión o permitir establecer de forma verificable su intervención y competencia. La participación de un equipo técnico o de una persona delegada no acredita por sí sola que la decisión corresponda a la autoridad requerida.",
          no_evidence_guidance:
            "Se debe precisar qué identificación o antecedente de autoridad falta y qué registro permitiría confirmarlo. No debe atribuirse la decisión a una autoridad basándose únicamente en su cargo o participación en el proceso.",
          expected_result:
            "La identificación verificable de la autoridad que adoptó la decisión y de su intervención en el acto.",
        },
        {
          evidence_item: "referencia documental",
          review_guide:
            "La referencia debe permitir localizar y recuperar el registro que acredita la decisión, por ejemplo, mediante un identificador, código, ubicación de archivo o sistema documental. Debe ser suficientemente precisa para distinguir el antecedente de otros documentos similares.",
          no_evidence_guidance:
            "Se debe indicar qué dato de identificación o localización falta y si el documento puede recuperarse por otra vía verificable. No debe inventarse una referencia para completar el registro.",
          expected_result:
            "Una referencia archivable que permita recuperar la evidencia de la decisión, o una limitación identificada que impida asegurar su trazabilidad.",
        },
      ],
      help_text: [
        "Verifica cada elemento: documento existente, fecha efectiva explícita, autoridad identificada y referencia archivable.",
      ],
      required_facts: [],
      default_next_node_key: "lifecycle-update",
      provenance: "agency_standard",
    },
    {
      node_key: "lifecycle-update",
      node_type: "question",
      title: "Actualización del ciclo de vida MPI",
      prompt: "¿Quedó registrado el ciclo de vida del MPI como adopción formalizada?",
      why_it_matters:
        "El registro del ciclo de vida activa los estados organizacionales que se derivan de la adopción.",
      fact_key: "mpi.lifecycle_update_recorded",
      answer_type: "single_select",
      options: stateOptions("mpi.lifecycle_update_recorded"),
      evidence_to_review: ["registro interno del lifecycle MPI"],
      evidence_review_help: [
        {
          evidence_item: "registro interno del lifecycle MPI",
          review_guide:
            "El registro debe reflejar que la decisión efectiva de adoptar el MPI quedó formalizada en el ciclo de vida de la organización. Debe existir coherencia entre la evidencia de la decisión, el estado registrado y la secuencia de actividades del procedimiento. El cambio de estado debe poder rastrearse sin confundir la decisión con una intención preliminar.",
          no_evidence_guidance:
            "Se deben identificar los datos del ciclo de vida que no pudieron confirmarse y los antecedentes necesarios para verificar el estado registrado. La ausencia de un registro localizado no demuestra por sí sola que la decisión no haya sido adoptada ni autoriza a inferir que el sistema actualizó el estado automáticamente.",
          expected_result:
            "Un registro interno verificable que refleje la adopción formalizada del MPI y permita vincular el estado organizacional con la evidencia de la decisión. Las discrepancias o actualizaciones pendientes deben quedar identificadas para su resolución.",
        },
      ],
      required_facts: [],
      default_next_node_key: "dpo-requirement",
      related_activity_keys: ["mpi.lifecycle_review"],
      provenance: "agency_standard",
    },
    {
      node_key: "dpo-requirement",
      node_type: "question",
      title: "Requerimiento de DPO activado",
      prompt:
        "¿Quedó activado el requerimiento de contar con DPO derivado del MPI?",
      why_it_matters:
        "Un MPI formalmente activo requiere DPO como componente del programa. Esta verificación no redefine la lógica de DPO: solo constata la activación del requerimiento ya previsto.",
      fact_key: "mpi.dpo_requirement_activated",
      answer_type: "single_select",
      options: stateOptions("mpi.dpo_requirement_activated"),
      evidence_to_review: [
        "registro del requerimiento de DPO",
        "fuente del requerimiento (MPI)",
      ],
      evidence_review_help: [
        {
          evidence_item: "registro del requerimiento de DPO",
          review_guide:
            "El registro debe permitir verificar que el requerimiento de contar con un DPO quedó activado como consecuencia de la adopción formalizada del MPI. Debe existir coherencia entre el estado del MPI y el requerimiento reflejado en el sistema, sin confundir su activación con el nombramiento efectivo de una persona.",
          no_evidence_guidance:
            "Se deben identificar los antecedentes que faltan para confirmar la activación y el estado que actualmente figura en el sistema. La ausencia de un registro localizado no demuestra por sí sola que no exista un requerimiento configurado ni permite presumir que la activación ocurrió correctamente.",
          expected_result:
            "Un registro verificable del requerimiento de DPO, coherente con la adopción formalizada del MPI, o una descripción clara de las discrepancias y de la información pendiente de confirmar.",
        },
        {
          evidence_item: "fuente del requerimiento (MPI)",
          review_guide:
            "La fuente registrada debe permitir vincular expresamente el requerimiento de DPO con la adopción del MPI. La trazabilidad debe distinguir este origen de otros factores, decisiones o fundamentos jurídicos que pudieran generar un requerimiento independiente, sin atribuir automáticamente todos los casos a la adopción del programa.",
          no_evidence_guidance:
            "Se deben señalar los antecedentes que impiden confirmar el origen del requerimiento y la relación que falta establecer con el MPI. No debe inferirse esa relación únicamente porque el estado del programa figure como activo o porque exista una evaluación previa sobre la necesidad de contar con un DPO.",
          expected_result:
            "Una fuente identificable que vincule el requerimiento de DPO con la adopción formalizada del MPI y permita comprender el motivo de su activación, con las limitaciones documentadas cuando esa relación no pueda verificarse.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de formalización",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: la formalización sigue en curso.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "formalization_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La adopción aún no queda formalizada.",
        },
        {
          rule_id: "all-verified",
          description:
            "Decisión, evidencia, ciclo de vida y requerimiento de DPO verificados.",
          when: { op: "all", conditions: VERIFICATION_FACTS.map(isDone) },
          goto_outcome_key: "formalization_complete",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "formalization_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "formalization_complete",
      label: "Adopción formalizada y evidenciada",
      classification: "agency_standard",
      explanation:
        "La decisión, la evidencia interna fechada, el ciclo de vida y el requerimiento de DPO quedaron verificados.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Con el requerimiento activo, continuar con designación de DPO",
          activity_key: "dpo.designate",
        },
      ],
    },
    {
      outcome_key: "formalization_in_progress",
      label: "Formalización en curso",
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
      outcome_key: "not_started",
      label: "Aún sin decisión de adoptar",
      classification: "agency_standard",
      explanation:
        "Sin decisión efectiva de la máxima autoridad no inicia la formalización.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Evaluar conveniencia de adoptar en D1.03",
          activity_key: "mpi.need_assessment",
        },
      ],
    },
  ],
};
