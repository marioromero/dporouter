import type { ExecutionProtocol } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.02.
 *
 * activity_key = treatment.actor_roles (decision, treatment scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D2.02.
 *
 * Source of truth: `actors[]` (el rol pertenece a cada actor). La
 * completitud estructural se consume como derived facts, nunca como
 * pregunta manual. La corrección jurídica de la clasificación se
 * adopta como juicio profesional documentado (ReasoningRecord
 * treatment-scoped, uno para el conjunto; el canon no exige uno por
 * actor). Estructura completa jamás equivale automáticamente a
 * clasificación validada.
 */

const DRAFT_FACT = "actor_roles.working_conclusion";

export const TREATMENT_ACTOR_ROLES_PROTOCOL: ExecutionProtocol = {
  protocol_key: "treatment.actor_roles.v1",
  activity_key: "treatment.actor_roles",
  version: 1,
  mode: "decision",
  execution_scope: "treatment",
  title: "Evaluación guiada de actores y roles",
  description:
    "Verifica que los actores estén clasificados y documenta si la clasificación jurídica es correcta: estructura primero, juicio después.",
  entry_node_key: "structural-gate",
  decision_fact_keys: [
    "derived.treatment.actors_exist",
    "derived.treatment.actors_roles_complete",
  ],
  external_fact_keys: [
    "derived.treatment.actors_exist",
    "derived.treatment.actors_roles_complete",
  ],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Completitud estructural",
      prompt:
        "El sistema verifica que existan actores y que todos tengan rol registrado.",
      answer_type: "none",
      required_facts: [
        "derived.treatment.actors_exist",
        "derived.treatment.actors_roles_complete",
      ],
      transitions: [
        {
          rule_id: "structural-missing",
          description:
            "Sin actores o con roles por definir no hay clasificación que evaluar.",
          when: {
            op: "any",
            conditions: [
              {
                op: "fact_equals",
                fact_key: "derived.treatment.actors_exist",
                value: "no",
              },
              {
                op: "fact_equals",
                fact_key: "derived.treatment.actors_roles_complete",
                value: "no",
              },
            ],
          },
          goto_outcome_key: "actors_incomplete",
          explanation:
            "Faltan actores o roles por registrar. Completa la estructura en el workspace antes de evaluar.",
        },
        {
          rule_id: "ready-for-conclusion",
          description:
            "Estructura completa: base mínima para el juicio profesional.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: "derived.treatment.actors_exist",
                value: "yes",
              },
              {
                op: "fact_equals",
                fact_key: "derived.treatment.actors_roles_complete",
                value: "yes",
              },
            ],
          },
          goto_node_key: "adopt-conclusion",
          explanation:
            "Existe base mínima para que el profesional adopte una conclusión documentada.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "actors_incomplete",
          explanation:
            "La evaluación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      related_activity_keys: ["treatment.inventory_create"],
      provenance: "agency_standard",
    },
    {
      node_key: "adopt-conclusion",
      node_type: "question",
      title: "Adopción de la conclusión",
      prompt:
        "¿La clasificación jurídica de los actores es correcta según la evidencia revisada?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema: el sistema solo verificó que existe base suficiente para concluir.",
      fact_key: DRAFT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "classification_sound",
          label: "Clasificación correcta",
          description:
            "Juicio profesional: cada actor está correctamente clasificado con su evidencia.",
          fact_effect: { fact_key: DRAFT_FACT, value: "classification_sound" },
        },
        {
          value: "remediation_needed",
          label: "Requiere corrección",
          description:
            "Juicio profesional: existe al menos una clasificación que corregir.",
          fact_effect: { fact_key: DRAFT_FACT, value: "remediation_needed" },
        },
      ],
      evidence_to_review: [
        "matriz de actores por tratamiento",
        "rol asignado a cada actor",
        "contratos o antecedentes revisados",
        "evidencia de clasificación",
      ],
      evidence_review_help: [
        {
          evidence_item: "matriz de actores por tratamiento",
          review_guide:
            "Examinar las organizaciones o personas identificadas en cada operación y contrastarlas con los procesos, flujos y relaciones documentadas. Comprobar que las intervenciones relevantes estén consideradas y que la distribución de funciones refleje la realidad operacional, especialmente cuando una misma entidad participa en distintos tratamientos bajo responsabilidades diferentes.",
          no_evidence_guidance:
            "Consultar el inventario, los mapas de procesos y los antecedentes de las áreas involucradas para reconstruir las relaciones conocidas. Si existen participantes no identificados o intervenciones insuficientemente descritas, registrar las brechas y completar el levantamiento antes de considerar fundada la conclusión, sin asignar funciones por simple pertenencia a la organización.",
          expected_result:
            "Una relación de participantes individualizados por operación, coherente con los procesos examinados y suficientemente respaldada para evaluar sus responsabilidades. Las omisiones, intervenciones ambiguas o diferencias entre tratamientos deben quedar identificadas, sin presumir que una entidad conserva siempre la misma condición jurídica.",
        },
        {
          evidence_item: "rol asignado a cada actor",
          review_guide:
            "Contrastar las funciones atribuidas con las decisiones efectivas sobre finalidades y medios, así como con las instrucciones bajo las cuales se ejecutan las operaciones. Distinguir a quien determina el tratamiento de quien actúa por cuenta de otro, examinando eventuales discrepancias entre las responsabilidades declaradas y el funcionamiento real.",
          no_evidence_guidance:
            "Revisar descripciones operacionales, acuerdos, instrucciones y antecedentes de coordinación para aclarar cómo se toman las decisiones y quién ejecuta las actividades. Si las funciones no pueden determinarse con suficiente respaldo, identificar las asignaciones pendientes de revisión y evitar adoptar una clasificación favorable basada únicamente en denominaciones internas o contractuales.",
          expected_result:
            "Funciones jurídicamente evaluadas y vinculadas con cada operación, con fundamentos que permitan sostener o corregir las condiciones atribuidas. Las discrepancias o incertidumbres relevantes deben quedar documentadas para sustentar el juicio profesional, sin deducir automáticamente el resultado de la evaluación estructural del sistema.",
        },
        {
          evidence_item: "contratos o antecedentes revisados",
          review_guide:
            "Revisar el objeto de los acuerdos, las instrucciones de tratamiento, las facultades de decisión y las responsabilidades asumidas por las partes. Contrastar sus disposiciones con la ejecución efectiva de las operaciones, distinguiendo los encargos realizados por cuenta del responsable de las cesiones entre responsables. Cuando exista un encargo, considerar los elementos contractuales aplicables del artículo 15 bis.",
          no_evidence_guidance:
            "Consultar instrumentos vigentes, anexos, órdenes de servicio, comunicaciones y otros respaldos disponibles para identificar las condiciones reales de participación. Si faltan contratos exigibles o sus disposiciones resultan insuficientes o contradictorias, registrar la deficiencia y gestionar su revisión o formalización, sin inventar acuerdos ni presumir que la ausencia documental determina por sí sola el rol jurídico.",
          expected_result:
            "Antecedentes contractuales y operacionales contrastados, con identificación de las responsabilidades efectivas, las condiciones relevantes y las discrepancias que requieren aclaración. La documentación debe permitir fundamentar la clasificación adoptada o reconocer sus deficiencias, sin considerar suficiente una denominación contractual incompatible con los hechos.",
        },
        {
          evidence_item: "evidencia de clasificación",
          review_guide:
            "Comprobar los fundamentos utilizados para atribuir cada condición jurídica, relacionando las decisiones sobre fines y medios, las instrucciones existentes y las actuaciones efectivamente desarrolladas. Examinar si el razonamiento distingue los hechos comprobados de las interpretaciones profesionales y si justifica las diferencias de rol que pueda presentar un mismo actor entre operaciones.",
          no_evidence_guidance:
            "Recopilar los antecedentes disponibles y precisar qué hechos permiten sostener cada asignación. Cuando falte fundamentación o existan conclusiones contradictorias, documentar las cuestiones pendientes y efectuar las comprobaciones necesarias antes de adoptar una decisión favorable. No reconstruir ficticiamente evaluaciones anteriores ni presentar como acreditadas interpretaciones sin respaldo suficiente.",
          expected_result:
            "Una fundamentación jurídica documentada y vinculada con los antecedentes examinados, que permita justificar la clasificación o identificar las correcciones necesarias. La conclusión debe reflejar el juicio profesional efectivamente adoptado, incluyendo discrepancias e incertidumbres pertinentes, sin confundir la suficiencia estructural comprobada por el sistema con la corrección jurídica de los roles.",
        },
      ],
      help_text: [
        "Selecciona la alternativa y documenta tu razonamiento a continuación. La conclusión solo queda registrada al adoptar con razonamiento válido.",
      ],
      required_facts: [
        "derived.treatment.actors_exist",
        "derived.treatment.actors_roles_complete",
      ],
    },
  ],
  outcomes: [
    {
      outcome_key: "actors_incomplete",
      label: "Actores por completar",
      classification: "agency_standard",
      explanation:
        "Faltan actores o roles por registrar. La corrección jurídica solo puede evaluarse sobre estructura completa.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar actores en Tratamientos",
          note: "Agrega los actores del tratamiento y define el rol de cada uno en la sección Tratamientos de la empresa.",
        },
      ],
    },
    {
      outcome_key: "classification_sound",
      label: "Clasificación correcta",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la clasificación de actores es correcta para este tratamiento.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar la matriz de clasificación",
          note: "Archiva la matriz de actores por tratamiento con roles, contratos revisados y evidencia de clasificación.",
        },
      ],
    },
    {
      outcome_key: "remediation_needed",
      label: "Clasificación por corregir",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: existe al menos una clasificación que corregir antes de dar por establecido el mapa de actores.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir y reevaluar",
          note: "Corrige cada clasificación observada en el workspace y vuelve a adoptar conclusión con su razonamiento.",
        },
      ],
    },
  ],
  reasoning_requirements: {
    // Sin nodos de consideración (la base es estructural derivada):
    // el registro exige conclusión, pregunta, hechos, razonamiento,
    // autoría, fecha, fundamento y evidencia; no factores ni
    // alternativas automáticas.
    required_fields: [
      "conclusion",
      "legal_question",
      "facts_considered",
      "rationale",
      "decided_by",
      "decided_at",
      "legal_basis",
      "evidence_refs",
    ],
  },
};
