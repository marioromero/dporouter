import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ActivityDefinition } from "../src/types";
import { searchDomains } from "../src/data/domains";
import {
  DEMO_ACTIVITY,
  DEMO_ACTIVITY_KEY,
  getDemoActivity,
} from "../src/data/demoActivity";
import {
  fromActivityDefinition,
  fromDemoActivity,
} from "../src/activityViewModel";
import { ActivitySheet } from "../src/components/ActivitySheet";

/** Definición compatible con el contrato canónico (23 campos exactos). */
const CANONICAL_LIKE: ActivityDefinition = {
  activity_key: "d8.eipd_execution",
  human_code: "D8-01",
  name: "Ejecutar evaluación de impacto",
  objective: "Determinar el riesgo del tratamiento antes de iniciarlo.",
  trigger_question: "¿El tratamiento presenta alto riesgo?",
  interlocutors: ["Responsable del tratamiento", "DPO"],
  data_collection_methods: ["Entrevista", "Revisión documental"],
  steps_operational: ["Describir el tratamiento.", "Evaluar necesidad y proporcionalidad."],
  evidence_required: ["Informe EIPD firmado"],
  evidence_basis: "legal_requirement",
  deliverable: "Informe EIPD",
  estimated_time: "4 h",
  complexity: "Alta",
  legal_basis: [
    {
      source_id: "ley-19628",
      source_name: "Ley 19.628",
      article_or_provision: "Art. 12",
      reference_text: "Referencia de prueba",
      source_url: "",
      basis_type: "legal",
      regulatory_status: "current",
      last_verified_at: "2026-09-21",
    },
  ],
  applicable_role: ["controller"],
  conditions_applicability: ["high_risk_treatment", "new_technology_use"],
  reasoning_record_required: true,
  state_effect: ["eipd_completed"],
  relationship_effect: [],
  regulatory_status: "current",
  last_legal_review: "2026-09-21",
  activity_type: "assessment",
  activity_dependencies: [
    {
      target_activity_key: "d2.treatment_inventory",
      scope: "cross_domain",
      type: "input_dependency",
      condition: "inventario disponible",
      rationale: "La EIPD consume el inventario.",
    },
  ],
};

const CANONICAL_KEYS = [
  "activity_key",
  "human_code",
  "name",
  "objective",
  "trigger_question",
  "interlocutors",
  "data_collection_methods",
  "steps_operational",
  "evidence_required",
  "evidence_basis",
  "deliverable",
  "estimated_time",
  "complexity",
  "legal_basis",
  "applicable_role",
  "conditions_applicability",
  "reasoning_record_required",
  "state_effect",
  "relationship_effect",
  "regulatory_status",
  "last_legal_review",
  "activity_type",
  "activity_dependencies",
];

describe("infraestructura de ficha desacoplada del fixture", () => {
  it("el renderer acepta una definición compatible con el contrato canónico", () => {
    const view = fromActivityDefinition(CANONICAL_LIKE);
    expect(view.name).toBe("Ejecutar evaluación de impacto");
    expect(view.humanCode).toBe("D8-01");
    expect(view.appliesWhen).toContain("high_risk_treatment");
    expect(view.grounds).toContain("Ley 19.628");

    render(
      <MemoryRouter>
        <ActivitySheet view={view} />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Ejecutar evaluación de impacto" }),
    ).toBeTruthy();
    expect(screen.getByText("D8-01")).toBeTruthy();
    expect(screen.getByText("Informe EIPD")).toBeTruthy();
    expect(screen.getByText("d8.eipd_execution")).toBeTruthy();
  });

  it("applicability y dependencias permanecen separados en la ficha canónica", () => {
    const view = fromActivityDefinition(CANONICAL_LIKE);
    const byLabel = Object.fromEntries(view.trace.map((r) => [r.label, r.value]));
    // Condiciones de aplicabilidad: hechos del caso.
    expect(byLabel["applicability conditions"]).toContain("high_risk_treatment");
    expect(byLabel["applicability conditions"]).not.toContain("d2.treatment_inventory");
    // Dependencias: relaciones actividad → actividad.
    expect(byLabel["dependencies"]).toContain("d2.treatment_inventory");
    expect(byLabel["dependencies"]).not.toContain("high_risk_treatment");
    expect(view.dependencies[0]).toContain("input_dependency");
  });

  it("ActivityDefinition no recibió campos específicos de DEMO", () => {
    expect(Object.keys(CANONICAL_LIKE).sort()).toEqual([...CANONICAL_KEYS].sort());

    const typesSource = readFileSync(join(process.cwd(), "src/types.ts"), "utf-8");
    const block = typesSource.match(
      /export interface ActivityDefinition \{[\s\S]*?\n\}/,
    )?.[0];
    expect(block).toBeDefined();
    expect(block).toContain("conditions_applicability");
    expect(block).toContain("activity_dependencies");
    for (const token of ["isDemo", "demo", "nonCanonical", "isCanonical"]) {
      expect(block).not.toMatch(new RegExp(token, "i"));
    }
  });

  it("el fixture DEMO sigue aislado del contenido canónico", () => {
    expect(DEMO_ACTIVITY_KEY).toBe("demo.activity_view");
    expect(getDemoActivity(DEMO_ACTIVITY_KEY)).toBe(DEMO_ACTIVITY);
    expect(searchDomains("demo")).toEqual([]);
    expect(searchDomains("demostraci")).toEqual([]);

    const view = fromDemoActivity(DEMO_ACTIVITY);
    expect(view.name).toBe("Actividad de demostración");
    expect(view.humanCode).toBe("DEMO-01");
    const byLabel = Object.fromEntries(view.trace.map((r) => [r.label, r.value]));
    expect(byLabel["semantic key"]).toBe(DEMO_ACTIVITY_KEY);
    expect(byLabel["type"]).toContain("no canónico");
  });
});
