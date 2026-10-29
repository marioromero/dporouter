import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.05.
 *
 * activity_key = consent.proof_design (checklist, purpose scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * checks, evidencia y effects del contenido canónico D3.05. Verifica
 * la CAPACIDAD del mecanismo para generar, conservar y recuperar
 * evidencia suficiente cuando ocurra un consentimiento; nunca exige
 * prueba de titulares individuales, timestamps por persona ni
 * registros reales (frontera Stage 1).
 *
 * Bridge operativo/read-only idéntico a D3.03: compuerta sobre
 * `lawful.consent_applies = consent_yes` de D2.05, sin materializar
 * `purpose.lawful_basis`, sin modificar D2.05. Sin plazo de
 * conservación inventado. Mandatario condicional con `na`.
 * `reasoning_record_required = false`.
 */

const BRIDGE_FACT = "lawful.consent_applies";

const CHECKS = [
  "consent.proof.manifestation_recordable",
  "consent.proof.purpose_linked",
  "consent.proof.information_recorded",
  "consent.proof.priority_provable",
  "consent.proof.mandate_recorded",
  "consent.proof.retention_recoverable",
];

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function satisfied(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
}

function checkOptions(factKey: string, yesHint: string) {
  return [
    {
      value: "yes",
      label: "Revisado y satisfactorio",
      description: yesHint,
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

function conditionalOptions(factKey: string, naHint: string) {
  return [
    {
      value: "yes",
      label: "Revisado y satisfactorio",
      description: "Verificado conforme al criterio evaluado.",
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

export const CONSENT_PROOF_DESIGN_PROTOCOL: ExecutionProtocol = {
  protocol_key: "consent.proof_design.v1",
  activity_key: "consent.proof_design",
  version: 1,
  mode: "checklist",
  execution_scope: "purpose",
  title: "Verificación guiada de la capacidad de prueba",
  description:
    "Verifica que el mecanismo esté diseñado para generar, conservar y recuperar evidencia suficiente del consentimiento de la finalidad activa: manifestación, finalidad, información, anterioridad, mandatario y recuperación.",
  entry_node_key: "route-gate",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [BRIDGE_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "route-gate",
      node_type: "decision",
      title: "Ruta de consentimiento",
      prompt:
        "El sistema verifica que esta finalidad siga la ruta de consentimiento según D2.05.",
      answer_type: "none",
      required_facts: [BRIDGE_FACT],
      transitions: [
        {
          rule_id: "consent-route",
          description: "La finalidad sigue la ruta de consentimiento.",
          when: {
            op: "fact_equals",
            fact_key: BRIDGE_FACT,
            value: "consent_yes",
          },
          goto_node_key: "check-manifestation",
          explanation:
            "D2.05 determinó consentimiento para esta finalidad: procede la verificación.",
        },
        {
          rule_id: "fallback-route",
          description: "Sin ruta de consentimiento no inicia la verificación.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "Esta guía solo procede cuando la finalidad utiliza consentimiento como base de licitud.",
        },
      ],
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-manifestation",
      node_type: "question",
      title: "Manifestación registrable",
      prompt:
        "¿El mecanismo es capaz de registrar la manifestación, declaración o acción afirmativa cuando ocurra?",
      why_it_matters:
        "Sin registro de la manifestación no es posible acreditar el consentimiento.",
      fact_key: "consent.proof.manifestation_recordable",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "consent.proof.manifestation_recordable",
        "Manifestación registrable por diseño.",
      ),
      evidence_to_review: [
        "especificación de logs y registros del sistema externo",
        "pruebas del mecanismo",
      ],
      evidence_review_help: [
        {
          evidence_item: "especificación de logs y registros del sistema externo",
          review_guide:
            "Verificar que los registros previstos permitan reconocer qué declaración o acción afirmativa constituyó la manifestación de consentimiento, identificando cómo se genera y conserva su constancia según el canal utilizado. Revisar que la evidencia corresponda a una intervención positiva y no a estados predeterminados, silencio o mera inacción, distinguiendo funcionalidades diseñadas de las implementadas.",
          no_evidence_guidance:
            "Consultar los requisitos técnicos, modelos de registro y responsables del sistema externo para determinar qué constancia producirá el mecanismo al recibir una manifestación. Si no existe una definición suficiente, identificar los elementos pendientes sin inventar eventos registrados ni exigir un formato tecnológico único.",
          expected_result:
            "Una capacidad documentada para producir constancias interpretables de declaraciones o acciones afirmativas, con el origen de la manifestación y las limitaciones del diseño identificables. Las funcionalidades no implementadas o sin verificar deben quedar diferenciadas, sin considerarlas prueba de consentimientos individuales efectivamente otorgados.",
        },
        {
          evidence_item: "pruebas del mecanismo",
          review_guide:
            "Comprobar mediante demostraciones o recorridos funcionales que una manifestación afirmativa de prueba produzca la constancia prevista y pueda distinguirse de interacciones sin autorización. Revisar los resultados observables y eventuales fallos, sin utilizar datos de titulares reales ni considerar suficiente la presencia visual de un botón de aceptación.",
          no_evidence_guidance:
            "Solicitar una demostración controlada o revisar resultados de pruebas existentes que permitan comprobar la generación de evidencia. Si solo se dispone de especificaciones o no es posible ejecutar el mecanismo, identificar qué capacidades siguen sin comprobarse sin presentar funcionalidades declaradas como pruebas exitosas.",
          expected_result:
            "Resultados verificables de pruebas o demostraciones que permitan determinar si el mecanismo genera evidencia de la manifestación conforme a lo previsto, con fallos e incertidumbres identificados. La comprobación debe sustentar la capacidad probatoria sin atribuir validez jurídica a consentimientos individuales ni anticipar su recuperación posterior.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-purpose",
      provenance: "agency_standard",
    },
    {
      node_key: "check-purpose",
      node_type: "question",
      title: "Vínculo con la finalidad",
      prompt:
        "¿La evidencia generable vincula el consentimiento con la finalidad específica?",
      why_it_matters:
        "Sin vínculo con la finalidad no se acredita consentimiento específico.",
      fact_key: "consent.proof.purpose_linked",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "consent.proof.purpose_linked",
        "Vínculo con la finalidad específica por diseño.",
      ),
      evidence_to_review: ["modelo de evidencia", "diseño técnico o funcional"],
      evidence_review_help: [
        {
          evidence_item: "modelo de evidencia",
          review_guide:
            "Comprobar que la constancia prevista permita relacionar cada manifestación con la finalidad concreta autorizada, identificando cómo queda representado su alcance cuando existen varios usos de datos. Revisar que la evidencia no se limite a una aceptación genérica ni dependa de interpretaciones posteriores para determinar qué tratamiento fue consentido.",
          no_evidence_guidance:
            "Consultar modelos de registro, ejemplos de constancias y antecedentes del mecanismo para identificar cómo se representará la finalidad autorizada. Si falta esa vinculación o no puede reconstruirse el alcance de la manifestación, señalar las definiciones pendientes sin inventar registros ni asumir especificidad por una aceptación aislada.",
          expected_result:
            "Un modelo de evidencia capaz de asociar inequívocamente la manifestación con la finalidad activa y distinguir otras autorizaciones cuando corresponda. Las vinculaciones incompletas o ambiguas deben quedar identificadas, sin considerar que el modelo acredita consentimientos individuales efectivamente otorgados.",
        },
        {
          evidence_item: "diseño técnico o funcional",
          review_guide:
            "Verificar cómo el mecanismo trasladará la finalidad seleccionada a la constancia generada, revisando la correspondencia entre las opciones ofrecidas al titular y los datos que podrán recuperarse. Identificar rutas, reglas o transformaciones que puedan perder esa relación o registrar una finalidad diferente de la autorizada.",
          no_evidence_guidance:
            "Revisar especificaciones, flujos y configuraciones del sistema externo para reconstruir cómo se vinculará la decisión con la finalidad registrada. Cuando las reglas no estén definidas o existan discrepancias entre interfaz y evidencia, identificar las comprobaciones pendientes sin atribuir funcionalidades implementadas a un diseño documental.",
          expected_result:
            "Un diseño que permita conservar la correspondencia entre la finalidad autorizada y la evidencia generable, con reglas y posibles fallos identificables. Las funcionalidades no comprobadas deben quedar diferenciadas, sin afirmar que una vinculación prevista funciona correctamente por su sola especificación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-information",
      provenance: "agency_standard",
    },
    {
      node_key: "check-information",
      node_type: "question",
      title: "Información registrada",
      prompt:
        "¿La evidencia registra la información y condiciones relevantes presentadas al consentir?",
      why_it_matters:
        "Sin registro de lo informado no se acredita consentimiento informado.",
      fact_key: "consent.proof.information_recorded",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "consent.proof.information_recorded",
        "Información y condiciones registrables por diseño.",
      ),
      evidence_to_review: ["modelo de evidencia", "captura de ejemplo"],
      evidence_review_help: [
        {
          evidence_item: "modelo de evidencia",
          review_guide:
            "Comprobar que la constancia prevista permita identificar o reconstruir la información y condiciones relevantes presentadas al titular cuando consiente, incluyendo la versión o contenido aplicable y su relación con la manifestación. Verificar que los cambios posteriores en formularios o textos no impidan determinar qué información correspondía al momento de autorizar.",
          no_evidence_guidance:
            "Consultar modelos de registro, especificaciones y antecedentes de los textos utilizados para identificar cómo se conservará la referencia a lo informado. Si no existe una vinculación verificable entre la manifestación y ese contenido, señalar las definiciones pendientes sin presumir que la política actualmente publicada refleja las condiciones anteriores.",
          expected_result:
            "Un modelo capaz de vincular cada manifestación con la información y condiciones que le correspondían, permitiendo reconstruirlas aun cuando los textos cambien posteriormente. Las referencias incompletas o inciertas deben quedar identificadas, sin considerar acreditados consentimientos individuales por la sola definición del modelo.",
        },
        {
          evidence_item: "captura de ejemplo",
          review_guide:
            "Revisar una muestra representativa de la presentación utilizada para solicitar consentimiento, identificando los textos, condiciones y referencias que acompañan la decisión. Contrastar esa muestra con el modelo de evidencia para comprobar que el mecanismo pueda relacionar el contenido mostrado con la constancia generable, sin tratar la imagen como prueba de lo informado a todos los titulares.",
          no_evidence_guidance:
            "Obtener una muestra del formulario, pantalla o material equivalente correspondiente al canal previsto, mediante un prototipo o una demostración controlada. Si no existe una captura adecuada o el medio no es visual, consultar una representación equivalente y señalar las comprobaciones pendientes sin inventar contenidos presentados.",
          expected_result:
            "Una muestra revisable de la información asociada a la solicitud, cuya correspondencia con la evidencia generable pueda comprobarse. Las diferencias o limitaciones deben quedar reconocidas, sin atribuir a una captura ilustrativa valor de prueba de todas las manifestaciones efectivamente obtenidas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-priority",
      provenance: "agency_standard",
    },
    {
      node_key: "check-priority",
      node_type: "question",
      title: "Anterioridad acreditable",
      prompt:
        "¿La evidencia permite acreditar que el consentimiento antecedió al tratamiento sustentado en él?",
      why_it_matters:
        "Sin anterioridad acreditable no se sostiene el carácter previo.",
      fact_key: "consent.proof.priority_provable",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "consent.proof.priority_provable",
        "Anterioridad acreditable por diseño.",
      ),
      evidence_to_review: [
        "especificación de logs y registros del sistema externo",
        "pruebas del mecanismo",
      ],
      evidence_review_help: [
        {
          evidence_item: "especificación de logs y registros del sistema externo",
          review_guide:
            "Comprobar que las constancias previstas permitan establecer el orden entre la manifestación de consentimiento y el inicio de las operaciones sustentadas en ella. Revisar cómo se relacionan ambos acontecimientos mediante registros u otros antecedentes verificables, identificando rutas de tratamiento cuya anterioridad no pueda reconstruirse de forma fiable.",
          no_evidence_guidance:
            "Consultar los modelos de registro, requisitos funcionales y responsables del sistema externo para identificar cómo podrá acreditarse la secuencia entre autorización y tratamiento. Si faltan referencias temporales o mecanismos equivalentes de comprobación, señalar las definiciones pendientes sin inventar eventos, marcas de tiempo ni controles implementados.",
          expected_result:
            "Un diseño probatorio capaz de demostrar que la manifestación antecede al tratamiento basado en consentimiento, con antecedentes suficientes para reconstruir el orden de los acontecimientos. Las rutas sin respaldo o con información temporal incierta deben quedar identificadas, sin exigir un formato técnico universal.",
        },
        {
          evidence_item: "pruebas del mecanismo",
          review_guide:
            "Verificar mediante demostraciones controladas que la evidencia generada permita comprobar la secuencia entre una autorización de prueba y la activación del tratamiento correspondiente. Revisar también los resultados ante ausencia de consentimiento y posibles rutas alternativas, distinguiendo el funcionamiento observado de lo previsto en las especificaciones.",
          no_evidence_guidance:
            "Solicitar un recorrido funcional o consultar resultados de pruebas existentes que muestren cómo se acredita el orden entre manifestación y tratamiento. Cuando no pueda ejecutarse la demostración, identificar las comprobaciones pendientes sin presentar como verificada una secuencia descrita únicamente en documentos.",
          expected_result:
            "Resultados de pruebas que permitan valorar si la evidencia generada acredita efectivamente la anterioridad, con secuencias observadas, fallos y limitaciones identificables. La demostración debe respaldar la capacidad del mecanismo sin atribuir consentimientos reales ni garantizar el comportamiento de todas las ejecuciones futuras.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-mandate",
      provenance: "agency_standard",
    },
    {
      node_key: "check-mandate",
      node_type: "question",
      title: "Mandatario registrable",
      prompt:
        "¿El diseño registra la actuación del representante o mandatario y la facultad expresa, o no interviene mandatario?",
      why_it_matters:
        "La actuación por mandatario debe quedar trazable con su facultad expresa.",
      fact_key: "consent.proof.mandate_recorded",
      answer_type: "single_select",
      options: conditionalOptions(
        "consent.proof.mandate_recorded",
        "No interviene representante ni mandatario en este caso.",
      ),
      evidence_to_review: ["modelo de evidencia"],
      evidence_review_help: [
        {
          evidence_item: "modelo de evidencia",
          review_guide:
            "Comprobar que la constancia prevista permita identificar cuándo el consentimiento es otorgado por un representante legal o mandatario, relacionando esa actuación con la manifestación y los antecedentes de representación correspondientes. Cuando intervenga mandatario, verificar que el modelo permita acreditar su facultad expresa para consentir. Si no interviene ninguna de estas modalidades, contrastar esa condición con el alcance real del mecanismo.",
          no_evidence_guidance:
            "Consultar las especificaciones del sistema externo, formularios y procedimientos de representación para determinar qué antecedentes podrán registrarse y relacionarse con la autorización. Si el modelo no contempla una modalidad utilizada o sus facultades no pueden acreditarse, señalar las definiciones pendientes sin inventar registros. Justificar «No aplica» únicamente cuando no intervengan representantes ni mandatarios.",
          expected_result:
            "Un modelo capaz de vincular la manifestación con la actuación y facultades acreditables del representante o mandatario, según corresponda, incluyendo la facultad expresa exigida al mandatario. Las limitaciones deben quedar identificadas o, cuando no exista representación, sustentada su inaplicabilidad, sin requerir documentos individuales reales en Stage 1.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-recovery",
      provenance: "agency_standard",
    },
    {
      node_key: "check-recovery",
      node_type: "question",
      title: "Conservación y recuperación",
      prompt:
        "¿Están verificadas la conservación y la recuperación posterior de la evidencia?",
      why_it_matters:
        "Sin conservación y recuperación la evidencia no sirve ante la carga de prueba.",
      fact_key: "consent.proof.retention_recoverable",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "consent.proof.retention_recoverable",
        "Conservación y recuperación verificadas.",
      ),
      evidence_to_review: [
        "procedimiento de conservación y recuperación",
        "pruebas del mecanismo",
      ],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de conservación y recuperación",
          review_guide:
            "Comprobar cómo se conservarán, protegerán y localizarán posteriormente las constancias de consentimiento generadas por el sistema externo, identificando responsables, condiciones de acceso y criterios de conservación pertinentes. Revisar que el procedimiento permita recuperar evidencia interpretable y suficientemente íntegra, sin fijar períodos arbitrarios ni suponer que generar un registro garantiza su disponibilidad futura.",
          no_evidence_guidance:
            "Consultar procedimientos operativos, especificaciones de almacenamiento y responsables del sistema para reconstruir cómo se conservará y recuperará la evidencia. Si faltan definiciones sobre acceso, protección o conservación, identificar las verificaciones pendientes sin inventar períodos obligatorios ni atribuir controles que no estén documentados.",
          expected_result:
            "Un procedimiento verificable que contemple conservación apropiada, protección y recuperación posterior de constancias utilizables para acreditar consentimiento. Los riesgos, limitaciones y condiciones pendientes deben quedar identificados, sin considerar que la mera existencia de un repositorio demuestra una capacidad de recuperación efectiva.",
        },
        {
          evidence_item: "pruebas del mecanismo",
          review_guide:
            "Verificar mediante demostraciones controladas que una constancia de prueba pueda conservarse y recuperarse posteriormente con su contenido interpretable e íntegro. Revisar los resultados de búsqueda, acceso y recuperación, identificando fallos o restricciones relevantes y diferenciando el comportamiento observado de las funcionalidades descritas en el procedimiento.",
          no_evidence_guidance:
            "Solicitar una demostración con datos ficticios o revisar resultados de pruebas existentes que permitan comprobar la recuperación de evidencia previamente generada. Si no puede realizarse la prueba o solo se dispone de especificaciones, señalar las comprobaciones pendientes sin presentar una capacidad declarada como funcionamiento acreditado.",
          expected_result:
            "Resultados verificables de conservación y recuperación que permitan valorar si las constancias permanecen disponibles, íntegras e interpretables para su utilización probatoria. Los fallos e incertidumbres deben quedar reconocidos, sin garantizar disponibilidad indefinida ni atribuir pruebas individuales reales a una demostración controlada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "synthesis",
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la capacidad",
      prompt:
        "El sistema verifica si el mecanismo puede generar y conservar evidencia suficiente.",
      answer_type: "none",
      required_facts: [BRIDGE_FACT, ...CHECKS],
      transitions: [
        {
          rule_id: "route-lost",
          description: "La finalidad ya no sigue la ruta de consentimiento.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: BRIDGE_FACT,
              value: "consent_yes",
            },
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "Sin ruta de consentimiento vigente no hay capacidad que verificar.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un criterio de capacidad requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de capacidad probatoria que requieren corrección.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún criterio está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan criterios por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "capability-ok",
          description: "Capacidad probatoria diseñada.",
          when: { op: "all", conditions: CHECKS.map(satisfied) },
          goto_outcome_key: "proof_capability_designed",
          explanation:
            "El mecanismo puede generar, conservar y recuperar evidencia suficiente.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La verificación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "proof_capability_designed",
      label: "Capacidad de prueba diseñada",
      classification: "agency_standard",
      explanation:
        "El mecanismo puede generar, conservar y recuperar evidencia suficiente del consentimiento. Esto declara capacidad, no prueba de titulares individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.proof_capability_status", value: "designed" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Continuar el diseño en D3.03",
          activity_key: "consent.mechanism_design",
        },
        {
          kind: "info",
          label: "Conservar el diseño",
          note: "Archiva el modelo de evidencia con el diseño técnico o funcional y el procedimiento de conservación y recuperación.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere correcciones de capacidad",
      classification: "agency_standard",
      explanation:
        "Al menos un criterio de capacidad probatoria requiere corrección.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.proof_capability_status", value: "remediation_required" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada criterio pendiente y vuelve a verificar la capacidad.",
        },
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Verificación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen criterios pendientes o con información insuficiente.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "Sin ruta de consentimiento",
      classification: "agency_standard",
      explanation:
        "Esta guía solo procede cuando la finalidad utiliza consentimiento como base de licitud.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Determinar la base en D2.05",
          activity_key: "lawful_basis.assign",
        },
      ],
    },
  ],
};
