import { describe, expect, it } from "vitest";
import { DOMAINS, getDomain, searchDomains } from "../src/data/domains";
import {
  D01_ACTIVITIES,
  D1_ACTIVITY_KEYS,
} from "../content/domains/d01";
import {
  getCanonicalActivity,
  getDomainPendingReferences,
  getUnresolvedReferences,
  searchCanonicalActivities,
} from "../content/registry";
import { SOURCES } from "../content/sources";
import { DEMO_ACTIVITY_KEY } from "../src/data/demoActivity";
import { fromActivityDefinition } from "../src/activityViewModel";

const EXPECTED_KEYS = [
  "governance.preventive_framework",
  "dpo.need_assessment",
  "mpi.need_assessment",
  "mpi.formalize_adoption",
  "mpi.internal_reporting_and_whistleblowing",
  "mpi.internal_disciplinary_framework",
  "mpi.internal_regulation_integrate",
  "dpo.designate",
  "dpo.initial_governance_validation",
  "dpo.contact_and_agency_notification",
  "dpo.operating_model",
  "dpo.confidentiality_duty",
  "dpo.annual_plan",
  "dpo.annual_report",
  "dpo.infringement_escalation",
  "dpo.governance_revalidation",
  "dpo.terminate_or_replace",
  "mpi.assemble_program",
  "mpi.certification_lifecycle",
  "mpi.lifecycle_review",
];

const EXPECTED_CODES = [
  "D1.01", "D1.02", "D1.03", "D1.04", "D1.05", "D1.06", "D1.07", "D1.08",
  "D1.09", "D1.10", "D1.11", "D1.12", "D1.13", "D1.14", "D1.15", "D1.16",
  "D1.17", "D1.18", "D1.19", "D1.20",
];

const EXPECTED_NAMES = [
  "Establecer marco general de prevención",
  "Evaluar necesidad y recomendación de DPO",
  "Evaluar conveniencia de adoptar MPI",
  "Formalizar adopción del MPI",
  "Implementar reporte interno y canal de denuncias MPI",
  "Establecer régimen disciplinario interno MPI",
  "Integrar regulación interna del MPI",
  "Designar DPO",
  "Validar gobernanza inicial del DPO",
  "Publicar contacto e informar designación del DPO",
  "Establecer modelo operativo del DPO",
  "Formalizar y controlar deber de confidencialidad del DPO",
  "Desarrollar plan anual del DPO",
  "Rendir cuenta anual de resultados del DPO",
  "Escalar infracciones conocidas por el DPO",
  "Revalidar gobernanza del DPO",
  "Gestionar término o reemplazo del DPO",
  "Consolidar e implementar el programa de cumplimiento MPI",
  "Gestionar ciclo de certificación del MPI",
  "Revisar ciclo de vida del MPI",
];

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

