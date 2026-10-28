import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.14.
 *
 * activity_key = dpo.annual_report (procedure). Contenido aprobado por
 * la iteración vigente; usa exclusivamente pasos, evidencia, legal
 * basis, dependencias y aplicabilidad del contenido canónico D1.14. La
 * compuerta de designación reutiliza el fact dpo.designated ya
 * producido. La compuerta del plan registra si existe plan del período
 * para contrastar (input_dependency canónica) y deriva a D1.13 cuando
 * falta, sin re-elaborarlo.
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce a la rendición verificable);
 * - product-ready: false (sin estado canónico materializable);
 * - motivo: el informe es anual por período (`issued` no distingue
 *   períodos) y exige fecha dinámica de rendición; período, historial
 *   y fechas exceden el patrón simple `set` diferido.
 */

const VERIFICATION_FACTS = [
  "dpo.designated",
  "dpo.reporting.plan_available",
  "dpo.reporting.execution_consolidated",
  "dpo.reporting.findings_identified",
  "dpo.reporting.rendering_prepared",
  "dpo.reporting.decisions_recorded",
  "dpo.reporting.diffused",
];

function isDone(fact_key: string): FactCondition {
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

export const DPO_ANNUAL_REPORT_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.annual_report.v1",
  activity_key: "dpo.annual_report",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de rendición anual del DPO",
  description:
    "Verifica que la rendición de resultados del período quede consolidada, presentada ante la autoridad y difundida: ejecución del plan, hallazgos, rendición, decisiones y difusión.",
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
        "La rendición corresponde al DPO designado. Sin designación corresponde designar primero.",
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
            "Corresponde verificar que exista una designación formal del DPO y que se encuentre vigente para el período objeto de rendición. El expediente debe permitir identificar a la persona designada, la autoridad que efectuó la designación y los antecedentes que acrediten su continuidad o eventuales modificaciones.",
          no_evidence_guidance:
            "Pueden revisarse resoluciones, comunicaciones institucionales, instrumentos de nombramiento o registros equivalentes que permitan acreditar la designación. Debe distinguirse entre un expediente no localizado, una designación que perdió vigencia y la ausencia efectiva de un DPO designado.",
          expected_result:
            "Existencia de un DPO formalmente designado y acreditable, con una autoridad designante identificable ante la cual corresponda rendir resultados. Si no existe designación, debe registrarse esa condición y seguir la ruta prevista por el protocolo, sin presumir automáticamente una infracción por falta de nombramiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "plan-gate",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay rendición que gestionar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. La rendición requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "plan-gate",
      node_type: "question",
      title: "Plan del período",
      prompt:
        "¿Existe plan anual del período para contrastar los resultados?",
      why_it_matters:
        "El informe debe contrastar resultados con el plan correspondiente. Sin plan corresponde elaborarlo primero.",
      fact_key: "dpo.reporting.plan_available",
      answer_type: "single_select",
      options: [
        {
          value: "yes",
          label: "Sí, existe",
          description: "Existe plan anual del período.",
          fact_effect: {
            fact_key: "dpo.reporting.plan_available",
            value: "yes",
          },
        },
        {
          value: "no",
          label: "Sin plan",
          description: "No existe plan anual del período.",
          fact_effect: {
            fact_key: "dpo.reporting.plan_available",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo.reporting.plan_available",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: ["plan anual fechado"],
      evidence_review_help: [
        {
          evidence_item: "plan anual fechado",
          review_guide:
            "Corresponde comprobar que exista un plan anual identificable y correspondiente al período cuyos resultados serán rendidos. Revisar su fecha, período de referencia y actividades previstas para determinar si permite contrastar lo planificado con lo efectivamente realizado.",
          no_evidence_guidance:
            "Pueden revisarse versiones aprobadas internamente, registros de planificación o antecedentes que permitan localizar el plan del período. Distinguir entre un plan existente pero no localizado, uno correspondiente a otro período y la ausencia efectiva de planificación anual.",
          expected_result:
            "El plan anual del período disponible como referencia para la rendición de resultados. Si no existe, registrar esa condición y seguir la derivación prevista hacia D1.13, sin intentar elaborar el plan dentro de esta actividad.",
        },
      ],
      help_text: [
        "Esta guía no elabora el plan: registra si existe y deriva a D1.13 cuando falta.",
      ],
      required_facts: [],
      default_next_node_key: "consolidate-execution",
      transitions: [
        {
          rule_id: "no-plan",
          description: "Sin plan del período no hay contraste que rendir.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.reporting.plan_available",
            value: "no",
          },
          goto_outcome_key: "awaiting_plan",
          explanation:
            "No existe plan anual del período. Primero corresponde desarrollarlo.",
        },
      ],
      related_activity_keys: ["dpo.annual_plan"],
      provenance: "agency_standard",
    },
    {
      node_key: "consolidate-execution",
      node_type: "question",
      title: "Ejecución consolidada",
      prompt: "¿Quedó consolidada la ejecución del plan anual?",
      why_it_matters:
        "Sin consolidación no hay base para identificar resultados ni pendientes.",
      fact_key: "dpo.reporting.execution_consolidated",
      answer_type: "single_select",
      options: stateOptions("dpo.reporting.execution_consolidated"),
      evidence_to_review: ["informe anual", "revisión de plan anual"],
      evidence_review_help: [
        {
          evidence_item: "informe anual",
          review_guide:
            "Verificar que el informe reúna las actividades desarrolladas durante el período, su estado de ejecución y antecedentes que permitan comprender el avance del trabajo del DPO. La consolidación debe distinguir lo realizado, lo pendiente y lo modificado o reprogramado, sin confundir actividad ejecutada con resultado obtenido.",
          no_evidence_guidance:
            "Pueden revisarse reportes parciales, registros de seguimiento y otros antecedentes que permitan reconstruir la ejecución del período. Distinguir entre un informe no localizado, información dispersa aún no consolidada y ausencia efectiva de registros suficientes para rendir cuenta.",
          expected_result:
            "Una consolidación identificable de la ejecución anual, con información suficiente para examinar posteriormente resultados, pendientes y hallazgos. No se exige que todas las actividades estén finalizadas, sino que su situación pueda explicarse y contrastarse con la planificación.",
        },
        {
          evidence_item: "revisión de plan anual",
          review_guide:
            "Contrastar las actividades y prioridades del plan anual correspondiente al período con la ejecución reflejada en el informe. Identificar actividades cumplidas, pendientes, modificadas o no realizadas y comprobar que las diferencias relevantes cuenten con una explicación verificable.",
          no_evidence_guidance:
            "Pueden revisarse matrices de seguimiento, anotaciones sobre el plan, versiones de trabajo o registros equivalentes que documenten la comparación. Distinguir entre una revisión efectuada sin respaldo localizado y la ausencia de contraste entre lo planificado y lo ejecutado.",
          expected_result:
            "Una correspondencia trazable entre el plan anual y la ejecución consolidada, incluyendo desviaciones relevantes y su situación. La revisión no debe convertirse en una nueva elaboración del plan ni presumir incumplimiento por toda actividad pendiente o reprogramada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "identify-findings",
      provenance: "legal_requirement",
    },
    {
      node_key: "identify-findings",
      node_type: "question",
      title: "Resultados y hallazgos",
      prompt:
        "¿Quedaron identificados los resultados, pendientes, riesgos y principales hallazgos?",
      why_it_matters:
        "Sin hallazgos identificados la rendición queda en enumeración de actividades.",
      fact_key: "dpo.reporting.findings_identified",
      answer_type: "single_select",
      options: stateOptions("dpo.reporting.findings_identified"),
      evidence_to_review: ["informe anual", "revisión de resultados"],
      evidence_review_help: [
        {
          evidence_item: "informe anual",
          review_guide:
            "Corresponde verificar que el informe exponga los principales resultados del trabajo del DPO, los asuntos pendientes y los riesgos o hallazgos relevantes del período. La información debe permitir comprender avances y dificultades, diferenciando los resultados obtenidos de las actividades simplemente realizadas.",
          no_evidence_guidance:
            "Pueden revisarse informes parciales, registros de supervisión, comunicaciones o antecedentes de seguimiento que permitan reconstruir los resultados del período. Distinguir entre un informe no localizado, información todavía dispersa y ausencia de antecedentes suficientes para sustentar la rendición.",
          expected_result:
            "Un informe que presente una síntesis verificable de resultados, pendientes y aspectos relevantes del período. La ausencia de hallazgos negativos puede ser válida si responde a una revisión efectuada y no a la omisión de su evaluación.",
        },
        {
          evidence_item: "revisión de resultados",
          review_guide:
            "Verificar que los resultados declarados hayan sido contrastados con antecedentes disponibles y que pendientes, riesgos y principales hallazgos estén suficientemente caracterizados. Comprobar que las conclusiones sean coherentes con el trabajo realizado y que las cuestiones relevantes no queden ocultas bajo una enumeración de tareas.",
          no_evidence_guidance:
            "Pueden revisarse registros de seguimiento, evaluaciones internas, antecedentes de incidentes o comunicaciones que respalden las conclusiones. Distinguir entre una revisión realizada sin constancia localizada y la falta efectiva de análisis de resultados, riesgos o pendientes.",
          expected_result:
            "Una revisión trazable que sustente los resultados comunicados e identifique los asuntos que requieren atención o seguimiento. No se exige que existan riesgos nuevos o hallazgos adversos, sino que los aspectos pertinentes hayan sido examinados y documentados razonablemente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "prepare-rendering",
      provenance: "legal_requirement",
    },
    {
      node_key: "prepare-rendering",
      node_type: "question",
      title: "Rendición ante la autoridad",
      prompt:
        "¿Se preparó y presentó la rendición ante la autoridad que designó al DPO?",
      why_it_matters:
        "Sin presentación ante la autoridad no hay rendición de cuenta efectiva.",
      fact_key: "dpo.reporting.rendering_prepared",
      answer_type: "single_select",
      options: stateOptions("dpo.reporting.rendering_prepared"),
      evidence_to_review: ["informe anual", "evidencia de presentación"],
      evidence_review_help: [
        {
          evidence_item: "informe anual",
          review_guide:
            "Corresponde verificar que el informe reúna los resultados del trabajo del DPO durante el período, incluidos avances, pendientes y principales asuntos que deban comunicarse a la autoridad designante. Identificar el período rendido y comprobar que el documento sea suficientemente claro para sustentar la presentación.",
          no_evidence_guidance:
            "Pueden revisarse versiones del informe, antecedentes de consolidación o documentos equivalentes que contengan la rendición de resultados. Distinguir entre un informe no localizado, una rendición todavía en preparación y la ausencia efectiva de un documento o contenido suficiente para rendir cuenta.",
          expected_result:
            "Una rendición de resultados preparada y sustentada en antecedentes verificables, correspondiente al período evaluado. Su sola elaboración no acredita que haya sido presentada a la autoridad competente.",
        },
        {
          evidence_item: "evidencia de presentación",
          review_guide:
            "Verificar que la rendición de resultados haya sido comunicada efectivamente a la autoridad que designó al DPO, identificando destinatario, fecha y documento o contenido presentado. El respaldo debe permitir distinguir una entrega realizada de una comunicación pendiente o meramente prevista.",
          no_evidence_guidance:
            "Pueden revisarse correos institucionales, constancias de entrega, actas de reunión o registros equivalentes. Diferenciar entre una presentación efectuada sin respaldo localizado, una entrega dirigida a un destinatario distinto y la ausencia efectiva de rendición ante la autoridad designante.",
          expected_result:
            "Una constancia verificable de que los resultados del período fueron rendidos ante la autoridad que designó al DPO. No se exige aprobación formal, reunión presencial ni un medio documental único, salvo que una regla aplicable al caso disponga algo adicional.",
        },
      ],
      required_facts: [],
      default_next_node_key: "record-decisions",
      provenance: "legal_requirement",
    },
    {
      node_key: "record-decisions",
      node_type: "question",
      title: "Decisiones resultantes",
      prompt:
        "¿Quedaron registradas las decisiones o instrucciones resultantes de la rendición?",
      why_it_matters:
        "Sin registro de decisiones la rendición no produce consecuencias trazables.",
      fact_key: "dpo.reporting.decisions_recorded",
      answer_type: "single_select",
      options: stateOptions("dpo.reporting.decisions_recorded"),
      evidence_to_review: ["acuerdos o instrucciones resultantes"],
      evidence_review_help: [
        {
          evidence_item: "acuerdos o instrucciones resultantes",
          review_guide:
            "Corresponde verificar si, a raíz de la rendición, la autoridad designante adoptó decisiones, formuló instrucciones o acordó medidas de seguimiento. Cuando existan, revisar que su contenido, fecha y responsables pertinentes puedan identificarse mediante un registro o comunicación verificable.",
          no_evidence_guidance:
            "Pueden revisarse actas, correos institucionales, comunicaciones de la autoridad o registros de seguimiento relacionados con la rendición. Distinguir entre decisiones adoptadas sin respaldo localizado, decisiones pendientes de formalización y una rendición que efectivamente no generó acuerdos ni instrucciones.",
          expected_result:
            "Un registro trazable de las decisiones o instrucciones que efectivamente resultaron de la rendición, cuando las haya. Si no se adoptaron, dejar constancia que permita justificar esa circunstancia conforme a las opciones del nodo, sin exigir acuerdos inexistentes ni confundir su ausencia con la falta de rendición.",
        },
      ],
      required_facts: [],
      default_next_node_key: "diffuse-results",
      provenance: "legal_requirement",
    },
    {
      node_key: "diffuse-results",
      node_type: "question",
      title: "Difusión interna",
      prompt:
        "¿Se difundieron los resultados al interior de la organización?",
      why_it_matters:
        "Sin difusión la organización no conoce los resultados ni sus instrucciones.",
      fact_key: "dpo.reporting.diffused",
      answer_type: "single_select",
      options: stateOptions("dpo.reporting.diffused"),
      evidence_to_review: ["evidencia de difusión"],
      evidence_review_help: [
        {
          evidence_item: "evidencia de difusión",
          review_guide:
            "Corresponde verificar que los resultados del trabajo del DPO hayan sido comunicados internamente, identificando el contenido difundido, la fecha, el canal y los destinatarios pertinentes. La comunicación debe permitir conocer los principales resultados y asuntos que requieren atención, respetando las restricciones de confidencialidad aplicables.",
          no_evidence_guidance:
            "Pueden revisarse correos institucionales, publicaciones internas, actas de reuniones o registros equivalentes que acrediten la comunicación. Distinguir entre una difusión realizada sin respaldo localizado, una comunicación que no alcanzó a los destinatarios pertinentes y la ausencia efectiva de difusión de resultados.",
          expected_result:
            "Una constancia verificable de la difusión interna de los resultados del período, con alcance suficiente para que las áreas pertinentes conozcan las conclusiones y eventuales instrucciones que les correspondan. Esta evidencia no acredita la difusión previa del plan anual ni exige comunicar indiscriminadamente información reservada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de la rendición",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: la rendición sigue en elaboración.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "report_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La rendición aún no queda emitida.",
        },
        {
          rule_id: "all-verified",
          description:
            "Designación, plan, consolidación, hallazgos, rendición, decisiones y difusión verificados.",
          when: { op: "all", conditions: VERIFICATION_FACTS.map(isDone) },
          goto_outcome_key: "report_issued",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas para el período.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en elaboración.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "report_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "report_issued",
      label: "Rendición emitida y difundida",
      classification: "legal_requirement",
      explanation:
        "La ejecución quedó consolidada y contrastada con el plan, con hallazgos, presentación ante la autoridad, decisiones registradas y difusión verificadas.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el informe del período",
          note: "Archiva el informe anual con su evidencia de presentación y de difusión, y los acuerdos o instrucciones resultantes.",
        },
      ],
    },
    {
      outcome_key: "report_in_progress",
      label: "Rendición en elaboración",
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
      outcome_key: "awaiting_plan",
      label: "A la espera del plan del período",
      classification: "agency_standard",
      explanation:
        "Sin plan anual del período no hay contraste que rendir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Desarrollar el plan anual en D1.13",
          activity_key: "dpo.annual_plan",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "DPO aún no designado",
      classification: "agency_standard",
      explanation:
        "Sin DPO designado no hay rendición que gestionar.",
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
