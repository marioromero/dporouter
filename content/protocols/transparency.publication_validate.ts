import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D3.02.
 *
 * activity_key = transparency.publication_validate (checklist,
 * company scope). Contenido aprobado por la iteración vigente; usa
 * exclusivamente pasos, evidencia, dependencias y state effect del
 * contenido canónico D3.02. Verifica disponibilidad y condiciones
 * de publicación; nunca declara cumplimiento global.
 *
 * Dependencia de completitud: la guía puede navegarse y revisarse
 * desde el inicio (can start), pero su conclusión definitiva
 * requiere la política estructurada en D3.01 (can complete). Se
 * expresa consumiendo el fact externo `transparency.policy_status`
 * que materializa la finalización D3.01: sin `assembled` no hay
 * outcome definitivo. Sin WCAG, SLA, performance, SEO ni requisitos
 * técnicos no canónicos. Sin Publication entity, URL registry,
 * version history ni scores.
 *
 * Metodología `agency_standard` (URL, capturas, prueba de acceso,
 * comparación de versiones): la obligación de transparencia es
 * legal; los artefactos de verificación son método interno y nunca
 * se presentan como documentos formalmente exigidos por la ley.
 */

const POLICY_FACT = "transparency.policy_status";

const CHECKS = [
  "transparency.publication.medium_exists",
  "transparency.publication.permanent_available",
  "transparency.publication.effective_access",
  "transparency.publication.gratuity",
  "transparency.publication.presentation_clear",
  "transparency.publication.contact_channel",
  "transparency.publication.version_match",
];

