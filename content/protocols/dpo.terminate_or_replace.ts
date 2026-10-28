import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.17.
 *
 * activity_key = dpo.terminate_or_replace (decision). Contenido aprobado
 * por la iteración vigente; usa exclusivamente pasos, evidencia, legal
 * basis, dependencias y aplicabilidad del contenido canónico D1.17.
 *
 * El canon distingue dos situaciones con consecuencias distintas:
 * término con MPI activo (vacancia y reemplazo hasta nueva designación)
 * frente a término exclusivamente voluntario sin otra fuente de
 * obligación (cierre sin deber automático de reemplazo). Esa divergencia
 * genuina justifica el modo decision: tres determinaciones alimentan
 * reglas determinísticas hacia la consecuencia correcta, sin reducirlas
 * a una sola pregunta.
 *
 * El estado del MPI se reutiliza como fact externo ya producido por
 * D1.02, D1.04 o Diagnóstico (`mpi.lifecycle_status` declarado en
 * `external_fact_keys`): esta guía no re-evalúa la necesidad ni la
 * adopción, solo lee el ciclo de vida vigente. La compuerta de
 * designación reutiliza `dpo.designated` de D1.09/D1.11.
 *
 * Este protocolo decide la consecuencia (reemplazo vs cierre). Los pasos
 * operativos comunes a ambas (registro de fecha y causa, preservación
 * de historial, comunicación a la Agencia y actualización de
 * publicación) se instruyen en cada outcome definitivo con su evidencia
 * canónica; no se verifican como facts porque no discriminan la
 * consecuencia.
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce a la consecuencia correcta);
 * - product-ready: false (sin lifecycle effects canónicos);
 * - motivo: el state_effect canónico exige append de historial,
 *   transición temporal de estado (`terminated`) y sets condicionales
 *   de requerimiento/vacancia; nada de eso cabe en el patrón simple
 *   `set` soportado.
 */

const EVENT_FACT = "dpo.termination.event_occurred";
const LIFECYCLE_FACT = "mpi.lifecycle_status";
const OTHER_SOURCE_FACT = "dpo.termination.other_source";

/** Ciclo de vida que mantiene vigente el requerimiento (canon D1.17). */
const ACTIVE_LIFECYCLE = ["adoption_formalized", "implementing", "implemented"];

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function lifecycleActive(): FactCondition {
  return { op: "fact_in", fact_key: LIFECYCLE_FACT, values: ACTIVE_LIFECYCLE };
}

