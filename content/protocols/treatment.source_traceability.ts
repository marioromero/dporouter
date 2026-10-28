import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.04.
 *
 * activity_key = treatment.source_traceability (procedure, treatment
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, legal basis, dependencias y
 * aplicabilidad del contenido canónico D2.04.
 *
 * Source of truth: `dataItems`, `sources` y `sourceRefs`. La
 * existencia de datos y fuentes se consume como derived; la cobertura
 * por categoría es condicional según canon ("cuando resulte
 * necesario") y por eso NO se exige universalidad: solo juicio
 * profesional la determina.
 */

const DERIVED = [
  "derived.treatment.data_items_exist",
  "derived.treatment.sources_exist",
];

const MANUAL = [
  "traceability.sources_identified",
  "traceability.category_covered",
  "traceability.evidence_kept",
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

export const TREATMENT_SOURCE_TRACEABILITY_PROTOCOL: ExecutionProtocol = {
  protocol_key: "treatment.source_traceability.v1",
  activity_key: "treatment.source_traceability",
  version: 1,
  mode: "procedure",
  execution_scope: "treatment",
  title: "Procedimiento guiado de trazabilidad de origen",
  description:
    "Verifica que el origen de los datos esté identificado, que la cobertura por categoría corresponda cuando sea necesaria y que la procedencia quede acreditada.",
  entry_node_key: "identify-sources",
  decision_fact_keys: [...MANUAL],
  external_fact_keys: [...DERIVED],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "identify-sources",
      node_type: "question",
      title: "Origen identificado",
      prompt:
        "¿Quedó identificado si los datos provienen del titular, de otra organización, de fuentes públicas u otra fuente, con uso lícito verificado?",
      why_it_matters:
        "Sin origen identificado no es posible acreditar la procedencia ni la licitud de uso.",
      fact_key: "traceability.sources_identified",
      answer_type: "single_select",
      options: stateOptions("traceability.sources_identified"),
      evidence_to_review: [
        "registro de fuentes por tratamiento",
        "evidencia de procedencia",
      ],
      evidence_review_help: [
        {
          evidence_item: "registro de fuentes por tratamiento",
          review_guide:
            "Examinar las entradas registradas para reconocer los canales mediante los cuales se obtienen los datos, diferenciando la recopilación directa del titular, la recepción desde otras organizaciones y el acceso a fuentes públicas u otros orígenes. Comprobar que las fuentes declaradas correspondan a las operaciones efectivamente realizadas y que existan antecedentes para evaluar las condiciones de acceso y utilización, identificando procedencias ambiguas o no confirmadas.",
          no_evidence_guidance:
            "Consultar formularios, documentos operacionales, registros de recepción y antecedentes de las áreas involucradas para reconstruir los canales de obtención conocidos. Cuando falten fuentes por identificar o su utilización no pueda justificarse suficientemente, registrar las incertidumbres y gestionar las comprobaciones necesarias, sin atribuir automáticamente licitud a los datos por el solo hecho de estar disponibles.",
          expected_result:
            "Fuentes individualizadas y asociadas a las operaciones correspondientes, con antecedentes suficientes para reconocer las vías de obtención y evaluar sus condiciones de acceso. Los orígenes desconocidos, las discrepancias y las dudas sobre su utilización deben quedar documentados, sin considerar acreditada la licitud de un tratamiento únicamente por conocer su procedencia.",
        },
        {
          evidence_item: "evidencia de procedencia",
          review_guide:
            "Revisar formularios de recopilación, registros de ingreso, comunicaciones de terceros, documentos de transferencia u otros antecedentes que permitan establecer cómo se recibieron los datos. Verificar la correspondencia entre los registros disponibles y las fuentes declaradas, considerando fechas, canales y condiciones conocidas de obtención. Identificar respaldos insuficientes o incompatibles con la procedencia registrada.",
          no_evidence_guidance:
            "Buscar antecedentes en los sistemas de origen, expedientes, comunicaciones y registros conservados por quienes participaron en la obtención. Si no es posible reconstruir suficientemente una operación, documentar la falta de respaldo y solicitar las aclaraciones pertinentes. Evitar generar constancias retrospectivas de obtenciones no acreditadas o presumir que una transferencia fue legítima sin antecedentes que la sustenten.",
          expected_result:
            "Antecedentes verificables que permitan reconstruir las circunstancias conocidas de obtención y relacionarlas con las fuentes declaradas, incluyendo las condiciones relevantes de acceso cuando estén disponibles. Las discrepancias y operaciones sin respaldo suficiente deben quedar identificadas para su revisión jurídica, sin dar por acreditada una base de licitud que todavía no haya sido evaluada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "cover-categories",
      related_activity_keys: ["treatment.inventory_create"],
      provenance: "legal_requirement",
    },
    {
      node_key: "cover-categories",
      node_type: "question",
      title: "Cobertura por categoría y fuentes públicas",
      prompt:
        "¿La fuente por categoría corresponde cuando resulta necesaria y quedaron identificadas las fuentes de acceso público?",
      why_it_matters:
        "La cobertura por categoría solo se exige cuando resulta necesaria; las fuentes públicas siempre deben quedar expresas.",
      fact_key: "traceability.category_covered",
      answer_type: "single_select",
      options: stateOptions("traceability.category_covered"),
      evidence_to_review: [
        "registro de fuentes por tratamiento",
        "identificación de fuentes de acceso público cuando corresponda",
        "integraciones o terceros de origen identificados",
      ],
      evidence_review_help: [
        {
          evidence_item: "registro de fuentes por tratamiento",
          review_guide:
            "Examinar las procedencias consignadas y determinar si el nivel de detalle permite reconocer adecuadamente el origen de las distintas categorías de datos. Identificar situaciones en que una misma operación recibe información desde canales diferentes o donde una descripción general impide distinguir su obtención. Comprobar que las fuentes públicas utilizadas estén señaladas y que las categorías compartan una referencia común únicamente cuando resulte suficiente y coherente con los antecedentes disponibles.",
          no_evidence_guidance:
            "Consultar formularios, registros de ingreso, descripciones de procesos y antecedentes de las áreas responsables para completar las procedencias conocidas. Si existen categorías cuyo origen no puede determinarse, dejar identificada la información pendiente y gestionar su aclaración. Evitar imponer desgloses innecesarios cuando una referencia común permite acreditar suficientemente la fuente correspondiente.",
          expected_result:
            "Procedencias documentadas con un nivel de detalle adecuado a las operaciones examinadas, diferenciadas por categoría cuando resulte necesario y con las fuentes públicas utilizadas expresamente reconocidas. Las omisiones, referencias ambiguas y categorías pendientes de confirmación deben quedar identificadas sin presumir que todas requieren registros separados.",
        },
        {
          evidence_item: "identificación de fuentes de acceso público cuando corresponda",
          review_guide:
            "Comprobar la naturaleza y condiciones de acceso de los registros, publicaciones o conjuntos de datos consultados, considerando si cualquier persona puede acceder lícitamente a ellos conforme a la definición legal aplicable. Distinguir estas fuentes de plataformas privadas, bases con acceso restringido o información simplemente visible en internet. Examinar los antecedentes que permitan precisar qué datos se obtuvieron y bajo qué condiciones, sin considerar automáticamente lícito cualquier uso posterior.",
          no_evidence_guidance:
            "Revisar las referencias originales, condiciones de consulta, documentación del proveedor y registros disponibles para aclarar el carácter de la fuente. Si no es posible comprobar su naturaleza pública o las condiciones de obtención, documentar la incertidumbre y gestionar las verificaciones pertinentes. Cuando no se hayan utilizado fuentes de acceso público, dejar constancia de esa circunstancia sin exigir respaldos de operaciones inexistentes.",
          expected_result:
            "Fuentes utilizadas correctamente caracterizadas, con antecedentes que permitan distinguir aquellas comprendidas en la definición legal de acceso público de otros orígenes. Las clasificaciones dudosas o insuficientemente acreditadas deben quedar identificadas, sin atribuir al carácter público efectos de legitimación general del tratamiento.",
        },
        {
          evidence_item: "integraciones o terceros de origen identificados",
          review_guide:
            "Revisar los mecanismos mediante los cuales ingresan datos desde sistemas externos, proveedores u otras organizaciones, identificando los participantes, canales de recepción y categorías de información involucradas. Diferenciar el intermediario tecnológico de la entidad que proporciona los datos y de su fuente original cuando puedan distinguirse. Corroborar las relaciones declaradas mediante documentación técnica, acuerdos, registros de intercambio u otros antecedentes disponibles.",
          no_evidence_guidance:
            "Consultar configuraciones de integración, documentación de interfaces, contratos, comunicaciones y antecedentes de las áreas técnicas u operacionales para reconstruir los flujos conocidos. Cuando no pueda determinarse quién proporciona la información o de dónde procede originalmente, registrar la limitación y solicitar las aclaraciones necesarias, sin atribuir automáticamente al proveedor tecnológico la condición de fuente original.",
          expected_result:
            "Canales y participantes identificados de manera suficiente para explicar cómo se reciben los datos y reconocer las procedencias conocidas. Las diferencias entre proveedores técnicos, organizaciones remitentes y fuentes originales deben quedar documentadas cuando sean relevantes, junto con los vínculos pendientes de confirmación, sin presumir licitud por la sola existencia de una integración.",
        },
      ],
      required_facts: [],
      default_next_node_key: "keep-evidence",
      provenance: "legal_requirement",
    },
    {
      node_key: "keep-evidence",
      node_type: "question",
      title: "Evidencia de origen preservada",
      prompt:
        "¿Quedó preservada la evidencia del origen para transparencia y ejercicio de derechos?",
      why_it_matters:
        "Sin evidencia preservada la trazabilidad no es acreditable ante titulares ni revisión.",
      fact_key: "traceability.evidence_kept",
      answer_type: "single_select",
      options: stateOptions("traceability.evidence_kept"),
      evidence_to_review: ["evidencia de procedencia"],
      evidence_review_help: [
        {
          evidence_item: "evidencia de procedencia",
          review_guide:
            "Examinar formularios, registros de recepción, comunicaciones de terceros y otros antecedentes conservados para comprobar que permitan reconstruir las circunstancias conocidas de obtención de los datos. Verificar que los respaldos sean localizables, estén vinculados con las operaciones correspondientes y contengan información suficiente para identificar la fuente y atender consultas pertinentes de los titulares. Detectar referencias incompletas, documentos desactualizados o antecedentes cuya procedencia no pueda confirmarse.",
          no_evidence_guidance:
            "Consultar los sistemas de origen, expedientes y áreas que participaron en la recopilación para localizar documentos o registros equivalentes. Cuando los antecedentes sean insuficientes o se hayan perdido, identificar las operaciones afectadas y las comprobaciones pendientes, gestionando su recuperación o reconstrucción mediante fuentes verificables. No elaborar constancias ficticias ni presumir que la falta de un documento específico demuestra automáticamente una obtención ilícita.",
          expected_result:
            "Respaldos identificables, accesibles para quienes deban gestionar el cumplimiento y vinculados con las operaciones correspondientes, suficientes para explicar la procedencia conocida de los datos. Las ausencias, discrepancias y limitaciones deben quedar documentadas para su revisión, sin considerar acreditadas circunstancias que no puedan comprobarse ni imponer una conservación indefinida de antecedentes.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de trazabilidad",
      prompt:
        "El sistema verifica el estado estructural y las verificaciones profesionales.",
      answer_type: "none",
      required_facts: [...DERIVED, ...MANUAL],
      transitions: [
        {
          rule_id: "structural-missing",
          description:
            "Sin datos o sin fuentes no hay trazabilidad que validar.",
          when: { op: "any", conditions: DERIVED.map(derivedNo) },
          goto_outcome_key: "traceability_missing",
          explanation:
            "Faltan datos o fuentes registrados. Completa cada elemento en el workspace.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación profesional está pendiente o sin información.",
          when: { op: "any", conditions: MANUAL.map(unresolved) },
          goto_outcome_key: "traceability_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La trazabilidad aún no queda documentada.",
        },
        {
          rule_id: "all-verified",
          description:
            "Estructura presente y verificaciones profesionales realizadas.",
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
          goto_outcome_key: "traceability_documented",
          explanation:
            "Todas las verificaciones están realizadas y respaldadas para este tratamiento.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "traceability_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "traceability_documented",
      label: "Origen trazado y acreditado",
      classification: "legal_requirement",
      explanation:
        "Los datos y fuentes existen y el origen quedó identificado con cobertura correspondiente y evidencia preservada.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la matriz de trazabilidad",
          note: "Archiva el registro de fuentes por tratamiento con evidencia de procedencia e identificación de fuentes públicas e integraciones cuando corresponda.",
        },
      ],
    },
    {
      outcome_key: "traceability_missing",
      label: "Fuentes o datos por registrar",
      classification: "agency_standard",
      explanation:
        "Faltan datos o fuentes en el workspace. La validación jurídica requiere objetos sobre los cuales pronunciarse.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Registrar datos y fuentes en Tratamientos",
          note: "Agrega los datos y sus fuentes en la sección Tratamientos de la empresa.",
        },
      ],
    },
    {
      outcome_key: "traceability_in_progress",
      label: "Trazabilidad en curso",
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
