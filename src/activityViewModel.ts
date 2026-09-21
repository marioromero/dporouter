import type { ActivityDefinition } from "./types";
import type { DemoActivityView } from "./data/demoActivity";

/**
 * View-model de presentación para la ficha reutilizable de actividad.
 *
 * Es la ÚNICA forma de datos que consume `ActivitySheet`. Puede construirse
 * desde una `ActivityDefinition` canónica (`fromActivityDefinition`) o desde
 * el fixture DEMO no canónico (`fromDemoActivity`), de modo que la llegada
 * de D01-D12 no requiera reescribir la estructura del renderer.
 *
 * No contiene textos DEMO por sí mismo: el renderer solo presenta los datos
 * que recibe y `fromDemoActivity` aporta el contenido demostrativo por diseño.
 */
export interface ActivityTraceRow {
  label: string;
  value: string;
}

export interface ActivityViewModel {
  name: string;
  humanCode: string;
  objective: string;
  appliesWhen: string;
  triggerQuestion: string;
  professionalDuty: string;
  steps: string[];
  interlocutors: string[];
  collectionMethods: string[];
  evidence: string[];
  deliverable: string;
  estimatedTime: string;
  complexity: string;
  grounds: string;
  dependencies: string[];
  expectedResult: string;
  regulatoryStatus: string;
  lastLegalReview: string;
  trace: ActivityTraceRow[];
}

function listOr(values: string[], fallback: string): string[] {
  return values.length > 0 ? values : [fallback];
}

function textOr(value: string, fallback: string): string {
  return value.trim() === "" ? fallback : value;
}

/**
 * Adaptador canónico: `ActivityDefinition` → `ActivityViewModel`.
 * Preserva `conditions_applicability` separado de `activity_dependencies`
 * tanto en secciones como en trazabilidad.
 */
export function fromActivityDefinition(def: ActivityDefinition): ActivityViewModel {
  const grounds =
    def.legal_basis.length > 0
      ? def.legal_basis
          .map((b) => `${b.source_name} — ${b.article_or_provision}`)
          .join("; ")
      : "Sin fundamento registrado.";

  const dependencies =
    def.activity_dependencies.length > 0
      ? def.activity_dependencies.map(
          (d) =>
            `${d.target_activity_key} · ${d.type} · ${d.scope}` +
            (d.condition.trim() === "" ? "" : ` — ${d.condition}`),
        )
      : ["Sin dependencias registradas."];

  return {
    name: def.name,
    humanCode: def.human_code,
    objective: textOr(def.objective, "El objetivo detallado de esta actividad se incorporará junto con su especificación canónica."),
    appliesWhen:
      def.conditions_applicability.length > 0
        ? def.conditions_applicability.join("; ")
        : "Sin condiciones de aplicabilidad registradas.",
    triggerQuestion: textOr(
      def.trigger_question,
      "La pregunta gatillo se incorporará junto con su especificación canónica.",
    ),
    professionalDuty:
      "El detalle operativo se incorporará junto con su especificación canónica.",
    steps: listOr(
      def.steps_operational,
      "Los pasos operacionales se incorporarán junto con su especificación canónica.",
    ),
    interlocutors: listOr(def.interlocutors, "Sin interlocutores registrados."),
    collectionMethods: listOr(
      def.data_collection_methods,
      "Sin métodos de levantamiento registrados.",
    ),
    evidence: listOr(def.evidence_required, "Sin evidencia registrada."),
    deliverable: textOr(def.deliverable, "Sin entregable registrado."),
    estimatedTime: textOr(def.estimated_time, "Sin estimación registrada."),
    complexity: textOr(def.complexity, "Sin complejidad registrada."),
    grounds,
    dependencies,
    expectedResult:
      def.state_effect.length > 0 || def.relationship_effect.length > 0
        ? [...def.state_effect, ...def.relationship_effect].join("; ")
        : "Sin efectos registrados.",
    regulatoryStatus: def.regulatory_status,
    lastLegalReview: textOr(def.last_legal_review, "Sin revisión registrada."),
    trace: [
      { label: "semantic key", value: def.activity_key },
      { label: "type", value: def.activity_type },
      {
        label: "applicable roles",
        value: def.applicable_role.length > 0 ? def.applicable_role.join(", ") : "—",
      },
      {
        label: "applicability conditions",
        value:
          def.conditions_applicability.length > 0
            ? def.conditions_applicability.join("; ")
            : "—",
      },
      {
        label: "dependencies",
        value:
          def.activity_dependencies.length > 0
            ? def.activity_dependencies.map((d) => d.target_activity_key).join(", ")
            : "—",
      },
      {
        label: "reasoning record",
        value: def.reasoning_record_required ? "Requerido" : "No requerido",
      },
      {
        label: "state effects",
        value: def.state_effect.length > 0 ? def.state_effect.join("; ") : "—",
      },
      {
        label: "relationship effects",
        value:
          def.relationship_effect.length > 0 ? def.relationship_effect.join("; ") : "—",
      },
      { label: "evidence basis", value: def.evidence_basis },
      { label: "regulatory status", value: def.regulatory_status },
      { label: "last legal review", value: def.last_legal_review || "—" },
    ],
  };
}

/**
 * Adaptador del fixture DEMO no canónico → `ActivityViewModel`.
 * Todo el contenido demostrativo vive aquí y en el fixture; el renderer
 * no conoce ningún texto DEMO.
 */
export function fromDemoActivity(demo: DemoActivityView): ActivityViewModel {
  return {
    name: demo.name,
    humanCode: demo.human_code,
    objective: demo.objective,
    appliesWhen: demo.applies_when,
    triggerQuestion: demo.trigger_question,
    professionalDuty: demo.professional_duty,
    steps: demo.steps_operational,
    interlocutors: demo.interlocutors,
    collectionMethods: demo.data_collection_methods,
    evidence: demo.evidence_required,
    deliverable: demo.deliverable,
    estimatedTime: demo.estimated_time,
    complexity: demo.complexity,
    grounds: demo.legal_ground,
    dependencies: ["Sin dependencias en el contenido demostrativo."],
    expectedResult: demo.expected_result,
    regulatoryStatus: "No aplica: contenido exclusivamente demostrativo.",
    lastLegalReview: "No aplica: contenido exclusivamente demostrativo.",
    trace: [
      { label: "semantic key", value: demo.activity_key },
      { label: "type", value: "demostrativo (no canónico)" },
      { label: "applicable roles", value: "No aplica en demostración" },
      {
        label: "applicability conditions",
        value: "Solo validación de interfaz de Stage 1",
      },
      { label: "dependencies", value: "Sin dependencias" },
      { label: "state effects", value: "Sin efectos de estado" },
      { label: "relationship effects", value: "Sin efectos de relación" },
      { label: "regulatory status", value: "No aplica (demostrativo)" },
    ],
  };
}
