import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.09.
 *
 * activity_key = dpo.initial_governance_validation (checklist). Contenido
 * aprobado por la iteración vigente; usa exclusivamente los seis criterios
 * canónicos de gobernanza inicial, la evidencia y el state effect de D1.09.
 *
 * Calibración de modo: cada check usa yes_no_unknown con representación
 * humana explícita por check — Sí = revisado y satisfactorio, No =
 * requiere acción o corrección, Desconocido = información insuficiente.
 * Sin score global; sin usar Revisado como cumplimiento jurídico. Los
 * checks son independientes y resolvibles en cualquier orden.
 *
 * Materialización canónica (reconciliación D1): el state_effect
 * `dpo.governance_validation_status = valid | remediation_required`
 * es un valor singular autónomo. Cada outcome definitivo lo
 * materializa 1:1 mediante finalización explícita genérica
 * (`governance_validated` → valid, `remediation_required` →
 * remediation_required). Sin fechas, historial ni lifecycle: divisible
 * y compatible con contratos actuales. execution-ready + product-ready.
 */

const CHECK_FACTS = [
  "dpo.governance.reporting_line",
  "dpo.governance.autonomy",
  "dpo.governance.conflicts",
  "dpo.governance.resources",
  "dpo.governance.suitability",
  "dpo.governance.access",
];

const DECISION_FACTS = ["dpo.designated", ...CHECK_FACTS];

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function checkOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Revisado y satisfactorio",
      description: "Verificado conforme al criterio evaluado.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Requiere acción o corrección",
      description: "Existe brecha que requiere acción o corrección.",
      fact_effect: { fact_key: factKey, value: "no" },
    },
    {
      value: "unknown",
      label: "Información insuficiente",
      description: "No es posible determinarlo con respaldo disponible.",
      fact_effect: { fact_key: factKey, value: "unknown" },
    },
  ];
}

