import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.06.
 *
 * activity_key = mpi.internal_disciplinary_framework (procedure).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D1.06. Verifica existencia, integración,
 * procedimiento, coherencia y aprobación: no inventa sanciones,
 * gravedades, scoring ni reglas disciplinarias.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04 o Diagnóstico (`mpi.lifecycle_status` declarado en
 * `external_fact_keys`): es prerrequisito de entrada, nunca una
 * re-evaluación de adopción.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";

const COMPONENT_FACTS = [
  "mpi.disciplinary.existing_mapped",
  "mpi.disciplinary.breaches_integrated",
  "mpi.disciplinary.procedure_defined",
  "mpi.disciplinary.coherence_verified",
  "mpi.disciplinary.approved",
];

/** Estados de adopción que habilitan la implementación (canon D1.06). */
const ELIGIBLE = ["adoption_formalized", "implementing", "implemented"];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function lifecycleEligible(): FactCondition {
  return { op: "fact_in", fact_key: LIFECYCLE_FACT, values: ELIGIBLE };
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

export const MPI_DISCIPLINARY_FRAMEWORK_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.internal_disciplinary_framework.v1",
  activity_key: "mpi.internal_disciplinary_framework",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del régimen disciplinario interno",
  description:
    "Verifica que el régimen disciplinario interno asociado al MPI exista, integre los incumplimientos, defina su procedimiento y quede aprobado con coherencia laboral y contractual.",
  entry_node_key: "map-existing",
  decision_fact_keys: COMPONENT_FACTS,
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "map-existing",
      node_type: "question",
      title: "Mecanismos disciplinarios existentes",
      prompt:
        "¿Quedaron identificados los mecanismos disciplinarios existentes?",
      why_it_matters:
        "El régimen se construye sobre lo existente: sin levantamiento no es posible integrar ni detectar vacíos.",
      fact_key: "mpi.disciplinary.existing_mapped",
      answer_type: "single_select",
      options: stateOptions("mpi.disciplinary.existing_mapped"),
      evidence_to_review: [
        "régimen interno de sanciones",
        "revisión de normativa laboral interna",
      ],
      evidence_review_help: [
        {
          evidence_item: "régimen interno de sanciones",
          review_guide:
            "La revisión debe identificar las sanciones internas actualmente previstas, las conductas a las que se aplican y las personas o funciones comprendidas en su alcance. También debe determinar si las reglas forman parte de un instrumento vigente o de una práctica documentada, distinguiendo las disposiciones formalizadas de las propuestas que aún no han sido aprobadas. Este levantamiento sirve como base para evaluar cómo integrar los incumplimientos relacionados con la protección de datos y el MPI.",
          no_evidence_guidance:
            "Se deben señalar los instrumentos consultados y los aspectos del régimen que no pudieron confirmarse, como las sanciones previstas, su alcance o su vigencia. La ausencia de un documento con ese título no demuestra por sí sola que no existan reglas disciplinarias, ya que podrían estar incorporadas en otros instrumentos internos o contractuales que deban revisarse.",
          expected_result:
            "Una identificación documentada de los mecanismos de sanción existentes, sus fuentes, alcance y estado de vigencia, junto con los vacíos o dudas que requieren análisis posterior. La conclusión debe distinguir entre reglas verificadas, prácticas cuya formalización no se ha confirmado y mecanismos que no pudieron localizarse, sin presumir que las sanciones existentes cubren automáticamente los incumplimientos del MPI.",
        },
        {
          evidence_item: "revisión de normativa laboral interna",
          review_guide:
            "La revisión debe identificar la normativa laboral interna aplicable y determinar qué disposiciones regulan las obligaciones de las personas trabajadoras, las medidas disciplinarias y el procedimiento para aplicarlas. Cuando corresponda, deben considerarse el reglamento interno de orden, higiene y seguridad, los contratos y otros instrumentos pertinentes. El análisis debe permitir reconocer las condiciones que el futuro régimen MPI deberá respetar, sin asumir que todos los instrumentos resultan aplicables a cualquier organización.",
          no_evidence_guidance:
            "Se deben indicar los instrumentos laborales o contractuales que no pudieron localizarse y los aspectos de su aplicabilidad, vigencia o contenido que permanecen sin confirmar. La falta de un documento en el expediente revisado no demuestra por sí sola que no exista regulación aplicable; las conclusiones deben limitarse a los antecedentes efectivamente disponibles.",
          expected_result:
            "Una revisión identificable de la normativa laboral interna pertinente, con las disposiciones disciplinarias relevantes y las condiciones que podrían afectar la integración del régimen MPI. Las incompatibilidades potenciales, los instrumentos pendientes de consulta y las cuestiones que requieran validación jurídica deben quedar señalados para las etapas posteriores.",
        },
      ],
      required_facts: [],
      default_next_node_key: "integrate-breaches",
      provenance: "legal_requirement",
    },
    {
      node_key: "integrate-breaches",
      node_type: "question",
      title: "Integración de incumplimientos",
      prompt:
        "¿Quedaron integrados los incumplimientos de protección de datos y del MPI?",
      why_it_matters:
        "Sin integración los incumplimientos del programa quedan fuera del régimen aplicable.",
      fact_key: "mpi.disciplinary.breaches_integrated",
      answer_type: "single_select",
      options: stateOptions("mpi.disciplinary.breaches_integrated"),
      evidence_to_review: ["régimen interno de sanciones"],
      evidence_review_help: [
        {
          evidence_item: "régimen interno de sanciones",
          review_guide:
            "El régimen debe contemplar incumplimientos de las normas de protección de datos y de las reglas del propio MPI. La revisión debe permitir identificar ambos ámbitos en las conductas sujetas a medidas internas y determinar si el alcance previsto cubre las obligaciones y procedimientos relevantes del programa.",
          no_evidence_guidance:
            "Se deben señalar los ámbitos de incumplimiento que no pudieron confirmarse en el régimen revisado. La mención general a la protección de datos no demuestra que estén incluidos los incumplimientos del MPI, ni viceversa; corresponde identificar qué cobertura falta o requiere aclaración.",
          expected_result:
            "Un régimen interno que permita reconocer la cobertura de los incumplimientos de protección de datos y del MPI, indicando los vacíos o ambigüedades que requieran ajuste. La evidencia debe permitir distinguir entre ambos ámbitos sin presumir que uno incluye automáticamente al otro.",
        },
      ],
      required_facts: [],
      default_next_node_key: "define-procedure",
      provenance: "legal_requirement",
    },
    {
      node_key: "define-procedure",
      node_type: "question",
      title: "Procedimiento interno aplicable",
      prompt: "¿Quedó definido el procedimiento interno aplicable?",
      why_it_matters:
        "Sin procedimiento las consecuencias quedan a discreción y pierden trazabilidad.",
      fact_key: "mpi.disciplinary.procedure_defined",
      answer_type: "single_select",
      options: stateOptions("mpi.disciplinary.procedure_defined"),
      evidence_to_review: ["procedimiento disciplinario"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento disciplinario",
          review_guide:
            "El procedimiento debe definir cómo se tramitan los posibles incumplimientos, quién interviene en cada etapa y cómo se documentan las decisiones. La revisión debe permitir comprender cómo se aplican las medidas previstas y cómo se mantiene la trazabilidad del proceso.",
          no_evidence_guidance:
            "Se deben identificar las etapas, responsabilidades o registros que no pudieron confirmarse. La existencia de sanciones previstas no demuestra que haya un procedimiento definido para aplicarlas; los aspectos no acreditados deben quedar señalados para su revisión.",
          expected_result:
            "Un procedimiento identificable que describa las etapas de tramitación, las responsabilidades relevantes y la documentación de las decisiones. Las brechas que puedan afectar la aplicación coherente de las medidas o la trazabilidad deben quedar expresamente identificadas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "verify-coherence",
      provenance: "legal_requirement",
    },
    {
      node_key: "verify-coherence",
      node_type: "question",
      title: "Coherencia laboral y contractual",
      prompt:
        "¿Se verificó la coherencia con la regulación laboral y contractual aplicable?",
      why_it_matters:
        "Un régimen incoherente con la regulación aplicable queda expuesto a impugnación.",
      fact_key: "mpi.disciplinary.coherence_verified",
      answer_type: "single_select",
      options: stateOptions("mpi.disciplinary.coherence_verified"),
      evidence_to_review: [
        "trazabilidad con regulación interna aplicable",
        "régimen interno de sanciones",
      ],
      evidence_review_help: [
        {
          evidence_item: "trazabilidad con regulación interna aplicable",
          review_guide:
            "La revisión debe relacionar el régimen MPI con los instrumentos laborales, contractuales o internos que correspondan a la organización. Debe permitir identificar las disposiciones pertinentes y comprobar si existen contradicciones o requisitos de incorporación pendientes.",
          no_evidence_guidance:
            "Se deben señalar los instrumentos consultados y los aspectos de coherencia que no pudieron verificarse. La falta de una referencia explícita no demuestra por sí sola una incompatibilidad; puede ser necesario revisar el contenido de los instrumentos aplicables.",
          expected_result:
            "Una relación verificable entre el régimen MPI y la regulación aplicable, con las disposiciones pertinentes y las incompatibilidades o dudas identificadas. Los aspectos no confirmados deben quedar pendientes de revisión, sin presumir cumplimiento ni incumplimiento.",
        },
        {
          evidence_item: "régimen interno de sanciones",
          review_guide:
            "El régimen debe describir las sanciones previstas y las conductas a las que se aplican, de forma compatible con las normas laborales y contractuales pertinentes. La revisión debe considerar el alcance de las medidas y su coherencia con los instrumentos internos vigentes.",
          no_evidence_guidance:
            "Se deben identificar las sanciones, conductas o condiciones de aplicación que no pudieron verificarse. La existencia de un régimen formal no acredita por sí sola su coherencia jurídica; los puntos dudosos deben contrastarse con la regulación aplicable.",
          expected_result:
            "Un régimen de sanciones identificable cuya coherencia laboral y contractual haya sido revisada, con incompatibilidades o cuestiones pendientes expresamente señaladas. La evidencia debe permitir fundamentar la revisión sin asumir que toda medida prevista resulta jurídicamente procedente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "formalize-approved",
      provenance: "legal_requirement",
    },
    {
      node_key: "formalize-approved",
      node_type: "question",
      title: "Versión aprobada",
      prompt: "¿Quedó formalizada la versión aprobada del régimen?",
      why_it_matters:
        "Sin aprobación y formalización el régimen no rige como instrumento interno.",
      fact_key: "mpi.disciplinary.approved",
      answer_type: "single_select",
      options: stateOptions("mpi.disciplinary.approved"),
      evidence_to_review: [
        "evidencia de aprobación",
        "régimen interno de sanciones",
      ],
      evidence_review_help: [
        {
          evidence_item: "evidencia de aprobación",
          review_guide:
            "La evidencia debe permitir identificar quién aprobó el régimen, qué versión fue aprobada y cuándo se adoptó la decisión. También debe existir correspondencia entre la aprobación y el texto que se pretende aplicar, para evitar confundir un borrador o una propuesta con la versión formalizada.",
          no_evidence_guidance:
            "Se deben indicar la decisión, la autoridad o la versión cuya aprobación no pudo confirmarse. La ausencia de un acta independiente no demuestra por sí sola que no exista aprobación, si esta pudiera constar en otro registro válido; tampoco debe darse por formalizada una versión sin respaldo suficiente.",
          expected_result:
            "Una evidencia trazable que permita reconocer la aprobación y vincularla con la versión concreta del régimen. Si no puede confirmarse quién aprobó, qué texto se aprobó o cuándo se adoptó la decisión, esos aspectos deben quedar identificados como pendientes.",
        },
        {
          evidence_item: "régimen interno de sanciones",
          review_guide:
            "El régimen debe corresponder a la versión identificada como aprobada y contener las sanciones internas previstas ante los incumplimientos comprendidos en el MPI. La revisión debe permitir distinguir el texto vigente de los borradores o versiones anteriores y reconocer su alcance y condiciones de aplicación.",
          no_evidence_guidance:
            "Se debe señalar si falta el texto del régimen, si no puede identificarse su versión o si no se pudo vincular con la aprobación registrada. La existencia de un documento de sanciones no demuestra por sí sola que sea la versión aprobada o que corresponda al instrumento que se pretende aplicar.",
          expected_result:
            "Una versión identificable del régimen de sanciones vinculada con su aprobación, cuyo contenido y estado de formalización puedan verificarse. Las discrepancias entre el texto disponible y la versión aprobada, así como las dudas sobre su vigencia, deben quedar señaladas para su resolución.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del régimen",
      prompt:
        "El sistema verifica el prerrequisito de adopción y que cada verificación esté realizada.",
      answer_type: "none",
      required_facts: [LIFECYCLE_FACT, ...COMPONENT_FACTS],
      transitions: [
        {
          rule_id: "not-adopted",
          description:
            "Sin adopción formalizada no inicia la implementación.",
          when: { op: "not", condition: lifecycleEligible() },
          goto_outcome_key: "not_started",
          explanation:
            "El régimen forma parte del programa adoptado. Primero corresponde formalizar la adopción.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el régimen sigue en elaboración.",
          when: { op: "any", conditions: COMPONENT_FACTS.map(unresolved) },
          goto_outcome_key: "framework_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El régimen aún no queda establecido.",
        },
        {
          rule_id: "all-verified",
          description:
            "Adopción vigente y los cinco elementos verificados.",
          when: {
            op: "all",
            conditions: [lifecycleEligible(), ...COMPONENT_FACTS.map(isDone)],
          },
          goto_outcome_key: "framework_established",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en elaboración.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "framework_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "framework_established",
      label: "Régimen disciplinario establecido y aprobado",
      classification: "legal_requirement",
      explanation:
        "La adopción está vigente y el levantamiento, la integración, el procedimiento, la coherencia y la aprobación quedaron verificados.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "mpi.disciplinary_framework_status", value: "implemented" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente del régimen",
          note: "Archiva el régimen interno de sanciones, el procedimiento disciplinario, la evidencia de aprobación y la trazabilidad con la regulación interna aplicable.",
        },
      ],
    },
    {
      outcome_key: "framework_in_progress",
      label: "Régimen en elaboración",
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
      label: "Aún sin adopción formalizada",
      classification: "agency_standard",
      explanation:
        "Sin adopción vigente no inicia la implementación.",
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
