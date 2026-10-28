import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.01.
 *
 * activity_key = treatment.inventory_create (procedure, treatment
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, legal basis, dependencias y
 * aplicabilidad del contenido canónico D2.01.
 *
 * Las condiciones objetivas (actores, finalidades, datos, fuentes,
 * identificación) se consumen como derived facts: ninguna pregunta
 * manual las duplica. Solo verifican criterio profesional la
 * identificación de procesos, las relaciones conocidas y la
 * trazabilidad con evidencias. Crear el TreatmentContext no completa
 * esta actividad. Systems/flows: gap explícito sin storage aprobado;
 * se revisan como evidencia documental, sin fingir captura.
 */

const DERIVED = [
  "derived.treatment.identified",
  "derived.treatment.actors_exist",
  "derived.treatment.purposes_exist",
  "derived.treatment.data_items_exist",
  "derived.treatment.sources_exist",
];

const MANUAL = [
  "inventory.processes_identified",
  "inventory.relations_reviewed",
  "inventory.traceability_assured",
];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function derivedNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
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

export const TREATMENT_INVENTORY_CREATE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "treatment.inventory_create.v1",
  activity_key: "treatment.inventory_create",
  version: 1,
  mode: "procedure",
  execution_scope: "treatment",
  title: "Procedimiento guiado del inventario del tratamiento",
  description:
    "Verifica que el tratamiento quede identificado y levantado con sus elementos conocidos y trazabilidad: procesos, identidad, relaciones y evidencias.",
  entry_node_key: "identify-processes",
  decision_fact_keys: [...MANUAL],
  external_fact_keys: [...DERIVED],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "identify-processes",
      node_type: "question",
      title: "Procesos de negocio",
      prompt:
        "¿Quedaron identificados los procesos de negocio que implican tratamiento de datos personales?",
      why_it_matters:
        "Sin procesos identificados no es posible delimitar qué operaciones levantar.",
      fact_key: "inventory.processes_identified",
      answer_type: "single_select",
      options: stateOptions("inventory.processes_identified"),
      evidence_to_review: [
        "relación de procesos y sistemas revisados",
        "evidencia de levantamiento",
      ],
      evidence_review_help: [
        {
          evidence_item: "relación de procesos y sistemas revisados",
          review_guide:
            "Examinar la relación de procesos y sistemas revisados para identificar aquellos en los que se recopilan, consultan, almacenan, comunican o utilizan datos personales. Contrastar su contenido con las operaciones de las áreas involucradas, comprobando que los procesos relevantes estén considerados y que las vinculaciones entre actividades y sistemas sean coherentes con el funcionamiento conocido de la organización.",
          no_evidence_guidance:
            "Consultar a los responsables de procesos y sistemas, junto con la documentación operacional disponible, para reconstruir una relación inicial de las actividades examinadas. Si el levantamiento está incompleto, identificar las áreas pendientes y los procesos aún no confirmados, sin presentar como exhaustiva una relación que no cuenta con respaldo suficiente.",
          expected_result:
            "Una relación documentada y trazable de los procesos y sistemas examinados, que permita identificar las operaciones que involucran datos personales y reconocer eventuales omisiones, inconsistencias o ámbitos pendientes de revisión. Su existencia no acredita por sí sola que todos los tratamientos de la organización hayan sido identificados.",
        },
        {
          evidence_item: "evidencia de levantamiento",
          review_guide:
            "Revisar los antecedentes utilizados para identificar los procesos de tratamiento, incluyendo entrevistas, talleres, revisiones documentales, recorridos de procesos u otros mecanismos efectivamente empleados. Verificar las áreas consultadas, los hallazgos obtenidos y su correspondencia con los procesos registrados, distinguiendo información confirmada de antecedentes todavía sujetos a validación.",
          no_evidence_guidance:
            "Comprobar si el levantamiento fue realizado y buscar registros, documentos de trabajo, comunicaciones u otros antecedentes que permitan reconstruirlo. Si no se efectuó, identificar las actividades pendientes y gestionar su realización; si existen actuaciones sin respaldo suficiente, documentar esa limitación sin generar constancias retrospectivas de trabajos no realizados.",
          expected_result:
            "Antecedentes verificables que permitan reconstruir el levantamiento efectuado y vincular sus hallazgos con los procesos identificados, incluyendo las fuentes consultadas y las limitaciones detectadas. La revisión debe distinguir entre levantamientos respaldados, información pendiente de confirmación y actividades que todavía no se han realizado.",
        },
      ],
      required_facts: [],
      default_next_node_key: "review-relations",
      provenance: "agency_standard",
    },
    {
      node_key: "review-relations",
      node_type: "question",
      title: "Elementos relacionados",
      prompt:
        "¿Quedaron relacionados los titulares, categorías, actores, sistemas, fuentes y flujos conocidos?",
      why_it_matters:
        "Sin relaciones el inventario queda como lista suelta sin trazabilidad operativa.",
      fact_key: "inventory.relations_reviewed",
      answer_type: "single_select",
      options: stateOptions("inventory.relations_reviewed"),
      evidence_to_review: [
        "inventario maestro de tratamientos",
        "evidencia de levantamiento",
      ],
      evidence_review_help: [
        {
          evidence_item: "inventario maestro de tratamientos",
          review_guide:
            "Examinar los registros del inventario para comprobar que cada tratamiento identificado permita relacionar las categorías de titulares y datos personales, los actores involucrados y las fuentes conocidas. Contrastar estas relaciones con la descripción operacional y los antecedentes disponibles, considerando también las referencias documentales a sistemas y flujos. Identificar vínculos ausentes, inconsistentes o pendientes de confirmación, sin exigir que los atributos desarrollados en otras actividades del D2 estén completamente evaluados.",
          no_evidence_guidance:
            "Revisar los registros parciales, mapas de procesos, documentación de sistemas y antecedentes disponibles para reconstruir las relaciones conocidas de cada tratamiento. Si el inventario no existe o carece de vinculaciones suficientes, identificar los elementos pendientes y gestionar su incorporación progresiva, distinguiendo información no levantada de relaciones que todavía no pueden confirmarse.",
          expected_result:
            "Un inventario con relaciones trazables entre los tratamientos y sus titulares, categorías de datos, actores y fuentes conocidas, complementado con referencias documentales a sistemas y flujos cuando corresponda. Las vinculaciones deben permitir reconocer elementos confirmados, inconsistencias y antecedentes pendientes, sin presumir que la caracterización integral del tratamiento ya está concluida.",
        },
        {
          evidence_item: "evidencia de levantamiento",
          review_guide:
            "Contrastar los antecedentes del levantamiento con las relaciones registradas en el inventario, verificando que permitan identificar el origen de la información sobre titulares, categorías de datos, actores, sistemas, fuentes y flujos. Examinar entrevistas, documentos de procesos, registros operacionales, diagramas u otros respaldos efectivamente disponibles, distinguiendo relaciones acreditadas de aquellas basadas en información preliminar.",
          no_evidence_guidance:
            "Consultar los antecedentes utilizados en el levantamiento inicial y las áreas responsables para localizar respaldos de las relaciones identificadas. Cuando la documentación sea insuficiente, registrar qué vínculos requieren corroboración y qué fuentes deben revisarse. Si determinados elementos todavía no fueron levantados, gestionar su identificación sin generar antecedentes retrospectivos que simulen verificaciones no realizadas.",
          expected_result:
            "Antecedentes verificables que permitan relacionar los elementos del inventario con las fuentes y comprobaciones que sustentan su identificación. La revisión debe reflejar las vinculaciones documentadas, las limitaciones de la información disponible y las verificaciones pendientes, sin exigir registros estructurados de sistemas o flujos que la aplicación todavía no contempla.",
        },
      ],
      help_text: [
        "Sistemas y flujos se revisan como evidencia documental: aún no tienen captura estructurada.",
      ],
      required_facts: [],
      default_next_node_key: "assure-traceability",
      provenance: "agency_standard",
    },
    {
      node_key: "assure-traceability",
      node_type: "question",
      title: "Trazabilidad con evidencias",
      prompt:
        "¿Quedó asegurada la trazabilidad entre el inventario y las evidencias utilizadas?",
      why_it_matters:
        "Sin trazabilidad el levantamiento no es auditable ni mantenible.",
      fact_key: "inventory.traceability_assured",
      answer_type: "single_select",
      options: stateOptions("inventory.traceability_assured"),
      evidence_to_review: [
        "evidencia de levantamiento",
        "identificadores estables de tratamientos",
      ],
      evidence_review_help: [
        {
          evidence_item: "evidencia de levantamiento",
          review_guide:
            "Contrastar los hallazgos de entrevistas, documentos de procesos, registros operacionales y otros antecedentes efectivamente consultados con las entradas correspondientes del inventario. Comprobar que las referencias permitan localizar los respaldos originales, identificar su procedencia y reconocer discrepancias, información desactualizada o conclusiones pendientes de corroboración.",
          no_evidence_guidance:
            "Consultar los registros de trabajo, comunicaciones y documentos conservados por las áreas participantes para recuperar los antecedentes disponibles. Si determinadas conclusiones carecen de respaldo localizable, identificar los datos que requieren confirmación y gestionar nuevas comprobaciones, sin reconstruir ficticiamente entrevistas, revisiones o actuaciones anteriores.",
          expected_result:
            "Referencias documentales localizables y asociadas a los registros correspondientes, con antecedentes suficientes para sustentar la información incorporada. Las discrepancias, fuentes no confirmadas y conclusiones sin respaldo deben quedar identificadas, sin considerar acreditados los elementos cuya procedencia no pueda comprobarse.",
        },
        {
          evidence_item: "identificadores estables de tratamientos",
          review_guide:
            "Examinar los códigos o referencias asignados a cada tratamiento, comprobando su unicidad y consistencia entre los distintos registros y antecedentes asociados. Detectar duplicidades, cambios injustificados, referencias ambiguas o denominaciones diferentes para una misma operación, considerando la continuidad de las referencias cuando se actualicen las descripciones o atributos.",
          no_evidence_guidance:
            "Revisar las denominaciones, registros históricos y referencias disponibles para determinar si permiten distinguir consistentemente las operaciones identificadas. Cuando no exista un mecanismo adecuado, definir una convención interna y establecer las correspondencias necesarias, conservando las referencias anteriores cuando resulte pertinente para evitar pérdidas de información o asociaciones incorrectas.",
          expected_result:
            "Un conjunto coherente de identificadores internos, sin duplicidades o ambigüedades no resueltas, que permita reconocer cada tratamiento y mantener sus asociaciones durante posteriores actualizaciones. Las inconsistencias pendientes deben quedar documentadas, sin atribuir obligatoriedad legal a una convención técnica específica.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del levantamiento",
      prompt:
        "El sistema verifica el estado estructural y las verificaciones profesionales.",
      answer_type: "none",
      required_facts: [...DERIVED, ...MANUAL],
      transitions: [
        {
          rule_id: "structural-missing",
          description:
            "Faltan elementos estructurales: el tratamiento sigue sin levantar.",
          when: { op: "any", conditions: DERIVED.map(derivedNo) },
          goto_outcome_key: "inventory_incomplete",
          explanation:
            "Faltan actores, finalidades, datos, fuentes o identificación. Completa cada elemento en el workspace.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación profesional está pendiente o sin información.",
          when: { op: "any", conditions: MANUAL.map(unresolved) },
          goto_outcome_key: "inventory_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El levantamiento aún no queda verificado.",
        },
        {
          rule_id: "all-verified",
          description:
            "Estructura completa y verificaciones profesionales realizadas.",
          when: {
            op: "all",
            conditions: [
              ...DERIVED.map((f) => ({
                op: "fact_equals",
                fact_key: f,
                value: "yes",
              }) as FactCondition),
              ...MANUAL.map(isDone),
            ],
          },
          goto_outcome_key: "inventory_complete",
          explanation:
            "Todas las verificaciones están realizadas y respaldadas para este tratamiento.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "inventory_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "inventory_complete",
      label: "Tratamiento levantado y verificado",
      classification: "agency_standard",
      explanation:
        "El tratamiento está identificado, con actores, finalidades, datos y fuentes, y el levantamiento verificado con trazabilidad.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Identificar actores y roles en D2.02",
          activity_key: "treatment.actor_roles",
        },
        {
          kind: "info",
          label: "Conservar el expediente de levantamiento",
          note: "Archiva la relación de procesos y sistemas revisados, la evidencia de levantamiento y los identificadores estables.",
        },
      ],
    },
    {
      outcome_key: "inventory_incomplete",
      label: "Estructura por completar",
      classification: "agency_standard",
      explanation:
        "Faltan elementos estructurales del tratamiento. Complétalos en el workspace antes de verificar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar estructuras en Tratamientos",
          note: "Agrega actores, finalidades, datos, fuentes y el identificador canónico en la sección Tratamientos de la empresa.",
        },
      ],
    },
    {
      outcome_key: "inventory_in_progress",
      label: "Levantamiento en curso",
      classification: "agency_standard",
      explanation:
        "Quedan verificaciones profesionales pendientes o sin información. Completa cada punto y conserva su evidencia.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
  ],
};
