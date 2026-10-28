import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.05.
 *
 * activity_key = mpi.internal_reporting_and_whistleblowing (procedure).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D1.05. Guía el mecanismo, no casos individuales
 * de denuncia: ninguna pregunta modela un denunciante o un caso.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04 o Diagnóstico (`mpi.lifecycle_status` declarado en
 * `external_fact_keys`): es prerrequisito de entrada, nunca una
 * re-evaluación de adopción.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";

const COMPONENT_FACTS = [
  "mpi.whistleblowing.channel_defined",
  "mpi.whistleblowing.identity_reserve",
  "mpi.whistleblowing.non_retaliation",
  "mpi.whistleblowing.handling_defined",
  "mpi.whistleblowing.tested",
];

/** Estados de adopción que habilitan la implementación (canon D1.05). */
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

export const MPI_REPORTING_WHISTLEBLOWING_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.internal_reporting_and_whistleblowing.v1",
  activity_key: "mpi.internal_reporting_and_whistleblowing",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del mecanismo interno de reporte",
  description:
    "Verifica que el mecanismo interno de reporte y denuncias ante el DPO esté definido, protegido y operativo: canal, reserva de identidad, no represalia, flujo de tratamiento y prueba.",
  entry_node_key: "define-channel",
  decision_fact_keys: COMPONENT_FACTS,
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "define-channel",
      node_type: "question",
      title: "Canal de denuncia ante el DPO",
      prompt: "¿Quedó definido el canal de denuncia ante el DPO?",
      why_it_matters:
        "Sin canal definido no existe vía operativa para reportar infracciones ni denunciar ante el DPO.",
      fact_key: "mpi.whistleblowing.channel_defined",
      answer_type: "single_select",
      options: stateOptions("mpi.whistleblowing.channel_defined"),
      evidence_to_review: [
        "procedimiento de denuncia",
        "evidencia del canal operativo",
      ],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de denuncia",
          review_guide:
            "El procedimiento debe describir una vía definida para presentar denuncias ante el DPO, indicando cómo se reciben y canalizan los reportes. Debe permitir comprender quién interviene y cómo se inicia la gestión, sin limitarse a una declaración general sobre la existencia del mecanismo.",
          no_evidence_guidance:
            "Se deben identificar los elementos del procedimiento que no pudieron localizarse o confirmarse y los antecedentes necesarios para verificarlos. La ausencia de un documento no demuestra por sí sola que no exista un canal informal o una práctica operativa.",
          expected_result:
            "Un procedimiento identificable que describa cómo presentar denuncias ante el DPO y permita comprender el funcionamiento previsto del canal, con las brechas documentales claramente señaladas.",
        },
        {
          evidence_item: "evidencia del canal operativo",
          review_guide:
            "La evidencia debe permitir comprobar que el canal está habilitado y que puede utilizarse para presentar una denuncia. Puede incluir una prueba controlada, una verificación funcional o un registro de recepción, evitando exponer datos personales o información confidencial provenientes de casos reales.",
          no_evidence_guidance:
            "Se debe indicar qué aspecto de la operatividad no pudo comprobarse y qué prueba permitiría verificarlo. La existencia de una dirección de correo, formulario o herramienta no acredita por sí sola que el canal esté habilitado y que las denuncias puedan recibirse.",
          expected_result:
            "Evidencia verificable de que el canal está disponible y permite iniciar una denuncia ante el DPO, junto con las limitaciones o fallos detectados durante su comprobación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "identity-reserve",
      provenance: "legal_requirement",
    },
    {
      node_key: "identity-reserve",
      node_type: "question",
      title: "Reserva de identidad",
      prompt:
        "¿El mecanismo permite solicitar reserva de identidad al denunciar?",
      why_it_matters:
        "Sin reserva de identidad el canal inhibe las denuncias que debe recibir.",
      fact_key: "mpi.whistleblowing.identity_reserve",
      answer_type: "single_select",
      options: stateOptions("mpi.whistleblowing.identity_reserve"),
      evidence_to_review: [
        "regla de reserva de identidad",
        "procedimiento de denuncia",
      ],
      evidence_review_help: [
        {
          evidence_item: "regla de reserva de identidad",
          review_guide:
            "La regla debe establecer que quien presenta una denuncia puede solicitar la reserva de su identidad y explicar cómo se protege esa información durante la gestión del caso. Deben quedar claras las condiciones de acceso a los datos identificativos y las medidas previstas para evitar su divulgación indebida a personas que no necesitan conocerlos.",
          no_evidence_guidance:
            "Se deben identificar los aspectos de la reserva que no pudieron verificarse, como la posibilidad de solicitarla, las condiciones de tratamiento de la identidad o las medidas para limitar su acceso. La ausencia de una regla localizada no demuestra por sí sola que no existan prácticas de confidencialidad, pero impide confirmar que el mecanismo las contemple formalmente.",
          expected_result:
            "Una regla identificable que permita solicitar la reserva de identidad y describa cómo se protege la información identificativa durante la recepción y gestión de las denuncias. Las limitaciones o aspectos que requieran confirmación deben quedar expresamente documentados.",
        },
        {
          evidence_item: "procedimiento de denuncia",
          review_guide:
            "El procedimiento debe explicar cómo se solicita la reserva de identidad al presentar una denuncia y cómo se mantiene durante su tramitación. Debe existir coherencia entre las instrucciones para utilizar el canal y la regla de reserva, de modo que la protección no dependa únicamente de una declaración general de confidencialidad.",
          no_evidence_guidance:
            "Se deben señalar las etapas del procedimiento en las que no se pudo confirmar cómo se solicita o aplica la reserva de identidad. También deben identificarse los antecedentes necesarios para aclarar cómo se recibe y gestiona una denuncia reservada, sin asumir que la protección está garantizada solo porque el canal permite enviar comunicaciones privadas.",
          expected_result:
            "Un procedimiento que permita comprender cómo solicitar la reserva de identidad y cómo se aplica durante la gestión de la denuncia, en coherencia con la regla correspondiente. Las brechas que puedan afectar la confidencialidad deben quedar identificadas para su revisión.",
        },
      ],
      required_facts: [],
      default_next_node_key: "non-retaliation",
      provenance: "legal_requirement",
    },
    {
      node_key: "non-retaliation",
      node_type: "question",
      title: "Protección frente a represalias",
      prompt:
        "¿Quedaron establecidas medidas para evitar consecuencias desfavorables por denunciar?",
      why_it_matters:
        "Sin protección frente a represalias el canal queda formalmente creado pero inoperante.",
      fact_key: "mpi.whistleblowing.non_retaliation",
      answer_type: "single_select",
      options: stateOptions("mpi.whistleblowing.non_retaliation"),
      evidence_to_review: [
        "regla de no represalia",
        "procedimiento de denuncia",
      ],
      evidence_review_help: [
        {
          evidence_item: "regla de no represalia",
          review_guide:
            "La regla debe establecer que quien presenta una denuncia no puede recibir medidas desfavorables por ese motivo. Debe permitir comprender el alcance de la protección y distinguir las consecuencias vinculadas a la denuncia de otras decisiones organizacionales con fundamentos independientes y verificables.",
          no_evidence_guidance:
            "Se deben identificar los aspectos de la protección que no pudieron confirmarse y los antecedentes necesarios para verificar su alcance. La ausencia de una regla localizada no demuestra por sí sola que no existan prácticas protectoras, pero impide acreditar que la organización haya establecido formalmente la prohibición de represalias.",
          expected_result:
            "Una regla identificable que establezca la protección frente a consecuencias desfavorables motivadas por presentar una denuncia. Las limitaciones documentales o los aspectos que requieran aclaración deben quedar registrados, sin presumir que la protección es efectiva solo porque exista una declaración general de respeto o confidencialidad.",
        },
        {
          evidence_item: "procedimiento de denuncia",
          review_guide:
            "El procedimiento debe explicar cómo se aplica la protección frente a represalias durante la recepción y gestión de las denuncias. Debe existir coherencia entre la regla de no represalia y las etapas del mecanismo, incluyendo las responsabilidades previstas para tratar situaciones que puedan comprometer la protección de quien presenta una denuncia.",
          no_evidence_guidance:
            "Se deben señalar las etapas en que no pudo verificarse cómo se aplica la protección y los antecedentes necesarios para aclararlas. La existencia de un canal habilitado no demuestra por sí sola que se hayan previsto medidas frente a posibles consecuencias desfavorables ni que la regla pueda aplicarse de manera consistente.",
          expected_result:
            "Un procedimiento que describa cómo se integra la protección frente a represalias en la gestión de las denuncias y que sea coherente con la regla establecida. Las brechas en las responsabilidades, medidas o etapas de aplicación deben quedar identificadas para su revisión.",
        },
      ],
      required_facts: [],
      default_next_node_key: "handling-flow",
      provenance: "legal_requirement",
    },
    {
      node_key: "handling-flow",
      node_type: "question",
      title: "Recepción y seguimiento",
      prompt:
        "¿Quedaron definidos la recepción, el escalamiento, la custodia y el seguimiento de las denuncias?",
      why_it_matters:
        "Sin flujo definido cada denuncia se trata de forma improvisada y pierde trazabilidad.",
      fact_key: "mpi.whistleblowing.handling_defined",
      answer_type: "single_select",
      options: stateOptions("mpi.whistleblowing.handling_defined"),
      evidence_to_review: ["procedimiento de denuncia"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de denuncia",
          review_guide:
            "El procedimiento debe describir de forma coherente las cuatro etapas del flujo: recepción de la denuncia, escalamiento cuando corresponda, custodia de los antecedentes y seguimiento hasta su cierre o resolución prevista. Cada etapa debe contar con responsables o criterios de actuación identificables, de modo que la gestión no dependa de decisiones improvisadas ni se pierda la trazabilidad durante el proceso.",
          no_evidence_guidance:
            "Se deben identificar por separado las etapas que no pudieron verificarse y los antecedentes necesarios para confirmar cómo se gestionan. La existencia de un canal de recepción no demuestra que también estén definidos el escalamiento, la custodia y el seguimiento; tampoco debe presumirse que esas funciones están cubiertas si el procedimiento solo las menciona de forma general.",
          expected_result:
            "Un procedimiento identificable que permita comprender cómo se reciben, escalan, custodian y siguen las denuncias, con una secuencia de gestión coherente y responsabilidades suficientemente claras. Las etapas ausentes, ambiguas o sin respaldo deben quedar señaladas para su revisión, sin asumir que la existencia de un documento garantiza por sí sola la aplicación efectiva del flujo.",
        },
      ],
      help_text: [
        "Verifica cada elemento: recepción, escalamiento, custodia y seguimiento.",
      ],
      required_facts: [],
      default_next_node_key: "test-channel",
      provenance: "legal_requirement",
    },
    {
      node_key: "test-channel",
      node_type: "question",
      title: "Prueba de operatividad",
      prompt: "¿Se probó la operatividad del mecanismo con evidencia?",
      why_it_matters:
        "Sin prueba el mecanismo puede existir en papel y fallar en la práctica.",
      fact_key: "mpi.whistleblowing.tested",
      answer_type: "single_select",
      options: stateOptions("mpi.whistleblowing.tested"),
      evidence_to_review: [
        "registro de prueba del mecanismo",
        "evidencia del canal operativo",
      ],
      evidence_review_help: [
        {
          evidence_item: "registro de prueba del mecanismo",
          review_guide:
            "El registro debe permitir reconocer qué parte del mecanismo se probó, cómo se realizó la comprobación y cuál fue el resultado obtenido. La evidencia debe mostrar si la prueba permitió completar el flujo previsto o si aparecieron fallos, indicando las limitaciones y acciones pendientes cuando corresponda. La existencia de un registro, por sí sola, no demuestra que la prueba haya sido suficiente para evaluar la operatividad.",
          no_evidence_guidance:
            "Se deben señalar los aspectos del mecanismo cuya operatividad no pudo confirmarse y los antecedentes necesarios para realizar o documentar una prueba. La ausencia de un registro localizado no demuestra por sí sola que nunca se haya efectuado una comprobación; corresponde distinguir entre una prueba no acreditada, una prueba incompleta y un resultado que evidencie fallos.",
          expected_result:
            "Un registro identificable que describa la prueba realizada, los aspectos del mecanismo evaluados, los resultados y las limitaciones o incidencias detectadas. Cuando la prueba no cubra el flujo completo o revele problemas, estos deben quedar expresamente señalados, sin considerar la mera existencia del registro como prueba concluyente de operatividad.",
        },
        {
          evidence_item: "evidencia del canal operativo",
          review_guide:
            "La evidencia debe permitir comprobar que el canal está habilitado, accesible para las personas destinatarias y en condiciones de recibir una comunicación conforme al procedimiento definido. Puede consistir en una prueba controlada, una comprobación técnica o una constancia equivalente que permita verificar su funcionamiento. La evidencia debe ser compatible con la reserva de identidad y evitar exponer datos personales o información confidencial de casos reales.",
          no_evidence_guidance:
            "Se deben identificar las características del canal cuyo funcionamiento no pudo verificarse y las comprobaciones necesarias para confirmarlo. La existencia de una dirección de correo, formulario o instrucción documental no demuestra por sí sola que el canal esté habilitado, sea accesible o permita completar la recepción de una comunicación.",
          expected_result:
            "Una evidencia verificable de que el canal está disponible y permite iniciar la comunicación prevista, acompañada de las limitaciones o fallos detectados durante la comprobación. Si solo se acredita la existencia formal del canal, debe quedar pendiente la confirmación de su funcionamiento efectivo, sin exponer información confidencial de casos reales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del mecanismo",
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
            "El mecanismo se implementa como parte del programa adoptado. Primero corresponde formalizar la adopción.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el mecanismo sigue en implementación.",
          when: { op: "any", conditions: COMPONENT_FACTS.map(unresolved) },
          goto_outcome_key: "mechanism_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El mecanismo aún no queda implementado.",
        },
        {
          rule_id: "all-verified",
          description:
            "Adopción vigente y los cinco elementos operativos.",
          when: {
            op: "all",
            conditions: [lifecycleEligible(), ...COMPONENT_FACTS.map(isDone)],
          },
          goto_outcome_key: "mechanism_implemented",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en implementación.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "mechanism_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "mechanism_implemented",
      label: "Mecanismo implementado y operativo",
      classification: "legal_requirement",
      explanation:
        "La adopción está vigente y el canal, la reserva de identidad, la no represalia, el flujo y la prueba quedaron verificados.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "mpi.whistleblowing_status", value: "implemented" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente del mecanismo",
          note: "Archiva el procedimiento de denuncia, la evidencia del canal operativo, las reglas de reserva de identidad y no represalia, y el registro de prueba del mecanismo.",
        },
      ],
    },
    {
      outcome_key: "mechanism_in_progress",
      label: "Mecanismo en implementación",
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
