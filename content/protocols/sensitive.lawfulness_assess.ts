import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D5.01.
 *
 * activity_key = sensitive.lawfulness_assess (decision, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, rutas, evidencia, legal basis y state effect
 * del contenido canónico D5.01. Sin scoring ni deducción automática:
 * el sistema verifica candidatura estructural, cobertura de datos
 * vinculados y base analizada; la conclusión la adopta el
 * profesional con ReasoningRecord purpose-scoped válido.
 *
 * Reglas preservadas:
 * - candidate yes habilita el análisis; candidate no deriva a
 *   régimen no indicado; candidate unknown a clasificación
 *   incompleta (routing, sin effects, sin barrera de navegación);
 * - las seis rutas del art. 16 son alternativas, nunca conjuntivas;
 * - consentimiento se consume como contexto (sin completion
 *   dependency a D3);
 * - supported en D5.01 no implica D5.02/D5.03 (solo next actions
 *   condicionales, sin dependencies).
 */

const CANDIDATE = "derived.purpose.d5_sensitive_candidate";
const ITEMS = "sens01.items_reviewed";
const READY = "sens01.analysis_ready";
const ROUTE = "sens01.route_main";
const DRAFT = "sens01.working_conclusion";

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
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

export const SENSITIVE_LAWFULNESS_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "sensitive.lawfulness_assess.v1",
  activity_key: "sensitive.lawfulness_assess",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada de licitud de datos sensibles",
  description:
    "Estructura el análisis de la vía jurídica del art. 16 para la finalidad activa: verifica la candidatura estructural, revisa los datos vinculados, analiza la ruta de consentimiento o las hipótesis sin consentimiento, y documenta la conclusión profesional.",
  entry_node_key: "structural-gate",
  decision_fact_keys: [CANDIDATE, ITEMS, READY],
  external_fact_keys: [
    CANDIDATE,
    "derived.purpose.d5_health_biological_candidate",
    "derived.purpose.d5_biometric_candidate",
  ],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Candidatura estructural",
      prompt:
        "El sistema verifica si la captura estructural actual identifica esta finalidad como candidata a revisión de datos sensibles.",
      answer_type: "none",
      required_facts: [CANDIDATE],
      transitions: [
        {
          rule_id: "candidate-yes",
          description: "La finalidad es candidata a revisión del régimen sensible.",
          when: isYes(CANDIDATE),
          goto_node_key: "items-review",
          explanation:
            "Al menos un dato vinculado está clasificado como sensible: corresponde el análisis jurídico.",
        },
        {
          rule_id: "candidate-no",
          description: "La captura estructural no identifica el régimen sensible.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "Todos los datos vinculados están clasificados explícitamente como no sensibles.",
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
        "¿Se revisaron los datos actualmente vinculados a la finalidad y su clasificación como sensibles?",
      why_it_matters:
        "La conclusión debe cubrir el universo actual de datos vinculados, no una muestra parcial.",
      fact_key: ITEMS,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        ITEMS,
        "Los datos vinculados y su clasificación fueron revisados.",
      ),
      evidence_to_review: [
        "mapeo dato-finalidad disponible",
        "descripción de la finalidad",
        "clasificación estructural de los datos",
      ],
      evidence_review_help: [
        {
          evidence_item: "mapeo dato-finalidad disponible",
          review_guide: "La revisión debe comprobar que las categorías de datos vinculadas a la finalidad estén identificadas y correspondan al tratamiento efectivamente realizado. Es importante detectar datos omitidos o relaciones que no estén justificadas.",
          no_evidence_guidance: "Si el mapeo es incompleto, pueden contrastarse los antecedentes disponibles con la descripción del tratamiento. Las categorías cuya vinculación no pueda verificarse deben permanecer pendientes de revisión.",
          expected_result: "Una relación verificable entre las categorías de datos y la finalidad, con cobertura suficiente para evaluar cuáles requieren el régimen de datos sensibles.",
        },
        {
          evidence_item: "descripción de la finalidad",
          review_guide: "Debe quedar claro para qué se utilizan los datos personales y qué resultado persigue el tratamiento. Una descripción demasiado amplia o ambigua dificulta determinar si el uso de datos sensibles está jurídicamente justificado.",
          no_evidence_guidance: "Cuando la finalidad no esté suficientemente definida, corresponde aclarar el propósito real del tratamiento antes de evaluar su licitud. No debe asumirse que una descripción genérica respalda todos los usos posibles de los datos.",
          expected_result: "Una finalidad concreta y documentada que permita relacionar el tratamiento de datos sensibles con una vía jurídica específica.",
        },
        {
          evidence_item: "clasificación estructural de los datos",
          review_guide: "La clasificación debe contrastarse con la definición legal de datos sensibles del artículo 2 letra g). Se requiere distinguir las categorías efectivamente sensibles de aquellas cuya naturaleza todavía no puede determinarse.",
          no_evidence_guidance: "Si la clasificación presenta dudas, corresponde examinar la naturaleza y el uso de la categoría de datos antes de asignarle una condición definitiva. La incertidumbre debe mantenerse identificada hasta contar con respaldo suficiente.",
          expected_result: "Una clasificación fundamentada de los datos vinculados que permita reconocer las categorías sensibles y las pendientes de determinación.",
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
        "¿Cuál es la ruta principal del art. 16 analizada para esta finalidad?",
      why_it_matters:
        "Registrar la ruta analizada ordena la evidencia y las alternativas descartadas del razonamiento.",
      fact_key: ROUTE,
      answer_type: "single_select",
      options: [
        {
          value: "express_consent",
          label: "Consentimiento expreso",
          description: "La finalidad se apoya en consentimiento expreso del titular.",
          fact_effect: { fact_key: ROUTE, value: "express_consent" },
        },
        {
          value: "manifestly_public",
          label: "Datos manifiestamente públicos",
          description: "Datos hechos manifiestamente públicos por el titular, tratados para esos fines.",
          fact_effect: { fact_key: ROUTE, value: "manifestly_public" },
        },
        {
          value: "nonprofit",
          label: "Entidad sin fines de lucro",
          description: "Interés legítimo de persona jurídica pública o privada sin fines de lucro con todos los requisitos.",
          fact_effect: { fact_key: ROUTE, value: "nonprofit" },
        },
        {
          value: "vital_integrity",
          label: "Vida, salud o integridad",
          description: "Necesidad indispensable para salvaguardar vida, salud o integridad física o psíquica.",
          fact_effect: { fact_key: ROUTE, value: "vital_integrity" },
        },
        {
          value: "claims_defense",
          label: "Derechos ante tribunal u órgano",
          description: "Necesidad para formulación, ejercicio o defensa de derechos ante tribunal u órgano administrativo.",
          fact_effect: { fact_key: ROUTE, value: "claims_defense" },
        },
        {
          value: "labor_social_security",
          label: "Ámbito laboral o seguridad social",
          description: "Necesidad en ámbito laboral o de seguridad social conforme a la ley.",
          fact_effect: { fact_key: ROUTE, value: "labor_social_security" },
        },
        {
          value: "legal_authorization",
          label: "Autorización o mandato legal",
          description: "Autorización o mandato legal expreso.",
          fact_effect: { fact_key: ROUTE, value: "legal_authorization" },
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
      evidence_to_review: ["antecedente justificativo de la vía invocada"],
      evidence_review_help: [
        {
          evidence_item: "antecedente justificativo de la vía invocada",
          review_guide: "El antecedente debe explicar por qué una vía del artículo 16 podría habilitar el tratamiento para la finalidad evaluada. No basta con mencionar una excepción: deben identificarse los hechos y requisitos que justifican examinarla.",
          no_evidence_guidance: "Ante la falta de un fundamento identificable, la vía debe mantenerse sin acreditar mientras se reúnen los antecedentes necesarios. También pueden examinarse otras hipótesis legales, sin presumir que resultan aplicables.",
          expected_result: "Una vía jurídica principal identificada y vinculada a los hechos del tratamiento, con fundamentos suficientes para continuar su evaluación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "consent-check",
      provenance: "legal_requirement",
    },
    {
      node_key: "consent-check",
      node_type: "question",
      title: "Consentimiento expreso",
      prompt:
        "¿Se verificó si la finalidad se apoya en consentimiento expreso respaldado por el mecanismo correspondiente?",
      why_it_matters:
        "El consentimiento expreso es la primera vía a verificar; su mecanismo se revisa sin duplicar D3.",
      fact_key: "sens01.consent_verified",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.consent_verified"),
      evidence_to_review: [
        "documentación de consentimiento cuando sea la vía",
        "mecanismo de consentimiento (contexto D3)",
      ],
      evidence_review_help: [
        {
          evidence_item: "documentación de consentimiento cuando sea la vía",
          review_guide: "El consentimiento debe ser expreso y corresponder al tratamiento y finalidad examinados. Es necesario distinguir entre disponer de un formulario o procedimiento y contar con respaldo de una manifestación válida del titular.",
          no_evidence_guidance: "Cuando no pueda acreditarse el consentimiento expreso, esta vía permanece sin respaldo suficiente. Corresponde determinar si faltan antecedentes o si la hipótesis debe descartarse, sin dar por aplicable automáticamente otra excepción.",
          expected_result: "Una evaluación documentada que permita establecer si el consentimiento expreso respalda la finalidad o si esta vía no quedó acreditada.",
        },
        {
          evidence_item: "mecanismo de consentimiento (contexto D3)",
          review_guide: "El mecanismo debe permitir obtener una manifestación expresa del titular y guardar correspondencia con la finalidad evaluada. La documentación de D3 sirve como contexto para comprobar su diseño y funcionamiento sin repetir esa evaluación.",
          no_evidence_guidance: "Si no existe información suficiente sobre el mecanismo, su cumplimiento no debe presumirse. La falta de respaldo debe quedar identificada para su aclaración en el contexto correspondiente de D3.",
          expected_result: "Un mecanismo de consentimiento evaluado y coherente con la exigencia de consentimiento expreso para datos sensibles, sin duplicar las conclusiones de D3.",
        },
      ],
      required_facts: [],
      default_next_node_key: "manifestly-public",
      related_activity_keys: ["consent.mechanism_design"],
      provenance: "legal_requirement",
    },
    {
      node_key: "manifestly-public",
      node_type: "question",
      title: "Publicidad manifiesta",
      prompt:
        "¿Se analizó si los datos fueron hechos manifiestamente públicos por el titular y si el tratamiento se relaciona con esos fines?",
      why_it_matters:
        "La publicidad manifiesta solo habilita el tratamiento vinculado a los fines de publicación.",
      fact_key: "sens01.route_public",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_public"),
      evidence_to_review: ["antecedentes de publicidad manifiesta cuando corresponda"],
      evidence_review_help: [
        {
          evidence_item: "antecedentes de publicidad manifiesta cuando corresponda",
          review_guide: "Es necesario determinar si el propio titular hizo manifiestamente públicos los datos y si el tratamiento se relaciona con los fines para los cuales fueron publicados. La simple disponibilidad pública de información no satisface por sí sola esta excepción.",
          no_evidence_guidance: "Si no puede establecerse quién hizo públicos los datos o con qué finalidad, la excepción no queda acreditada. Corresponde mantener la incertidumbre o descartarla fundadamente según los antecedentes disponibles.",
          expected_result: "Una evaluación que permita justificar o descartar la excepción, considerando tanto la publicidad manifiesta realizada por el titular como la relación del tratamiento con sus fines.",
        },
      ],
      required_facts: [],
      default_next_node_key: "nonprofit-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "nonprofit-route",
      node_type: "question",
      title: "Entidad sin fines de lucro",
      prompt:
        "¿Se analizó la hipótesis de interés legítimo de entidad sin fines de lucro con todos sus requisitos legales?",
      why_it_matters:
        "Esta hipótesis solo opera con todos los requisitos concurrentes; ninguno es prescindible.",
      fact_key: "sens01.route_nonprofit",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_nonprofit"),
      evidence_to_review: [
        "estatutos y finalidad de la entidad",
        "reglas de membresía",
      ],
      evidence_review_help: [
        {
          evidence_item: "estatutos y finalidad de la entidad",
          review_guide: "Los antecedentes institucionales deben permitir comprobar el carácter sin fines de lucro y la correspondencia del tratamiento con las finalidades políticas, filosóficas, religiosas, culturales, sindicales o gremiales contempladas en el artículo 16.",
          no_evidence_guidance: "Si el carácter de la entidad o sus finalidades no pueden acreditarse, estos requisitos permanecen sin verificar. La sola condición de organización sin fines de lucro no basta para justificar la excepción.",
          expected_result: "Una evaluación fundamentada de las condiciones institucionales necesarias para determinar si esta hipótesis legal puede resultar aplicable.",
        },
        {
          evidence_item: "reglas de membresía",
          review_guide: "Las reglas deben permitir comprobar que el tratamiento se limita a miembros o afiliados de la organización y se relaciona con sus finalidades específicas. También debe poder determinarse cuándo termina la pertenencia.",
          no_evidence_guidance: "Cuando no sea posible delimitar quiénes son miembros o afiliados para efectos del tratamiento, el requisito no debe considerarse acreditado. La evaluación debe reflejar esa limitación.",
          expected_result: "Criterios verificables de pertenencia y egreso que permitan evaluar la restricción del tratamiento a miembros o afiliados.",
        },
      ],
      help_text: [
        "Requisitos acumulativos: finalidad política, filosófica, religiosa, cultural, sindical o gremial; tratamiento solo de miembros o afiliados; vinculación con fines específicos; garantías contra filtración, sustracción o uso no autorizado; sin comunicación ni cesión a terceros.",
      ],
      required_facts: [],
      default_next_node_key: "nonprofit-conditions",
      provenance: "legal_requirement",
    },
    {
      node_key: "nonprofit-conditions",
      node_type: "question",
      title: "Condiciones de la entidad",
      prompt:
        "Si se invoca la ruta de entidad sin fines de lucro: ¿se verificaron finalidad institucional, membresía, vinculación, garantías, no comunicación y anonimización o supresión al dejar la organización?",
      why_it_matters:
        "Cada condición es exigible; la salida de miembros exige anonimización o supresión.",
      fact_key: "sens01.nonprofit_conditions",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.nonprofit_conditions"),
      evidence_to_review: [
        "controles de seguridad y confidencialidad",
        "evidencia sobre comunicaciones a terceros",
        "mecanismo de anonimización o supresión al egresar",
      ],
      evidence_review_help: [
        {
          evidence_item: "controles de seguridad y confidencialidad",
          review_guide: "Los controles deben ofrecer garantías contra filtración, sustracción y uso o tratamiento no autorizado de los datos sensibles. La evaluación debe considerar tanto las medidas establecidas como los antecedentes que permitan comprobar su aplicación.",
          no_evidence_guidance: "Si únicamente existen declaraciones generales de seguridad, sin respaldo de las garantías exigidas, el requisito permanece pendiente de verificación. Las deficiencias deben identificarse de forma concreta.",
          expected_result: "Garantías de seguridad y confidencialidad suficientemente respaldadas para evaluar esta condición de la excepción legal.",
        },
        {
          evidence_item: "evidencia sobre comunicaciones a terceros",
          review_guide: "La revisión debe determinar si los datos comprendidos en esta excepción se comunican o ceden a terceros. Es importante examinar los flujos reales de información, pues la existencia de controles de confidencialidad no sustituye la prohibición legal correspondiente.",
          no_evidence_guidance: "Si los antecedentes no permiten determinar si existen comunicaciones o cesiones a terceros, esta condición no puede considerarse acreditada. Los flujos pendientes de aclaración deben quedar identificados.",
          expected_result: "Una conclusión documentada sobre la existencia o ausencia de comunicación o cesión a terceros, que permita evaluar el cumplimiento de esta condición.",
        },
        {
          evidence_item: "mecanismo de anonimización o supresión al egresar",
          review_guide: "El mecanismo debe permitir anonimizar o suprimir los datos personales cuando una persona deja de pertenecer a la organización. Es necesario comprobar que el procedimiento contempla el egreso y que las medidas pueden aplicarse a los datos correspondientes.",
          no_evidence_guidance: "Cuando no exista un mecanismo definido o su aplicación no pueda verificarse, el requisito permanece pendiente. La evaluación debe identificar qué aspectos requieren corrección o documentación.",
          expected_result: "Un mecanismo verificable de anonimización o supresión asociado al término de la pertenencia a la organización.",
        },
      ],
      required_facts: [],
      default_next_node_key: "vital-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "vital-route",
      node_type: "question",
      title: "Vida, salud o integridad",
      prompt:
        "¿Se analizó la necesidad indispensable para salvaguardar vida, salud o integridad física o psíquica?",
      why_it_matters:
        "Solo la necesidad indispensable habilita esta vía, no cualquier conveniencia sanitaria.",
      fact_key: "sens01.route_vital",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_vital"),
      evidence_to_review: ["antecedentes vitales cuando corresponda"],
      evidence_review_help: [
        {
          evidence_item: "antecedentes vitales cuando corresponda",
          review_guide: "La evaluación debe establecer si concurren las circunstancias previstas en el artículo 16 para salvaguardar la vida, salud o integridad física o psíquica. La mera conveniencia del tratamiento o una finalidad sanitaria general no acreditan esta excepción.",
          no_evidence_guidance: "Si la necesidad o las circunstancias invocadas no están suficientemente justificadas, la hipótesis no debe considerarse acreditada. Corresponde distinguir los antecedentes faltantes de aquellos que permitan descartarla fundadamente.",
          expected_result: "Una justificación documentada de las circunstancias legales que permitirían aplicar esta vía, o de las razones por las que fue descartada.",
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
        "Si el titular estaba impedido de consentir: ¿se verificó la obligación de informar posteriormente una vez que cese el impedimento?",
      why_it_matters:
        "El impedimento no elimina el deber de informar; solo lo difiere.",
      fact_key: "sens01.vital_later_info",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.vital_later_info"),
      evidence_to_review: ["mecanismo de información posterior"],
      evidence_review_help: [
        {
          evidence_item: "mecanismo de información posterior",
          review_guide: "Cuando el tratamiento se realizó debido al impedimento del titular para consentir, debe existir un mecanismo para informarle posteriormente, al cesar ese impedimento, sobre los datos tratados y las operaciones realizadas.",
          no_evidence_guidance: "Si no existe un procedimiento que permita cumplir esta obligación cuando corresponda, la condición debe registrarse como pendiente de implementación o verificación. No basta con presumir que el titular será informado.",
          expected_result: "Un mecanismo documentado que permita proporcionar la información posterior exigida por la ley cuando desaparezca el impedimento.",
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
        "¿Se analizó la necesidad para formulación, ejercicio o defensa de derechos ante tribunal u órgano administrativo?",
      why_it_matters:
        "La vía exige necesidad vinculada a un procedimiento o defensa concreta.",
      fact_key: "sens01.route_claims",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_claims"),
      evidence_to_review: ["antecedentes judiciales o administrativos cuando corresponda"],
      evidence_review_help: [
        {
          evidence_item: "antecedentes judiciales o administrativos cuando corresponda",
          review_guide: "Debe verificarse que el tratamiento de datos sensibles sea necesario para la formulación, ejercicio o defensa de un derecho ante un tribunal u órgano administrativo. La existencia de un conflicto o procedimiento no justifica automáticamente el uso de cualquier dato sensible.",
          no_evidence_guidance: "Cuando no pueda justificarse la relación entre los datos tratados y el derecho que se pretende ejercer o defender, la excepción permanece sin acreditar. La evaluación debe distinguir falta de antecedentes de ausencia de necesidad.",
          expected_result: "Una justificación jurídica de la necesidad del tratamiento sensible para la actuación judicial o administrativa correspondiente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "labor-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "labor-route",
      node_type: "question",
      title: "Ámbito laboral o seguridad social",
      prompt:
        "¿Se analizó la necesidad en ámbito laboral o de seguridad social para ejercicio de derechos o cumplimiento de obligaciones conforme a la ley?",
      why_it_matters:
        "La vía exige encaje en derechos u obligaciones previstos por la ley.",
      fact_key: "sens01.route_labor",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_labor"),
      evidence_to_review: ["antecedentes laborales cuando corresponda"],
      evidence_review_help: [
        {
          evidence_item: "antecedentes laborales cuando corresponda",
          review_guide: "El tratamiento debe estar relacionado con el ejercicio de derechos o el cumplimiento de obligaciones en el ámbito laboral o de seguridad social conforme a la ley. No basta con que los datos se utilicen habitualmente en un proceso de recursos humanos.",
          no_evidence_guidance: "Si no puede identificarse el derecho u obligación legal que justifica el tratamiento, la excepción no debe presumirse aplicable. Los antecedentes pendientes deben quedar diferenciados de una hipótesis descartada.",
          expected_result: "Un fundamento verificable que vincule la necesidad del tratamiento sensible con derechos u obligaciones laborales o de seguridad social establecidos conforme a la ley.",
        },
      ],
      required_facts: [],
      default_next_node_key: "legal-auth-route",
      provenance: "legal_requirement",
    },
    {
      node_key: "legal-auth-route",
      node_type: "question",
      title: "Autorización o mandato legal",
      prompt:
        "¿Se analizó si existe autorización o mandato legal expreso que habilite el tratamiento?",
      why_it_matters:
        "Sin norma expresa identificada esta vía no puede invocarse.",
      fact_key: "sens01.route_legal_auth",
      answer_type: "yes_no_unknown",
      options: consideredOptions("sens01.route_legal_auth"),
      evidence_to_review: ["norma legal invocada"],
      evidence_review_help: [
        {
          evidence_item: "norma legal invocada",
          review_guide: "La disposición invocada debe contener una autorización o mandato legal expreso que corresponda al tratamiento evaluado. Conviene contrastar su texto y alcance con la fuente oficial, como Ley Chile de la Biblioteca del Congreso Nacional.",
          no_evidence_guidance: "Sin una norma expresa identificada y aplicable, esta vía no puede considerarse acreditada. Una política interna, autorización administrativa genérica o práctica organizacional no reemplaza el requisito legal.",
          expected_result: "Una norma legal expresa identificada, con su alcance y aplicación al tratamiento fundamentados, o un descarte justificado de esta vía.",
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
        "Solo con la vía analizada y documentada existe base para concluir; la mera sensibilidad del dato no determina la vía.",
      fact_key: READY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        READY,
        "La vía analizada, hechos relevantes, alternativas descartadas y conclusión preliminar están documentados.",
      ),
      evidence_to_review: ["análisis profesional"],
      evidence_review_help: [
        {
          evidence_item: "análisis profesional",
          review_guide: "El análisis debe integrar los hechos relevantes, la vía jurídica examinada, sus requisitos y las alternativas descartadas. La conclusión preliminar debe derivarse de los antecedentes evaluados, no únicamente de la clasificación sensible del dato.",
          no_evidence_guidance: "Si faltan antecedentes que puedan modificar la conclusión, la evaluación debe permanecer incompleta. Una vía no soportada requiere un fundamento profesional, no simplemente ausencia de documentación.",
          expected_result: "Un análisis jurídico suficientemente respaldado para adoptar una conclusión profesional sobre la licitud de la finalidad.",
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
        "¿Cuál conclusión profesional adoptas sobre la vía jurídica del tratamiento de datos sensibles de esta finalidad?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: el sistema solo verificó candidatura, cobertura de datos y análisis suficiente.",
      fact_key: DRAFT,
      answer_type: "single_select",
      options: [
        {
          value: "lawful_path_supported",
          label: "Vía jurídica soportada",
          description:
            "Juicio profesional: la finalidad cuenta con una vía válida del art. 16 bajo las condiciones documentadas.",
          fact_effect: { fact_key: DRAFT, value: "lawful_path_supported" },
        },
        {
          value: "lawful_path_not_supported",
          label: "Vía no soportada",
          description:
            "Juicio profesional: no existe vía soportada con los antecedentes actuales.",
          fact_effect: { fact_key: DRAFT, value: "lawful_path_not_supported" },
        },
      ],
      evidence_to_review: ["Reasoning Record de licitud de datos sensibles"],
      evidence_review_help: [
        {
          evidence_item: "Reasoning Record de licitud de datos sensibles",
          review_guide: "El ReasoningRecord debe reflejar la pregunta jurídica, los hechos considerados, las alternativas examinadas y el fundamento de la conclusión profesional. Su contenido debe ser coherente con la vía del artículo 16 evaluada y los antecedentes revisados.",
          no_evidence_guidance: "Cuando existan vacíos relevantes en el razonamiento o en sus fundamentos, la evaluación no debe concluirse prematuramente. La información insuficiente debe distinguirse de una decisión fundada de vía no soportada.",
          expected_result: "Un ReasoningRecord completo, trazable y coherente con la conclusión profesional adoptada, sin sustituir las evaluaciones de otros regímenes especiales que correspondan.",
        },
      ],
      help_text: [
        "No uses la falta de información como fundamento de vía no soportada: si faltan antecedentes, la evaluación queda incompleta.",
        "Si además corresponde, deriva a los regímenes especializados D5.02–D5.05 desde las siguientes acciones.",
      ],
      required_facts: [CANDIDATE, ITEMS, READY],
    },
  ],
  outcomes: [
    {
      outcome_key: "lawful_path_supported",
      label: "Vía jurídica soportada",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la finalidad cuenta con una vía válida del art. 16. Esto no afirma nada sobre los regímenes especializados D5.02–D5.05.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "sensitive.lawfulness_status", value: "supported" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Evaluar el régimen de salud y perfil biológico si corresponde",
          activity_key: "sensitive.health_biological_assess",
          show_when: {
            op: "fact_equals",
            fact_key: "derived.purpose.d5_health_biological_candidate",
            value: "yes",
          },
        },
        {
          kind: "activity",
          label: "Evaluar el tratamiento biométrico si corresponde",
          activity_key: "sensitive.biometric_assess",
          show_when: {
            op: "fact_equals",
            fact_key: "derived.purpose.d5_biometric_candidate",
            value: "yes",
          },
        },
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con la vía analizada, hechos relevantes, alternativas descartadas y conclusión.",
        },
      ],
    },
    {
      outcome_key: "lawful_path_not_supported",
      label: "Vía no soportada",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: con los antecedentes actuales no existe vía del art. 16 que sostenga la finalidad.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "sensitive.lawfulness_status", value: "not_supported" },
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
        "Existen antecedentes pendientes o sin información suficiente. Esto no es una conclusión sobre la vía jurídica.",
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
        "La captura estructural aún no permite saber si esta revisión corresponde. Completa la clasificación de los datos vinculados.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar clasificación estructural",
          note: "Clasifica los datos vinculados a la finalidad (sensible: sí, no o por determinar) antes de analizar la vía jurídica.",
        },
      ],
    },
    {
      outcome_key: "regime_not_indicated",
      label: "Régimen no indicado",
      classification: "agency_standard",
      explanation:
        "La captura estructural actual no identifica el régimen de datos sensibles para esta finalidad. No es una conclusión jurídica ni marca la actividad como no aplicable.",
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
