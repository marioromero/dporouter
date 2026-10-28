import type { ExecutionProtocol, FactCondition } from "./types";

/**
 * CANONICAL SOURCE OF TRUTH — Protocolo de ejecución guiada D1.18.
 *
 * activity_key = mpi.assemble_program (procedure). Contenido aprobado
 * por la iteración vigente; usa exclusivamente pasos, evidencia, legal
 * basis, dependencias y aplicabilidad del contenido canónico D1.18. Los
 * diez componentes son verificaciones independientes: no se convierten
 * en árbol artificial.
 *
 * El ciclo de vida del MPI se reutiliza como fact externo ya producido
 * por D1.02, D1.04 o Diagnóstico (`mpi.lifecycle_status` declarado en
 * `external_fact_keys`): es prerrequisito de entrada y objeto del
 * efecto definitivo, nunca una re-evaluación de adopción. Las
 * dependencias con actividades previas se presentan como actividades
 * relacionadas y evidencia de entrada, sin duplicar su trabajo.
 *
 * Los diez pasos canónicos se verifican como nueve componentes: el
 * décimo paso (actualizar el ciclo de vida) es el efecto definitivo,
 * no una verificación.
 */

const LIFECYCLE_FACT = "mpi.lifecycle_status";

const COMPONENT_FACTS = [
  "mpi.assembly.responsible_identified",
  "mpi.assembly.dpo_verified",
  "mpi.assembly.treatments_characterized",
  "mpi.assembly.risks_identified",
  "mpi.assembly.protocols_verified",
  "mpi.assembly.obligations_verified",
  "mpi.assembly.integration_verified",
  "mpi.assembly.diffusion_verified",
  "mpi.assembly.evidence_consolidated",
];

/** Estados de adopción que habilitan el ensamblaje (canon D1.18).
 * `implemented` se incluye para re-verificación idempotente: el propio
 * state_effect produce ese valor y la aplicabilidad textual cubre la
 * entrada inicial al programa. */
const ASSEMBLY_ELIGIBLE = ["adoption_formalized", "implementing", "implemented"];

function isDone(fact_key: string): FactCondition {
  return { op: "fact_equals", fact_key, value: "yes" };
}

function unresolved(fact_key: string): FactCondition {
  return { op: "fact_unresolved", fact_key };
}

function lifecycleEligible(): FactCondition {
  return { op: "fact_in", fact_key: LIFECYCLE_FACT, values: ASSEMBLY_ELIGIBLE };
}

