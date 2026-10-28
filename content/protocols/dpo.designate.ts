import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.08.
 *
 * activity_key = dpo.designate (procedure). Contenido aprobado por la
 * iteración vigente; usa exclusivamente pasos, evidencia, legal basis,
 * state effects, dependencias y condiciones de aplicabilidad del
 * contenido canónico D1.08.
 *
 * Calibración de modo: los pasos operativos se representan como
 * verificaciones de hechos, no como preguntas de descubrimiento. Los
 * pasos genuinamente condicionales del canon (persona natural cuando el
 * prestador es persona jurídica; condiciones cuando existe DPO común de
 * grupo) usan la opción explícita "No aplica en este caso" en lugar de
 * forzar una verificación inexistente o de ramificar un árbol
 * decisional. La modalidad y el antecedente de designación son
 * determinaciones reales del paso canónico, no preguntas artificiales.
 *
 * Esta guía NO re-resuelve D1.02 ni D1.04: la compuerta registra el
 * antecedente (requerimiento vigente o decisión voluntaria) y deriva a
 * D1.02 cuando aún está sin definir. La evaluación previa de D1.02, si
 * existe, se revisa como evidencia de entrada (input_dependency).
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce al acto verificable);
 * - product-ready: false (sin lifecycle effects canónicos);
 * - motivo: el state_effect canónico es un bundle temporal/histórico
 *   (fecha efectiva, append de historial, vacancy/replacement) no
 *   representable como pares {fact_key, value}; no se materializa
 *   parcialmente ni con workarounds.
 */

const TRIGGER_FACT = "dpo.designation_trigger";
const MODALITY_FACT = "dpo.designation_modality";

