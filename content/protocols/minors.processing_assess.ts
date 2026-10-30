import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D5.04.
 *
 * activity_key = minors.processing_assess (decision, purpose scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * reglas, categorías, evidencia y state effect del contenido
 * canónico D5.04. Sin taxonomía técnica de edades: las categorías y
 * umbrales legales se preservan en guidance; la población se captura
 * con answers abstractos (presencia por categoría), nunca personas,
 * edades ni identidades reales.
 *
 * Reglas preservadas:
 * - candidate del perfil (involvesMinors); sin derivar desde datos;
 * - precondición estructural: ≥1 dato vinculado y todos con
 *   sensitive != unknown (la subregla <16 lo exige);
 * - subregla sensibles <16 solo exigible con sensitive=yes
 *   vinculado; sensitive=yes no concluye edad ni población;
 * - sin dependency rígida a D5.01 (no todo dato NNA es sensible).
 */

const CANDIDATE = "derived.purpose.d5_minors_candidate";
const ITEMS = "minors04.items_reviewed";
const READY = "minors04.analysis_ready";
const DRAFT = "minors04.working_conclusion";

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function consideredOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Analizada con respaldo",
      description: "La regla fue analizada con respaldo revisable (aplica o descartada fundadamente).",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No analizada",
      description: "La regla aún no ha sido analizada.",
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

function presenceOptions(factKey: string, groupLabel: string) {
  return [
    {
      value: "yes",
      label: "Sí, presente",
      description: `${groupLabel} está presente en esta finalidad.`,
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No presente",
      description: `${groupLabel} no está presente en esta finalidad.`,
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

export const MINORS_PROCESSING_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "minors.processing_assess.v1",
  activity_key: "minors.processing_assess",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada del tratamiento de datos de NNA",
  description:
    "Estructura el análisis del art. 16 quáter para la finalidad activa: interés superior, autonomía progresiva, autorización por categoría, subregla de sensibles de adolescentes, diseño de distinción, protección reforzada y obligaciones educativas.",
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
        "El sistema verifica si la finalidad declara dirigirse a población de niños, niñas o adolescentes o involucrarla.",
      answer_type: "none",
      required_facts: [CANDIDATE],
      transitions: [
        {
          rule_id: "candidate-yes",
          description: "La finalidad involucra población NNA.",
          when: isYes(CANDIDATE),
          goto_node_key: "items-review",
          explanation:
            "La finalidad declara población de niños, niñas o adolescentes: corresponde el análisis del art. 16 quáter.",
        },
        {
          rule_id: "candidate-no",
          description: "La finalidad declara no involucrar población NNA.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "Sin población NNA involucrada esta revisión no está indicada.",
        },
        {
          rule_id: "fallback-classification",
          description: "Sin declaración no inicia el análisis.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "classification_incomplete",
          explanation:
            "Declara si la finalidad involucra población NNA antes del análisis jurídico.",
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
        "La subregla de sensibles de adolescentes exige conocer la sensibilidad del universo vinculado.",
      fact_key: ITEMS,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        ITEMS,
        "Los datos vinculados y su clasificación fueron revisados.",
      ),
      evidence_to_review: [
        "descripción de la finalidad",
        "mapeo dato-finalidad disponible",
        "clasificación estructural de los datos",
      ],
      evidence_review_help: [
        {
          evidence_item: "descripción de la finalidad",
          review_guide: "La finalidad debe permitir comprender por qué se tratan datos de niños, niñas o adolescentes y qué resultado persigue el proceso. Su descripción debe ser suficientemente precisa para evaluar las reglas de autorización y protección aplicables.",
          no_evidence_guidance: "Cuando el propósito no esté claramente definido, corresponde aclarar el uso real de los datos antes de evaluar su cumplimiento. Una finalidad genérica no permite determinar por sí sola qué condiciones especiales corresponden.",
          expected_result: "Una finalidad documentada y específica, que permita establecer cómo interviene la población NNA y qué reglas requieren evaluación.",
        },
        {
          evidence_item: "mapeo dato-finalidad disponible",
          review_guide: "La relación entre datos y finalidad debe reflejar las categorías efectivamente utilizadas y permitir identificar aquellas que puedan ser sensibles. Interesa comprobar que la evaluación cubra los datos vinculados al proceso, no solamente una selección parcial.",
          no_evidence_guidance: "Ante un mapeo incompleto, las categorías pendientes deben identificarse y contrastarse con el funcionamiento del tratamiento. No corresponde presumir que los datos omitidos son irrelevantes para el régimen NNA.",
          expected_result: "Un mapeo verificable y suficientemente completo que permita relacionar categorías de datos, finalidad y posibles reglas especiales.",
        },
        {
          evidence_item: "clasificación estructural de los datos",
          review_guide: "La clasificación debe distinguir los datos sensibles de los no sensibles según su naturaleza y el marco legal aplicable. La revisión resulta necesaria para determinar si puede activarse la regla particular de adolescentes menores de dieciséis años.",
          no_evidence_guidance: "Si la sensibilidad de alguna categoría permanece indeterminada, corresponde aclararla antes de adoptar conclusiones que dependan de esa condición. La clasificación del dato no debe utilizarse para inferir edades o identidades.",
          expected_result: "Categorías vinculadas con su sensibilidad suficientemente determinada para evaluar las reglas de autorización que correspondan.",
        },
      ],
      required_facts: [],
      default_next_node_key: "children-present",
      provenance: "agency_standard",
    },
    {
      node_key: "children-present",
      node_type: "question",
      title: "Presencia de niños y niñas",
      prompt:
        "¿La finalidad involucra niños o niñas bajo el umbral legal (categoría abstracta del tratamiento, sin edades ni identidades reales)?",
      why_it_matters:
        "Los niños y niñas exigen consentimiento parental, representativo o de cuidado personal salvo norma expresa.",
      fact_key: "minors04.children_present",
      answer_type: "yes_no_unknown",
      options: presenceOptions(
        "minors04.children_present",
        "Población de niños y niñas",
      ),
      evidence_to_review: [
        "diseño del proceso",
        "reglas de segmentación y autorización",
      ],
      evidence_review_help: [
        {
          evidence_item: "diseño del proceso",
          review_guide: "El diseño debe permitir determinar si la finalidad contempla población comprendida en la categoría legal de niños y niñas. La evaluación se realiza sobre las características generales del proceso, sin necesitar identidades ni edades individuales.",
          no_evidence_guidance: "Si el proceso no distingue qué población involucra, la presencia de niños y niñas debe permanecer por determinar. No resulta correcto inferir esa presencia únicamente por el nombre del producto o servicio.",
          expected_result: "Una determinación documentada sobre la presencia o ausencia de niños y niñas dentro de la finalidad evaluada.",
        },
        {
          evidence_item: "reglas de segmentación y autorización",
          review_guide: "Las reglas deben permitir reconocer cuándo corresponde aplicar el régimen de niños y niñas y qué autorización exige esa categoría. Es importante que la diferenciación utilice los criterios legales sin crear una clasificación paralela.",
          no_evidence_guidance: "Si las reglas no permiten distinguir esta población, la aplicabilidad permanece pendiente de aclaración. La ausencia de segmentación verificable no demuestra que no existan niños o niñas involucrados.",
          expected_result: "Criterios documentados para reconocer la categoría de niños y niñas y aplicar la autorización que corresponda.",
        },
      ],
      required_facts: [],
      default_next_node_key: "adolescents-present",
      provenance: "agency_standard",
    },
    {
      node_key: "adolescents-present",
      node_type: "question",
      title: "Presencia de adolescentes",
      prompt:
        "¿La finalidad involucra adolescentes (categoría abstracta, sin edades ni identidades reales)?",
      why_it_matters:
        "Los adolescentes siguen reglas de autorización propias y la subregla especial de sensibles.",
      fact_key: "minors04.adolescents_present",
      answer_type: "yes_no_unknown",
      options: presenceOptions(
        "minors04.adolescents_present",
        "Población adolescente",
      ),
      evidence_to_review: [
        "diseño del proceso",
        "reglas de segmentación y autorización",
      ],
      evidence_review_help: [
        {
          evidence_item: "diseño del proceso",
          review_guide: "La revisión debe establecer si el proceso contempla población adolescente según las categorías legales. La determinación debe considerar a quién se dirige o involucra la finalidad, sin incorporar edades reales al workspace.",
          no_evidence_guidance: "Cuando el diseño no permita conocer la población involucrada, la presencia de adolescentes queda sin determinar. No debe asumirse su ausencia por falta de registros específicos.",
          expected_result: "Una conclusión documentada sobre la presencia o ausencia de población adolescente en el tratamiento.",
        },
        {
          evidence_item: "reglas de segmentación y autorización",
          review_guide: "Los criterios de segmentación deben permitir reconocer la población adolescente y diferenciar sus reglas generales de autorización de las reglas aplicables a niños y niñas. La subregla de sensibles de menores de dieciséis años requiere una comprobación adicional.",
          no_evidence_guidance: "Si no existe una distinción verificable, las reglas aplicables deben mantenerse pendientes de evaluación. La categoría adolescente no debe tratarse automáticamente como equivalente a la de niños y niñas.",
          expected_result: "Un criterio de identificación abstracta de la población adolescente que permita aplicar sus reglas generales y detectar posibles condiciones especiales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "adolescent-sensitive-u16",
      provenance: "agency_standard",
    },
    {
      node_key: "adolescent-sensitive-u16",
      node_type: "question",
      title: "Sensibles de adolescentes menores de 16",
      prompt:
        "¿La finalidad involucra datos sensibles de adolescentes menores de dieciséis años (determinación profesional abstracta, sin datos reales)?",
      why_it_matters:
        "Esta subregla exige autorización parental, representativa o de cuidado personal salvo norma expresa.",
      fact_key: "minors04.adolescent_sensitive_u16",
      answer_type: "yes_no_unknown",
      options: presenceOptions(
        "minors04.adolescent_sensitive_u16",
        "Datos sensibles de adolescentes menores de dieciséis años",
      ),
      evidence_to_review: [
        "diseño de consentimiento",
        "autorización o mandato legal cuando se invoque",
      ],
      evidence_review_help: [
        {
          evidence_item: "diseño de consentimiento",
          review_guide: "La evaluación debe determinar si la finalidad involucra datos sensibles de adolescentes menores de dieciséis años y si el mecanismo previsto contempla la autorización exigida para ese supuesto. La presencia de un dato sensible no demuestra por sí sola la categoría poblacional.",
          no_evidence_guidance: "Si no puede establecerse la concurrencia de ambos elementos, población y sensibilidad, la subregla permanece pendiente de determinación. No debe presumirse aplicable ni descartarse únicamente por la clasificación de los datos.",
          expected_result: "Una determinación fundamentada sobre si corresponde aplicar la subregla especial, sin almacenar información identificatoria de adolescentes.",
        },
        {
          evidence_item: "autorización o mandato legal cuando se invoque",
          review_guide: "Cuando se invoque una excepción a la autorización de representantes o responsables del cuidado personal, debe comprobarse que exista una autorización o mandato legal expreso. Esta revisión no sustituye la determinación previa de si el supuesto de datos sensibles de menores de dieciséis años está presente.",
          no_evidence_guidance: "Si la norma invocada no está identificada, la excepción legal permanece sin acreditar. La ausencia de norma no permite determinar por sí sola si esta población participa en la finalidad.",
          expected_result: "Una evaluación que distinga la presencia de la subregla y la existencia de una eventual habilitación legal expresa.",
        },
      ],
      help_text: [
        "Un dato clasificado como sensible no determina por sí solo edad ni población: esta determinación es profesional y separada.",
      ],
      required_facts: [],
      default_next_node_key: "superior-interest",
      provenance: "legal_requirement",
    },
    {
      node_key: "superior-interest",
      node_type: "question",
      title: "Interés superior",
      prompt: "¿Se evaluó el interés superior de niños, niñas o adolescentes en el tratamiento?",
      why_it_matters:
        "El interés superior condiciona todo el régimen de tratamiento de NNA.",
      fact_key: "minors04.superior_interest",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.superior_interest"),
      evidence_to_review: ["análisis profesional"],
      evidence_review_help: [
        {
          evidence_item: "análisis profesional",
          review_guide: "El análisis debe considerar cómo la finalidad y sus operaciones afectan los derechos y bienestar de los niños, niñas o adolescentes involucrados. Interesa comprobar que el interés superior haya sido valorado de manera concreta y no solo mencionado como principio general.",
          no_evidence_guidance: "Si no existe una evaluación fundada, corresponde identificar los efectos relevantes del tratamiento y los antecedentes que faltan para valorarlos. La presencia de una política general de privacidad no acredita automáticamente esta consideración.",
          expected_result: "Una evaluación documentada que permita explicar de qué manera el tratamiento atiende al interés superior de la población NNA involucrada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "progressive-autonomy",
      provenance: "legal_requirement",
    },
    {
      node_key: "progressive-autonomy",
      node_type: "question",
      title: "Autonomía progresiva",
      prompt: "¿Se evaluó el respeto de la autonomía progresiva según la categoría involucrada?",
      why_it_matters:
        "La autonomía progresiva modula la intervención según el desarrollo.",
      fact_key: "minors04.progressive_autonomy",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.progressive_autonomy"),
      evidence_to_review: ["análisis profesional"],
      evidence_review_help: [
        {
          evidence_item: "análisis profesional",
          review_guide: "La evaluación debe explicar cómo se respeta la autonomía progresiva según la población involucrada y las características del tratamiento. Su aplicación debe ser coherente con las reglas legales de autorización, sin sustituirlas por criterios informales.",
          no_evidence_guidance: "Cuando no se haya considerado este principio, corresponde registrar la evaluación pendiente y aclarar cómo influye en el proceso. No basta con asumir que toda intervención de un representante resuelve automáticamente la autonomía progresiva.",
          expected_result: "Un razonamiento documentado sobre el respeto de la autonomía progresiva y su relación con las autorizaciones aplicables.",
        },
      ],
      required_facts: [],
      default_next_node_key: "children-consent",
      provenance: "legal_requirement",
    },
    {
      node_key: "children-consent",
      node_type: "question",
      title: "Autorización para niños y niñas",
      prompt:
        "Para niños y niñas: ¿se verificó consentimiento de padres, representantes legales o cuidado personal, salvo autorización o mandato legal expreso?",
      why_it_matters:
        "Sin autorización válida o norma expresa el tratamiento de niños y niñas no se sostiene.",
      fact_key: "minors04.children_consent",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.children_consent"),
      evidence_to_review: [
        "diseño de consentimiento",
        "autorización o mandato legal",
      ],
      evidence_review_help: [
        {
          evidence_item: "diseño de consentimiento",
          review_guide: "El mecanismo debe contemplar consentimiento de los padres, representantes legales o quien tenga el cuidado personal del niño o niña, salvo habilitación legal expresa. Es necesario evaluar cómo se establece que la autorización proviene de una persona habilitada, sin almacenar datos reales en Nexo DPO.",
          no_evidence_guidance: "Si el diseño no permite comprobar la autorización exigida, esta condición no queda acreditada. La posibilidad de obtener consentimiento directamente del niño o niña no sustituye por sí sola la regla legal.",
          expected_result: "Un mecanismo de consentimiento evaluado conforme a la categoría de niños y niñas, con criterios verificables sobre quién puede autorizar el tratamiento.",
        },
        {
          evidence_item: "autorización o mandato legal",
          review_guide: "La disposición invocada debe autorizar o mandar expresamente el tratamiento sin el consentimiento previsto para niños y niñas. Su alcance debe corresponder a la finalidad y a las operaciones realmente evaluadas.",
          no_evidence_guidance: "Cuando no pueda identificarse una norma legal expresa, esta excepción no debe considerarse acreditada. La existencia de instrucciones internas o autorización administrativa genérica no sustituye el fundamento legal exigido.",
          expected_result: "Una norma habilitante identificada y aplicable, o una conclusión documentada de que la vía excepcional no quedó acreditada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "adolescent-rules",
      provenance: "legal_requirement",
    },
    {
      node_key: "adolescent-rules",
      node_type: "question",
      title: "Reglas para adolescentes",
      prompt:
        "Para adolescentes: ¿se evaluaron las reglas de autorización aplicables conforme al régimen previsto, preservando categorías y umbrales legales?",
      why_it_matters:
        "Las categorías y umbrales legales no se reformulan en taxonomías técnicas.",
      fact_key: "minors04.adolescent_rules",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.adolescent_rules"),
      evidence_to_review: [
        "reglas de segmentación y autorización",
        "autorización o mandato legal cuando se invoque",
      ],
      evidence_review_help: [
        {
          evidence_item: "reglas de segmentación y autorización",
          review_guide: "La evaluación debe comprobar que las reglas generales de autorización previstas para adultos se apliquen a adolescentes cuando corresponda. Es necesario mantener separada la excepción relativa a datos sensibles de adolescentes menores de dieciséis años.",
          no_evidence_guidance: "Cuando no se distingan las condiciones generales de la subregla especial, la evaluación permanece incompleta. No debe extenderse automáticamente la exigencia de consentimiento parental a todo tratamiento de datos de adolescentes.",
          expected_result: "Reglas de autorización verificables que respeten el régimen general de adolescentes y permitan reconocer la excepción para datos sensibles.",
        },
        {
          evidence_item: "autorización o mandato legal cuando se invoque",
          review_guide: "Si el tratamiento se apoya en una autorización o mandato legal, la disposición debe identificarse y relacionarse con la finalidad concreta. Su procedencia debe analizarse conforme al régimen que corresponda a la categoría adolescente involucrada.",
          no_evidence_guidance: "Sin una norma verificable, no es posible considerar acreditada esa habilitación. La insuficiencia debe quedar documentada sin atribuir automáticamente una autorización parental que la ley no exige en todos los casos.",
          expected_result: "Una evaluación de la autorización legal invocada que distinga su alcance y la regla aplicable a la población adolescente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "adolescent-sensitive-rule",
      provenance: "legal_requirement",
    },
    {
      node_key: "adolescent-sensitive-rule",
      node_type: "question",
      title: "Subregla de sensibles <16",
      prompt:
        "Cuando aplica la subregla de sensibles de adolescentes menores de dieciséis: ¿se verificó autorización parental, representativa o de cuidado personal, salvo autorización o mandato legal expreso, e identificación de la norma invocada?",
      why_it_matters:
        "La subregla combina dato sensible con población adolescente menor de dieciséis años.",
      fact_key: "minors04.adolescent_sensitive_rule",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.adolescent_sensitive_rule"),
      evidence_to_review: [
        "diseño de consentimiento",
        "autorización o mandato legal",
      ],
      evidence_review_help: [
        {
          evidence_item: "diseño de consentimiento",
          review_guide: "Cuando se traten datos sensibles de adolescentes menores de dieciséis años, el mecanismo debe contemplar consentimiento de padres, representantes legales o quien tenga el cuidado personal, salvo norma expresa. La evaluación debe verificar tanto el supuesto especial como la autorización correspondiente.",
          no_evidence_guidance: "Si no puede demostrarse la autorización requerida para un supuesto efectivamente aplicable, la condición permanece sin acreditar. Cuando se desconozca si concurren edad y sensibilidad, corresponde mantener la evaluación pendiente.",
          expected_result: "Un mecanismo de autorización adecuado a la subregla especial, con respaldo suficiente de su aplicación cuando corresponda.",
        },
        {
          evidence_item: "autorización o mandato legal",
          review_guide: "La excepción requiere una ley que autorice o mande expresamente el tratamiento de datos sensibles en el supuesto evaluado. Es necesario comprobar que la disposición invocada corresponda a la finalidad y no constituya solo una habilitación general.",
          no_evidence_guidance: "Sin una norma expresa identificable, esta excepción no puede darse por acreditada. Si se pretende recurrir a otra vía, sus requisitos deben evaluarse sin presumir que sustituye la autorización especial.",
          expected_result: "Una habilitación legal expresa comprobada para el supuesto especial, o un descarte fundamentado de esta alternativa.",
        },
      ],
      required_facts: [],
      default_next_node_key: "authorization-norm",
      provenance: "legal_requirement",
    },
    {
      node_key: "authorization-norm",
      node_type: "question",
      title: "Norma de autorización",
      prompt:
        "Si se invoca autorización o mandato legal: ¿se identificó la norma legal correspondiente?",
      why_it_matters:
        "Sin norma identificada la excepción por autorización no puede invocarse.",
      fact_key: "minors04.authorization_norm",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.authorization_norm"),
      evidence_to_review: ["autorización o mandato legal"],
      evidence_review_help: [
        {
          evidence_item: "autorización o mandato legal",
          review_guide: "La referencia normativa debe permitir identificar la disposición legal y comprobar que autoriza o manda expresamente el tratamiento correspondiente. Cuando resulte útil, el texto puede contrastarse con la publicación oficial disponible en Ley Chile.",
          no_evidence_guidance: "Si la norma no puede identificarse con precisión, la excepción permanece sin acreditar. No corresponde reemplazar la referencia legal por una práctica habitual o una decisión interna de la organización.",
          expected_result: "Una norma concreta y verificable, con fundamento de su aplicabilidad al tratamiento de NNA evaluado.",
        },
      ],
      help_text: [
        "No existe catálogo cerrado: identifica la norma realmente invocada.",
      ],
      required_facts: [],
      default_next_node_key: "operational-design",
      provenance: "legal_requirement",
    },
    {
      node_key: "operational-design",
      node_type: "question",
      title: "Diseño de distinción",
      prompt:
        "¿Se verificó que existe diseño o procedimiento para distinguir correctamente las reglas anteriores sin almacenar edades o identidades reales?",
      why_it_matters:
        "Aplicar la regla correcta exige distinguir categorías sin registrar datos reales de menores.",
      fact_key: "minors04.operational_design",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.operational_design"),
      evidence_to_review: [
        "diseño del proceso",
        "reglas de segmentación y autorización",
      ],
      evidence_review_help: [
        {
          evidence_item: "diseño del proceso",
          review_guide: "El proceso debe permitir aplicar las reglas jurídicas correspondientes a niños, niñas, adolescentes y al supuesto especial de sensibles de menores de dieciséis años. Interesa comprobar que las decisiones previstas distingan esos casos sin incorporar datos individuales al workspace de cumplimiento.",
          no_evidence_guidance: "Si el diseño no contempla diferencias relevantes entre las categorías, corresponde identificar los ajustes necesarios. La ausencia de esa distinción no debe resolverse creando registros de menores dentro de Nexo DPO.",
          expected_result: "Un procedimiento capaz de aplicar las reglas de autorización pertinentes a cada supuesto legal mediante criterios abstractos y verificables.",
        },
        {
          evidence_item: "reglas de segmentación y autorización",
          review_guide: "Las reglas deben vincular cada categoría legal con la autorización que corresponde y contemplar el supuesto de datos sensibles de adolescentes menores de dieciséis años. La clasificación debe responder al texto legal y no a umbrales técnicos inventados.",
          no_evidence_guidance: "Cuando las reglas presenten vacíos o contradicciones, su aplicación debe permanecer pendiente de aclaración. No corresponde inferir categorías poblacionales únicamente a partir de los datos sensibles vinculados.",
          expected_result: "Una distinción documentada entre supuestos legales y autorizaciones aplicables, coherente con la finalidad y las categorías de datos tratadas.",
        },
      ],
      required_facts: [],
      default_next_node_key: "reinforced-protection",
      provenance: "legal_requirement",
    },
    {
      node_key: "reinforced-protection",
      node_type: "question",
      title: "Protección reforzada",
      prompt:
        "¿Se verificaron los mecanismos destinados al uso lícito y la protección reforzada de la información de NNA?",
      why_it_matters:
        "La protección reforzada es exigible más allá de la autorización inicial.",
      fact_key: "minors04.reinforced_protection",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.reinforced_protection"),
      evidence_to_review: [
        "políticas para niños, niñas y adolescentes",
        "controles",
      ],
      evidence_review_help: [
        {
          evidence_item: "políticas para niños, niñas y adolescentes",
          review_guide: "Las políticas deben establecer criterios de uso lícito y protección de la información personal de NNA acordes con los riesgos y características del tratamiento. Una declaración genérica de compromiso no permite comprobar por sí sola la aplicación de medidas efectivas.",
          no_evidence_guidance: "Si no existen criterios específicos o los disponibles resultan insuficientes, corresponde documentar las deficiencias y las medidas que requieren evaluación. No debe asumirse que una política general garantiza por sí sola la protección reforzada.",
          expected_result: "Criterios institucionales verificables para resguardar el uso lícito y la protección especial de los datos personales de NNA.",
        },
        {
          evidence_item: "controles",
          review_guide: "Los controles deben ser pertinentes a la información de NNA tratada y a los riesgos identificados, considerando medidas de acceso, uso y protección cuando correspondan. La evaluación debe distinguir controles definidos de aquellos cuya aplicación está respaldada.",
          no_evidence_guidance: "Cuando no pueda verificarse la existencia o aplicación de controles relevantes, la protección reforzada permanece pendiente de acreditación. Las brechas deben identificarse sin incorporar información personal de menores.",
          expected_result: "Medidas de protección justificadas y verificables, adecuadas al tratamiento evaluado y sus riesgos para NNA.",
        },
      ],
      required_facts: [],
      default_next_node_key: "education-obligations",
      provenance: "legal_requirement",
    },
    {
      node_key: "education-obligations",
      node_type: "question",
      title: "Establecimientos y entidades",
      prompt:
        "Cuando intervienen establecimientos educacionales u otras entidades o personas que tratan o administran estos datos: ¿se verificó cómo cumplen su obligación especial de protección?",
      why_it_matters:
        "Estas entidades cargan con una obligación especial de protección.",
      fact_key: "minors04.education_obligations",
      answer_type: "yes_no_unknown",
      options: consideredOptions("minors04.education_obligations"),
      evidence_to_review: ["procedimiento educativo cuando corresponda"],
      evidence_review_help: [
        {
          evidence_item: "procedimiento educativo cuando corresponda",
          review_guide: "Cuando participen establecimientos educacionales u otras personas o entidades que traten o administren datos de NNA, debe examinarse cómo resguardan su uso lícito y protección. La obligación especial no se limita a instituciones educativas ni desaparece por delegar operaciones a terceros.",
          no_evidence_guidance: "Si no está claro qué entidades intervienen o qué medidas aplican, corresponde mantener pendiente esa comprobación. La evaluación debe distinguir obligaciones efectivamente relevantes de actores que no participan en el tratamiento.",
          expected_result: "Una evaluación documentada de los mecanismos de protección de las entidades intervinientes, de acuerdo con la obligación especial prevista en el artículo 16 quáter.",
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
        "¿Las reglas aplicables están verificadas y documentadas con respaldo suficiente para adoptar la conclusión profesional?",
      why_it_matters:
        "Solo con las reglas verificadas existe base para concluir.",
      fact_key: READY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        READY,
        "Las reglas aplicables, hechos relevantes, alternativas descartadas y conclusión preliminar están documentados.",
      ),
      evidence_to_review: ["análisis profesional"],
      evidence_review_help: [
        {
          evidence_item: "análisis profesional",
          review_guide: "El análisis debe integrar las categorías poblacionales, la sensibilidad de los datos, las autorizaciones aplicables y los principios de interés superior y autonomía progresiva. También debe considerar la protección reforzada y las obligaciones especiales pertinentes al tratamiento.",
          no_evidence_guidance: "Cuando falten antecedentes capaces de afectar la conclusión, la evaluación debe permanecer incompleta. La ausencia de información no constituye por sí sola fundamento suficiente para declarar incumplido el régimen.",
          expected_result: "Un análisis jurídico integral y documentado que permita adoptar una conclusión profesional sobre las reglas especiales aplicables a la finalidad.",
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
        "¿Cuál conclusión profesional adoptas sobre el régimen de tratamiento de NNA de esta finalidad?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema.",
      fact_key: DRAFT,
      answer_type: "single_select",
      options: [
        {
          value: "minor_processing_supported",
          label: "Régimen cumplido",
          description:
            "Juicio profesional: la finalidad respeta las reglas especiales del art. 16 quáter.",
          fact_effect: { fact_key: DRAFT, value: "minor_processing_supported" },
        },
        {
          value: "minor_processing_not_supported",
          label: "Régimen no cumplido",
          description:
            "Juicio profesional: la finalidad no respeta las reglas con los antecedentes actuales.",
          fact_effect: { fact_key: DRAFT, value: "minor_processing_not_supported" },
        },
      ],
      evidence_to_review: ["Reasoning Record del régimen NNA"],
      evidence_review_help: [
        {
          evidence_item: "Reasoning Record del régimen NNA",
          review_guide: "La conclusión debe reflejar las categorías de población involucradas, las condiciones de autorización y las medidas de protección evaluadas. El razonamiento debe distinguir requisitos acreditados, hipótesis descartadas y antecedentes pendientes, sin resolverlos mediante inferencias automáticas.",
          no_evidence_guidance: "Si persisten vacíos materiales en el ReasoningRecord, la evaluación no debe finalizar prematuramente. Una conclusión de régimen no cumplido requiere fundamento profesional y no solo información insuficiente.",
          expected_result: "Un ReasoningRecord completo y trazable que justifique la conclusión profesional respecto del artículo 16 quáter, sin almacenar edades, identidades o datos reales de NNA.",
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
      outcome_key: "minor_processing_supported",
      label: "Régimen cumplido",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la finalidad respeta las reglas especiales de tratamiento de NNA.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "minors.processing_status", value: "supported" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con categorías, autorizaciones, diseño de distinción y conclusión. No archives edades ni identidades reales.",
        },
      ],
    },
    {
      outcome_key: "minor_processing_not_supported",
      label: "Régimen no cumplido",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la finalidad no respeta las reglas con los antecedentes actuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "minors.processing_status", value: "not_supported" },
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
        "Existen antecedentes pendientes o sin información suficiente. Esto no es una conclusión sobre el régimen.",
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
        "Aún no está declarado si la finalidad involucra población NNA. Decláralo antes del análisis jurídico.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar declaración de población",
          note: "Declara si la finalidad involucra población NNA (sí, no o por determinar) antes del análisis.",
        },
      ],
    },
    {
      outcome_key: "regime_not_indicated",
      label: "Régimen no indicado",
      classification: "agency_standard",
      explanation:
        "La finalidad declara no involucrar población NNA. No es una conclusión jurídica ni marca la actividad como no aplicable.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Si la población involucrada cambia, esta revisión puede corresponder en el futuro.",
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
