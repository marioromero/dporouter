import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.07.
 *
 * activity_key = mpi.internal_regulation_integrate (procedure).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D1.07. Los pasos genuinamente condicionales del
 * canon (reglamento interno y publicidad, "cuando corresponda") usan la
 * opción explícita "No aplica en este caso" en lugar de forzar una
 * verificación inexistente. Los estados Pendiente e Incorporado se
 * distinguen por los valores de cada verificación.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04 o Diagnóstico (`mpi.lifecycle_status` declarado en
 * `external_fact_keys`): es prerrequisito de entrada, nunca una
 * re-evaluación de adopción.
 *
 * La expresión "según corresponda" del canon introduce una única
 * condición real de aplicabilidad: la sujeción al Reglamento Interno
 * de los artículos 153 y siguientes del Código del Trabajo. Se resuelve
 * explícitamente en `bylaws-applicability`: solo cuando aplica son
 * exigibles `update-bylaws` y `verify-publicity`; cuando no aplica,
 * ambos se cierran legítimamente como No aplica sin constituir brecha.
 * No aplica es distinto de Pendiente y de Sin información, y nunca
 * puede omitir los requisitos contractuales generales.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";
const APPLICABILITY_FACT = "mpi.regulation.bylaws_applicable";

const COMPONENT_FACTS = [
  "mpi.regulation.subjects_identified",
  "mpi.regulation.instruments_identified",
  "mpi.regulation.obligations_incorporated",
  APPLICABILITY_FACT,
  "mpi.regulation.bylaws_updated",
  "mpi.regulation.publicity_verified",
];

/** Estados de adopción que habilitan la integración (canon D1.07). */
const ELIGIBLE = ["adoption_formalized", "implementing", "implemented"];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function verifiedOrNa(fact_key: string): FactCondition {
  return { op: "fact_in", fact_key, values: ["yes", "na"] };
}