function stateOptions(factKey: string) {
  return [
    {
      value: "yes",
      label: "Verificado",
      description: "Implementado y respaldado con evidencia.",
      fact_effect: { fact_key: factKey, value: "yes" },
    },
    {
      value: "no",
      label: "Pendiente",
      description: "Aún no implementado o sin evidencia suficiente.",
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

function componentNode(
  node_key: string,
  title: string,
  prompt: string,
  factKey: string,
  evidence_to_review: string[],
  next: string,
  extra?: {
    help_text?: string[];
    related_activity_keys?: string[];
  },
) {
  return {
    node_key,
    node_type: "question" as const,
    title,
    prompt,
    fact_key: factKey,
    answer_type: "single_select" as const,
    options: stateOptions(factKey),
    evidence_to_review,
    ...(extra?.help_text ? { help_text: extra.help_text } : {}),
    required_facts: [] as string[],
    default_next_node_key: next,
    ...(extra?.related_activity_keys
      ? { related_activity_keys: extra.related_activity_keys }
      : {}),
    provenance: "legal_requirement" as const,
  };
}

export const MPI_ASSEMBLE_PROGRAM_PROTOCOL: ExecutionProtocol = {
  protocol_key: "mpi.assemble_program.v1",
  activity_key: "mpi.assemble_program",
  version: 1,
  mode: "procedure",
  title: "Procedimiento guiado de ensamblaje del programa MPI",
  description:
    "Verifica que cada componente mínimo del MPI esté operativo, detecta faltantes con su evidencia y conduce hasta el programa implementado cuando corresponde.",
  entry_node_key: "verify-responsible",
  decision_fact_keys: COMPONENT_FACTS,
  external_fact_keys: [LIFECYCLE_FACT],
  last_review: "2026-09-23",
  provenance: "agency_standard",
  nodes: [
    {
      ...componentNode(
        "verify-responsible",
        "Individualización del responsable",
        "¿Quedó verificada la individualización del responsable y su representante cuando corresponda?",
        "mpi.assembly.responsible_identified",
        ["evidencia de cada componente", "programa de cumplimiento consolidado"],
        "verify-dpo",
      ),
      evidence_review_help: [
        {
          evidence_item: "evidencia de cada componente",
          review_guide:
            "Contrastar la individualización del responsable con antecedentes institucionales, societarios, administrativos o contractuales que permitan verificar su identidad y los datos exigibles para el MPI. Cuando corresponda identificar a un representante, comprobar su identidad y la relación que justifica esa representación, distinguiéndola de la mera designación de un contacto operativo o del DPO.",
          no_evidence_guidance:
            "Revisar instrumentos de constitución, registros institucionales, poderes, actos administrativos o antecedentes equivalentes que permitan corroborar la identidad del responsable y la representación aplicable. Si no se acredita la información requerida, registrar la insuficiencia; la ausencia de antecedentes de un representante solo puede considerarse justificada si se determina que no corresponde individualizarlo.",
          expected_result:
            "Identidad del responsable verificable y coherente con sus antecedentes, junto con la individualización del representante cuando resulte exigible. Distinguir un componente completo de uno pendiente, sin imponer universalmente certificados o instrumentos de representación de un tipo específico.",
        },
        {
          evidence_item: "programa de cumplimiento consolidado",
          review_guide:
            "Verificar que el programa incorpore la individualización del responsable del tratamiento y de su representante cuando corresponda, de manera consistente con antecedentes institucionales vigentes. Comprobar que identifique al sujeto responsable del MPI y no lo confunda con el DPO, un encargado del tratamiento o una unidad interna sin responsabilidad jurídica propia.",
          no_evidence_guidance:
            "Revisar los documentos o secciones que integran el programa, sus anexos y referencias internas para establecer si la individualización consta en otra parte del conjunto. Distinguir entre la inexistencia de un archivo único consolidado y la falta efectiva de información exigible dentro del MPI.",
          expected_result:
            "Contenido que permita identificar clara y verificablemente al responsable y, cuando corresponda, a su representante, de forma concordante con la evidencia revisada. El componente puede estar completo aunque el programa se distribuya en varios documentos vinculados, siempre que su contenido exigible esté respaldado.",
        },
      ],
    },
    {
      ...componentNode(
        "verify-dpo",
        "DPO, medios y facultades",
        "¿Quedaron verificados el DPO, sus medios y facultades dentro del programa?",
        "mpi.assembly.dpo_verified",
        ["evidencia de cada componente", "expediente de designación DPO"],
        "characterize-treatments",
        {
          help_text: [
            "Usa la designación y validación D1.08/D1.09 como insumo cuando existan; esta verificación constata su integración al programa.",
          ],
          related_activity_keys: ["dpo.designate"],
        },
      ),
      evidence_review_help: [
        {
          evidence_item: "evidencia de cada componente",
          review_guide:
            "Verificar que el MPI incorpore la identificación del DPO y describa sus funciones, facultades, medios de contacto y condiciones necesarias para ejercerlas, contrastando el contenido con antecedentes de funcionamiento efectivo. Comprobar previsiones de autonomía, reporte directo, acceso a información y recursos, sin confundir lo declarado con su disponibilidad real.",
          no_evidence_guidance:
            "Revisar documentos integrantes del programa, instrumentos organizacionales, procedimientos, comunicaciones y antecedentes de funcionamiento para comprobar cómo se integra la función del DPO. Distinguir entre soportes no localizados, información insuficiente sobre sus condiciones de ejercicio y deficiencias que impidan considerar implementado el componente.",
          expected_result:
            "Una integración verificable del DPO al MPI, con funciones, facultades y medios adecuados a la organización y respaldados por antecedentes de implementación efectiva. No se exige una estructura documental única ni recursos idénticos para todas las organizaciones, pero las condiciones esenciales requieren respaldo más allá de su mera declaración.",
        },
        {
          evidence_item: "expediente de designación DPO",
          review_guide:
            "Comprobar que la designación identifique a la persona natural que ejerce como DPO, incluso si el servicio se presta mediante una persona jurídica, y que corresponda a la situación vigente del responsable. Contrastar sus funciones, línea de reporte y medios de contacto con lo integrado al MPI, usando los resultados de D1.08 y D1.09 como antecedentes cuando estén disponibles.",
          no_evidence_guidance:
            "Revisar instrumentos de designación, contratos, comunicaciones institucionales, publicaciones de contacto u otros documentos equivalentes que acrediten la designación y sus condiciones. La falta de resultados previos de D1.08 o D1.09 no es por sí sola una deficiencia, pero debe registrarse la insuficiencia si no puede comprobarse la existencia o vigencia de la designación.",
          expected_result:
            "Una designación vigente y trazable de un DPO identificable, coherente con las funciones, facultades y medios previstos en el MPI y con las condiciones verificadas para ejercerlas. Si hay diferencias relevantes entre la designación, la validación previa y el programa, identificarlas para aclaración o corrección, sin presumir que la designación formal acredita por sí sola la implementación completa.",
        },
      ],
    },
    {
      ...componentNode(
        "characterize-treatments",
        "Caracterización de tratamientos y titulares",
        "¿Quedó verificada la caracterización de tratamientos y titulares del programa?",
        "mpi.assembly.treatments_characterized",
        ["evidencia de cada componente", "inventario de tratamientos D2 si existe"],
        "identify-risks",
        {
          help_text: [
            "Cuando D2 haya sido importado, su inventario alimenta este componente.",
          ],
          related_activity_keys: ["treatment.inventory_create"],
        },
      ),
      evidence_review_help: [
        {
          evidence_item: "evidencia de cada componente",
          review_guide:
            "Contrastar la caracterización incorporada al MPI con los tratamientos y categorías de titulares pertinentes y con los antecedentes operativos disponibles. Verificar, según corresponda, los contenidos previstos en el artículo 3, letra d), del reglamento: tipos de datos, ámbito territorial, bases utilizadas, titulares, finalidades, fuentes, bases de licitud, destinatarios, transferencias internacionales, supresión y decisiones automatizadas; para los aspectos condicionales, comprobar si existen esas operaciones.",
          no_evidence_guidance:
            "Revisar secciones del programa, anexos, registros de actividades, descripciones de procesos u otros antecedentes equivalentes. Distinguir entre información integrada desde documentos relacionados, tratamientos insuficientemente caracterizados y falta de respaldo para verificar el componente.",
          expected_result:
            "Una caracterización verificable e integrada al MPI que cubra los tratamientos y titulares pertinentes, con contenidos normativos aplicables y respaldo coherente con las operaciones efectivas. No se exige un documento único ni una plantilla universal, pero las omisiones sustantivas deben quedar pendientes.",
        },
        {
          evidence_item: "inventario de tratamientos D2 si existe",
          review_guide:
            "Consultar el inventario D2 cuando exista o haya sido importado y contrastarlo con los tratamientos efectivamente realizados y la caracterización requerida para el MPI. Comprobar su vigencia, cobertura de titulares y demás elementos pertinentes; la importación por sí sola no acredita que todos los contenidos estén completos.",
          no_evidence_guidance:
            "Pueden utilizarse otros registros de actividades, mapas de procesos, documentación operativa o antecedentes equivalentes para verificar los tratamientos, sin exigir ejecutar o importar D2. La ausencia del inventario D2 no es por sí misma un incumplimiento si otros medios respaldan suficientemente la caracterización exigible.",
          expected_result:
            "Cuando esté disponible, el inventario D2 sirve de fuente contrastada para la caracterización integrada al MPI. Si no existe, otros antecedentes pueden sustentar el componente siempre que cubran los contenidos pertinentes y no dejen tratamientos relevantes sin caracterizar.",
        },
      ],
    },
    {
      ...componentNode(
        "identify-risks",
        "Actividades y riesgos relevantes",
        "¿Quedó verificada la identificación de actividades y riesgos relevantes del programa?",
        "mpi.assembly.risks_identified",
        ["evidencia de cada componente", "matriz de brechas"],
        "verify-protocols",
      ),
      evidence_review_help: [
        {
          evidence_item: "evidencia de cada componente",
          review_guide:
            "Verificar que el MPI identifique las actividades y procesos de tratamiento relevantes y evalúe los riesgos asociados según sus características y posibles consecuencias para los derechos de los titulares. Comprobar que exista respaldo en una matriz de riesgos y que sus resultados se relacionen con los protocolos y medidas preventivas, diferenciándola de una matriz de brechas.",
          no_evidence_guidance:
            "Revisar evaluaciones de riesgos, descripciones de procesos, registros de tratamiento, documentos del programa u otros antecedentes equivalentes. Distinguir entre información dispersa integrable al MPI, una evaluación incompleta y la falta de una matriz de riesgos suficiente para verificar el componente; una matriz de brechas por sí sola no acredita ese requisito.",
          expected_result:
            "Una identificación documentada de actividades y procesos relevantes con riesgos evaluados en una matriz coherente con los tratamientos y las medidas preventivas del MPI. No se exige una plantilla ni escala universal, pero la identificación genérica de riesgos sin una matriz que los estructure no acredita completamente el componente.",
        },
        {
          evidence_item: "matriz de brechas",
          review_guide:
            "Examinar la matriz de brechas para identificar omisiones, debilidades o componentes pendientes relativos a actividades y riesgos, comprobando que los hallazgos tengan respaldo y orienten acciones correctivas. Diferenciar esta herramienta de seguimiento de la matriz de riesgos reglamentaria, y verificar si esta última existe separadamente o está identificable dentro de un instrumento integrado.",
          no_evidence_guidance:
            "Pueden revisarse diagnósticos, planes de cierre, registros de hallazgos u otros mecanismos equivalentes sin exigir un formato único de matriz de brechas. Su ausencia no es por sí sola un incumplimiento legal, pero debe comprobarse independientemente que exista una matriz de riesgos suficiente y que las deficiencias sustantivas estén identificadas.",
          expected_result:
            "Brechas relativas a actividades y riesgos identificadas y trazables, o su ausencia respaldada por una revisión suficiente, con acciones de cierre cuando correspondan. La matriz de brechas no sustituye la matriz de riesgos salvo que contenga efectivamente una evaluación de riesgos identificable y suficiente.",
        },
      ],
    },
    {
      ...componentNode(
        "verify-protocols",
        "Protocolos y procedimientos preventivos",
        "¿Quedaron verificados los protocolos, reglas y procedimientos preventivos del programa?",
        "mpi.assembly.protocols_verified",
        ["evidencia de cada componente", "programa de cumplimiento consolidado"],
        "verify-obligations",
        {
          related_activity_keys: ["governance.preventive_framework"],
        },
      ),
      evidence_review_help: [
        {
          evidence_item: "evidencia de cada componente",
          review_guide:
            "Comprobar que existan protocolos, reglas y procedimientos preventivos relacionados con las actividades de tratamiento y los riesgos identificados, con instrucciones claras para orientar su aplicación. Contrastar su contenido con los procesos reales, responsables de ejecución y antecedentes de adopción o funcionamiento, sin dar por suficiente una enumeración genérica de políticas.",
          no_evidence_guidance:
            "Revisar políticas internas, procedimientos operativos, instructivos, controles documentados, registros de aplicación u otros instrumentos equivalentes. Distinguir entre documentos existentes pero no localizados, medidas aún no formalizadas y ausencia de mecanismos efectivos para prevenir las infracciones relevantes.",
          expected_result:
            "Protocolos, reglas y procedimientos preventivos verificables, pertinentes a los riesgos del programa y respaldados por antecedentes de adopción y aplicación. No se exige una plantilla universal ni un documento independiente para cada riesgo, pero las medidas esenciales no deben quedar solo declaradas o pendientes de implementación.",
        },
        {
          evidence_item: "programa de cumplimiento consolidado",
          review_guide:
            "Verificar que el programa incorpore o referencie de forma identificable los protocolos, reglas y procedimientos preventivos, relacionándolos con los tratamientos, riesgos y medidas de cumplimiento correspondientes. Comprobar que las referencias estén vigentes, sean accesibles para quienes deben aplicarlas y resulten coherentes con los demás componentes del MPI.",
          no_evidence_guidance:
            "Revisar versiones del programa, anexos, repositorios internos, índices documentales o instrumentos relacionados que permitan reconstruir la integración de los procedimientos preventivos al MPI. Si los documentos existen por separado, identificar cualquier falta de integración o trazabilidad sin presumir automáticamente que las medidas no existen.",
          expected_result:
            "Un programa consolidado que permita identificar y consultar los procedimientos preventivos aplicables, con correspondencia verificable con los riesgos y actividades cubiertos. La integración puede realizarse mediante documentos incorporados o referencias controladas, siempre que las medidas esenciales tengan respaldo y sean compatibles con la operación real.",
        },
      ],
    },
    {
      ...componentNode(
        "verify-obligations",
        "Obligaciones internas y canal de denuncia",
        "¿Quedaron verificadas las obligaciones internas, el régimen disciplinario y el canal de denuncia?",
        "mpi.assembly.obligations_verified",
        ["evidencia de cada componente"],
        "verify-integration",
        {
          help_text: [
            "Usa el reporte interno, el régimen disciplinario y la regulación integrada como insumo cuando existan.",
          ],
          related_activity_keys: [
            "mpi.internal_reporting_and_whistleblowing",
            "mpi.internal_disciplinary_framework",
            "mpi.internal_regulation_integrate",
          ],
        },
      ),
      evidence_review_help: [
        {
          evidence_item: "evidencia de cada componente",
          review_guide:
            "Verificar que el MPI establezca mecanismos de comunicación interna y externa de incumplimientos, un régimen disciplinario aplicable y canales de denuncia con resguardos de confidencialidad y protección. Contrastar estos mecanismos con instrumentos internos, contractuales y operativos pertinentes, comprobando su integración al programa y posibilidad de uso efectivo.",
          no_evidence_guidance:
            "Revisar reglamentos internos, contratos, políticas de cumplimiento, procedimientos de reporte, mecanismos disciplinarios, canales de denuncia y antecedentes equivalentes. Distinguir entre mecanismos existentes pero no incorporados al MPI, información insuficiente sobre su funcionamiento y ausencia de componentes sustantivos aplicables.",
          expected_result:
            "Un programa que incorpore mecanismos verificables de reporte interno y externo, un régimen disciplinario adecuado al marco aplicable y un canal de denuncia con resguardos de confidencialidad y protección. Los instrumentos pueden estar integrados o relacionados, pero no basta con anunciarlos ni se deben trasladar automáticamente al DPO la investigación, resolución o sanción de todas las denuncias.",
        },
      ],
    },
    {
      ...componentNode(
        "verify-integration",
        "Integración contractual e interna",
        "¿Quedó verificada la integración contractual e interna exigible del programa?",
        "mpi.assembly.integration_verified",
        ["evidencia de cada componente", "programa de cumplimiento consolidado"],
        "verify-diffusion",
      ),
      evidence_review_help: [
        {
          evidence_item: "evidencia de cada componente",
          review_guide:
            "Verificar que las obligaciones, reglas y procedimientos pertinentes del MPI se hayan incorporado a los instrumentos internos, laborales, administrativos o contractuales que correspondan a la organización y a las personas involucradas. Contrastar las disposiciones con los mecanismos de incorporación utilizados, considerando su alcance, vigencia y coherencia con el régimen jurídico aplicable.",
          no_evidence_guidance:
            "Revisar reglamentos internos, contratos, anexos, instrumentos de prestación de servicios, actos administrativos, políticas formalmente incorporadas u otros antecedentes equivalentes según la organización. Distinguir entre instrumentos no localizados, integración parcial y ausencia de mecanismos suficientes para hacer aplicables las obligaciones pertinentes, sin exigir una cláusula idéntica en todas las relaciones.",
          expected_result:
            "Una integración verificable de las obligaciones pertinentes del MPI en los instrumentos y relaciones donde corresponde aplicarlas, respaldada y vigente. No se requiere un documento único ni modificar indiscriminadamente todos los contratos, pero las omisiones sustantivas deben quedar identificadas como pendientes.",
        },
        {
          evidence_item: "programa de cumplimiento consolidado",
          review_guide:
            "Comprobar que el programa consolidado identifique cómo se integran sus obligaciones, reglas y procedimientos en los instrumentos internos y contractuales pertinentes, mediante disposiciones incorporadas o referencias verificables. Revisar la correspondencia entre el contenido del MPI, los instrumentos aplicables y las personas o funciones comprendidas, sin confundir una declaración general de obligatoriedad con su incorporación efectiva.",
          no_evidence_guidance:
            "Revisar anexos del programa, referencias documentales, registros de incorporación, instrumentos institucionales y antecedentes relacionados que permitan reconstruir la integración. Si hay reglas fuera del documento consolidado, verificar su vínculo con el MPI y la trazabilidad de ese vínculo, sin presumir incumplimiento por su ubicación documental.",
          expected_result:
            "Un programa consolidado que permita identificar las obligaciones integradas, los instrumentos que las hacen aplicables y el alcance de esa integración. Puede acreditarse mediante documentos relacionados y referencias controladas, siempre que las obligaciones esenciales no queden meramente declaradas o sin respaldo de aplicación.",
        },
      ],
    },
    {
      ...componentNode(
        "verify-diffusion",
        "Difusión del programa",
        "¿Quedó verificada la difusión del programa a sus destinatarios?",
        "mpi.assembly.diffusion_verified",
        ["evidencia de cada componente"],
        "consolidate-evidence",
      ),
      evidence_review_help: [
        {
          evidence_item: "evidencia de cada componente",
          review_guide:
            "Verificar que el MPI se haya difundido a trabajadores, funcionarios y prestadores de servicios comprendidos en su ámbito, mediante medios adecuados para conocer las obligaciones, reglas y procedimientos que les correspondan. Contrastar el contenido comunicado, destinatarios y antecedentes de entrega o acceso, y comprobar la difusión de actualizaciones relevantes cuando corresponda.",
          no_evidence_guidance:
            "Revisar comunicaciones institucionales, registros de entrega, publicaciones internas, inducciones, capacitaciones, constancias de acceso u otros antecedentes equivalentes. Distinguir entre la falta de un registro formal, una cobertura insuficiente de destinatarios y la ausencia efectiva de comunicación del programa o de sus actualizaciones pertinentes.",
          expected_result:
            "Una difusión verificable del MPI a sus destinatarios pertinentes, respaldada en cuanto al contenido, alcance y medios utilizados para mantenerla actualizada. No se exige plataforma, capacitación o firma individual universal, pero la mera disponibilidad pasiva de un documento no acredita por sí sola una difusión adecuada.",
        },
      ],
    },
    {
      ...componentNode(
        "consolidate-evidence",
        "Evidencia y brechas",
        "¿Quedó consolidada la evidencia con su matriz de brechas y el cierre de las obligatorias?",
        "mpi.assembly.evidence_consolidated",
        [
          "índice de componentes",
          "matriz de brechas",
          "evidencia de cierre de brechas obligatorias",
        ],
        "final-confirmation",
      ),
      evidence_review_help: [
        {
          evidence_item: "índice de componentes",
          review_guide:
            "Comprobar que el índice identifique los componentes obligatorios del MPI, su estado de verificación y las referencias para localizar sus evidencias. Contrastar el índice con las actividades revisadas y el programa consolidado, detectando componentes omitidos, referencias desactualizadas o verificaciones sin soporte.",
          no_evidence_guidance:
            "Revisar el programa, anexos, registros de seguimiento u otros mecanismos equivalentes que relacionen cada componente obligatorio con su respaldo y estado. La falta de un índice con formato específico no es por sí sola un incumplimiento, pero debe registrarse cualquier falta de trazabilidad que impida comprobar la cobertura completa del MPI.",
          expected_result:
            "Una relación verificable de todos los componentes obligatorios, con referencias a sus evidencias, estado de implementación y brechas pendientes cuando existan. Puede utilizarse otro mecanismo equivalente al índice, siempre que permita comprobar la integridad del programa sin presumir cumplidos componentes carentes de respaldo.",
        },
        {
          evidence_item: "matriz de brechas",
          review_guide:
            "Verificar que la matriz identifique diferencias entre los componentes obligatorios del MPI y su implementación efectiva, describiendo deficiencias, estado y acciones necesarias. Contrastar sus registros con las verificaciones previas y distinguir las brechas que bloquean la implementación de mejoras complementarias no esenciales.",
          no_evidence_guidance:
            "Revisar diagnósticos, registros de hallazgos, planes de acción u otros instrumentos equivalentes que permitan identificar y seguir las brechas, sin exigir una plantilla única. No confundir esta herramienta con la matriz de riesgos normativa; si no permite determinar si subsisten incumplimientos obligatorios, la revisión es insuficiente.",
          expected_result:
            "Brechas identificadas y trazables, distinguiendo requisitos obligatorios pendientes de mejoras no bloqueantes, o ausencia de brechas respaldada por una revisión completa. La matriz de brechas no sustituye la matriz de riesgos exigida salvo que incluya una evaluación de riesgos identificable y suficiente.",
        },
        {
          evidence_item: "evidencia de cierre de brechas obligatorias",
          review_guide:
            "Comprobar que cada brecha de un requisito obligatorio tenga evidencia de la corrección efectivamente realizada y vinculada con el hallazgo original. Distinguir acciones planificadas, ejecutadas sin validación suficiente y cierres respaldados por resultados verificables, según la naturaleza del componente.",
          no_evidence_guidance:
            "Revisar registros de remediación, instrumentos actualizados, constancias de implementación, verificaciones posteriores u otros antecedentes equivalentes. Si no se identificaron brechas obligatorias, comprobar que esa conclusión derive de una revisión completa; la falta de registros de cierre no demuestra por sí sola que no haya brechas.",
          expected_result:
            "Todas las brechas relativas a componentes obligatorios cerradas con respaldo suficiente, o ausencia de esas brechas justificada mediante la revisión integral. Las mejoras opcionales pueden seguir abiertas si no comprometen requisitos exigibles, pero una brecha obligatoria pendiente impide considerar plenamente implementado el MPI.",
        },
      ],
    },
    {
      node_key: "final-confirmation",
      node_type: "decision",
      title: "Confirmación del programa",
      prompt:
        "El sistema verifica el prerrequisito de adopción y que cada componente esté operativo.",
      answer_type: "none",
      required_facts: [LIFECYCLE_FACT, ...COMPONENT_FACTS],
      transitions: [
        {
          rule_id: "not-adopted",
          description:
            "Sin adopción formalizada no inicia el ensamblaje.",
          when: { op: "not", condition: lifecycleEligible() },
          goto_outcome_key: "not_started",
          explanation:
            "El programa se implementa después de la decisión de adopción. Primero corresponde formalizarla.",
        },
        {
          rule_id: "pending-components",
          description:
            "Algún componente está pendiente o sin información: el programa sigue en ensamblaje.",
          when: { op: "any", conditions: COMPONENT_FACTS.map(unresolved) },
          goto_outcome_key: "assembly_in_progress",
          explanation:
            "Existen componentes pendientes o sin información suficiente. El programa aún no queda implementado.",
        },
        {
          rule_id: "all-operative",
          description:
            "Adopción vigente y los nueve componentes operativos.",
          when: {
            op: "all",
            conditions: [
              lifecycleEligible(),
              ...COMPONENT_FACTS.map(isDone),
            ],
          },
          goto_outcome_key: "assembly_complete",
          explanation:
            "Todos los componentes exigibles están implementados y respaldados.",
        },
        {
          rule_id: "fallback-in-progress",
          description: "Cualquier otro estado parcial sigue en ensamblaje.",
          when: { op: "all", conditions: [] },
          goto_outcome_key: "assembly_in_progress",
          explanation:
            "El procedimiento no está completo: revisa los componentes pendientes.",
        },
      ],
      provenance: "legal_requirement",
    },
  ],
  outcomes: [
    {
      outcome_key: "assembly_complete",
      label: "Programa MPI implementado",
      classification: "legal_requirement",
      explanation:
        "La adopción está vigente y los nueve componentes quedaron verificados como operativos.",
      provenance: "legal_requirement",
      // Mapping directo e inequívoco al valor canónico declarado por la
      // actividad (state_effect): se materializa solo mediante la
      // finalización explícita del procedimiento.
      canonical_fact_effects: [
        { fact_key: "mpi.lifecycle_status", value: "implemented" },
      ],
      next_actions: [
        {
          kind: "activity",
          label: "Seguimiento del ciclo de vida del programa",
          activity_key: "mpi.lifecycle_review",
        },
        {
          kind: "info",
          label: "Conservar el programa consolidado",
          note: "Archiva el programa de cumplimiento consolidado con su índice de componentes, la evidencia de cada uno, la matriz de brechas y la evidencia de cierre de las obligatorias.",
        },
      ],
    },
    {
      outcome_key: "assembly_in_progress",
      label: "Programa en ensamblaje",
      classification: "agency_standard",
      explanation:
        "Quedan componentes pendientes o sin información. Completa cada punto y conserva su evidencia.",
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
        "Sin adopción vigente no inicia el ensamblaje.",
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