export const DPO_TERMINATE_OR_REPLACE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.terminate_or_replace.v1",
  activity_key: "dpo.terminate_or_replace",
  version: 1,
  mode: "decision",
  title: "Evaluación guiada de término o reemplazo del DPO",
  description:
    "Determina la consecuencia correcta ante el término o cambio del DPO: reemplazo con vacancia cuando el requerimiento sigue vigente, o cierre sin deber automático cuando era exclusivamente voluntario.",
  entry_node_key: "designation-gate",
  decision_fact_keys: [EVENT_FACT, OTHER_SOURCE_FACT],
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "designation-gate",
      node_type: "question",
      title: "Designación previa",
      prompt: "¿El DPO estaba designado antes del término o cambio?",
      why_it_matters:
        "Esta actividad modifica el ciclo de vida de una designación existente. Sin designación previa no hay término que gestionar.",
      fact_key: "dpo.designated",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Existía un DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "Nunca hubo DPO designado.",
          fact_effect: { fact_key: "dpo.designated", value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo.designated", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "expediente de designación",
        "registro de término o cambio",
      ],
      evidence_review_help: [
        {
          evidence_item: "expediente de designación",
          review_guide:
            "Verificar que exista un antecedente que permita identificar al DPO designado, la organización responsable y la fecha o período en que comenzó a ejercer la función. Comprobar que la designación sea anterior al término o cambio, incluso cuando el servicio se preste mediante una persona jurídica y se individualice a la persona natural que actúa como DPO.",
          no_evidence_guidance:
            "Revisar instrumentos de designación, contratos, comunicaciones institucionales, registros de contacto u otros antecedentes equivalentes que permitan reconstruir la designación previa. Distinguir entre la ausencia del expediente formal, una designación cuya existencia aún no puede acreditarse y antecedentes que demuestren que nunca hubo un DPO designado.",
          expected_result:
            "Una identificación verificable de la designación previa y de la persona natural que ejercía la función antes del evento, con antecedentes suficientes para establecer la secuencia temporal. No debe exigirse un formato único, pero tampoco dar por acreditada la designación solo porque alguien desempeñaba tareas relacionadas con privacidad.",
        },
        {
          evidence_item: "registro de término o cambio",
          review_guide:
            "Examinar el antecedente del evento para determinar si corresponde al término de una designación, al reemplazo de la persona natural que ejerce como DPO o a otra modificación relacionada. Contrastar persona y fecha con la designación previa, sin interpretar automáticamente un cambio de contacto como cese o reemplazo.",
          no_evidence_guidance:
            "Revisar comunicaciones de término, modificaciones contractuales, decisiones organizacionales, avisos de reemplazo u otros antecedentes que permitan identificar el evento y vincularlo con la designación anterior. Distinguir entre un cambio ocurrido pero aún no documentado, información insuficiente para caracterizarlo y la ausencia de término o cambio que gestionar.",
          expected_result:
            "Un antecedente trazable que vincule el evento con una designación efectivamente existente e identifique, cuando esté disponible, su naturaleza y fecha efectiva. Esta actividad confirma la condición de entrada sin anticipar conclusiones sobre vacancia, obligación de reemplazo o comunicaciones posteriores.",
        },
      ],
      required_facts: [],
      default_next_node_key: "event-confirmation",
      transitions: [
        {
          rule_id: "no-prior-designation",
          description: "Sin designación previa no hay término que gestionar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "Nunca existió designación. Esta actividad presupone modificar el ciclo de vida de una existente.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "event-confirmation",
      node_type: "question",
      title: "Evento de término o cambio",
      prompt:
        "¿El DPO cesó, fue reemplazado o cambió la persona natural que ejerce la función?",
      why_it_matters:
        "El evento activa la gestión: sin término o cambio no hay consecuencia que determinar.",
      fact_key: EVENT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "occurred",
          label: "Sí, evento ocurrido",
          description: "Cesó, fue reemplazado o cambió la persona natural.",
          fact_effect: { fact_key: EVENT_FACT, value: "occurred" },
        },
        {
          value: "none",
          label: "Sin evento",
          description: "No ocurrió término ni cambio.",
          fact_effect: { fact_key: EVENT_FACT, value: "none" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: EVENT_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "registro de término o cambio",
        "fecha efectiva",
      ],
      evidence_review_help: [
        {
          evidence_item: "registro de término o cambio",
          review_guide:
            "Verificar que los antecedentes permitan establecer si ocurrió el cese del DPO, su reemplazo o el cambio de la persona natural que ejerce la función, identificando la designación afectada. Distinguir estos eventos de una modificación exclusivamente administrativa o de contacto y comprobar que la situación descrita sea coherente con la designación previa.",
          no_evidence_guidance:
            "Revisar comunicaciones de término, decisiones de la organización, modificaciones contractuales, avisos de reemplazo u otros antecedentes equivalentes que permitan confirmar el evento. Diferenciar entre un cambio ocurrido sin registro localizado, información insuficiente para acreditarlo y antecedentes que indiquen que la designación continúa sin cambios relevantes.",
          expected_result:
            "Un evento identificado y respaldado cuando haya ocurrido, con antecedentes que permitan reconocer su naturaleza y la persona natural involucrada. Si no existe término ni cambio, concluirlo fundadamente sin presumir un evento por la sola ausencia de documentación actualizada.",
        },
        {
          evidence_item: "fecha efectiva",
          review_guide:
            "Comprobar la fecha desde la cual produjo efectos el término, reemplazo o cambio de la persona natural que ejerce como DPO, contrastándola con las comunicaciones y documentos disponibles. Distinguir la fecha efectiva de la fecha en que el evento fue acordado, comunicado o registrado, que pueden no coincidir.",
          no_evidence_guidance:
            "Revisar instrumentos de término, modificaciones contractuales, designaciones sucesivas, comunicaciones institucionales u otros antecedentes equivalentes para reconstruir la secuencia temporal. Si hay fechas contradictorias o no puede determinarse cuándo ocurrió el cambio, registrar la insuficiencia sin adoptar automáticamente la fecha del documento más reciente.",
          expected_result:
            "Una fecha efectiva verificable y coherente con el evento acreditado, que permita establecer la continuidad o eventual interrupción de la función del DPO. Si no ocurrió un evento, no inventar una fecha; si ocurrió pero su fecha es indeterminada, reflejar esa incertidumbre para su tratamiento posterior.",
        },
      ],
      required_facts: [],
      default_next_node_key: "other-source",
      transitions: [
        {
          rule_id: "no-event",
          description: "Sin evento no hay gestión de término.",
          when: {
            op: "fact_equals",
            fact_key: EVENT_FACT,
            value: "none",
          },
          goto_outcome_key: "no_pending_event",
          explanation:
            "No ocurrió término ni cambio. Nada que gestionar por esta vía.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "other-source",
      node_type: "question",
      title: "Otra fuente de obligación",
      prompt:
        "¿Existe alguna otra fuente, distinta del MPI, que mantenga vigente la obligación de contar con DPO?",
      why_it_matters:
        "El cierre sin reemplazo solo procede cuando el DPO era exclusivamente voluntario y no existe otra fuente de obligación.",
      fact_key: OTHER_SOURCE_FACT,
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Sí",
          description: "Otra fuente mantiene vigente el requerimiento.",
          fact_effect: { fact_key: OTHER_SOURCE_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "No",
          description: "Sin otra fuente: solo voluntario o MPI.",
          fact_effect: { fact_key: OTHER_SOURCE_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Desconocido",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: OTHER_SOURCE_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "evaluación de necesidad D1.02 si existe",
        "registro de término o cambio",
      ],
      evidence_review_help: [
        {
          evidence_item: "evaluación de necesidad D1.02 si existe",
          review_guide:
            "Consultar la evaluación D1.02, cuando esté disponible, para identificar si documenta una fuente de obligación de contar con DPO distinta del MPI y comprobar si sigue vigente al momento del término o cambio. Distinguir las obligaciones identificadas de recomendaciones, decisiones voluntarias o hipótesis que no establecen por sí mismas el deber de mantener la designación.",
          no_evidence_guidance:
            "Revisar otros antecedentes existentes que documenten la fuente invocada y su vigencia, sin exigir la elaboración retroactiva de D1.02 para continuar. Si no puede establecerse si existe una obligación adicional, registrar la incertidumbre sin presumir que la obligación existe ni que ha desaparecido.",
          expected_result:
            "Una identificación trazable de una fuente vigente distinta del MPI, cuando exista, o una conclusión fundada de que no se ha identificado otra obligación aplicable en los antecedentes disponibles. Recuperar y verificar una conclusión pertinente sin convertir esta actividad en una nueva evaluación integral de la necesidad de DPO.",
        },
        {
          evidence_item: "registro de término o cambio",
          review_guide:
            "Verificar que el registro del evento permita relacionar el término o cambio del DPO con las obligaciones que justificaban su designación. Comprobar si consta una fuente adicional al MPI que permanezca vigente, distinguiéndola de la voluntad de conservar la función o de la existencia histórica de un DPO.",
          no_evidence_guidance:
            "Consultar decisiones de designación, comunicaciones institucionales u otros antecedentes del evento que permitan determinar si se documentó una obligación adicional vigente. Distinguir entre un registro no localizado, la ausencia fundada de otra fuente y la información insuficiente para pronunciarse sobre su existencia.",
          expected_result:
            "Un registro coherente con el evento que indique si se identificó otra fuente vigente de obligación y señale los antecedentes que sustentan esa conclusión. No dar por procedente el cierre sin reemplazo mientras una posible obligación adicional relevante permanezca sin aclarar, ni exigir reemplazo solo porque la designación fuera voluntaria.",
        },
      ],
      help_text: [
        "Esta guía no re-evalúa la necesidad de DPO: registra si existe otra fuente vigente además del MPI.",
      ],
      required_facts: [],
      default_next_node_key: "requirement-assessment",
      related_activity_keys: ["dpo.need_assessment"],
      provenance: "agency_standard",
    },
    {
      node_key: "requirement-assessment",
      node_type: "decision",
      title: "Vigencia del requerimiento",
      prompt:
        "El sistema determina si el requerimiento sigue vigente según el ciclo de vida del MPI y otras fuentes.",
      answer_type: "none",
      required_facts: [EVENT_FACT, LIFECYCLE_FACT, OTHER_SOURCE_FACT],
      transitions: [
        {
          rule_id: "mpi-active-replacement",
          description:
            "MPI activo mantiene vigente el requerimiento de DPO.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: EVENT_FACT,
                value: "occurred",
              },
              lifecycleActive(),
            ],
          },
          goto_outcome_key: "replacement_required",
          explanation:
            "El MPI se encuentra formalmente adoptado, en implementación o implementado: el requerimiento sigue vigente y corresponde vacancia con reemplazo hasta nueva designación.",
        },
        {
          rule_id: "other-source-replacement",
          description:
            "Otra fuente vigente mantiene el requerimiento aunque el MPI no esté activo.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: EVENT_FACT,
                value: "occurred",
              },
              { op: "not", condition: unresolved(LIFECYCLE_FACT) },
              { op: "not", condition: lifecycleActive() },
              {
                op: "fact_equals",
                fact_key: OTHER_SOURCE_FACT,
                value: "yes",
              },
            ],
          },
          goto_outcome_key: "replacement_required",
          explanation:
            "Existe otra fuente que mantiene vigente el requerimiento: corresponde vacancia con reemplazo hasta nueva designación.",
        },
        {
          rule_id: "voluntary-closure",
          description:
            "DPO exclusivamente voluntario sin otra fuente: cierre sin deber automático.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: EVENT_FACT,
                value: "occurred",
              },
              { op: "not", condition: unresolved(LIFECYCLE_FACT) },
              { op: "not", condition: lifecycleActive() },
              {
                op: "fact_equals",
                fact_key: OTHER_SOURCE_FACT,
                value: "no",
              },
            ],
          },
          goto_outcome_key: "voluntary_closure",
          explanation:
            "El DPO era exclusivamente voluntario y no existe otra fuente de obligación: no se crea automáticamente deber de reemplazo.",
        },
        {
          rule_id: "pending-determination",
          description:
            "Falta información para determinar la vigencia del requerimiento.",
          when: {
            op: "any",
            conditions: [
              unresolved(EVENT_FACT),
              unresolved(LIFECYCLE_FACT),
              unresolved(OTHER_SOURCE_FACT),
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Existen antecedentes pendientes o sin información suficiente. Sin ellos no se emite la consecuencia.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La evaluación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "replacement_required",
      label: "Vacancia con reemplazo requerido",
      classification: "legal_requirement",
      explanation:
        "El requerimiento sigue vigente. Corresponde marcar vacancia y necesidad de reemplazo hasta nueva designación, preservando historial y continuidad.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Designar al reemplazante en D1.08",
          activity_key: "dpo.designate",
        },
        {
          kind: "info",
          label: "Conservar el expediente de término",
          note: "Archiva el registro de término o cambio con fecha efectiva y causa, el historial de designación preservado, la evidencia de comunicación a la Agencia y el estado de vacancia y reemplazo.",
        },
      ],
    },
    {
      outcome_key: "voluntary_closure",
      label: "Cierre sin reemplazo automático",
      classification: "legal_requirement",
      explanation:
        "DPO exclusivamente voluntario sin otra fuente de obligación. Se cierra sin crear automáticamente deber de reemplazo; corresponde reevaluar si surge una fuente de obligación.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente de término",
          note: "Archiva el registro de término o cambio con fecha efectiva y causa, el historial de designación preservado y la evidencia de comunicación a la Agencia.",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o sin información suficiente. Revisa el ciclo de vida del MPI y los demás puntos antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Revisar el ciclo de vida del MPI",
          activity_key: "mpi.lifecycle_review",
        },
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "Sin designación previa",
      classification: "agency_standard",
      explanation:
        "Sin designación previa no hay término que gestionar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Designar DPO en D1.08",
          activity_key: "dpo.designate",
        },
      ],
    },
    {
      outcome_key: "no_pending_event",
      label: "Sin evento por gestionar",
      classification: "agency_standard",
      explanation:
        "No ocurrió término ni cambio. Nada que gestionar por esta vía.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar ante un nuevo evento",
        },
      ],
    },
  ],
};
