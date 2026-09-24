import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D4.05.
 *
 * activity_key = rights.opposition_enable (checklist, company
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente ramas, pasos adicionales, evidencia, dependencias
 * y state effect del contenido canónico D4.05.
 *
 * Stage 1 valida ramas y criterios de oposición; NO resuelve el
 * balance individual de interés legítimo ni persiste juicios sobre
 * casos (`reasoning_record_required = false`). El cese del
 * tratamiento se verifica como proceso disponible, no como orden
 * sobre un caso real. No redefine el interés legítimo de D2.
 *
 * Dependencia de completitud hacia D4.01 vía fact externo
 * `rights.exercise_mechanism_status`. Metodología `agency_standard`.
 */

const MECHANISM_FACT = "rights.exercise_mechanism_status";

const CHECKS = [
  "rights.opposition.li_opposition_allowed",
  "rights.opposition.li_cessation_criteria",
  "rights.opposition.marketing_opposition",
  "rights.opposition.marketing_cessation",
  "rights.opposition.public_source_covered",
  "rights.opposition.research_exception",
  "rights.opposition.cause_identified",
  "rights.opposition.brief_reasoning",
  "rights.opposition.additional_records",
  "rights.opposition.blocking_coordinated",
  "rights.opposition.third_parties_notified",
  "rights.opposition.common_procedure",
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

function node(
  node_key: string,
  title: string,
  prompt: string,
  why: string,
  factKey: string,
  yesHint: string,
  evidence: string[],
  next: string,
  related?: string[],
): import("./types").GuidanceNode {
  return {
    node_key,
    node_type: "question",
    title,
    prompt,
    why_it_matters: why,
    fact_key: factKey,
    answer_type: "yes_no_unknown",
    options: checkOptions(factKey, yesHint),
    evidence_to_review: evidence,
    required_facts: [],
    default_next_node_key: next,
    ...(related ? { related_activity_keys: related } : {}),
    provenance: "agency_standard",
  };
}

export const RIGHTS_OPPOSITION_ENABLE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "rights.opposition_enable.v1",
  activity_key: "rights.opposition_enable",
  version: 1,
  mode: "checklist",
  execution_scope: "company",
  title: "Habilitación guiada del derecho de oposición",
  description:
    "Verifica que el procedimiento cubra las hipótesis legales de oposición (interés legítimo, marketing directo, fuente pública) y su excepción, con cese del tratamiento cuando corresponda. Valida ramas y criterios, sin resolver casos individuales.",
  entry_node_key: "check-li-opposition",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [MECHANISM_FACT],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    node(
      "check-li-opposition",
      "Interés legítimo: oposición",
      "¿El procedimiento permite la oposición en cualquier momento cuando la base sea interés legítimo?",
      "Rama de interés legítimo: la oposición es permanente, no sujeta a ventana.",
      "rights.opposition.li_opposition_allowed",
      "Oposición permanente prevista en la matriz.",
      ["matriz de ramas y excepciones", "mapping de tratamientos por base/finalidad"],
      "check-li-cessation",
    ),
    node(
      "check-li-cessation",
      "Interés legítimo: cese y motivos imperiosos",
      "¿El procedimiento contempla el cese del tratamiento salvo que el responsable acredite motivos legítimos imperiosos que prevalezcan, o necesidad para formular, ejercer o defender reclamaciones?",
      "El cese es la regla; los motivos imperiosos o las reclamaciones son la excepción a acreditar, sin resolver el balance de un caso real.",
      "rights.opposition.li_cessation_criteria",
      "Criterio de cese y excepción documentado con escalamiento.",
      ["matriz de ramas y excepciones", "proceso de cese"],
      "check-marketing-opposition",
    ),
    node(
      "check-marketing-opposition",
      "Marketing directo: oposición",
      "¿El procedimiento contempla la oposición cuando el tratamiento sea exclusivamente para marketing directo, incluida la elaboración de perfiles vinculada a dicho marketing?",
      "Rama de marketing directo, con su profiling vinculado.",
      "rights.opposition.marketing_opposition",
      "Oposición de marketing prevista.",
      ["revisión de campañas/profiling", "procedimiento de marketing/direct profiling"],
      "check-marketing-cessation",
    ),
    node(
      "check-marketing-cessation",
      "Marketing directo: cese",
      "¿El procedimiento dispone el cese operacional correspondiente del marketing y su profiling vinculado?",
      "La oposición de marketing se traduce en cese operacional verificable.",
      "rights.opposition.marketing_cessation",
      "Cese operacional previsto y verificable con walkthrough.",
      ["proceso de cese", "walkthrough de cese"],
      "check-public-source",
    ),
    node(
      "check-public-source",
      "Fuente de acceso público",
      "¿El procedimiento contempla la oposición cuando los datos provengan de fuente de acceso público y no exista otro fundamento legal?",
      "Rama de fuente pública: sin otra base, la oposición procede.",
      "rights.opposition.public_source_covered",
      "Rama de fuente pública contemplada.",
      ["matriz de ramas y excepciones"],
      "check-research-exception",
    ),
    node(
      "check-research-exception",
      "Excepción científica, histórica y estadística",
      "¿El procedimiento reconoce que no procede oposición cuando el tratamiento sea para investigación científica o histórica o fines estadísticos y sea necesario para función pública o actividad de interés público?",
      "Excepción acumulativa: fin científico/histórico/estadístico más necesidad pública.",
      "rights.opposition.research_exception",
      "Excepción documentada en la matriz.",
      ["matriz jurídica"],
      "check-cause",
    ),
    node(
      "check-cause",
      "Causal invocada",
      "¿El procedimiento identifica la causal de oposición invocada en cada caso?",
      "Sin causal identificada no hay cauce aplicable.",
      "rights.opposition.cause_identified",
      "Identificación de causal prevista.",
      ["procedimiento", "templates"],
      "check-reasoning",
    ),
    node(
      "check-reasoning",
      "Fundamentación breve",
      "¿El procedimiento contempla la fundamentación breve requerida en la rama de interés legítimo?",
      "La fundamentación breve habilita evaluar la oposición sin prejuzgar su resultado.",
      "rights.opposition.brief_reasoning",
      "Recepción de fundamentación prevista.",
      ["templates", "escenarios controlados"],
      "check-records",
    ),
    node(
      "check-records",
      "Antecedentes adicionales",
      "¿El procedimiento permite acompañar antecedentes adicionales a la oposición?",
      "Los antecedentes permiten fundar sin imponer cargas indebidas.",
      "rights.opposition.additional_records",
      "Recepción de antecedentes prevista.",
      ["templates"],
      "check-blocking",
    ),
    node(
      "check-blocking",
      "Bloqueo temporal",
      "¿El procedimiento coordina el bloqueo temporal mientras se resuelve la oposición?",
      "El bloqueo protege mientras la oposición está pendiente.",
      "rights.opposition.blocking_coordinated",
      "Coordinación con bloqueo prevista.",
      ["procedimiento"],
      "check-third-parties",
      ["rights.blocking_enable"],
    ),
    node(
      "check-third-parties",
      "Comunicación a terceros",
      "¿El procedimiento comunica los cambios a terceros receptores cuando corresponda?",
      "La oposición exitosa debe alcanzar los tratamientos informados a terceros.",
      "rights.opposition.third_parties_notified",
      "Comunicación a terceros prevista.",
      ["procedimiento", "walkthrough de cese"],
      "check-common",
    ),
    node(
      "check-common",
      "Procedimiento común",
      "¿La oposición utiliza el procedimiento y los plazos comunes de D4.01, sin decidir solicitudes individuales en Stage 1?",
      "Cauces y plazos comunes; Stage 1 no decide casos.",
      "rights.opposition.common_procedure",
      "Uso del procedimiento común verificado.",
      ["escenarios controlados"],
      "synthesis",
      ["rights.exercise_mechanism_design"],
    ),
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la oposición",
      prompt:
        "El sistema verifica el mecanismo general de D4.01 y la cobertura de ramas y criterios de oposición.",
      answer_type: "none",
      required_facts: [MECHANISM_FACT, ...CHECKS],
      transitions: [
        {
          rule_id: "mechanism-not-designed",
          description:
            "El mecanismo general aún no está diseñado en D4.01: la habilitación no puede concluir.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: MECHANISM_FACT,
              value: "designed",
            },
          },
          goto_outcome_key: "mechanism_pending",
          explanation:
            "La atención de la oposición solo está completa sobre un mecanismo general diseñado. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos un punto del marco de oposición requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas en ramas, criterios o cese operacional.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún punto está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan puntos por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "opposition-complete",
          description:
            "Mecanismo diseñado con ramas y criterios de oposición cubiertos.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: MECHANISM_FACT,
                value: "designed",
              },
              ...CHECKS.map(satisfied),
            ],
          },
          goto_outcome_key: "opposition_enabled",
          explanation:
            "El procedimiento puede identificar causales y aplicar el cese cuando corresponda.",
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
      outcome_key: "opposition_enabled",
      label: "Atención de la oposición habilitada",
      classification: "agency_standard",
      explanation:
        "La empresa dispone de matriz de oposición y procedimiento de cese. Esto valida ramas y criterios, sin resolver balances individuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "rights.opposition_status", value: "enabled" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la matriz de ramas y excepciones, el procedimiento, el mapping de tratamientos por base/finalidad, el proceso de cese, el procedimiento de marketing, los templates y el walkthrough.",
        },
      ],
    },
    {
      outcome_key: "mechanism_pending",
      label: "Mecanismo general pendiente",
      classification: "agency_standard",
      explanation:
        "La atención de la oposición solo se completa sobre el mecanismo general de D4.01. Lo revisado queda como avance preliminar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Diseñar el mecanismo general en D4.01",
          activity_key: "rights.exercise_mechanism_design",
        },
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere correcciones de oposición",
      classification: "agency_standard",
      explanation:
        "Al menos un punto del marco requiere corrección. Completa ramas, criterios o cese.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada punto pendiente y vuelve a verificar el marco de oposición.",
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
        "Existen puntos pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar verificación",
        },
      ],
    },
  ],
};
