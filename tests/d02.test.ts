import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDomain } from "../src/data/domains";
import {
  D02_ACTIVITIES,
  D2_ACTIVITY_KEYS,
  D02_PROVENANCE_NOTES,
} from "../content/domains/d02";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { SOURCES } from "../content/sources";
import { renderD01, renderD02 } from "../tools/domain-doc";
import {
  ALL_ACTIVITIES,
  getCanonicalActivity,
  getDomainPendingReferences,
  getUnresolvedReferences,
} from "../content/registry";
import { DEMO_ACTIVITY_KEY } from "../src/data/demoActivity";
import { fromActivityDefinition } from "../src/activityViewModel";

const EXPECTED_KEYS = [
  "treatment.inventory_create",
  "treatment.actor_roles",
  "treatment.purpose_define",
  "treatment.source_traceability",
  "lawful_basis.assign",
  "legitimate_interest.assessment",
  "data.minimization_review",
  "retention.schedule",
  "data.quality_control",
  "precontractual_data.cleanup",
  "treatment.change_review",
  "inventory.periodic_revalidation",
];

const EXPECTED_CODES = [
  "D2.01", "D2.02", "D2.03", "D2.04", "D2.05", "D2.06",
  "D2.07", "D2.08", "D2.09", "D2.10", "D2.11", "D2.12",
];

const EXPECTED_NAMES = [
  "Crear inventario maestro de tratamientos",
  "Identificar actores y roles por tratamiento",
  "Definir finalidades del tratamiento",
  "Trazar origen y fuente de los datos",
  "Asignar base de licitud por finalidad",
  "Evaluar interés legítimo",
  "Revisar proporcionalidad y minimización de datos",
  "Definir conservación, supresión y anonimización",
  "Controlar calidad y actualización de datos",
  "Depurar datos obtenidos para medidas precontractuales",
  "Revisar cambios del tratamiento",
  "Revalidar periódicamente el inventario de tratamientos",
];

const EXPECTED_BASIS: Record<string, "agency_standard" | "legal_requirement"> = {
  "treatment.inventory_create": "agency_standard",
  "treatment.actor_roles": "agency_standard",
  "treatment.purpose_define": "legal_requirement",
  "treatment.source_traceability": "legal_requirement",
  "lawful_basis.assign": "legal_requirement",
  "legitimate_interest.assessment": "agency_standard",
  "data.minimization_review": "legal_requirement",
  "retention.schedule": "agency_standard",
  "data.quality_control": "legal_requirement",
  "precontractual_data.cleanup": "legal_requirement",
  "treatment.change_review": "agency_standard",
  "inventory.periodic_revalidation": "agency_standard",
};

