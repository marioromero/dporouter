import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D2.05.
 *
 * activity_key = lawful_basis.assign (decision, purpose scope).
 * Contenido aprobado por la iteración vigente; usa exclusivamente
 * pasos, evidencia, legal basis, dependencias y aplicabilidad del
 * contenido canónico D2.05. Auditoría D2.05: PURPOSE_SCOPED_VALID —
 * la base se determina jurídicamente por finalidad; no existe
 * decisión conjunta treatment-level.
 *
 * La base seleccionada NO se duplica como fact propio: es el outcome
 * determinista de `consent_applies` + `art13_source` (los dos hechos
 * de determinación persistidos por purpose). `purpose.lawful_basis =
 * assigned` requiere scoped finalization diferida: sin efectos.
 * El scope de ejecución (la purpose seleccionada) ya es el
 * prerrequisito estructural: sin scope válido no hay evaluación.
 */

const CONSENT_FACT = "lawful.consent_applies";
const SOURCE_FACT = "lawful.art13_source";

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function sourceIs(value: string): FactCondition {
  return { op: "fact_equals", fact_key: SOURCE_FACT, value };
}

export const LAWFUL_BASIS_ASSIGN_PROTOCOL: ExecutionProtocol = {
  protocol_key: "lawful_basis.assign.v1",
  activity_key: "lawful_basis.assign",
  version: 1,
  mode: "decision",
  execution_scope: "purpose",
  title: "Evaluación guiada de base de licitud",
  description:
    "Determina la fuente de licitud aplicable a la finalidad activa: consentimiento o fuentes del artículo 13, con derivación a interés legítimo, consentimiento o categorías especiales cuando corresponda.",
  entry_node_key: "consent-basis",
  decision_fact_keys: [CONSENT_FACT, SOURCE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      node_key: "consent-basis",
      node_type: "question",
      title: "Base de consentimiento",
      prompt:
        "¿La licitud de esta finalidad deriva del consentimiento del titular?",
      why_it_matters:
        "Si depende de consentimiento, la implementación y prueba corresponden a D3 y el resto de fuentes no aplica.",
      fact_key: CONSENT_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "consent_yes",
          label: "Sí, por consentimiento",
          description: "La finalidad se sostiene en consentimiento del titular.",
          fact_effect: { fact_key: CONSENT_FACT, value: "consent_yes" },
        },
        {
          value: "consent_no",
          label: "No depende de consentimiento",
          description: "Corresponde evaluar las fuentes del artículo 13.",
          fact_effect: { fact_key: CONSENT_FACT, value: "consent_no" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: CONSENT_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "revisión de consentimiento cuando corresponda",
        "norma, contrato, consentimiento o antecedente justificativo",
      ],
      evidence_review_help: [
        {
          evidence_item: "revisión de consentimiento cuando corresponda",
          review_guide:
            "Examinar los formularios, cláusulas informativas, mecanismos de aceptación y antecedentes disponibles para determinar si la organización ha previsto el consentimiento como fundamento del uso de datos asociado a la finalidad examinada. Comprobar que los documentos permitan distinguir ese propósito de otros tratamientos y reconocer posibles inconsistencias entre lo declarado y las operaciones realizadas. Considerar las condiciones del artículo 12 sin anticipar la validación completa de su implementación.",
          no_evidence_guidance:
            "Consultar los procedimientos de recopilación, registros de aceptación y documentación de las áreas responsables para aclarar el fundamento utilizado. Si no existen antecedentes suficientes, registrar la incertidumbre y gestionar su verificación antes de seleccionar una fuente. Cuando la finalidad no dependa de consentimiento, continuar con las fuentes del artículo 13 sin exigir documentación de una autorización que no corresponde a esa base.",
          expected_result:
            "Una determinación fundamentada sobre la utilización del consentimiento para la finalidad examinada, con antecedentes que permitan reconocer su invocación o descartar su aplicación. Las dudas y deficiencias deben quedar identificadas para su revisión, sin considerar acreditada la validez del consentimiento por su sola mención documental ni sustituir las comprobaciones especializadas de D3.",
        },
        {
          evidence_item: "norma, contrato, consentimiento o antecedente justificativo",
          review_guide:
            "Revisar los fundamentos documentales invocados para determinar cuál corresponde a la operación y finalidad evaluadas. Verificar si las referencias al consentimiento describen una autorización del titular o si los antecedentes apuntan a una fuente distinta prevista legalmente. Identificar justificaciones genéricas, documentos que no guardan relación con el propósito y situaciones en que se confunden cláusulas contractuales con manifestaciones de consentimiento.",
          no_evidence_guidance:
            "Buscar disposiciones normativas, instrumentos contractuales, antecedentes de aceptación y registros operacionales que permitan esclarecer la justificación utilizada. Ante documentos inexistentes, contradictorios o insuficientes, dejar constancia de la información pendiente y solicitar su aclaración, sin atribuir automáticamente consentimiento a la firma de un contrato ni seleccionar otra fuente únicamente por ausencia de registros.",
          expected_result:
            "Un fundamento jurídico preliminar individualizado y vinculado con la finalidad correspondiente, respaldado por antecedentes pertinentes o identificado como pendiente de acreditación. La revisión debe permitir decidir fundadamente si corresponde continuar por consentimiento o evaluar el artículo 13, sin confundir la selección de una fuente con la comprobación completa de sus requisitos.",
        },
      ],
      required_facts: [],
      default_next_node_key: "art13-source",
      related_activity_keys: ["treatment.purpose_define"],
      provenance: "legal_requirement",
    },
    {
      node_key: "art13-source",
      node_type: "question",
      title: "Fuente del artículo 13",
      prompt:
        "¿Qué fuente del artículo 13 sostiene esta finalidad, si no depende de consentimiento?",
      why_it_matters:
        "Cada finalidad requiere exactamente una fuente aplicable y acreditable.",
      fact_key: SOURCE_FACT,
      answer_type: "single_select",
      options: [
        {
          value: "legal_obligation",
          label: "Obligación legal",
          description: "Tratamiento necesario para cumplir una obligación legal.",
          fact_effect: { fact_key: SOURCE_FACT, value: "legal_obligation" },
        },
        {
          value: "contract_precontractual",
          label: "Contrato o medidas precontractuales",
          description: "Necesario para el contrato o medidas precontractuales.",
          fact_effect: { fact_key: SOURCE_FACT, value: "contract_precontractual" },
        },
        {
          value: "legitimate_interest",
          label: "Interés legítimo",
          description: "Candidato a evaluar en D2.06 antes de asignarlo.",
          fact_effect: { fact_key: SOURCE_FACT, value: "legitimate_interest" },
        },
        {
          value: "rights_defense",
          label: "Defensa de derechos",
          description: "Necesario para la defensa de derechos.",
          fact_effect: { fact_key: SOURCE_FACT, value: "rights_defense" },
        },
        {
          value: "financial_titleIII",
          label: "Tratamiento económico-financiero (Título III)",
          description: "Solo dentro del ámbito material del Título III.",
          fact_effect: { fact_key: SOURCE_FACT, value: "financial_titleIII" },
        },
        {
          value: "none_identified",
          label: "Ninguna identificada",
          description: "Aún no se identifica fuente aplicable.",
          fact_effect: { fact_key: SOURCE_FACT, value: "none_identified" },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: { fact_key: SOURCE_FACT, value: "unknown" },
        },
      ],
      evidence_to_review: [
        "revisión legal",
        "revisión contractual",
        "revisión de finalidad",
      ],
      evidence_review_help: [
        {
          evidence_item: "revisión legal",
          review_guide:
            "Examinar las disposiciones invocadas para determinar si los hechos y operaciones examinados se ajustan a alguno de los supuestos del artículo 13. Verificar la existencia de una obligación legal concreta, la aplicabilidad del Título III a los tratamientos económico-financieros o la necesidad de formular, ejercer o defender derechos ante tribunales u órganos públicos, según corresponda. Para el interés legítimo, identificar el fundamento alegado y las condiciones que deberán evaluarse en D2.06, sin darlo por acreditado anticipadamente.",
          no_evidence_guidance:
            "Consultar los textos normativos vigentes y los antecedentes jurídicos disponibles para localizar el fundamento invocado y precisar su alcance. Si no se identifica una disposición aplicable o faltan elementos para comprobar el supuesto, registrar la incertidumbre y las verificaciones pendientes. No sustituir una fuente insuficientemente acreditada por otra sin justificar sus requisitos.",
          expected_result:
            "Una fuente legal individualizada y relacionada con el supuesto de hecho correspondiente, respaldada por disposiciones pertinentes y antecedentes que permitan evaluar su aplicación. Las interpretaciones dudosas, condiciones no acreditadas o evaluaciones especializadas pendientes deben quedar identificadas, sin presentar la selección inicial como confirmación definitiva de licitud.",
        },
        {
          evidence_item: "revisión contractual",
          review_guide:
            "Revisar los instrumentos contractuales y antecedentes de negociación para establecer si las operaciones con datos resultan necesarias para celebrar o ejecutar un contrato entre el titular y el responsable, o para aplicar medidas precontractuales solicitadas por el titular. Comprobar la correspondencia entre las prestaciones comprometidas y los usos concretos de información, diferenciando los tratamientos indispensables de aquellos accesorios o ajenos al vínculo contractual.",
          no_evidence_guidance:
            "Buscar contratos vigentes, solicitudes del titular, propuestas, comunicaciones y registros de gestión que permitan reconstruir la relación pertinente. Si la documentación es insuficiente, identificar las prestaciones o medidas cuya necesidad requiere aclaración y gestionar los antecedentes faltantes. Evitar presumir que cualquier tratamiento realizado durante una relación comercial queda amparado por esta fuente.",
          expected_result:
            "Antecedentes que permitan establecer la relación entre las operaciones necesarias y el contrato o las medidas precontractuales solicitadas, con identificación de las prestaciones que las justifican. Los usos accesorios, las inconsistencias y las condiciones pendientes de acreditación deben quedar diferenciados, sin extender automáticamente esta fuente a todas las actividades vinculadas con el titular.",
        },
        {
          evidence_item: "revisión de finalidad",
          review_guide:
            "Analizar el propósito concreto documentado y las operaciones necesarias para alcanzarlo, comprobando su correspondencia con las condiciones de la fuente jurídica considerada. Identificar usos materialmente distintos que requieran una justificación propia, especialmente cuando una misma actividad combine ejecución contractual, obligaciones legales, intereses del responsable u otros objetivos. Revisar que la fuente propuesta no se utilice para amparar propósitos que excedan su ámbito.",
          no_evidence_guidance:
            "Consultar las descripciones de procesos, formularios y antecedentes operacionales para aclarar qué objetivos persigue cada utilización de datos. Cuando existan formulaciones ambiguas o propósitos agrupados sin suficiente diferenciación, precisar las finalidades pendientes antes de fundamentar su tratamiento. Si no puede establecerse una fuente aplicable, reflejar esa situación sin forzar una asignación jurídica.",
          expected_result:
            "Una justificación individualizada para el propósito examinado, coherente con las operaciones efectivas y con las condiciones de la fuente seleccionada. Las finalidades sin fundamento acreditable, los usos adicionales y las evaluaciones pendientes deben permanecer identificados, sin asumir que una base jurídica válida para un propósito se extiende automáticamente a los demás.",
        },
      ],
      required_facts: [],
      default_next_node_key: "basis-synthesis",
      related_activity_keys: ["treatment.purpose_define"],
      provenance: "legal_requirement",
    },
    {
      node_key: "basis-synthesis",
      node_type: "decision",
      title: "Síntesis de la base aplicable",
      prompt:
        "El sistema determina la base aplicable desde las determinaciones registradas.",
      answer_type: "none",
      required_facts: [CONSENT_FACT, SOURCE_FACT],
      transitions: [
        {
          rule_id: "basis-consent",
          description: "Licitud por consentimiento del titular.",
          when: {
            op: "fact_equals",
            fact_key: CONSENT_FACT,
            value: "consent_yes",
          },
          goto_outcome_key: "basis_consent",
          explanation:
            "La finalidad depende de consentimiento: su implementación y prueba corresponden a D3.",
        },
        {
          rule_id: "basis-legal-obligation",
          description: "Licitud por obligación legal.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              sourceIs("legal_obligation"),
            ],
          },
          goto_outcome_key: "basis_legal_obligation",
          explanation:
            "La finalidad se sostiene en obligación legal acreditada.",
        },
        {
          rule_id: "basis-contract",
          description: "Licitud por contrato o medidas precontractuales.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              sourceIs("contract_precontractual"),
            ],
          },
          goto_outcome_key: "basis_contract",
          explanation:
            "La finalidad se sostiene en contrato o medidas precontractuales.",
        },
        {
          rule_id: "basis-legitimate-interest",
          description:
            "Candidato a interés legítimo: requiere evaluación D2.06.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              sourceIs("legitimate_interest"),
            ],
          },
          goto_outcome_key: "basis_legitimate_interest",
          explanation:
            "El interés legítimo solo sostiene la finalidad si supera su evaluación específica en D2.06 para esta misma purpose.",
        },
        {
          rule_id: "basis-rights-defense",
          description: "Licitud por defensa de derechos.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              sourceIs("rights_defense"),
            ],
          },
          goto_outcome_key: "basis_rights_defense",
          explanation:
            "La finalidad se sostiene en defensa de derechos.",
        },
        {
          rule_id: "basis-financial",
          description:
            "Licitud económico-financiera dentro del Título III.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              sourceIs("financial_titleIII"),
            ],
          },
          goto_outcome_key: "basis_financial",
          explanation:
            "La fuente económico-financiera solo opera dentro del ámbito material del Título III.",
        },
        {
          rule_id: "basis-unassigned",
          description: "Sin fuente identificada para la finalidad.",
          when: {
            op: "all",
            conditions: [
              { op: "fact_equals", fact_key: CONSENT_FACT, value: "consent_no" },
              {
                op: "fact_equals",
                fact_key: SOURCE_FACT,
                value: "none_identified",
              },
            ],
          },
          goto_outcome_key: "basis_unassigned",
          explanation:
            "Ninguna fuente resulta aplicable con los antecedentes actuales.",
        },
        {
          rule_id: "pending-determination",
          description:
            "Falta información para determinar la base aplicable.",
          when: {
            op: "any",
            conditions: [unresolved(CONSENT_FACT), unresolved(SOURCE_FACT)],
          },
          goto_outcome_key: "assessment_incomplete",
          explanation:
            "Existen determinaciones pendientes o sin información suficiente.",
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
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "basis_consent",
      label: "Base: consentimiento",
      classification: "legal_requirement",
      explanation:
        "La finalidad se sostiene en consentimiento del titular.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Implementar el mecanismo en D3",
          activity_key: "consent.mechanism_design",
        },
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Archiva el consentimiento o antecedente justificativo de esta finalidad.",
        },
      ],
    },
    {
      outcome_key: "basis_legal_obligation",
      label: "Base: obligación legal",
      classification: "legal_requirement",
      explanation:
        "La finalidad se sostiene en obligación legal acreditada.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Archiva la norma y el antecedente justificativo de esta finalidad.",
        },
      ],
    },
    {
      outcome_key: "basis_contract",
      label: "Base: contrato o precontrato",
      classification: "legal_requirement",
      explanation:
        "La finalidad se sostiene en contrato o medidas precontractuales.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Archiva el contrato o antecedente justificativo de esta finalidad.",
        },
      ],
    },
    {
      outcome_key: "basis_legitimate_interest",
      label: "Candidata: interés legítimo",
      classification: "legal_requirement",
      explanation:
        "El interés legítimo es candidato para esta finalidad, pendiente de su evaluación específica.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "activity",
          label: "Evaluar el interés legítimo de esta finalidad en D2.06",
          activity_key: "legitimate_interest.assessment",
        },
      ],
    },
    {
      outcome_key: "basis_rights_defense",
      label: "Base: defensa de derechos",
      classification: "legal_requirement",
      explanation:
        "La finalidad se sostiene en defensa de derechos.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Conservar el antecedente",
          note: "Archiva el antecedente justificativo de esta finalidad.",
        },
      ],
    },
    {
      outcome_key: "basis_financial",
      label: "Base: Título III económico-financiero",
      classification: "legal_requirement",
      explanation:
        "La finalidad se sostiene en el régimen económico-financiero del Título III.",
      provenance: "legal_requirement",
      next_actions: [
        {
          kind: "info",
          label: "Verificar ámbito y categorías especiales",
          note: "Confirma el ámbito material del Título III y conserva la evaluación adicional D5 si hay categorías especiales.",
        },
      ],
    },
    {
      outcome_key: "basis_unassigned",
      label: "Base sin asignar",
      classification: "agency_standard",
      explanation:
        "Ninguna fuente resulta aplicable con los antecedentes actuales. Revisa la finalidad o sus antecedentes.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
    {
      outcome_key: "assessment_incomplete",
      label: "Evaluación incompleta",
      classification: "agency_standard",
      explanation:
        "Existen determinaciones pendientes o sin información suficiente.",
      provenance: "agency_standard",
      next_actions: [
        {
          kind: "restart",
          label: "Reiniciar evaluación",
        },
      ],
    },
  ],
};