describe("contenido canónico D1", () => {
  it("1. D1 contiene exactamente 20 actividades", () => {
    expect(D01_ACTIVITIES).toHaveLength(20);
  });

  it("2. activity keys son únicas", () => {
    expect(new Set(D01_ACTIVITIES.map((a) => a.activity_key)).size).toBe(20);
  });

  it("3. human codes son exactamente D1.01-D1.20", () => {
    expect(D01_ACTIVITIES.map((a) => a.human_code)).toEqual(EXPECTED_CODES);
  });

  it("4. orden correcto de claves", () => {
    expect(D01_ACTIVITIES.map((a) => a.activity_key)).toEqual(EXPECTED_KEYS);
    expect(D1_ACTIVITY_KEYS).toEqual(EXPECTED_KEYS);
    expect(getDomain("d1")?.activity_keys).toEqual(EXPECTED_KEYS);
  });

  it("5. los nombres coinciden con el prompt", () => {
    expect(D01_ACTIVITIES.map((a) => a.name)).toEqual(EXPECTED_NAMES);
  });

  it("6. todas cumplen el contrato ActivityDefinition", () => {
    for (const a of D01_ACTIVITIES) {
      expect(Object.keys(a).sort(), a.activity_key).toEqual(
        [...CANONICAL_FIELDS].sort(),
      );
      expect(["assessment", "implementation", "monitoring"]).toContain(
        a.activity_type,
      );
      expect(["legal_requirement", "agency_standard"]).toContain(a.evidence_basis);
      expect(a.applicable_role.length).toBeGreaterThan(0);
      for (const d of a.activity_dependencies) {
        expect(["same_domain", "cross_domain"]).toContain(d.scope);
        expect([
          "execution_prerequisite",
          "completion_dependency",
          "input_dependency",
        ]).toContain(d.type);
      }
      for (const b of a.legal_basis) {
        expect(Object.keys(b).sort()).toEqual(
          [
            "source_id",
            "source_name",
            "article_or_provision",
            "reference_text",
            "source_url",
            "basis_type",
            "regulatory_status",
            "last_verified_at",
          ].sort(),
        );
      }
    }
  });

  it("7. todas tienen last_legal_review = 2026-09-21", () => {
    for (const a of D01_ACTIVITIES) {
      expect(a.last_legal_review).toBe("2026-09-21");
    }
  });

  it("8. todas tienen regulatory_status = transitional", () => {
    for (const a of D01_ACTIVITIES) {
      expect(a.regulatory_status).toBe("transitional");
    }
  });

  it("9. todas tienen al menos una legal basis", () => {
    for (const a of D01_ACTIVITIES) {
      expect(a.legal_basis.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("10. ninguna actividad DEMO aparece en D1", () => {
    expect(D01_ACTIVITIES.some((a) => a.activity_key === DEMO_ACTIVITY_KEY)).toBe(
      false,
    );
    expect(getCanonicalActivity(DEMO_ACTIVITY_KEY)).toBeUndefined();
    expect(searchCanonicalActivities("demo")).toEqual([]);
  });

  it("11. el registro global canónico contiene exactamente 20 actividades", () => {
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(new Set(D01_ACTIVITIES.map((a) => a.activity_key)).size).toBe(20);
  });

  it("12. D2 tiene 12 actividades; D3-D12 continúan con cero", () => {
    expect(getDomain("d2")?.activity_keys).toHaveLength(12);
    for (const d of DOMAINS) {
      if (d.domain_key === "d1") {
        expect(d.activity_keys).toHaveLength(20);
      } else if (d.domain_key === "d2") {
        expect(d.activity_keys).toHaveLength(12);
      } else {
        expect(d.activity_keys, d.domain_key).toEqual([]);
      }
    }
  });

  it("13. las dependencias intra-D1 resuelven exactamente una actividad", () => {
    const keys = new Set(D01_ACTIVITIES.map((a) => a.activity_key));
    for (const a of D01_ACTIVITIES) {
      for (const d of a.activity_dependencies) {
        if (d.scope !== "same_domain") continue;
        const matches = D01_ACTIVITIES.filter(
          (t) => t.activity_key === d.target_activity_key,
        );
        expect(matches, `${a.activity_key} → ${d.target_activity_key}`).toHaveLength(1);
        expect(keys.has(d.target_activity_key)).toBe(true);
      }
    }
  });

  it("14. referencias D1-originadas pendientes: solo risk.mpi_sync y mpi.diffusion", () => {
    expect(getDomainPendingReferences(D01_ACTIVITIES)).toEqual([
      "mpi.diffusion",
      "risk.mpi_sync",
    ]);
    // treatment.inventory_create ya resuelve (D2 importado).
    expect(
      getCanonicalActivity("treatment.inventory_create")?.human_code,
    ).toBe("D2.01");
  });

  it("15. dependencias D1 resuelven globalmente o son pending autorizadas", () => {
    const authorized = new Set(getUnresolvedReferences());
    const unexpected = new Set<string>();
    for (const a of D01_ACTIVITIES) {
      for (const d of a.activity_dependencies) {
        if (
          !getCanonicalActivity(d.target_activity_key) &&
          !authorized.has(d.target_activity_key)
        ) {
          unexpected.add(`${a.activity_key} → ${d.target_activity_key}`);
        }
      }
    }
    expect([...unexpected]).toEqual([]);
  });

  it("16. conditions_applicability y activity_dependencies permanecen separados", () => {
    for (const a of D01_ACTIVITIES) {
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

  it("17. D1.04 conserva evidence_basis = agency_standard", () => {
    expect(getCanonicalActivity("mpi.formalize_adoption")?.evidence_basis).toBe(
      "agency_standard",
    );
  });

  it("18. D1.05, D1.06, D1.07 y D1.12 conservan evidence_basis = legal_requirement", () => {
    for (const k of [
      "mpi.internal_reporting_and_whistleblowing",
      "mpi.internal_disciplinary_framework",
      "mpi.internal_regulation_integrate",
      "dpo.confidentiality_duty",
    ]) {
      expect(getCanonicalActivity(k)?.evidence_basis, k).toBe("legal_requirement");
    }
  });

  it("19. D1.19 no acopla certification status con lifecycle", () => {
    const a = getCanonicalActivity("mpi.certification_lifecycle");
    expect(a).toBeDefined();
    expect(
      a?.state_effect.some((e) => e.includes("mpi.lifecycle_status = ")),
    ).toBe(false);
    expect(
      a?.state_effect.some((e) => e.includes("mpi.certification_status = ")),
    ).toBe(true);
  });

  it("20. D1.17 preserva vacancia/reemplazo con MPI activo", () => {
    const a = getCanonicalActivity("dpo.terminate_or_replace");
    expect(a).toBeDefined();
    const joined = (a?.state_effect ?? []).join("\n");
    expect(joined).toContain("dpo.vacancy = true");
    expect(joined).toContain("dpo.replacement_required = true");
    expect(joined).toContain("no crear automáticamente replacement_required");
    expect(a?.relationship_effect).toContain("replacement_required cuando MPI activo");
  });

  it("fuentes D1: exactamente las dos suministradas", () => {
    expect(SOURCES.map((s) => s.source_id).sort()).toEqual(
      ["cl_decreto_662_2026", "cl_ley_19628_2026"].sort(),
    );
    for (const a of D01_ACTIVITIES) {
      for (const b of a.legal_basis) {
        expect(["cl_ley_19628_2026", "cl_decreto_662_2026"]).toContain(b.source_id);
        expect(b.source_url).toBe("");
        expect(b.regulatory_status).toBe("transitional");
        expect(b.last_verified_at).toBe("2026-09-21");
      }
    }
    expect(searchDomains("demo")).toEqual([]);
  });
});
