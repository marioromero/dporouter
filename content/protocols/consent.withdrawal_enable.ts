import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.06.
 *
 * activity_key = consent.withdrawal_enable (procedure, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia y effects del contenido canónico
 * D3.06. Diseña y habilita el retiro con efecto hacia futuro; nunca
 * registra revocaciones individuales ni afirma retroactividad
 * (frontera Stage 1).
 *
 * Bridge operativo/read-only idéntico a D3.03: compuerta sobre
 * `lawful.consent_applies = consent_yes` de D2.05, sin materializar
 * `purpose.lawful_basis`, sin modificar D2.05.
 * `reasoning_record_required = false`.
 */

const BRIDGE_FACT = "lawful.consent_applies";

const CHECKS = [
  "consent.withdrawal.anytime",
  "consent.withdrawal.no_cause",
  "consent.withdrawal.equivalent_means",
  "consent.withdrawal.expeditious",
  "consent.withdrawal.reliable",
  "consent.withdrawal.gratuitous",
  "consent.withdrawal.permanent",
  "consent.withdrawal.future_effect",
  "consent.withdrawal.public_coherence",
];

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function verifyOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "El punto fue verificado con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "El punto aún no está cubierto en el diseño.",
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

export const CONSENT_WITHDRAWAL_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "consent.withdrawal_enable.v1",
  activity_key: "consent.withdrawal_enable",
  version: 1,
  mode: "procedure",
  execution_scope: "purpose",
  title: "Habilitación guiada del retiro del consentimiento",
  description:
    "Diseña y habilita el retiro del consentimiento para la finalidad activa: en cualquier momento, sin causa, por medios equivalentes, expeditos, fidedignos, gratuitos y disponibles, con efecto hacia futuro y coherencia pública.",
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
          goto_node_key: "check-anytime",
          explanation:
            "D2.05 determinó consentimiento para esta finalidad: procede la habilitación del retiro.",
        },
        {
          rule_id: "fallback-route",
          description: "Sin ruta de consentimiento no inicia la habilitación.",
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
      node_key: "check-anytime",
      node_type: "question",
      title: "Retiro en cualquier momento",
      prompt:
        "¿El diseño permite retirar el consentimiento en cualquier momento?",
      why_it_matters:
        "Sin retiro oportuno el mecanismo incumple la condición temporal.",
      fact_key: "consent.withdrawal.anytime",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.anytime"),
      evidence_to_review: ["flujo de retiro", "formulario o canal"],
      evidence_review_help: [
        {
          evidence_item: "flujo de retiro",
          review_guide:
            "Comprobar en la secuencia prevista cuándo y cómo puede el titular solicitar la revocación, identificando restricciones asociadas a fechas, períodos contractuales o etapas del servicio. Revisar que la decisión pueda comunicarse mientras el consentimiento sustente el tratamiento, sin exigir esperar renovaciones, vencimientos o momentos establecidos arbitrariamente.",
          no_evidence_guidance:
            "Consultar diagramas, procedimientos y antecedentes del proceso para reconstruir en qué circunstancias se admite la solicitud de retiro. Si existen etapas sin definir o no puede establecerse cuándo está disponible la facultad, identificar las verificaciones pendientes sin presumir que un flujo documentado permite ejercerla en cualquier momento.",
          expected_result:
            "Un flujo que permita ejercer la revocación sin restricciones temporales injustificadas, con las condiciones de solicitud y posibles obstáculos identificables. Los aspectos no comprobados deben quedar reconocidos, sin considerar que la descripción del recorrido demuestra disponibilidad permanente del medio ni aplicación efectiva del retiro.",
        },
        {
          evidence_item: "formulario o canal",
          review_guide:
            "Verificar que el medio ofrecido permita iniciar el retiro sin depender de campañas, fechas de renovación u otras habilitaciones temporales arbitrarias. Revisar las condiciones de acceso y los mensajes presentados al titular, distinguiendo la posibilidad de comunicar la decisión de los tiempos posteriores de tramitación.",
          no_evidence_guidance:
            "Revisar formularios, configuraciones y antecedentes del canal para determinar si existen restricciones temporales al inicio de la solicitud. Cuando no se disponga de pruebas suficientes, identificar las comprobaciones pendientes sin dar por acreditada la posibilidad de retiro continuo por la sola existencia de un enlace o formulario.",
          expected_result:
            "Un canal cuya configuración permita iniciar la revocación cuando el titular lo decida, sin períodos de espera impuestos injustificadamente. Las restricciones, fallos o incertidumbres deben quedar identificados, sin atribuir disponibilidad técnica permanente ni ejecución inmediata del efecto operacional por esta sola revisión.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-no-cause",
      provenance: "agency_standard",
    },
    {
      node_key: "check-no-cause",
      node_type: "question",
      title: "Sin expresión de causa",
      prompt:
        "¿El retiro opera sin necesidad de expresar causa?",
      why_it_matters:
        "Exigir causa condiciona indebidamente el retiro.",
      fact_key: "consent.withdrawal.no_cause",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.no_cause"),
      evidence_to_review: ["flujo de retiro", "procedimiento"],
      evidence_review_help: [
        {
          evidence_item: "flujo de retiro",
          review_guide:
            "Comprobar que el recorrido permita solicitar la revocación sin explicar los motivos, revisando formularios, decisiones intermedias y condiciones para avanzar. Identificar campos obligatorios, solicitudes de justificación o aprobaciones basadas en razones que puedan impedir o condicionar el retiro, distinguiéndolos de comprobaciones razonables de identidad.",
          no_evidence_guidance:
            "Consultar diagramas, prototipos y antecedentes del mecanismo para reconstruir los pasos exigidos al titular. Si no puede determinarse si existen campos o condiciones relacionados con la causa, identificar las comprobaciones pendientes sin suponer que un formulario sin motivos visibles garantiza la ausencia de exigencias posteriores.",
          expected_result:
            "Un recorrido en el que el titular pueda comunicar su decisión sin declarar ni acreditar razones, con eventuales condiciones indebidas identificadas. Las etapas no verificadas deben quedar reconocidas, sin equiparar la mera presentación del formulario con una revocación efectivamente tramitada.",
        },
        {
          evidence_item: "procedimiento",
          review_guide:
            "Verificar que las instrucciones internas permitan tramitar el retiro sin solicitar explicaciones ni someter su aceptación a una valoración de los motivos del titular. Examinar las reglas de atención, validación y derivación, diferenciando comprobaciones necesarias para gestionar la solicitud de exigencias injustificadas de fundamentación.",
          no_evidence_guidance:
            "Recabar instrucciones operativas y consultar a los responsables de tramitar revocaciones para identificar cómo se gestionarán las solicitudes que no expresen causa. Si faltan reglas o existen criterios contradictorios, señalar las definiciones pendientes sin presumir que la práctica interna respeta lo indicado en el canal público.",
          expected_result:
            "Un procedimiento que contemple la gestión del retiro sin exigir ni evaluar motivos, con responsabilidades y condiciones de tramitación identificables. Las restricciones, contradicciones o prácticas no comprobadas deben quedar documentadas, sin considerar suficiente una declaración general de cumplimiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-means",
      provenance: "agency_standard",
    },
    {
      node_key: "check-means",
      node_type: "question",
      title: "Medios equivalentes",
      prompt:
        "¿El retiro se ofrece por medios similares o equivalentes a los utilizados para otorgar el consentimiento?",
      why_it_matters:
        "Sin equivalencia de medios el retiro queda dificultado respecto del otorgamiento.",
      fact_key: "consent.withdrawal.equivalent_means",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.equivalent_means"),
      evidence_to_review: ["formulario o canal", "capturas"],
      evidence_review_help: [
        {
          evidence_item: "formulario o canal",
          review_guide:
            "Comparar los medios disponibles para otorgar y retirar el consentimiento, examinando sus modalidades de acceso, pasos requeridos y condiciones de utilización. Verificar que el retiro pueda ejercerse por un medio similar o funcionalmente equivalente, sin imponer desplazamientos, trámites o requisitos adicionales que dificulten injustificadamente una autorización obtenida por una vía más sencilla.",
          no_evidence_guidance:
            "Recabar antecedentes de los canales de otorgamiento y revocación para identificar sus características y diferencias relevantes. Si no puede reconstruirse alguno de los recorridos o justificar su equivalencia, señalar las comprobaciones pendientes sin presumir conformidad por la mera existencia de un medio de contacto.",
          expected_result:
            "Una comparación sustentada de ambos medios que permita determinar si la revocación dispone de una vía similar o funcionalmente equivalente a la utilizada para consentir. Las cargas adicionales, diferencias no justificadas e incertidumbres deben quedar identificadas, sin exigir identidad tecnológica entre canales.",
        },
        {
          evidence_item: "capturas",
          review_guide:
            "Contrastar muestras visuales de las interfaces o materiales utilizados para otorgar y retirar el consentimiento, examinando cómo se presentan las opciones y qué pasos debe seguir el titular. Identificar diferencias de acceso, visibilidad o recorrido que puedan revelar obstáculos para la revocación, sin inferir equivalencia funcional únicamente por una apariencia similar.",
          no_evidence_guidance:
            "Solicitar muestras representativas de ambos recorridos o materiales equivalentes cuando los canales no sean visuales, identificando su versión y alcance. Si solo existen imágenes de uno de los medios o prototipos incompletos, señalar las comparaciones pendientes sin atribuir funcionamiento efectivo a una representación estática.",
          expected_result:
            "Antecedentes comparables sobre la presentación y el recorrido de otorgamiento y retiro, que permitan reconocer coincidencias y obstáculos relevantes para la equivalencia. Las limitaciones de las muestras deben quedar explícitas, sin considerar que una captura acredita por sí sola el funcionamiento de los canales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-expeditious",
      provenance: "agency_standard",
    },
    {
      node_key: "check-expeditious",
      node_type: "question",
      title: "Medios expeditos",
      prompt: "¿Los medios de retiro son expeditos?",
      why_it_matters:
        "Sin expedición el retiro se dilata y pierde efectividad.",
      fact_key: "consent.withdrawal.expeditious",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.expeditious"),
      evidence_to_review: ["prueba funcional del canal"],
      evidence_review_help: [
        {
          evidence_item: "prueba funcional del canal",
          review_guide:
            "Comprobar mediante un recorrido funcional que el titular pueda comunicar el retiro sin pasos innecesarios, esperas injustificadas ni obstáculos que dificulten completar la solicitud. Examinar el comportamiento del canal ante sus condiciones habituales de uso, diferenciando las gestiones necesarias para tramitar la revocación de cargas que retrasen indebidamente su ejercicio.",
          no_evidence_guidance:
            "Solicitar una demostración controlada o consultar resultados de pruebas existentes que permitan examinar los pasos y tiempos observados para comunicar la decisión. Si el canal no puede probarse o solo está descrito, identificar las comprobaciones pendientes sin considerar acreditada su expedición por la simplicidad aparente del diseño.",
          expected_result:
            "Una comprobación funcional documentada del recorrido de retiro, con pasos, dificultades y demoras relevantes identificables para valorar su expedición. Los obstáculos o aspectos no verificados deben quedar reconocidos, sin imponer umbrales temporales universales ni considerar una prueba puntual garantía de funcionamiento futuro.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-reliable",
      provenance: "agency_standard",
    },
    {
      node_key: "check-reliable",
      node_type: "question",
      title: "Medios fidedignos",
      prompt: "¿Los medios de retiro son fidedignos?",
      why_it_matters:
        "Sin fidedignidad no hay certeza de que el retiro quede registrado.",
      fact_key: "consent.withdrawal.reliable",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.reliable"),
      evidence_to_review: ["prueba funcional del canal", "procedimiento"],
      evidence_review_help: [
        {
          evidence_item: "prueba funcional del canal",
          review_guide:
            "Comprobar mediante una solicitud de prueba que el canal reciba la manifestación de retiro y permita reconocer su contenido y alcance sin pérdidas ni alteraciones relevantes. Revisar los resultados observables de la recepción, incluyendo posibles fallos, duplicaciones o interrupciones, sin confundir una confirmación visual con la recepción efectivamente comprobada.",
          no_evidence_guidance:
            "Solicitar una demostración controlada o consultar resultados de pruebas existentes que permitan verificar la recepción fiable de solicitudes. Si no puede comprobarse el comportamiento del canal, identificar las verificaciones pendientes sin presumir fidedignidad por la presencia de mensajes de confirmación o funcionalidades únicamente descritas.",
          expected_result:
            "Resultados funcionales revisables que permitan determinar si el canal recibe y reconoce correctamente las solicitudes de retiro de prueba, con errores, inconsistencias y limitaciones identificables. La comprobación debe sustentar su fiabilidad sin afirmar que todas las solicitudes futuras serán recibidas ni atribuir revocaciones individuales reales.",
        },
        {
          evidence_item: "procedimiento",
          review_guide:
            "Verificar que las reglas operacionales permitan reconocer, encaminar y gestionar las solicitudes recibidas conservando la correspondencia con la decisión y finalidad afectada. Examinar responsabilidades, controles ante errores y tratamiento de solicitudes incompletas o duplicadas, distinguiendo la fiabilidad de la tramitación de la ejecución posterior de sus efectos.",
          no_evidence_guidance:
            "Consultar instrucciones internas y responsables del proceso para determinar cómo se identifican las solicitudes, se derivan y se gestionan posibles errores de recepción. Cuando falten reglas o existan contradicciones, señalar las definiciones pendientes sin inventar controles implementados ni asumir que una recepción técnicamente exitosa garantiza la gestión interna.",
          expected_result:
            "Un procedimiento verificable para gestionar de manera fiable las solicitudes de retiro, con responsabilidades, mecanismos de seguimiento apropiados y tratamiento de incidencias identificables. Las brechas e incertidumbres deben quedar reconocidas, sin considerar que el procedimiento acredita por sí solo la aplicación del retiro al tratamiento futuro.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-gratuity",
      provenance: "agency_standard",
    },
    {
      node_key: "check-gratuity",
      node_type: "question",
      title: "Gratuidad",
      prompt: "¿El retiro es gratuito?",
      why_it_matters:
        "Cobrar por retirar condiciona indebidamente el derecho.",
      fact_key: "consent.withdrawal.gratuitous",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.gratuitous"),
      evidence_to_review: ["formulario o canal"],
      evidence_review_help: [
        {
          evidence_item: "formulario o canal",
          review_guide:
            "Comprobar que el medio de retiro pueda utilizarse sin tarifas, pagos previos, suscripciones adicionales ni funcionalidades reservadas a usuarios de pago. Revisar las condiciones de acceso y las instrucciones asociadas para identificar costos impuestos por el responsable o terceros vinculados al mecanismo, distinguiéndolos de gastos ordinarios no exigidos como contraprestación para revocar.",
          no_evidence_guidance:
            "Consultar las condiciones del canal, configuraciones de acceso y antecedentes comerciales u operacionales para determinar si la revocación exige algún desembolso. Si no puede verificarse la ausencia de cobros o existen rutas de acceso poco claras, señalar las comprobaciones pendientes sin presumir gratuidad por la falta de una tarifa visible.",
          expected_result:
            "Un medio de revocación cuya utilización no esté condicionada a pagos ni contrataciones adicionales, con eventuales costos y restricciones identificados y evaluados. Las incertidumbres deben quedar reconocidas, sin confundir la gratuidad del retiro con la gratuidad del servicio original o de los medios propios del titular.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-permanent",
      provenance: "agency_standard",
    },
    {
      node_key: "check-permanent",
      node_type: "question",
      title: "Disponibilidad permanente",
      prompt: "¿El mecanismo de retiro está permanentemente disponible?",
      why_it_matters:
        "Sin disponibilidad permanente el derecho queda intermitente.",
      fact_key: "consent.withdrawal.permanent",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.permanent"),
      evidence_to_review: [
        "evidencia de disponibilidad del mecanismo",
        "capturas",
      ],
      evidence_review_help: [
        {
          evidence_item: "evidencia de disponibilidad del mecanismo",
          review_guide:
            "Examinar los antecedentes que permitan comprobar la continuidad del medio de retiro, incluyendo condiciones de acceso, interrupciones conocidas y medidas previstas para mantener la posibilidad de presentar solicitudes. Contrastar las declaraciones de disponibilidad con pruebas, registros operacionales o procedimientos aplicables al canal, distinguiendo observaciones puntuales de respaldo sobre su funcionamiento sostenido.",
          no_evidence_guidance:
            "Recabar información de los responsables del canal sobre horarios, continuidad, incidencias y mecanismos alternativos o de contingencia cuando existan. Si no es posible acreditar la disponibilidad sostenida o faltan verificaciones relevantes, identificar las incertidumbres sin presumir cumplimiento por una prueba aislada ni atribuir interrupciones no documentadas.",
          expected_result:
            "Antecedentes revisables que permitan valorar si el titular dispone de un medio de revocación permanentemente accesible, con condiciones de continuidad y eventuales limitaciones identificadas. Las brechas o comprobaciones pendientes deben quedar reconocidas, sin imponer porcentajes de disponibilidad ni garantías técnicas absolutas.",
        },
        {
          evidence_item: "capturas",
          review_guide:
            "Revisar muestras de la interfaz, formulario o material de acceso para identificar cómo se ofrece el medio de retiro y si aparecen restricciones horarias, períodos de habilitación o mensajes de indisponibilidad. Contrastar lo observado con los antecedentes operacionales, sin considerar que una pantalla accesible en un momento determinado demuestra continuidad permanente.",
          no_evidence_guidance:
            "Solicitar muestras representativas del acceso al mecanismo, incluidas las condiciones comunicadas al titular, o antecedentes equivalentes cuando el canal no sea visual. Si las imágenes están desactualizadas, son parciales o no permiten establecer las condiciones de disponibilidad, señalar las comprobaciones pendientes sin inventar estados operativos.",
          expected_result:
            "Muestras revisables de la presentación y acceso al canal que permitan identificar restricciones visibles y contrastarlas con la disponibilidad declarada. Sus limitaciones temporales y funcionales deben quedar explícitas, sin atribuir a capturas estáticas la capacidad de probar funcionamiento permanente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-future",
      provenance: "agency_standard",
    },
    {
      node_key: "check-future",
      node_type: "question",
      title: "Efecto hacia futuro",
      prompt:
        "¿Existe ruta operacional para que el retiro deje de sustentar en ese consentimiento el tratamiento futuro, sin afirmar retroactividad?",
      why_it_matters:
        "Sin ruta operacional el retiro no produce efecto; afirmar retroactividad excede el canon.",
      fact_key: "consent.withdrawal.future_effect",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.future_effect"),
      evidence_to_review: [
        "procedimiento",
        "integración funcional prevista",
      ],
      evidence_review_help: [
        {
          evidence_item: "procedimiento",
          review_guide:
            "Comprobar que las instrucciones operacionales definan cómo se identifica la autorización retirada, qué tratamientos futuros dependían de ella y quién debe aplicar la revocación. Revisar las etapas de recepción, derivación, ejecución y comprobación del efecto, distinguiendo las operaciones posteriores que ya no pueden sustentarse en ese consentimiento de los tratamientos anteriores lícitamente realizados.",
          no_evidence_guidance:
            "Recabar instrucciones y antecedentes de las áreas responsables para reconstruir cómo se aplicará la revocación a la finalidad correspondiente. Si faltan responsables, decisiones o pasos de ejecución, identificar las definiciones pendientes sin presumir que recibir una solicitud produce por sí solo el efecto operacional ni afirmar consecuencias retroactivas.",
          expected_result:
            "Un procedimiento con responsabilidades y pasos verificables para dejar de sustentar en el consentimiento retirado los tratamientos futuros pertinentes, preservando la distinción respecto de operaciones anteriores. Las brechas y cuestiones pendientes deben quedar identificadas, sin equiparar revocación con supresión automática de todos los datos.",
        },
        {
          evidence_item: "integración funcional prevista",
          review_guide:
            "Verificar cómo la revocación recibida llegará a los sistemas y procesos que ejecutan tratamientos dependientes del consentimiento, identificando las conexiones, actualizaciones o instrucciones necesarias para aplicar su efecto futuro. Contrastar el diseño con las rutas operacionales relevantes y sus responsables, diferenciando integraciones documentadas, implementadas y comprobadas.",
          no_evidence_guidance:
            "Consultar diagramas de integración, especificaciones y responsables técnicos para determinar cómo se transmitirá y aplicará la decisión en los sistemas involucrados. Si existen procesos sin conexión definida o funcionalidades no demostradas, señalar las comprobaciones pendientes sin inventar sincronizaciones, bloqueos ni integraciones operativas.",
          expected_result:
            "Una ruta funcional trazable que permita identificar cómo los procesos pertinentes recibirán y aplicarán la revocación para no seguir sustentando tratamientos futuros en el consentimiento retirado. Las dependencias, fallos potenciales e incertidumbres deben quedar reconocidos, sin presentar integraciones previstas como ejecución efectivamente comprobada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-coherence",
      provenance: "agency_standard",
    },
    {
      node_key: "check-coherence",
      node_type: "question",
      title: "Coherencia pública",
      prompt:
        "¿El retiro es coherente con la información pública entregada al titular sobre este derecho?",
      why_it_matters:
        "Sin coherencia pública el titular recibe mensajes contradictorios.",
      fact_key: "consent.withdrawal.public_coherence",
      answer_type: "yes_no_unknown",
      options: verifyOptions("consent.withdrawal.public_coherence"),
      evidence_to_review: ["capturas", "procedimiento"],
      evidence_review_help: [
        {
          evidence_item: "capturas",
          review_guide:
            "Contrastar las muestras de avisos, políticas, formularios y canales públicos con las condiciones del retiro ofrecidas al titular, revisando la información sobre su ejercicio en cualquier momento y la ausencia de efectos retroactivos. Identificar instrucciones, enlaces o mensajes contradictorios respecto del mecanismo previsto, distinguiendo lo efectivamente publicado de prototipos o textos pendientes.",
          no_evidence_guidance:
            "Recabar muestras vigentes de la información pública y de los medios mediante los cuales se comunica el retiro, consultando las versiones aplicables a la finalidad. Si faltan materiales o no puede determinarse qué información se encuentra disponible para el titular, señalar las comprobaciones pendientes sin inventar mensajes publicados ni presumir coherencia por la existencia de una política general.",
          expected_result:
            "Materiales públicos revisables que permitan comprobar la correspondencia entre el derecho informado, los medios indicados y las condiciones reales de retiro. Las contradicciones, versiones desactualizadas o limitaciones de las muestras deben quedar identificadas, sin considerar que una captura acredita por sí sola el funcionamiento del procedimiento.",
        },
        {
          evidence_item: "procedimiento",
          review_guide:
            "Verificar que las instrucciones internas y la ruta operacional sean compatibles con lo comunicado públicamente sobre cómo ejercer el retiro y sus efectos futuros. Contrastar los canales, requisitos y actuaciones previstos con las indicaciones entregadas al titular, identificando diferencias que puedan impedir el ejercicio del derecho o generar expectativas incorrectas sobre la revocación.",
          no_evidence_guidance:
            "Consultar las instrucciones operativas y a los responsables del retiro para reconstruir cómo se gestionarán las solicitudes anunciadas al público. Cuando falten reglas o existan discrepancias con los avisos publicados, identificar las definiciones y correcciones pendientes sin asumir que una declaración pública garantiza la ejecución del procedimiento.",
          expected_result:
            "Un procedimiento contrastado con la información pública, cuya ruta, condiciones y efectos previstos sean coherentes con lo comunicado al titular. Las discrepancias y aspectos no verificados deben quedar reconocidos, sin atribuir retroactividad al retiro ni considerar la concordancia documental prueba automática de funcionamiento efectivo.",
        },
      ],
      required_facts: [],
      default_next_node_key: "synthesis",
      related_activity_keys: ["transparency.policy_assemble"],
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la habilitación",
      prompt:
        "El sistema verifica si el retiro quedó habilitado bajo las condiciones legales.",
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
            "Sin ruta de consentimiento vigente no hay retiro que habilitar.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos una condición del retiro está pendiente.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen condiciones del retiro por habilitar antes de declarar su cierre.",
        },
        {
          rule_id: "missing-info",
          description:
            "Alguna condición está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan condiciones por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "withdrawal-ok",
          description: "Retiro habilitado bajo las condiciones legales.",
          when: {
            op: "all",
            conditions: [
              ...CHECKS.map((f) => ({
                op: "fact_equals" as const,
                fact_key: f,
                value: "yes",
              })),
            ],
          },
          goto_outcome_key: "withdrawal_enabled",
          explanation:
            "El retiro opera en cualquier momento, sin causa, por medios equivalentes, expeditos, fidedignos, gratuitos y disponibles, con efecto hacia futuro.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La habilitación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "withdrawal_enabled",
      label: "Retiro habilitado",
      classification: "agency_standard",
      explanation:
        "El mecanismo permite retirar el consentimiento bajo las condiciones legales, con efecto hacia futuro. Esto habilita el retiro, no registra revocaciones individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.withdrawal_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Continuar el diseño en D3.03",
          activity_key: "consent.mechanism_design",
        },
        {
          kind: "info",
          label: "Conservar el procedimiento",
          note: "Archiva el flujo de retiro con formulario o canal, capturas, procedimiento e integración funcional prevista.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere habilitar el retiro",
      classification: "agency_standard",
      explanation:
        "Al menos una condición del retiro está pendiente de habilitación.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "consent.withdrawal_status", value: "remediation_required" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Habilitar las condiciones pendientes",
          note: "Atiende cada condición pendiente y vuelve a verificar el retiro.",
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
        "Existen condiciones pendientes o con información insuficiente.",
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
