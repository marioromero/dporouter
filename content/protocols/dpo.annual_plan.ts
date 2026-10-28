import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.13.
 *
 * activity_key = dpo.annual_plan (procedure). Contenido aprobado por la
 * iteración vigente; usa exclusivamente pasos, evidencia, legal basis,
 * dependencias y aplicabilidad del contenido canónico D1.13. La
 * compuerta de designación reutiliza el fact dpo.designated ya
 * producido. El modelo operativo disponible se usa como insumo
 * (input_dependency canónica).
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce al plan verificable);
 * - product-ready: false (sin estado canónico materializable);
 * - motivo: el plan es anual por período (`dpo.annual_plan_status =
 *   current` no distingue períodos) y el patrón simple `set` no
 *   representa instancias por período; agregar período/historial
 *   excede la arquitectura diferida.
 */

const VERIFICATION_FACTS = [
  "dpo.designated",
  "dpo.plan.risks_reviewed",
  "dpo.plan.objectives_defined",
  "dpo.plan.owners_defined",
  "dpo.plan.presented",
  "dpo.plan.diffused",
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

export const DPO_ANNUAL_PLAN_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.annual_plan.v1",
  activity_key: "dpo.annual_plan",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del plan anual del DPO",
  description:
    "Verifica que el plan anual del período exista y esté fundado, presentado y difundido: riesgos y prioridades, objetivos, responsables, presentación y difusión.",
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
        "El plan anual organiza el trabajo del DPO designado. Sin designación corresponde designar primero.",
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
            "Corresponde verificar que exista una designación vigente del DPO, identificando a la persona natural que ejerce la función, la autoridad designante y la fecha de efecto. Contrastar estos antecedentes con posibles sustituciones o términos de funciones para establecer a quién corresponde desarrollar el plan anual.",
          no_evidence_guidance:
            "Pueden revisarse actos de designación, contratos, comunicaciones institucionales u otros respaldos equivalentes. Distinguir entre un expediente no localizado, documentación incompleta y ausencia efectiva de designación; el ejercicio informal de tareas de protección de datos no acredita por sí solo un DPO designado.",
          expected_result:
            "Una conclusión trazable sobre la existencia y vigencia de la designación, con identificación del DPO y sus antecedentes de respaldo. Si no se confirma, registrar esa situación como condición pendiente antes de evaluar el plan anual.",
        },
      ],
      required_facts: [],
      default_next_node_key: "review-risks",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay plan anual que desarrollar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. El plan anual requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "review-risks",
      node_type: "question",
      title: "Riesgos y prioridades del período",
      prompt:
        "¿Quedaron revisados los riesgos, hallazgos, cambios y prioridades del período?",
      why_it_matters:
        "Sin revisión de base el plan carece de fundamento para sus objetivos.",
      fact_key: "dpo.plan.risks_reviewed",
      answer_type: "single_select",
      options: stateOptions("dpo.plan.risks_reviewed"),
      evidence_to_review: [
        "plan anual fechado",
        "modelo operativo si está disponible",
      ],
      evidence_review_help: [
        {
          evidence_item: "plan anual fechado",
          review_guide:
            "La revisión debe establecer si las prioridades del plan se sustentan en riesgos, hallazgos, cambios normativos u operacionales y necesidades relevantes del período. Contrastar los objetivos previstos con esos antecedentes y verificar que el plan identifique el período, en vez de ser solo una lista genérica de actividades.",
          no_evidence_guidance:
            "Pueden revisarse borradores, evaluaciones de riesgos, informes de hallazgos o registros de planificación que permitan reconstruir las prioridades consideradas. Distinguir entre un plan no localizado, una planificación aún en elaboración y la ausencia de una revisión de base documentada.",
          expected_result:
            "Prioridades del período identificadas y vinculadas con antecedentes verificables, con riesgos o hallazgos relevantes no considerados registrados. La revisión debe permitir determinar si existe una base suficiente para definir las actividades del plan anual.",
        },
        {
          evidence_item: "modelo operativo si está disponible",
          review_guide:
            "Cuando exista un modelo operativo del DPO, corresponde contrastar sus funciones, mecanismos de coordinación y seguimiento con las prioridades propuestas para el período. Considerar también las brechas operativas pendientes que puedan requerir actividades específicas en el plan anual, sin dar por resueltas por su sola mención en el plan.",
          no_evidence_guidance:
            "La planificación puede apoyarse en la designación, las funciones aplicables y otros antecedentes organizacionales disponibles. La falta del modelo operativo no constituye por sí sola incumplimiento de esta actividad; identificarla solo si impide fundamentar o coordinar prioridades relevantes.",
          expected_result:
            "Una conclusión sobre la coherencia entre las prioridades anuales y el modelo operativo disponible, señalando ajustes o brechas pendientes. Si el modelo no existe o no está disponible, dejar identificado el fundamento alternativo utilizado para planificar.",
        },
      ],
      help_text: [
        "Si el modelo operativo está disponible, úsalo como insumo: orienta la planificación anual.",
      ],
      required_facts: [],
      default_next_node_key: "define-objectives",
      related_activity_keys: ["dpo.operating_model"],
      provenance: "legal_requirement",
    },
    {
      node_key: "define-objectives",
      node_type: "question",
      title: "Objetivos y actividades",
      prompt:
        "¿Quedaron definidos los objetivos y actividades del período?",
      why_it_matters:
        "Sin objetivos el plan no orienta el trabajo del período.",
      fact_key: "dpo.plan.objectives_defined",
      answer_type: "single_select",
      options: stateOptions("dpo.plan.objectives_defined"),
      evidence_to_review: ["plan anual fechado"],
      evidence_review_help: [
        {
          evidence_item: "plan anual fechado",
          review_guide:
            "Corresponde verificar que el plan establezca objetivos y actividades concretas para el período, vinculados con las funciones del DPO y las prioridades previamente identificadas. Deben reconocerse acciones de asesoramiento, supervisión, capacitación, gestión de riesgos u otras pertinentes, según las necesidades de la organización, sin atribuir al DPO la ejecución de obligaciones propias del responsable u otras áreas.",
          no_evidence_guidance:
            "Pueden revisarse borradores, cronogramas o registros de planificación que permitan acreditar objetivos y actividades definidos. Distinguir entre un plan no localizado, actividades dispersas sin planificación integrada y ausencia efectiva de objetivos para el período.",
          expected_result:
            "Un conjunto identificable de objetivos y actividades anuales, coherente con los riesgos y obligaciones aplicables, que permita orientar y posteriormente revisar el trabajo del DPO. Señalar las brechas sin considerar que una actividad genérica o una mera intención constituye planificación suficiente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "define-owners",
      provenance: "legal_requirement",
    },
    {
      node_key: "define-owners",
      node_type: "question",
      title: "Responsables e hitos",
      prompt:
        "¿Quedaron establecidos responsables e hitos, o se descartó fundadamente su aplicación?",
      why_it_matters:
        "Sin responsables las actividades quedan sin dueño y pierden seguimiento.",
      fact_key: "dpo.plan.owners_defined",
      answer_type: "single_select",
      options: [
        {
          value: "yes",
          label: "Verificado",
          description: "Establecidos y respaldados con evidencia.",
          fact_effect: { fact_key: "dpo.plan.owners_defined", value: "yes" },
        },
        {
          value: "na",
          label: "No aplica en este caso",
          description:
            "El período no requiere responsables o hitos diferenciados.",
          fact_effect: { fact_key: "dpo.plan.owners_defined", value: "na" },
        },
        {
          value: "no",
          label: "Pendiente",
          description: "Aún no realizado o sin evidencia suficiente.",
          fact_effect: { fact_key: "dpo.plan.owners_defined", value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo.plan.owners_defined", value: "unknown" },
        },
      ],
      evidence_to_review: ["plan anual fechado"],
      evidence_review_help: [
        {
          evidence_item: "plan anual fechado",
          review_guide:
            "Corresponde verificar si las actividades del plan requieren responsables de coordinación, plazos o hitos que faciliten su ejecución y seguimiento. Cuando sean pertinentes, deben estar suficientemente identificados y ser coherentes con las funciones del DPO y la participación de otras áreas; no todas las actividades necesitan el mismo nivel de detalle.",
          no_evidence_guidance:
            "Pueden revisarse cronogramas, acuerdos de coordinación o registros complementarios al plan. Distinguir entre responsabilidades no documentadas, actividades sin seguimiento y casos en que asignar responsables o hitos adicionales no aporta valor por la naturaleza de la actividad.",
          expected_result:
            "Responsables e hitos identificados cuando sean necesarios, o una justificación verificable para seleccionar «No aplica». Registrar las omisiones relevantes: la falta de información por sí sola no justifica descartar su aplicación.",
        },
      ],
      help_text: [
        "Solo cuando corresponda. En caso contrario marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "present-plan",
      provenance: "legal_requirement",
    },
    {
      node_key: "present-plan",
      node_type: "question",
      title: "Presentación a la autoridad",
      prompt: "¿Se presentó el plan a la autoridad pertinente?",
      why_it_matters:
        "Sin presentación la autoridad no toma conocimiento ni valida el plan.",
      fact_key: "dpo.plan.presented",
      answer_type: "single_select",
      options: stateOptions("dpo.plan.presented"),
      evidence_to_review: ["evidencia de presentación"],
      evidence_review_help: [
        {
          evidence_item: "evidencia de presentación",
          review_guide:
            "Corresponde verificar que el plan anual haya sido comunicado a la autoridad pertinente, identificando destinatario, fecha y versión presentada. Contrastar el respaldo con la línea de reporte del DPO y distinguir esta presentación de la rendición posterior de resultados.",
          no_evidence_guidance:
            "Pueden revisarse correos institucionales, actas, registros de entrega o comunicaciones equivalentes. Diferenciar entre una presentación realizada sin respaldo localizado, un plan aún pendiente de comunicar y la ausencia efectiva de presentación; no exigir un acta ni una aprobación formal como único medio válido.",
          expected_result:
            "Constancia verificable de la presentación del plan ante la autoridad correspondiente, o identificación de la gestión pendiente y sus antecedentes. La comunicación no acredita por sí sola aprobación formal ni rendición anual de resultados.",
        },
      ],
      required_facts: [],
      default_next_node_key: "diffuse-plan",
      provenance: "legal_requirement",
    },
    {
      node_key: "diffuse-plan",
      node_type: "question",
      title: "Difusión interna",
      prompt: "¿Se difundió el plan al interior de la organización?",
      why_it_matters:
        "Sin difusión los responsables no conocen el plan que deben ejecutar.",
      fact_key: "dpo.plan.diffused",
      answer_type: "single_select",
      options: stateOptions("dpo.plan.diffused"),
      evidence_to_review: ["evidencia de difusión"],
      evidence_review_help: [
        {
          evidence_item: "evidencia de difusión",
          review_guide:
            "La evidencia debe permitir comprobar que el plan anual vigente fue difundido internamente, identificando la versión, fecha, canal y destinatarios. Verificar que alcanzó a las áreas pertinentes para conocer las actividades previstas y coordinar su participación, sin exigir un medio único.",
          no_evidence_guidance:
            "Pueden revisarse correos institucionales, publicaciones internas, actas de reuniones o registros equivalentes. Distinguir entre una difusión realizada sin respaldo localizado, una comunicación limitada que no alcanzó a los destinatarios pertinentes y la ausencia efectiva de difusión.",
          expected_result:
            "Una constancia verificable de la difusión interna del plan anual, con su alcance y eventuales brechas de comunicación identificados. La difusión del plan no acredita por sí sola la comunicación posterior de los resultados de su ejecución.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del plan",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el plan sigue en elaboración.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "plan_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El plan aún no queda desarrollado.",
        },
        {
          rule_id: "all-verified",
          description:
            "Designación, base, objetivos, responsables, presentación y difusión verificados.",
          when: {
            op: "all",
            conditions: [
              isDone("dpo.designated"),
              isDone("dpo.plan.risks_reviewed"),
              isDone("dpo.plan.objectives_defined"),
              verifiedOrNa("dpo.plan.owners_defined"),
              isDone("dpo.plan.presented"),
              isDone("dpo.plan.diffused"),
            ],
          },
          goto_outcome_key: "plan_developed",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas para el período.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en elaboración.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "plan_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "plan_developed",
      label: "Plan anual desarrollado y difundido",
      classification: "legal_requirement",
      explanation:
        "El plan del período quedó fundado en riesgos y prioridades, con objetivos, responsables, presentación y difusión verificados.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Rendir cuenta del período en D1.14",
          activity_key: "dpo.annual_report",
        },
        {
          kind: "info",
          label: "Conservar el plan del período",
          note: "Archiva el plan anual fechado con su evidencia de presentación y de difusión.",
        },
      ],
    },
    {
      outcome_key: "plan_in_progress",
      label: "Plan en elaboración",
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
        "Sin DPO designado no hay plan anual que desarrollar.",
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
