import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.11.
 *
 * activity_key = treatment.change_review (decision, treatment scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * trigger, pasos operativos, evidencia, dependencias y state effect
 * del contenido canónico D2.11. Sin snapshots, sin historial de
 * cambios, sin versiones, sin instancias: la comparación
 * antes/después es insumo transitorio de la evaluación actual y el
 * deliverable documental conserva evidencia según mecanismos
 * existentes.
 *
 * Unidad jurídica: UN tratamiento existente frente a un cambio
 * material actual ("compara el tratamiento existente con su nueva
 * condición"). El trigger es evento transitorio, no historial.
 * `recompute` = re-evaluar reglas determinísticas contra facts
 * vigentes (la aplicabilidad y los derived se derivan en vivo); no es
 * operador ni efecto persistido.
 *
 * Dos ramas fieles al canon ("cuando el cambio requiera
 * interpretación"): la interpretativa adopta juicio profesional con
 * ReasoningRecord treatment-scoped; la mecánica cierra con outcome
 * determinístico sin efectos (misma familia del deterministic gap
 * conocido: NO se resuelve aquí).
 */

const TRIGGER_FACT = "change.detected";
const DATE_FACT = "change.date";
const DESC_FACT = "change.description";

const DECISION_FACTS = [
  TRIGGER_FACT,
  "change.attributes_identified",
  "change.impact_assessed",
  "change.inventory_updated",
  "change.requires_interpretation",
  DATE_FACT,
  DESC_FACT,
];

const DRAFT_FACT = "change.working_conclusion";

function considered(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function notConsidered(fact_key: string): FactCondition {
  return { op: "not", condition: considered(fact_key) };
}

function considerationOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Considerado con respaldo",
      description: "El factor fue considerado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No considerado",
      description: "El factor aún no ha sido considerado.",
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

export const TREATMENT_CHANGE_REVIEW_PROTOCOL: ExecutionProtocol = {
  protocol_key: "treatment.change_review.v1",
  activity_key: "treatment.change_review",
  version: 1,
  mode: "decision",
  execution_scope: "treatment",
  title: "Revisión guiada de cambios del tratamiento",
  description:
    "Estructura la revisión de un cambio material en el tratamiento activo: registra el cambio y su fecha, compara la condición anterior con la nueva, evalúa el impacto sobre finalidad y licitud, actualiza el inventario y documenta el juicio profesional cuando el cambio requiere interpretación.",
  entry_node_key: "trigger",
  decision_fact_keys: DECISION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "trigger",
      node_type: "question",
      title: "Cambio material",
      prompt:
        "¿El tratamiento cambió de manera que sea necesario reevaluar su finalidad, licitud, proporcionalidad, conservación u obligaciones relacionadas?",
      why_it_matters:
        "Sin cambio material no existe revisión que ejecutar.",
      fact_key: TRIGGER_FACT,
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí, existe un cambio material",
          description: "Se detectó un cambio que exige reevaluación.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "Sin cambio material",
          description: "No se detectó un cambio que exija reevaluación.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "Aún no es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: ["revisión de cambio", "entrevistas", "revisión de sistemas"],
      evidence_review_help: [
        {
          evidence_item: "revisión de cambio",
          review_guide:
            "Comprobar qué modificación se detectó o implementó y qué aspectos del tratamiento podría afectar, considerando finalidades, datos, fuentes, actores o condiciones operativas. Identificar antecedentes que permitan distinguir cambios relevantes para las obligaciones aplicables de ajustes menores que no alteran las condiciones jurídicas del tratamiento.",
          no_evidence_guidance:
            "Consultar solicitudes de modificación, antecedentes de proyectos y documentación de procesos para localizar cambios conocidos. Si no existe una revisión documentada, registrar las variaciones comprobables y las pendientes de aclaración, sin presumir que cualquier ajuste exige reevaluación ni descartar cambios por falta de registros.",
          expected_result:
            "Una identificación fundamentada de las modificaciones relevantes y de los aspectos potencialmente afectados, con incertidumbres reconocibles. Cuando no se detecte un cambio material, una constatación respaldada que permita diferenciar esa situación de la ausencia de información suficiente.",
        },
        {
          evidence_item: "entrevistas",
          review_guide:
            "Consultar a las áreas que conocen la operación para identificar cambios en los usos de datos, participantes, procedimientos o decisiones que no figuren en los documentos disponibles. Corroborar las diferencias señaladas con antecedentes concretos y distinguir modificaciones efectivas, propuestas todavía no aplicadas y percepciones sin respaldo.",
          no_evidence_guidance:
            "Identificar a quienes administran o ejecutan el tratamiento y recuperar comunicaciones o antecedentes de cambios conocidos. Si no se cuenta con información suficiente, señalar las consultas pendientes y los aspectos no confirmados, evitando atribuir modificaciones a declaraciones no verificadas.",
          expected_result:
            "Antecedentes operacionales verificables sobre posibles modificaciones, con fuentes consultadas y diferencias relevantes identificadas. Las variaciones confirmadas deben distinguirse de propuestas o situaciones inciertas para sustentar la determinación de materialidad.",
        },
        {
          evidence_item: "revisión de sistemas",
          review_guide:
            "Verificar si las configuraciones y funcionalidades vigentes incorporaron cambios en los datos tratados, accesos, integraciones, automatizaciones o mecanismos de conservación. Relacionar las diferencias encontradas con sus posibles consecuencias para el tratamiento, sin considerar que toda actualización tecnológica modifica su finalidad o licitud.",
          no_evidence_guidance:
            "Consultar configuraciones, registros de despliegue y documentación técnica para reconocer variaciones introducidas en los sistemas. Cuando falten antecedentes, identificar los componentes no comprobados y las verificaciones pendientes, sin equiparar la ausencia de registros con inexistencia de cambios.",
          expected_result:
            "Modificaciones técnicas identificadas con su alcance y posibles efectos sobre las condiciones del tratamiento, diferenciando cambios implementados, pendientes y no confirmados. La información debe contribuir a decidir si corresponde una reevaluación, sin anticipar su resultado jurídico.",
        },
      ],
      required_facts: [],
      transitions: [
        {
          rule_id: "trigger-present",
          description: "Existe un cambio material por revisar.",
          when: considered(TRIGGER_FACT),
          goto_node_key: "change-date",
          explanation: "La revisión del cambio procede sobre el tratamiento.",
        },
        {
          rule_id: "trigger-absent",
          description: "Sin cambio material no hay revisión pendiente.",
          when: { op: "fact_equals", fact_key: TRIGGER_FACT, value: "no" },
          goto_outcome_key: "no_change",
          explanation:
            "Sin cambio material detectado no existe revisión que ejecutar.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Sin determinar el cambio no es posible avanzar.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Primero debe determinarse si existe un cambio material.",
        },
      ],
      related_activity_keys: ["treatment.inventory_create"],
      provenance: "agency_standard",
    },
    {
      node_key: "change-date",
      node_type: "question",
      title: "Fecha del cambio",
      prompt:
        "¿En qué fecha ocurrió el cambio? Indica la fecha civil del cambio actual.",
      why_it_matters:
        "El canon exige registrar el cambio y su fecha como punto de partida de la revisión.",
      fact_key: DATE_FACT,
      answer_type: "date",
      evidence_to_review: ["registro de cambio"],
      evidence_review_help: [
        {
          evidence_item: "registro de cambio",
          review_guide:
            "Corroborar la fecha en que se produjo la modificación mediante solicitudes aprobadas, registros operativos o antecedentes técnicos disponibles. Distinguir la fecha efectiva de las de planificación, autorización o documentación, identificando cuál corresponde al cambio actual y dejando reconocibles las discrepancias relevantes.",
          no_evidence_guidance:
            "Consultar comunicaciones, registros de implementación y antecedentes de las áreas responsables para localizar una fecha comprobable. Si existen referencias contradictorias o insuficientes, señalar las verificaciones pendientes sin inventar fechas ni utilizar automáticamente la del día de revisión.",
          expected_result:
            "Una fecha civil identificable y respaldada para la modificación evaluada, con incertidumbres pendientes diferenciadas. El registro debe corresponder al cambio actual, sin representar un historial ni atribuir fechas de ejecución a actuaciones solamente planificadas.",
        },
      ],
      help_text: [
        "Una fecha por revisión: un cambio nuevo reemplaza la fecha anterior. No se conserva historial de cambios en el runtime.",
      ],
      required_facts: [TRIGGER_FACT],
      default_next_node_key: "change-description",
      provenance: "agency_standard",
    },
    {
      node_key: "change-description",
      node_type: "question",
      title: "Descripción del cambio",
      prompt:
        "Describe el cambio actual: qué atributos del tratamiento fueron modificados y cuál es la condición nueva frente a la anterior.",
      why_it_matters:
        "Sin identificar qué cambió no es posible evaluar el impacto ni comparar antes y después.",
      fact_key: DESC_FACT,
      answer_type: "text",
      evidence_to_review: ["registro de cambio", "revisión documental"],
      evidence_review_help: [
        {
          evidence_item: "registro de cambio",
          review_guide:
            "Precisar qué elementos del tratamiento fueron modificados, indicando su condición anterior, la nueva situación y la fecha relacionada. Distinguir cambios implementados de modificaciones todavía previstas, comprobando que la descripción permita reconocer diferencias concretas sin limitarse a expresiones generales como «actualización del proceso».",
          no_evidence_guidance:
            "Consultar solicitudes, comunicaciones y antecedentes de implementación para reconstruir la modificación identificada. Si faltan detalles sobre su alcance o estado, registrar lo comprobado y las aclaraciones pendientes, sin atribuir características anteriores o nuevas que no estén respaldadas.",
          expected_result:
            "Una descripción verificable del cambio actual, con atributos modificados, situación anterior y condición nueva claramente diferenciados. Las incertidumbres y actuaciones pendientes deben quedar reconocidas, sin presentar propuestas como modificaciones ejecutadas.",
        },
        {
          evidence_item: "revisión documental",
          review_guide:
            "Cotejar procedimientos, políticas, formularios o antecedentes técnicos anteriores con los documentos que describen la operación modificada. Identificar diferencias relevantes en finalidades, datos, participantes o medios utilizados, verificando que los documentos correspondan al tratamiento evaluado y reflejen su situación real.",
          no_evidence_guidance:
            "Localizar documentos vigentes, antecedentes de procesos y registros de modificaciones disponibles para reconstruir las condiciones comparables. Cuando falte documentación anterior o actual, identificar las diferencias comprobables y los aspectos pendientes, sin inventar versiones ni presumir que un documento actualizado demuestra la implementación efectiva.",
          expected_result:
            "Antecedentes documentales que respalden las diferencias identificadas entre las condiciones del tratamiento, con su alcance y limitaciones reconocibles. La información debe permitir continuar la evaluación de los atributos afectados, sin anticipar conclusiones sobre licitud o cumplimiento.",
        },
      ],
      help_text: [
        "Describe solo el cambio actual. La comparación antes/después es insumo de esta evaluación; no se conservan versiones anteriores en el runtime.",
      ],
      required_facts: [TRIGGER_FACT, DATE_FACT],
      default_next_node_key: "attributes",
      provenance: "agency_standard",
    },
    {
      node_key: "attributes",
      node_type: "question",
      title: "Atributos y finalidad",
      prompt:
        "¿Se identificaron los atributos modificados y se revisó si existe una finalidad nueva o modificada?",
      why_it_matters:
        "Una finalidad nueva o modificada condiciona la compatibilidad y la base de licitud.",
      fact_key: "change.attributes_identified",
      answer_type: "yes_no_unknown",
      options: considerationOptions("change.attributes_identified"),
      evidence_to_review: [
        "atributos modificados",
        "finalidad nueva o modificada",
      ],
      evidence_review_help: [
        {
          evidence_item: "atributos modificados",
          review_guide:
            "Identificar las diferencias concretas en categorías de datos, fuentes, participantes, sistemas, accesos o condiciones de conservación respecto de la operación anterior. Comprobar cuáles se implementaron efectivamente, su alcance y los antecedentes que las respaldan, distinguiendo modificaciones confirmadas de propuestas o situaciones pendientes.",
          no_evidence_guidance:
            "Consultar inventarios, registros de implementación y antecedentes de las áreas responsables para reconstruir los elementos afectados. Si la comparación es incompleta, documentar los cambios comprobados y las verificaciones pendientes, sin presumir modificaciones que no consten ni descartar diferencias por falta de documentación.",
          expected_result:
            "Atributos alterados identificados con su condición anterior, situación nueva y respaldo disponible, diferenciando cambios ejecutados, previstos e inciertos. La información debe permitir reconocer qué aspectos requieren evaluación posterior, sin anticipar consecuencias jurídicas.",
        },
        {
          evidence_item: "finalidad nueva o modificada",
          review_guide:
            "Comparar los propósitos originalmente declarados con los usos actuales o previstos de la información, comprobando si se mantienen, amplían o sustituyen. Identificar las operaciones y datos involucrados, distinguiendo una finalidad realmente diferente de cambios técnicos que no alteran el objetivo perseguido.",
          no_evidence_guidance:
            "Consultar las finalidades documentadas, comunicaciones a titulares y antecedentes del proceso modificado para aclarar los usos pretendidos. Cuando no pueda determinarse si existe una finalidad distinta, registrar esa incertidumbre y las comprobaciones pendientes, sin atribuir compatibilidad o licitud por anticipado.",
          expected_result:
            "Una determinación documentada sobre la permanencia, modificación o incorporación de finalidades, con usos y datos afectados identificables. Las dudas deben quedar reconocidas para evaluar posteriormente compatibilidad y fuente de licitud, sin considerar que toda variación exige automáticamente nuevo consentimiento.",
        },
      ],
      required_facts: [TRIGGER_FACT, DATE_FACT, DESC_FACT],
      default_next_node_key: "impact",
      provenance: "agency_standard",
    },
    {
      node_key: "impact",
      node_type: "question",
      title: "Impacto sobre licitud y obligaciones",
      prompt:
        "¿Se evaluó la compatibilidad del uso distinto, la base de licitud cuando corresponde, y la minimización, conservación, calidad, actores y fuentes afectados?",
      why_it_matters:
        "El cambio puede alterar la licitud y las obligaciones aplicables al tratamiento.",
      fact_key: "change.impact_assessed",
      answer_type: "yes_no_unknown",
      options: considerationOptions("change.impact_assessed"),
      evidence_to_review: [
        "evaluación de impacto sobre finalidad y licitud",
        "compatibilidad del uso distinto",
        "minimización, conservación, calidad, actores y fuentes",
      ],
      evidence_review_help: [
        {
          evidence_item: "evaluación de impacto sobre finalidad y licitud",
          review_guide:
            "Determinar cómo las modificaciones identificadas afectan los propósitos declarados y la fuente jurídica utilizada, considerando las operaciones y datos involucrados. Comprobar si el fundamento anterior continúa siendo aplicable o requiere una nueva evaluación, distinguiendo consecuencias acreditadas, riesgos potenciales y aspectos pendientes de interpretación.",
          no_evidence_guidance:
            "Consultar las finalidades, bases de licitud y antecedentes del cambio para reconstruir las condiciones que requieren revisión. Si faltan fundamentos o datos relevantes, registrar las cuestiones pendientes sin presumir que el tratamiento sigue siendo lícito ni declarar un incumplimiento por la sola existencia del cambio.",
          expected_result:
            "Una valoración documentada de las consecuencias del cambio sobre finalidad y licitud, con fundamentos aplicables, incertidumbres y revisiones necesarias identificadas. El análisis debe permitir reconocer las decisiones pendientes sin sustituir el juicio profesional posterior.",
        },
        {
          evidence_item: "compatibilidad del uso distinto",
          review_guide:
            "Comparar el propósito original con la utilización nueva o propuesta, atendiendo a su relación, contexto y expectativas razonables del titular. Verificar si concurre alguno de los supuestos legalmente admitidos para tratar datos con fines distintos y qué antecedentes lo sustentan, sin considerar suficiente una relación comercial genérica.",
          no_evidence_guidance:
            "Recuperar las finalidades inicialmente informadas, los antecedentes de recopilación y la descripción del nuevo uso. Si no puede acreditarse compatibilidad u otra habilitación aplicable, dejar constancia de las comprobaciones pendientes, evitando atribuir consentimiento o autorización legal inexistentes.",
          expected_result:
            "Una evaluación fundamentada del uso distinto y del supuesto jurídico eventualmente aplicable, con hechos y limitaciones reconocibles. Cuando no exista modificación de finalidad, una constatación respaldada de esa circunstancia, sin exigir artificialmente un análisis de compatibilidad.",
        },
        {
          evidence_item: "minimización, conservación, calidad, actores y fuentes",
          review_guide:
            "Revisar qué obligaciones pueden verse afectadas por los nuevos datos, períodos de conservación, fuentes, participantes o mecanismos operativos. Identificar diferencias relevantes respecto de la condición anterior y determinar qué controles o evaluaciones necesitan actualizarse, sin exigir repetir procesos que el cambio no afecta.",
          no_evidence_guidance:
            "Consultar el inventario, las reglas de conservación, los controles de calidad y los antecedentes de actores y procedencia. Si falta información sobre algún aspecto modificado, señalar las verificaciones pendientes y las áreas involucradas, sin presumir que todos los ámbitos requieren corrección.",
          expected_result:
            "Obligaciones y controles afectados identificados con sus antecedentes, revisiones necesarias y situaciones pendientes. Los ámbitos que permanecen sin cambios relevantes deben quedar diferenciados, permitiendo orientar las actualizaciones posteriores sin anticipar su ejecución.",
        },
      ],
      required_facts: [TRIGGER_FACT, "change.attributes_identified"],
      default_next_node_key: "inventory",
      provenance: "agency_standard",
    },
    {
      node_key: "inventory",
      node_type: "question",
      title: "Inventario actualizado",
      prompt:
        "¿Se actualizaron en el inventario del tratamiento los atributos afectados, de modo que las obligaciones y flags dependientes se recalculen sobre el estado vigente?",
      why_it_matters:
        "El inventario debe reflejar la condición nueva; la aplicabilidad y los derivados se recalculan en vivo desde los facts vigentes.",
      fact_key: "change.inventory_updated",
      answer_type: "yes_no_unknown",
      options: considerationOptions("change.inventory_updated"),
      evidence_to_review: ["actualización de inventario"],
      evidence_review_help: [
        {
          evidence_item: "actualización de inventario",
          review_guide:
            "Comprobar en «Tratamientos» que las finalidades, datos, fuentes, actores y demás atributos afectados reflejen las condiciones efectivamente vigentes. Verificar su correspondencia con el cambio evaluado e identificar campos desactualizados o pendientes, distinguiendo las modificaciones guardadas de las descritas únicamente en esta revisión.",
          no_evidence_guidance:
            "Consultar los antecedentes del cambio y la información disponible en «Tratamientos» para reconocer qué atributos requieren actualización. Si existen diferencias sin resolver, identificar las correcciones pendientes y sus responsables, sin considerar que documentar el cambio en la guía equivale a modificar el inventario.",
          expected_result:
            "Un inventario coherente con la condición vigente del tratamiento, con los atributos afectados actualizados y las discrepancias pendientes identificadas. La información registrada debe permitir que las obligaciones y flags dependientes se determinen desde los facts actuales, sin atribuir actualizaciones que no se realizaron.",
        },
      ],
      help_text: [
        "Actualiza los atributos en Tratamientos; esta guía verifica que se hizo, no duplica el inventario.",
      ],
      required_facts: [TRIGGER_FACT, "change.impact_assessed"],
      default_next_node_key: "interpretation",
      related_activity_keys: ["treatment.inventory_create"],
      provenance: "agency_standard",
    },
    {
      node_key: "interpretation",
      node_type: "question",
      title: "Interpretación profesional",
      prompt:
        "¿El cambio requiere interpretación profesional (compatibilidad de un uso distinto, nueva justificación, juicio sobre licitud)?",
      why_it_matters:
        "Solo el cambio que exige interpretación se cierra con juicio documentado; el cambio mecánico se registra sin deducir conclusiones.",
      fact_key: "change.requires_interpretation",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Requiere interpretación",
          description: "El cambio exige juicio profesional documentado.",
          fact_effect: { fact_key: "change.requires_interpretation", value: "yes" },
        },
        {
          value: "no",
          label: "Cambio mecánico",
          description: "El cambio se verifica y registra sin interpretación.",
          fact_effect: { fact_key: "change.requires_interpretation", value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "Aún no es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "change.requires_interpretation", value: "unknown" },
        },
      ],
      required_facts: [TRIGGER_FACT, "change.inventory_updated"],
      default_next_node_key: "sufficiency-gate",
      provenance: "agency_standard",
    },
    {
      node_key: "sufficiency-gate",
      node_type: "decision",
      title: "Suficiencia de la revisión",
      prompt:
        "El sistema verifica si la revisión está completa y qué camino corresponde.",
      answer_type: "none",
      required_facts: [...DECISION_FACTS],
      transitions: [
        {
          rule_id: "factors-pending",
          description:
            "Algún factor no fue considerado, está sin responder o sin información.",
          when: {
            op: "any",
            conditions: [
              notConsidered(TRIGGER_FACT),
              notConsidered("change.attributes_identified"),
              notConsidered("change.impact_assessed"),
              notConsidered("change.inventory_updated"),
              { op: "fact_unresolved", fact_key: DATE_FACT },
              { op: "fact_unresolved", fact_key: DESC_FACT },
              // El triaje sí/no/ausente decide la rama: sin responder o
              // sin información no hay cierre en ninguna dirección. Se
              // usa fact_unresolved (ausente o unknown) y NO notConsidered:
              // el valor "no" es la rama mecánica válida, no un pendiente.
              { op: "fact_unresolved", fact_key: "change.requires_interpretation" },
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan antecedentes por considerar. Sin la revisión completa no hay cierre.",
        },
        {
          rule_id: "mechanical-change",
          description:
            "Cambio verificado que no requiere interpretación profesional.",
          when: {
            op: "fact_equals",
            fact_key: "change.requires_interpretation",
            value: "no",
          },
          goto_outcome_key: "change_recorded",
          explanation:
            "El cambio se registra sin juicio: no hay interpretación que documentar.",
        },
        {
          rule_id: "ready-for-conclusion",
          description:
            "La revisión está completa y el cambio exige interpretación.",
          when: { op: "all", conditions: [] },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Existe base mínima para que el profesional adopte una conclusión documentada.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "adopt-conclusion",
      node_type: "question",
      title: "Adopción de la conclusión",
      prompt:
        "¿Adoptas la conclusión profesional de que la revisión del cambio fue completada?",
      why_it_matters:
        "Esta adopción es tu juicio profesional, no un cálculo del sistema: el sistema solo verificó que existe base suficiente para concluir.",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "change_review_completed",
          label: "Revisión completada",
          description:
            "Juicio profesional: el cambio fue revisado, el inventario actualizado y las obligaciones recalculadas sobre el estado vigente.",
          fact_effect: { fact_key: DRAFT_FACT, value: "change_review_completed" },
        },
      ],
      evidence_to_review: ["Revisión de Cambio de Tratamiento"],
      evidence_review_help: [
        {
          evidence_item: "Revisión de Cambio de Tratamiento",
          review_guide:
            "Valorar conjuntamente la modificación identificada, su fecha, las diferencias entre condiciones anteriores y nuevas, y las consecuencias sobre finalidad, licitud y obligaciones relacionadas. Comprobar que el inventario refleje los atributos vigentes y que el razonamiento explique las decisiones adoptadas, los fundamentos aplicables y los aspectos pendientes, sin considerar suficiente la sola validación automática de antecedentes.",
          no_evidence_guidance:
            "Recuperar los análisis, respaldos del cambio y verificaciones del inventario realizados en las etapas anteriores. Si existen decisiones sin fundamento, actualizaciones no comprobadas o consecuencias jurídicas sin resolver, identificar las revisiones pendientes antes de adoptar la conclusión. No declarar completada una evaluación cuya documentación no permita sostener el juicio profesional.",
          expected_result:
            "Una conclusión profesional fundamentada y trazable sobre la revisión del cambio, con hechos, criterios jurídicos y decisiones identificables. El registro debe distinguir las obligaciones reevaluadas, las actuaciones realizadas y los asuntos pendientes, sin presentar la revisión completada como garantía automática de cumplimiento integral.",
        },
      ],
      help_text: [
        "Documenta tu razonamiento a continuación. La conclusión solo queda registrada al adoptar con razonamiento válido.",
      ],
      required_facts: [...DECISION_FACTS],
    },
  ],
  outcomes: [
    {
      outcome_key: "assessment_incomplete",
      label: "Revisión incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o con información insuficiente. Esto no es una conclusión sobre el cambio.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar revisión",
        },
      ],
    },
    {
      outcome_key: "no_change",
      label: "Sin cambio material",
      classification: "agency_standard",
      explanation:
        "No se detectó un cambio que exija reevaluación: no hay revisión pendiente.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la verificación",
          note: "Archiva la verificación de ausencia de cambios materiales.",
        },
      ],
    },
    {
      outcome_key: "change_recorded",
      label: "Cambio registrado",
      classification: "agency_standard",
      explanation:
        "Cambio verificado y registrado sin interpretación profesional: el inventario quedó actualizado sobre el estado vigente.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Verificar inventario en D2.01",
          activity_key: "treatment.inventory_create",
        },
        {
          kind: "info",
          label: "Conservar el registro",
          note: "Archiva el Registro de Cambio con fecha, descripción y comparación antes/después.",
        },
      ],
    },
    {
      outcome_key: "change_review_completed",
      label: "Revisión completada",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la revisión del cambio fue completada.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "treatment.change_review_status", value: "completed" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Verificar inventario en D2.01",
          activity_key: "treatment.inventory_create",
        },
        {
          kind: "info",
          label: "Conservar el registro",
          note: "Archiva la Revisión de Cambio de Tratamiento con el Reasoning Record cuando corresponda.",
        },
      ],
    },
  ],
  reasoning_requirements: {
    required_fields: [
      "conclusion",
      "legal_question",
      "facts_considered",
      "legal_factors",
      "alternatives_considered",
      "rationale",
      "decided_by",
      "decided_at",
      "legal_basis",
    ],
  },
};