const CANONICAL_FIELDS = [
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

describe("contenido canónico D2", () => {
  it("1. D2 contiene exactamente 12 actividades", () => {
    expect(D02_ACTIVITIES).toHaveLength(12);
  });

  it("2. keys únicas", () => {
    expect(new Set(D02_ACTIVITIES.map((a) => a.activity_key)).size).toBe(12);
  });

  it("3. human codes exactamente D2.01-D2.12", () => {
    expect(D02_ACTIVITIES.map((a) => a.human_code)).toEqual(EXPECTED_CODES);
  });

  it("4. orden correcto", () => {
    expect(D02_ACTIVITIES.map((a) => a.activity_key)).toEqual(EXPECTED_KEYS);
    expect(D2_ACTIVITY_KEYS).toEqual(EXPECTED_KEYS);
    expect(getDomain("d2")?.activity_keys).toEqual(EXPECTED_KEYS);
  });

  it("5. nombres exactos", () => {
    expect(D02_ACTIVITIES.map((a) => a.name)).toEqual(EXPECTED_NAMES);
  });

  it("6. todas cumplen ActivityDefinition", () => {
    for (const a of D02_ACTIVITIES) {
      expect(Object.keys(a).sort(), a.activity_key).toEqual(
        [...CANONICAL_FIELDS].sort(),
      );
      expect(["assessment", "implementation", "monitoring"]).toContain(
        a.activity_type,
      );
      for (const d of a.activity_dependencies) {
        expect(["same_domain", "cross_domain"]).toContain(d.scope);
        expect([
          "execution_prerequisite",
          "completion_dependency",
          "input_dependency",
        ]).toContain(d.type);
      }
    }
  });

  it("7. todas tienen revisión 2026-09-21", () => {
    for (const a of D02_ACTIVITIES) {
      expect(a.last_legal_review).toBe("2026-09-21");
    }
  });

  it("8. todas son transitional", () => {
    for (const a of D02_ACTIVITIES) {
      expect(a.regulatory_status).toBe("transitional");
    }
  });

  it("9. todas tienen legal basis", () => {
    for (const a of D02_ACTIVITIES) {
      expect(a.legal_basis.length).toBeGreaterThanOrEqual(1);
      for (const b of a.legal_basis) {
        expect(b.source_id).toBe("cl_ley_19628_2026");
        expect(b.regulatory_status).toBe("transitional");
        expect(b.last_verified_at).toBe("2026-09-21");
        expect(b.source_url).toBe("");
      }
    }
  });

  it("10. evidence basis coincide exactamente", () => {
    for (const a of D02_ACTIVITIES) {
      expect(a.evidence_basis, a.activity_key).toBe(EXPECTED_BASIS[a.activity_key]);
    }
  });

  it("11. D2.01 aplica a responsible y processor", () => {
    expect(getCanonicalActivity("treatment.inventory_create")?.applicable_role).toEqual(
      ["responsible", "processor"],
    );
  });

  it("12. D2.02 aplica a responsible y processor", () => {
    expect(getCanonicalActivity("treatment.actor_roles")?.applicable_role).toEqual(
      ["responsible", "processor"],
    );
  });

  it("13. D2.12 aplica a responsible y processor", () => {
    expect(
      getCanonicalActivity("inventory.periodic_revalidation")?.applicable_role,
    ).toEqual(["responsible", "processor"]);
  });

  it("14. D2.03-D2.11 restantes conservan roles del prompt", () => {
    for (const k of [
      "treatment.purpose_define",
      "treatment.source_traceability",
      "lawful_basis.assign",
      "legitimate_interest.assessment",
      "data.minimization_review",
      "retention.schedule",
      "data.quality_control",
      "precontractual_data.cleanup",
      "treatment.change_review",
    ]) {
      expect(getCanonicalActivity(k)?.applicable_role, k).toEqual(["responsible"]);
    }
  });

  it("15. D2.05 conserva licitud por finalidad", () => {
    const a = getCanonicalActivity("lawful_basis.assign");
    expect(a?.state_effect).toContain("purpose.lawful_basis = assigned");
    expect(a?.state_effect.join("\n")).toContain(
      "treatment.lawfulness_status = determined when every active purpose has valid basis",
    );
    // Sin base global: ningún efecto asigna treatment.lawful_basis directamente.
    expect(
      (a?.state_effect ?? []).some((e) => e.startsWith("treatment.lawful_basis")),
    ).toBe(false);
  });

  it("16. D2.06 requiere reasoning_record", () => {
    expect(
      getCanonicalActivity("legitimate_interest.assessment")?.reasoning_record_required,
    ).toBe(true);
  });

  it("17. D2.10 requiere reasoning_record", () => {
    expect(
      getCanonicalActivity("precontractual_data.cleanup")?.reasoning_record_required,
    ).toBe(true);
  });

  it("18. D2.11 requiere reasoning_record", () => {
    expect(
      getCanonicalActivity("treatment.change_review")?.reasoning_record_required,
    ).toBe(true);
  });

  it("19. applicability y dependencies están separados", () => {
    for (const a of D02_ACTIVITIES) {
      const view = fromActivityDefinition(a);
      const byLabel = Object.fromEntries(view.trace.map((r) => [r.label, r.value]));
      for (const c of a.conditions_applicability) {
        expect(byLabel["dependencies"]).not.toContain(c);
      }
      for (const d of a.activity_dependencies) {
        expect(byLabel["applicability conditions"]).not.toContain(
          d.target_activity_key,
        );
      }
    }
  });

  it("20. todas las dependencias intra-D2 resuelven", () => {
    const keys = new Set(D02_ACTIVITIES.map((a) => a.activity_key));
    for (const a of D02_ACTIVITIES) {
      for (const d of a.activity_dependencies) {
        if (d.scope !== "same_domain") continue;
        expect(keys.has(d.target_activity_key)).toBe(true);
      }
    }
  });

  it("21. D1.18 → treatment.inventory_create ahora resuelve", () => {
    const a = getCanonicalActivity("mpi.assemble_program");
    expect(
      a?.activity_dependencies.some(
        (d) => d.target_activity_key === "treatment.inventory_create",
      ),
    ).toBe(true);
    expect(getCanonicalActivity("treatment.inventory_create")?.human_code).toBe(
      "D2.01",
    );
  });

  it("22. treatment.inventory_create ya NO está en pending imports", () => {
    expect(getUnresolvedReferences()).not.toContain("treatment.inventory_create");
    expect(getDomainPendingReferences(D01_ACTIVITIES)).not.toContain(
      "treatment.inventory_create",
    );
  });

  it("23. solo existen las cuatro pending refs autorizadas (consent resuelta por D3)", () => {
    expect(getUnresolvedReferences()).toEqual([
      "financial.titleIII_scope",
      "mpi.diffusion",
      "risk.mpi_sync",
      "sensitive.lawfulness_assess",
    ]);
  });

  it("24. DEMO no forma parte del contenido canónico", () => {
    expect(
      ALL_ACTIVITIES.some((a) => a.activity_key === DEMO_ACTIVITY_KEY),
    ).toBe(false);
    expect(getCanonicalActivity(DEMO_ACTIVITY_KEY)).toBeUndefined();
  });

  it("25. D1 sigue con 20 actividades y semánticamente intacto", () => {
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(getDomain("d1")?.activity_keys).toHaveLength(20);
    expect(
      getCanonicalActivity("mpi.assemble_program")?.activity_dependencies,
    ).toHaveLength(8);
  });

  it("26. registro global contiene exactamente 47 actividades", () => {
    expect(ALL_ACTIVITIES).toHaveLength(47);
    expect(new Set(ALL_ACTIVITIES.map((a) => a.activity_key)).size).toBe(47);
  });

  it("27. D3 tiene 6 actividades; D4 tiene 9; D5-D12 contienen cero", () => {
    expect(getDomain("d3")?.activity_keys).toHaveLength(6);
    expect(getDomain("d4")?.activity_keys).toHaveLength(9);
    for (const key of ["d5","d6","d7","d8","d9","d10","d11","d12"]) {
      expect(getDomain(key)?.activity_keys, key).toEqual([]);
    }
  });

  it("28. D01.md y D02.md sincronizados con sus fuentes", () => {
    const root = process.cwd();
    expect(readFileSync(join(root, "docs/domains/D01.md"), "utf-8")).toBe(
      renderD01(D01_ACTIVITIES, SOURCES, getDomainPendingReferences(D01_ACTIVITIES)),
    );
    expect(readFileSync(join(root, "docs/domains/D02.md"), "utf-8")).toBe(
      renderD02(
        D02_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D02_ACTIVITIES),
        D02_PROVENANCE_NOTES,
      ),
    );
  });

  it("29. generación documental determinística", () => {
    const render = () =>
      renderD02(
        D02_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D02_ACTIVITIES),
        D02_PROVENANCE_NOTES,
      );
    expect(render()).toBe(render());
  });

  it("30. no existe segunda copia de D02 dentro de src", () => {
    const root = process.cwd();
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const e of readdirSync(dir)) {
        const full = join(dir, e);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else if (/\.(ts|tsx)$/.test(e)) out.push(full);
      }
      return out;
    };
    for (const file of walk(join(root, "src"))) {
      const content = readFileSync(file, "utf-8");
      for (const k of D02_ACTIVITIES.map((a) => a.activity_key)) {
        expect(content, `${file} no debe duplicar ${k}`).not.toContain(k);
      }
    }
    expect(existsSync(join(root, "src/data/d02.ts"))).toBe(false);
  });
});
