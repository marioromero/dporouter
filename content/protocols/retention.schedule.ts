import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.08.
 *
 * activity_key = retention.schedule (procedure, treatment scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D2.08. No inventa universalidad: el canon admite
 * excepciones y distintos criterios, así que no se exige cobertura
 * total inventada. `criterion` y `event` son texto vigente, nunca
 * fechas, timers ni expiración.
 */

const DERIVED = [
  "derived.treatment.purposes_exist",
  "derived.treatment.retention_rules_exist",
  "derived.treatment.retention_rules_linked",
];

const MANUAL = [
  "retention.purpose_related",
  "retention.legal_basis_identified",
  "retention.criteria_defined",
  "retention.extended_justified",
  "retention.exceptions_documented",
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

export const RETENTION_SCHEDULE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "retention.schedule.v1",
  activity_key: "retention.schedule",
  version: 1,
  mode: "procedure",
  execution_scope: "treatment",
  title: "Procedimiento guiado de conservación y supresión",
  description:
    "Verifica que cada conjunto relevante cuente con criterio de conservación, fundamento, evento y responsable: reglas definidas, períodos justificados y excepciones documentadas.",
  entry_node_key: "relate-purpose",
  decision_fact_keys: [...MANUAL],
  external_fact_keys: [...DERIVED],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "relate-purpose",
      node_type: "question",
      title: "Conservación vinculada a finalidad",
      prompt:
        "¿Quedó relacionada la conservación con la finalidad correspondiente?",
      why_it_matters:
        "Sin vínculo con la finalidad no es posible juzgar si el período es necesario.",
      fact_key: "retention.purpose_related",
      answer_type: "single_select",
      options: stateOptions("retention.purpose_related"),
      evidence_to_review: ["matriz de conservación"],
      evidence_review_help: [
        {
          evidence_item: "matriz de conservación",
          review_guide:
            "Verificar que cada conjunto relevante de datos conservados esté asociado a una finalidad específica y reconocible, coherente con los tratamientos efectivamente realizados. Identificar información mantenida por motivos históricos, usos imprecisos o finalidades que podrían haber concluido, distinguiendo las relaciones justificadas de aquellas que necesitan aclaración.",
          no_evidence_guidance:
            "Consultar inventarios, sistemas y procedimientos para identificar qué información permanece almacenada y con qué propósito. Si no existe una vinculación documentada, reconstruir las asociaciones comprobables y registrar las pendientes, evitando atribuir finalidades no acreditadas o presumir que la antigüedad de los datos justifica conservarlos.",
          expected_result:
            "Una relación trazable entre los conjuntos de datos conservados y sus finalidades, con asociaciones verificables y situaciones pendientes claramente identificadas. Esta información debe permitir evaluar posteriormente la necesidad temporal de conservación, sin dar por justificados los plazos ni sus posibles excepciones.",
        },
      ],
      required_facts: [],
      default_next_node_key: "identify-legal-basis",
      related_activity_keys: ["treatment.purpose_define", "lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "identify-legal-basis",
      node_type: "question",
      title: "Fundamentos de conservación",
      prompt:
        "¿Quedaron identificadas las obligaciones legales que exigen conservación y los casos con autorización o consentimiento para períodos superiores?",
      why_it_matters:
        "Sin fundamento los períodos superiores carecen de justificación trazable.",
      fact_key: "retention.legal_basis_identified",
      answer_type: "single_select",
      options: stateOptions("retention.legal_basis_identified"),
      evidence_to_review: ["fundamentos legales cuando correspondan"],
      evidence_review_help: [
        {
          evidence_item: "fundamentos legales cuando correspondan",
          review_guide:
            "Comprobar las disposiciones que obliguen a conservar determinados datos, identificando su alcance, condiciones y períodos aplicables. Distinguir esas obligaciones de las autorizaciones legales o consentimientos invocados para prolongar la conservación, verificando que comprendan los datos y finalidades correspondientes y que permanezcan vigentes.",
          no_evidence_guidance:
            "Consultar la normativa sectorial, antecedentes contractuales y registros de consentimiento para localizar fundamentos aplicables. Si no se acredita una obligación o autorización para conservar por más tiempo, dejar constancia de esa situación y de las comprobaciones pendientes, sin inventar plazos ni presumir que una práctica histórica constituye fundamento legal.",
          expected_result:
            "Fundamentos identificados y respaldados según los datos y finalidades comprendidos, diferenciando obligaciones legales, autorizaciones y consentimientos válidos. Las limitaciones, excepciones y cuestiones pendientes deben quedar registradas para definir posteriormente los criterios de conservación, sin justificar extensiones de manera automática.",
        },
      ],
      required_facts: [],
      default_next_node_key: "define-criteria",
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "define-criteria",
      node_type: "question",
      title: "Criterios, eventos y responsables",
      prompt:
        "¿Quedaron definidos período o criterio de término, evento de supresión o anonimización y responsables operacionales?",
      why_it_matters:
        "Sin criterio, evento ni responsable la conservación queda sin ejecución posible.",
      fact_key: "retention.criteria_defined",
      answer_type: "single_select",
      options: stateOptions("retention.criteria_defined"),
      evidence_to_review: [
        "matriz de conservación",
        "reglas de supresión o anonimización",
        "responsables",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz de conservación",
          review_guide:
            "Comprobar que los conjuntos relevantes de datos tengan definido un plazo o criterio objetivo de término, relacionado con su finalidad y los fundamentos previamente identificados. Verificar que los períodos sean determinables, sus condiciones de aplicación estén claras y no existan conservaciones indefinidas sin justificación reconocible.",
          no_evidence_guidance:
            "Consultar inventarios, políticas y antecedentes de los procesos para reconstruir los criterios utilizados. Si existen períodos sin definir, identificar los conjuntos afectados y las decisiones pendientes, evitando asignar plazos arbitrarios o dar por válidas prácticas históricas sin fundamento.",
          expected_result:
            "Criterios de conservación documentados por conjunto de datos, con períodos o condiciones de término identificables y vinculados a sus finalidades. Las indefiniciones y excepciones pendientes deben quedar señaladas para su posterior justificación.",
        },
        {
          evidence_item: "reglas de supresión o anonimización",
          review_guide:
            "Verificar qué acción corresponde aplicar cuando finaliza el período justificado y qué evento activa su ejecución. Considerar los sistemas y repositorios pertinentes, comprobando que las reglas distingan la eliminación de la anonimización efectiva y no confundan esta última con una simple seudonimización.",
          no_evidence_guidance:
            "Revisar procedimientos, configuraciones y prácticas operacionales para localizar mecanismos de término existentes. Si no hay reglas definidas, identificar las acciones y condiciones que requieren formalización, sin presentar controles propuestos como implementados ni presumir que borrar datos de una interfaz implica su eliminación completa.",
          expected_result:
            "Reglas identificables para ejecutar la supresión o anonimización cuando corresponda, con eventos de activación y alcance operativo definidos. Las limitaciones técnicas y medidas pendientes deben quedar reconocidas, sin afirmar una ejecución que todavía no se ha producido.",
        },
        {
          evidence_item: "responsables",
          review_guide:
            "Identificar los cargos o áreas encargados de aplicar los criterios de conservación, activar las acciones de término y comprobar sus resultados. Revisar que sus funciones sean reconocibles y compatibles con los procedimientos y sistemas involucrados, evitando asignaciones ambiguas o sin capacidad operativa.",
          no_evidence_guidance:
            "Consultar la distribución interna de funciones y a las áreas que administran los datos para identificar quién realiza actualmente estas tareas. Cuando existan responsabilidades indefinidas, registrar las asignaciones pendientes y las actividades que requieren coordinación, sin atribuir funciones no confirmadas.",
          expected_result:
            "Funciones operacionales asignadas para aplicar los criterios y gestionar el destino de los datos, con responsabilidades de ejecución y verificación identificables. Las dependencias o asignaciones pendientes deben quedar documentadas para facilitar su implementación y seguimiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "justify-extended",
      provenance: "agency_standard",
    },
    {
      node_key: "justify-extended",
      node_type: "question",
      title: "Períodos superiores justificados",
      prompt:
        "¿Quedaron justificados los períodos superiores con autorización legal o consentimiento, o se descartó fundadamente su existencia?",
      why_it_matters:
        "Un período superior sin justificación excede lo necesario para la finalidad.",
      fact_key: "retention.extended_justified",
      answer_type: "single_select",
      options: conditionalOptions(
        "retention.extended_justified",
        "No existen períodos superiores que justificar en este caso.",
      ),
      evidence_to_review: [
        "fundamentos legales cuando correspondan",
        "evidencia de configuración o ejecución cuando corresponda",
      ],
      evidence_review_help: [
        {
          evidence_item: "fundamentos legales cuando correspondan",
          review_guide:
            "Verificar que cada extensión de conservación identificada cuente con una autorización legal aplicable o un consentimiento válido que comprenda los datos, finalidad y período involucrados. Comprobar el alcance y vigencia del fundamento, distinguiendo las obligaciones legales de las autorizaciones para conservar por más tiempo. Si no existen extensiones, corroborar que esa conclusión tenga respaldo.",
          no_evidence_guidance:
            "Consultar las normas aplicables, registros de consentimiento y criterios de conservación para localizar las justificaciones pertinentes. Si existe una extensión sin respaldo, registrar la situación y las comprobaciones pendientes, sin presumir autorizaciones. Cuando no haya períodos superiores, documentar esa circunstancia para sustentar la opción «No aplica».",
          expected_result:
            "Extensiones identificadas con fundamentos verificables y limitaciones reconocidas, o una constatación respaldada de que no existen períodos superiores. Los casos sin autorización suficiente deben quedar diferenciados de aquellos cuya justificación está acreditada, sin asumir validez automática.",
        },
        {
          evidence_item: "evidencia de configuración o ejecución cuando corresponda",
          review_guide:
            "Comprobar que las configuraciones, procedimientos o registros disponibles sean coherentes con los períodos superiores debidamente autorizados y sus condiciones de término. Distinguir reglas configuradas, ejecuciones efectivamente realizadas y acciones pendientes, verificando que la práctica no exceda lo justificado. Si no hay extensiones, confirmar que no corresponde exigir esta evidencia específica.",
          no_evidence_guidance:
            "Revisar parámetros de sistemas, procedimientos y antecedentes de las áreas responsables para localizar respaldos de aplicación. Cuando falten comprobantes, identificar las verificaciones pendientes sin presentar configuraciones propuestas como operativas. Si no existen períodos superiores, registrar su inaplicabilidad sin generar exigencias artificiales.",
          expected_result:
            "Antecedentes verificables sobre la aplicación de los períodos superiores autorizados, con configuraciones, ejecuciones y pendientes claramente diferenciados. Cuando no correspondan extensiones, una constatación fundada de inaplicabilidad, sin exigir pruebas de actuaciones que no debían realizarse.",
        },
      ],
      help_text: [
        "Solo cuando existan períodos superiores. En caso contrario marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "document-exceptions",
      provenance: "agency_standard",
    },
    {
      node_key: "document-exceptions",
      node_type: "question",
      title: "Excepciones documentadas",
      prompt: "¿Quedaron documentadas las excepciones con su evidencia?",
      why_it_matters:
        "Sin excepciones documentadas la matriz queda incompleta frente a revisión.",
      fact_key: "retention.exceptions_documented",
      answer_type: "single_select",
      options: stateOptions("retention.exceptions_documented"),
      evidence_to_review: ["matriz de conservación"],
      evidence_review_help: [
        {
          evidence_item: "matriz de conservación",
          review_guide:
            "Comprobar que las excepciones identificadas indiquen los conjuntos de datos afectados, su fundamento y las condiciones que justifican apartarse del criterio ordinario. Verificar que su alcance y respaldo sean reconocibles, distinguiendo excepciones vigentes, situaciones pendientes de aclaración y casos sujetos a las reglas generales de conservación.",
          no_evidence_guidance:
            "Consultar los fundamentos y decisiones documentados en las etapas anteriores para recuperar excepciones aplicables. Si faltan antecedentes, registrar los casos pendientes sin atribuir autorizaciones no acreditadas. Cuando no se identifiquen excepciones, dejar constancia fundada de esa circunstancia, sin crear supuestos inexistentes.",
          expected_result:
            "Excepciones aplicables registradas con su fundamento, alcance y evidencia correspondiente, diferenciadas de los criterios ordinarios y de los casos pendientes. Si no existen excepciones, una constatación respaldada que permita reconocer esa situación sin presumir incumplimientos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de la conservación",
      prompt:
        "El sistema verifica las reglas existentes y las verificaciones profesionales.",
      answer_type: "none",
      required_facts: [...DERIVED, ...MANUAL],
      transitions: [
        {
          rule_id: "rules-missing",
          description:
            "Sin reglas de conservación no hay programa que validar.",
          when: { op: "any", conditions: DERIVED.map(derivedNo) },
          goto_outcome_key: "rules_missing",
          explanation:
            "Faltan reglas, finalidades o vínculos válidos. Define cada elemento en el workspace.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación profesional está pendiente o sin información.",
          when: { op: "any", conditions: MANUAL.map(unresolved) },
          goto_outcome_key: "retention_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La conservación aún no queda definida.",
        },
        {
          rule_id: "all-verified",
          description:
            "Reglas existentes y verificaciones profesionales realizadas.",
          when: {
            op: "all",
            conditions: [
              ...DERIVED.map((f) => ({
                op: "fact_equals",
                fact_key: f,
                value: "yes",
              }) as FactCondition),
              isDone("retention.purpose_related"),
              isDone("retention.legal_basis_identified"),
              isDone("retention.criteria_defined"),
              verifiedOrNa("retention.extended_justified"),
              isDone("retention.exceptions_documented"),
            ],
          },
          goto_outcome_key: "retention_defined",
          explanation:
            "Todas las verificaciones están realizadas y respaldadas para este tratamiento.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "retention_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "retention_defined",
      label: "Conservación definida y fundada",
      classification: "agency_standard",
      explanation:
        "Existen reglas vinculadas y la finalidad, el fundamento, los criterios, los períodos superiores y las excepciones quedaron verificados.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la matriz de conservación",
          note: "Archiva la matriz con fundamentos, reglas de supresión o anonimización, responsables y evidencia de configuración o ejecución.",
        },
      ],
    },
    {
      outcome_key: "rules_missing",
      label: "Reglas por definir",
      classification: "agency_standard",
      explanation:
        "Faltan reglas de conservación, finalidades o vínculos válidos. La validación requiere objetos sobre los cuales pronunciarse.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Definir reglas en Tratamientos",
          note: "Agrega reglas de conservación vinculadas a datos en la sección Tratamientos de la empresa.",
        },
      ],
    },
    {
      outcome_key: "retention_in_progress",
      label: "Conservación en curso",
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
