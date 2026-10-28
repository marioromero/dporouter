import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.20.
 *
 * activity_key = mpi.lifecycle_review (decision). Contenido aprobado
 * por la iteración vigente; usa exclusivamente pasos, evidencia, legal
 * basis, dependencias y aplicabilidad del contenido canónico D1.20. La
 * determinación genuina (el MPI continúa implementado frente a se
 * discontinúa, con consecuencias distintas) justifica el modo
 * decision: el ciclo vigente, los cambios revisados y la determinación
 * alimentan reglas determinísticas.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04, D1.18 o Diagnóstico (`mpi.lifecycle_status`
 * declarado en `external_fact_keys`): esta guía lo confirma y orienta
 * su documentación, nunca lo re-deriva ni lo escribe. La historia de
 * adopción e implementación, si existen, se usan como evidencia de
 * entrada (input_dependencies canónicas).
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce a la revisión documentada);
 * - product-ready: false (sin estado canónico materializable);
 * - motivo: la revisión escribe transiciones temporales del ciclo de
 *   vida con memoria del estado anterior y desactiva el requerimiento
 *   DPO condicionalmente; transición, condicionalidad e historial
 *   exceden el patrón simple `set` diferido. El canon además requiere
 *   ReasoningRecord, cuya vía queda diferida junto a la capa temporal.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";
const CHANGES_FACT = "mpi.lifecycle.changes_reviewed";
const DETERMINATION_FACT = "mpi.lifecycle.determination";

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

