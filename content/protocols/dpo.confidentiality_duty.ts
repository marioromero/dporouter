import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.12.
 *
 * activity_key = dpo.confidentiality_duty (procedure). Contenido
 * aprobado por la iteración vigente; usa exclusivamente pasos,
 * evidencia, legal basis, dependencias y aplicabilidad del contenido
 * canónico D1.12. Verifica existencia, formalización, alcance y
 * medidas: el resultado constata un deber formalizado y respaldado,
 * nunca declara cumplimiento jurídico automático.
 *
 * El paso de formalización es genuinamente condicional en el canon
 * ("cuando corresponda"): usa la opción explícita "No aplica en este
 * caso" cuando el instrumento aplicable ya contiene el deber y solo se
 * verificó. La compuerta de designación reutiliza el fact
 * dpo.designated ya producido por D1.08/D1.09/D1.11.
 */

const VERIFICATION_FACTS = [
  "dpo.designated",
  "dpo.confidentiality.obligation_verified",
  "dpo.confidentiality.formalized",
  "dpo.confidentiality.scope_included",
  "dpo.confidentiality.measures_verified",
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

export const DPO_CONFIDENTIALITY_DUTY_PROTOCOL: ExecutionProtocol = {
  protocol_key: "dpo.confidentiality_duty.v1",
  activity_key: "dpo.confidentiality_duty",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado del deber de confidencialidad",
  description:
    "Verifica que el DPO conozca, acepte y mantenga el deber de secreto, reserva o confidencialidad: obligación aplicable, formalización, alcance y medidas organizacionales.",
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
        "El deber se vincula a la persona que ejerce la función. Sin designación corresponde designar primero.",
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
            "La documentación debe permitir identificar a la persona natural que ejerce actualmente la función de DPO, la autoridad que formalizó su designación y la fecha desde la cual produce efectos. Corresponde contrastar estos antecedentes con la situación organizacional vigente, incluyendo eventuales sustituciones o términos de funciones, para determinar a quién debe vincularse la revisión del deber de confidencialidad.",
          no_evidence_guidance:
            "Pueden revisarse actos de designación, contratos, comunicaciones institucionales u otros antecedentes equivalentes que permitan acreditar la designación. Debe distinguirse entre falta de un expediente formal, respaldo no localizado y ausencia efectiva de un DPO designado. La realización informal de tareas de protección de datos no debe considerarse prueba suficiente de una designación vigente.",
          expected_result:
            "Una conclusión trazable sobre la existencia y vigencia de la designación, con identificación de la persona que ejerce la función y de los antecedentes que la acreditan. Si no se confirma una designación vigente, debe quedar registrada esa situación como antecedente pendiente antes de evaluar la formalización y los controles específicos de confidencialidad del DPO.",
        },
      ],
      required_facts: [],
      default_next_node_key: "verify-obligation",
      transitions: [
        {
          rule_id: "no-designation",
          description: "Sin DPO designado no hay deber que formalizar.",
          when: {
            op: "fact_equals",
            fact_key: "dpo.designated",
            value: "no",
          },
          goto_outcome_key: "prerequisite_missing",
          explanation:
            "No existe DPO designado. El deber requiere designación previa.",
        },
      ],
      related_activity_keys: ["dpo.designate"],
      provenance: "agency_standard",
    },
    {
      node_key: "verify-obligation",
      node_type: "question",
      title: "Obligación aplicable",
      prompt:
        "¿Se verificó la existencia de la obligación de confidencialidad aplicable al DPO?",
      why_it_matters:
        "Sin obligación aplicable identificada no es posible formalizar ni controlar el deber.",
      fact_key: "dpo.confidentiality.obligation_verified",
      answer_type: "single_select",
      options: stateOptions("dpo.confidentiality.obligation_verified"),
      evidence_to_review: [
        "cláusula, compromiso o instrumento aplicable",
        "revisión contractual",
      ],
      evidence_review_help: [
        {
          evidence_item: "cláusula, compromiso o instrumento aplicable",
          review_guide:
            "La evidencia debe permitir identificar la fuente del deber de secreto, reserva o confidencialidad que alcanza al DPO y, cuando exista, el instrumento que lo recoge o desarrolla. Corresponde verificar su aplicabilidad a la persona designada y su alcance respecto de los datos personales y otras materias protegidas conocidas en ejercicio de sus funciones. El deber establecido directamente por la normativa no depende de la firma de una cláusula autónoma.",
          no_evidence_guidance:
            "Pueden revisarse disposiciones legales, contratos, compromisos, reglamentos o políticas internas que permitan establecer el deber aplicable. Debe distinguirse entre ausencia de un instrumento específico, falta de constancia documental y falta de identificación de la obligación correspondiente. No debe concluirse que el deber legal es inexistente solo porque no se encuentre una cláusula firmada.",
          expected_result:
            "Una conclusión fundada sobre la fuente, vigencia, alcance y aplicabilidad del deber de confidencialidad al DPO. Deben quedar identificados los instrumentos existentes y las eventuales brechas de formalización o claridad, sin presentar una cláusula independiente como requisito universal.",
        },
        {
          evidence_item: "revisión contractual",
          review_guide:
            "Corresponde contrastar la relación jurídica del DPO —interna, externa o funcionaria, según corresponda— con las obligaciones de confidencialidad que resulten aplicables. La revisión debe identificar cláusulas, remisiones normativas o condiciones contractuales pertinentes, y verificar que no existan contradicciones con las funciones legítimas de comunicación, coordinación y relación con autoridades que ejerce el DPO.",
          no_evidence_guidance:
            "Es posible recurrir a antecedentes laborales, de prestación de servicios, de nombramiento o de régimen funcionario, según la modalidad de designación. Debe diferenciarse la inexistencia de un contrato individual, su falta de disponibilidad y la ausencia de una revisión documentada. En particular, no corresponde exigir un contrato privado a quien está sujeto a un régimen estatutario.",
          expected_result:
            "Una evaluación trazable de la relación jurídica y de las condiciones de confidencialidad aplicables al DPO, con identificación de concordancias, contradicciones y aspectos que requieran aclaración o formalización. El resultado debe servir de base para las actividades posteriores sin confundir revisión contractual con aceptación expresa del deber.",
        },
      ],
      required_facts: [],
      default_next_node_key: "formalize-instrument",
      provenance: "legal_requirement",
    },
    {
      node_key: "formalize-instrument",
      node_type: "question",
      title: "Formalización del deber",
      prompt:
        "¿Quedó formalizado el deber en instrumento interno o contractual, o se descartó fundadamente por ya contenido?",
      why_it_matters:
        "Sin formalización el deber queda sin instrumento que lo haga exigible y trazable.",
      fact_key: "dpo.confidentiality.formalized",
      answer_type: "single_select",
      options: [
        {
          value: "yes",
          label: "Verificado",
          description: "Formalizado y respaldado con evidencia.",
          fact_effect: {
            fact_key: "dpo.confidentiality.formalized",
            value: "yes",
          },
        },
        {
          value: "na",
          label: "No aplica en este caso",
          description:
            "El instrumento aplicable ya contiene el deber y solo se verificó.",
          fact_effect: {
            fact_key: "dpo.confidentiality.formalized",
            value: "na",
          },
        },
        {
          value: "no",
          label: "Pendiente",
          description: "Aún no realizado o sin evidencia suficiente.",
          fact_effect: {
            fact_key: "dpo.confidentiality.formalized",
            value: "no",
          },
        },
        {
          value: "unknown",
          label: "Sin información",
          description: "No es posible determinarlo con respaldo disponible.",
          fact_effect: {
            fact_key: "dpo.confidentiality.formalized",
            value: "unknown",
          },
        },
      ],
      evidence_to_review: [
        "cláusula, compromiso o instrumento aplicable",
        "evidencia de aceptación",
      ],
      evidence_review_help: [
        {
          evidence_item: "cláusula, compromiso o instrumento aplicable",
          review_guide:
            "Corresponde determinar si el instrumento aplicable al DPO ya contempla suficientemente el deber de secreto, reserva o confidencialidad, considerando los datos personales y las demás materias protegidas conocidas en el ejercicio de sus funciones. Si el deber está adecuadamente recogido, debe quedar documentado el fundamento para no incorporar una formalización adicional. Si existen vacíos relevantes, corresponde identificar el instrumento interno o contractual que permita subsanarlos.",
          no_evidence_guidance:
            "Pueden contrastarse contratos, actos de designación, reglamentos, políticas o disposiciones normativas aplicables. Debe distinguirse entre un instrumento existente que no fue localizado, una obligación legal identificada sin formalización interna suficiente y una formalización adicional innecesaria por estar ya cubierta. La ausencia de una cláusula autónoma no elimina el deber establecido por la ley.",
          expected_result:
            "Una decisión trazable sobre la necesidad de formalización adicional: instrumento existente suficiente, formalización realizada o brecha pendiente. Cuando se acredite que el deber ya está contenido adecuadamente y no corresponde una actuación adicional, debe sustentarse la opción «No aplica» prevista en el nodo, sin modificar sus reglas de evaluación.",
        },
        {
          evidence_item: "evidencia de aceptación",
          review_guide:
            "La revisión debe establecer si existe constancia pertinente de que el DPO recibió, conoció o aceptó el instrumento de confidencialidad cuando esa formalización corresponda. Pueden considerarse firmas, comunicaciones con acuse, registros de incorporación u otros medios equivalentes, según la relación jurídica y el procedimiento aplicable. No debe exigirse una aceptación separada cuando el deber ya esté suficientemente incorporado y no se requiera formalización adicional.",
          no_evidence_guidance:
            "Es importante diferenciar la falta de constancia de aceptación, la inexistencia de un procedimiento que la requiera y los casos en que la formalización adicional fue descartada fundadamente. Si se requiere aceptación y no puede acreditarse, debe identificarse esa brecha. La falta de firma no implica por sí misma que el deber legal sea inexistente o inexigible.",
          expected_result:
            "Una conclusión verificable sobre la constancia de conocimiento o aceptación cuando resulte pertinente, o sobre su falta de aplicabilidad debidamente justificada. Si el instrumento existente ya cubre el deber y no corresponde una nueva aceptación, el resultado debe ser coherente con la decisión fundada de «No aplica», sin crear requisitos documentales adicionales.",
        },
      ],
      help_text: [
        "Solo cuando corresponda formalizar. Si el instrumento aplicable ya contiene el deber, verifica y marca No aplica en este caso.",
      ],
      required_facts: [],
      default_next_node_key: "verify-scope",
      provenance: "legal_requirement",
    },
    {
      node_key: "verify-scope",
      node_type: "question",
      title: "Alcance del deber",
      prompt:
        "¿El deber incluye la información personal y las demás materias sujetas a secreto, reserva o confidencialidad?",
      why_it_matters:
        "Un alcance incompleto deja materias sensibles fuera del deber.",
      fact_key: "dpo.confidentiality.scope_included",
      answer_type: "single_select",
      options: stateOptions("dpo.confidentiality.scope_included"),
      evidence_to_review: [
        "cláusula, compromiso o instrumento aplicable",
        "evidencia de aceptación",
      ],
      evidence_review_help: [
        {
          evidence_item: "cláusula, compromiso o instrumento aplicable",
          review_guide:
            "Verificar que el deber aplicable al DPO comprenda los datos personales y las demás materias sujetas a secreto, reserva o confidencialidad conocidas en ejercicio de sus funciones. Contrastar el alcance del instrumento con las disposiciones normativas pertinentes.",
          no_evidence_guidance:
            "Revisar contratos, reglamentos, políticas o disposiciones aplicables. Distinguir la falta de un instrumento específico de un alcance insuficiente; el deber legal no desaparece por ausencia de cláusula.",
          expected_result:
            "Alcance del deber identificado y respaldado, con eventuales omisiones o ambigüedades registradas para su corrección.",
        },
        {
          evidence_item: "evidencia de aceptación",
          review_guide:
            "Comprobar, cuando corresponda, que la constancia de conocimiento o aceptación del DPO se refiera al instrumento que contiene el alcance completo del deber, sin limitarlo solo a datos personales.",
          no_evidence_guidance:
            "Revisar firmas, acuses o registros equivalentes. Diferenciar la falta de constancia de aceptación de los casos en que no se requiere una aceptación separada.",
          expected_result:
            "Constancia pertinente del conocimiento o aceptación del alcance aplicable, o justificación documentada de por qué no corresponde una aceptación adicional.",
        },
      ],
      required_facts: [],
      default_next_node_key: "verify-measures",
      provenance: "legal_requirement",
    },
    {
      node_key: "verify-measures",
      node_type: "question",
      title: "Medidas organizacionales",
      prompt:
        "¿Se verificaron las medidas organizacionales que permiten cumplir el deber?",
      why_it_matters:
        "Sin medidas organizacionales el deber queda en declaración y pierde protección operativa.",
      fact_key: "dpo.confidentiality.measures_verified",
      answer_type: "single_select",
      options: stateOptions("dpo.confidentiality.measures_verified"),
      evidence_to_review: ["controles organizacionales relacionados"],
      evidence_review_help: [
        {
          evidence_item: "controles organizacionales relacionados",
          review_guide:
            "La revisión debe comprobar que existan medidas concretas para proteger la información conocida por el DPO en sus funciones, como permisos adecuados, canales seguros, custodia documental y reglas de comunicación o conservación, según los riesgos y la organización. Verificar tanto su definición como su aplicación; la presencia del deber en una cláusula no acredita por sí sola estos controles.",
          no_evidence_guidance:
            "Contrastar políticas, configuraciones de acceso, procedimientos o registros de aplicación. Distinguir entre medidas existentes sin respaldo suficiente, controles definidos pero no implementados y ausencia efectiva de protección, sin exigir una tecnología o documento único.",
          expected_result:
            "Una conclusión verificable sobre los controles existentes y su aplicación al trabajo del DPO, con brechas y medidas pendientes identificadas. Las medidas deben proteger la confidencialidad sin impedir el acceso legítimo a información necesaria ni las comunicaciones autorizadas propias de sus funciones.",
        },
      ],
      required_facts: [],
      default_next_node_key: "final-confirmation",
      provenance: "legal_requirement",
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del deber",
      prompt:
        "El sistema verifica que cada verificación del procedimiento esté realizada.",
      answer_type: "none",
      required_facts: [...VERIFICATION_FACTS],
      transitions: [
        {
          rule_id: "pending-verification",
          description:
            "Alguna verificación está pendiente o sin información: el deber sigue en formalización.",
          when: { op: "any", conditions: VERIFICATION_FACTS.map(unresolved) },
          goto_outcome_key: "duty_in_progress",
          explanation:
            "Existen verificaciones pendientes o sin información suficiente. El deber aún no queda formalizado y respaldado.",
        },
        {
          rule_id: "all-verified",
          description:
            "Designación, obligación, formalización, alcance y medidas verificados.",
          when: {
            op: "all",
            conditions: [
              isDone("dpo.designated"),
              isDone("dpo.confidentiality.obligation_verified"),
              verifiedOrNa("dpo.confidentiality.formalized"),
              isDone("dpo.confidentiality.scope_included"),
              isDone("dpo.confidentiality.measures_verified"),
            ],
          },
          goto_outcome_key: "duty_formalized",
          explanation:
            "Todas las verificaciones del procedimiento están realizadas y respaldadas.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en formalización.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "duty_in_progress",
          explanation:
            "El procedimiento no está completo: revisa las verificaciones pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "duty_formalized",
      label: "Deber formalizado y respaldado",
      classification: "legal_requirement",
      explanation:
        "La obligación aplicable, la formalización, el alcance y las medidas organizacionales quedaron verificados para el DPO designado.",
      detail:
        "Esta constatación no constituye una declaración automática de cumplimiento jurídico: registra el deber formalizado con su evidencia.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "dpo.confidentiality_status", value: "formalized" },
      ],
      next_actions: [
        {
          kind: "info",
          label: "Conservar la evidencia del deber",
          note: "Archiva la cláusula, compromiso o instrumento aplicable con su evidencia de aceptación y los controles organizacionales relacionados.",
        },
      ],
    },
    {
      outcome_key: "duty_in_progress",
      label: "Deber en formalización",
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
        "Sin DPO designado no hay deber que formalizar.",
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
