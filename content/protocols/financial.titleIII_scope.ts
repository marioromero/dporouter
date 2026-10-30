import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D5.07.
 *
 * activity_key = financial.titleIII_scope (decision, purpose scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * ámbito, inclusiones, exclusiones, reglas de prescripción,
 * arts. 18–19, evidencia y effects del contenido canónico D5.07. Sin
 * registros de operación, deuda o deudor: categorías abstractas en
 * evidencia y answers; los plazos legales se modelan como
 * capacidad/procedimiento, sin timers ni vencimientos individuales.
 *
 * Reglas preservadas:
 * - candidatura = ruta art. 13(a) afirmada en D2 (bridge read-only,
 *   sin modificar D2.05 ni materializar `purpose.lawful_basis`);
 * - `in_scope` ≠ `requirements satisfied`: tres outcomes definitivos
 *   separados; combinaciones imposibles bloqueadas por el guard
 *   (scope/out_of_scope nunca con requirements positivo);
 * - out_of_scope puede concluir aunque D2 haya seleccionado
 *   preliminarmente la ruta, sin escritura automática a D2.05 (solo
 *   next action humano de revisión);
 * - reasoning refs = TODOS los vinculados actuales (cobertura del
 *   conjunto), con staleness ante cambios de mapping, ruta D2 o
 *   respuestas materiales (snapshots `answer:<fact>=<value>`).
 */

const CANDIDATE = "derived.purpose.d5_titleIII_candidate";
const ITEMS = "fin07.items_reviewed";
const READY = "fin07.analysis_ready";
const SCOPE = "fin07.scope_assessed";
const REQUIREMENTS = "fin07.requirements_assessed";
const DRAFT = "fin07.working_conclusion";

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function consideredOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Analizada con respaldo",
      description: "La materia fue analizada con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No analizada",
      description: "La materia aún no ha sido analizada.",
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

export const FINANCIAL_TITLEIII_SCOPE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "financial.titleIII_scope.v1",
  activity_key: "financial.titleIII_scope",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada del ámbito y requisitos del Título III",
  description:
    "Estructura el análisis del Título III para la finalidad activa: ruta art. 13(a), encaje material del art. 17 con inclusiones y exclusiones, prescripción, reglas de cinco años y pago, y requisitos de actualización y bloqueo.",
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
        "El sistema verifica si D2 está considerando la ruta art. 13(a) para esta finalidad.",
      answer_type: "none",
      required_facts: [CANDIDATE],
      transitions: [
        {
          rule_id: "candidate-yes",
          description: "D2 considera la ruta art. 13(a).",
          when: isYes(CANDIDATE),
          goto_node_key: "items-review",
          explanation:
            "La finalidad pretende fundarse en la regla del art. 13 letra a): corresponde evaluar ámbito y límites del Título III.",
        },
        {
          rule_id: "candidate-no",
          description: "Otra ruta jurídica está afirmada.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "La finalidad sigue otra ruta de licitud afirmada.",
        },
        {
          rule_id: "fallback-classification",
          description: "Sin contexto D2 suficiente no inicia la evaluación.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "classification_incomplete",
          explanation:
            "El contexto de licitud D2 es insuficiente o ambiguo para esta finalidad.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "items-review",
      node_type: "question",
      title: "Datos y operaciones revisados",
      prompt:
        "¿Se revisaron las operaciones y datos vinculados a la finalidad que se pretende amparar en la ruta art. 13(a)?",
      why_it_matters:
        "El análisis de ámbito debe cubrir el conjunto actual de información vinculada.",
      fact_key: ITEMS,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        ITEMS,
        "Las operaciones y datos vinculados fueron revisados.",
      ),
      evidence_to_review: [
        "descripción de finalidad",
        "análisis de licitud D2",
        "mapeo de datos y operaciones",
      ],
      evidence_review_help: [
        {
          evidence_item: "descripción de finalidad",
          review_guide: "La finalidad debe precisar para qué se tratan datos relacionados con obligaciones económicas, financieras, bancarias o comerciales. Su descripción debe permitir determinar qué operaciones se pretenden amparar en el artículo 13 letra a), sin asumir que cualquier uso financiero queda incluido.",
          no_evidence_guidance: "Si la finalidad es demasiado amplia o no permite reconocer las operaciones concretas, el análisis del ámbito permanece pendiente. No debe presumirse aplicable el Título III únicamente por la actividad económica de la organización.",
          expected_result: "Una finalidad documentada y suficientemente delimitada para evaluar su encaje material en el Título III.",
        },
        {
          evidence_item: "análisis de licitud D2",
          review_guide: "El análisis debe permitir comprobar qué fuente de licitud se considera para la finalidad y si corresponde a la letra a) del artículo 13. Esta revisión utiliza el contexto registrado en D2, sin redefinir ni modificar su conclusión.",
          no_evidence_guidance: "Cuando el contexto de D2 es insuficiente o ambiguo, la candidatura al régimen especial no debe presumirse. La identificación de la vía debe aclararse en el ámbito correspondiente de D2.",
          expected_result: "Una referencia verificable a la ruta jurídica evaluada en D2, como antecedente para examinar el ámbito del Título III.",
        },
        {
          evidence_item: "mapeo de datos y operaciones",
          review_guide: "El mapeo debe cubrir las categorías de información y operaciones vinculadas a la finalidad, incluidas aquellas que se comunican o actualizan. Es importante detectar usos omitidos que puedan quedar fuera del ámbito permitido.",
          no_evidence_guidance: "Si existen operaciones o categorías sin identificar, la cobertura del análisis queda incompleta. No corresponde asumir que todos los datos vinculados comparten automáticamente el mismo fundamento legal.",
          expected_result: "Un conjunto documentado de categorías y operaciones que permita evaluar íntegramente la finalidad respecto del Título III.",
        },
      ],
      required_facts: [],
      default_next_node_key: "route-confirm",
      provenance: "agency_standard",
    },
    {
      node_key: "route-confirm",
      node_type: "question",
      title: "Ruta art. 13(a)",
      prompt:
        "¿Se confirmó que la ruta jurídica candidata de D2 corresponde al art. 13 letra a) para esta finalidad?",
      why_it_matters:
        "Solo esa ruta activa la evaluación del Título III; un dato económico no conduce automáticamente a ella.",
      fact_key: "fin07.route_confirmed",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.route_confirmed"),
      evidence_to_review: ["análisis de licitud D2"],
      evidence_review_help: [
        {
          evidence_item: "análisis de licitud D2",
          review_guide: "La revisión debe comprobar que D2 considera la fuente especial de licitud del artículo 13 letra a) para la finalidad activa. Esa selección constituye una candidatura que aún requiere verificar las condiciones materiales del Título III.",
          no_evidence_guidance: "Si no puede determinarse la vía evaluada por D2, el análisis no debe avanzar sobre una presunción de licitud financiera. La falta de claridad corresponde a un antecedente pendiente, no a una confirmación del ámbito.",
          expected_result: "Una candidatura jurídica identificada y trazable, diferenciada de la conclusión posterior sobre aplicabilidad del Título III.",
        },
      ],
      help_text: [
        "No asumir dato financiero o económico como art. 13(a): la ruta solo se sostiene dentro del ámbito material del Título III.",
      ],
      required_facts: [],
      default_next_node_key: "obligation-nature",
      related_activity_keys: ["lawful_basis.assign"],
      provenance: "legal_requirement",
    },
    {
      node_key: "obligation-nature",
      node_type: "question",
      title: "Naturaleza de las obligaciones",
      prompt:
        "¿Se determinó si las operaciones y datos se refieren a obligaciones de carácter económico, financiero, bancario o comercial?",
      why_it_matters:
        "Solo esas naturalezas entran al ámbito material del Título III.",
      fact_key: "fin07.obligation_nature",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.obligation_nature"),
      evidence_to_review: [
        "categorías abstractas de obligaciones",
        "mapeo de datos y operaciones",
      ],
      evidence_review_help: [
        {
          evidence_item: "categorías abstractas de obligaciones",
          review_guide: "Las categorías deben permitir determinar si las obligaciones tienen carácter económico, financiero, bancario o comercial. Su denominación general no basta para establecer que la información sea legalmente comunicable conforme al artículo 17.",
          no_evidence_guidance: "Cuando la naturaleza de una categoría no pueda establecerse, debe permanecer pendiente de análisis. No es necesario incorporar antecedentes de deudores o deudas reales para aclarar su clasificación.",
          expected_result: "Una caracterización fundamentada de las obligaciones comprendidas en la finalidad, apta para contrastarse con las inclusiones y exclusiones legales.",
        },
        {
          evidence_item: "mapeo de datos y operaciones",
          review_guide: "El mapeo debe relacionar las categorías de obligaciones con las operaciones efectivamente realizadas, especialmente comunicación y tratamiento de información financiera. La revisión debe distinguir la naturaleza del dato de la habilitación específica para cada operación.",
          no_evidence_guidance: "Si no se conocen las operaciones asociadas a las categorías, el encaje material queda sin acreditar. La presencia de una obligación financiera no determina automáticamente que cualquier comunicación esté permitida.",
          expected_result: "Una relación verificable entre categorías de obligaciones y operaciones que permita continuar el análisis del artículo 17.",
        },
      ],
      required_facts: [],
      default_next_node_key: "art17-fit",
      provenance: "legal_requirement",
    },
    {
      node_key: "art17-fit",
      node_type: "question",
      title: "Encaje del art. 17",
      prompt:
        "¿Se verificó que la información a justificar está comprendida dentro del ámbito material permitido por el art. 17?",
      why_it_matters:
        "Fuera del art. 17 no hay ruta art. 13(a) que sostener.",
      fact_key: "fin07.art17_fit",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.art17_fit"),
      evidence_to_review: [
        "matriz de inclusiones y exclusiones",
        "instrumentos y modelos utilizados",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz de inclusiones y exclusiones",
          review_guide: "La matriz debe contrastar cada categoría y operación con los supuestos comunicables del artículo 17 y sus exclusiones. Una clasificación general como deuda comercial no resulta suficiente para establecer el encaje permitido.",
          no_evidence_guidance: "Si no se han distinguido los supuestos legalmente admitidos de los excluidos, el ámbito permanece pendiente de determinación. No corresponde presumir comunicabilidad de categorías que aún no han sido evaluadas.",
          expected_result: "Una evaluación fundamentada de los supuestos del artículo 17 pertinentes para la finalidad y sus operaciones.",
        },
        {
          evidence_item: "instrumentos y modelos utilizados",
          review_guide: "Los modelos de instrumentos deben permitir identificar si las obligaciones se documentan mediante alguna de las formas reconocidas por la ley. Es necesario considerar la naturaleza del instrumento y su correspondencia con el supuesto legal, no solamente su denominación comercial.",
          no_evidence_guidance: "Cuando no pueda comprobarse el tipo de instrumento o su relación con la obligación, la inclusión no queda acreditada. Las dudas deben mantenerse identificadas sin incorporar instrumentos de deuda reales.",
          expected_result: "Una caracterización verificable de los instrumentos pertinentes y su posible encaje en las categorías comunicables del artículo 17.",
        },
      ],
      required_facts: [],
      default_next_node_key: "art17-exclusions",
      provenance: "legal_requirement",
    },
    {
      node_key: "art17-exclusions",
      node_type: "question",
      title: "Inclusiones y exclusiones",
      prompt:
        "¿Se distinguieron las obligaciones expresamente comunicables de las legalmente excluidas, documentando las exclusiones aplicables?",
      why_it_matters:
        "Comunicar lo excluido invalida la ruta aunque el resto encaje.",
      fact_key: "fin07.art17_exclusions",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.art17_exclusions"),
      evidence_to_review: [
        "matriz de inclusiones y exclusiones",
        "letras y pagarés protestados, cheques protestados, créditos y préstamos dentro del ámbito legal",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz de inclusiones y exclusiones",
          review_guide: "La revisión debe diferenciar obligaciones comunicables de aquellas expresamente excluidas, considerando las condiciones específicas de cada supuesto. Una categoría inicialmente comprendida puede dejar de ser comunicable por una exclusión legal aplicable.",
          no_evidence_guidance: "Si las exclusiones no han sido examinadas, la evaluación del artículo 17 permanece incompleta. La ausencia de una exclusión documentada no demuestra que esta no exista.",
          expected_result: "Una matriz fundamentada que identifique inclusiones, exclusiones aplicables y categorías que todavía requieren aclaración.",
        },
        {
          evidence_item: "letras y pagarés protestados, cheques protestados, créditos y préstamos dentro del ámbito legal",
          review_guide: "Debe comprobarse que los instrumentos y operaciones correspondan a los supuestos y condiciones previstos en el artículo 17. En préstamos y créditos, resulta especialmente relevante verificar su origen y las entidades comprendidas en la norma, además de las exclusiones.",
          no_evidence_guidance: "Si la categoría o sus condiciones no pueden comprobarse, no debe presumirse que la información es comunicable. Una deuda documentada no equivale por sí sola a una obligación admitida en este régimen.",
          expected_result: "Una evaluación documentada de los instrumentos y créditos que pueden quedar comprendidos en el artículo 17, con sus restricciones identificadas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "art17-special",
      provenance: "legal_requirement",
    },
    {
      node_key: "art17-special",
      node_type: "question",
      title: "Casos especiales del art. 17",
      prompt:
        "¿Se contemplaron obligaciones repactadas, renegociadas, novadas o con modalidad pendiente; servicios básicos; educacionales; salud; autopistas; cesantía; y otras obligaciones habilitadas por decreto?",
      why_it_matters:
        "Cada categoría tiene reglas y exclusiones propias que condicionan el ámbito.",
      fact_key: "fin07.art17_special",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.art17_special"),
      evidence_to_review: [
        "matriz de inclusiones y exclusiones",
        "normativa y decretos invocados",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz de inclusiones y exclusiones",
          review_guide: "La revisión debe contemplar las reglas sobre obligaciones repactadas, renegociadas, novadas o sujetas a modalidad pendiente, así como las exclusiones relativas a servicios básicos, educación, salud y autopistas. También debe considerar las condiciones particulares de cesantía cuando correspondan.",
          no_evidence_guidance: "Si una categoría especial no ha sido analizada, su comunicabilidad debe mantenerse pendiente. No corresponde extender una exclusión o excepción a supuestos diferentes de los previstos por la ley.",
          expected_result: "Un análisis diferenciado de las categorías especiales relevantes, indicando su inclusión, exclusión o condición pendiente de verificar.",
        },
        {
          evidence_item: "normativa y decretos invocados",
          review_guide: "El fundamento normativo debe permitir comprobar las excepciones y condiciones especiales aplicables. Cuando se invoque un decreto supremo, es necesario verificar su existencia y alcance, sin asumir que habilita indiscriminadamente todas las obligaciones de dinero.",
          no_evidence_guidance: "Sin una norma pertinente identificada, el supuesto especial no queda acreditado. Las referencias normativas incompletas deben distinguirse de las categorías que la ley excluye expresamente.",
          expected_result: "Un fundamento legal identificable para los supuestos especiales invocados y una evaluación de su correspondencia con la finalidad.",
        },
      ],
      help_text: [
        "Esta lista operacional no es taxonomía persistente: vive en evidencia y análisis.",
      ],
      required_facts: [],
      default_next_node_key: "decree-conditions",
      provenance: "legal_requirement",
    },
    {
      node_key: "decree-conditions",
      node_type: "question",
      title: "Obligaciones por decreto",
      prompt:
        "Cuando se invocan otras obligaciones de dinero por decreto supremo: ¿se verificaron decreto existente, instrumento válido, consentimiento expreso del obligado y vencimiento?",
      why_it_matters:
        "Sin los cuatro requisitos la habilitación por decreto no opera.",
      fact_key: "fin07.decree_conditions",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.decree_conditions"),
      evidence_to_review: [
        "normativa y decretos invocados",
        "instrumentos y modelos utilizados",
      ],
      evidence_review_help: [
        {
          evidence_item: "normativa y decretos invocados",
          review_guide: "El decreto debe habilitar la categoría concreta de obligación de dinero invocada. Además, corresponde comprobar las condiciones legales relativas al instrumento de pago o crédito, consentimiento expreso del obligado y fecha de vencimiento.",
          no_evidence_guidance: "Si el decreto no está identificado o sus condiciones no pueden acreditarse, la categoría no debe considerarse habilitada por esta vía. La inexistencia de esta excepción no convierte automáticamente en ilícitas otras categorías amparadas directamente por la ley.",
          expected_result: "Un decreto aplicable y una evaluación documentada de todos los requisitos que permiten invocar la habilitación especial.",
        },
        {
          evidence_item: "instrumentos y modelos utilizados",
          review_guide: "Los modelos deben permitir verificar que la obligación se sustenta en un instrumento de pago o crédito válidamente emitido que contempla el consentimiento expreso del deudor u obligado y la fecha de vencimiento. No basta con que exista un formato de documento comercial.",
          no_evidence_guidance: "Cuando los instrumentos no permitan comprobar alguna condición exigida, esta vía permanece sin acreditar. La evaluación puede efectuarse sobre modelos abstractos sin examinar información de deudores reales.",
          expected_result: "Instrumentos evaluados respecto de su validez y de las condiciones expresas exigidas para la categoría habilitada por decreto.",
        },
      ],
      required_facts: [],
      default_next_node_key: "decree-ref",
      provenance: "legal_requirement",
    },
    {
      node_key: "decree-ref",
      node_type: "question",
      title: "Decreto invocado",
      prompt: "Identifica el decreto o norma invocada cuando corresponda (cita breve; vacío si no aplica).",
      why_it_matters:
        "La habilitación por decreto exige norma identificable.",
      fact_key: "fin07.decree_ref",
      answer_type: "text",
      evidence_to_review: ["normativa y decretos invocados"],
      evidence_review_help: [
        {
          evidence_item: "normativa y decretos invocados",
          review_guide: "La referencia debe identificar suficientemente el decreto supremo o disposición invocada y permitir comprobar que ampara la categoría evaluada. Conviene contrastar su texto en una fuente oficial, evitando referencias genéricas a regulaciones financieras.",
          no_evidence_guidance: "Si no existe una referencia verificable, la habilitación por decreto queda pendiente. Cuando no se invoque esta vía, corresponde reflejar su inaplicabilidad sin inventar una disposición.",
          expected_result: "Una cita normativa precisa y trazable cuando corresponda, o la ausencia justificada de una norma por no aplicarse esta vía.",
        },
      ],
      required_facts: [],
      default_next_node_key: "prescription-capacity",
      provenance: "legal_requirement",
    },
    {
      node_key: "prescription-capacity",
      node_type: "question",
      title: "Supresión de prescritas",
      prompt:
        "¿Se verificó la capacidad para suprimir de registros o bases toda información de obligaciones prescritas sin requerir solicitud del titular, orden judicial o instrucción de la autoridad?",
      why_it_matters:
        "La supresión de prescritas es oficiosa: no espera solicitud ni orden.",
      fact_key: "fin07.prescription_capacity",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.prescription_capacity"),
      evidence_to_review: ["procedimiento de prescripción y supresión"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de prescripción y supresión",
          review_guide: "El procedimiento debe permitir identificar información relativa a obligaciones prescritas y suprimirla de los registros o bases correspondientes. La verificación debe considerar que la supresión opera sin exigir solicitud del titular, orden judicial ni instrucción de la autoridad.",
          no_evidence_guidance: "Si no puede comprobarse una capacidad de supresión oficiosa, el requisito permanece pendiente o requiere corrección según los antecedentes. La evaluación debe referirse al diseño del procedimiento, sin almacenar obligaciones individuales.",
          expected_result: "Un procedimiento verificable para identificar y suprimir información de obligaciones prescritas de oficio, conforme al artículo 17.",
        },
      ],
      required_facts: [],
      default_next_node_key: "five-year-rule",
      provenance: "legal_requirement",
    },
    {
      node_key: "five-year-rule",
      node_type: "question",
      title: "Regla de cinco años",
      prompt:
        "¿Se verificó la capacidad para no comunicar información del art. 17 después de cinco años desde la exigibilidad?",
      why_it_matters:
        "Los cinco años son requisito de capacidad y procedimiento, no un temporizador operativo.",
      fact_key: "fin07.five_year_rule",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.five_year_rule"),
      evidence_to_review: ["reglas de antigüedad"],
      evidence_review_help: [
        {
          evidence_item: "reglas de antigüedad",
          review_guide: "Las reglas deben impedir la comunicación de información comprendida en el artículo 17 una vez transcurridos cinco años desde que la obligación se hizo exigible. Es necesario distinguir la fecha de exigibilidad de otros hitos, como la generación del registro o su última actualización.",
          no_evidence_guidance: "Si las reglas no permiten determinar el momento desde el cual se aplica el límite legal, el requisito no queda acreditado. No es necesario crear temporizadores ni registrar vencimientos de deudas reales en Nexo DPO.",
          expected_result: "Una capacidad procedimental verificable para impedir comunicaciones después del plazo legal contado desde la exigibilidad.",
        },
      ],
      required_facts: [],
      default_next_node_key: "payment-extinction",
      provenance: "legal_requirement",
    },
    {
      node_key: "payment-extinction",
      node_type: "question",
      title: "Pago o extinción",
      prompt:
        "¿Se verificó no continuar comunicando tras pago o extinción por otro modo legal, distinguiendo sus efectos del fundamento o caducidad de los datos?",
      why_it_matters:
        "Pagar o extinguir cierra la comunicación, con efectos distintos según el caso.",
      fact_key: "fin07.payment_extinction",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.payment_extinction"),
      evidence_to_review: ["procedimiento de pago y extinción"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de pago y extinción",
          review_guide: "El procedimiento debe impedir que continúe la comunicación de una obligación después de su pago o extinción por otro modo legal. Debe distinguirse esa prohibición de comunicación de los efectos que el artículo 19 establece respecto de la subsistencia del fundamento de los datos.",
          no_evidence_guidance: "Si el procedimiento no permite reconocer y aplicar los efectos del pago o extinción, la condición permanece sin acreditar. No corresponde interpretar que la ausencia de caducidad automática autoriza continuar comunicando la obligación.",
          expected_result: "Un mecanismo verificable para detener la comunicación tras el pago o extinción, diferenciando esa restricción de los demás efectos legales sobre los datos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "judicial-context",
      provenance: "legal_requirement",
    },
    {
      node_key: "judicial-context",
      node_type: "question",
      title: "Contexto judicial",
      prompt:
        "¿Se preservó la regla relativa a información requerida por tribunales en juicios pendientes?",
      why_it_matters:
        "El contexto judicial tiene regla propia que no se subsume en las anteriores.",
      fact_key: "fin07.judicial_context",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.judicial_context"),
      evidence_to_review: ["procedimiento de pago y extinción"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de pago y extinción",
          review_guide: "Debe comprobarse que el procedimiento distinga la comunicación ordinaria de la información requerida por tribunales de justicia con motivo de juicios pendientes. La regla judicial no debe utilizarse como habilitación general para continuar divulgando obligaciones.",
          no_evidence_guidance: "Si el procedimiento no distingue los requerimientos judiciales pertinentes, esta condición permanece pendiente. No debe presumirse que cualquier controversia o cobranza equivale a una solicitud judicial comprendida en el artículo 18.",
          expected_result: "Una distinción documentada entre la prohibición general de comunicación y el supuesto específico de información requerida por tribunales en juicios pendientes.",
        },
      ],
      required_facts: [],
      default_next_node_key: "creditor-notification",
      provenance: "legal_requirement",
    },
    {
      node_key: "creditor-notification",
      node_type: "question",
      title: "Comunicación del acreedor",
      prompt:
        "Cuando interviene directamente el acreedor: ¿se verificó la comunicación del pago o extinción al responsable del registro o base pública en plazo legal?",
      why_it_matters:
        "Sin comunicación oportuna del acreedor el registro queda desactualizado.",
      fact_key: "fin07.creditor_notification",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.creditor_notification"),
      evidence_to_review: ["procedimiento de actualización"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de actualización",
          review_guide: "Cuando el acreedor interviene directamente en el pago o extinción, el procedimiento debe contemplar el aviso al responsable del registro o base accesible al público dentro del plazo legal de siete días hábiles, considerando las condiciones y alternativas previstas en el artículo 19.",
          no_evidence_guidance: "Si no puede comprobarse quién realiza el aviso o cómo se respeta el plazo, la condición permanece pendiente. No corresponde exigir esta actuación a un actor que no interviene en el supuesto legal correspondiente.",
          expected_result: "Un procedimiento verificable de notificación del pago o extinción por el acreedor cuando corresponda, con la responsabilidad y el plazo legal identificados.",
        },
      ],
      required_facts: [],
      default_next_node_key: "debtor-request",
      provenance: "legal_requirement",
    },
    {
      node_key: "debtor-request",
      node_type: "question",
      title: "Requerimiento del deudor",
      prompt:
        "¿Se contempla la alternativa del deudor de requerir directamente la modificación cuando concurran las condiciones legales?",
      why_it_matters:
        "El deudor tiene vía directa de requerimiento en condiciones legales.",
      fact_key: "fin07.debtor_request",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.debtor_request"),
      evidence_to_review: ["procedimiento de actualización"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de actualización",
          review_guide: "El procedimiento debe contemplar la posibilidad legal de que el deudor solicite directamente la modificación del registro y, bajo las condiciones previstas, libere al acreedor de su obligación de aviso. La evaluación debe considerar la constancia suficiente del pago y la formalización de la opción cuando corresponda.",
          no_evidence_guidance: "Si esta alternativa no está contemplada o sus condiciones resultan ambiguas, el procedimiento requiere aclaración. No debe confundirse el requerimiento directo del deudor con una eliminación automática de todas las obligaciones del acreedor.",
          expected_result: "Una alternativa de modificación directa por el deudor debidamente prevista y delimitada conforme al artículo 19.",
        },
      ],
      required_facts: [],
      default_next_node_key: "downstream-update",
      provenance: "legal_requirement",
    },
    {
      node_key: "downstream-update",
      node_type: "question",
      title: "Actualización downstream",
      prompt:
        "¿Se verificó la actualización de los datos provenientes de la fuente pública una vez comunicado el pago o extinción?",
      why_it_matters:
        "Lo comunicado debe propagarse a los datos derivados de la fuente pública.",
      fact_key: "fin07.downstream_update",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.downstream_update"),
      evidence_to_review: ["procedimiento de actualización"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de actualización",
          review_guide: "El procedimiento debe contemplar que quienes traten datos obtenidos de una fuente accesible al público actualicen la información cuando dicha fuente comunique el pago o extinción. Es importante identificar cómo se recibe y aplica la modificación correspondiente.",
          no_evidence_guidance: "Si no existe una forma verificable de reconocer y actualizar información procedente de esa fuente, el requisito permanece sin acreditar. La revisión debe considerar la función del responsable sin crear registros individuales de obligaciones.",
          expected_result: "Una capacidad documentada de actualización coherente con los cambios comunicados por la fuente pública correspondiente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "update-deadline",
      provenance: "legal_requirement",
    },
    {
      node_key: "update-deadline",
      node_type: "question",
      title: "Plazo de actualización",
      prompt:
        "¿Se verificó la aplicación del plazo legal de actualización correspondiente (capacidad y procedimiento, sin temporizadores)?",
      why_it_matters:
        "El plazo legal se cumple por diseño del procedimiento.",
      fact_key: "fin07.update_deadline",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.update_deadline"),
      evidence_to_review: ["procedimiento de actualización"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de actualización",
          review_guide: "El procedimiento debe permitir aplicar la actualización tan pronto la fuente pública comunique el pago o extinción, o dentro del plazo legal correspondiente. Es necesario distinguir este deber del plazo de aviso que corresponde al acreedor.",
          no_evidence_guidance: "Si no puede verificarse que el procedimiento contemple el plazo legal de actualización, la condición permanece pendiente o requiere corrección. La evaluación no necesita temporizadores ni seguimiento de casos individuales.",
          expected_result: "Un procedimiento verificable que contemple el plazo de actualización aplicable a quienes tratan datos provenientes de la fuente pública.",
        },
      ],
      required_facts: [],
      default_next_node_key: "temp-blocking",
      provenance: "legal_requirement",
    },
    {
      node_key: "temp-blocking",
      node_type: "question",
      title: "Bloqueo temporal",
      prompt:
        "¿Se verificó el bloqueo temporal de los datos cuando la actualización no pueda realizarse oportunamente?",
      why_it_matters:
        "Sin actualización oportuna, el bloqueo temporal protege al titular.",
      fact_key: "fin07.temp_blocking",
      answer_type: "yes_no_unknown",
      options: consideredOptions("fin07.temp_blocking"),
      evidence_to_review: ["procedimiento de bloqueo"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de bloqueo",
          review_guide: "El procedimiento debe permitir bloquear los datos cuando no resulte posible actualizarlos oportunamente después de la comunicación pertinente. El bloqueo es una medida temporal mientras se actualiza la información y no equivale por sí solo a supresión definitiva.",
          no_evidence_guidance: "Si no existe una capacidad de bloqueo ante retrasos de actualización, el requisito no queda acreditado. Debe distinguirse una ausencia de procedimiento comprobada de una capacidad que todavía no ha podido verificarse.",
          expected_result: "Un mecanismo verificable de bloqueo temporal hasta que se complete la actualización de los datos correspondientes.",
        },
      ],
      required_facts: [],
      default_next_node_key: "scope-select",
      provenance: "legal_requirement",
    },
    {
      node_key: "scope-select",
      node_type: "question",
      title: "Determinación del ámbito",
      prompt: "¿El tratamiento queda dentro del ámbito material del Título III?",
      why_it_matters:
        "Determinar el ámbito no se reduce a un booleano mecánico: es juicio profesional sobre el análisis anterior.",
      fact_key: SCOPE,
      answer_type: "single_select",
      options: [
        {
          value: "in_scope",
          label: "Dentro del ámbito",
          description: "Juicio profesional: el tratamiento queda materialmente dentro del Título III.",
          fact_effect: { fact_key: SCOPE, value: "in_scope" },
        },
        {
          value: "out_of_scope",
          label: "Fuera del ámbito",
          description: "Juicio profesional: el tratamiento no queda dentro del ámbito material.",
          fact_effect: { fact_key: SCOPE, value: "out_of_scope" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: SCOPE, value: "unknown" },
        },
      ],
      evidence_to_review: ["matriz de inclusiones y exclusiones"],
      evidence_review_help: [
        {
          evidence_item: "matriz de inclusiones y exclusiones",
          review_guide: "La matriz debe permitir adoptar una conclusión sobre si las categorías y operaciones de la finalidad están materialmente comprendidas en el Título III. Una conclusión fuera de ámbito puede estar fundada incluso si D2 consideró preliminarmente el artículo 13 letra a).",
          no_evidence_guidance: "Cuando falten antecedentes esenciales para decidir el ámbito, la evaluación debe permanecer indeterminada. La ausencia de respaldo no equivale a una conclusión profesional de fuera de ámbito.",
          expected_result: "Una determinación fundada de `in_scope` u `out_of_scope`, sustentada en las inclusiones, exclusiones y operaciones evaluadas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "requirements-select",
      provenance: "legal_requirement",
    },
    {
      node_key: "requirements-select",
      node_type: "question",
      title: "Determinación de requisitos",
      prompt:
        "Dentro del ámbito: ¿las operaciones vinculadas respetan las restricciones de los arts. 17, 18 y 19?",
      why_it_matters:
        "Estar dentro del ámbito no equivale a cumplir los requisitos.",
      fact_key: REQUIREMENTS,
      answer_type: "single_select",
      options: [
        {
          value: "satisfied",
          label: "Requisitos cumplidos",
          description: "Juicio profesional: se respetan las restricciones aplicables.",
          fact_effect: { fact_key: REQUIREMENTS, value: "satisfied" },
        },
        {
          value: "remediation_required",
          label: "Requiere remediación",
          description: "Juicio profesional: existen brechas en restricciones aplicables.",
          fact_effect: { fact_key: REQUIREMENTS, value: "remediation_required" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: REQUIREMENTS, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "procedimiento de prescripción y supresión",
        "reglas de antigüedad",
        "procedimiento de pago y extinción",
        "procedimiento de actualización",
        "procedimiento de bloqueo",
      ],
      evidence_review_help: [
        {
          evidence_item: "procedimiento de prescripción y supresión",
          review_guide: "La revisión debe comprobar que el tratamiento cuenta con capacidad para suprimir de oficio la información relativa a obligaciones prescritas. Estar dentro del ámbito del Título III no demuestra automáticamente que este requisito se cumpla.",
          no_evidence_guidance: "Si la supresión oficiosa no puede verificarse, el requisito permanece pendiente de acreditación. Si se constata que el mecanismo es insuficiente, corresponde identificar una brecha de remediación.",
          expected_result: "Una conclusión documentada sobre el cumplimiento o la deficiencia de la supresión de información prescrita.",
        },
        {
          evidence_item: "reglas de antigüedad",
          review_guide: "Las reglas deben permitir comprobar el límite de cinco años desde la exigibilidad y su efecto sobre la comunicación de información. La evaluación debe considerar este límite independientemente de otras condiciones, como pago o extinción.",
          no_evidence_guidance: "Si no se conoce cómo se aplica el límite temporal, no debe presumirse su cumplimiento. Una deficiencia comprobada debe distinguirse de la ausencia de información suficiente.",
          expected_result: "Una evaluación del cumplimiento del límite de antigüedad previsto en el artículo 18.",
        },
        {
          evidence_item: "procedimiento de pago y extinción",
          review_guide: "El procedimiento debe asegurar que no se continúe comunicando información después del pago o extinción por otro modo legal, preservando el supuesto judicial específico cuando corresponda. La subsistencia de otros efectos jurídicos de los datos no elimina esta restricción.",
          no_evidence_guidance: "Si no puede comprobarse cómo se impide la comunicación posterior, la condición permanece sin acreditar. Cuando se detecte una comunicación incompatible, corresponde documentar la brecha concreta.",
          expected_result: "Una evaluación sustentada de las restricciones de comunicación aplicables tras el pago o extinción.",
        },
        {
          evidence_item: "procedimiento de actualización",
          review_guide: "La revisión debe integrar el aviso del acreedor, la alternativa de requerimiento del deudor y la actualización de datos provenientes de una fuente accesible al público, según corresponda a los actores involucrados. Los deberes y plazos de cada supuesto deben permanecer diferenciados.",
          no_evidence_guidance: "Si el procedimiento no permite comprobar responsabilidades o plazos aplicables, la evaluación queda incompleta o requiere remediación según la deficiencia acreditada. No debe suponerse que un único mecanismo satisface automáticamente todas las obligaciones.",
          expected_result: "Una conclusión documentada sobre las capacidades de aviso y actualización exigibles al tratamiento y sus actores pertinentes.",
        },
        {
          evidence_item: "procedimiento de bloqueo",
          review_guide: "El mecanismo debe permitir suspender temporalmente el tratamiento de los datos cuando la actualización de información procedente de la fuente pública no pueda realizarse oportunamente. Debe comprobarse que el bloqueo se mantenga hasta que la información quede actualizada.",
          no_evidence_guidance: "Cuando esta capacidad no pueda verificarse, el cumplimiento permanece pendiente. Si el procedimiento carece de una respuesta ante retrasos de actualización, debe identificarse la deficiencia correspondiente.",
          expected_result: "Una evaluación documentada de la capacidad de bloqueo temporal exigida por el artículo 19.",
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
        "¿El ámbito y los requisitos están verificados y documentados con respaldo suficiente para adoptar la conclusión profesional?",
      why_it_matters:
        "Solo con el análisis documentado existe base para concluir.",
      fact_key: READY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        READY,
        "Ámbito, restricciones, hechos relevantes, alternativas y conclusión preliminar están documentados.",
      ),
      evidence_to_review: ["Reasoning Record del Título III"],
      evidence_review_help: [
        {
          evidence_item: "Reasoning Record del Título III",
          review_guide: "El análisis debe integrar la ruta candidata de D2, la naturaleza de las obligaciones, las inclusiones y exclusiones del artículo 17 y las restricciones de los artículos 18 y 19. Debe justificar separadamente la determinación de ámbito y la evaluación de requisitos.",
          no_evidence_guidance: "Si faltan antecedentes que puedan modificar una de las dos determinaciones, la evaluación debe permanecer incompleta. No corresponde confundir una conclusión de fuera de ámbito con una brecha de requisitos.",
          expected_result: "Un razonamiento profesional suficientemente respaldado para concluir sobre el ámbito material y, cuando corresponda, sobre el cumplimiento de sus restricciones.",
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
        "¿Cuál conclusión profesional adoptas sobre el ámbito y requisitos del Título III de esta finalidad?",
      why_it_matters:
        "Estar dentro del ámbito no equivale a cumplir los requisitos: adóptalos por separado.",
      fact_key: DRAFT,
      answer_type: "single_select",
      options: [
        {
          value: "titleIII_out_of_scope",
          label: "Fuera del ámbito",
          description:
            "Juicio profesional: el tratamiento no queda dentro del ámbito material del Título III.",
          fact_effect: { fact_key: DRAFT, value: "titleIII_out_of_scope" },
        },
        {
          value: "titleIII_in_scope_requirements_satisfied",
          label: "Dentro del ámbito, requisitos cumplidos",
          description:
            "Juicio profesional: dentro del ámbito y con restricciones respetadas.",
          fact_effect: { fact_key: DRAFT, value: "titleIII_in_scope_requirements_satisfied" },
        },
        {
          value: "titleIII_in_scope_remediation_required",
          label: "Dentro del ámbito, requiere remediación",
          description:
            "Juicio profesional: dentro del ámbito pero con brechas en restricciones.",
          fact_effect: { fact_key: DRAFT, value: "titleIII_in_scope_remediation_required" },
        },
      ],
      evidence_to_review: ["Reasoning Record del Título III"],
      evidence_review_help: [
        {
          evidence_item: "Reasoning Record del Título III",
          review_guide: "La conclusión debe ser coherente con la determinación de ámbito y el estado de los requisitos, respetando las tres combinaciones permitidas. El ReasoningRecord debe considerar todos los datos vinculados y reflejar las exclusiones, procedimientos, plazos y alternativas relevantes.",
          no_evidence_guidance: "Cuando existan vacíos materiales en el razonamiento, la conclusión debe mantenerse pendiente. Una determinación fuera de ámbito exige fundamento propio y no modifica automáticamente la ruta registrada en D2.",
          expected_result: "Un ReasoningRecord completo y trazable que fundamente una de las tres conclusiones profesionales válidas, sin registrar información financiera individual.",
        },
      ],
      help_text: [
        "Out_of_scope puede concluirse aunque D2 haya seleccionado preliminarmente la ruta: eso no modifica D2 automáticamente.",
      ],
      required_facts: [CANDIDATE, ITEMS, READY],
    },
  ],
  outcomes: [
    {
      outcome_key: "titleIII_out_of_scope",
      label: "Fuera del ámbito material",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: el tratamiento no queda dentro del ámbito material del Título III. Revisa nuevamente la vía de licitud en D2.05.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "financial.titleIII_scope_status", value: "out_of_scope" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Revisar la vía de licitud en D2.05",
          activity_key: "lawful_basis.assign",
        },
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con el análisis de ámbito. D2.05 no se modifica automáticamente.",
        },
      ],
    },
    {
      outcome_key: "titleIII_in_scope_requirements_satisfied",
      label: "Dentro del ámbito, requisitos cumplidos",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: dentro del ámbito material y con las restricciones de los arts. 17, 18 y 19 respetadas.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "financial.titleIII_scope_status", value: "in_scope" },
        { fact_key: "financial.titleIII_requirements_status", value: "satisfied" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con ámbito, inclusiones, exclusiones, arts. 17 a 19 y conclusión.",
        },
      ],
    },
    {
      outcome_key: "titleIII_in_scope_remediation_required",
      label: "Dentro del ámbito, requiere remediación",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: dentro del ámbito material pero con brechas en restricciones que requieren remediación.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "financial.titleIII_scope_status", value: "in_scope" },
        { fact_key: "financial.titleIII_requirements_status", value: "remediation_required" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Remediar las brechas detectadas",
          note: "Atiende cada restricción pendiente y vuelve a evaluar antes de sostener la ruta.",
        },
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o sin información suficiente. Esto no es una conclusión sobre el ámbito.",
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
        "El contexto de licitud D2 es insuficiente o ambiguo para esta finalidad.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Determinar la base en D2.05",
          activity_key: "lawful_basis.assign",
        },
      ],
    },
    {
      outcome_key: "regime_not_indicated",
      label: "Régimen no indicado",
      classification: "agency_standard",
      explanation:
        "Otra ruta jurídica está afirmada para esta finalidad. No es una conclusión sobre el Título III ni marca la actividad como no aplicable.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Si la ruta de licitud cambia, esta revisión puede corresponder en el futuro.",
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
