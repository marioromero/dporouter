import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.16.
 *
 * activity_key = dpo.governance_revalidation (checklist). Contenido
 * aprobado por la iteración vigente; usa exclusivamente los criterios,
 * evidencia, legal basis y dependencias del contenido canónico D1.16.
 * Replica la calibración de D1.09: cada check usa yes_no_unknown con
 * representación humana explícita por check. Sin score global; sin
 * usar Revisado como cumplimiento jurídico.
 *
 * La validación inicial disponible se usa como línea base de
 * comparación (input_dependency canónica). La remediación queda como
 * check explícito de apertura cuando corresponda.
 *
 * Registro de finalización:
 * - execution-ready: true (la guía conduce a la revalidación
 *   verificable);
 * - product-ready: false (sin estado canónico materializable);
 * - motivo: la revalidación es periódica y exige fecha dinámica de
 *   revisión; el canon además requiere ReasoningRecord, cuya vía de
 *   juicio documentado queda diferida junto a la capa temporal. Los
 *   outcomes instruyen la documentación con su evidencia canónica.
 */

const CHECK_FACTS = [
  "dpo.revalidation.changes",
  "dpo.revalidation.conflicts",
  "dpo.revalidation.resources",
  "dpo.revalidation.updating",
  "dpo.revalidation.access",
  "dpo.revalidation.remediation",
];

const DECISION_FACTS = ["dpo.designated", ...CHECK_FACTS];

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function checkOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Revisado y satisfactorio",
      description: "Verificado conforme al criterio evaluado.",
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

