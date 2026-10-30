import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D5.02.
 *
 * activity_key = sensitive.health_biological_assess (decision,
 * purpose scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente condiciones, rutas, prohibiciones, evidencia y
 * state effect del contenido canónico D5.02. Sin scoring ni
 * deducción automática y sin dependency rígida hacia D5.01: el art.
 * 16 bis contiene rutas propias.
 *
 * Cautelas preservadas:
 * - consentimiento expreso art. 16 NO basta por sí solo: exige ley
 *   especial sanitaria + finalidad prevista + correspondencia;
 * - prohibición especial sobre muestras/material biológico de siete
 *   ámbitos: solo cede ante ley expresa referida a casos del propio
 *   art. 16 bis; si aplica sin habilitación, supported bloqueado;
 * - condiciones propias (información posterior, anonimización de
 *   publicaciones) sin dependency a D5.05.
 */

const CANDIDATE = "derived.purpose.d5_health_biological_candidate";
const ITEMS = "health02.items_reviewed";
const READY = "health02.analysis_ready";
const ROUTE = "health02.route_main";
const DRAFT = "health02.working_conclusion";

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function consideredOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Analizada con respaldo",
      description: "La hipótesis fue analizada con respaldo revisable (aplica o descartada fundadamente).",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No analizada",
      description: "La hipótesis aún no ha sido analizada.",
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

function verifiedOptions(factKey: string, verifiedLabel: string) {
  return [
    {
      value: "yes",
      label: "Verificado con respaldo",
      description: verifiedLabel,
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente de verificar",
      description: "Aún no se verifica con respaldo revisable.",
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

export const SENSITIVE_HEALTH_BIOLOGICAL_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "sensitive.health_biological_assess.v1",
  activity_key: "sensitive.health_biological_assess",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada del régimen de salud y perfil biológico",
  description:
    "Estructura el análisis del art. 16 bis para la finalidad activa: distingue la vía con consentimiento (que exige ley sanitaria especial) de las hipótesis sin consentimiento, verifica la prohibición especial sobre muestras y documenta la conclusión profesional.",
  entry_node_key: "structural-gate",
  decision_fact_keys: [CANDIDATE, ITEMS, READY],
  external_fact_keys: [CANDIDATE],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Candidatura estructural",
      prompt:
        "El sistema verifica si la captura estructural actual identifica esta finalidad como candidata al régimen de salud y perfil biológico.",
      answer_type: "none",
      required_facts: [CANDIDATE],
      transitions: [
        {
          rule_id: "candidate-yes",
          description: "La finalidad es candidata a revisión del régimen especial.",
          when: isYes(CANDIDATE),
          goto_node_key: "items-review",
          explanation:
            "Al menos un dato vinculado está clasificado como salud o perfil biológico: corresponde el análisis del art. 16 bis.",
        },
        {
          rule_id: "candidate-no",
          description: "La captura estructural no identifica el régimen especial.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "Todos los datos vinculados están clasificados explícitamente fuera de salud y perfil biológico.",
        },
        {
          rule_id: "fallback-classification",
          description: "Sin clasificación suficiente no inicia el análisis.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "classification_incomplete",
          explanation:
            "Completa la clasificación estructural de los datos vinculados para saber si esta revisión corresponde.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "items-review",
      node_type: "question",
      title: "Datos vinculados revisados",
      prompt:
        "¿Se revisaron los datos actualmente vinculados a la finalidad y su clasificación de salud o perfil biológico?",
      why_it_matters:
        "La conclusión debe cubrir el universo actual de datos vinculados.",
      fact_key: ITEMS,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        ITEMS,
        "Los datos vinculados y su clasificación fueron revisados.",
      ),
      evidence_to_review: [
        "descripción de datos y categoría",
        "finalidad",
        "mapeo dato-finalidad disponible",
      ],
      evidence_review_help: [
        {
          evidence_item: "descripción de datos y categoría",
          review_guide: "La descripción debe permitir distinguir datos relativos a la salud de aquellos vinculados al perfil biológico humano, como información genética, proteómica o metabólica. La clasificación debe reflejar la naturaleza del dato y su utilización en la finalidad, sin incorporar información clínica individual.",
          no_evidence_guidance: "Cuando la categoría no pueda determinarse, corresponde aclarar qué información se trata y cuál es su significado en el proceso. La clasificación debe permanecer pendiente si los antecedentes no permiten fundamentarla.",
          expected_result: "Categorías de datos de salud o perfil biológico identificadas y clasificadas con fundamento suficiente para evaluar el régimen del artículo 16 bis.",
        },
        {
          evidence_item: "finalidad",
          review_guide: "La finalidad debe describir concretamente para qué se utilizan los datos y permitir contrastar ese uso con la vía jurídica examinada. Una referencia general a salud o investigación no demuestra por sí sola que se cumplan las condiciones especiales.",
          no_evidence_guidance: "Si la finalidad es ambigua, resulta necesario aclarar el uso efectivo antes de valorar su licitud. No deben atribuirse al tratamiento fines sanitarios o científicos que no estén suficientemente documentados.",
          expected_result: "Una finalidad específica y verificable que permita determinar qué condiciones del artículo 16 bis corresponde examinar.",
        },
        {
          evidence_item: "mapeo dato-finalidad disponible",
          review_guide: "El mapeo debe mostrar qué categorías de datos de salud o perfil biológico están vinculadas a la finalidad activa. La revisión comprende la cobertura de los datos relevantes y la detección de categorías omitidas o relaciones no justificadas.",
          no_evidence_guidance: "Ante un mapeo parcial, las categorías pendientes pueden contrastarse con la descripción del tratamiento y sus operaciones. La falta de cobertura suficiente debe quedar identificada antes de concluir.",
          expected_result: "Una relación verificable entre finalidad y categorías de datos, con cobertura suficiente para sustentar la evaluación jurídica del régimen especial.",
        },
      ],
      required_facts: [],
      default_next_node_key: "route-select",
      provenance: "agency_standard",
    },
    {
      node_key: "route-select",
      node_type: "question",
      title: "Ruta principal analizada",
      prompt:
        "¿Cuál es la ruta principal del art. 16 bis analizada para esta finalidad?",
      why_it_matters:
        "Cada ruta tiene condiciones propias; registrar la analizada ordena la evidencia del razonamiento.",
      fact_key: ROUTE,
      answer_type: "single_select",
      options: [
        {
          value: "consent_route",
          label: "Consentimiento + ley sanitaria",
          description: "Consentimiento expreso art. 16 para fines de una ley especial sanitaria.",
          fact_effect: { fact_key: ROUTE, value: "consent_route" },
        },
        {
          value: "vital_route",
          label: "Vida o integridad",
          description: "Necesidad indispensable para salvaguardar vida o integridad, con o sin impedimento para consentir.",
          fact_effect: { fact_key: ROUTE, value: "vital_route" },
        },
        {
          value: "alert_route",
          label: "Alerta sanitaria",
          description: "Alerta sanitaria legalmente decretada.",
          fact_effect: { fact_key: ROUTE, value: "alert_route" },
        },
        {
          value: "research_route",
          label: "Fines históricos, científicos o investigación",
          description: "Fines históricos, estadísticos o científicos, estudios o investigaciones de interés público o beneficio de salud, o desarrollo médico.",
          fact_effect: { fact_key: ROUTE, value: "research_route" },
        },
        {
          value: "claims_route",
          label: "Derechos ante tribunal u órgano",
          description: "Formulación, ejercicio o defensa de un derecho ante tribunal u órgano administrativo.",
          fact_effect: { fact_key: ROUTE, value: "claims_route" },
        },
        {
          value: "medicine_route",
          label: "Medicina y gestión sanitaria",
          description: "Medicina preventiva o laboral, capacidad laboral, diagnóstico, asistencia o gestión sanitaria o social.",
          fact_effect: { fact_key: ROUTE, value: "medicine_route" },
        },
        {
          value: "legal_auth_route",
          label: "Autorización legal expresa",
          description: "Autorización legal que indica expresamente la finalidad.",
          fact_effect: { fact_key: ROUTE, value: "legal_auth_route" },
        },
        {
          value: "none_identified",
          label: "Ninguna identificada",
          description: "Aún no se identifica una vía aplicable.",
          fact_effect: { fact_key: ROUTE, value: "none_identified" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: ROUTE, value: "unknown" },
        },
      ],
      evidence_to_review: ["fundamento de la vía invocada"],
      evidence_review_help: [
        {
          evidence_item: "fundamento de la vía invocada",
          review_guide: "El fundamento debe vincular los hechos del tratamiento con una hipótesis concreta del artículo 16 bis. Interesa distinguir la vía con consentimiento y ley sanitaria de las excepciones sin consentimiento, pues sus requisitos no son intercambiables.",
          no_evidence_guidance: "Sin una vía identificable, la evaluación no puede presumir habilitado el tratamiento. Es posible examinar alternativas, manteniendo pendientes aquellas cuyos requisitos aún no puedan comprobarse.",
          expected_result: "Una ruta jurídica principal identificada y sustentada en antecedentes que permitan analizar sus condiciones particulares.",
        },
      ],
      required_facts: [],
      default_next_node_key: "consent-express",
      provenance: "legal_requirement",
    },
    {
      node_key: "consent-express",
      node_type: "question",
      title: "Consentimiento expreso art. 16",
      prompt:
        "¿Se verificó consentimiento expreso conforme al art. 16 para estos datos?",
      why_it_matters:
        "Sin consentimiento expreso verificado no existe vía por consentimiento; y aun verificado, no basta por sí solo.",
      fact_key: "health02.consent_express",
      answer_type: "yes_no_unknown",
      options: consideredOptions("health02.consent_express"),
      evidence_to_review: ["consentimiento expreso cuando corresponda"],
      evidence_review_help: [
        {
          evidence_item: "consentimiento expreso cuando corresponda",
          review_guide: "El respaldo debe permitir establecer que el titular manifestó expresamente su consentimiento para el tratamiento y finalidad evaluados. Esta comprobación no sustituye la exigencia adicional de una finalidad prevista en una ley especial sanitaria.",
          no_evidence_guidance: "Si el consentimiento expreso no puede acreditarse, la vía por consentimiento permanece sin respaldo suficiente. Las alternativas sin consentimiento requieren su propio análisis y no resultan aplicables automáticamente.",
          expected_result: "Una evaluación documentada sobre la existencia de consentimiento expreso válido para la finalidad, diferenciada de la comprobación de la ley sanitaria especial.",
        },
      ],
      required_facts: [],
      default_next_node_key: "sanitary-law",
      provenance: "legal_requirement",
    },
    {
      node_key: "sanitary-law",
      node_type: "question",
      title: "Ley sanitaria y finalidad",
      prompt:
        "Si se analiza la vía por consentimiento: ¿se identificó la ley especial sanitaria aplicable, la finalidad autorizada por ella y su correspondencia con el tratamiento evaluado?",
      why_it_matters:
        "Con consentimiento expreso, salud y perfil biológico solo pueden tratarse para fines de leyes especiales sanitarias: el consentimiento solo no habilita cualquier finalidad.",
      fact_key: "health02.sanitary_law",
      answer_type: "yes_no_unknown",
      options: consideredOptions("health02.sanitary_law"),
      evidence_to_review: [
        "ley especial sanitaria y finalidad legal invocada",
      ],
      evidence_review_help: [
        {
          evidence_item: "ley especial sanitaria y finalidad legal invocada",
          review_guide: "La revisión debe identificar una ley especial en materia sanitaria, la finalidad prevista en ella y la correspondencia con el tratamiento concreto. La existencia de consentimiento expreso no autoriza finalidades distintas de las contempladas por ese marco legal.",
          no_evidence_guidance: "Cuando no se identifique una ley sanitaria aplicable o no pueda verificarse su finalidad, esta vía no debe darse por acreditada. La referencia genérica a normativa sanitaria resulta insuficiente.",
          expected_result: "Una ley especial sanitaria identificada y un análisis que vincule expresamente su finalidad con el tratamiento evaluado.",
        },
      ],
      help_text: [
        "No existe catálogo cerrado: la evidencia debe identificar la norma especial realmente invocada.",
      ],
      required_facts: [],
      default_next_node_key: "sanitary-law-ref",
      provenance: "legal_requirement",
    },
    {
      node_key: "sanitary-law-ref",
      node_type: "question",
      title: "Norma invocada",
      prompt: "Identifica la ley especial sanitaria invocada (cita breve).",
      why_it_matters:
        "La conclusión por consentimiento exige norma identificable, no una referencia genérica.",
      fact_key: "health02.sanitary_law_ref",
      answer_type: "text",
      evidence_to_review: ["ley especial sanitaria invocada"],
      evidence_review_help: [
        {
          evidence_item: "ley especial sanitaria invocada",
          review_guide: "La referencia debe identificar suficientemente la norma y la disposición pertinente para su comprobación, preferentemente mediante su texto oficial en Ley Chile. No basta una mención general a legislación sanitaria o a políticas internas.",
          no_evidence_guidance: "Si no se dispone de una referencia verificable, la identificación normativa queda pendiente. No debe incorporarse una ley por semejanza temática sin comprobar su aplicabilidad.",
          expected_result: "Una cita normativa concreta y trazable que permita comprobar la finalidad sanitaria invocada en el análisis.",
        },
      ],
      required_facts: [],
      default_next_node_key: "vital-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "vital-route",
      node_type: "question",
      title: "Vida o integridad",
      prompt:
        "¿Se analizó la necesidad indispensable para salvaguardar vida o integridad física o psíquica, incluyendo impedimento físico o jurídico para consentir?",
      why_it_matters:
        "Esta hipótesis cubre también el impedimento para consentir, con deber de información posterior.",
      fact_key: "health02.route_vital",
      answer_type: "yes_no_unknown",
      options: consideredOptions("health02.route_vital"),
      evidence_to_review: ["documentación clínica u operacional abstracta"],
      evidence_review_help: [
        {
          evidence_item: "documentación clínica u operacional abstracta",
          review_guide: "Los antecedentes deben justificar las circunstancias que hacen indispensable el tratamiento para proteger la vida o integridad física o psíquica, o el impedimento físico o jurídico del titular para consentir. La evaluación debe centrarse en la necesidad y el contexto, no en diagnósticos individuales.",
          no_evidence_guidance: "Si no puede justificarse la circunstancia invocada, la hipótesis permanece sin acreditar o debe descartarse fundadamente. No corresponde incorporar fichas clínicas ni antecedentes de pacientes reales para resolver la duda.",
          expected_result: "Una justificación abstracta y documentada que permita establecer la procedencia o el descarte de la hipótesis de protección vital o impedimento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "alert-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "alert-route",
      node_type: "question",
      title: "Alerta sanitaria",
      prompt:
        "¿Se analizó si existe una alerta sanitaria legalmente decretada que ampare el tratamiento?",
      why_it_matters:
        "Solo la alerta legalmente decretada habilita esta hipótesis.",
      fact_key: "health02.route_alert",
      answer_type: "yes_no_unknown",
      options: consideredOptions("health02.route_alert"),
      evidence_to_review: ["decreto de alerta sanitaria"],
      evidence_review_help: [
        {
          evidence_item: "decreto de alerta sanitaria",
          review_guide: "Debe comprobarse la existencia de una alerta sanitaria legalmente decretada y la relación del tratamiento con las circunstancias que la justifican. Resulta pertinente examinar el alcance y período aplicable del acto oficial, no solo la existencia de una situación de emergencia.",
          no_evidence_guidance: "Sin un decreto identificable y pertinente, esta excepción no puede darse por acreditada. Si existen dudas sobre vigencia o alcance, deben quedar pendientes hasta contrastarlas con el acto oficial.",
          expected_result: "Una alerta sanitaria legalmente decretada, identificada y materialmente vinculada al tratamiento evaluado.",
        },
      ],
      required_facts: [],
      default_next_node_key: "research-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "research-route",
      node_type: "question",
      title: "Fines históricos, científicos o investigación",
      prompt:
        "¿Se analizó la hipótesis de fines históricos, estadísticos o científicos, estudios o investigaciones de interés público o beneficio de salud, o desarrollo médico insustituible?",
      why_it_matters:
        "Esta hipótesis tiene condiciones propias de anonimización de publicaciones.",
      fact_key: "health02.route_research",
      answer_type: "yes_no_unknown",
      options: consideredOptions("health02.route_research"),
      evidence_to_review: ["fundamento de la investigación o desarrollo"],
      evidence_review_help: [
        {
          evidence_item: "fundamento de la investigación o desarrollo",
          review_guide: "El fundamento debe demostrar la correspondencia de la finalidad con los fines históricos, estadísticos o científicos, las investigaciones de interés público o beneficio para la salud humana, o el desarrollo médico contemplado en la norma. Cuando se invoque desarrollo de productos o insumos médicos, debe justificarse por qué no podrían desarrollarse de otra forma.",
          no_evidence_guidance: "Si la finalidad o sus condiciones especiales no están suficientemente justificadas, esta hipótesis no queda acreditada. Una actividad denominada investigación no demuestra automáticamente su encaje legal.",
          expected_result: "Una justificación documentada del fin específico invocado y de las condiciones que permiten considerar o descartar esta excepción.",
        },
      ],
      required_facts: [],
      default_next_node_key: "research-publishes",
      provenance: "legal_requirement",
    },
    {
      node_key: "research-publishes",
      node_type: "question",
      title: "Publicación de resultados",
      prompt: "¿Se publican o difunden resultados del tratamiento evaluado?",
      why_it_matters:
        "Solo si hay publicación aplica la exigencia de anonimización previa.",
      fact_key: "health02.research_publishes",
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        "health02.research_publishes",
        "Se determinó si existen publicaciones o difusión de resultados.",
      ),
      evidence_to_review: ["proceso de publicación cuando corresponda"],
      evidence_review_help: [
        {
          evidence_item: "proceso de publicación cuando corresponda",
          review_guide: "La evaluación debe determinar si los resultados del estudio o investigación se publican o difunden y qué información se incluye. Es importante distinguir los datos utilizados internamente de aquellos que efectivamente se harán públicos.",
          no_evidence_guidance: "Si no es posible establecer si habrá publicaciones o difusión de resultados, esa circunstancia debe quedar pendiente. No debe presumirse que la ausencia de publicaciones previstas acredita la anonimización.",
          expected_result: "Una determinación documentada sobre la existencia de publicaciones o difusión de resultados y el tipo de información que podrían contener.",
        },
      ],
      required_facts: [],
      default_next_node_key: "research-anonymized",
      provenance: "agency_standard",
    },
    {
      node_key: "research-anonymized",
      node_type: "question",
      title: "Anonimización previa",
      prompt:
        "Si se publican resultados: ¿se verificó la anonimización previa de los datos publicados?",
      why_it_matters:
        "Sin anonimización previa la publicación invalida la vía de investigación.",
      fact_key: "health02.research_anonymized",
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        "health02.research_anonymized",
        "Se verificó la anonimización previa de lo publicado.",
      ),
      evidence_to_review: ["diseño de anonimización"],
      evidence_review_help: [
        {
          evidence_item: "diseño de anonimización",
          review_guide: "El diseño debe demostrar que los datos publicados serán anonimizados antes de su difusión, evitando que puedan asociarse a personas identificadas o identificables. La seudonimización o la simple eliminación de nombres no equivalen necesariamente a anonimización.",
          no_evidence_guidance: "Si la anonimización previa no puede comprobarse, la condición exigida para publicar resultados permanece sin acreditar. Deben identificarse las medidas pendientes sin utilizar datos reales en Nexo DPO.",
          expected_result: "Un mecanismo verificable de anonimización previa de los datos publicados, adecuado para impedir su vinculación con titulares identificados o identificables.",
        },
      ],
      required_facts: [],
      default_next_node_key: "claims-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "claims-route",
      node_type: "question",
      title: "Derechos ante tribunal u órgano",
      prompt:
        "¿Se analizó la formulación, ejercicio o defensa de un derecho ante tribunal u órgano administrativo?",
      why_it_matters:
        "La vía exige vinculación con un derecho concreto en sede definida.",
      fact_key: "health02.route_claims",
      answer_type: "yes_no_unknown",
      options: consideredOptions("health02.route_claims"),
      evidence_to_review: ["fundamento judicial o administrativo"],
      evidence_review_help: [
        {
          evidence_item: "fundamento judicial o administrativo",
          review_guide: "La justificación debe establecer la necesidad del tratamiento para formular, ejercer o defender un derecho ante un tribunal u órgano administrativo. La mera existencia de un litigio o procedimiento no habilita el uso indiscriminado de datos de salud.",
          no_evidence_guidance: "Cuando la relación entre los datos y el derecho invocado no esté justificada, la hipótesis debe mantenerse sin acreditar o descartarse fundadamente. Los antecedentes pueden evaluarse sin incorporar expedientes individuales.",
          expected_result: "Un fundamento documentado que vincule la necesidad del tratamiento con la actuación judicial o administrativa correspondiente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "medicine-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "medicine-route",
      node_type: "question",
      title: "Medicina y gestión sanitaria",
      prompt:
        "¿Se analizó la hipótesis de medicina preventiva o laboral, capacidad laboral, diagnóstico, asistencia o gestión sanitaria o social?",
      why_it_matters:
        "Cada subhipótesis exige encaje en el marco asistencial o de gestión invocado.",
      fact_key: "health02.route_medicine",
      answer_type: "yes_no_unknown",
      options: consideredOptions("health02.route_medicine"),
      evidence_to_review: ["marco de medicina o asistencia"],
      evidence_review_help: [
        {
          evidence_item: "marco de medicina o asistencia",
          review_guide: "El análisis debe precisar si la finalidad corresponde a medicina preventiva o laboral, evaluación de capacidad laboral, diagnóstico, asistencia o tratamiento sanitario o social, o gestión de los sistemas y servicios contemplados en la ley. No basta una relación indirecta con el sector salud.",
          no_evidence_guidance: "Si el tratamiento no puede vincularse con una finalidad reconocida por esta hipótesis, su aplicación permanece sin acreditar. Deben diferenciarse las dudas pendientes de las actividades cuyo uso efectivo no encaja en la norma.",
          expected_result: "Una justificación que permita comprobar la correspondencia concreta entre la finalidad y la hipótesis de medicina o asistencia invocada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "legal-auth-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "legal-auth-route",
      node_type: "question",
      title: "Autorización legal expresa",
      prompt:
        "¿Se analizó si una autorización legal indica expresamente la finalidad del tratamiento?",
      why_it_matters:
        "Sin finalidad expresa en la norma esta vía no puede invocarse.",
      fact_key: "health02.route_legal_auth",
      answer_type: "yes_no_unknown",
      options: consideredOptions("health02.route_legal_auth"),
      evidence_to_review: ["norma habilitante"],
      evidence_review_help: [
        {
          evidence_item: "norma habilitante",
          review_guide: "La disposición legal debe permitir el tratamiento e indicar expresamente la finalidad correspondiente. La evaluación requiere verificar su texto y alcance, sin sustituir esa exigencia por autorizaciones generales o prácticas institucionales.",
          no_evidence_guidance: "Si no existe una norma identificable que establezca expresamente la finalidad, esta vía no puede considerarse acreditada. La falta de identificación normativa debe quedar documentada.",
          expected_result: "Una habilitación legal concreta que permita comprobar la finalidad autorizada y su correspondencia con el tratamiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "vital-later-info",
      provenance: "legal_requirement",
    },
    {
      node_key: "vital-later-info",
      node_type: "question",
      title: "Información posterior",
      prompt:
        "Cuando hubo impedimento para consentir: ¿se verificó el mecanismo de información posterior al cesar el impedimento?",
      why_it_matters:
        "El impedimento difiere el deber de informar, no lo elimina.",
      fact_key: "health02.vital_later_info",
      answer_type: "yes_no_unknown",
      options: consideredOptions("health02.vital_later_info"),
      evidence_to_review: ["mecanismo de información posterior"],
      evidence_review_help: [
        {
          evidence_item: "mecanismo de información posterior",
          review_guide: "Cuando la hipótesis involucra impedimento para consentir, el mecanismo debe contemplar que, al cesar dicho impedimento, el titular sea informado detalladamente sobre los datos tratados y las operaciones específicas realizadas.",
          no_evidence_guidance: "La ausencia de un mecanismo verificable deja pendiente esta condición cuando resulta aplicable. Si no existe impedimento para consentir en la hipótesis examinada, debe distinguirse esa circunstancia de una obligación incumplida.",
          expected_result: "Un procedimiento capaz de proporcionar la información posterior legalmente exigida cuando desaparezca el impedimento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "prohibition-state",
      provenance: "legal_requirement",
    },
    {
      node_key: "prohibition-state",
      node_type: "question",
      title: "Prohibición especial de ámbitos",
      prompt:
        "Respecto de datos o muestras obtenidos en ámbitos laboral, educativo, deportivo, social, de seguros, de seguridad o de identificación: ¿cuál es el estado de la prohibición especial?",
      why_it_matters:
        "La prohibición solo cede ante ley expresa referida a casos del propio art. 16 bis; sin habilitación bloquea la conclusión favorable.",
      fact_key: "health02.prohibition_state",
      answer_type: "single_select",
      options: [
        {
          value: "not_relevant",
          label: "No relevante al contexto",
          description: "Los datos o muestras no provienen de los ámbitos alcanzados por la prohibición.",
          fact_effect: { fact_key: "health02.prohibition_state", value: "not_relevant" },
        },
        {
          value: "relevant_unenabled",
          label: "Relevante sin habilitación",
          description: "La prohibición aplica al contexto y no existe ley expresa que habilite el caso.",
          fact_effect: { fact_key: "health02.prohibition_state", value: "relevant_unenabled" },
        },
        {
          value: "relevant_enabled",
          label: "Relevante con ley expresa",
          description: "La prohibición aplica pero una ley autoriza expresamente el caso calificado del art. 16 bis.",
          fact_effect: { fact_key: "health02.prohibition_state", value: "relevant_enabled" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "health02.prohibition_state", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "origen y contexto de recolección",
        "controles sobre muestras y material biológico",
        "norma habilitante cuando se invoque excepción",
      ],
      evidence_review_help: [
        {
          evidence_item: "origen y contexto de recolección",
          review_guide: "Es necesario determinar si los datos de salud, perfil biológico o muestras asociadas se recolectaron en ámbitos laboral, educativo, deportivo, social, de seguros, de seguridad o identificación. La procedencia de los datos es decisiva para evaluar la prohibición especial, con independencia de la vía principal analizada.",
          no_evidence_guidance: "Si el origen de la información no puede establecerse, el estado de la prohibición debe permanecer indeterminado. No corresponde asumir que la prohibición es irrelevante por desconocer el contexto de recolección.",
          expected_result: "Una clasificación documentada del origen y contexto de recolección que permita establecer si la prohibición especial resulta relevante.",
        },
        {
          evidence_item: "controles sobre muestras y material biológico",
          review_guide: "La evaluación debe considerar las operaciones sobre muestras vinculadas a personas identificadas o identificables, incluido el almacenamiento de material biológico. Los controles técnicos o de seguridad no eliminan por sí solos una prohibición legal aplicable.",
          no_evidence_guidance: "Cuando no exista claridad sobre el tratamiento, cesión o conservación de muestras y material biológico, el estado de la prohibición queda pendiente de determinar. No deben almacenarse muestras, datos clínicos ni registros individuales en Nexo DPO.",
          expected_result: "Una evaluación verificable de las operaciones y controles sobre muestras o material biológico, sin confundir medidas de protección con autorización legal.",
        },
        {
          evidence_item: "norma habilitante cuando se invoque excepción",
          review_guide: "La norma debe autorizar expresamente el tratamiento en casos calificados y referirse a alguno de los supuestos del artículo 16 bis. Una habilitación sanitaria general, el consentimiento o una política interna no bastan por sí solos para levantar la prohibición especial.",
          no_evidence_guidance: "Si no se identifica una ley que reúna ambas condiciones, no puede considerarse acreditada la excepción a la prohibición. Cuando el contexto prohibido resulte aplicable sin habilitación, la conclusión favorable queda impedida.",
          expected_result: "Una autorización legal expresa, aplicable al caso calificado y vinculada al artículo 16 bis, o una conclusión documentada de que la prohibición permanece sin excepción acreditada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "analysis-ready",
      provenance: "legal_requirement",
    },
    {
      node_key: "analysis-ready",
      node_type: "question",
      title: "Análisis suficiente",
      prompt:
        "¿La ruta principal está verificada y documentada con respaldo suficiente para adoptar la conclusión profesional?",
      why_it_matters:
        "Solo con la vía analizada y documentada existe base para concluir.",
      fact_key: READY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        READY,
        "La vía analizada, hechos relevantes, alternativas descartadas y conclusión preliminar están documentados.",
      ),
      evidence_to_review: ["Reasoning Record del régimen de salud"],
      evidence_review_help: [
        {
          evidence_item: "Reasoning Record del régimen de salud",
          review_guide: "El razonamiento debe integrar la vía jurídica examinada, las condiciones correspondientes y la evaluación de la prohibición especial. También debe distinguir las alternativas descartadas, las circunstancias de información posterior o anonimización cuando correspondan y los hechos relevantes.",
          no_evidence_guidance: "Si faltan antecedentes capaces de modificar la conclusión, el análisis permanece incompleto. La incertidumbre no debe transformarse en una declaración automática de incumplimiento.",
          expected_result: "Un razonamiento profesional suficientemente documentado para decidir sobre las condiciones del artículo 16 bis, incluyendo la prohibición especial y sus eventuales excepciones.",
        },
      ],
      required_facts: [],
      default_next_node_key: "sufficiency-gate",
      provenance: "agency_standard",
    },
    {
      node_key: "sufficiency-gate",
      node_type: "decision",
      title: "Suficiencia del análisis",
      prompt:
        "El sistema verifica candidatura, revisión de datos y análisis suficiente antes de la conclusión.",
      answer_type: "none",
      required_facts: [CANDIDATE, ITEMS, READY],
      transitions: [
        {
          rule_id: "ready-for-conclusion",
          description: "Candidatura vigente, datos revisados y análisis suficiente.",
          when: {
            op: "all",
            conditions: [isYes(CANDIDATE), isYes(ITEMS), isYes(READY)],
          },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Existe base mínima para que el profesional adopte una conclusión documentada.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La evaluación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "adopt-conclusion",
      node_type: "question",
      title: "Adopción de la conclusión",
      prompt:
        "¿Cuál conclusión profesional adoptas sobre el régimen especial de salud y perfil biológico de esta finalidad?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema.",
      fact_key: DRAFT,
      answer_type: "single_select",
      options: [
        {
          value: "conditions_supported",
          label: "Condiciones cumplidas",
          description:
            "Juicio profesional: el tratamiento cumple las condiciones del art. 16 bis por la vía documentada.",
          fact_effect: { fact_key: DRAFT, value: "conditions_supported" },
        },
        {
          value: "conditions_not_supported",
          label: "Condiciones no cumplidas",
          description:
            "Juicio profesional: el tratamiento no cumple las condiciones con los antecedentes actuales.",
          fact_effect: { fact_key: DRAFT, value: "conditions_not_supported" },
        },
      ],
      evidence_to_review: ["Reasoning Record del régimen de salud"],
      evidence_review_help: [
        {
          evidence_item: "Reasoning Record del régimen de salud",
          review_guide: "La conclusión profesional debe guardar correspondencia con la vía analizada, sus requisitos acreditados y el estado de la prohibición especial. La existencia de consentimiento, necesidad sanitaria o medidas de seguridad no justifica una conclusión favorable cuando subsiste una prohibición aplicable sin habilitación.",
          no_evidence_guidance: "Los vacíos relevantes del ReasoningRecord deben resolverse antes de finalizar. Una evaluación incompleta no equivale a una conclusión fundada de condiciones no cumplidas.",
          expected_result: "Un ReasoningRecord completo y trazable que fundamente la conclusión adoptada respecto del régimen de salud y perfil biológico, sin sustituir el análisis profesional por una deducción automática.",
        },
      ],
      help_text: [
        "No uses la falta de información como fundamento de incumplimiento: si faltan antecedentes, la evaluación queda incompleta.",
      ],
      required_facts: [CANDIDATE, ITEMS, READY],
    },
  ],
  outcomes: [
    {
      outcome_key: "conditions_supported",
      label: "Condiciones cumplidas",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el tratamiento de salud o perfil biológico cumple las condiciones del art. 16 bis.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "sensitive.health_biological_status", value: "supported" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con la vía, la ley sanitaria invocada cuando corresponda, el análisis de la prohibición y la conclusión.",
        },
      ],
    },
    {
      outcome_key: "conditions_not_supported",
      label: "Condiciones no cumplidas",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el tratamiento no cumple las condiciones del art. 16 bis con los antecedentes actuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "sensitive.health_biological_status", value: "not_supported" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Revisar la base de licitud en D2.05",
          activity_key: "lawful_basis.assign",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o sin información suficiente. Esto no es una conclusión sobre el régimen especial.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
    {
      outcome_key: "classification_incomplete",
      label: "Clasificación incompleta",
      classification: "agency_standard",
      explanation:
        "La captura estructural aún no permite saber si esta revisión corresponde. Completa la clasificación de salud y perfil biológico de los datos vinculados.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar clasificación estructural",
          note: "Clasifica los datos vinculados (salud y perfil biológico: sí, no o por determinar) antes del análisis jurídico.",
        },
      ],
    },
    {
      outcome_key: "regime_not_indicated",
      label: "Régimen no indicado",
      classification: "agency_standard",
      explanation:
        "La captura estructural actual no identifica el régimen de salud y perfil biológico para esta finalidad. No es una conclusión jurídica ni marca la actividad como no aplicable.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Si la captura estructural cambia, esta revisión puede corresponder en el futuro.",
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
