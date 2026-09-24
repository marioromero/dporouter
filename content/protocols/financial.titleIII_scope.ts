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