const VERIFICATION_FACTS = [
  TRIGGER_FACT,
  "dpo.designation_authority",
  MODALITY_FACT,
  "dpo.designation_natural_person",
  "dpo.designation_group_conditions",
  "dpo.designation_suitability",
  "dpo.designation_formalization",
];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function verifiedOrNa(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
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

function conditionalOptions(factKey: string, naHint: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "Realizado y respaldado con evidencia.",
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

export const DPO_DESIGNATE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.designate.v1",
  activity_key: "dpo.designate",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de designación del DPO",
  description:
    "Guía al profesional desde el antecedente de designación hasta su formalización trazable: autoridad competente, modalidad, persona natural, condiciones de grupo, idoneidad y acto con fecha efectiva.",
  entry_node_key: "trigger-gate",
  decision_fact_keys: VERIFICATION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "trigger-gate",
      node_type: "question",
      title: "Antecedente de designación",
      prompt:
        "¿Existe requerimiento vigente de contar con DPO o decisión voluntaria documentada de designar?",
      why_it_matters:
        "La designación procede ante requerimiento activo o decisión voluntaria. Sin antecedente definido corresponde evaluar la necesidad antes de designar.",
      fact_key: TRIGGER_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "mpi_requirement",
          label: "Requerimiento vigente",
          description:
            "Evaluación previa o programa vigente que exige contar con DPO.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "mpi_requirement" },
        },
        {
          value: "voluntary",
          label: "Decisión voluntaria documentada",
          description:
            "La organización decidió designar sin requerimiento vigente.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "voluntary" },
        },
        {
          value: "undecided",
          label: "Aún sin definir",
          description:
            "Todavía no se define si corresponde designar un DPO.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "undecided" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: TRIGGER_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "evaluación de necesidad D1.02 si existe",
        "decisión de adopción MPI si existe",
        "decisión voluntaria documentada",
      ],
      help_text: [
        "Esta guía no re-evalúa la necesidad de DPO: registra el antecedente disponible. Si aún está sin definir, deriva a D1.02.",
      ],
      evidence_review_help: [
        {
          evidence_item: "evaluación de necesidad D1.02 si existe",
          review_guide:
            "La evaluación de D1.02 debe utilizarse como antecedente para identificar si existe un requerimiento de DPO previamente determinado. Esta actividad registra la conclusión disponible y su estado, sin repetir el análisis de necesidad ni sustituir la evaluación original.",
          no_evidence_guidance:
            "Se debe señalar que no se localizó una evaluación previa o que su conclusión no pudo confirmarse. Si la necesidad de DPO sigue sin definirse, corresponde derivar a D1.02 antes de continuar con la designación.",
          expected_result:
            "Un antecedente trazable de D1.02, con su conclusión y estado identificables; o una indicación explícita de que debe evaluarse la necesidad antes de avanzar con la designación.",
        },
        {
          evidence_item: "decisión de adopción MPI si existe",
          review_guide:
            "La decisión de adopción del MPI debe permitir comprobar si existe un antecedente formal relacionado con la activación del requerimiento de DPO. Debe verificarse la decisión disponible y su fecha efectiva, sin asumir que la mera existencia de un MPI demuestra por sí sola que el requerimiento está activo.",
          no_evidence_guidance:
            "Se debe indicar que no fue posible localizar o confirmar la decisión de adopción. La falta de este antecedente no demuestra por sí sola que no exista un requerimiento de DPO; debe considerarse junto con la evaluación de necesidad y cualquier decisión voluntaria documentada.",
          expected_result:
            "Un registro verificable de la decisión de adopción del MPI y de su relevancia para el antecedente de designación, o la identificación clara de la información pendiente de confirmar.",
        },
        {
          evidence_item: "decisión voluntaria documentada",
          review_guide:
            "La decisión debe expresar de forma identificable la voluntad de designar un DPO, con respaldo suficiente para reconocer quién la adoptó y a qué organización se refiere. Debe distinguirse una decisión efectiva de una propuesta, intención informal o evaluación todavía pendiente.",
          no_evidence_guidance:
            "Se debe señalar que no se localizó una decisión voluntaria verificable y que no corresponde presumirla a partir de conversaciones, borradores o planes futuros. Si tampoco existe un requerimiento vigente confirmado, debe derivarse a D1.02 para evaluar la necesidad.",
          expected_result:
            "Una decisión voluntaria identificable y trazable que permita fundamentar el avance hacia la designación, o una constancia de que no existe un antecedente confirmado y que la necesidad debe resolverse previamente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "confirm-authority",
      transitions: [
        {
          rule_id: "trigger-undefined",
          description:
            "Sin antecedente definido no inicia la designación.",
          when: {
            op: "fact_equals",
            fact_key: TRIGGER_FACT,
            value: "undecided",
          },
          goto_outcome_key: "prerequisite_pending",
          explanation:
            "Aún no se define si corresponde designar. Esta guía parte del antecedente; primero corresponde evaluar la necesidad.",
        },
      ],
      related_activity_keys: ["dpo.need_assessment"],
      provenance: "agency_standard",
    },
    {
      node_key: "confirm-authority",
      node_type: "question",
      title: "Autoridad competente",
      prompt: "¿Se confirmó la autoridad competente para designar?",
      why_it_matters:
        "Solo la máxima autoridad directiva o administrativa puede formalizar una designación válida y trazable.",
      fact_key: "dpo.designation_authority",
      answer_type: "single_select",
      options: stateOptions("dpo.designation_authority"),
      evidence_to_review: [
        "acto o documento de designación",
        "identificación de la máxima autoridad directiva o administrativa",
      ],
      evidence_review_help: [
        {
          evidence_item: "acto o documento de designación",
          review_guide:
            "El acto debe permitir verificar quién formalizó la designación y que la decisión provino de la máxima autoridad directiva o administrativa competente. Deben identificarse la autoridad que lo emite, la persona designada y la fecha del acto, distinguiendo una designación efectiva de una propuesta pendiente.",
          no_evidence_guidance:
            "Se debe señalar que no se localizó un acto verificable o que no pudo confirmarse la autoridad que lo emitió. Una comunicación informal o un borrador no acredita por sí solo una designación válida; si la competencia permanece incierta, debe aclararse antes de continuar.",
          expected_result:
            "Un acto o documento trazable que permita identificar la decisión efectiva de designar, su emisor competente y la persona designada. Las dudas sobre la autoridad emisora o la formalización deben quedar explícitas, sin presumir que la designación está validada.",
        },
        {
          evidence_item: "identificación de la máxima autoridad directiva o administrativa",
          review_guide:
            "Los antecedentes deben permitir identificar a quien ejerce la máxima autoridad directiva o administrativa de la organización conforme a su estructura y régimen jurídico. La revisión debe vincular esa identificación con las facultades para formalizar la designación, sin asumir que el cargo de mayor jerarquía nominal siempre tiene competencia suficiente.",
          no_evidence_guidance:
            "Se deben indicar los antecedentes pendientes para confirmar la autoridad competente, como documentos de gobierno, estatutos, delegaciones aplicables o estructura formal de la organización. La falta de estos antecedentes no permite presumir que quien suscribió el acto tenía facultades para designar.",
          expected_result:
            "Una identificación documentada de la máxima autoridad directiva o administrativa y de su competencia para formalizar la designación. Si existen dudas sobre las facultades o delegaciones, deben quedar registradas antes de validar el acto.",
        },
      ],
      required_facts: [],
      default_next_node_key: "modality",
      provenance: "legal_requirement",
    },
    {
      node_key: "modality",
      node_type: "question",
      title: "Modalidad de prestación",
      prompt: "¿Qué modalidad tendrá el DPO: interno o externo?",
      why_it_matters:
        "La modalidad determina la evidencia exigible: contrato cuando sea externo e identificación expresa de persona natural cuando el prestador sea persona jurídica.",
      fact_key: MODALITY_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "internal",
          label: "Interno",
          description: "Persona de la propia organización.",
          fact_effect: { fact_key: MODALITY_FACT, value: "internal" },
        },
        {
          value: "external_individual",
          label: "Externo, persona natural",
          description: "Prestador externo que es persona natural.",
          fact_effect: { fact_key: MODALITY_FACT, value: "external_individual" },
        },
        {
          value: "external_entity",
          label: "Externo, persona jurídica",
          description:
            "Prestador externo que es persona jurídica: exige identificar expresamente a la persona natural.",
          fact_effect: { fact_key: MODALITY_FACT, value: "external_entity" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: MODALITY_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: ["contrato cuando sea externo"],
      evidence_review_help: [
        {
          evidence_item: "contrato cuando sea externo",
          review_guide:
            "La revisión debe confirmar si la modalidad acordada es externa y, en ese caso, verificar el contrato que formaliza la prestación del servicio. Deben poder identificarse las partes, el servicio relacionado con la función de DPO y la vigencia del vínculo, distinguiendo contratos ejecutados de propuestas o borradores.",
          no_evidence_guidance:
            "Si la modalidad es externa, se debe señalar que no se localizó un contrato verificable o que su vigencia no pudo confirmarse. Si la modalidad es interna, esta evidencia no corresponde; si la modalidad sigue sin definirse, debe aclararse antes de determinar qué respaldo resulta exigible.",
          expected_result:
            "Una modalidad de prestación identificada y respaldada; cuando sea externa, un contrato verificable asociado al servicio de DPO. La falta de contrato debe quedar señalada cuando corresponda, sin exigirlo para una modalidad interna.",
        },
      ],
      required_facts: [],
      default_next_node_key: "natural-person",
      provenance: "legal_requirement",
    },
    {
      node_key: "natural-person",
      node_type: "question",
      title: "Persona natural identificada",
      prompt:
        "¿Quedó identificada expresamente la persona natural que actuará como DPO?",
      why_it_matters:
        "Cuando el servicio lo presta una persona jurídica, la designación solo queda individualizada con la persona natural expresamente identificada.",
      fact_key: "dpo.designation_natural_person",
      answer_type: "single_select",
      options: conditionalOptions(
        "dpo.designation_natural_person",
        "El DPO es interno o persona natural directa: la individualización queda en el acto de designación.",
      ),
      evidence_to_review: [
        "identificación de persona natural cuando el prestador sea persona jurídica",
      ],
      evidence_review_help: [
        {
          evidence_item:
            "identificación de persona natural cuando el prestador sea persona jurídica",
          review_guide:
            "Verificar el contrato u otro antecedente formal de la prestación y confirmar que, cuando el proveedor sea una persona jurídica, se identifica expresamente a la persona natural que ejercerá como DPO. Comprobar que la identificación sea inequívoca y corresponda a la función designada.",
          no_evidence_guidance:
            "Si el servicio lo presta una persona jurídica y no consta la identificación expresa de la persona natural, registrar la falta de respaldo y solicitar su aclaración o formalización. Si el servicio no lo presta una persona jurídica, marcar \"No aplica en este caso\", dejando constancia del fundamento.",
          expected_result:
            "La persona natural que actuará como DPO queda identificada de forma expresa cuando el proveedor es una persona jurídica. En los demás casos, la evidencia se registra como no aplicable, sin generar una observación por su ausencia.",
        },
      ],
      help_text: [
        "Solo exigible cuando el servicio lo presta una persona jurídica. En los demás casos marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "group-conditions",
      provenance: "legal_requirement",
    },
    {
      node_key: "group-conditions",
      node_type: "question",
      title: "Condiciones de DPO común de grupo",
      prompt:
        "¿Quedaron verificadas las condiciones aplicables al DPO común de grupo empresarial?",
      why_it_matters:
        "Un DPO común para un grupo empresarial solo es válido cuando cumple sus condiciones aplicables.",
      fact_key: "dpo.designation_group_conditions",
      answer_type: "single_select",
      options: conditionalOptions(
        "dpo.designation_group_conditions",
        "No existe DPO común para grupo empresarial en este caso.",
      ),
      evidence_to_review: [
        "condiciones aplicables al DPO común cuando exista",
      ],
      evidence_review_help: [
        {
          evidence_item: "condiciones aplicables al DPO común cuando exista",
          review_guide:
            "Verificar si se propone una designación común de DPO para varias entidades del grupo empresarial. Cuando exista, revisar los estándares y políticas comunes de protección de datos, las condiciones organizativas que sustentan la designación y la disponibilidad efectiva del DPO para las entidades cubiertas.",
          no_evidence_guidance:
            "Si existe una propuesta de DPO común, pero no se acreditan las condiciones aplicables, registrar los aspectos pendientes y solicitar antecedentes que permitan verificarlas. Si no existe una designación común para el grupo empresarial, marcar \"No aplica en este caso\".",
          expected_result:
            "La designación común queda respaldada por antecedentes que permiten verificar las condiciones aplicables al grupo y la disponibilidad del DPO para las entidades cubiertas. Si no existe DPO común, la evidencia queda registrada como no aplicable, sin generar una observación por su ausencia.",
        },
      ],
      help_text: [
        "Cuando no exista DPO común para grupo empresarial, marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "suitability",
      provenance: "legal_requirement",
    },
    {
      node_key: "suitability",
      node_type: "question",
      title: "Idoneidad inicial",
      prompt: "¿Se verificó la idoneidad inicial del DPO?",
      why_it_matters:
        "La designación exige una verificación inicial de idoneidad respaldada en antecedentes revisables.",
      fact_key: "dpo.designation_suitability",
      answer_type: "single_select",
      options: stateOptions("dpo.designation_suitability"),
      evidence_to_review: ["antecedentes de idoneidad"],
      evidence_review_help: [
        {
          evidence_item: "antecedentes de idoneidad",
          review_guide:
            "Examinar antecedentes que permitan valorar la aptitud, capacidad y conocimientos específicos del DPO para desempeñar sus funciones. Considerar formación, experiencia profesional y conocimientos pertinentes al tratamiento de datos y al contexto de la organización, sin asumir que un título o certificado aislado acredita por sí solo toda la idoneidad requerida.",
          no_evidence_guidance:
            "Si no existen antecedentes revisables o estos no permiten valorar la idoneidad, registrar qué aspectos requieren respaldo adicional y solicitar información pertinente. Distinguir entre falta de documentación y falta comprobada de aptitudes o conocimientos; la ausencia de un certificado específico no demuestra por sí sola falta de idoneidad.",
          expected_result:
            "La valoración inicial de idoneidad queda respaldada por antecedentes pertinentes y revisables, con las limitaciones identificadas cuando corresponda. La evidencia permite fundamentar la designación sin imponer credenciales, formatos documentales ni certificaciones que no resulten aplicables.",
        },
      ],
      required_facts: [],
      default_next_node_key: "formalization",
      provenance: "legal_requirement",
    },
    {
      node_key: "formalization",
      node_type: "question",
      title: "Formalización con fecha efectiva",
      prompt:
        "¿Quedó formalizada la designación con fecha efectiva e identificación completa?",
      why_it_matters:
        "Sin acto formal con fecha efectiva e identificación, la designación no queda trazable ni oponible.",
      fact_key: "dpo.designation_formalization",
      answer_type: "single_select",
      options: stateOptions("dpo.designation_formalization"),
      evidence_to_review: [
        "acto o documento de designación",
        "fecha efectiva",
        "identificación del DPO",
        "contrato cuando sea externo",
      ],
      help_text: [
        "Verifica acto existente, fecha efectiva explícita, identificación completa y, cuando corresponda, contrato e identificación de persona natural.",
      ],
      evidence_review_help: [
        {
          evidence_item: "acto o documento de designación",
          review_guide:
            "Verificar la existencia de un acto formal o documento equivalente que permita acreditar la decisión de designar al DPO. Comprobar quién adopta la designación, a quién identifica y si el documento permite vincular la decisión con la organización responsable.",
          no_evidence_guidance:
            "Si no se localiza un acto o antecedente equivalente, registrar la falta de respaldo y solicitar el documento correspondiente. No considerar suficiente una intención informal o una propuesta pendiente de aprobación como prueba de una designación formalizada.",
          expected_result:
            "La decisión de designar al DPO queda respaldada por un antecedente formal, atribuible a la autoridad competente y vinculado inequívocamente con la persona designada.",
        },
        {
          evidence_item: "fecha efectiva",
          review_guide:
            "Comprobar que el acto o documento indique expresamente desde qué fecha produce efectos la designación. Contrastar esa fecha con la aprobación o formalización del acto y con los demás antecedentes disponibles, sin presumir que la fecha de elaboración equivale necesariamente a la fecha efectiva.",
          no_evidence_guidance:
            "Si no consta una fecha efectiva explícita o existen discrepancias entre los antecedentes, registrar el aspecto pendiente y solicitar su aclaración o formalización. No inferir una fecha únicamente a partir de firmas, correos o fechas de creación del archivo.",
          expected_result:
            "La fecha efectiva de la designación queda identificada y respaldada documentalmente, con las discrepancias relevantes aclaradas antes de considerar completa la formalización.",
        },
        {
          evidence_item: "identificación del DPO",
          review_guide:
            "Verificar que el acto identifique de forma inequívoca a la persona designada y permita distinguirla de la organización o proveedor que pueda prestar el servicio. Contrastar la identificación con el contrato u otros antecedentes relacionados, cuando corresponda.",
          no_evidence_guidance:
            "Si la identidad no puede determinarse con claridad, registrar qué dato falta o qué discrepancia debe aclararse. Cuando el servicio se preste mediante una persona jurídica, comprobar por separado la evidencia específica de identificación de la persona natural que ejercerá como DPO.",
          expected_result:
            "La persona designada queda identificada inequívocamente en el acto o documento correspondiente, con coherencia entre los antecedentes relacionados y sin confundir al proveedor con quien ejercerá personalmente la función.",
        },
        {
          evidence_item: "contrato cuando sea externo",
          review_guide:
            "Cuando la modalidad sea externa, comprobar que exista un contrato verificable que formalice la prestación del servicio y permita vincularla con la función de DPO. Revisar las partes, el servicio contratado y su vigencia; si el prestador es una persona jurídica, verificar además la identificación expresa de la persona natural que ejercerá como DPO.",
          no_evidence_guidance:
            "Si el servicio es externo y no se localiza un contrato verificable, o existen dudas sobre su vigencia o alcance, registrar la falta de respaldo y solicitar aclaración. Si la modalidad es interna, marcar \"No aplica en este caso\". No confundir la identificación del proveedor con la identificación de la persona natural designada.",
          expected_result:
            "Cuando corresponda, la prestación externa queda respaldada por un contrato verificable y coherente con la designación; si el proveedor es una persona jurídica, su persona natural actuante queda identificada expresamente. Para la modalidad interna, la evidencia contractual se registra como no aplicable.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de la designación",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "trigger-still-undefined",
          description:
            "El antecedente sigue sin definirse: deriva a evaluar necesidad.",
          when: {
            op: "fact_equals",
            fact_key: TRIGGER_FACT,
            value: "undecided",
          },
          goto_outcome_key: "prerequisite_pending",
          explanation:
            "Aún no se define si corresponde designar. Primero corresponde evaluar la necesidad.",
        },
        {
          rule_id: "entity-without-natural-person",
          description:
            "Prestador persona jurídica sin persona natural identificada.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: MODALITY_FACT,
                value: "external_entity",
              },
              {
                op: "fact_equals",
                fact_key: "dpo.designation_natural_person",
                value: "na",
              },
            ],
          },
          goto_outcome_key: "designation_in_progress",
          explanation:
            "La modalidad externa con persona jurídica exige identificación expresa de la persona natural: no admite No aplica.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: la designación sigue en curso.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "designation_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La designación aún no queda formalizada.",
        },
        {
          rule_id: "all-verified",
          description:
            "Antecedente, autoridad, modalidad, individualización, grupo, idoneidad y formalización verificados.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_in",
                fact_key: TRIGGER_FACT,
                values: ["mpi_requirement", "voluntary"],
              },
              isDone("dpo.designation_authority"),
              {
                op: "fact_in",
                fact_key: MODALITY_FACT,
                values: ["internal", "external_individual", "external_entity"],
              },
              verifiedOrNa("dpo.designation_natural_person"),
              verifiedOrNa("dpo.designation_group_conditions"),
              isDone("dpo.designation_suitability"),
              isDone("dpo.designation_formalization"),
            ],
          },
          goto_outcome_key: "designation_complete",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "designation_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "designation_complete",
      label: "Designación formalizada y trazable",
      classification: "legal_requirement",
      explanation:
        "El antecedente, la autoridad, la modalidad, la individualización, las condiciones de grupo, la idoneidad y la formalización con fecha efectiva quedaron verificados.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Validar la gobernanza inicial del DPO en D1.09",
          activity_key: "dpo.initial_governance_validation",
        },
        {
          kind: "info",
          label: "Conservar el expediente de designación",
          note: "Archiva acto o documento de designación, fecha efectiva, identificación del DPO, contrato cuando sea externo e identificación de persona natural cuando corresponda, con antecedentes de idoneidad.",
        },
      ],
    },
    {
      outcome_key: "designation_in_progress",
      label: "Designación en curso",
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
      outcome_key: "prerequisite_pending",
      label: "Antecedente aún sin definir",
      classification: "agency_standard",
      explanation:
        "Sin requerimiento vigente ni decisión voluntaria no inicia la designación.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Definir la necesidad en D1.02",
          activity_key: "dpo.need_assessment",
        },
      ],
    },
  ],
};