function isNo(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "no" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
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

export const TRANSPARENCY_PUBLICATION_VALIDATE_PROTOCOL: ExecutionProtocol = {
  protocol_key: "transparency.publication_validate.v1",
  activity_key: "transparency.publication_validate",
  version: 1,
  mode: "checklist",
  execution_scope: "company",
  title: "Validación guiada de la publicación",
  description:
    "Verifica que la información de transparencia esté efectivamente publicada y disponible: medio público, permanencia, acceso efectivo, gratuidad, precisión y claridad, canal de contacto y correspondencia con la política vigente.",
  entry_node_key: "check-medium",
  decision_fact_keys: [...CHECKS],
  external_fact_keys: [POLICY_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "check-medium",
      node_type: "question",
      title: "Medio público",
      prompt:
        "¿Existe un medio público donde se informa la política o información de tratamiento?",
      why_it_matters:
        "Sin medio público no hay transparencia efectiva, aunque el documento exista.",
      fact_key: "transparency.publication.medium_exists",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.medium_exists",
        "Medio público de información identificado.",
      ),
      evidence_to_review: ["URL", "medio equivalente"],
      evidence_review_help: [
        {
          evidence_item: "URL",
          review_guide:
            "Comprobar que la dirección indicada conduzca a un espacio público destinado a informar sobre el tratamiento de datos personales, identificando la organización y el contenido disponible. Distinguir enlaces a documentos accesibles de rutas internas, referencias incompletas o páginas que no contienen la información correspondiente, sin anticipar la validación integral del acceso.",
          no_evidence_guidance:
            "Consultar el sitio institucional, sus secciones de privacidad y los antecedentes de publicación para localizar la dirección utilizada. Si no existe una URL identificable, verificar si la organización dispone de otro medio informativo equivalente, sin considerar obligatoria una página web cuando la ley admite alternativas.",
          expected_result:
            "Una dirección pública identificable que permita localizar la información de transparencia, o una ausencia de URL reconocida para evaluar un medio alternativo. Las referencias incorrectas o inciertas deben quedar documentadas, sin atribuir disponibilidad permanente por la sola existencia del enlace.",
        },
        {
          evidence_item: "medio equivalente",
          review_guide:
            "Identificar el soporte informativo alternativo utilizado y comprobar que permita poner la política o información de tratamiento a disposición del público. Revisar cómo puede localizarse y consultarse, distinguiendo un medio efectivamente ofrecido de documentos reservados al personal o disponibles únicamente mediante autorización particular.",
          no_evidence_guidance:
            "Consultar a las áreas responsables y revisar los canales institucionales para determinar si existe una vía pública distinta del sitio web. Si no se encuentra evidencia suficiente, señalar las verificaciones pendientes sin inventar medios alternativos ni concluir que la ausencia de URL demuestra incumplimiento.",
          expected_result:
            "Un medio alternativo identificable, con antecedentes que permitan reconocer cómo se ofrece la información al público, o una ausencia documentada que requiera establecer un canal adecuado. Su identificación no acredita todavía que satisfaga todas las condiciones de permanencia, gratuidad y acceso efectivo.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-permanence",
      provenance: "agency_standard",
    },
    {
      node_key: "check-permanence",
      node_type: "question",
      title: "Disponibilidad permanente",
      prompt:
        "¿La información se encuentra disponible de forma permanente?",
      why_it_matters:
        "La transparencia exige disponibilidad sostenida, no publicaciones transitorias.",
      fact_key: "transparency.publication.permanent_available",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.permanent_available",
        "Disponibilidad permanente verificada.",
      ),
      evidence_to_review: ["URL", "prueba de acceso"],
      evidence_review_help: [
        {
          evidence_item: "URL",
          review_guide:
            "Comprobar que la dirección utilizada corresponda a una publicación vigente y estable, sin restricciones temporales conocidas ni dependencias de enlaces de duración limitada. Revisar antecedentes de mantenimiento o cambios de ubicación que permitan identificar interrupciones recurrentes, distinguiendo una página actualmente disponible de un acceso sostenido en el tiempo.",
          no_evidence_guidance:
            "Consultar la configuración de publicación, los responsables del sitio y los antecedentes de disponibilidad para determinar si el enlace se mantiene operativo. Cuando falte información sobre su continuidad, identificar las verificaciones pendientes sin presumir permanencia por una comprobación aislada ni descartar un medio equivalente.",
          expected_result:
            "Una dirección pública cuya continuidad esté respaldada por antecedentes verificables, con interrupciones o limitaciones conocidas identificadas. La existencia de un enlace funcional debe distinguirse de la evidencia suficiente sobre su disponibilidad sostenida.",
        },
        {
          evidence_item: "prueba de acceso",
          review_guide:
            "Verificar el acceso a la información en momentos distintos o mediante antecedentes disponibles de comprobaciones anteriores, registrando resultados y eventuales fallos. Determinar si las interrupciones observadas son aisladas o revelan limitaciones recurrentes, sin exigir porcentajes técnicos de disponibilidad ni equiparar una prueba exitosa con permanencia absoluta.",
          no_evidence_guidance:
            "Realizar comprobaciones de acceso al medio identificado y consultar registros de fallos o verificaciones existentes cuando estén disponibles. Si solo se cuenta con una observación puntual, señalar la necesidad de antecedentes adicionales sin inventar pruebas históricas ni afirmar que la publicación permanece accesible en todo momento.",
          expected_result:
            "Antecedentes de acceso que permitan valorar la continuidad de la publicación, con comprobaciones realizadas, fallos conocidos e incertidumbres diferenciadas. El resultado debe sustentar la evaluación de permanencia sin presentar una prueba aislada como garantía de disponibilidad continua.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-access",
      provenance: "agency_standard",
    },
    {
      node_key: "check-access",
      node_type: "question",
      title: "Acceso efectivo",
      prompt:
        "¿Cualquier interesado puede acceder efectivamente a la información?",
      why_it_matters:
        "Un medio existente pero inaccesible no cumple la condición de acceso efectivo.",
      fact_key: "transparency.publication.effective_access",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.effective_access",
        "Acceso efectivo comprobado con prueba de acceso.",
      ),
      evidence_to_review: ["prueba de acceso"],
      evidence_review_help: [
        {
          evidence_item: "prueba de acceso",
          review_guide:
            "Comprobar desde una condición externa a la organización que el medio permita consultar realmente la información, sin depender de credenciales internas, autorizaciones particulares o vínculos inaccesibles al público. Verificar que el contenido pueda localizarse y abrirse mediante el canal ofrecido, registrando obstáculos o restricciones observados.",
          no_evidence_guidance:
            "Realizar una comprobación directa del sitio o medio equivalente desde una condición de acceso ordinaria y conservar sus resultados. Si la prueba no puede efectuarse o existen fallos sin aclarar, identificar las verificaciones pendientes sin presumir accesibilidad por la sola existencia de una URL o documento interno.",
          expected_result:
            "Acceso público efectivamente comprobado mediante antecedentes verificables, con restricciones, errores o incertidumbres identificados. El resultado debe permitir distinguir una consulta exitosa de una publicación inaccesible, sin atribuir disponibilidad permanente ni cumplimiento integral de las demás condiciones legales.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-gratuity",
      provenance: "agency_standard",
    },
    {
      node_key: "check-gratuity",
      node_type: "question",
      title: "Gratuidad",
      prompt: "¿El acceso a la información es gratuito?",
      why_it_matters:
        "La información de transparencia debe ofrecerse sin costo para el interesado.",
      fact_key: "transparency.publication.gratuity",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.gratuity",
        "Acceso gratuito verificado.",
      ),
      evidence_to_review: ["prueba de acceso"],
      evidence_review_help: [
        {
          evidence_item: "prueba de acceso",
          review_guide:
            "Comprobar mediante una consulta ordinaria del medio público que la información pueda visualizarse u obtenerse sin tarifas, suscripciones pagadas ni contratación de servicios. Revisar si existen condiciones económicas que impidan acceder al contenido exigido, distinguiendo los cobros impuestos por la organización de los costos ordinarios de conexión o equipos del interesado.",
          no_evidence_guidance:
            "Realizar una consulta directa del sitio o medio equivalente y revisar las condiciones informadas para acceder a la política. Si no puede verificarse si existen cobros o restricciones económicas, identificar las comprobaciones pendientes sin presumir gratuidad por la sola presencia de un enlace o documento.",
          expected_result:
            "Acceso gratuito comprobado mediante antecedentes verificables, sin pagos ni contraprestaciones económicas exigidas para consultar la información de transparencia. Las restricciones o incertidumbres deben quedar identificadas, sin atribuir cumplimiento de las demás condiciones legales por esta sola comprobación.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-presentation",
      provenance: "agency_standard",
    },
    {
      node_key: "check-presentation",
      node_type: "question",
      title: "Precisión y claridad",
      prompt:
        "¿La información se presenta de forma precisa, clara y sin ambigüedad material?",
      why_it_matters:
        "La presentación ambigua o imprecisa impide al titular comprender el tratamiento.",
      fact_key: "transparency.publication.presentation_clear",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.presentation_clear",
        "Presentación precisa, clara y sin ambigüedad material.",
      ),
      evidence_to_review: ["capturas", "versión publicada"],
      evidence_review_help: [
        {
          evidence_item: "capturas",
          review_guide:
            "Revisar cómo se presenta visualmente la información al interesado, comprobando que los textos sean legibles, las secciones identificables y las indicaciones comprensibles. Detectar expresiones confusas, contradicciones visibles o elementos que dificulten interpretar el contenido, relacionando las observaciones con la pantalla y el momento registrados.",
          no_evidence_guidance:
            "Obtener imágenes del medio público que muestren las secciones relevantes de la información disponible, identificando cuándo y dónde fueron consultadas. Si las capturas son parciales o no permiten leer el contenido, señalar las comprobaciones pendientes sin presumir claridad a partir de imágenes incompletas.",
          expected_result:
            "Antecedentes visuales que permitan comprobar la presentación comprensible de la información y reconocer ambigüedades u obstáculos observados. Las limitaciones de cobertura deben quedar identificadas, sin considerar que una captura aislada demuestra la calidad de todo el documento.",
        },
        {
          evidence_item: "versión publicada",
          review_guide:
            "Comprobar que el texto accesible al público utilice afirmaciones precisas y coherentes sobre los tratamientos, evitando formulaciones contradictorias respecto de finalidades, destinatarios o derechos. Revisar que las explicaciones sean comprensibles y no permitan interpretaciones materialmente incompatibles, utilizando los antecedentes vigentes como referencia cuando corresponda.",
          no_evidence_guidance:
            "Consultar el contenido directamente en el medio público y recuperar la copia disponible para revisar sus afirmaciones principales. Si no puede examinarse el texto completo o existen contradicciones sin aclarar, identificar los apartados pendientes sin atribuir precisión por el solo hecho de que el documento esté publicado.",
          expected_result:
            "Información pública precisa, comprensible y sin ambigüedades materiales identificadas, con observaciones y discrepancias documentadas cuando existan. La revisión debe respaldar la calidad de presentación del contenido, sin certificar automáticamente la licitud de los tratamientos descritos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-contact",
      provenance: "agency_standard",
    },
    {
      node_key: "check-contact",
      node_type: "question",
      title: "Canal de contacto",
      prompt:
        "¿El canal de contacto informado es accesible desde el medio público?",
      why_it_matters:
        "El contacto informado en la política debe ser efectivamente alcanzable.",
      fact_key: "transparency.publication.contact_channel",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.contact_channel",
        "Canal de contacto accesible y operativo.",
      ),
      evidence_to_review: ["prueba de acceso"],
      evidence_review_help: [
        {
          evidence_item: "prueba de acceso",
          review_guide:
            "Comprobar desde el medio público que el canal informado pueda localizarse y utilizarse conforme a su naturaleza, verificando enlaces, formularios, direcciones electrónicas o datos postales según corresponda. Identificar errores, información desactualizada u obstáculos que impidan dirigir solicitudes al responsable, sin exigir que todas las organizaciones utilicen canales digitales.",
          no_evidence_guidance:
            "Consultar la información publicada y los antecedentes del canal institucional para identificar cómo pueden comunicarse los titulares. Si no existen pruebas suficientes de acceso u operatividad, realizar las verificaciones pertinentes y registrar las limitaciones encontradas, sin presumir que un dato de contacto publicado funciona correctamente.",
          expected_result:
            "Un medio de contacto público, identificable y accesible, con antecedentes que permitan comprobar su utilización según el canal ofrecido. Los errores o limitaciones deben quedar reconocidos, sin considerar que la disponibilidad del contacto acredita por sí sola la recepción y resolución adecuada de todas las solicitudes.",
        },
      ],
      required_facts: [],
      default_next_node_key: "check-version",
      provenance: "agency_standard",
    },
    {
      node_key: "check-version",
      node_type: "question",
      title: "Correspondencia de versiones",
      prompt:
        "¿La versión publicada corresponde a la política vigente?",
      why_it_matters:
        "Una versión desactualizada desinforma aunque el medio funcione.",
      fact_key: "transparency.publication.version_match",
      answer_type: "yes_no_unknown",
      options: checkOptions(
        "transparency.publication.version_match",
        "Versión publicada idéntica a la vigente.",
      ),
      evidence_to_review: [
        "versión publicada",
        "evidencia documental de revisión",
      ],
      evidence_review_help: [
        {
          evidence_item: "versión publicada",
          review_guide:
            "Comparar la fecha, identificación de versión y contenido relevante del documento accesible al público con la política efectivamente adoptada. Comprobar que corresponda a la versión vigente y no a un borrador o texto sustituido, identificando diferencias materiales aunque los números o fechas declarados coincidan.",
          no_evidence_guidance:
            "Consultar el medio público y recuperar la política adoptada mediante los antecedentes documentales disponibles. Si no puede accederse a alguna de las versiones o existen identificadores contradictorios, señalar las comprobaciones pendientes sin presumir coincidencia por la sola presencia de una fecha.",
          expected_result:
            "Correspondencia verificable entre la política adoptada y el contenido efectivamente publicado, con fecha, versión y diferencias relevantes identificables. Las discrepancias o incertidumbres deben quedar reconocidas, sin considerar vigente un documento únicamente porque figure disponible en el medio público.",
        },
        {
          evidence_item: "evidencia documental de revisión",
          review_guide:
            "Revisar las constancias de comparación, aprobaciones y antecedentes de publicación para comprobar qué documentos se cotejaron, cuándo se efectuó la verificación y qué diferencias se detectaron. Distinguir la revisión efectivamente realizada de declaraciones generales de actualización, sin atribuir comprobaciones que no estén respaldadas.",
          no_evidence_guidance:
            "Consultar los antecedentes de aprobación y publicación para reconstruir la verificación de correspondencia, identificando los documentos disponibles y las consultas pendientes. Si no existe constancia de revisión, registrar las comprobaciones que puedan efectuarse actualmente sin inventar resultados o controles históricos.",
          expected_result:
            "Una comprobación documental trazable de la correspondencia entre versiones, con antecedentes revisados, resultados y eventuales correcciones pendientes. La evidencia debe permitir sustentar la conclusión sobre vigencia pública, sin crear un historial de versiones ni considerar ejecutadas actualizaciones todavía pendientes.",
        },
      ],
      required_facts: [],
      default_next_node_key: "synthesis",
      related_activity_keys: ["transparency.policy_assemble"],
      provenance: "agency_standard",
    },
    {
      node_key: "synthesis",
      node_type: "decision",
      title: "Síntesis de la publicación",
      prompt:
        "El sistema verifica la política estructurada en D3.01 y el estado de cada condición de publicación.",
      answer_type: "none",
      required_facts: [POLICY_FACT, ...CHECKS],
      transitions: [
        {
          rule_id: "policy-not-assembled",
          description:
            "La política aún no está estructurada en D3.01: la validación no puede concluir.",
          when: {
            op: "not",
            condition: {
              op: "fact_equals",
              fact_key: POLICY_FACT,
              value: "assembled",
            },
          },
          goto_outcome_key: "policy_assembly_pending",
          explanation:
            "Solo puede validarse la publicación de una política estructurada. La revisión preliminar queda registrada, pero sin conclusión definitiva.",
        },
        {
          rule_id: "gaps-found",
          description: "Al menos una condición de publicación requiere corrección.",
          when: { op: "any", conditions: CHECKS.map(isNo) },
          goto_outcome_key: "remediation_required",
          explanation:
            "Existen brechas de publicación que requieren corrección antes de declarar la validación.",
        },
        {
          rule_id: "missing-info",
          description:
            "Alguna condición está sin responder o con información insuficiente.",
          when: { op: "any", conditions: CHECKS.map(unresolved) },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Faltan condiciones por acreditar. Sin la revisión completa no hay estado definitivo.",
        },
        {
          rule_id: "publication-ok",
          description:
            "Política estructurada y todas las condiciones satisfactorias.",
          when: {
            op: "all",
            conditions: [
              {
                op: "fact_equals",
                fact_key: POLICY_FACT,
                value: "assembled",
              },
              ...CHECKS.map((f) => ({
                op: "fact_equals" as const,
                fact_key: f,
                value: "yes",
              })),
            ],
          },
          goto_outcome_key: "publication_validated",
          explanation:
            "La información está publicada y disponible bajo las condiciones verificadas.",
        },
        {
          rule_id: "fallback-incomplete",
          description: "Cualquier otro estado parcial queda sin concluir.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "La validación no puede concluir con el estado actual de antecedentes.",
        },
      ],
      provenance: "agency_standard",
    },
  ],
  outcomes: [
    {
      outcome_key: "publication_validated",
      label: "Publicación validada",
      classification: "agency_standard",
      explanation:
        "La información de transparencia está publicada y disponible bajo las condiciones verificadas, sobre una política estructurada. Esto valida la publicación, no el cumplimiento integral de la empresa.",
      provenance: "agency_standard",
      canonical_fact_effects: [
        { fact_key: "transparency.publication_status", value: "validated" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia",
          note: "Archiva la URL, las capturas, la prueba de acceso, la versión publicada y la evidencia documental de revisión.",
        },
      ],
    },
    {
      outcome_key: "policy_assembly_pending",
      label: "Política pendiente de estructurar",
      classification: "agency_standard",
      explanation:
        "La publicación solo puede validarse sobre una política estructurada en D3.01. Lo revisado hasta ahora queda como avance preliminar.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "activity",
          label: "Estructurar la política en D3.01",
          activity_key: "transparency.policy_assemble",
        },
        {
          kind: "restart",
          label: "Reiniciar validación",
        },
      ],
    },
    {
      outcome_key: "remediation_required",
      label: "Requiere correcciones de publicación",
      classification: "agency_standard",
      explanation:
        "Al menos una condición de publicación requiere corrección. Corrige el medio, el acceso o la versión publicada.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "info",
          label: "Corregir las brechas detectadas",
          note: "Atiende cada condición pendiente y vuelve a verificar la publicación.",
        },
        {
          kind: "restart",
          label: "Reiniciar validación",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Validación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen condiciones pendientes o con información insuficiente. Acredita cada punto antes de concluir.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar validación",
        },
      ],
    },
  ],
};
