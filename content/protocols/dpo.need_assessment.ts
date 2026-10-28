import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo piloto de ejecución guiada.
 *
 * activity_key = dpo.need_assessment (D1.02).
 * Contenido canónico aprobado por la iteración vigente; no inventar,
 * completar ni reinterpretar. La UI lo consume de forma genérica y nunca
 * duplica sus preguntas.
 *
 * Distinción obligatoria preservada en todo el protocolo:
 * - obligación derivada del MPI (consecuencia del estado MPI);
 * - recomendación profesional de la agencia (estándar metodológico).
 * Nunca se mezclan.
 *
 * Auditoría de materialización (reconciliación D1): el state_effect
 * `dpo.recommendation_outcome` es un valor singular autónomo
 * (divisible: la prohibición de activar obligación por recomendación
 * ya se honra vía clasificación), pero sus outcomes deterministas no
 * tienen vía de materialización compatible con contratos actuales — la
 * finalización explícita genérica cubre solo procedure/checklist y su
 * extensión a decision excede lo autorizado. Sin efectos declarados:
 * execution-ready, product-ready=false (gap estructural: vía de
 * materialización para outcomes deterministas de decision).
 */

/** Hechos de recomendación profesional que deben estar resueltos. */
const DECISION_FACTS = [
  "dpo_assessment.high_impact_data",
  "dpo_assessment.large_scale",
  "dpo_assessment.automated_significant_effects",
  "dpo_assessment.systematic_public_monitoring",
  "dpo_assessment.international_transfers",
  "dpo_assessment.processor_complexity",
  "dpo_assessment.low_maturity",
];

/** Factores de soporte contables para recommended / not_priority. */
const SUPPORT_FACTS = [
  "dpo_assessment.high_impact_data",
  "dpo_assessment.large_scale",
  "dpo_assessment.international_transfers",
  "dpo_assessment.processor_complexity",
  "dpo_assessment.low_maturity",
];

/** Subconjunto para la regla F (low_maturity + dos factores). */
const RULE_F_FACTS = [
  "dpo_assessment.high_impact_data",
  "dpo_assessment.large_scale",
  "dpo_assessment.international_transfers",
  "dpo_assessment.processor_complexity",
];

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function countYes(facts: string[], at_least: number): FactCondition {
  return { op: "count_true", facts, equals: "yes", at_least };
}

