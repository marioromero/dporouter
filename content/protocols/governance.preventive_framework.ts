import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.01.
 *
 * activity_key = governance.preventive_framework (procedure). Contenido
 * aprobado por la iteración vigente; usa exclusivamente pasos, evidencia,
 * legal basis y state effect del contenido canónico D1.01. Sin
 * dependencias: la actividad no declara ninguna.
 *
 * Calibración de modo: los pasos operativos se representan como
 * verificaciones de hechos ("¿quedó verificado y registrado?"), no como
 * preguntas de descubrimiento. answer_type single_select con estados
 * explícitos Verificado / Pendiente / Sin información; nunca
 * yes_no_unknown ambiguo para verificaciones. La compuerta de
 * aplicabilidad (rol de responsable) usa el ternario Sí / No /
 * Desconocido porque determina si el marco procede.
 *
 * Este marco preventivo general es independiente de la adopción de un
 * MPI: no lo confunde con el programa D1.03/D1.04 y así lo declara.
 */

const VERIFICATION_FACTS = [
  "governance.client_is_responsible",
  "governance.actions_identified",
  "governance.gaps_determined",
  "governance.framework_defined",
  "governance.followup_established",
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

export const GOVERNANCE_PREVENTIVE_FRAMEWORK_PROTOCOL: ExecutionProtocol = {
  protocol_key: "governance.preventive_framework.v1",
  activity_key: "governance.preventive_framework",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del marco general de prevención",
  description:
    "Guía al profesional desde la confirmación del rol de responsable hasta un marco preventivo operativo con responsables, acciones y seguimiento: antecedentes, vacíos, definición del marco y mecanismo de control. No es adopción de MPI.",
  entry_node_key: "role-gate",
  decision_fact_keys: VERIFICATION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "role-gate",
      node_type: "question",
      title: "Rol de responsable",
      prompt:
        "¿El cliente actúa como responsable en al menos un tratamiento?",
      why_it_matters:
        "El marco preventivo general recae sobre el responsable. Sin ese rol no existe marco que establecer en esta actividad.",
      fact_key: "governance.client_is_responsible",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Actúa como responsable en al menos un tratamiento.",
          fact_effect: {
            fact_key: "governance.client_is_responsible",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "No",
          description: "No actúa como responsable en ningún tratamiento.",
          fact_effect: {
            fact_key: "governance.client_is_responsible",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "governance.client_is_responsible",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "inventario de tratamientos",
        "evaluación de roles por tratamiento",
      ],
      evidence_review_help: [
        {
          evidence_item: "inventario de tratamientos",
          review_guide:
            "Revisar las fuentes disponibles para identificar las actividades en las que la organización utiliza datos personales. Examinar procesos, documentos y sistemas, como los de clientes, trabajadores o proveedores. La información puede estar distribuida en distintas fuentes y no tiene que existir en un único inventario.",
          no_evidence_guidance:
            "Ampliar la revisión a otras fuentes disponibles y registrar qué información falta. No disponer de un inventario formal no demuestra que no existan tratamientos.",
          expected_result:
            "Una relación inicial de los tratamientos identificados y de las cuestiones pendientes de confirmar.",
        },
        {
          evidence_item: "evaluación de roles por tratamiento",
          review_guide:
            "Para cada tratamiento identificado, analizar qué papel desempeña la organización y quién decide cómo y para qué se utilizan los datos personales. Contrastar la operativa real con los contratos y demás antecedentes disponibles, sin basarse únicamente en las denominaciones utilizadas por las partes.",
          no_evidence_guidance:
            "Registrar qué información falta y mantener el rol pendiente de confirmación cuando no existan antecedentes suficientes.",
          expected_result:
            "Una determinación fundamentada del rol de la organización en cada tratamiento, o la identificación expresa de los casos pendientes.",
        },
      ],
      required_facts: [],
      default_next_node_key: "identify-actions",
      transitions: [
        {
          rule_id: "not-responsible",
          description:
            "Sin rol de responsable no procede el marco preventivo general.",
          when: {
            op: "fact_equals",
            fact_key: "governance.client_is_responsible",
            value: "no",
          },
          goto_outcome_key: "not_applicable",
          explanation:
            "El cliente no actúa como responsable. Esta actividad aplica cuando existe al menos un tratamiento en calidad de responsable.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "identify-actions",
      node_type: "question",
      title: "Acciones preventivas existentes",
      prompt:
        "¿Quedaron identificadas las acciones preventivas existentes y sus responsables?",
      why_it_matters:
        "El marco se construye sobre lo existente: sin levantar acciones y responsables no es posible detectar vacíos ni distribuir responsabilidades.",
      fact_key: "governance.actions_identified",
      answer_type: "single_select",
      options: stateOptions("governance.actions_identified"),
      evidence_to_review: [
        "matriz o registro de acciones preventivas",
        "asignación de responsables",
        "revisión de controles existentes",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz o registro de acciones preventivas",
          review_guide:
            "Revisar los registros, procedimientos y documentos disponibles para identificar las medidas que la organización ya aplica para proteger los datos personales. Considerar acciones organizativas, técnicas y operativas, sin exigir que estén reunidas en una única matriz formal.",
          no_evidence_guidance:
            "Consultar otras fuentes disponibles y registrar qué medidas se han identificado y cuáles están pendientes de confirmar. La ausencia de una matriz no demuestra por sí sola que no existan acciones preventivas.",
          expected_result:
            "Una relación inicial de las acciones preventivas existentes, con sus antecedentes y las cuestiones pendientes de verificar.",
        },
        {
          evidence_item: "asignación de responsables",
          review_guide:
            "Para cada acción preventiva identificada, comprobar quién se encarga de ejecutarla, supervisarla o mantenerla, según corresponda. Contrastar la información con las funciones reales, los procedimientos internos y los antecedentes disponibles, sin confundir al responsable de una tarea con el rol jurídico de responsable del tratamiento.",
          no_evidence_guidance:
            "Registrar qué funciones o asignaciones no están claras y solicitar antecedentes adicionales. No atribuir una responsabilidad únicamente por el cargo de una persona o por una denominación informal.",
          expected_result:
            "Una relación de las acciones preventivas con sus responsables operativos identificados y las asignaciones que siguen pendientes de confirmación.",
        },
        {
          evidence_item: "revisión de controles existentes",
          review_guide:
            "Comprobar cómo se aplican en la práctica los controles existentes y qué antecedentes permiten verificar su funcionamiento. Según el tratamiento, revisar procedimientos, configuraciones, registros de ejecución, evidencias de supervisión u otros elementos pertinentes. Valorar los controles en relación con la protección de los datos personales y los riesgos del tratamiento.",
          no_evidence_guidance:
            "Distinguir entre un control que no existe, uno cuya aplicación no pudo comprobarse y uno para el que faltan antecedentes. Registrar la limitación sin concluir automáticamente que el control no se aplica.",
          expected_result:
            "Una valoración inicial de los controles identificados, sus evidencias disponibles y las cuestiones que requieren comprobación adicional.",
        },
      ],
      help_text: [
        "Levanta cada acción preventiva vigente con su responsable mediante revisión documental, entrevistas y revisión de controles existentes.",
      ],
      required_facts: [],
      default_next_node_key: "determine-gaps",
      provenance: "agency_standard",
    },
    {
      node_key: "determine-gaps",
      node_type: "question",
      title: "Vacíos de gobierno y coordinación",
      prompt:
        "¿Quedaron determinados los vacíos de gobierno, documentación o coordinación?",
      why_it_matters:
        "Los vacíos determinan qué debe crear el marco: sin este diagnóstico la definición posterior carece de base.",
      fact_key: "governance.gaps_determined",
      answer_type: "single_select",
      options: stateOptions("governance.gaps_determined"),
      evidence_to_review: [
        "matriz o registro de acciones preventivas",
        "revisión de controles existentes",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz o registro de acciones preventivas",
          review_guide:
            "Contrastar las acciones preventivas registradas con las necesidades de gobierno, documentación y coordinación del tratamiento. Comprobar si cada acción cuenta con una definición suficiente de su finalidad, los antecedentes que la respaldan y su relación con otras funciones o medidas, según corresponda. Distinguir las carencias comprobadas de los aspectos que aún requieren información.",
          no_evidence_guidance:
            "Registrar qué aspecto de gobierno, documentación o coordinación no pudo verificarse y qué antecedentes sería necesario consultar. No concluir que existe un incumplimiento únicamente porque no haya una matriz formal o porque la información esté distribuida en distintos documentos.",
          expected_result:
            "Una relación de los vacíos identificados en el registro de acciones preventivas, diferenciando las brechas confirmadas de las cuestiones pendientes de verificar.",
        },
        {
          evidence_item: "revisión de controles existentes",
          review_guide:
            "Utilizar los resultados de la revisión de controles para determinar si existen carencias en su definición, documentación, supervisión o coordinación. Comprobar los antecedentes disponibles y cómo se relacionan los controles con la protección de los datos personales. Valorar cada posible vacío según el tratamiento examinado, sin asumir que todos los controles requieren la misma estructura organizativa.",
          no_evidence_guidance:
            "Dejar constancia de qué aspecto no pudo comprobarse y qué información falta para determinar si existe una brecha. Diferenciar un control inexistente de uno cuya documentación es insuficiente o cuya aplicación no pudo verificarse.",
          expected_result:
            "Una valoración inicial de los vacíos de gobierno, documentación o coordinación asociados a los controles revisados, con sus evidencias y las comprobaciones pendientes.",
        },
      ],
      help_text: [
        "Contrasta las acciones existentes contra gobierno, documentación y coordinación para registrar cada vacío detectado.",
      ],
      required_facts: [],
      default_next_node_key: "define-framework",
      provenance: "agency_standard",
    },
    {
      node_key: "define-framework",
      node_type: "question",
      title: "Definición del marco preventivo",
      prompt:
        "¿Quedó definido un marco preventivo que distribuye responsabilidades y conecta los controles especializados?",
      why_it_matters:
        "El marco distribuye responsabilidades y articula los controles de los demás dominios: es el entregable central de la actividad.",
      fact_key: "governance.framework_defined",
      answer_type: "single_select",
      options: stateOptions("governance.framework_defined"),
      evidence_to_review: [
        "marco o política interna de prevención",
        "asignación de responsables",
        "evidencia de aprobación o comunicación interna cuando corresponda",
      ],
      evidence_review_help: [
        {
          evidence_item: "marco o política interna de prevención",
          review_guide:
            "Examinar el marco, la política y los demás antecedentes internos que describan cómo se organiza la prevención. Comprobar qué objetivos cubren, cómo se distribuyen las responsabilidades y cómo se relacionan los controles especializados de los distintos dominios. Si la información está repartida entre varios documentos o mecanismos, valorar el conjunto antes de concluir que falta un marco preventivo.",
          no_evidence_guidance:
            "Registrar qué aspecto del marco preventivo no pudo verificarse y qué documentos o antecedentes sería necesario consultar. Distinguir entre la inexistencia de un marco identificable, la falta de documentación formal y la falta de acceso a la evidencia. La ausencia de una política con un nombre específico no demuestra, por sí sola, un incumplimiento legal.",
          expected_result:
            "Una valoración del marco preventivo disponible, que identifique cómo se articulan las responsabilidades y los controles especializados, las carencias comprobadas y los aspectos pendientes de verificar.",
        },
        {
          evidence_item: "asignación de responsables",
          review_guide:
            "Revisar los antecedentes que permitan identificar quién asume las responsabilidades de prevención y cómo se distribuyen las funciones relacionadas con los controles especializados. Comprobar si las responsabilidades están descritas con suficiente claridad para entender quién realiza cada función y cómo se coordinan las distintas áreas. Evaluar la asignación según el funcionamiento de la organización, sin presuponer que todas deben adoptar la misma estructura.",
          no_evidence_guidance:
            "Precisar qué responsabilidad o función no pudo atribuirse y qué antecedentes permitirían aclararla. Diferenciar entre una responsabilidad que aparentemente no está asignada, una asignación informal y una asignación cuya documentación o aplicación no pudo verificarse. No concluir automáticamente que existe un incumplimiento por la ausencia de un organigrama o de un documento específico.",
          expected_result:
            "Una relación de las responsabilidades identificadas, su correspondencia con las funciones preventivas y los controles especializados, y las brechas o dudas de coordinación que requieren atención.",
        },
        {
          evidence_item:
            "evidencia de aprobación o comunicación interna cuando corresponda",
          review_guide:
            "Comprobar, cuando corresponda según la naturaleza del marco y los procedimientos de la organización, si existen antecedentes que acrediten su aprobación, validación o comunicación interna. Revisar la fecha, el alcance y los destinatarios de esos antecedentes para determinar qué versión del marco fue respaldada y cómo se dio a conocer a las personas involucradas. Distinguir la aprobación formal de la comunicación efectiva y de la mera existencia del documento.",
          no_evidence_guidance:
            "Indicar si falta acreditar la aprobación, la comunicación o ambas, y qué antecedentes podrían permitir verificarlo. No asumir que toda política debe seguir un mismo procedimiento de aprobación o difusión; determinar primero qué procedimiento resulta aplicable al marco examinado.",
          expected_result:
            "Una conclusión sobre el respaldo y la comunicación del marco preventivo, sustentada en los antecedentes disponibles, con las comprobaciones pendientes claramente identificadas.",
        },
      ],
      help_text: [
        "Este marco preventivo general es independiente de la adopción de un MPI: no lo confundas con el programa de los dominios D1.03/D1.04.",
      ],
      required_facts: [],
      default_next_node_key: "followup-mechanism",
      provenance: "agency_standard",
    },
    {
      node_key: "followup-mechanism",
      node_type: "question",
      title: "Mecanismo de seguimiento",
      prompt:
        "¿Quedó establecido el mecanismo de seguimiento de las acciones preventivas?",
      why_it_matters:
        "Sin seguimiento el marco queda en declaración: el mecanismo sostiene su operación en el tiempo.",
      fact_key: "governance.followup_established",
      answer_type: "single_select",
      options: stateOptions("governance.followup_established"),
      evidence_to_review: [
        "matriz o registro de acciones preventivas",
        "evidencia de aprobación o comunicación interna cuando corresponda",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz o registro de acciones preventivas",
          review_guide:
            "Examinar la matriz o el registro para comprobar si permite identificar cada acción preventiva, la persona responsable de darle seguimiento, la cadencia o los hitos de revisión y el estado de avance. Verificar qué información se actualiza, quién la mantiene y qué antecedentes permiten respaldar los cambios de estado, los retrasos y el cierre de las acciones. Si el seguimiento se distribuye entre varios registros o herramientas, evaluar el conjunto y comprobar si la información puede relacionarse de forma consistente.",
          no_evidence_guidance:
            "Precisar qué elementos del seguimiento no pudieron verificarse: las acciones incluidas, sus responsables, la cadencia de revisión, el registro de avances o la evidencia de cierre. Distinguir entre la inexistencia de un mecanismo identificable, el uso de un mecanismo informal y la falta de acceso a registros que permitan comprobar su funcionamiento. No concluir que el seguimiento no existe únicamente porque no se haya encontrado una matriz con un formato específico.",
          expected_result:
            "Una valoración del mecanismo de seguimiento disponible que identifique cómo se controlan las acciones preventivas, quién responde por su revisión, con qué cadencia se realiza y qué registros respaldan su avance, sus desviaciones y su cierre, junto con las brechas y comprobaciones pendientes.",
        },
        {
          evidence_item:
            "evidencia de aprobación o comunicación interna cuando corresponda",
          review_guide:
            "Comprobar, cuando corresponda según la naturaleza del mecanismo y los procedimientos de la organización, si existen antecedentes que permitan verificar su aprobación, validación o comunicación interna. Revisar el alcance, la fecha y los destinatarios de esos antecedentes, y contrastarlos con el mecanismo que efectivamente se utiliza para el seguimiento. Diferenciar el respaldo del mecanismo, su comunicación a las personas involucradas y la evidencia de que se aplica en la práctica.",
          no_evidence_guidance:
            "Indicar si no pudo verificarse la aprobación, la comunicación interna o ambas, y qué antecedentes permitirían aclararlo. Distinguir entre un mecanismo que opera sin formalización identificable y uno cuya aprobación o comunicación no pudo comprobarse. No asumir que todos los mecanismos requieren el mismo procedimiento de aprobación o difusión; determinar primero qué corresponde según el contexto de la organización.",
          expected_result:
            "Una conclusión sobre el respaldo y la comunicación interna del mecanismo de seguimiento, cuando corresponda, vinculada con los antecedentes disponibles y con las comprobaciones pendientes claramente identificadas.",
        },
      ],
      help_text: [
        "Define quién sigue cada acción, con qué cadencia y con qué registro verificable.",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del marco",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el marco sigue en construcción.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "framework_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El marco aún no queda establecido.",
        },
        {
          rule_id: "all-verified",
          description:
            "Rol, acciones, vacíos, marco y seguimiento verificados.",
          when: { op: "all", conditions: VERIFICATION_FACTS.map(isDone) },
          goto_outcome_key: "framework_established",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en construcción.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "framework_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "framework_established",
      label: "Marco preventivo establecido y evidenciado",
      classification: "agency_standard",
      explanation:
        "El rol, las acciones existentes, los vacíos, el marco con responsabilidades y el seguimiento quedaron verificados.",
      provenance: "agency_standard",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "governance.prevention_framework_status", value: "established" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente del marco",
          note: "Archiva el marco o política interna, la asignación de responsables, la matriz de acciones preventivas y la evidencia de aprobación o comunicación interna.",
        },
        {
          kind: "info",
          label: "Distinguir este marco de un MPI",
          note: "Este marco preventivo general es independiente de la adopción de un MPI: no lo presentes como programa de prevención de infracciones.",
        },
      ],
    },
    {
      outcome_key: "framework_in_progress",
      label: "Marco en construcción",
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
      outcome_key: "not_applicable",
      label: "No aplica: sin rol de responsable",
      classification: "agency_standard",
      explanation:
        "Sin al menos un tratamiento en calidad de responsable no procede establecer este marco.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Revisar roles por actor y tratamiento",
          activity_key: "treatment.actor_roles",
        },
      ],
    },
  ],
};
