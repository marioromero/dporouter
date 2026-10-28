import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.11.
 *
 * activity_key = dpo.operating_model (procedure). Contenido aprobado por
 * la iteración vigente; usa exclusivamente pasos, evidencia, legal basis
 * y state effect del contenido canónico D1.11. No convierte la lista
 * operacional en un árbol decisional: cinco verificaciones planas más
 * compuerta de designación y síntesis final.
 *
 * La compuerta reutiliza el fact dpo.designated ya producido por D1.09:
 * cuando la validación inicial existe, su respuesta se inyecta como
 * "Dato ya disponible" y solo se confirma vigencia. La validación
 * inicial disponible se usa como insumo (input_dependency canónica):
 * sus brechas deben informar el modelo operativo.
 */

const VERIFICATION_FACTS = [
  "dpo.designated",
  "dpo.operating.reporting",
  "dpo.operating.involvement",
  "dpo.operating.info_access",
  "dpo.operating.functions_map",
  "dpo.operating.cadence",
];

function isYes(fact_key: string): FactCondition {
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

export const DPO_OPERATING_MODEL_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.operating_model.v1",
  activity_key: "dpo.operating_model",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del modelo operativo del DPO",
  description:
    "Pone en operación al DPO con reglas claras: reporte y acceso a la autoridad, eventos de involucramiento, acceso a información, mapa de funciones y cadencia de seguimiento.",
  entry_node_key: "designation-gate",
  decision_fact_keys: VERIFICATION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "designation-gate",
      node_type: "question",
      title: "DPO designado",
      prompt: "¿Existe actualmente un DPO designado?",
      why_it_matters:
        "El modelo operativo organiza el trabajo del DPO designado. Sin designación vigente corresponde designar primero.",
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
      evidence_to_review: ["expediente de designación"],
      evidence_review_help: [
        {
          evidence_item: "expediente de designación",
          review_guide:
            "Examinar el acto o antecedente que acredita la designación del DPO y verificar la identidad de la persona designada, la autoridad que formalizó la decisión y su fecha efectiva. Contrastar estos datos con los antecedentes organizacionales disponibles para determinar si la designación continúa vigente y corresponde al DPO que ejercerá el modelo operativo evaluado.",
          no_evidence_guidance:
            "Registrar que no se ha podido verificar la designación y revisar si existen actos, comunicaciones o antecedentes equivalentes que permitan acreditarla. Distinguir entre ausencia del expediente, falta de un respaldo localizado y ausencia efectiva de designación vigente. No inferir que existe un DPO designado solo porque una persona ejerza informalmente funciones relacionadas con protección de datos.",
          expected_result:
            "Una conclusión trazable sobre la existencia y vigencia de la designación, identificando los antecedentes examinados, la persona designada y cualquier brecha que deba resolverse antes de definir su participación operativa. Si no se confirma una designación vigente, dejar constancia de que corresponde resolver ese antecedente antes de avanzar con el modelo operativo.",
        },
      ],
      required_facts: [],
      default_next_node_key: "organize-reporting",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay modelo operativo que establecer.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. El modelo operativo requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "organize-reporting",
      node_type: "question",
      title: "Reporte y acceso a la autoridad",
      prompt:
        "¿Quedaron definidas la línea de reporte y el acceso del DPO a la autoridad?",
      why_it_matters:
        "El reporte directo sostiene la autonomía funcional del DPO en la operación diaria.",
      fact_key: "dpo.operating.reporting",
      answer_type: "single_select",
      options: stateOptions("dpo.operating.reporting"),
      evidence_to_review: [
        "carta o marco operativo DPO",
        "validación inicial D1.09 si está disponible",
      ],
      evidence_review_help: [
        {
          evidence_item: "carta o marco operativo DPO",
          review_guide:
            "Examinar el marco operativo o los antecedentes equivalentes que establezcan ante qué autoridad rinde cuentas el DPO y cómo puede acceder directamente a ella. Verificar que se identifiquen la autoridad correspondiente, los canales de comunicación y las condiciones para elevar asuntos relevantes sin intermediaciones que comprometan su autonomía funcional. Contrastar estas reglas con la estructura organizacional vigente.",
          no_evidence_guidance:
            "Revisar organigramas, instrucciones internas o acuerdos organizacionales que permitan identificar una línea de reporte efectiva. Distinguir entre falta de un documento denominado carta operativa, reglas existentes pero insuficientemente definidas y ausencia real de acceso directo a la autoridad. Registrar las brechas sin asumir que un formato documental específico es obligatorio.",
          expected_result:
            "Una conclusión trazable sobre la definición de la línea de reporte y el acceso directo del DPO a la autoridad correspondiente. Identificar las reglas verificadas, sus responsables y cualquier ambigüedad que pueda dificultar la rendición de cuentas o afectar la autonomía funcional durante la operación.",
        },
        {
          evidence_item: "validación inicial D1.09 si está disponible",
          review_guide:
            "Examinar los resultados disponibles de D1.09, especialmente los relativos a la línea de rendición directa, autonomía y posibles conflictos de funciones. Contrastar sus conclusiones y brechas con las reglas previstas en el modelo operativo, verificando si las observaciones relevantes fueron consideradas y si existe coherencia entre la validación inicial y la organización actual.",
          no_evidence_guidance:
            "Comprobar si D1.09 fue realizada y si sus resultados están disponibles. Si no existe una validación accesible, registrar esa circunstancia y evaluar la línea de reporte mediante los antecedentes organizacionales actuales, sin presumir incumplimiento automático. Si existen brechas conocidas de D1.09, no considerarlas resueltas únicamente porque el nuevo marco operativo las mencione.",
          expected_result:
            "Una conclusión que indique si la validación inicial fue utilizada como insumo, qué brechas relevantes se incorporaron al modelo operativo y cuáles siguen pendientes. Cuando D1.09 no esté disponible, dejar constancia de esa limitación y de los antecedentes alternativos utilizados para fundamentar la evaluación.",
        },
      ],
      help_text: [
        "Si la validación inicial está disponible, úsala como insumo: sus brechas deben informar el modelo operativo.",
      ],
      required_facts: [],
      default_next_node_key: "organize-involvement",
      related_activity_keys: ["dpo.initial_governance_validation"],
      provenance: "agency_standard",
    },
    {
      node_key: "organize-involvement",
      node_type: "question",
      title: "Eventos de involucramiento",
      prompt:
        "¿Quedaron definidos los eventos que requieren involucramiento del DPO?",
      why_it_matters:
        "Sin eventos definidos, la participación del DPO queda a discreción de cada área y pierde oportunidad.",
      fact_key: "dpo.operating.involvement",
      answer_type: "single_select",
      options: stateOptions("dpo.operating.involvement"),
      evidence_to_review: [
        "reglas de involucramiento",
        "carta o marco operativo DPO",
      ],
      evidence_review_help: [
        {
          evidence_item: "reglas de involucramiento",
          review_guide:
            "Examinar las reglas que identifican los procesos y eventos en los que corresponde involucrar al DPO, como cambios relevantes en tratamientos, evaluación de riesgos, EIPD o incidentes de protección de datos. Verificar que para cada evento se establezca cuándo debe intervenir, qué área activa su participación y qué antecedentes necesita recibir. Comprobar que el involucramiento esté previsto con oportunidad suficiente para ejercer sus funciones.",
          no_evidence_guidance:
            "Revisar procedimientos, flujos de aprobación o instrucciones internas que puedan establecer criterios equivalentes. Distinguir entre reglas existentes pero dispersas, participación informal y ausencia de eventos definidos. No considerar suficiente que las áreas puedan consultar voluntariamente al DPO si no existen criterios que permitan identificar cuándo corresponde involucrarlo.",
          expected_result:
            "Una conclusión trazable sobre la definición de eventos, responsables de activación, momentos de intervención e información requerida. Identificar los procesos alcanzados y las brechas que puedan ocasionar una participación tardía, incompleta o dependiente de decisiones discrecionales de cada área.",
        },
        {
          evidence_item: "carta o marco operativo DPO",
          review_guide:
            "Examinar cómo el marco operativo incorpora la participación del DPO en los procesos relevantes de la organización. Verificar que las funciones asignadas se relacionen con eventos concretos de involucramiento, que existan canales de coordinación con las áreas responsables y que se contemple el acceso oportuno a los antecedentes necesarios. Contrastar estas disposiciones con las reglas específicas de involucramiento.",
          no_evidence_guidance:
            "Revisar acuerdos organizacionales, procedimientos y otros antecedentes que puedan definir la coordinación operativa del DPO. Distinguir entre ausencia de un documento denominado carta operativa y falta real de reglas integradas. Si existen reglas de involucramiento separadas, comprobar si son coherentes con las responsabilidades y facultades reconocidas al DPO.",
          expected_result:
            "Una conclusión fundamentada sobre la coherencia entre el modelo operativo y los eventos que requieren participación del DPO. Identificar las funciones y mecanismos de coordinación acreditados, así como los vacíos que dificulten determinar cómo, cuándo y con qué información debe participar en los procesos alcanzados.",
        },
      ],
      help_text: [
        "Define cómo, cuándo y con qué información participa el DPO en cada proceso alcanzado.",
      ],
      required_facts: [],
      default_next_node_key: "organize-info-access",
      provenance: "agency_standard",
    },
    {
      node_key: "organize-info-access",
      node_type: "question",
      title: "Acceso a información y operaciones",
      prompt:
        "¿Quedó definido el acceso oportuno del DPO a la información y operaciones de tratamiento?",
      why_it_matters:
        "Sin acceso efectivo el DPO no puede supervisar ni asesorar sobre los tratamientos reales.",
      fact_key: "dpo.operating.info_access",
      answer_type: "single_select",
      options: stateOptions("dpo.operating.info_access"),
      evidence_to_review: [
        "canales de acceso a información",
        "carta o marco operativo DPO",
      ],
      evidence_review_help: [
        {
          evidence_item: "canales de acceso a información",
          review_guide:
            "Examinar los canales y procedimientos mediante los cuales el DPO puede obtener información sobre tratamientos, sistemas, procesos y operaciones relevantes. Verificar quién facilita el acceso, cómo se solicita o activa y si permite recibir antecedentes suficientes y oportunos para asesorar o supervisar. Considerar las restricciones de confidencialidad y seguridad sin confundirlas con obstáculos injustificados al ejercicio de sus funciones.",
          no_evidence_guidance:
            "Revisar procedimientos internos, permisos, flujos de consulta o acuerdos operativos que puedan acreditar mecanismos equivalentes. Distinguir entre falta de un registro formal, acceso dependiente de gestiones informales y ausencia efectiva de un canal funcional. No presumir que el DPO tiene acceso suficiente por su sola designación o por contar con credenciales generales.",
          expected_result:
            "Una conclusión trazable sobre la existencia y suficiencia de los canales de acceso, identificando responsables, modalidades de solicitud y eventuales restricciones. Registrar las brechas que puedan retrasar o impedir la obtención de información necesaria para supervisar y asesorar sobre los tratamientos relevantes.",
        },
        {
          evidence_item: "carta o marco operativo DPO",
          review_guide:
            "Examinar cómo el marco operativo reconoce y organiza el acceso del DPO a la información y a las operaciones de tratamiento pertinentes. Verificar que establezca mecanismos de coordinación con las áreas responsables, condiciones para obtener antecedentes oportunamente y vías para resolver dificultades de acceso. Contrastar estas reglas con los canales disponibles y con las funciones efectivamente asignadas.",
          no_evidence_guidance:
            "Revisar instrucciones organizacionales, procedimientos o acuerdos equivalentes que definan las facultades de acceso y la cooperación de las áreas. Distinguir entre ausencia de una carta operativa específica y falta real de reglas que respalden el acceso. Si existen canales técnicos o administrativos, comprobar que su utilización no dependa exclusivamente de autorizaciones discrecionales incompatibles con las funciones del DPO.",
          expected_result:
            "Una conclusión fundamentada sobre si el modelo operativo establece condiciones suficientes para el acceso oportuno del DPO. Identificar las responsabilidades de coordinación, los mecanismos para gestionar impedimentos y las brechas entre las reglas definidas y los canales efectivamente disponibles.",
        },
      ],
      required_facts: [],
      default_next_node_key: "organize-functions",
      provenance: "agency_standard",
    },
    {
      node_key: "organize-functions",
      node_type: "question",
      title: "Mapa de funciones",
      prompt:
        "¿Quedaron mapeadas las funciones del DPO hacia derechos, riesgos, EIPD, capacitación, supervisión y relación con la Agencia?",
      why_it_matters:
        "El mapa traduce las funciones normativas en responsabilidades operativas concretas y coordinadas.",
      fact_key: "dpo.operating.functions_map",
      answer_type: "single_select",
      options: stateOptions("dpo.operating.functions_map"),
      evidence_to_review: [
        "matriz de funciones",
        "carta o marco operativo DPO",
        "validación inicial D1.09 si está disponible",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz de funciones",
          review_guide:
            "La matriz debe permitir relacionar las funciones del DPO con actividades concretas de atención de derechos, asesoría sobre riesgos y EIPD, capacitación, supervisión y comunicación con la Agencia. Para cada ámbito corresponde identificar la intervención del DPO, las áreas con las que se coordina y las responsabilidades operativas asociadas. La revisión debe detectar funciones sin asignación clara o duplicidades que dificulten su ejercicio.",
          no_evidence_guidance:
            "Pueden considerarse distribuciones de responsabilidades, procedimientos o registros equivalentes que permitan reconstruir el mapa funcional. Debe distinguirse entre ausencia de una matriz formal, funciones documentadas de manera dispersa y falta efectiva de asignación operativa. La sola reproducción de atribuciones legales no acredita que estén integradas en los procesos de la organización.",
          expected_result:
            "Un mapa verificable que vincule las funciones pertinentes del DPO con actividades, responsabilidades y áreas de coordinación. La evaluación debe identificar funciones cubiertas, ámbitos pendientes y posibles superposiciones, sin atribuir al DPO la ejecución exclusiva de tareas que corresponden a otras áreas.",
        },
        {
          evidence_item: "carta o marco operativo DPO",
          review_guide:
            "Corresponde verificar que el marco operativo traduzca las funciones asignadas al DPO en mecanismos de participación y coordinación con las áreas responsables. Debe establecer cómo interviene en materias de derechos, riesgos, EIPD, capacitación, supervisión y relación con la Agencia, según los procesos aplicables. Su contenido debe ser coherente con la matriz funcional y preservar la autonomía del DPO.",
          no_evidence_guidance:
            "La revisión puede apoyarse en instrucciones internas, procedimientos o acuerdos organizacionales que describan las responsabilidades y relaciones de trabajo. Es necesario diferenciar la falta de una carta operativa específica de la ausencia de reglas funcionales. Si existen responsabilidades dispersas, debe comprobarse si permiten una coordinación efectiva y evitan instrucciones incompatibles con la autonomía del DPO.",
          expected_result:
            "Una definición operativa coherente de las funciones del DPO, sus relaciones de coordinación y los mecanismos que permiten ejercerlas. Deben quedar identificadas las reglas acreditadas y las brechas que impidan traducir el mapa funcional en participación efectiva, sin exigir un documento autónomo con formato único.",
        },
        {
          evidence_item: "validación inicial D1.09 si está disponible",
          review_guide:
            "Los resultados disponibles de D1.09 deben contrastarse con el mapa funcional propuesto, especialmente en materias de autonomía, conflictos de funciones, idoneidad, recursos y acceso a información. Corresponde identificar si las brechas detectadas condicionan alguna responsabilidad operativa y si el modelo contempla medidas concretas para abordarlas. La validación inicial funciona como antecedente, no como sustituto del mapeo.",
          no_evidence_guidance:
            "Debe establecerse si D1.09 fue realizada y si sus conclusiones están disponibles. Cuando no exista un resultado accesible, la evaluación puede sustentarse en antecedentes organizacionales actuales, dejando constancia de esa limitación. Las brechas conocidas no deben considerarse resueltas por el solo hecho de incorporar una función en la matriz o mencionarla en el marco operativo.",
          expected_result:
            "Una conclusión trazable sobre la incorporación de los hallazgos de D1.09 al modelo funcional, identificando brechas atendidas, pendientes y su efecto sobre el ejercicio del DPO. Si la validación inicial no está disponible, debe quedar identificado ese antecedente y la base alternativa utilizada, sin presumir incumplimiento automático.",
        },
      ],
      required_facts: [],
      default_next_node_key: "organize-cadence",
      related_activity_keys: ["dpo.initial_governance_validation"],
      provenance: "agency_standard",
    },
    {
      node_key: "organize-cadence",
      node_type: "question",
      title: "Cadencia y seguimiento",
      prompt:
        "¿Quedaron definidas la cadencia operativa y los mecanismos de seguimiento?",
      why_it_matters:
        "Sin cadencia ni seguimiento el modelo queda en declaración y pierde vigencia operativa.",
      fact_key: "dpo.operating.cadence",
      answer_type: "single_select",
      options: stateOptions("dpo.operating.cadence"),
      evidence_to_review: [
        "cadencia de reuniones o seguimiento",
        "carta o marco operativo DPO",
      ],
      evidence_review_help: [
        {
          evidence_item: "cadencia de reuniones o seguimiento",
          review_guide:
            "La evidencia debe permitir identificar cómo se organiza el seguimiento periódico del trabajo del DPO, incluyendo instancias de coordinación, responsables, frecuencia prevista y asuntos sujetos a revisión. Corresponde comprobar que exista un mecanismo para registrar avances, decisiones y asuntos pendientes, y que la periodicidad sea coherente con las funciones, riesgos y necesidades de la organización. Las reuniones no deben considerarse el único medio válido de seguimiento.",
          no_evidence_guidance:
            "Pueden revisarse calendarios, planes de trabajo, registros de seguimiento o acuerdos internos que permitan acreditar una organización equivalente. Debe distinguirse entre falta de un calendario formal, seguimiento realizado sin trazabilidad suficiente y ausencia de un mecanismo definido. La existencia de reuniones ocasionales no demuestra por sí sola una cadencia operativa establecida.",
          expected_result:
            "Una conclusión trazable sobre la definición de instancias, periodicidad, responsables y mecanismos para revisar avances y asuntos pendientes. La evaluación debe identificar las condiciones que permiten mantener activo el trabajo del DPO y las brechas que podrían afectar su continuidad, sin imponer una frecuencia universal de reuniones.",
        },
        {
          evidence_item: "carta o marco operativo DPO",
          review_guide:
            "Corresponde verificar que el marco operativo integre el seguimiento del DPO con sus funciones, la coordinación entre áreas y la rendición de resultados ante la autoridad correspondiente. Deben identificarse las responsabilidades de convocatoria o coordinación, los mecanismos para elevar asuntos relevantes y la forma en que se revisan compromisos y necesidades de ajuste. Estas reglas deben ser coherentes con la cadencia definida.",
          no_evidence_guidance:
            "La revisión puede apoyarse en instrucciones internas, planes de trabajo o acuerdos organizacionales que establezcan mecanismos equivalentes. Es necesario diferenciar la ausencia de una carta operativa específica de la falta efectiva de reglas de seguimiento y rendición. Si existen instancias periódicas, debe comprobarse que sus resultados puedan relacionarse con las funciones y responsabilidades del DPO.",
          expected_result:
            "Una definición verificable de cómo el modelo operativo mantiene la coordinación, el seguimiento y la rendición de resultados del DPO. Deben quedar identificadas las reglas acreditadas, su relación con las instancias de seguimiento y las brechas que dificulten mantener el modelo actualizado y operativo.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "agency_standard",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del modelo operativo",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el modelo sigue en organización.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "operating_model_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El modelo aún no queda operativo.",
        },
        {
          rule_id: "all-verified",
          description:
            "Designación, reporte, involucramiento, acceso, funciones y cadencia verificados.",
          when: {
            op: "all",
            conditions: [
              isYes("dpo.designated"),
              ...VERIFICATION_FACTS.filter((f) => f !== "dpo.designated").map(
                isYes,
              ),
            ],
          },
          goto_outcome_key: "operating_model_active",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en organización.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "operating_model_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "operating_model_active",
      label: "Modelo operativo activo",
      classification: "agency_standard",
      explanation:
        "La designación, el reporte, el involucramiento, el acceso, el mapa de funciones y la cadencia quedaron verificados.",
      provenance: "agency_standard",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "dpo.operating_model_status", value: "active" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Planificar el trabajo anual con el modelo como insumo",
          activity_key: "dpo.annual_plan",
        },
        {
          kind: "info",
          label: "Conservar el modelo operativo",
          note: "Archiva la carta o marco operativo, la matriz de funciones, las reglas de involucramiento, los canales de acceso y la cadencia de seguimiento.",
        },
      ],
    },
    {
      outcome_key: "operating_model_in_progress",
      label: "Modelo en organización",
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
      outcome_key: "prerequisite_missing",
      label: "DPO aún no designado",
      classification: "agency_standard",
      explanation:
        "Sin DPO designado no hay modelo operativo que establecer.",
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