export const DPO_GOVERNANCE_VALIDATION_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.initial_governance_validation.v1",
  activity_key: "dpo.initial_governance_validation",
  version: 1,
  mode: "checklist",
  title: "Revisión guiada de gobernanza inicial del DPO",
  description:
    "Revisa operacionalmente que el DPO designado dispone de autonomía, independencia funcional, recursos, idoneidad, disponibilidad y ausencia de conflictos incompatibles. Cada punto distingue validado, brecha o información por acreditar.",
  entry_node_key: "designation-gate",
  decision_fact_keys: DECISION_FACTS,
  last_review: "2026-09-22",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "designation-gate",
      node_type: "question",
      title: "DPO designado",
      prompt: "¿Existe actualmente un DPO designado?",
      why_it_matters:
        "Esta validación recae sobre la gobernanza efectiva del DPO designado. Sin designación corresponde designar primero.",
      fact_key: "dpo.designated",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existe un DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "Aún no hay DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo.designated", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "expediente de designación",
        "comunicación interna de la designación",
      ],
      evidence_review_help: [
        {
          evidence_item: "expediente de designación",
          review_guide:
            "Verificar que exista un expediente o conjunto de antecedentes que permita acreditar la designación del DPO. Revisar la identidad de la persona designada, la autoridad que formalizó la decisión y la fecha efectiva, contrastando los antecedentes con la modalidad de prestación cuando corresponda.",
          no_evidence_guidance:
            "Si no se localiza un expediente verificable o los antecedentes no permiten confirmar la designación, registrar qué información falta y solicitar el respaldo disponible. No considerar una evaluación de necesidad, una propuesta pendiente o una intención informal como prueba suficiente de que el DPO ya fue designado.",
          expected_result:
            "La designación queda respaldada por antecedentes verificables que permiten identificar al DPO y confirmar que la decisión fue formalizada. Si no puede acreditarse una designación vigente, se identifica que corresponde resolver primero esa situación antes de evaluar la gobernanza del DPO.",
        },
        {
          evidence_item: "comunicación interna de la designación",
          review_guide:
            "Examinar las comunicaciones internas que informan la designación y comprobar que permiten reconocer a la persona designada, la función que ejercerá y, cuando conste, la fecha efectiva. Contrastar su contenido con el expediente de designación para detectar diferencias relevantes.",
          no_evidence_guidance:
            "Si no se localiza una comunicación interna, registrar su ausencia y comprobar si existen otros antecedentes que permitan establecer si la designación fue comunicada. Distinguir la falta de una comunicación localizada de la falta de designación: la comunicación es un medio de verificación y no debe tratarse automáticamente como un acto formal independiente exigido en todos los casos.",
          expected_result:
            "La comunicación disponible permite confirmar que la designación fue informada internamente y es coherente con el expediente. Si no se encuentra, queda registrada la brecha de comunicación sin concluir, solo por ello, que la designación no existe.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-reporting-line",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay gobernanza que validar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. La validación de gobernanza requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-reporting-line",
      node_type: "question",
      title: "Línea de rendición directa",
      prompt:
        "¿El DPO rinde directamente a la autoridad que lo designó?",
      why_it_matters:
        "La rendición directa sostiene la autonomía funcional del DPO frente a la administración.",
      fact_key: "dpo.governance.reporting_line",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.reporting_line"),
      evidence_to_review: [
        "organigrama o línea de reporte",
        "ficha de validación de gobernanza",
      ],
      help_text: [
        "Revisa a quién reporta formalmente el DPO y si esa línea llega sin intermediación a la autoridad que lo designó.",
      ],
      evidence_review_help: [
        {
          evidence_item: "organigrama o línea de reporte",
          review_guide:
            "Examinar el organigrama, la estructura de reporte u otros antecedentes organizacionales que permitan identificar a quién rinde cuenta formalmente el DPO. Contrastar esa línea con la autoridad que realizó la designación y comprobar si la rendición es directa, sin intermediarios jerárquicos que condicionen su acceso a dicha autoridad.",
          no_evidence_guidance:
            "Si no existe un organigrama actualizado ni otro antecedente que permita establecer la línea de reporte, registrar la falta de respaldo y solicitar una descripción verificable de la estructura. Si los documentos muestran una línea indirecta o contradictoria, documentar la diferencia sin presumir que la autonomía está acreditada.",
          expected_result:
            "La línea de rendición de cuentas queda identificada y permite verificar si el DPO reporta directamente a la autoridad que lo designó. Las ambigüedades o posibles intermediaciones quedan registradas para su aclaración.",
        },
        {
          evidence_item: "ficha de validación de gobernanza",
          review_guide:
            "Revisar la ficha de validación como registro del análisis realizado sobre la línea de rendición de cuentas. Comprobar que identifique la autoridad que designó al DPO, la línea de reporte examinada, los antecedentes consultados y la conclusión obtenida, de manera coherente con el organigrama u otras evidencias disponibles.",
          no_evidence_guidance:
            "Si no existe ficha o está incompleta, registrar qué elementos del análisis no quedaron documentados y completar la evaluación con los antecedentes disponibles. Distinguir la ausencia de la ficha de la ausencia de una línea de reporte directa: la ficha es un medio metodológico para dejar trazabilidad y no debe tratarse automáticamente como un documento independiente exigido por norma.",
          expected_result:
            "La evaluación de la rendición directa queda documentada y es coherente con la estructura organizacional verificada. Si hay brechas, la ficha las identifica sin presentar una conclusión favorable cuando la evidencia no permite sostenerla.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-autonomy",
      provenance: "agency_standard",
    },
    {
      node_key: "check-autonomy",
      node_type: "question",
      title: "Autonomía en protección de datos",
      prompt:
        "¿El DPO actúa con autonomía respecto de la administración en materias de protección de datos?",
      why_it_matters:
        "Sin autonomía funcional el DPO no puede desempeñar su función con independencia.",
      fact_key: "dpo.governance.autonomy",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.autonomy"),
      evidence_to_review: [
        "organigrama o línea de reporte",
        "ficha de validación de gobernanza",
      ],
      help_text: [
        "Verifica que la administración no instruya ni limite el criterio del DPO en materias de protección de datos.",
      ],
      evidence_review_help: [
        {
          evidence_item: "organigrama o línea de reporte",
          review_guide:
            "Revisar el organigrama, la descripción del cargo o la línea de reporte para determinar si el DPO depende de la autoridad que lo designó y dispone de una vía directa para comunicar criterios, riesgos y observaciones en protección de datos. Contrastar la estructura formal con el funcionamiento descrito.",
          no_evidence_guidance:
            "Registrar la ausencia del organigrama o de una descripción verificable de la línea de reporte. La falta del documento no demuestra por sí sola que exista subordinación funcional; corresponde aclarar cómo se ejerce la función y a quién se informa.",
          expected_result:
            "Una conclusión trazable sobre la línea de reporte del DPO, identificando la autoridad receptora, las posibles dependencias intermedias y cualquier restricción observada que pueda afectar su autonomía funcional.",
        },
        {
          evidence_item: "ficha de validación de gobernanza",
          review_guide:
            "Contrastar la ficha con la designación y la estructura de reporte disponibles. Verificar si se identifican interferencias de la administración en el criterio del DPO, restricciones para comunicar riesgos o limitaciones para formular observaciones independientes en materias de protección de datos.",
          no_evidence_guidance:
            "Dejar constancia de que no existe una ficha disponible y completar la evaluación con antecedentes verificables, como documentos organizacionales o entrevistas registradas. No presumir autonomía ni falta de autonomía únicamente por la ausencia de la ficha.",
          expected_result:
            "Una conclusión documentada sobre la autonomía funcional del DPO, con los antecedentes que la respaldan, las restricciones detectadas y las medidas de aclaración o corrección que correspondan.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-conflicts",
      provenance: "agency_standard",
    },
    {
      node_key: "check-conflicts",
      node_type: "question",
      title: "Otras funciones y conflictos",
      prompt:
        "¿Las otras funciones del DPO son compatibles, sin conflictos de interés?",
      why_it_matters:
        "Funciones incompatibles o conflictos no gestionados comprometen la independencia del DPO.",
      fact_key: "dpo.governance.conflicts",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.conflicts"),
      evidence_to_review: [
        "declaración o evaluación de conflictos",
        "ficha de validación de gobernanza",
      ],
      help_text: [
        "Analiza qué otras funciones ejerce el DPO y si alguna determina fines o medios de tratamientos que luego debe supervisar.",
      ],
      evidence_review_help: [
        {
          evidence_item: "declaración o evaluación de conflictos",
          review_guide:
            "Revisar si existe una declaración o evaluación de las demás funciones del DPO, sus responsabilidades y sus relaciones jerárquicas. Analizar si alguna de ellas permite decidir los fines o medios de tratamientos de datos personales que el propio DPO debe supervisar, considerando también los conflictos potenciales y las medidas de gestión documentadas.",
          no_evidence_guidance:
            "Registrar la ausencia de una declaración o evaluación disponible. Recabar antecedentes verificables sobre los cargos, facultades decisorias y responsabilidades efectivas del DPO; la falta de un formulario específico no demuestra por sí sola la existencia de un conflicto.",
          expected_result:
            "Una conclusión trazable sobre los conflictos reales o potenciales identificados, las funciones que podrían originarlos y las medidas de prevención o gestión existentes o pendientes, sin presumir que toda función adicional es incompatible.",
        },
        {
          evidence_item: "ficha de validación de gobernanza",
          review_guide:
            "Contrastar la ficha con la designación, las funciones efectivamente desempeñadas y la estructura de responsabilidades. Verificar si se evaluó el riesgo de que el DPO determine fines o medios de tratamientos que posteriormente debe supervisar, y si las medidas propuestas permiten gestionar ese riesgo de manera verificable.",
          no_evidence_guidance:
            "Dejar constancia de que no existe una ficha disponible y reconstruir la evaluación a partir de antecedentes organizacionales verificables. Distinguir entre ausencia de registro, conflicto potencial y conflicto efectivo, sin concluir automáticamente que existe incompatibilidad.",
          expected_result:
            "Una conclusión documentada sobre la compatibilidad de las otras funciones con el rol de DPO, con los riesgos identificados, sus fundamentos y las medidas de gestión o cambios de funciones que correspondan.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-resources",
      provenance: "agency_standard",
    },
    {
      node_key: "check-resources",
      node_type: "question",
      title: "Recursos y disponibilidad",
      prompt:
        "¿El DPO dispone de recursos materiales y disponibilidad suficientes?",
      why_it_matters:
        "Sin recursos ni tiempo asignado la función queda formalmente creada pero inoperante.",
      fact_key: "dpo.governance.resources",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.resources"),
      evidence_to_review: [
        "evidencia de recursos",
        "ficha de validación de gobernanza",
      ],
      help_text: [
        "Verifica dedicación efectiva, medios materiales y acceso operativo acorde al volumen y complejidad.",
      ],
      evidence_review_help: [
        {
          evidence_item: "evidencia de recursos",
          review_guide:
            "Examinar los recursos asignados al DPO, incluidos el presupuesto disponible cuando corresponda, las herramientas, el apoyo especializado, el acceso a información y los medios para ejecutar sus funciones. Contrastar los recursos declarados con el volumen, la variedad y la complejidad de los tratamientos que debe supervisar.",
          no_evidence_guidance:
            "Registrar qué recursos no pueden verificarse y solicitar antecedentes sobre los medios realmente disponibles. La ausencia de un documento formal de asignación no demuestra por sí sola que no existan recursos; debe distinguirse entre recursos inexistentes, insuficientes y no acreditados.",
          expected_result:
            "Una conclusión fundamentada sobre la suficiencia práctica de los recursos, con brechas identificadas y medidas de provisión o mejora cuando correspondan, considerando el tamaño, la capacidad y los riesgos de la organización.",
        },
        {
          evidence_item: "ficha de validación de gobernanza",
          review_guide:
            "Contrastar la ficha con la dedicación efectiva del DPO, sus responsabilidades concurrentes, los medios disponibles y el acceso operativo a las áreas e información relevantes. Valorar si el tiempo y los recursos permiten ejercer las funciones de forma efectiva frente al volumen y la complejidad de los tratamientos.",
          no_evidence_guidance:
            "Dejar constancia de la ausencia de la ficha y realizar la evaluación con antecedentes verificables, como asignaciones de tiempo, descripción de funciones, herramientas disponibles o entrevistas registradas. No inferir suficiencia ni insuficiencia únicamente por la falta de ese formato.",
          expected_result:
            "Una evaluación trazable de la disponibilidad y capacidad operativa del DPO, que identifique limitaciones concretas de tiempo, acceso o medios y las medidas de ajuste que correspondan.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-suitability",
      provenance: "agency_standard",
    },
    {
      node_key: "check-suitability",
      node_type: "question",
      title: "Idoneidad profesional",
      prompt:
        "¿El DPO acredita conocimientos, experiencia y actualización profesional?",
      why_it_matters:
        "La idoneidad sostiene la calidad técnica de la función desde su inicio.",
      fact_key: "dpo.governance.suitability",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.suitability"),
      evidence_to_review: [
        "evidencia de idoneidad",
        "ficha de validación de gobernanza",
      ],
      help_text: [
        "Revisa formación, experiencia pertinente y actualización en la materia.",
      ],
      evidence_review_help: [
        {
          evidence_item: "evidencia de idoneidad",
          review_guide:
            "Examinar antecedentes de formación, experiencia profesional y actualización en protección de datos personales. Valorar su pertinencia respecto de las funciones efectivas del DPO, los tratamientos supervisados, sus riesgos y la complejidad de la organización. Considerar tanto los conocimientos técnicos como la capacidad práctica para ejercer la función.",
          no_evidence_guidance:
            "Registrar qué dimensiones de la idoneidad no pueden verificarse y solicitar antecedentes pertinentes. La ausencia de certificados o de un formato específico no demuestra por sí sola falta de conocimientos o experiencia; distinguir entre falta de evidencia y una brecha efectivamente identificada.",
          expected_result:
            "Una conclusión fundamentada sobre la idoneidad inicial del DPO, con los antecedentes considerados, las brechas verificables y las acciones de formación, actualización o apoyo especializado que correspondan.",
        },
        {
          evidence_item: "ficha de validación de gobernanza",
          review_guide:
            "Contrastar la ficha con los antecedentes profesionales disponibles y con las funciones asignadas al DPO. Verificar si se evaluaron conocimientos especializados, experiencia pertinente y actualización profesional, atendiendo a los tratamientos y riesgos que deberá supervisar.",
          no_evidence_guidance:
            "Dejar constancia de que no existe una ficha disponible y realizar la evaluación con antecedentes verificables, como currículum, formación, experiencia acreditable o registros de actualización. No asumir que la idoneidad está acreditada ni descartarla únicamente por la falta de esa ficha.",
          expected_result:
            "Una evaluación trazable de la idoneidad del DPO para las funciones asignadas, que identifique la base de la conclusión y las medidas de desarrollo profesional o refuerzo técnico que correspondan.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-access",
      provenance: "agency_standard",
    },
    {
      node_key: "check-access",
      node_type: "question",
      title: "Acceso a información y operaciones",
      prompt:
        "¿El DPO puede acceder a la información y operaciones relevantes?",
      why_it_matters:
        "Sin acceso efectivo el DPO no puede supervisar ni asesorar sobre los tratamientos reales.",
      fact_key: "dpo.governance.access",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.governance.access"),
      evidence_to_review: ["ficha de validación de gobernanza"],
      help_text: [
        "Verifica capacidad real de acceso a sistemas, procesos y personas vinculadas a los tratamientos.",
      ],
      evidence_review_help: [
        {
          evidence_item: "ficha de validación de gobernanza",
          review_guide:
            "Contrastar la ficha con los permisos y las prácticas operativas del DPO. Verificar si puede acceder, de forma efectiva y oportuna, a los sistemas, registros, procesos y personas necesarios para conocer los tratamientos supervisados, aclarar dudas y formular observaciones. Considerar las restricciones de acceso y los mecanismos establecidos para resolverlas.",
          no_evidence_guidance:
            "Registrar la ausencia de la ficha y verificar el acceso mediante antecedentes disponibles, como permisos, procedimientos, demostraciones operativas o entrevistas documentadas. Distinguir entre falta de registro y una limitación real de acceso; no presumir que el acceso existe únicamente porque el cargo está formalmente designado.",
          expected_result:
            "Una conclusión trazable sobre la capacidad efectiva del DPO para acceder a la información y las operaciones relevantes, con las restricciones identificadas y las medidas de habilitación o corrección que correspondan.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-assessment",
      provenance: "agency_standard",
    },
    {
      node_key: "final-assessment",
      node_type: "decision",
      title: "Síntesis de la validación",
      prompt:
        "El sistema distingue puntos validados, brechas e información por acreditar.",
      answer_type: "none",
      required_facts: [...DECISION_FACTS],
      transitions: [
        {
          rule_id: "gaps-found",
          description:
            "Al menos un check requiere acción o corrección.",
          when: { op: "any", conditions: CHECK_FACTS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas que requieren acción o corrección antes de dar por validada la gobernanza.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún antecedente está sin responder o con información insuficiente.",
          when: { op: "any", conditions: DECISION_FACTS.map(unresolved) },
          goto_outcome_key: "information_incomplete",
          explanation:
            "Falta información por acreditar. Con antecedentes pendientes no se emite validación definitiva.",
        },
        {
          rule_id: "all-validated",
          description:
            "DPO designado y los seis criterios revisados y satisfactorios.",
          when: {
            op: "all",
            conditions: [
              isYes("dpo.designated"),
              ...CHECK_FACTS.map(isYes),
            ],
          },
          goto_outcome_key: "governance_validated",
          explanation:
            "Todos los criterios de gobernanza inicial están revisados y satisfactorios.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin validar.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "information_incomplete",
          explanation:
            "La validación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "governance_validated",
      label: "Gobernanza inicial validada",
      classification: "agency_standard",
      explanation:
        "Los seis criterios están revisados y satisfactorios para el DPO designado, según la evidencia revisada en esta sesión.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "dpo.governance_validation_status", value: "valid" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Utilizar la validación en el modelo operativo (D1.11)",
          activity_key: "dpo.operating_model",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere acciones correctivas",
      classification: "agency_standard",
      explanation:
        "Al menos un criterio presenta brechas. Documenta cada brecha y su medida correctiva en la ficha de validación.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "dpo.governance_validation_status", value: "remediation_required" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Documentar brechas y medidas correctivas",
          note: "Registra cada brecha detectada con su medida correctiva en la ficha de validación de gobernanza.",
        },
      ],
    },
    {
      outcome_key: "information_incomplete",
      label: "Información insuficiente",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar revisión",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "DPO aún no designado",
      classification: "agency_standard",
      explanation:
        "Sin DPO designado no hay gobernanza que validar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Designar DPO en D1.08",
          activity_key: "dpo.designate",
        },
      ],
    },
  ],
};
