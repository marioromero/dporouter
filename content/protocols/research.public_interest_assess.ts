import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D5.05.
 *
 * activity_key = research.public_interest_assess (decision, purpose
 * scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente condiciones, evidencia y state effect del contenido
 * canónico D5.05. Exclusividad de finalidad e interés público son
 * juicio profesional verificado por attestación, nunca deducción:
 * la señal contextual no prueba ninguno.
 *
 * Reglas preservadas:
 * - sin dependency a D8: riesgos/mitigación se evalúan aquí sin
 *   afirmar reemplazo de EIPD;
 * - rama de riesgo solo exigible con sensibles vinculados;
 * - publicación con anonimización previa; sin publication entity;
 * - la regla de conservación especial es contexto para D2, sin
 *   sobrescribir retention ni facts (sin escrituras cross-scope).
 */

const CANDIDATE = "derived.purpose.d5_research_candidate";
const ITEMS = "res05.items_reviewed";
const EXCLUSIVITY = "res05.exclusivity_verified";
const PUBLIC_INTEREST = "res05.public_interest_verified";
const READY = "res05.analysis_ready";
const ROUTE = "res05.purpose_nature";
const DRAFT = "res05.working_conclusion";

function isYes(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function consideredOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Analizada con respaldo",
      description: "La condición fue analizada con respaldo revisable.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "No analizada",
      description: "La condición aún no ha sido analizada.",
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

export const RESEARCH_PUBLIC_INTEREST_ASSESS_PROTOCOL: ExecutionProtocol = {
  protocol_key: "research.public_interest_assess.v1",
  activity_key: "research.public_interest_assess",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada del régimen de investigación de interés público",
  description:
    "Estructura el análisis del art. 16 quinquies para la finalidad activa: naturaleza y exclusividad de la finalidad, interés público, calidad y seguridad, riesgos con sensibles, conservación y anonimización de publicaciones.",
  entry_node_key: "structural-gate",
  decision_fact_keys: [CANDIDATE, ITEMS, EXCLUSIVITY, PUBLIC_INTEREST, READY],
  external_fact_keys: [CANDIDATE],
  last_review: "2026-09-24",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "structural-gate",
      node_type: "decision",
      title: "Candidatura estructural",
      prompt:
        "El sistema verifica si la finalidad declara contexto histórico, estadístico, científico o de investigación.",
      answer_type: "none",
      required_facts: [CANDIDATE],
      transitions: [
        {
          rule_id: "candidate-yes",
          description: "La finalidad declara contexto de investigación.",
          when: isYes(CANDIDATE),
          goto_node_key: "items-review",
          explanation:
            "La finalidad pretende operar bajo contexto de investigación: corresponde el análisis del art. 16 quinquies.",
        },
        {
          rule_id: "candidate-no",
          description: "La finalidad declara otro contexto.",
          when: { op: "fact_equals", fact_key: CANDIDATE, value: "no" },
          goto_outcome_key: "regime_not_indicated",
          explanation:
            "Sin contexto de investigación declarado esta revisión no está indicada.",
        },
        {
          rule_id: "fallback-classification",
          description: "Sin declaración no inicia el análisis.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "classification_incomplete",
          explanation:
            "Declara el contexto de la finalidad antes del análisis jurídico.",
        },
      ],
      provenance: "agency_standard",
    },
    {
      node_key: "items-review",
      node_type: "question",
      title: "Datos vinculados revisados",
      prompt:
        "¿Se revisaron los datos actualmente vinculados a la finalidad y su clasificación como sensibles?",
      why_it_matters:
        "La obligación de riesgos y mitigación depende de si intervienen datos sensibles.",
      fact_key: ITEMS,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        ITEMS,
        "Los datos vinculados y su clasificación fueron revisados.",
      ),
      evidence_to_review: [
        "descripción de finalidad",
        "mapeo de datos",
      ],
      evidence_review_help: [
        {
          evidence_item: "descripción de finalidad",
          review_guide: "La finalidad debe expresar qué actividad histórica, estadística, científica o de investigación se pretende realizar y para qué se utilizan los datos. Una descripción genérica no permite comprobar si el tratamiento corresponde al régimen especial.",
          no_evidence_guidance: "Cuando el propósito resulte ambiguo, es necesario aclarar el uso efectivo de los datos antes de evaluar la aplicabilidad del artículo 16 quinquies. La sola denominación del proyecto no acredita su finalidad.",
          expected_result: "Una finalidad concreta y documentada que permita examinar su naturaleza, exclusividad e interés público.",
        },
        {
          evidence_item: "mapeo de datos",
          review_guide: "El mapeo debe identificar las categorías de datos vinculadas a la finalidad y permitir reconocer cuáles son sensibles. Interesa comprobar que la revisión cubra los datos efectivamente utilizados y no omita categorías relevantes para la evaluación de riesgos.",
          no_evidence_guidance: "Si la relación entre datos y finalidad está incompleta, las categorías pendientes deben identificarse y contrastarse con el tratamiento declarado. No corresponde presumir que los datos sin clasificar carecen de sensibilidad.",
          expected_result: "Un mapeo verificable de las categorías utilizadas, con información suficiente sobre su vinculación a la finalidad y su eventual carácter sensible.",
        },
      ],
      required_facts: [],
      default_next_node_key: "purpose-nature",
      provenance: "agency_standard",
    },
    {
      node_key: "purpose-nature",
      node_type: "question",
      title: "Naturaleza de la finalidad",
      prompt: "¿Cuál es la naturaleza principal de la finalidad evaluada?",
      why_it_matters:
        "El régimen especial exige encaje en fines históricos, estadísticos, científicos o de estudio e investigación.",
      fact_key: ROUTE,
      answer_type: "single_select",
      options: [
        {
          value: "historic",
          label: "Fines históricos",
          description: "La finalidad es predominantemente histórica.",
          fact_effect: { fact_key: ROUTE, value: "historic" },
        },
        {
          value: "statistical",
          label: "Fines estadísticos",
          description: "La finalidad es predominantemente estadística.",
          fact_effect: { fact_key: ROUTE, value: "statistical" },
        },
        {
          value: "scientific",
          label: "Fines científicos",
          description: "La finalidad es predominantemente científica.",
          fact_effect: { fact_key: ROUTE, value: "scientific" },
        },
        {
          value: "study_research",
          label: "Estudio o investigación",
          description: "La finalidad es un estudio o investigación.",
          fact_effect: { fact_key: ROUTE, value: "study_research" },
        },
        {
          value: "mixed",
          label: "Naturaleza mixta",
          description: "Combina varias naturalezas; documenta cada una en el razonamiento.",
          fact_effect: { fact_key: ROUTE, value: "mixed" },
        },
        {
          value: "none_identified",
          label: "Ninguna identificada",
          description: "No encaja en las naturalezas del régimen especial.",
          fact_effect: { fact_key: ROUTE, value: "none_identified" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: ROUTE, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "protocolo o proyecto de investigación",
        "descripción de finalidad",
      ],
      evidence_review_help: [
        {
          evidence_item: "protocolo o proyecto de investigación",
          review_guide: "El proyecto debe permitir reconocer los objetivos, las actividades previstas y su correspondencia con fines históricos, estadísticos, científicos o de estudio e investigación. La existencia de un documento denominado investigación no demuestra por sí sola el encaje jurídico.",
          no_evidence_guidance: "Si los objetivos no están suficientemente descritos, la naturaleza de la finalidad debe permanecer pendiente de determinación. Es necesario distinguir una actividad efectivamente investigativa de otros usos que solo incorporan análisis de datos.",
          expected_result: "Una caracterización fundamentada de la naturaleza del proyecto que permita determinar si corresponde a los fines contemplados por el artículo 16 quinquies.",
        },
        {
          evidence_item: "descripción de finalidad",
          review_guide: "La descripción debe permitir identificar la naturaleza principal de la finalidad y reconocer si combina varios fines comprendidos en el régimen. Una combinación de fines históricos y estadísticos, por ejemplo, no constituye automáticamente un uso ajeno al artículo.",
          no_evidence_guidance: "Cuando no pueda distinguirse la naturaleza de las actividades, la clasificación debe mantenerse pendiente. La existencia de varios objetivos requiere revisar su contenido, no descartar automáticamente la finalidad por ser mixta.",
          expected_result: "Una clasificación documentada de la finalidad, con las distintas naturalezas identificadas cuando corresponda.",
        },
      ],
      required_facts: [],
      default_next_node_key: "exclusivity-check",
      provenance: "legal_requirement",
    },
    {
      node_key: "exclusivity-check",
      node_type: "question",
      title: "Exclusividad de finalidad",
      prompt:
        "¿Se verificó que el tratamiento se realiza exclusivamente con alguno de esos fines (y que una finalidad mixta no se presenta como régimen especial)?",
      why_it_matters:
        "Sin exclusividad no hay régimen del art. 16 quinquies, por más que exista un componente de investigación.",
      fact_key: EXCLUSIVITY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        EXCLUSIVITY,
        "La exclusividad de la finalidad especial fue verificada.",
      ),
      evidence_to_review: [
        "descripción de finalidad",
        "mapeo de datos",
      ],
      evidence_review_help: [
        {
          evidence_item: "descripción de finalidad",
          review_guide: "La evaluación debe comprobar que el tratamiento se realiza exclusivamente para los fines especiales contemplados en la ley. La coexistencia de varios fines admitidos puede ser compatible con la exclusividad; un uso adicional ajeno al régimen requiere un análisis diferente.",
          no_evidence_guidance: "Si existen objetivos secundarios insuficientemente descritos, la exclusividad no debe presumirse acreditada. Las finalidades ajenas o pendientes de aclaración deben distinguirse de aquellas comprendidas por el artículo.",
          expected_result: "Una conclusión fundamentada sobre la exclusividad del tratamiento respecto de los fines legalmente admitidos.",
        },
        {
          evidence_item: "mapeo de datos",
          review_guide: "La relación entre datos y usos debe permitir comprobar que las categorías tratadas se destinan a los fines especiales declarados. Es necesario identificar reutilizaciones, comunicaciones u operaciones que puedan responder a objetivos distintos.",
          no_evidence_guidance: "Cuando no sea posible conocer el destino de determinadas categorías, la exclusividad queda pendiente de verificar respecto de esos usos. No basta con que el propósito principal del proyecto sea investigativo.",
          expected_result: "Un análisis trazable de los usos de las categorías de datos que respalde o descarte la exclusividad exigida.",
        },
      ],
      required_facts: [],
      default_next_node_key: "public-interest-check",
      provenance: "legal_requirement",
    },
    {
      node_key: "public-interest-check",
      node_type: "question",
      title: "Interés público",
      prompt:
        "¿Se verificó que el tratamiento atiende fines de interés público, documentando el interés legítimo reconocido por el art. 16 quinquies?",
      why_it_matters:
        "El interés público es condición del régimen y requiere análisis profesional documentado.",
      fact_key: PUBLIC_INTEREST,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        PUBLIC_INTEREST,
        "El interés público fue verificado y documentado.",
      ),
      evidence_to_review: ["justificación de interés público"],
      evidence_review_help: [
        {
          evidence_item: "justificación de interés público",
          review_guide: "El fundamento debe explicar de qué manera la investigación o actividad especial atiende una finalidad de interés público. La utilidad exclusiva para la organización o la expectativa de obtener beneficios económicos no demuestra por sí sola esta condición.",
          no_evidence_guidance: "Si el beneficio público no está identificado o suficientemente justificado, el requisito permanece sin acreditar. Corresponde distinguir una justificación todavía incompleta de una finalidad que no satisface esta condición.",
          expected_result: "Una justificación profesional documentada del interés público atendido por la finalidad, coherente con los objetivos y operaciones del tratamiento.",
        },
      ],
      required_facts: [],
      default_next_node_key: "quality-measures",
      provenance: "legal_requirement",
    },
    {
      node_key: "quality-measures",
      node_type: "question",
      title: "Medidas de calidad",
      prompt: "¿Se verificaron las medidas de calidad necesarias del tratamiento?",
      why_it_matters:
        "La calidad es condición del régimen especial.",
      fact_key: "res05.quality_measures",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.quality_measures"),
      evidence_to_review: ["medidas de calidad"],
      evidence_review_help: [
        {
          evidence_item: "medidas de calidad",
          review_guide: "Las medidas deben permitir valorar si los datos son adecuados, pertinentes y suficientemente exactos para la finalidad investigativa. También interesa comprobar cómo se reconocen y gestionan errores, inconsistencias o limitaciones relevantes.",
          no_evidence_guidance: "Si las medidas no están definidas o carecen de respaldo verificable, su cumplimiento debe mantenerse pendiente de evaluación. La calidad no debe presumirse únicamente por la procedencia de los datos.",
          expected_result: "Medidas de calidad identificadas y respaldadas, adecuadas para sostener la fiabilidad de los datos utilizados en la finalidad especial.",
        },
      ],
      required_facts: [],
      default_next_node_key: "security-measures",
      provenance: "legal_requirement",
    },
    {
      node_key: "security-measures",
      node_type: "question",
      title: "Medidas de seguridad",
      prompt: "¿Se verificaron las medidas de seguridad necesarias del tratamiento?",
      why_it_matters:
        "La seguridad es condición del régimen especial.",
      fact_key: "res05.security_measures",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.security_measures"),
      evidence_to_review: ["medidas de seguridad"],
      evidence_review_help: [
        {
          evidence_item: "medidas de seguridad",
          review_guide: "La evaluación debe comprobar que existan medidas de seguridad apropiadas al tipo de datos, las operaciones realizadas y los riesgos del tratamiento. Una política general no acredita por sí sola que las medidas necesarias estén implementadas.",
          no_evidence_guidance: "Cuando las medidas no puedan verificarse, las deficiencias deben quedar identificadas sin presumir cumplimiento. La evaluación requiere distinguir controles previstos de aquellos cuya aplicación está respaldada.",
          expected_result: "Medidas de seguridad suficientes y acreditables para proteger los datos durante su utilización en la finalidad especial.",
        },
      ],
      required_facts: [],
      default_next_node_key: "exclusive-use",
      provenance: "legal_requirement",
    },
    {
      node_key: "exclusive-use",
      node_type: "question",
      title: "Resguardo del uso exclusivo",
      prompt:
        "¿Se comprobó que las medidas resguardan el uso exclusivo para la finalidad especial?",
      why_it_matters:
        "Sin resguardo del uso exclusivo las medidas no sostienen el régimen.",
      fact_key: "res05.exclusive_use",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.exclusive_use"),
      evidence_to_review: ["medidas de calidad", "medidas de seguridad"],
      evidence_review_help: [
        {
          evidence_item: "medidas de calidad",
          review_guide: "Las medidas de calidad deben contribuir a que los datos se mantengan pertinentes para los fines declarados, evitando usos o transformaciones incompatibles con el proyecto. Interesa comprobar su relación con la exclusividad del tratamiento, no solo con la exactitud de los registros.",
          no_evidence_guidance: "Si no puede determinarse cómo las medidas contribuyen al uso exclusivo, esta condición permanece pendiente de acreditación. Una revisión general de calidad no sustituye el análisis de su relación con la finalidad.",
          expected_result: "Medidas de calidad vinculadas de manera verificable con la utilización de los datos para los fines especiales declarados.",
        },
        {
          evidence_item: "medidas de seguridad",
          review_guide: "Los controles deben contribuir a evitar accesos, comunicaciones o reutilizaciones de datos para finalidades distintas de las permitidas. La existencia de seguridad técnica debe evaluarse junto con su capacidad de resguardar el destino exclusivo de la información.",
          no_evidence_guidance: "Cuando no se compruebe cómo se previenen usos incompatibles, el resguardo de exclusividad queda pendiente. No debe considerarse suficiente la mera existencia de controles generales de acceso.",
          expected_result: "Controles de seguridad verificables que contribuyan a restringir el tratamiento a los fines especiales evaluados.",
        },
      ],
      required_facts: [],
      default_next_node_key: "storage-regime",
      provenance: "legal_requirement",
    },
    {
      node_key: "storage-regime",
      node_type: "question",
      title: "Conservación bajo el régimen",
      prompt:
        "¿Se documentó que el almacenamiento o utilización por período indeterminado solo se considera bajo las condiciones del art. 16 quinquies?",
      why_it_matters:
        "La conservación extendida solo se sostiene dentro del régimen.",
      fact_key: "res05.storage_regime",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.storage_regime"),
      evidence_to_review: ["diseño de conservación"],
      evidence_review_help: [
        {
          evidence_item: "diseño de conservación",
          review_guide: "El diseño debe distinguir la conservación ordinaria de la posibilidad especial de almacenar y utilizar datos por período indeterminado. Esta última solo puede justificarse cuando se cumplen las condiciones del artículo 16 quinquies, sin asumir que toda investigación permite conservar indefinidamente.",
          no_evidence_guidance: "Si no se acredita el cumplimiento de las condiciones legales, la conservación por período indeterminado no debe presumirse habilitada. Las limitaciones deben documentarse sin modificar automáticamente las reglas registradas en D2.",
          expected_result: "Una evaluación documentada de la conservación prevista y de las condiciones que permitirían, cuando corresponda, acogerse al régimen especial de período indeterminado.",
        },
      ],
      help_text: [
        "Esta regla puede ser contexto para la conservación D2; no sobrescribe reglas de conservación ni facts canónicos de D2.",
      ],
      required_facts: [],
      default_next_node_key: "risk-assessment",
      provenance: "legal_requirement",
    },
    {
      node_key: "risk-assessment",
      node_type: "question",
      title: "Riesgos con sensibles",
      prompt:
        "Si intervienen datos sensibles: ¿se identificaron los riesgos posibles del tratamiento?",
      why_it_matters:
        "Con sensibles, la identificación de riesgos es exigible dentro de este régimen (sin reemplazar una futura EIPD).",
      fact_key: "res05.risk_assessed",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.risk_assessed"),
      evidence_to_review: ["evaluación de riesgos cuando existan sensibles"],
      evidence_review_help: [
        {
          evidence_item: "evaluación de riesgos cuando existan sensibles",
          review_guide: "Cuando intervienen datos sensibles, la evaluación debe identificar los riesgos derivados de su tratamiento, considerando la naturaleza de los datos, las operaciones y sus posibles efectos sobre los titulares. Este análisis es específico del artículo 16 quinquies y no reemplaza una eventual EIPD.",
          no_evidence_guidance: "Si existen datos sensibles y sus riesgos no están identificados, la condición queda pendiente de acreditación. Cuando no intervengan datos sensibles, debe reconocerse esa circunstancia sin exigir artificialmente esta rama.",
          expected_result: "Una identificación documentada de los riesgos posibles asociados a datos sensibles, cuando corresponda, suficiente para fundamentar las medidas de mitigación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "mitigation-measures",
      provenance: "legal_requirement",
    },
    {
      node_key: "mitigation-measures",
      node_type: "question",
      title: "Mitigación de riesgos",
      prompt:
        "Si intervienen datos sensibles: ¿se verificaron medidas de reducción o mitigación de los riesgos identificados?",
      why_it_matters:
        "Sin mitigación verificada la rama de riesgo bloquea la conclusión favorable.",
      fact_key: "res05.mitigation_sufficient",
      answer_type: "yes_no_unknown",
      options: consideredOptions("res05.mitigation_sufficient"),
      evidence_to_review: ["medidas de mitigación"],
      evidence_review_help: [
        {
          evidence_item: "medidas de mitigación",
          review_guide: "Las medidas deben responder a los riesgos identificados en el tratamiento de datos sensibles y orientarse a reducirlos o mitigarlos. Es importante comprobar su relación con los riesgos concretos, en lugar de considerar suficiente una lista genérica de controles.",
          no_evidence_guidance: "Si los riesgos identificados no cuentan con medidas de reducción o mitigación verificables, esta condición permanece sin acreditar. La evaluación debe distinguir medidas proyectadas de aquellas efectivamente implementadas.",
          expected_result: "Medidas de mitigación documentadas y vinculadas a los riesgos del tratamiento sensible, con respaldo suficiente para valorar su aplicación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "publishes-results",
      provenance: "legal_requirement",
    },
    {
      node_key: "publishes-results",
      node_type: "question",
      title: "Publicación de resultados",
      prompt: "¿Se publican o difunden resultados o análisis del tratamiento?",
      why_it_matters:
        "Solo si hay publicación aplica la exigencia de anonimización previa.",
      fact_key: "res05.publishes_results",
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        "res05.publishes_results",
        "Se determinó si existen publicaciones o difusión de resultados.",
      ),
      evidence_to_review: ["proceso de publicación"],
      evidence_review_help: [
        {
          evidence_item: "proceso de publicación",
          review_guide: "El proceso debe permitir determinar si se difunden resultados o análisis del tratamiento y qué información se pretende publicar. Conviene diferenciar los datos utilizados internamente de aquellos que podrían quedar accesibles a terceros mediante la publicación.",
          no_evidence_guidance: "Si no está definido si habrá difusión o qué datos incluirá, esta circunstancia debe permanecer pendiente de aclaración. La ausencia de publicaciones realizadas no permite presumir que nunca se publicarán resultados.",
          expected_result: "Una determinación documentada sobre la existencia de publicaciones o difusión y el tipo de información que comprenderían.",
        },
      ],
      required_facts: [],
      default_next_node_key: "publication-anonymized",
      provenance: "agency_standard",
    },
    {
      node_key: "publication-anonymized",
      node_type: "question",
      title: "Anonimización previa",
      prompt:
        "Si se publican resultados: ¿se verificó la anonimización previa de los datos publicados?",
      why_it_matters:
        "Sin anonimización previa la publicación invalida la vía especial.",
      fact_key: "res05.publication_anonymized",
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        "res05.publication_anonymized",
        "Se verificó la anonimización previa de lo publicado.",
      ),
      evidence_to_review: ["diseño de anonimización"],
      evidence_review_help: [
        {
          evidence_item: "diseño de anonimización",
          review_guide: "El diseño debe permitir comprobar que los datos personales incluidos en publicaciones o resultados serán anonimizados antes de su difusión. La eliminación de nombres o la seudonimización no garantizan por sí solas que la identificación de los titulares resulte imposible.",
          no_evidence_guidance: "Si no puede verificarse la anonimización previa, esta condición permanece sin acreditar cuando existen publicaciones. Deben identificarse las medidas necesarias sin incorporar datos personales reales al workspace de cumplimiento.",
          expected_result: "Un procedimiento verificable de anonimización previa, adecuado para evitar que los datos publicados puedan asociarse con personas identificadas o identificables.",
        },
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
        "¿La aplicabilidad y condiciones del régimen están verificadas y documentadas con respaldo suficiente para concluir?",
      why_it_matters:
        "Solo con el régimen analizado existe base para concluir.",
      fact_key: READY,
      answer_type: "yes_no_unknown",
      options: verifiedOptions(
        READY,
        "Aplicabilidad, condiciones, riesgos y publicaciones están documentados.",
      ),
      evidence_to_review: ["Reasoning Record del régimen de investigación"],
      evidence_review_help: [
        {
          evidence_item: "Reasoning Record del régimen de investigación",
          review_guide: "El razonamiento debe integrar la naturaleza y exclusividad de la finalidad, la justificación del interés público y las medidas de calidad y seguridad. También debe considerar la conservación especial, los riesgos de datos sensibles y la anonimización de publicaciones cuando correspondan.",
          no_evidence_guidance: "Si persisten vacíos capaces de afectar la conclusión, la evaluación permanece incompleta. La ausencia de antecedentes no debe convertirse automáticamente en una declaración de régimen incumplido.",
          expected_result: "Un análisis profesional suficientemente documentado para determinar la aplicabilidad y las condiciones del régimen especial.",
        },
      ],
      required_facts: [],
      default_next_node_key: "sufficiency-gate",
      provenance: "agency_standard",
    },
    {
      node_key: "sufficiency-gate",
      node_type: "decision",
      title: "Suficiencia del análisis",
      prompt:
        "El sistema verifica candidatura, revisión de datos, exclusividad, interés público y análisis suficiente.",
      answer_type: "none",
      required_facts: [CANDIDATE, ITEMS, EXCLUSIVITY, PUBLIC_INTEREST, READY],
      transitions: [
        {
          rule_id: "ready-for-conclusion",
          description: "Base analizada suficiente para concluir.",
          when: {
            op: "all",
            conditions: [
              isYes(CANDIDATE),
              isYes(ITEMS),
              isYes(EXCLUSIVITY),
              isYes(PUBLIC_INTEREST),
              isYes(READY),
            ],
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
        "¿Cuál conclusión profesional adoptas sobre el régimen del art. 16 quinquies de esta finalidad?",
      why_it_matters:
        "Esta selección es tu juicio profesional, no un cálculo del sistema.",
      fact_key: DRAFT,
      answer_type: "single_select",
      options: [
        {
          value: "special_regime_supported",
          label: "Régimen aplicable cumplido",
          description:
            "Juicio profesional: la finalidad puede acogerse al régimen especial cumpliendo sus condiciones.",
          fact_effect: { fact_key: DRAFT, value: "special_regime_supported" },
        },
        {
          value: "special_regime_not_supported",
          label: "Régimen no aplicable o incumplido",
          description:
            "Juicio profesional: la finalidad no satisface aplicabilidad o condiciones con los antecedentes actuales.",
          fact_effect: { fact_key: DRAFT, value: "special_regime_not_supported" },
        },
      ],
      evidence_to_review: ["Reasoning Record del régimen de investigación"],
      evidence_review_help: [
        {
          evidence_item: "Reasoning Record del régimen de investigación",
          review_guide: "La conclusión profesional debe ser coherente con la exclusividad e interés público acreditados, las medidas adoptadas y las condiciones adicionales que resulten aplicables. El ReasoningRecord debe distinguir requisitos cumplidos, supuestos descartados e información pendiente.",
          no_evidence_guidance: "Cuando faltan fundamentos esenciales, la evaluación no debe finalizar prematuramente. Una decisión de régimen no aplicable o incumplido requiere justificación profesional, no solamente documentación insuficiente.",
          expected_result: "Un ReasoningRecord completo y trazable que respalde la conclusión sobre aplicabilidad y cumplimiento del artículo 16 quinquies.",
        },
      ],
      help_text: [
        "Documenta exclusividad, interés público, alternativas y riesgo cuando corresponda.",
      ],
      required_facts: [CANDIDATE, ITEMS, EXCLUSIVITY, PUBLIC_INTEREST, READY],
    },
  ],
  outcomes: [
    {
      outcome_key: "special_regime_supported",
      label: "Régimen aplicable cumplido",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la finalidad satisface aplicabilidad y condiciones del art. 16 quinquies.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "research.public_interest_status", value: "supported" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evaluación",
          note: "Archiva el Reasoning Record con naturaleza, exclusividad, interés público, medidas, riesgos y diseño de anonimización.",
        },
      ],
    },
    {
      outcome_key: "special_regime_not_supported",
      label: "Régimen no aplicable o incumplido",
      classification: "agency_standard",
      explanation:
        "Juicio profesional documentado: la finalidad no satisface aplicabilidad o condiciones con los antecedentes actuales.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "research.public_interest_status", value: "not_supported" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Revisar la base de licitud en D2.05",
          activity_key: "lawful_basis.assign",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen antecedentes pendientes o sin información suficiente. Esto no es una conclusión sobre el régimen.",
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
        "Aún no está declarado el contexto de la finalidad. Decláralo antes del análisis jurídico.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Completar declaración de contexto",
          note: "Declara el contexto histórico, estadístico, científico o de investigación (sí, no o por determinar) antes del análisis.",
        },
      ],
    },
    {
      outcome_key: "regime_not_indicated",
      label: "Régimen no indicado",
      classification: "agency_standard",
      explanation:
        "La finalidad declara otro contexto. No es una conclusión jurídica ni marca la actividad como no aplicable.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Si el contexto de la finalidad cambia, esta revisión puede corresponder en el futuro.",
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