export const DPO_NEED_ASSESSMENT_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.need_assessment.v1",
  activity_key: "dpo.need_assessment",
  version: 1,
  mode: "decision",
  title: "Evaluación guiada de necesidad y recomendación de DPO",
  description:
    "Determina si existe obligación de contar con DPO derivada del estado del MPI y, cuando no existe obligación, establece el nivel de recomendación profesional aplicable según metodología de la agencia.",
  entry_node_key: "mpi-status",
  decision_fact_keys: DECISION_FACTS,
  last_review: "2026-09-22",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "mpi-status",
      node_type: "question",
      title: "Estado actual del MPI",
      prompt: "¿Cuál es el estado actual del Modelo de Prevención de Infracciones?",
      why_it_matters:
        "Un MPI formalmente adoptado o en implementación activa el requerimiento de contar con DPO como componente del programa. Esta comprobación se realiza antes de cualquier recomendación profesional.",
      fact_key: "mpi.lifecycle_status",
      answer_type: "single_select",
      options: [
        {
          value: "not_assessed",
          label: "No evaluado",
          description: "Aún no se ha evaluado la conveniencia de adoptar un MPI.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "not_assessed" },
        },
        {
          value: "not_adopted",
          label: "No adoptado",
          description: "Se evaluó y se decidió no adoptar un MPI.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "not_adopted" },
        },
        {
          value: "under_evaluation",
          label: "En evaluación",
          description: "La conveniencia de adoptar un MPI está en estudio.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "under_evaluation" },
        },
        {
          value: "adoption_formalized",
          label: "Adopción formalizada",
          description: "Existe acuerdo, acta o evidencia de adopción formal.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "adoption_formalized" },
        },
        {
          value: "implementing",
          label: "En implementación",
          description: "El programa MPI está en proceso de implementación.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "implementing" },
        },
        {
          value: "implemented",
          label: "Implementado",
          description: "El programa MPI se encuentra implementado y operativo.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "implemented" },
        },
        {
          value: "discontinued",
          label: "Discontinuado",
          description: "El MPI fue terminado y ya no se encuentra vigente.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "discontinued" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinar el estado con respaldo disponible.",
          fact_effect: { fact_key: "mpi.lifecycle_status", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "acuerdo, acta o evidencia de adopción",
        "registro interno del lifecycle MPI",
        "programa MPI existente",
        "evidencia de implementación",
      ],
      evidence_review_help: [
        {
          evidence_item: "acuerdo, acta o evidencia de adopción",
          review_guide:
            "Revisar los acuerdos, actas, decisiones de la autoridad competente u otros antecedentes que permitan determinar si la organización adoptó formalmente un Modelo de Prevención de Infracciones. Comprobar quién tomó la decisión, su fecha, el alcance de la adopción y si los antecedentes se refieren expresamente a un programa de cumplimiento identificable. Distinguir la decisión formal de estudiar o preparar un modelo de la decisión de adoptarlo.",
          no_evidence_guidance:
            "Registrar que no se encontró evidencia suficiente para confirmar la adopción formal y señalar qué antecedentes permitirían verificarla, por ejemplo, actas, acuerdos de dirección o documentación del programa. No concluir automáticamente que el MPI no existe por la ausencia de un acta específica: considerar otras evidencias verificables y dejar constancia de las limitaciones de la revisión.",
          expected_result:
            "Una conclusión respaldada sobre si se ha identificado evidencia de adopción formal del MPI, con la fecha, el alcance y los antecedentes relevantes disponibles, o con las comprobaciones pendientes claramente identificadas.",
        },
        {
          evidence_item: "registro interno del lifecycle MPI",
          review_guide:
            "Examinar el registro interno utilizado para seguir el ciclo de vida del MPI, si existe. Comprobar qué estado se le atribuye, las fechas y los cambios registrados, quién actualizó la información y qué antecedentes respaldan cada transición. Diferenciar las etapas de evaluación, preparación, adopción e implementación según la terminología y los estados que utilice la organización. Contrastar el registro con otras evidencias disponibles cuando sea necesario.",
          no_evidence_guidance:
            "Precisar si el registro no existe, no está actualizado, no contiene antecedentes suficientes o no pudo consultarse. Si no existe un registro específico, comprobar si el estado del MPI puede reconstruirse con otras evidencias verificables. No confundir la falta de un registro de ciclo de vida con la inexistencia del propio modelo.",
          expected_result:
            "Una descripción verificable del estado del MPI según los antecedentes disponibles, con sus principales hitos, fechas, cambios de estado y brechas de información, sin atribuirle etapas que no estén respaldadas.",
        },
        {
          evidence_item: "programa MPI existente",
          review_guide:
            "Solicitar y revisar la documentación que la organización identifica como su programa MPI. Comprobar su alcance, versión, responsable, fecha y contenido, y contrastar sus elementos con la estructura del programa de cumplimiento prevista en el artículo 49 de la Ley N.º 19.628, según la modificación de la Ley N.º 21.719, y el Decreto N.º 662 de 2026. Distinguir entre un documento preliminar, una propuesta de programa y un programa adoptado por la organización. Tener presente la fecha de entrada en vigor de las disposiciones citadas al evaluar su aplicabilidad temporal.",
          no_evidence_guidance:
            "Registrar si no se localizó un programa identificable, si solo existe un borrador o si la documentación disponible no permite confirmar su adopción o alcance. Comprobar si existen documentos relacionados que permitan aclarar la situación. No equiparar automáticamente políticas o controles aislados con un MPI, ni afirmar incumplimiento por la falta de un documento con un nombre o formato específico.",
          expected_result:
            "Una conclusión sobre la existencia, identificación, versión, alcance y estado documental del programa MPI, con las diferencias entre borrador, adopción e implementación claramente señaladas y las verificaciones pendientes identificadas.",
        },
        {
          evidence_item: "evidencia de implementación",
          review_guide:
            "Revisar antecedentes que permitan comprobar si el programa MPI se está llevando a la práctica, como asignaciones de responsabilidades, actividades realizadas, protocolos aplicados, registros de seguimiento u otras evidencias pertinentes al programa identificado. Contrastar estos antecedentes con el alcance y el estado declarado del MPI, considerando fechas, responsables y trazabilidad. Diferenciar la existencia documental del programa de su implementación efectiva y valorar la evidencia en su conjunto.",
          no_evidence_guidance:
            "Precisar qué aspectos de la implementación no pudieron verificarse y qué antecedentes serían necesarios para comprobarlos. Distinguir entre un programa adoptado cuya implementación todavía no comienza, una implementación parcial y la falta de acceso a evidencia suficiente. No concluir que el programa está implementado solo porque existe un documento ni que no existe por no haberse localizado un registro específico.",
          expected_result:
            "Una valoración del grado de implementación que pueda sostenerse con la evidencia disponible, indicando las actividades verificadas, las que están pendientes o no pudieron comprobarse y las brechas entre el estado declarado y el estado observado.",
        },
      ],
      required_facts: [],
      default_next_node_key: "high-impact-data",
      transitions: [
        {
          rule_id: "mpi-active",
          description: "MPI formalmente adoptado, en implementación o implementado.",
          when: {
            op: "fact_in",
            fact_key: "mpi.lifecycle_status",
            values: ["adoption_formalized", "implementing", "implemented"],
          },
          goto_outcome_key: "required_by_mpi",
          explanation:
            "El MPI se encuentra formalmente adoptado, en implementación o implementado. El DPO debe formar parte del programa.",
        },
        {
          rule_id: "mpi-unknown",
          description: "Estado MPI desconocido impide concluir.",
          when: {
            op: "fact_equals",
            fact_key: "mpi.lifecycle_status",
            value: "unknown",
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "El estado del MPI es desconocido. Sin este antecedente no es posible determinar obligación ni recomendación.",
        },
      ],
      related_activity_keys: ["mpi.lifecycle_review"],
      provenance: "agency_standard",
    },
    {
      node_key: "high-impact-data",
      node_type: "question",
      title: "Datos de impacto especial",
      prompt:
        "¿La organización trata datos de impacto especial en al menos uno de sus tratamientos como responsable?",
      why_it_matters:
        "El tratamiento de categorías de mayor impacto eleva la recomendación profesional de contar con DPO como criterio metodológico.",
      fact_key: "dpo_assessment.high_impact_data",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe al menos una de las categorías indicadas.",
          fact_effect: { fact_key: "dpo_assessment.high_impact_data", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "Ninguna de las categorías indicadas está presente.",
          fact_effect: { fact_key: "dpo_assessment.high_impact_data", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo_assessment.high_impact_data", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "inventario de tratamientos",
        "categorías de datos",
        "formularios",
        "sistemas",
        "contratos o procesos relevantes",
      ],
      evidence_review_help: [
        {
          evidence_item: "inventario de tratamientos",
          review_guide:
            "Revisar el inventario para identificar los tratamientos en los que la organización actúa como responsable y comprobar qué categorías de datos se recogen, utilizan, conservan, comunican o de otro modo se tratan. Identificar al menos un tratamiento concreto que pueda incluir alguna de las categorías consideradas por este criterio metodológico. Comprobar la finalidad, las personas afectadas y las fuentes de información disponibles, y contrastar el inventario con otras evidencias cuando existan dudas sobre su actualidad o cobertura.",
          no_evidence_guidance:
            "Precisar si no existe un inventario disponible, si está incompleto o desactualizado, o si no permite identificar las categorías tratadas. Si el inventario no es suficiente, consultar otras fuentes verificables, como formularios, sistemas o documentación de procesos. No concluir que la organización no trata categorías de impacto especial únicamente porque estas no estén identificadas en el inventario.",
          expected_result:
            "Una identificación de los tratamientos pertinentes en los que la organización actúa como responsable, las categorías de datos que cuentan con respaldo suficiente y las limitaciones o comprobaciones pendientes.",
        },
        {
          evidence_item: "categorías de datos",
          review_guide:
            "Examinar las categorías de datos asociadas a cada tratamiento e identificar si existe al menos una de las consideradas por el criterio metodológico: datos personales sensibles, incluidos los relativos a la salud; datos relativos al perfil biológico humano; datos biométricos; datos de menores de 14 años; o datos relativos a obligaciones de carácter económico, financiero, bancario o comercial comprendidos en el Título III. Distinguir las categorías según su naturaleza y fundamento jurídico, sin asumir que todas tienen idéntica clasificación o régimen legal. Registrar el tratamiento en que aparecen y la evidencia que respalda la identificación.",
          no_evidence_guidance:
            "Indicar qué categorías no pudieron confirmarse y qué información permitiría verificarlas. Distinguir entre una categoría que no se trata, una que podría estar presente pero no ha sido comprobada y una cuya clasificación requiere aclaración. No inferir la existencia de datos de salud, biométricos, de menores o económicos únicamente por el tipo de organización o por el nombre de un tratamiento.",
          expected_result:
            "Una relación de las categorías identificadas, vinculadas con tratamientos concretos y con su respaldo documental, indicando las categorías no confirmadas y las aclaraciones pendientes, si las hubiera.",
        },
        {
          evidence_item: "formularios",
          review_guide:
            "Revisar los formularios utilizados para recoger datos de clientes, trabajadores, proveedores u otras personas. Identificar qué campos solicitan, a quiénes se dirigen y para qué finalidad se utilizan. Comprobar si los campos permiten identificar alguna de las categorías consideradas por el criterio metodológico y contrastarlos con el tratamiento al que pertenecen. Tener presente que la existencia de un campo en un formulario no demuestra por sí sola que el dato se recoja efectivamente ni que se utilice en todos los casos.",
          no_evidence_guidance:
            "Precisar si los formularios no están disponibles, no representan los procesos actuales o no permiten determinar qué datos se recogen. Cuando corresponda, solicitar ejemplos vigentes o comprobar otras fuentes de recogida de información. No concluir que una categoría está presente solo por una posibilidad técnica o por una descripción genérica del formulario.",
          expected_result:
            "Una identificación de los formularios relevantes, los campos que pueden corresponder a categorías de impacto especial, sus finalidades y los tratamientos asociados, distinguiendo lo comprobado de lo que requiere validación.",
        },
        {
          evidence_item: "sistemas",
          review_guide:
            "Examinar los sistemas y aplicaciones utilizados en los tratamientos pertinentes para determinar qué categorías de datos se almacenan, consultan, generan o utilizan realmente. Contrastar la configuración, los campos, los registros o la documentación disponible con el inventario y los formularios. Considerar, cuando proceda, datos derivados o generados por el sistema, incluidos perfiles biológicos o biométricos, sin presumir su existencia por las capacidades técnicas de la herramienta. Registrar el sistema, el tratamiento y los antecedentes que respaldan cada conclusión.",
          no_evidence_guidance:
            "Indicar qué sistemas o fuentes no pudieron revisarse y qué categorías no pudieron verificarse. Distinguir entre una capacidad técnica que permitiría tratar determinados datos y evidencia de que efectivamente se tratan. Si no se dispone de acceso directo, identificar la documentación o confirmación de los responsables del sistema que permitiría aclarar la situación.",
          expected_result:
            "Una relación de los sistemas examinados, las categorías identificadas en tratamientos concretos y las evidencias que respaldan la conclusión, con las limitaciones de acceso y verificaciones pendientes claramente señaladas.",
        },
        {
          evidence_item: "contratos o procesos relevantes",
          review_guide:
            "Revisar los contratos, procedimientos y demás documentación de procesos que permitan determinar qué datos se utilizan en la práctica y con qué finalidad. Prestar atención a los procesos que involucren información de salud, biométrica, biológica, de menores de 14 años o relativa a obligaciones económicas, financieras, bancarias o comerciales. Contrastar lo documentado con el tratamiento real y con la función que desempeña la organización como responsable. No asumir que la mera mención de una categoría en un contrato demuestra que la organización efectivamente la trata.",
          no_evidence_guidance:
            "Precisar qué contratos o procesos relevantes no pudieron examinarse y qué antecedentes permitirían confirmar las categorías tratadas. Distinguir entre una referencia contractual, una actividad prevista y un tratamiento efectivamente realizado. Si el contrato no permite aclarar la situación, identificar qué información debe confirmarse con los responsables del proceso.",
          expected_result:
            "Una valoración de los contratos y procesos examinados que identifique las categorías de impacto especial respaldadas por evidencia, los tratamientos relacionados y las cuestiones pendientes de confirmar.",
        },
      ],
      help_text: [
        "Considera como factor positivo si existe al menos una de estas categorías: datos sensibles; datos de salud; perfil biológico; datos biométricos; datos de menores de 14 años; datos económicos, financieros, bancarios o comerciales comprendidos en el Título III.",
        "Este factor no convierte por sí solo al DPO en obligatorio. Se utiliza como criterio metodológico de recomendación.",
      ],
      required_facts: [],
      default_next_node_key: "large-scale",
      provenance: "agency_standard",
    },
    {
      node_key: "large-scale",
      node_type: "question",
      title: "Escala del tratamiento",
      prompt: "¿Existe tratamiento masivo o a gran escala?",
      why_it_matters:
        "La escala del tratamiento es un criterio metodológico central de la recomendación profesional.",
      fact_key: "dpo_assessment.large_scale",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe tratamiento masivo o a gran escala documentado.",
          fact_effect: { fact_key: "dpo_assessment.large_scale", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "No existe tratamiento masivo o a gran escala.",
          fact_effect: { fact_key: "dpo_assessment.large_scale", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "La escala no puede determinarse con respaldo.",
          fact_effect: { fact_key: "dpo_assessment.large_scale", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "número aproximado de titulares",
        "volumen de datos",
        "duración",
        "extensión geográfica",
        "continuidad del tratamiento",
        "clasificación de escala documentada",
      ],
      evidence_review_help: [
        {
          evidence_item: "número aproximado de titulares",
          review_guide:
            "Revisar las fuentes disponibles para estimar cuántas personas son titulares de los datos en el tratamiento evaluado. Utilizar cifras, rangos o estimaciones respaldadas por registros, informes, métricas del sistema u otras fuentes verificables. Identificar el período al que corresponde la cifra y comprobar que se refiere a personas titulares, sin confundirlas automáticamente con el número de registros, transacciones o interacciones. Valorar esta dimensión junto con el volumen, la duración, la extensión geográfica y la continuidad del tratamiento.",
          no_evidence_guidance:
            "Precisar si no existen cifras disponibles, si solo hay estimaciones parciales o si las fuentes no permiten determinar a cuántos titulares alcanza el tratamiento. Indicar qué información permitiría mejorar la estimación. No inventar cifras ni deducir el número de titulares únicamente a partir del tamaño de la organización, su número de clientes o la capacidad teórica de un sistema.",
          expected_result:
            "Una estimación respaldada del número de titulares afectados, con su período de referencia, fuente y limitaciones conocidas, vinculada al tratamiento concreto que se evalúa.",
        },
        {
          evidence_item: "volumen de datos",
          review_guide:
            "Examinar las fuentes disponibles para determinar el volumen de datos personales tratados y su evolución, utilizando las métricas pertinentes al tratamiento, como cantidad de registros, archivos, eventos o transacciones, cuando correspondan. Aclarar qué mide cada cifra, a qué período se refiere y si representa datos acumulados, datos nuevos o actividad procesada. Evitar equiparar automáticamente el número de registros con el número de titulares. Interpretar esta dimensión junto con las demás características de escala.",
          no_evidence_guidance:
            "Indicar qué métricas no están disponibles o por qué no permiten estimar el volumen real del tratamiento. Identificar los informes, registros o datos operativos que podrían aportar respaldo. No utilizar cifras hipotéticas ni asumir que una gran capacidad técnica implica que ese volumen de datos se trata efectivamente.",
          expected_result:
            "Una descripción o estimación verificable del volumen de datos tratados, con la unidad de medida, el período y la fuente correspondiente, además de las limitaciones relevantes.",
        },
        {
          evidence_item: "duración",
          review_guide:
            "Revisar cuánto tiempo se desarrolla o se prevé desarrollar el tratamiento y durante cuánto tiempo se conservan o utilizan los datos, según corresponda. Consultar políticas de conservación, procedimientos, contratos, registros operativos o documentación equivalente. Distinguir la duración de una operación puntual del período durante el cual el tratamiento se mantiene activo y de los plazos de conservación de los datos. Considerar esta dimensión junto con la cantidad de titulares, el volumen, la extensión geográfica y la continuidad.",
          no_evidence_guidance:
            "Indicar si no está definida la duración, si solo se dispone de plazos parciales o si no puede confirmarse el período real de actividad o conservación. Identificar qué documentación o confirmación permitiría aclararlo. No asumir que un tratamiento es breve porque una operación sea puntual, ni que es prolongado únicamente porque los datos puedan conservarse técnicamente.",
          expected_result:
            "Una descripción respaldada de la duración del tratamiento y, cuando resulte pertinente, de sus períodos de conservación, diferenciando los datos confirmados de los aspectos pendientes de aclaración.",
        },
        {
          evidence_item: "extensión geográfica",
          review_guide:
            "Examinar el alcance geográfico real del tratamiento, considerando dónde se encuentran las personas titulares afectadas, en qué territorios se desarrolla la actividad y dónde se recogen, consultan, almacenan o utilizan los datos, cuando estos aspectos sean relevantes. Revisar el inventario de tratamientos, los procesos, los sistemas, los contratos y otras fuentes disponibles. Distinguir el alcance geográfico de la organización como entidad del alcance efectivo del tratamiento evaluado.",
          no_evidence_guidance:
            "Precisar qué aspectos del alcance geográfico no pudieron determinarse y qué antecedentes permitirían verificarlos. No inferir una cobertura nacional o internacional solo porque la organización tenga presencia en varios territorios, use servicios en la nube o pueda acceder técnicamente a información desde distintos lugares.",
          expected_result:
            "Una descripción del alcance geográfico respaldada por evidencia, vinculada al tratamiento evaluado y con las incertidumbres o limitaciones identificadas.",
        },
        {
          evidence_item: "continuidad del tratamiento",
          review_guide:
            "Revisar si el tratamiento se realiza de manera continua, periódica, recurrente, estacional o puntual. Consultar procedimientos, registros de actividad, calendarios operativos, contratos o documentación equivalente. Distinguir la continuidad efectiva del tratamiento de su mera posibilidad técnica y de la duración durante la cual se conservan los datos. Valorar la frecuencia y la regularidad junto con las demás dimensiones de escala.",
          no_evidence_guidance:
            "Indicar si no existen registros suficientes para establecer la frecuencia o regularidad, o si la documentación disponible solo describe el proceso previsto. Identificar qué información operativa permitiría confirmar cómo se realiza realmente el tratamiento. No considerar que un sistema permanentemente disponible demuestra por sí solo que el tratamiento sea continuo.",
          expected_result:
            "Una caracterización respaldada de la frecuencia y continuidad del tratamiento, diferenciando la actividad efectiva de la capacidad técnica y señalando las comprobaciones pendientes.",
        },
        {
          evidence_item: "clasificación de escala documentada",
          review_guide:
            "Comprobar si existe una clasificación de escala previamente documentada para el tratamiento evaluado. Revisar su fuente, fecha, alcance, metodología y justificación, así como los datos utilizados para establecerla. Verificar que la clasificación corresponda al tratamiento concreto y que siga siendo pertinente respecto de su alcance y funcionamiento actuales. Si la metodología interna ya dispone de criterios documentados, utilizar esos criterios sin sustituirlos por umbrales inventados. Contrastar la clasificación con las evidencias disponibles sobre número de titulares, volumen, duración, extensión geográfica y continuidad. Distinguir una clasificación documentada de una conclusión informal o de una etiqueta sin justificación verificable.",
          no_evidence_guidance:
            "Precisar si no existe una clasificación documentada, si la clasificación encontrada carece de justificación suficiente o si está desactualizada o corresponde a otro tratamiento. Cuando no exista una clasificación utilizable, dejar constancia de esa limitación y valorar las dimensiones de escala a partir de las evidencias disponibles, sin inventar umbrales numéricos ni presentar una estimación no respaldada como una clasificación formal.",
          expected_result:
            "La clasificación documentada que corresponda al tratamiento, con su fuente, fecha y justificación, o una descripción clara de su ausencia, insuficiencia o falta de vigencia. Identificar las evidencias que respaldan la valoración y los aspectos que todavía no pueden determinarse.",
        },
      ],
      help_text: [
        "No existe en esta metodología un umbral legal numérico inventado. Utiliza la clasificación ya documentada cuando exista. Si la escala no puede determinarse con respaldo, responde Desconocido.",
      ],
      required_facts: [],
      default_next_node_key: "automated-significant-effects",
      provenance: "agency_standard",
    },
    {
      node_key: "automated-significant-effects",
      node_type: "question",
      title: "Automatización con efectos significativos",
      prompt:
        "¿Existe evaluación sistemática o perfilamiento automatizado que produzca efectos jurídicos o afecte significativamente al titular?",
      why_it_matters:
        "La automatización con efectos significativos activa por sí sola la recomendación fuerte según metodología de la agencia.",
      fact_key: "dpo_assessment.automated_significant_effects",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe evaluación sistemática o perfilamiento con efectos significativos.",
          fact_effect: {
            fact_key: "dpo_assessment.automated_significant_effects",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "No",
          description: "No existe tal automatización.",
          fact_effect: {
            fact_key: "dpo_assessment.automated_significant_effects",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo_assessment.automated_significant_effects",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "scoring",
        "perfiles",
        "decisiones automatizadas",
        "elegibilidad",
        "rechazo automático",
        "decisiones laborales",
        "acceso a productos o servicios",
      ],
      evidence_review_help: [
        {
          evidence_item: "scoring",
          review_guide:
            "Examinar si el tratamiento calcula puntuaciones, índices, clasificaciones o valoraciones sobre personas a partir de datos personales. Identificar qué variables se utilizan, qué aspecto de la persona se evalúa, con qué finalidad se calcula la puntuación y qué uso se hace de ella. Comprobar si el resultado es meramente informativo o si influye en decisiones posteriores, como aprobar una solicitud, determinar condiciones, priorizar candidatos o limitar el acceso a un producto o servicio. Revisar la documentación del modelo, las reglas de negocio, los sistemas y ejemplos de resultados cuando estén disponibles. No asumir que una puntuación produce efectos significativos por el mero hecho de existir.",
          no_evidence_guidance:
            "Indicar si no se ha podido confirmar que existan puntuaciones, si se desconoce cómo se calculan o si no se ha determinado cómo se utilizan. Identificar qué documentación o confirmación del responsable del proceso permitiría aclararlo. No inferir la existencia de scoring por el simple uso de software, inteligencia artificial o herramientas analíticas.",
          expected_result:
            "Una descripción respaldada de las puntuaciones identificadas, las variables o factores considerados cuando se conozcan, su finalidad y su influencia real o prevista en las decisiones que afectan a las personas.",
        },
        {
          evidence_item: "perfiles",
          review_guide:
            "Comprobar si se elaboran perfiles de personas a partir de sus datos, por ejemplo, para inferir preferencias, comportamiento, solvencia, rendimiento, intereses, riesgos o características personales. Revisar qué datos se utilizan, qué aspectos se infieren, con qué finalidad y cómo se emplean los resultados. Distinguir entre la segmentación general de productos o audiencias y la elaboración de perfiles vinculados a personas identificadas o identificables. Verificar si el perfil se utiliza para evaluar a una persona, predecir su comportamiento o condicionar decisiones que puedan afectarla. No asumir que toda segmentación estadística constituye automáticamente un perfil individual con efectos significativos.",
          no_evidence_guidance:
            "Precisar si no se ha podido confirmar la elaboración de perfiles, si se desconocen las variables utilizadas o si no se conoce el uso de los resultados. Identificar qué documentación técnica, funcional o contractual permitiría verificarlo. No deducir la existencia de perfiles únicamente porque un sistema disponga de funcionalidades de segmentación o análisis predictivo.",
          expected_result:
            "Una identificación de los perfiles efectivamente elaborados o razonablemente confirmados, sus finalidades, las características evaluadas y la forma en que sus resultados pueden influir en las personas afectadas.",
        },
        {
          evidence_item: "decisiones automatizadas",
          review_guide:
            "Identificar si el sistema adopta decisiones sobre personas mediante procesos automatizados, incluidas decisiones basadas en perfiles, reglas, modelos estadísticos o sistemas de inteligencia artificial. Determinar qué decisión se toma, qué datos intervienen, qué resultado produce y si una persona revisa o puede modificar realmente la decisión antes de que genere efectos. Distinguir entre la automatización de tareas auxiliares, una recomendación que revisa una persona y una decisión que se ejecuta sin intervención humana efectiva. Examinar si la decisión produce consecuencias jurídicas o afecta significativamente a la persona, atendiendo al contexto y al impacto real. No considerar que la mera participación de una herramienta automatizada convierte todo el proceso en una decisión automatizada con efectos significativos.",
          no_evidence_guidance:
            "Indicar qué parte del proceso no se ha podido comprobar: existencia de automatización, funcionamiento de las reglas, intervención humana, ejecución de la decisión o consecuencias para la persona. Identificar qué pruebas, registros, documentación del sistema o confirmación del responsable permitirían aclararlo. No presumir que existe revisión humana efectiva solo porque el procedimiento incluya formalmente una etapa de aprobación.",
          expected_result:
            "Una descripción del proceso decisorio, el grado real de automatización, la intervención humana existente y las consecuencias que puede producir sobre las personas, distinguiendo los hechos confirmados de las cuestiones pendientes.",
        },
        {
          evidence_item: "elegibilidad",
          review_guide:
            "Revisar si se utilizan datos personales, puntuaciones, perfiles o reglas automatizadas para determinar si una persona reúne las condiciones para acceder a un beneficio, una prestación, un empleo, un producto, un servicio u otra oportunidad. Identificar los criterios aplicados, el proceso de evaluación y las consecuencias de cumplir o no las condiciones. Comprobar si el resultado es orientativo, si requiere una evaluación humana sustantiva o si determina automáticamente el acceso o la exclusión. Valorar la naturaleza de la oportunidad, la importancia de la decisión y su impacto real sobre la persona. No asumir que toda comprobación automatizada de requisitos tiene necesariamente efectos jurídicos o significativos.",
          no_evidence_guidance:
            "Precisar si no se han podido identificar los criterios de elegibilidad, si se desconoce el papel de la automatización o si no está claro cómo afecta el resultado al acceso a la oportunidad. Identificar qué reglas de negocio, procedimientos, registros o ejemplos de decisiones permitirían verificarlo. No inferir una decisión automatizada únicamente porque exista un formulario o una herramienta que compruebe requisitos.",
          expected_result:
            "Una descripción respaldada de los criterios de elegibilidad, el papel de los sistemas automatizados y las consecuencias del resultado para las personas, con las incertidumbres relevantes identificadas.",
        },
        {
          evidence_item: "rechazo automático",
          review_guide:
            "Comprobar si el tratamiento puede denegar, bloquear o descartar automáticamente solicitudes, operaciones, candidaturas o accesos de personas. Identificar qué desencadena el rechazo, qué datos y reglas intervienen, si existe una decisión automática efectiva y qué consecuencias tiene para la persona. Revisar ejemplos de resultados, registros de decisión, reglas del sistema y procedimientos de revisión o reclamación. Distinguir entre un rechazo definitivo, una alerta, un filtro preliminar o una recomendación que debe ser valorada por una persona. Evaluar la importancia práctica y jurídica del rechazo en su contexto; no asumir que toda denegación técnica tiene efectos significativos ni que una intervención humana meramente formal elimina el impacto de la automatización.",
          no_evidence_guidance:
            "Indicar si no se ha confirmado la existencia de rechazos automáticos, si se desconocen sus criterios o si no se ha podido determinar si el rechazo es definitivo o revisable. Identificar qué registros, reglas o procedimientos permitirían aclararlo. No concluir que existen rechazos automáticos solo porque el sistema tenga capacidad para bloquear operaciones.",
          expected_result:
            "Una identificación de los rechazos automáticos confirmados, sus criterios, las consecuencias para las personas y los mecanismos de intervención humana o revisión existentes, distinguiendo lo documentado de lo pendiente de comprobar.",
        },
        {
          evidence_item: "decisiones laborales",
          review_guide:
            "Examinar si se utilizan datos personales, puntuaciones, perfiles o decisiones automatizadas en procesos relacionados con trabajadores o candidatos a un empleo. Considerar, cuando corresponda, selección y contratación, asignación de turnos, evaluación del rendimiento, promoción, remuneración, seguimiento de productividad, acceso a oportunidades o terminación de la relación laboral. Identificar qué se evalúa, qué criterios intervienen, qué decisiones se adoptan y qué consecuencias tienen para las personas. Comprobar si el sistema ofrece recomendaciones o determina efectivamente el resultado, y si existe una intervención humana sustantiva. Prestar especial atención a decisiones que puedan afectar de manera relevante a la situación laboral, los ingresos, las oportunidades o los derechos de la persona, sin presumir que todos los usos automatizados en recursos humanos tienen el mismo impacto.",
          no_evidence_guidance:
            "Precisar qué procesos laborales no pudieron revisarse, si se desconoce el papel de las herramientas automatizadas o si no hay información suficiente sobre las consecuencias de sus resultados. Identificar qué procedimientos de recursos humanos, documentación de sistemas, criterios de evaluación o confirmaciones de los responsables permitirían verificarlo. No inferir decisiones automatizadas por la sola utilización de software de gestión de personal.",
          expected_result:
            "Una identificación de los procesos laborales pertinentes, las evaluaciones o decisiones automatizadas detectadas, su impacto sobre los trabajadores o candidatos y las salvaguardas o revisiones existentes, con las limitaciones documentadas.",
        },
        {
          evidence_item: "acceso a productos o servicios",
          review_guide:
            "Comprobar si los sistemas automatizados o los perfiles influyen en la posibilidad de una persona de acceder a productos, servicios, prestaciones, cuentas, financiación, seguros u otras oportunidades. Revisar si se utilizan para aprobar o denegar solicitudes, asignar condiciones diferenciadas, establecer límites, priorizar usuarios o restringir el acceso. Identificar los datos y criterios que intervienen, el papel de la automatización y las consecuencias del resultado. Distinguir entre personalización o recomendaciones comerciales de bajo impacto y decisiones que condicionan materialmente el acceso, las condiciones o la continuidad de un producto o servicio. Valorar el contexto concreto y no asumir que toda personalización o segmentación comercial produce efectos significativos.",
          no_evidence_guidance:
            "Indicar si no se ha podido confirmar el uso de automatización para determinar el acceso, si se desconocen los criterios aplicados o si no está claro el impacto de los resultados. Identificar qué reglas comerciales, procedimientos, registros de solicitudes o documentación del sistema permitirían aclararlo. No inferir que existe una decisión automatizada significativa únicamente porque una organización venda productos o preste servicios por canales digitales.",
          expected_result:
            "Una descripción respaldada de los procesos de acceso afectados por la automatización, sus criterios y consecuencias para las personas, así como de las revisiones humanas y cuestiones pendientes de verificar.",
        },
      ],
      required_facts: [],
      default_next_node_key: "systematic-public-monitoring",
      provenance: "agency_standard",
    },
    {
      node_key: "systematic-public-monitoring",
      node_type: "question",
      title: "Monitoreo sistemático de zonas públicas",
      prompt: "¿La organización realiza monitoreo sistemático de zonas de acceso público?",
      why_it_matters:
        "El monitoreo sistemático de zonas públicas activa por sí solo la recomendación fuerte según metodología de la agencia.",
      fact_key: "dpo_assessment.systematic_public_monitoring",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe monitoreo sistemático de zonas de acceso público.",
          fact_effect: {
            fact_key: "dpo_assessment.systematic_public_monitoring",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "No",
          description: "No existe tal monitoreo.",
          fact_effect: {
            fact_key: "dpo_assessment.systematic_public_monitoring",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo_assessment.systematic_public_monitoring",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "videovigilancia",
        "seguimiento sistemático",
        "analítica asociada",
        "tecnologías equivalentes",
      ],
      evidence_review_help: [
        {
          evidence_item: "videovigilancia",
          review_guide:
            "Revisar si la organización utiliza cámaras u otros sistemas de captación de imágenes para observar zonas a las que puede acceder el público, como entradas, salas de atención, establecimientos, estacionamientos o espacios exteriores. Identificar qué zonas se observan, la finalidad del sistema, su cobertura, la frecuencia de captación y si las imágenes se graban, conservan, consultan o comunican a terceros. Comprobar si el sistema funciona de forma continua, periódica o solo ante eventos concretos, y quién tiene acceso a las imágenes. Distinguir la videovigilancia de espacios de acceso público del monitoreo limitado a espacios privados, sin asumir que la ubicación de una cámara demuestra por sí sola el alcance real del tratamiento.",
          no_evidence_guidance:
            "Indicar si no se ha podido confirmar la existencia de cámaras, si se desconoce qué zonas captan o si no se dispone de información sobre la grabación, conservación o uso de las imágenes. Identificar qué inventarios de equipos, contratos, configuraciones, procedimientos o confirmaciones de los responsables permitirían verificarlo. No concluir que no existe monitoreo solo porque no se haya encontrado una política escrita.",
          expected_result:
            "Una descripción respaldada de los sistemas de videovigilancia identificados, las zonas observadas, su finalidad y funcionamiento, y el tratamiento efectivo de las imágenes, indicando las incertidumbres y comprobaciones pendientes.",
        },
        {
          evidence_item: "seguimiento sistemático",
          review_guide:
            "Comprobar si la organización observa de forma organizada, recurrente o continuada una zona de acceso público o los movimientos, presencia o comportamiento de las personas en ella. Revisar la frecuencia del seguimiento, su duración, la cobertura espacial, la finalidad y los medios utilizados. Considerar tanto los sistemas automatizados como los procedimientos que permiten observar o registrar sistemáticamente la actividad en el espacio. Distinguir un seguimiento estructurado de una observación ocasional o de una actuación puntual ante un incidente. Valorar si el seguimiento permite identificar o hacer identificables a las personas y si los datos se registran, conservan, cruzan o utilizan posteriormente.",
          no_evidence_guidance:
            "Precisar si no se ha podido determinar la frecuencia, la continuidad, la cobertura o la finalidad del seguimiento. Identificar qué procedimientos, registros, contratos, configuraciones o entrevistas con responsables del proceso permitirían aclararlo. No inferir monitoreo sistemático únicamente porque exista personal de seguridad, una cámara instalada o una herramienta capaz de registrar actividad.",
          expected_result:
            "Una caracterización respaldada del seguimiento detectado, su regularidad, duración, cobertura, finalidad y relación con una zona de acceso público, diferenciando la observación ocasional del monitoreo sistemático.",
        },
        {
          evidence_item: "analítica asociada",
          review_guide:
            "Examinar si las imágenes, señales u otros datos obtenidos en la observación de zonas públicas se procesan mediante analítica adicional, como detección o seguimiento de objetos, conteo de personas, reconocimiento de patrones, estimación de ocupación, identificación biométrica o análisis del comportamiento. Determinar qué datos se analizan, qué resultados se generan, si las personas pueden identificarse y cómo se utilizan los resultados. Revisar la configuración del sistema, las funcionalidades activadas, los contratos del proveedor y la documentación disponible. Distinguir entre una capacidad técnica que el sistema ofrece y una función que realmente está habilitada y se utiliza. Considerar si la analítica amplía el alcance del monitoreo o permite inferir información adicional sobre las personas.",
          no_evidence_guidance:
            "Indicar qué funciones analíticas no se han podido confirmar, si no se dispone de documentación técnica o si se desconoce cómo se utilizan los resultados. Identificar qué configuraciones, fichas técnicas, registros de actividad o confirmaciones del proveedor permitirían verificarlo. No presumir que existe reconocimiento facial, identificación individual o elaboración de perfiles por el solo hecho de utilizar cámaras o software de analítica.",
          expected_result:
            "Una identificación de las funciones analíticas efectivamente utilizadas, los datos procesados, los resultados generados y sus finalidades, distinguiendo las capacidades técnicas de las funciones comprobadas y señalando las cuestiones pendientes.",
        },
        {
          evidence_item: "tecnologías equivalentes",
          review_guide:
            "Identificar tecnologías distintas de las cámaras convencionales que puedan utilizarse para observar o monitorear sistemáticamente zonas de acceso público. Considerar, cuando corresponda, sensores, dispositivos de seguimiento, sistemas de detección, tecnologías de geolocalización u otros medios que permitan registrar presencia, desplazamientos, actividad o patrones de comportamiento. Determinar dónde se utilizan, qué datos recogen, con qué frecuencia funcionan, qué personas pueden verse afectadas y qué tratamiento se realiza con la información. Evaluar su funcionamiento real y su finalidad, sin limitar la revisión a la denominación comercial o técnica del dispositivo. No asumir que toda tecnología instalada en un espacio público constituye monitoreo sistemático.",
          no_evidence_guidance:
            "Precisar qué dispositivos o procesos no pudieron revisarse y qué información falta para determinar si realizan monitoreo sistemático de una zona de acceso público. Identificar inventarios tecnológicos, especificaciones, contratos, configuraciones o responsables que puedan aportar evidencia. No inferir que existe monitoreo por la mera presencia de sensores, redes inalámbricas o equipos capaces de recoger datos.",
          expected_result:
            "Una relación de las tecnologías pertinentes identificadas, sus ubicaciones, datos recogidos, finalidades y funcionamiento real, junto con la evidencia disponible y las verificaciones pendientes.",
        },
      ],
      required_facts: [],
      default_next_node_key: "international-transfers",
      provenance: "agency_standard",
    },
    {
      node_key: "international-transfers",
      node_type: "question",
      title: "Transferencias internacionales",
      prompt: "¿Existen transferencias internacionales activas de datos personales?",
      why_it_matters:
        "Las transferencias internacionales combinadas con escala u otros factores elevan la recomendación profesional.",
      fact_key: "dpo_assessment.international_transfers",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existen transferencias internacionales activas.",
          fact_effect: {
            fact_key: "dpo_assessment.international_transfers",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "No",
          description: "No existen transferencias internacionales activas.",
          fact_effect: {
            fact_key: "dpo_assessment.international_transfers",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo_assessment.international_transfers",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "proveedores cloud",
        "matrices o filiales",
        "plataformas",
        "encargados extranjeros",
        "almacenamiento o acceso desde otro país",
      ],
      evidence_review_help: [
        {
          evidence_item: "proveedores cloud",
          review_guide:
            "Revisar los proveedores que almacenan, alojan o procesan datos personales: la entidad contratante, las ubicaciones de almacenamiento y procesamiento disponibles y la documentación contractual o técnica que permita identificar los países involucrados. No inferir la ubicación de los datos únicamente a partir de la nacionalidad o del domicilio comercial del proveedor.",
          no_evidence_guidance:
            "Si no se localiza documentación suficiente, no concluir que no existen transferencias: verificar con las áreas responsables, los contratos vigentes, las configuraciones de sistemas y la documentación de seguridad, y registrar lo efectivamente comprobado.",
          expected_result:
            "Una relación de los proveedores pertinentes con los países identificados mediante respaldo documental y las ubicaciones aún por confirmar.",
        },
        {
          evidence_item: "matrices o filiales",
          review_guide:
            "Identificar si datos personales se comunican, se ponen a disposición o se transfieren a otras entidades del grupo ubicadas fuera de Chile. Diferenciar la existencia de una relación societaria de la evidencia de un flujo real de datos: pertenecer al mismo grupo no demuestra por sí solo que exista esa transferencia.",
          no_evidence_guidance:
            "Si no se encuentra evidencia del flujo entre entidades, registrar qué comprobaciones faltan y consultar inventarios de tratamientos, contratos internos y configuraciones de sistemas antes de descartar la existencia del flujo.",
          expected_result:
            "Una identificación de las entidades del grupo pertinentes, los flujos de datos respaldados por evidencia y las relaciones que permanecen sin confirmar.",
        },
        {
          evidence_item: "plataformas",
          review_guide:
            "Revisar las plataformas y herramientas que tratan datos personales para determinar dónde operan y si implican que los datos salgan de Chile o sean accesibles desde el extranjero. Comprobar la documentación técnica y contractual disponible y contrastar la configuración efectiva con la descripción comercial de la plataforma.",
          no_evidence_guidance:
            "Si la documentación no permite conocer las ubicaciones o accesos, indicar qué falta y verificar con los responsables de sistemas y con el proveedor; no dar por probado un flujo internacional según las capacidades teóricas de la herramienta.",
          expected_result:
            "Una descripción respaldada del papel de las plataformas en los tratamientos pertinentes, con las ubicaciones y accesos comprobados y los pendientes de verificación.",
        },
        {
          evidence_item: "encargados extranjeros",
          review_guide:
            "Revisar contratos, anexos de tratamiento, instrucciones, subencargados y documentación disponible para conocer qué entidad accede a los datos, desde qué país y para qué operación. No dar por probado un flujo internacional solo porque el proveedor o encargado esté constituido en el extranjero.",
          no_evidence_guidance:
            "Si no se localizan los contratos o anexos, registrar esa limitación y consultar con las áreas de contratación y de sistemas antes de concluir la existencia o inexistencia del encargo con acceso transfronterizo.",
          expected_result:
            "Una identificación de los encargados pertinentes, las operaciones que requieren acceso desde el extranjero y los mecanismos de acceso registrados.",
        },
        {
          evidence_item: "almacenamiento o acceso desde otro país",
          review_guide:
            "Revisar las ubicaciones de almacenamiento y procesamiento, el acceso remoto por personal situado en el extranjero y los registros técnicos o contractuales que permitan corroborarlo. Distinguir entre una ubicación confirmada, un acceso posible y una hipótesis aún no verificada.",
          no_evidence_guidance:
            "Si no existen registros que permitan corroborar ubicaciones o accesos remotos, precisar exactamente qué no se pudo comprobar y a qué documentación o confirmación técnica acudir, sin concluir que el flujo existe o no existe.",
          expected_result:
            "Una valoración de las ubicaciones y accesos transfronterizos respaldados por registros, diferenciando lo confirmado de lo posible y de lo no verificado.",
        },
      ],
      required_facts: [],
      default_next_node_key: "processor-complexity",
      provenance: "agency_standard",
    },
    {
      node_key: "processor-complexity",
      node_type: "question",
      title: "Complejidad de encargados",
      prompt: "¿Existe una estructura de encargados que requiera supervisión recurrente?",
      why_it_matters:
        "La complejidad de encargados combinada con escala eleva la recomendación profesional como criterio metodológico.",
      fact_key: "dpo_assessment.processor_complexity",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Se cumple el criterio metodológico de complejidad.",
          fact_effect: {
            fact_key: "dpo_assessment.processor_complexity",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "No",
          description: "No se cumple el criterio metodológico de complejidad.",
          fact_effect: {
            fact_key: "dpo_assessment.processor_complexity",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo_assessment.processor_complexity",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "inventario de encargados",
        "contratos",
        "subencargados",
        "diagramas de flujo",
      ],
      evidence_review_help: [
        {
          evidence_item: "inventario de encargados",
          review_guide:
            "Revisar qué personas o entidades externas tratan datos personales por cuenta de la organización, qué servicios prestan y si la relación sigue activa. Identificar los encargados relevantes para los tratamientos evaluados. No contar automáticamente a proveedores sin acceso o tratamiento de datos personales como encargados. Para aplicar la regla metodológica interna, contar los encargados activos relevantes y registrar las cadenas de subencargamiento que existan.",
          no_evidence_guidance:
            "Si no existe un inventario disponible o está incompleto, contrastar con las áreas responsables, compras, tecnología y los propietarios de los tratamientos. La ausencia de un inventario no demuestra que no existan encargados.",
          expected_result:
            "Una relación de los encargados activos pertinentes para los tratamientos evaluados, con su estado de vigencia y las situaciones no confirmadas. La revisión debe permitir aplicar la regla metodológica interna: responder Sí cuando existan al menos dos encargados activos relevantes o una cadena de subencargamiento. Esa regla es un estándar metodológico interno y no un mandato legal, y no admite otros umbrales inventados.",
        },
        {
          evidence_item: "contratos",
          review_guide:
            "Revisar contratos, anexos de tratamiento y documentos equivalentes para confirmar el encargo, su alcance, las partes y las condiciones aplicables. Diferenciar un contrato vigente de un servicio efectivamente activo y de un tratamiento comprobado. La falta de un contrato localizado no demuestra que no exista relación operativa.",
          no_evidence_guidance:
            "Precisar qué contratos o anexos no pudieron localizarse y qué documentación permitiría acreditar el encargo. Constatar con las áreas de contratación y los propietarios del tratamiento sin concluir que la relación no existe.",
          expected_result:
            "Una identificación de los encargos respaldados documentalmente, su alcance y los archivos pendientes de localizar o de confirmar.",
        },
        {
          evidence_item: "subencargados",
          review_guide:
            "Revisar si un encargado delega operaciones de tratamiento en otra entidad y si esa relación está documentada o confirmada por información contractual, técnica u operativa. Identificar las cadenas de subencargamiento cuando exista más de un nivel. No asumir que toda cadena está autorizada solo porque el proveedor la mencione.",
          no_evidence_guidance:
            "Indicar qué delegaciones no pudieron confirmarse y qué documentación contractual o técnica permitiría verificarlas. No concluir la existencia ni la inexistencia de cadenas de subencargamiento sin respaldo suficiente.",
          expected_result:
            "Una descripción de las cadenas de subencargamiento confirmadas, sus niveles y las delegaciones pendientes de verificación.",
        },
        {
          evidence_item: "diagramas de flujo",
          review_guide:
            "Revisar diagramas u otra evidencia que muestre qué entidades intervienen, qué datos reciben o tratan y cómo se relacionan. Contrastar los diagramas con contratos e información operativa. Un diagrama desactualizado o meramente ilustrativo no confirma por sí solo una relación activa.",
          no_evidence_guidance:
            "Si no existen diagramas o están desactualizados, indicar esa limitación y reconstruir la estructura con las demás fuentes disponibles antes de concluir nada sobre la estructura real de encargados.",
          expected_result:
            "Una representación de la estructura de encargados respaldada por evidencia, con las relaciones confirmadas y las fuentes pendientes de contrastar.",
        },
      ],
      help_text: [
        "Para esta metodología de agencia responde Sí cuando ocurra cualquiera: existen dos o más encargados activos relevantes; o existe al menos una cadena de subencargamiento.",
        "Este criterio cuantitativo es un estándar metodológico interno y no un umbral legal.",
      ],
      required_facts: [],
      default_next_node_key: "privacy-maturity",
      provenance: "agency_standard",
    },
    {
      node_key: "privacy-maturity",
      node_type: "question",
      title: "Madurez operacional",
      prompt: "¿La organización presenta baja madurez operacional en protección de datos?",
      why_it_matters:
        "La baja madurez combinada con otros factores eleva la recomendación profesional como criterio metodológico.",
      fact_key: "dpo_assessment.low_maturity",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Se cumple el criterio 3 de 7 de baja madurez.",
          fact_effect: { fact_key: "dpo_assessment.low_maturity", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "No se cumple el criterio de baja madurez.",
          fact_effect: { fact_key: "dpo_assessment.low_maturity", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo_assessment.low_maturity", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "inventario",
        "política",
        "atención de derechos",
        "contratos con encargados",
        "gestión de incidentes",
        "capacitación",
        "EIPD",
      ],
      evidence_review_help: [
        {
          evidence_item: "inventario",
          review_guide:
            "Revisar si existe una relación identificable de tratamientos de datos personales y si se mantiene actualizada. Distinguir entre un inventario formal, una lista parcial o informal y la ausencia de evidencia localizada. Para este protocolo se considera baja madurez operacional cuando al menos 3 de las 7 áreas revisadas están inexistentes o son informales; esa regla es un estándar metodológico interno de la agencia y no una clasificación ni un umbral establecido por la ley, y no exige que las siete áreas estén en la misma condición.",
          no_evidence_guidance:
            "Si no se localiza un inventario, contrastar con las áreas responsables y las fuentes operativas antes de concluir. No localizar documentación no demuestra automáticamente que la práctica sea inexistente; anotar los antecedentes consultados y los faltantes.",
          expected_result:
            "El estado comprobado del área de inventario (inexistente, informal o formalizado), la evidencia localizada, sus limitaciones y las comprobaciones pendientes.",
        },
        {
          evidence_item: "política",
          review_guide:
            "Revisar si existen políticas o reglas internas de protección de datos, si están aprobadas o comunicadas cuando corresponda y si guían efectivamente las prácticas. No asumir que una política es eficaz solo porque exista un documento.",
          no_evidence_guidance:
            "Si no se localiza una política, contrastar con las áreas responsables y buscar evidencias operativas razonables de reglas o criterios internos. Si la práctica depende de conocimiento informal, describir esa situación con precisión, sin exagerar ni ocultar sus limitaciones.",
          expected_result:
            "El estado comprobado del área de política (inexistente, informal o formalizada), la evidencia disponible de aprobación o comunicación efectiva y las incertidumbres pendientes.",
        },
        {
          evidence_item: "atención de derechos",
          review_guide:
            "Revisar si existe un procedimiento para recibir, derivar, responder y hacer seguimiento a solicitudes de los titulares, con evidencia proporcional a la actividad de la organización. Distinguir un proceso definido y operativo de una atención improvisada o informal. No inventar plazos legales ni requisitos adicionales.",
          no_evidence_guidance:
            "Si no se localiza un procedimiento, contrastar con las áreas que atienden a titulares y revisar la evidencia operativa disponible. La ausencia de documentos no demuestra por sí sola que la atención no exista; registrar lo efectivamente comprobado.",
          expected_result:
            "El estado comprobado del área de atención de derechos (inexistente, informal o formalizada), con la evidencia localizada y las incertidumbres identificadas.",
        },
        {
          evidence_item: "contratos con encargados",
          review_guide:
            "Revisar si las relaciones pertinentes con encargados están identificadas y si los contratos o documentos aplicables regulan el tratamiento de datos. Distinguir contratos formalizados, acuerdos informales y ausencia de evidencia. No asumir que la falta de un contrato localizado prueba que no exista una relación operativa.",
          no_evidence_guidance:
            "Si no se localizan contratos, contrastar con compras, proveedores y los propietarios de los tratamientos, y revisar la evidencia operativa disponible. Precisar qué relaciones quedan sin confirmar sin concluir su inexistencia.",
          expected_result:
            "El estado comprobado del área de contratos con encargados (inexistente, informal o formalizado), las relaciones respaldadas por evidencia y las pendientes de verificación.",
        },
        {
          evidence_item: "gestión de incidentes",
          review_guide:
            "Revisar si existen mecanismos para reportar, evaluar, gestionar y cerrar incidentes que puedan involucrar datos personales. Buscar procedimientos, responsables, registros o ejemplos de gestión cuando estén disponibles. No exigir un documento específico si no resulta aplicable.",
          no_evidence_guidance:
            "Si no se localiza un procedimiento, contrastar con las áreas de tecnología, seguridad y operaciones, y revisar la evidencia operativa disponible. La falta de documentos no demuestra automáticamente que la gestión sea inexistente.",
          expected_result:
            "El estado comprobado del área de gestión de incidentes (inexistente, informal o formalizada), con la evidencia localizada y las incertidumbres pendientes.",
        },
        {
          evidence_item: "capacitación",
          review_guide:
            "Revisar si las personas pertinentes reciben orientación o capacitación en protección de datos y si existe alguna evidencia de su realización. Distinguir actividades planificadas, capacitación informal y ausencia de evidencia; no imponer una frecuencia universal no respaldada por una obligación aplicable.",
          no_evidence_guidance:
            "Si no se localiza evidencia de capacitación, contrastar con recursos humanos y las áreas responsables, y revisar la evidencia operativa disponible. No concluir que la orientación no exista solo por la falta de documentación formal.",
          expected_result:
            "El estado comprobado del área de capacitación (inexistente, informal o formalizada), con la evidencia localizada y las limitaciones señaladas.",
        },
        {
          evidence_item: "EIPD",
          review_guide:
            "Revisar si la organización identifica cuándo podría ser necesaria una evaluación de impacto en protección de datos personales y si existen evaluaciones realizadas o decisiones documentadas sobre su aplicabilidad. Distinguir una evaluación de impacto efectivamente realizada de una plantilla, borrador o intención de realizarla. No asumir que toda organización debe tener una EIPD ya realizada: la necesidad depende del tratamiento y del régimen legal aplicable.",
          no_evidence_guidance:
            "Si no se localizan evaluaciones o decisiones en la materia, contrastar con las áreas responsables y los tratamientos pertinentes. La ausencia de una EIPD localizada no demuestra por sí sola que exista un vacío de gobierno; registrar lo comprobado y lo pendiente.",
          expected_result:
            "El estado comprobado del área de EIPD (inexistente, informal o formalizada), la evidencia localizada, su alcance y las comprobaciones pendientes.",
        },
      ],
      help_text: [
        "Para este protocolo se considera baja madurez cuando al menos 3 de estas 7 áreas están inexistente o informal: inventario; política; atención de derechos; contratos con encargados; gestión de incidentes; capacitación; EIPD.",
        "La regla 3 de 7 es un estándar metodológico de la agencia y no una clasificación establecida por la ley.",
      ],
      required_facts: [],
      default_next_node_key: "final-decision",
      provenance: "agency_standard",
    },
    {
      node_key: "final-decision",
      node_type: "decision",
      title: "Determinación del resultado",
      prompt: "El sistema aplica las reglas determinísticas sobre los hechos resueltos.",
      answer_type: "none",
      // Requisitos semánticos explícitos: estado MPI + 7 factores.
      // El orden del array no define dependencias.
      required_facts: ["mpi.lifecycle_status", ...DECISION_FACTS],
      transitions: [
        {
          rule_id: "incomplete",
          description: "Al menos un antecedente obligatorio está desconocido o sin responder.",
          when: { op: "any", conditions: DECISION_FACTS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan antecedentes obligatorios por resolver. Con hechos desconocidos no se emite recomendación profesional definitiva.",
        },
        {
          rule_id: "strong-A",
          description:
            "Datos de impacto especial y tratamiento a gran escala (Regla A).",
          when: {
            op: "all",
            conditions: [
              isYes("dpo_assessment.high_impact_data"),
              isYes("dpo_assessment.large_scale"),
            ],
          },
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla A activada: la organización trata datos de impacto especial a gran escala.",
        },
        {
          rule_id: "strong-B",
          description:
            "Evaluación sistemática o perfilamiento automatizado con efectos significativos (Regla B).",
          when: isYes("dpo_assessment.automated_significant_effects"),
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla B activada: existe evaluación sistemática o perfilamiento automatizado que produce efectos jurídicos o afecta significativamente al titular.",
        },
        {
          rule_id: "strong-C",
          description: "Monitoreo sistemático de zonas de acceso público (Regla C).",
          when: isYes("dpo_assessment.systematic_public_monitoring"),
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla C activada: la organización realiza monitoreo sistemático de zonas de acceso público.",
        },
        {
          rule_id: "strong-D",
          description: "Gran escala con transferencias internacionales (Regla D).",
          when: {
            op: "all",
            conditions: [
              isYes("dpo_assessment.large_scale"),
              isYes("dpo_assessment.international_transfers"),
            ],
          },
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla D activada: existe tratamiento a gran escala junto con transferencias internacionales activas.",
        },
        {
          rule_id: "strong-E",
          description: "Gran escala con complejidad de encargados (Regla E).",
          when: {
            op: "all",
            conditions: [
              isYes("dpo_assessment.large_scale"),
              isYes("dpo_assessment.processor_complexity"),
            ],
          },
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla E activada: existe tratamiento a gran escala junto con una estructura de encargados que requiere supervisión recurrente.",
        },
        {
          rule_id: "strong-F",
          description:
            "Baja madurez con al menos dos factores adicionales (Regla F).",
          when: {
            op: "all",
            conditions: [
              isYes("dpo_assessment.low_maturity"),
              countYes(RULE_F_FACTS, 2),
            ],
          },
          goto_outcome_key: "strongly_recommended",
          explanation:
            "Regla F activada: la organización presenta baja madurez y al menos dos factores positivos entre datos de impacto especial, gran escala, transferencias internacionales y complejidad de encargados.",
        },
        {
          rule_id: "recommended-two",
          description: "Al menos dos factores de soporte positivos sin regla fuerte.",
          when: countYes(SUPPORT_FACTS, 2),
          goto_outcome_key: "recommended",
          explanation:
            "Ninguna regla fuerte se cumple, pero existen al menos dos factores de soporte positivos.",
        },
        {
          rule_id: "fallback-not-priority",
          description:
            "Cero o un factor de soporte positivo y ninguna regla fuerte.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "not_priority",
          explanation:
            "Ninguna regla de recomendación fuerte se cumple y los factores documentados no alcanzan los criterios internos de recomendación prioritaria.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "required_by_mpi",
      label: "DPO requerido por MPI",
      classification: "legal_requirement",
      explanation:
        "El MPI se encuentra formalmente adoptado, en implementación o implementado. El DPO debe formar parte del programa.",
      detail:
        "Esto es una consecuencia del estado del MPI, no una recomendación metodológica.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Continuar con designación de DPO",
          activity_key: "dpo.designate",
        },
      ],
    },
    {
      outcome_key: "strongly_recommended",
      label: "DPO fuertemente recomendado",
      classification: "agency_standard",
      explanation:
        "Los factores documentados activan al menos una regla de recomendación fuerte de la metodología de la agencia.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Si la organización decide designarlo, continuar con D1.08",
          activity_key: "dpo.designate",
        },
      ],
    },
    {
      outcome_key: "recommended",
      label: "DPO recomendado",
      classification: "agency_standard",
      explanation:
        "Los factores documentados alcanzan el umbral metodológico de recomendación sin activar una regla fuerte.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Si la organización decide designarlo, continuar con D1.08",
          activity_key: "dpo.designate",
        },
      ],
    },
    {
      outcome_key: "not_priority",
      label: "DPO no prioritario según metodología actual",
      classification: "agency_standard",
      explanation:
        "Los factores actualmente documentados no alcanzan los criterios internos de recomendación prioritaria. La conclusión debe reevaluarse ante cambios materiales o adopción de un MPI.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación ante nuevos antecedentes",
        },
        {
          kind: "info",
          label: "Reevaluar si cambian hechos relevantes o se adopta un MPI",
          note: "La conclusión depende de los hechos registrados en esta sesión y no constituye un pronunciamiento permanente.",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes obligatorios desconocidos o sin responder. Con información faltante no se emite recomendación profesional definitiva.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Revisar ciclo de vida del MPI (D1.20)",
          activity_key: "mpi.lifecycle_review",
          show_when: {
            op: "fact_equals",
            fact_key: "mpi.lifecycle_status",
            value: "unknown",
          },
        },
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
  ],
};