function lifecycleEligible(): FactCondition {
  return { op: "fact_in", fact_key: LIFECYCLE_FACT, values: ELIGIBLE };
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

export const MPI_REGULATION_INTEGRATE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.internal_regulation_integrate.v1",
  activity_key: "mpi.internal_regulation_integrate",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de integración regulatoria interna",
  description:
    "Verifica que las obligaciones del programa queden incorporadas en los instrumentos laborales y contractuales que correspondan, con publicidad cuando aplique.",
  entry_node_key: "identify-subjects",
  decision_fact_keys: COMPONENT_FACTS,
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "identify-subjects",
      node_type: "question",
      title: "Alcanzados por el programa",
      prompt:
        "¿Quedaron identificados los trabajadores, empleados y prestadores alcanzados por el programa?",
      why_it_matters:
        "Sin identificar a los alcanzados no es posible determinar qué instrumentos deben integrarse.",
      fact_key: "mpi.regulation.subjects_identified",
      answer_type: "single_select",
      options: stateOptions("mpi.regulation.subjects_identified"),
      evidence_to_review: ["evidencia de incorporación"],
      evidence_review_help: [
        {
          evidence_item: "evidencia de incorporación",
          review_guide:
            "La evidencia debe permitir identificar qué trabajadores y prestadores están comprendidos por las obligaciones internas del MPI y cómo se determinó su alcance. La revisión debe relacionar los grupos alcanzados con los contratos o instrumentos internos pertinentes, considerando las funciones y vínculos aplicables.",
          no_evidence_guidance:
            "Se deben señalar los grupos de trabajadores o prestadores cuyo alcance no pudo confirmarse y los antecedentes necesarios para identificarlos. La existencia de cláusulas o documentos actualizados no demuestra por sí sola que se haya determinado a quiénes deben aplicarse.",
          expected_result:
            "Una identificación trazable de los grupos alcanzados por el programa y su relación con los instrumentos que requieren integración. Los vínculos o grupos cuya inclusión no pudo confirmarse deben quedar señalados para revisión.",
        },
      ],
      required_facts: [],
      default_next_node_key: "identify-instruments",
      provenance: "legal_requirement",
    },
    {
      node_key: "identify-instruments",
      node_type: "question",
      title: "Instrumentos por integrar",
      prompt:
        "¿Quedaron identificados los instrumentos contractuales e internos que requieren integración?",
      why_it_matters:
        "Sin identificar los instrumentos no es posible incorporar las obligaciones donde corresponden.",
      fact_key: "mpi.regulation.instruments_identified",
      answer_type: "single_select",
      options: stateOptions("mpi.regulation.instruments_identified"),
      evidence_to_review: [
        "cláusulas o anexos actualizados",
        "reglamento interno actualizado cuando corresponda",
      ],
      evidence_review_help: [
        {
          evidence_item: "cláusulas o anexos actualizados",
          review_guide:
            "La evidencia debe permitir identificar los contratos o anexos que requieren incorporar obligaciones del MPI y los grupos a los que corresponden. La revisión debe distinguir los instrumentos vigentes de los borradores y determinar cuáles necesitan actualización para reflejar las obligaciones aplicables al vínculo correspondiente.",
          no_evidence_guidance:
            "Se deben señalar los tipos de contrato o anexos que no pudieron identificarse y los antecedentes necesarios para determinar su necesidad de integración. La ausencia de una cláusula actualizada no permite concluir por sí sola que el instrumento no requiera cambios; primero debe confirmarse su alcance y aplicabilidad.",
          expected_result:
            "Una identificación trazable de los contratos o anexos que requieren integración, vinculada con los grupos alcanzados y el estado de cada instrumento. Los casos pendientes de revisión o actualización deben quedar señalados para orientar las siguientes etapas.",
        },
        {
          evidence_item: "reglamento interno actualizado cuando corresponda",
          review_guide:
            "La revisión debe determinar si la organización cuenta con un reglamento interno pertinente y si corresponde incorporar en él obligaciones del MPI. Cuando aplique, la evidencia debe permitir identificar la versión vigente y las disposiciones que requieren revisión, distinguiendo el instrumento existente de una propuesta de actualización.",
          no_evidence_guidance:
            "Se debe señalar si no fue posible localizar el reglamento, confirmar su vigencia o determinar si corresponde actualizarlo. La falta de un reglamento localizado no demuestra por sí sola que sea exigible en ese contexto; la aplicabilidad debe confirmarse según la regulación y las características de la organización.",
          expected_result:
            "Una determinación documentada sobre la aplicabilidad del reglamento interno y, cuando corresponda, una identificación de la versión que requiere integración. Las dudas sobre vigencia, alcance o necesidad de actualización deben quedar señaladas sin presumir que este instrumento resulta obligatorio en todos los casos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "incorporate-obligations",
      provenance: "legal_requirement",
    },
    {
      node_key: "incorporate-obligations",
      node_type: "question",
      title: "Obligaciones incorporadas",
      prompt:
        "¿Quedaron incorporadas las obligaciones del programa según corresponda?",
      why_it_matters:
        "Sin incorporación efectiva las obligaciones del programa no rigen en la relación interna o contractual.",
      fact_key: "mpi.regulation.obligations_incorporated",
      answer_type: "single_select",
      options: stateOptions("mpi.regulation.obligations_incorporated"),
      evidence_to_review: [
        "cláusulas o anexos actualizados",
        "evidencia de incorporación",
      ],
      evidence_review_help: [
        {
          evidence_item: "cláusulas o anexos actualizados",
          review_guide:
            "La evidencia debe permitir verificar que las obligaciones pertinentes del MPI se incorporaron expresamente en los contratos de trabajo o de prestación de servicios aplicables. Debe identificarse la versión vigente del instrumento y la correspondencia entre sus cláusulas y las obligaciones del programa, sin confundir propuestas de cambio con incorporaciones efectivas.",
          no_evidence_guidance:
            "Se deben señalar los instrumentos cuya actualización no pudo confirmarse y los antecedentes necesarios para verificarla. La existencia de borradores, modelos de cláusulas o acuerdos pendientes no demuestra que las obligaciones hayan sido incorporadas efectivamente en los contratos aplicables.",
          expected_result:
            "Evidencia trazable de las cláusulas incorporadas en los instrumentos pertinentes, con identificación de su versión y estado. Los instrumentos pendientes, las incorporaciones parciales y las situaciones cuya aplicabilidad no esté confirmada deben quedar diferenciados.",
        },
        {
          evidence_item: "evidencia de incorporación",
          review_guide:
            "La evidencia debe permitir vincular las obligaciones del MPI con los instrumentos internos o contractuales en los que fueron incorporadas. La revisión debe distinguir la incorporación efectiva de la mera identificación del instrumento, y considerar por separado el reglamento interno cuando corresponda.",
          no_evidence_guidance:
            "Se deben identificar las obligaciones o instrumentos cuya incorporación no pudo acreditarse y los antecedentes necesarios para confirmarla. La falta de evidencia localizada no demuestra por sí sola que la incorporación no exista, pero impide darla por verificada.",
          expected_result:
            "Una trazabilidad verificable entre las obligaciones pertinentes del MPI, los instrumentos aplicables y la evidencia de su incorporación efectiva. Las brechas y situaciones pendientes de confirmación deben quedar registradas sin presumir que todos los instrumentos resultan aplicables a cualquier organización.",
        },
      ],
      required_facts: [],
      default_next_node_key: "bylaws-applicability",
      provenance: "legal_requirement",
    },
    {
      node_key: "bylaws-applicability",
      node_type: "question",
      title: "Aplicabilidad del Reglamento Interno",
      prompt:
        "¿Está la organización sujeta al Reglamento Interno de los artículos 153 y siguientes del Código del Trabajo?",
      why_it_matters:
        "De esta determinación depende la exigibilidad de la rama de reglamento y publicidad: solo cuando aplica deben incorporarse y publicarse.",
      fact_key: "mpi.regulation.bylaws_applicable",
      answer_type: "single_select",
      options: [
        {
          value: "applies",
          label: "Sí, sujeta",
          description:
            "La organización está sujeta al Reglamento Interno: la rama es exigible.",
          fact_effect: {
            fact_key: "mpi.regulation.bylaws_applicable",
            value: "applies",
          },
        },
        {
          value: "not_applies",
          label: "No sujeta",
          description:
            "La organización no está sujeta: la rama puede cerrarse como No aplica.",
          fact_effect: {
            fact_key: "mpi.regulation.bylaws_applicable",
            value: "not_applies",
          },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "mpi.regulation.bylaws_applicable",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "revisión de reglamento interno",
        "revisión documental",
      ],
      evidence_review_help: [
        {
          evidence_item: "revisión de reglamento interno",
          review_guide:
            "La evaluación debe determinar expresamente si la organización está sujeta al artículo 153 del Código del Trabajo, considerando si ocupa normalmente diez o más trabajadores permanentes y el régimen jurídico aplicable. La conclusión debe fundamentarse en antecedentes verificables y dejar registrada la aplicabilidad de esta rama antes de revisar su cumplimiento.",
          no_evidence_guidance:
            "Se deben identificar los antecedentes pendientes para determinar la sujeción, como la dotación habitual, la distribución de trabajadores o el régimen jurídico aplicable. La falta de un reglamento localizado no demuestra que la organización esté exenta ni permite resolver por sí sola la aplicabilidad.",
          expected_result:
            "Una conclusión documentada sobre si corresponde aplicar la rama del Reglamento Interno, con fundamentos identificables y las incertidumbres pendientes claramente señaladas. La determinación debe preceder a la evaluación de incorporación y publicidad exigibles cuando corresponda.",
        },
        {
          evidence_item: "revisión documental",
          review_guide:
            "Los antecedentes deben permitir corroborar la conclusión de aplicabilidad, considerando registros de dotación habitual, información laboral y el régimen jurídico de la organización. La revisión debe distinguir los hechos acreditados de los supuestos y dejar trazabilidad suficiente para justificar si procede continuar con la rama reglamentaria.",
          no_evidence_guidance:
            "Se deben indicar los antecedentes que faltan para resolver la sujeción y qué información permitiría confirmarla. No debe clasificarse la rama como no aplicable únicamente por ausencia de documentos, ni continuar como si la exigibilidad estuviera confirmada cuando la conclusión siga pendiente.",
          expected_result:
            "Un registro verificable de los antecedentes examinados, la conclusión de aplicabilidad y su fundamento. Si la información es insuficiente, la determinación debe permanecer pendiente, sin presumir que las obligaciones de incorporación y publicidad aplican o están descartadas.",
        },
      ],
      help_text: [
        "Resuelve explícitamente la sujeción antes de verificar la rama: de ello depende qué resulta exigible.",
      ],
      required_facts: [],
      default_next_node_key: "update-bylaws",
      provenance: "legal_requirement",
    },
    {
      node_key: "update-bylaws",
      node_type: "question",
      title: "Reglamento interno",
      prompt:
        "¿Se coordinó la incorporación al reglamento interno, o se descartó fundadamente su aplicación?",
      why_it_matters:
        "Cuando resulta aplicable, el reglamento interno debe reflejar las obligaciones del programa.",
      fact_key: "mpi.regulation.bylaws_updated",
      answer_type: "single_select",
      options: conditionalOptions(
        "mpi.regulation.bylaws_updated",
        "La organización no está sujeta al Reglamento Interno: la rama queda legítimamente fuera.",
      ),
      evidence_to_review: ["reglamento interno actualizado cuando corresponda"],
      evidence_review_help: [
        {
          evidence_item: "reglamento interno actualizado cuando corresponda",
          review_guide:
            "La revisión debe partir de la conclusión documentada sobre la sujeción de la organización al Reglamento Interno. Si resulta aplicable, debe verificarse que las obligaciones pertinentes del MPI se hayan incorporado en la versión correspondiente y se hayan coordinado las medidas de publicidad exigibles; si no aplica, debe constar el fundamento de esa conclusión.",
          no_evidence_guidance:
            "Si la rama resulta aplicable, se deben señalar la actualización o las medidas de publicidad pendientes. Si se determinó que no aplica, debe existir respaldo de la conclusión; la falta de un reglamento localizado no demuestra por sí sola que la organización esté exenta. Si la sujeción sigue sin resolverse, no debe presumirse ninguna de las dos conclusiones.",
          expected_result:
            "La incorporación verificable de las obligaciones del MPI en el Reglamento Interno y la evidencia de las medidas de publicidad pertinentes, cuando corresponda; o una conclusión fundada de no aplicabilidad. La rama debe quedar pendiente si no existe información suficiente para resolver la sujeción.",
        },
      ],
      help_text: [
        "Exigible solo cuando la organización está sujeta al Reglamento Interno. En caso contrario marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "verify-publicity",
      provenance: "legal_requirement",
    },
    {
      node_key: "verify-publicity",
      node_type: "question",
      title: "Publicidad correspondiente",
      prompt:
        "¿Se verificaron las medidas de publicidad correspondientes, o se descartó fundadamente su aplicación?",
      why_it_matters:
        "Sin publicidad la integración queda sin el conocimiento exigible de los alcanzados.",
      fact_key: "mpi.regulation.publicity_verified",
      answer_type: "single_select",
      options: conditionalOptions(
        "mpi.regulation.publicity_verified",
        "La organización no está sujeta al Reglamento Interno: la rama queda legítimamente fuera.",
      ),
      evidence_to_review: ["evidencia de publicidad cuando corresponda"],
      evidence_review_help: [
        {
          evidence_item: "evidencia de publicidad cuando corresponda",
          review_guide:
            "La evaluación debe partir de la conclusión documentada sobre la sujeción de la organización al Reglamento Interno. Si corresponde aplicar ese instrumento, deben verificarse las medidas de publicidad previstas en el artículo 156 del Código del Trabajo y la evidencia de su ejecución. Si no corresponde, debe quedar registrado el fundamento de la no aplicabilidad.",
          no_evidence_guidance:
            "Cuando la rama resulte aplicable, deben señalarse las medidas de publicidad pendientes o cuya ejecución no pudo acreditarse. Si se determinó que no aplica, debe existir respaldo de esa conclusión; la ausencia de evidencia de publicidad no demuestra por sí sola que la organización esté exenta. Si la sujeción sigue pendiente, no debe presumirse aplicabilidad ni exención.",
          expected_result:
            "Evidencia verificable de las medidas de publicidad exigibles cuando la organización está sujeta al Reglamento Interno, o una determinación fundada de «No aplica en este caso». La conclusión debe ser coherente con la actividad previa de aplicabilidad y distinguirse de la difusión general del MPI.",
        },
      ],
      help_text: [
        "Exigible solo cuando la organización está sujeta al Reglamento Interno. En caso contrario marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación de la integración",
      prompt:
        "El sistema verifica el prerrequisito de adopción y que cada verificación esté realizada.",
      answer_type: "none",
      required_facts: [LIFECYCLE_FACT, ...COMPONENT_FACTS],
      transitions: [
        {
          rule_id: "not-adopted",
          description:
            "Sin adopción formalizada no inicia la integración.",
          when: { op: "not", condition: lifecycleEligible() },
          goto_outcome_key: "not_started",
          explanation:
            "La integración materializa obligaciones del programa adoptado. Primero corresponde formalizar la adopción.",
        },
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: la integración sigue en curso.",
          when: { op: "any", conditions: COMPONENT_FACTS.map(unresolved) },
          goto_outcome_key: "integration_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. La integración aún no queda incorporada.",
        },
        {
          rule_id: "branch-required-but-skipped",
          description:
            "La rama aplica pero se marcó No aplica: no omite requisitos exigibles.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: APPLICABILITY_FACT,
                value: "applies",
              },
              {
                op: "any",
                conditions: [
                  {
                    op: "fact_equals",
                    fact_key: "mpi.regulation.bylaws_updated",
                    value: "na",
                  },
                  {
                    op: "fact_equals",
                    fact_key: "mpi.regulation.publicity_verified",
                    value: "na",
                  },
                ],
              },
            ],
          },
          goto_outcome_key: "integration_in_progress",
          explanation:
            "La organización está sujeta al Reglamento Interno: la rama de reglamento y publicidad es exigible y No aplica no la omite.",
        },
        {
          rule_id: "branch-dismissed-but-verified",
          description:
            "Determinación contradictoria entre aplicabilidad y verificación.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: APPLICABILITY_FACT,
                value: "not_applies",
              },
              {
                op: "any",
                conditions: [
                  isDone("mpi.regulation.bylaws_updated"),
                  isDone("mpi.regulation.publicity_verified"),
                ],
              },
            ],
          },
          goto_outcome_key: "integration_in_progress",
          explanation:
            "La rama se declaró no aplicable pero figura como verificada: revisa la determinación de sujeción o la verificación.",
        },
        {
          rule_id: "all-verified",
          description:
            "Adopción vigente, requisitos contractuales verificados y rama resuelta según su aplicabilidad.",
          when: {
            op: "all",
            conditions: [
              lifecycleEligible(),
              isDone("mpi.regulation.subjects_identified"),
              isDone("mpi.regulation.instruments_identified"),
              isDone("mpi.regulation.obligations_incorporated"),
              {
                op: "fact_in",
                fact_key: APPLICABILITY_FACT,
                values: ["applies", "not_applies"],
              },
              verifiedOrNa("mpi.regulation.bylaws_updated"),
              verifiedOrNa("mpi.regulation.publicity_verified"),
            ],
          },
          goto_outcome_key: "integration_complete",
          explanation:
            "Todas las verificaciones exigibles están realizadas y respaldadas; la rama no aplicable quedó legítimamente fuera sin constituir brecha.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en curso.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "integration_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "integration_complete",
      label: "Integración incorporada y evidenciada",
      classification: "legal_requirement",
      explanation:
        "La adopción está vigente y los alcanzados, instrumentos, obligaciones, reglamento y publicidad quedaron verificados o fundadamente descartados.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "mpi.internal_regulation_status", value: "integrated" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar el expediente de integración",
          note: "Archiva las cláusulas o anexos actualizados, el reglamento interno actualizado cuando corresponda, y la evidencia de incorporación y de publicidad cuando corresponda.",
        },
      ],
    },
    {
      outcome_key: "integration_in_progress",
      label: "Integración en curso",
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
      outcome_key: "not_started",
      label: "Aún sin adopción formalizada",
      classification: "agency_standard",
      explanation:
        "Sin adopción vigente no inicia la integración.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Formalizar la adopción en D1.04",
          activity_key: "mpi.formalize_adoption",
        },
      ],
    },
  ],
};