export const MPI_LIFECYCLE_REVIEW_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.lifecycle_review.v1",
  activity_key: "mpi.lifecycle_review",
  version: 1,
  mode: "decision",
  title: "Evaluación guiada de revisión del ciclo de vida",
  description:
    "Confirma que el estado registrado del MPI refleja su situación real y determina si continúa implementado o se discontinúa, con su documentación y resguardos.",
  entry_node_key: "changes-review",
  decision_fact_keys: [CHANGES_FACT, DETERMINATION_FACT],
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "changes-review",
      node_type: "question",
      title: "Cambios revisados",
      prompt:
        "¿Quedaron revisados los cambios organizacionales o decisiones que afectan la continuidad del MPI?",
      why_it_matters:
        "Sin revisar cambios no es posible determinar si el estado registrado sigue reflejando la realidad.",
      fact_key: CHANGES_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "yes",
          label: "Verificado",
          description: "Revisado y respaldado con evidencia.",
          fact_effect: { fact_key: CHANGES_FACT, value: "yes" },
        },
        {
          value: "no",
          label: "Pendiente",
          description: "Aún no realizado o sin evidencia suficiente.",
          fact_effect: { fact_key: CHANGES_FACT, value: "no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: CHANGES_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "revisión de lifecycle",
        "evidencia de cambios",
        "historia de adopción si el MPI llegó a adopción",
        "evidencia de implementación si el MPI llegó a implementación",
      ],
      help_text: [
        "Si el MPI llegó a adopción o a implementación, usa esa historia y evidencia como insumo de la revisión.",
      ],
      evidence_review_help: [
        {
          evidence_item: "revisión de lifecycle",
          review_guide:
            "Contrastar el estado interno registrado del MPI con las decisiones, antecedentes de adopción e implementación y la situación organizacional actualmente acreditada. Comprobar que la revisión identifique el estado de partida, fecha y fundamentos, distinguiendo evaluación, adopción, implementación, operación y eventual discontinuación sin inferirlos de la certificación.",
          no_evidence_guidance:
            "Revisar el historial del MPI, registros de evaluación, decisiones de órganos competentes y verificaciones de componentes para reconstruir el estado que puede acreditarse. Si falta una revisión documentada, registrar esa ausencia y las comprobaciones pendientes, sin cambiar automáticamente el estado ni presumir adopción, implementación o discontinuación.",
          expected_result:
            "Una revisión trazable del ciclo de vida del MPI que identifique el estado registrado, la situación actual comprobada y los antecedentes que sustentan su continuidad o la necesidad de revisar su clasificación. El resultado permite valorar si corresponde mantener o actualizar el estado interno, sin confundir implementación con certificación ni deducir discontinuación solo de una certificación vencida.",
        },
        {
          evidence_item: "evidencia de cambios",
          review_guide:
            "Examinar cambios organizacionales, operativos, contractuales o de gobierno y decisiones que puedan afectar responsables, recursos, componentes o continuidad efectiva del MPI. Verificar cuándo ocurrieron, quién los aprobó o comunicó y cómo inciden en la capacidad de mantener el programa, distinguiendo modificaciones ordinarias de decisiones formales de continuidad o discontinuación.",
          no_evidence_guidance:
            "Revisar actas, decisiones de dirección, reorganizaciones, cambios de responsables, modificaciones de procedimientos y comunicaciones internas para identificar antecedentes equivalentes o confirmar que no se detectaron cambios relevantes. Si hay indicios sin respaldo suficiente, registrar la información pendiente y su posible impacto, sin interpretar automáticamente una reorganización como discontinuación.",
          expected_result:
            "Cambios relevantes identificados y documentados, con evaluación de su impacto en la continuidad y componentes del MPI, o constancia fundada de que no se produjeron cambios relevantes. La revisión no exige evidencia de eventos inexistentes ni modifica el estado interno sin justificación.",
        },
        {
          evidence_item: "historia de adopción si el MPI llegó a adopción",
          review_guide:
            "Si el MPI llegó a la etapa de adopción, revisar la decisión interna que la respaldó, su fecha, responsables y antecedentes posteriores que permitan comprender su continuidad. Contrastar la historia con los cambios organizacionales examinados, distinguiendo la decisión de adoptar el programa de su implementación efectiva y de la certificación administrativa.",
          no_evidence_guidance:
            "Revisar actas, acuerdos, aprobaciones, expedientes internos y registros históricos para localizar la decisión de adopción cuando conste que esa etapa ocurrió. Si el MPI nunca fue adoptado, registrar esta evidencia como no aplicable; si la adopción ocurrió pero falta respaldo, señalar la insuficiencia sin inventar decisiones ni fechas.",
          expected_result:
            "Una historia de adopción identificable y coherente con el ciclo de vida cuando esa etapa se alcanzó, que permita comprobar la decisión inicial y cambios posteriores que la afecten. Si el programa permaneció en evaluación, tratar esta evidencia como no aplicable, no como incumplimiento de una obligación de adopción.",
        },
        {
          evidence_item: "evidencia de implementación si el MPI llegó a implementación",
          review_guide:
            "Si el MPI llegó a implementación, revisar antecedentes que acrediten la puesta en funcionamiento de sus componentes obligatorios y su continuidad operativa, conforme a las exigencias aplicables. Contrastar esa evidencia con cambios y decisiones posteriores para determinar si sigue implementado, presenta deficiencias que requieren revisión o fue objeto de discontinuación.",
          no_evidence_guidance:
            "Revisar el programa consolidado, evidencia de componentes, registros de funcionamiento, revisiones de brechas y decisiones internas para localizar antecedentes de implementación cuando esa etapa se alcanzó. Si el MPI no llegó a implementarse, registrar la evidencia como no aplicable; si llegó pero falta respaldo actual, señalar las comprobaciones pendientes sin deducir discontinuación automáticamente.",
          expected_result:
            "Evidencia suficiente y actualizada de implementación y continuidad operativa cuando se alcanzó esa etapa, con componentes funcionales y deficiencias o cambios relevantes identificados. La revisión permite distinguir un MPI implementado, uno con brechas de mantenimiento y uno formalmente discontinuado, sin equiparar la falta de certificación con falta de implementación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "continuity-determination",
      related_activity_keys: [
        "mpi.formalize_adoption",
        "mpi.assemble_program",
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "continuity-determination",
      node_type: "question",
      title: "Continuidad del programa",
      prompt:
        "¿El MPI sigue implementado o fue discontinuado?",
      why_it_matters:
        "La determinación define qué documentar: confirmación de vigencia o decisión de discontinuación con sus resguardos.",
      fact_key: DETERMINATION_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "continues",
          label: "Sigue implementado",
          description: "El programa continúa operativo.",
          fact_effect: { fact_key: DETERMINATION_FACT, value: "continues" },
        },
        {
          value: "discontinued",
          label: "Discontinuado",
          description: "El programa fue discontinuado.",
          fact_effect: { fact_key: DETERMINATION_FACT, value: "discontinued" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: DETERMINATION_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "revisión de componentes",
        "revisión de decisiones internas",
        "decisión interna cuando corresponda",
      ],
      evidence_review_help: [
        {
          evidence_item: "revisión de componentes",
          review_guide:
            "Comprobar si los componentes obligatorios del MPI que llegó a implementarse continúan operativos y cuentan con respaldo actualizado, incluyendo responsables, DPO, caracterización, matriz de riesgos, protocolos preventivos y mecanismos de reporte y control aplicables. Contrastar su funcionamiento real con el programa adoptado y los cambios organizacionales, distinguiendo continuidad efectiva de declaraciones o documentos históricos.",
          no_evidence_guidance:
            "Revisar el expediente consolidado del MPI, registros de implementación, verificaciones de componentes, antecedentes de funcionamiento y brechas identificadas para localizar respaldos actuales o precisar qué falta comprobar. Si la evidencia es insuficiente, registrar verificaciones pendientes y deficiencias sin inferir automáticamente discontinuación; si el MPI nunca llegó a implementarse, la falta de componentes operativos no prueba que haya sido discontinuado.",
          expected_result:
            "Una evaluación documentada de la continuidad operativa, que identifique componentes implementados, deficiencias y medidas o comprobaciones pendientes. Debe distinguir un MPI operativo de uno que requiere revisión, sin equiparar la falta de certificación con falta de implementación ni atribuir discontinuación sin respaldo suficiente.",
        },
        {
          evidence_item: "revisión de decisiones internas",
          review_guide:
            "Examinar decisiones de órganos o responsables competentes sobre continuidad, modificación, suspensión de actividades o eventual discontinuación del MPI, verificando fechas, fundamentos y alcance organizacional. Contrastar esas decisiones con la revisión de componentes y cambios identificados, diferenciando una decisión formal de discontinuación de ajustes operativos o reorganizaciones.",
          no_evidence_guidance:
            "Revisar actas, acuerdos, instrucciones de dirección, registros de gobierno interno y comunicaciones institucionales para localizar decisiones pertinentes o establecer si no se adoptó ninguna decisión de cambio de estado. Si no existen decisiones nuevas, documentarlo y evaluar la situación real del MPI; ante indicios sin respaldo, registrar la incertidumbre sin inventar acuerdos ni modificar automáticamente el ciclo de vida.",
          expected_result:
            "Una revisión trazable de las decisiones que afectan la continuidad del MPI, identificando contenido, autoridad interna, fecha y relación con su funcionamiento efectivo. El expediente debe permitir distinguir continuidad, necesidad de correcciones y discontinuación decidida, sin convertir una reorganización, brecha documental o cambio de certificación en decisión de cese.",
        },
        {
          evidence_item: "decisión interna cuando corresponda",
          review_guide:
            "Cuando se haya decidido discontinuar el MPI o modificar formalmente su estado, comprobar que exista un antecedente interno identificable con fecha, responsables competentes, fundamentos y alcance. Verificar su coherencia con la evaluación de continuidad y las medidas posteriores pertinentes, sin exigir una decisión de discontinuación cuando el programa sigue vigente y no se acordó su cese.",
          no_evidence_guidance:
            "Revisar acuerdos, actas, resoluciones internas, instrucciones y registros de aprobación para localizar la decisión cuando haya indicios de que se adoptó. Si no se decidió discontinuar o cambiar formalmente el MPI, registrar esta evidencia como no aplicable; si se afirma que hubo discontinuación sin respaldo suficiente, dejar pendiente su acreditación sin presumir una decisión válida ni crear documentos retrospectivos.",
          expected_result:
            "Una decisión interna verificable y coherente con los antecedentes de continuidad cuando efectivamente se haya acordado una discontinuación o cambio formal, con trazabilidad de fundamentos y responsables. Si el MPI continúa implementado y no se decidió su discontinuación, tratar la evidencia como no aplicable y documentar la conclusión de continuidad sin exigir un acto de cese inexistente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "lifecycle-assessment",
      provenance: "agency_standard",
    },
    {
      node_key: "lifecycle-assessment",
      node_type: "decision",
      title: "Síntesis de la revisión",
      prompt:
        "El sistema verifica el ciclo vigente y la determinación documentada.",
      answer_type: "none",
      required_facts: [LIFECYCLE_FACT, CHANGES_FACT, DETERMINATION_FACT],
      transitions: [
        {
          rule_id: "pending-review",
          description:
            "Falta información o revisión pendiente para concluir.",
          when: {
            op: "any",
            conditions: [
              unresolved(LIFECYCLE_FACT),
              unresolved(CHANGES_FACT),
              unresolved(DETERMINATION_FACT),
              {
                op: "fact_equals",
                fact_key: CHANGES_FACT,
                value: "no",
              },
            ],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Existen antecedentes pendientes, sin información o con revisión aún no realizada. Sin ellos no se emite la revisión.",
        },
        {
          rule_id: "lifecycle-confirmed",
          description:
            "Cambios revisados y programa que sigue implementado.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: CHANGES_FACT,
                value: "yes",
              },
              {
                op: "fact_equals",
                fact_key: DETERMINATION_FACT,
                value: "continues",
              },
            ],
          },
          goto_outcome_key: "lifecycle_confirmed",
          explanation:
            "Los cambios fueron revisados y el programa sigue implementado: corresponde documentar la confirmación de vigencia.",
        },
        {
          rule_id: "discontinuation-documented",
          description:
            "Cambios revisados y programa discontinuado.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: CHANGES_FACT,
                value: "yes",
              },
              {
                op: "fact_equals",
                fact_key: DETERMINATION_FACT,
                value: "discontinued",
              },
            ],
          },
          goto_outcome_key: "discontinuation_path",
          explanation:
            "Los cambios fueron revisados y el programa fue discontinuado: corresponde documentar la decisión con sus resguardos.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La revisión no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "lifecycle_confirmed",
      label: "Vigencia confirmada y documentada",
      classification: "agency_standard",
      explanation:
        "El estado registrado refleja la situación real y el programa sigue implementado.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Documentar la confirmación de vigencia",
          note: "Archiva la revisión de lifecycle con la evidencia de cambios revisada y la decisión interna cuando corresponda, manteniendo el estado actualizado.",
        },
      ],
    },
    {
      outcome_key: "discontinuation_path",
      label: "Discontinuación con resguardos",
      classification: "agency_standard",
      explanation:
        "El programa fue discontinuado. Documenta la decisión con su justificación, revisa si corresponde desactivar el requerimiento DPO de fuente MPI exclusiva y preserva la designación voluntaria.",
      detail:
        "No infieras el ciclo desde la certificación ni modifiques automáticamente la certificación: ambos estados se gestionan por separado.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Documentar la discontinuación",
          note: "Archiva la justificación de discontinuación, la decisión interna, el estado actualizado y la revisión del requerimiento DPO cuando la única fuente era el MPI.",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Revisión incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o sin información suficiente. Completa la revisión de cambios y la determinación antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar revisión",
        },
      ],
    },
  ],
};