export const DPO_GOVERNANCE_REVALIDATION_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.governance_revalidation.v1",
  activity_key: "dpo.governance_revalidation",
  version: 1,
  mode: "checklist",
  title: "Revisión guiada de revalidación de gobernanza del DPO",
  description:
    "Revalida periódicamente y ante cambios relevantes que la autonomía, independencia, idoneidad, recursos y ausencia de conflictos del DPO se mantengan efectivas.",
  entry_node_key: "designation-gate",
  decision_fact_keys: DECISION_FACTS,
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "designation-gate",
      node_type: "question",
      title: "DPO designado",
      prompt: "¿Existe actualmente un DPO designado?",
      why_it_matters:
        "La revalidación recae sobre la gobernanza efectiva del DPO designado. Sin designación corresponde designar primero.",
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
            "Verificar que el expediente permita identificar a la persona actualmente designada como DPO, la entidad que efectuó la designación y su vigencia. Revisar el acto, comunicación o instrumento correspondiente y comprobar si existen cambios, sustituciones o términos de funciones que afecten la continuidad de la designación.",
          no_evidence_guidance:
            "Pueden revisarse actos de nombramiento, comunicaciones institucionales, registros internos o instrumentos equivalentes que permitan acreditar la designación vigente. Distinguir entre un expediente existente pero no localizado, una designación cuya vigencia no puede confirmarse y la ausencia efectiva de un DPO designado.",
          expected_result:
            "Una designación vigente e identificable que permita determinar sobre qué DPO corresponde efectuar la revalidación de gobernanza. Si no existe designación actual, corresponde abordar primero esa situación por la vía pertinente, sin evaluar como vigentes condiciones de gobernanza de un DPO inexistente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-changes",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay gobernanza que revalidar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. La revalidación requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-changes",
      node_type: "question",
      title: "Cambios de cargo, funciones o estructura",
      prompt:
        "¿Se revisaron los cambios de cargo, funciones o estructura que afectan al DPO?",
      why_it_matters:
        "Los cambios organizacionales pueden alterar las condiciones bajo las cuales opera el DPO.",
      fact_key: "dpo.revalidation.changes",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.revalidation.changes"),
      evidence_to_review: [
        "checklist o informe de revalidación",
        "validación inicial D1.09 como línea base cuando exista",
      ],
      evidence_review_help: [
        {
          evidence_item: "checklist o informe de revalidación",
          review_guide:
            "Verificar que la revalidación considere los cambios de cargo, funciones, responsabilidades o estructura organizacional ocurridos desde la designación o la revisión anterior del DPO. Comprobar si se evaluó su posible efecto sobre la independencia, autonomía, línea de reporte y capacidad de ejercer las funciones de supervisión, distinguiendo cambios relevantes de modificaciones sin impacto identificado.",
          no_evidence_guidance:
            "Pueden revisarse organigramas, descripciones de cargo, comunicaciones de reorganización, entrevistas o registros internos que permitan reconstruir los cambios y su evaluación. Distinguir entre una revisión efectuada sin respaldo localizado, cambios todavía no evaluados y una situación en que no se identificaron modificaciones relevantes.",
          expected_result:
            "Un registro trazable de los cambios identificados y de su impacto, o constancia fundada de que no se detectaron cambios relevantes durante el período examinado. No se exige un formato universal de checklist ni la existencia obligatoria de cambios, pero sí una revisión suficiente para determinar si las condiciones de gobernanza siguen siendo adecuadas.",
        },
        {
          evidence_item: "validación inicial D1.09 como línea base cuando exista",
          review_guide:
            "Cuando exista una validación inicial D1.09, contrastar sus antecedentes sobre cargo, funciones, estructura y condiciones de gobernanza con la situación actual del DPO. Identificar las diferencias relevantes y verificar si fueron consideradas en la revalidación, sin tratar la evaluación inicial como prueba suficiente de que las condiciones permanecen vigentes.",
          no_evidence_guidance:
            "Pueden consultarse el expediente de designación, evaluaciones anteriores, organigramas históricos o antecedentes equivalentes que permitan reconstruir una línea base razonable. Si no existe una validación inicial D1.09 disponible, registrar esa circunstancia y continuar la evaluación con la información actual, sin presumir automáticamente un incumplimiento de esta actividad.",
          expected_result:
            "Una comparación documentada con D1.09 cuando esté disponible, que permita reconocer cambios y posibles efectos sobre la gobernanza del DPO. En ausencia de esa línea base, la revalidación puede sustentarse en otros antecedentes verificables, dejando constancia de las limitaciones de la comparación histórica.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-conflicts",
      related_activity_keys: ["dpo.initial_governance_validation"],
      provenance: "agency_standard",
    },
    {
      node_key: "check-conflicts",
      node_type: "question",
      title: "Conflictos de interés",
      prompt: "¿Se reevaluaron los conflictos de interés del DPO?",
      why_it_matters:
        "Nuevas funciones o vínculos pueden crear conflictos incompatibles con la función.",
      fact_key: "dpo.revalidation.conflicts",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.revalidation.conflicts"),
      evidence_to_review: [
        "checklist o informe de revalidación",
        "declaración o evaluación de conflictos",
      ],
      evidence_review_help: [
        {
          evidence_item: "checklist o informe de revalidación",
          review_guide:
            "Verificar que la revalidación examine las funciones, responsabilidades y vínculos actuales del DPO para identificar posibles conflictos, en especial si hubo cambios desde la evaluación anterior. Comprobar si se consideró su participación en decisiones sobre tratamientos que luego deba supervisar, distinguiendo riesgos identificados de incompatibilidades constatadas.",
          no_evidence_guidance:
            "Pueden revisarse descripciones de cargo, organigramas, asignaciones de funciones, entrevistas o evaluaciones internas que permitan reconstruir el análisis. Distinguir entre una revisión efectuada sin respaldo localizado, una evaluación incompleta y la ausencia de conflictos tras examinar las responsabilidades reales.",
          expected_result:
            "Un registro trazable de la reevaluación, con conflictos reales o potenciales detectados y cuestiones que requieren aclaración o corrección identificados. Si no se detectan conflictos, debe constar una conclusión sustentada en las funciones efectivamente desempeñadas.",
        },
        {
          evidence_item: "declaración o evaluación de conflictos",
          review_guide:
            "Examinar la declaración o evaluación disponible y comprobar que refleje la situación actual del DPO, incluidas funciones adicionales, relaciones jerárquicas y responsabilidades que puedan comprometer su independencia. Contrastar su contenido con antecedentes organizacionales verificables, pues una declaración formal de ausencia de conflictos no sustituye la evaluación de las funciones reales.",
          no_evidence_guidance:
            "Pueden consultarse evaluaciones anteriores, instrumentos de designación, antecedentes de funciones o comunicaciones institucionales que permitan determinar si se examinaron posibles conflictos. Distinguir entre una evaluación existente pero no localizada y la ausencia de una revisión suficiente, sin exigir universalmente una declaración firmada en formato específico.",
          expected_result:
            "Una evaluación actualizada y sustentada que permita determinar si el DPO mantiene condiciones compatibles con el ejercicio independiente de sus funciones. Cuando se identifiquen conflictos, deben quedar reconocidos para su tratamiento por quienes corresponda; si no existen, la conclusión debe estar razonablemente fundamentada.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-resources",
      provenance: "agency_standard",
    },
    {
      node_key: "check-resources",
      node_type: "question",
      title: "Recursos y disponibilidad",
      prompt:
        "¿Se revisó la suficiencia de recursos y disponibilidad del DPO?",
      why_it_matters:
        "Sin recursos ni tiempo la función pierde efectividad aunque la designación continúe.",
      fact_key: "dpo.revalidation.resources",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.revalidation.resources"),
      evidence_to_review: [
        "checklist o informe de revalidación",
        "evidencia revisada",
      ],
      evidence_review_help: [
        {
          evidence_item: "checklist o informe de revalidación",
          review_guide:
            "Verificar que la revalidación evalúe si el DPO cuenta actualmente con tiempo, medios, apoyo organizacional y acceso a recursos suficientes para desempeñar sus funciones. Comprobar que el análisis considere la dimensión de la entidad, sus operaciones de tratamiento, los riesgos y las demás responsabilidades del DPO, sin limitarse a confirmar la vigencia formal de la asignación inicial.",
          no_evidence_guidance:
            "Pueden revisarse evaluaciones internas, entrevistas, registros de carga de trabajo, asignaciones de funciones o antecedentes equivalentes que permitan reconstruir la revisión. Distinguir entre una evaluación realizada sin respaldo localizado, información insuficiente para determinar la suficiencia y una revisión que identifica condiciones adecuadas sin medidas adicionales.",
          expected_result:
            "Una evaluación trazable y proporcional que permita concluir si los recursos y la disponibilidad actuales son suficientes para el ejercicio efectivo de las funciones del DPO. Si existen limitaciones relevantes, identificarlas para su tratamiento por quienes corresponda, sin exigir un presupuesto, dotación o régimen de dedicación uniforme.",
        },
        {
          evidence_item: "evidencia revisada",
          review_guide:
            "Examinar antecedentes que sustenten la evaluación de recursos y disponibilidad, como distribución de responsabilidades, carga de trabajo, apoyo administrativo o técnico y medios efectivamente accesibles. Contrastar las asignaciones formales con las condiciones reales y considerar si el DPO puede atender oportunamente sus tareas de asesoría, supervisión y comunicación.",
          no_evidence_guidance:
            "Pueden consultarse descripciones de cargo, registros de actividades, asignaciones presupuestarias cuando existan, entrevistas o comunicaciones sobre necesidades de apoyo. Distinguir entre documentación no localizada, antecedentes incompletos y falta efectiva de recursos, sin presumir suficiencia o insuficiencia por la presencia o ausencia de un documento presupuestario.",
          expected_result:
            "Antecedentes verificables que respalden la conclusión sobre suficiencia de medios y disponibilidad efectiva del DPO, con las limitaciones detectadas cuando corresponda. La evidencia debe permitir reconocer necesidades de ajuste sin convertir la dedicación exclusiva, un equipo propio o una partida presupuestaria separada en requisitos universales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-updating",
      provenance: "agency_standard",
    },
    {
      node_key: "check-updating",
      node_type: "question",
      title: "Actualización de conocimientos",
      prompt:
        "¿Se revisó la actualización de conocimientos del DPO?",
      why_it_matters:
        "La idoneidad inicial se erosiona sin actualización profesional continua.",
      fact_key: "dpo.revalidation.updating",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.revalidation.updating"),
      evidence_to_review: [
        "checklist o informe de revalidación",
        "evidencia revisada",
      ],
      evidence_review_help: [
        {
          evidence_item: "checklist o informe de revalidación",
          review_guide:
            "Verificar que la revalidación examine si los conocimientos del DPO siguen actualizados respecto de la normativa de protección de datos, criterios relevantes de la autoridad y jurisprudencia aplicable. Considerar las funciones desempeñadas y los cambios normativos u organizacionales que puedan generar nuevas necesidades de actualización.",
          no_evidence_guidance:
            "Pueden revisarse evaluaciones profesionales, entrevistas, registros de formación, actividades de actualización u otros antecedentes que permitan reconstruir el análisis. Distinguir entre una revisión efectuada sin respaldo localizado, información insuficiente y una evaluación que concluye fundadamente que los conocimientos actuales son adecuados.",
          expected_result:
            "Una evaluación trazable que permita determinar si los conocimientos del DPO siguen siendo pertinentes y suficientes para sus funciones. Si se detectan brechas, identificarlas para su tratamiento, sin exigir una certificación, curso o cantidad uniforme de horas de capacitación.",
        },
        {
          evidence_item: "evidencia revisada",
          review_guide:
            "Examinar antecedentes que sustenten la actualización profesional del DPO, como formación pertinente, estudio de cambios normativos, actividades especializadas o aplicación documentada de conocimientos recientes. Valorar su actualidad y relación con las responsabilidades del cargo, sin equiparar la asistencia a una capacitación con conocimientos suficientes.",
          no_evidence_guidance:
            "Pueden consultarse materiales de actualización, registros de actividades profesionales, análisis jurídicos, antecedentes de experiencia reciente o entrevistas. Distinguir entre documentos no localizados, falta de acreditación suficiente y ausencia efectiva de actualización, sin presumir incumplimiento por no existir certificados de cursos.",
          expected_result:
            "Antecedentes verificables que respalden una conclusión razonada sobre la vigencia y pertinencia de los conocimientos del DPO. La evidencia puede adoptar distintas formas y permitir identificar necesidades de actualización sin imponer credenciales o programas formativos no exigidos universalmente.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-access",
      provenance: "agency_standard",
    },
    {
      node_key: "check-access",
      node_type: "question",
      title: "Accesibilidad y línea de reporte",
      prompt:
        "¿Se revisaron la accesibilidad del DPO y su línea de reporte?",
      why_it_matters:
        "Sin acceso ni reporte directo la autonomía funcional se pierde en la práctica.",
      fact_key: "dpo.revalidation.access",
      answer_type: "yes_no_unknown",
      options: checkOptions("dpo.revalidation.access"),
      evidence_to_review: [
        "checklist o informe de revalidación",
        "organigrama o línea de reporte",
      ],
      evidence_review_help: [
        {
          evidence_item: "checklist o informe de revalidación",
          review_guide:
            "Verificar que la revalidación examine si el DPO conserva acceso efectivo y oportuno a la autoridad ante la cual rinde cuenta, y canales adecuados para recibir consultas y comunicaciones relacionadas con sus funciones. Comprobar si hay restricciones, intermediaciones o cambios organizacionales que dificulten el reporte directo o la accesibilidad, contrastando las condiciones previstas con su funcionamiento práctico.",
          no_evidence_guidance:
            "Pueden revisarse entrevistas, registros de comunicaciones, procedimientos internos o antecedentes de funcionamiento que permitan reconstruir cómo se ejerce el reporte y el contacto con el DPO. Distinguir entre una evaluación realizada sin respaldo localizado, información insuficiente y deficiencias efectivas de accesibilidad o reporte.",
          expected_result:
            "Una evaluación trazable que permita determinar si el DPO sigue siendo accesible y puede comunicarse directamente con la autoridad correspondiente al ejercer sus funciones. Si se detectan obstáculos relevantes, identificarlos para su corrección, sin exigir hallazgos ni un canal tecnológico único.",
        },
        {
          evidence_item: "organigrama o línea de reporte",
          review_guide:
            "Examinar el organigrama, instrumento de designación o antecedentes equivalentes para identificar a la autoridad ante la cual rinde cuenta el DPO y verificar que la relación de reporte directo siga vigente. Contrastar esa estructura con las prácticas reales de comunicación, especialmente ante cambios de jefaturas, dependencias o mecanismos de escalamiento.",
          no_evidence_guidance:
            "Pueden consultarse instrumentos de designación, descripciones de funciones, comunicaciones institucionales o entrevistas que permitan identificar la autoridad destinataria y la forma efectiva de reporte. Distinguir entre la falta de un organigrama formal y la imposibilidad de acreditar una línea directa; la primera no demuestra por sí sola la segunda.",
          expected_result:
            "Una línea de reporte identificable y vigente que permita comprobar la comunicación directa del DPO con la autoridad correspondiente, respaldada por antecedentes organizacionales y de funcionamiento. No se exige un organigrama de formato universal, pero sí condiciones que eviten intermediaciones obligatorias capaces de comprometer la autonomía funcional.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-remediation",
      provenance: "agency_standard",
    },
    {
      node_key: "check-remediation",
      node_type: "question",
      title: "Apertura de remediaciones",
      prompt:
        "¿Se abrieron las remediaciones cuando corresponde, o se descartó fundadamente su necesidad?",
      why_it_matters:
        "Sin remediación las brechas detectadas quedan sin tratamiento.",
      fact_key: "dpo.revalidation.remediation",
      answer_type: "yes_no_unknown",
      options: [
        {
          value: "yes",
          label: "Revisado y satisfactorio",
          description: "Remediaciones abiertas o innecesariedad constatada.",
          fact_effect: { fact_key: "dpo.revalidation.remediation", value: "yes" },
        },
        {
          value: "no",
          label: "Requiere acción o corrección",
          description: "Faltan remediaciones por abrir ante brechas.",
          fact_effect: { fact_key: "dpo.revalidation.remediation", value: "no" },
        },
        {
          value: "unknown",
          label: "Información insuficiente",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: "dpo.revalidation.remediation", value: "unknown" },
        },
      ],
      evidence_to_review: [
        "hallazgos",
        "acciones correctivas",
        "checklist o informe de revalidación",
      ],
      evidence_review_help: [
        {
          evidence_item: "hallazgos",
          review_guide:
            "Verificar si la revalidación identificó deficiencias en independencia, conflictos de interés, recursos, conocimientos, accesibilidad o línea de reporte. Comprobar que los hallazgos tengan antecedentes suficientes para determinar si requieren remediación, distinguiendo brechas constatadas de riesgos o situaciones pendientes de aclaración.",
          no_evidence_guidance:
            "Pueden revisarse los resultados de las actividades anteriores, entrevistas, evaluaciones organizacionales o registros internos que permitan determinar si se detectaron deficiencias. Distinguir entre hallazgos existentes pero no localizados, revisión insuficiente y una evaluación que no identificó brechas tras examinar las condiciones pertinentes.",
          expected_result:
            "Hallazgos identificables y trazables cuando existan deficiencias que requieran tratamiento, o constancia fundada de que la revalidación no detectó brechas que deban remediarse. No se exige generar hallazgos artificiales, pero tampoco descartar remediación mientras existan deficiencias relevantes sin evaluar.",
        },
        {
          evidence_item: "acciones correctivas",
          review_guide:
            "Cuando haya brechas que requieran tratamiento, verificar que existan acciones correctivas definidas o derivadas a responsables competentes, con antecedentes que permitan reconocer su propósito y estado. Distinguir la apertura o asignación de la remediación de su ejecución y cierre posteriores, sin atribuir al DPO decisiones organizacionales ajenas a sus competencias.",
          no_evidence_guidance:
            "Pueden revisarse planes de acción, instrucciones, registros de hallazgos, comunicaciones institucionales o mecanismos equivalentes de seguimiento. Distinguir entre acciones necesarias aún no abiertas, acciones existentes sin respaldo localizado y una conclusión fundada de que no se requieren correcciones.",
          expected_result:
            "Constancia de apertura o derivación de las remediaciones necesarias, vinculadas con las brechas y con responsables reconocibles cuando estén definidos. Si no hay deficiencias que requieran corrección, justificarlo con evidencia para sustentar «Revisado y satisfactorio»; no se exige que las acciones estén ejecutadas o cerradas en esta etapa.",
        },
        {
          evidence_item: "checklist o informe de revalidación",
          review_guide:
            "Examinar la revalidación consolidada para comprobar que sus conclusiones sobre cambios, conflictos, recursos, conocimientos y accesibilidad se reflejen en la decisión de abrir o descartar remediaciones. Verificar la coherencia entre las deficiencias detectadas, las acciones propuestas y cualquier fundamento para concluir que no corresponde iniciar medidas correctivas.",
          no_evidence_guidance:
            "Pueden consultarse las evaluaciones parciales anteriores, sus antecedentes de respaldo u otros registros que permitan reconstruir la conclusión global. Distinguir entre un informe no localizado, una consolidación pendiente y una revisión documentada que no identificó necesidades de corrección.",
          expected_result:
            "Una conclusión trazable sobre las brechas que requieren remediación y las que no, o un fundamento para marcar «Revisado y satisfactorio» cuando no haya acciones correctivas necesarias. La falta de información suficiente debe permanecer como «Información insuficiente», no presentarse como descarte fundado.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-assessment",
      provenance: "agency_standard",
    },
    {
      node_key: "final-assessment",
      node_type: "decision",
      title: "Síntesis de la revalidación",
      prompt:
        "El sistema distingue puntos validados, brechas e información por acreditar.",
      answer_type: "none",
      required_facts: [...DECISION_FACTS],
      transitions: [
        {
          rule_id: "gaps-found",
          description:
            "Al menos un check requiere acción o corrección.",
          when: { op: "any", conditions: CHECK_FACTS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas que requieren acción o corrección antes de dar por revalidada la gobernanza.",
        },
        {
          rule_id: "missing-info",
          description:
            "Algún antecedente está sin responder o con información insuficiente.",
          when: { op: "any", conditions: DECISION_FACTS.map(unresolved) },
          goto_outcome_key: "information_incomplete",
          explanation:
            "Falta información por acreditar. Con antecedentes pendientes no se emite revalidación definitiva.",
        },
        {
          rule_id: "all-validated",
          description:
            "DPO designado y los seis criterios revisados y satisfactorios.",
          when: {
            op: "all",
            conditions: [
              isYes("dpo.designated"),
              ...CHECK_FACTS.map(isYes),
            ],
          },
          goto_outcome_key: "governance_revalidated",
          explanation:
            "Todos los criterios de revalidación están revisados y satisfactorios.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin revalidar.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "information_incomplete",
          explanation:
            "La revalidación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "governance_revalidated",
      label: "Gobernanza revalidada",
      classification: "agency_standard",
      explanation:
        "Los seis criterios están revisados y satisfactorios para el DPO designado, según la evidencia revisada en esta sesión.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el informe de revalidación",
          note: "Archiva el checklist o informe de revalidación con la evidencia revisada, los hallazgos y las acciones correctivas cuando existan.",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere acciones correctivas",
      classification: "agency_standard",
      explanation:
        "Al menos un criterio presenta brechas. Documenta cada brecha y su medida correctiva en el informe de revalidación.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Documentar brechas y medidas correctivas",
          note: "Registra cada brecha detectada con su medida correctiva en el informe de revalidación.",
        },
      ],
    },
    {
      outcome_key: "information_incomplete",
      label: "Información insuficiente",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar revisión",
        },
      ],
    },
    {
      outcome_key: "prerequisite_missing",
      label: "DPO aún no designado",
      classification: "agency_standard",
      explanation:
        "Sin DPO designado no hay gobernanza que revalidar.",
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
