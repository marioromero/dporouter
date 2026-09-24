import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDomain } from "../src/data/domains";
import {
  D04_ACTIVITIES,
  D4_ACTIVITY_KEYS,
  D04_PROVENANCE_NOTES,
} from "../content/domains/d04";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { D02_ACTIVITIES } from "../content/domains/d02";
import { D03_ACTIVITIES } from "../content/domains/d03";
import { SOURCES } from "../content/sources";
import { renderD04 } from "../tools/domain-doc";
import {
  ALL_ACTIVITIES,
  getCanonicalActivity,
  getDomainForActivity,
  getDomainPendingReferences,
  getUnresolvedReferences,
} from "../content/registry";
import { fromActivityDefinition } from "../src/activityViewModel";
import { getProtocolForActivity } from "../content/protocols/registry";

const EXPECTED_KEYS = [
  "rights.exercise_mechanism_design",
  "rights.access_enable",
  "rights.rectification_enable",
  "rights.suppression_enable",
  "rights.opposition_enable",
  "rights.blocking_enable",
  "rights.portability_enable",
  "automated_decision.scope_assess",
  "automated_decision.safeguards_enable",
];

const EXPECTED_CODES = [
  "D4.01", "D4.02", "D4.03", "D4.04", "D4.05", "D4.06", "D4.07", "D4.08", "D4.09",
];

const EXPECTED_NAMES = [
  "Diseñar el mecanismo general para el ejercicio de derechos",
  "Habilitar la atención del derecho de acceso",
  "Habilitar la atención del derecho de rectificación",
  "Habilitar la atención del derecho de supresión",
  "Habilitar la atención del derecho de oposición",
  "Habilitar el bloqueo temporal del tratamiento",
  "Habilitar la atención del derecho a la portabilidad",
  "Evaluar el alcance de decisiones automatizadas",
  "Habilitar salvaguardas para decisiones automatizadas",
];

const EXPECTED_BASIS: Record<string, "agency_standard" | "legal_requirement"> = {
  "rights.exercise_mechanism_design": "legal_requirement",
  "rights.access_enable": "agency_standard",
  "rights.rectification_enable": "agency_standard",
  "rights.suppression_enable": "agency_standard",
  "rights.opposition_enable": "agency_standard",
  "rights.blocking_enable": "agency_standard",
  "rights.portability_enable": "agency_standard",
  "automated_decision.scope_assess": "agency_standard",
  "automated_decision.safeguards_enable": "agency_standard",
};

const EXPECTED_TYPES: Record<string, "assessment" | "implementation" | "monitoring"> = {
  "rights.exercise_mechanism_design": "implementation",
  "rights.access_enable": "implementation",
  "rights.rectification_enable": "implementation",
  "rights.suppression_enable": "implementation",
  "rights.opposition_enable": "implementation",
  "rights.blocking_enable": "implementation",
  "rights.portability_enable": "implementation",
  "automated_decision.scope_assess": "assessment",
  "automated_decision.safeguards_enable": "implementation",
};

const EXPECTED_REASONING: Record<string, boolean> = {
  "rights.exercise_mechanism_design": false,
  "rights.access_enable": false,
  "rights.rectification_enable": false,
  "rights.suppression_enable": false,
  "rights.opposition_enable": false,
  "rights.blocking_enable": false,
  "rights.portability_enable": false,
  "automated_decision.scope_assess": true,
  "automated_decision.safeguards_enable": false,
};

const EXPECTED_PROVISIONS: Record<string, string[]> = {
  "rights.exercise_mechanism_design": ["Artículo 4", "Artículo 10", "Artículo 11"],
  "rights.access_enable": ["Artículo 5", "Artículo 10", "Artículo 11"],
  "rights.rectification_enable": ["Artículo 6", "Artículo 10", "Artículo 11"],
  "rights.suppression_enable": ["Artículo 7", "Artículo 10", "Artículo 11"],
  "rights.opposition_enable": ["Artículo 8", "Artículo 10", "Artículo 11"],
  "rights.blocking_enable": ["Artículo 8 ter", "Artículo 11"],
  "rights.portability_enable": ["Artículo 9", "Artículo 10", "Artículo 11"],
  "automated_decision.scope_assess": ["Artículo 8 bis"],
  "automated_decision.safeguards_enable": ["Artículo 8 bis"],
};

const EXPECTED_EFFECTS: Record<string, string[]> = {
  "rights.exercise_mechanism_design": ["rights.exercise_mechanism_status = designed"],
  "rights.access_enable": ["rights.access_status = enabled"],
  "rights.rectification_enable": ["rights.rectification_status = enabled"],
  "rights.suppression_enable": ["rights.suppression_status = enabled"],
  "rights.opposition_enable": ["rights.opposition_status = enabled"],
  "rights.blocking_enable": ["rights.blocking_status = enabled"],
  "rights.portability_enable": ["rights.portability_status = enabled"],
  "automated_decision.scope_assess": [
    "automated_decision.scope_status = no_covered_use | covered_use_present",
    "automated_decision.legal_path_status = exception_identified | remediation_required",
  ],
  "automated_decision.safeguards_enable": [
    "automated_decision.safeguards_status = enabled | remediation_required",
  ],
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

function provisions(key: string): string[] {
  return getCanonicalActivity(key)?.legal_basis.map((b) => b.article_or_provision) ?? [];
}

describe("contenido canónico D4", () => {
  it("1. D4 importa exactamente 9 actividades", () => {
    expect(D04_ACTIVITIES).toHaveLength(9);
  });

  it("2. 9 keys únicas", () => {
    expect(new Set(D04_ACTIVITIES.map((a) => a.activity_key)).size).toBe(9);
    expect(D04_ACTIVITIES.map((a) => a.activity_key)).toEqual(EXPECTED_KEYS);
    expect(D4_ACTIVITY_KEYS).toEqual(EXPECTED_KEYS);
  });

  it("3. human codes D4.01-D4.09, nombres y tipos finales", () => {
    expect(D04_ACTIVITIES.map((a) => a.human_code)).toEqual(EXPECTED_CODES);
    expect(D04_ACTIVITIES.map((a) => a.name)).toEqual(EXPECTED_NAMES);
    for (const a of D04_ACTIVITIES) {
      expect(a.activity_type, a.activity_key).toBe(EXPECTED_TYPES[a.activity_key]);
      expect(a.evidence_basis, a.activity_key).toBe(EXPECTED_BASIS[a.activity_key]);
      expect(a.reasoning_record_required, a.activity_key).toBe(
        EXPECTED_REASONING[a.activity_key],
      );
    }
  });

  it("4. total canónico = 47", () => {
    expect(ALL_ACTIVITIES).toHaveLength(47);
    expect(new Set(ALL_ACTIVITIES.map((a) => a.activity_key)).size).toBe(47);
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(D02_ACTIVITIES).toHaveLength(12);
    expect(D03_ACTIVITIES).toHaveLength(6);
  });

  it("5. source refs legales válidos y provisiones 4–11", () => {
    const sourceIds = new Set(SOURCES.map((s) => s.source_id));
    const used = SOURCES.find((s) => s.source_id === "cl_ley_19628_2026")?.provisions_used ?? [];
    for (const p of [
      "Artículo 4", "Artículo 5", "Artículo 6", "Artículo 7", "Artículo 8",
      "Artículo 8 bis", "Artículo 8 ter", "Artículo 9", "Artículo 10", "Artículo 11",
    ]) {
      expect(used, p).toContain(p);
    }
    for (const a of D04_ACTIVITIES) {
      expect(a.legal_basis.length, a.activity_key).toBeGreaterThanOrEqual(1);
      for (const b of a.legal_basis) {
        expect(sourceIds.has(b.source_id), a.activity_key).toBe(true);
        expect(b.source_id, a.activity_key).toBe("cl_ley_19628_2026");
        expect(used, `${a.activity_key} ${b.article_or_provision}`).toContain(
          b.article_or_provision,
        );
      }
      expect(provisions(a.activity_key), a.activity_key).toEqual(
        EXPECTED_PROVISIONS[a.activity_key],
      );
      expect(a.regulatory_status, a.activity_key).toBe("transitional");
      expect(a.last_legal_review, a.activity_key).toBe("2026-09-21");
    }
  });

  it("6. contrato ActivityDefinition completo, rol responsible, sin relationship effects", () => {
    for (const a of D04_ACTIVITIES) {
      for (const f of CANONICAL_FIELDS) {
        expect(a, `${a.activity_key}.${f}`).toHaveProperty(f);
      }
      expect(a.applicable_role, a.activity_key).toEqual(["responsible"]);
      expect(a.relationship_effect, a.activity_key).toEqual([]);
      expect(a.state_effect, a.activity_key).toEqual(EXPECTED_EFFECTS[a.activity_key]);
    }
  });

  it("7. dependencias internas resolubles y acíclicas", () => {
    const keys = new Set(D04_ACTIVITIES.map((a) => a.activity_key));
    for (const a of D04_ACTIVITIES) {
      for (const d of a.activity_dependencies) {
        expect(d.scope, a.activity_key).toBe("same_domain");
        expect(d.type, a.activity_key).toBe("completion_dependency");
        expect(keys.has(d.target_activity_key), a.activity_key).toBe(true);
      }
    }
    // Sin ciclos: D4.01 y D4.08 no dependen de nadie; nadie apunta a D4.09.
    expect(getCanonicalActivity("rights.exercise_mechanism_design")?.activity_dependencies).toEqual([]);
    expect(getCanonicalActivity("automated_decision.scope_assess")?.activity_dependencies).toEqual([]);
    for (const a of D04_ACTIVITIES) {
      for (const d of a.activity_dependencies) {
        expect(d.target_activity_key, a.activity_key).not.toBe(
          "automated_decision.safeguards_enable",
        );
      }
    }
  });

  it("8. D4.02–D4.07 → D4.01 por completitud", () => {
    for (const k of [
      "rights.access_enable",
      "rights.rectification_enable",
      "rights.suppression_enable",
      "rights.opposition_enable",
      "rights.blocking_enable",
      "rights.portability_enable",
    ]) {
      expect(getCanonicalActivity(k)?.activity_dependencies, k).toEqual([
        expect.objectContaining({
          target_activity_key: "rights.exercise_mechanism_design",
          scope: "same_domain",
          type: "completion_dependency",
        }),
      ]);
    }
  });

  it("9. D4.09 → D4.08 por completitud", () => {
    expect(getCanonicalActivity("automated_decision.safeguards_enable")?.activity_dependencies).toEqual([
      expect.objectContaining({
        target_activity_key: "automated_decision.scope_assess",
        scope: "same_domain",
        type: "completion_dependency",
      }),
    ]);
  });

  it("10. D4.08 reasoning true; aplicabilidad D4.09 scope_status", () => {
    expect(
      getCanonicalActivity("automated_decision.scope_assess")?.reasoning_record_required,
    ).toBe(true);
    for (const k of EXPECTED_KEYS.filter((x) => x !== "automated_decision.scope_assess")) {
      expect(getCanonicalActivity(k)?.reasoning_record_required, k).toBe(false);
    }
    expect(
      getCanonicalActivity("automated_decision.safeguards_enable")?.conditions_applicability,
    ).toEqual(["automated_decision.scope_status = covered_use_present"]);
    for (const k of EXPECTED_KEYS.filter(
      (x) => x !== "automated_decision.safeguards_enable",
    )) {
      expect(getCanonicalActivity(k)?.conditions_applicability, k).toEqual([]);
    }
  });

  it("11. repeatable-use canon preservado sin cuarto scope/entidad", () => {
    const d408 = getCanonicalActivity("automated_decision.scope_assess");
    const steps = d408?.steps_operational.join("\n") ?? "";
    expect(steps).toContain("cada uso identificado debe evaluarse separadamente");
    expect(d408?.deliverable).toContain("cada uso dentro del treatment");
    const blob = JSON.stringify(D04_ACTIVITIES);
    for (const forbidden of [
      "AutomatedDecisionContext",
      "automateddecisioncontext",
      "RightsRequest",
      "DataSubject",
      "RequestEvent",
      "ClientActivityInstance",
      "dueAt",
      "received",
      "timeline",
    ]) {
      expect(blob, forbidden).not.toContain(forbidden);
    }
    expect(D04_PROVENANCE_NOTES["automated_decision.scope_assess"]).toContain(
      "AUTOMATED_USE_REPEATABLE_CAPTURE_GAP",
    );
  });

  it("12. frontera Stage 1: sin requests/titulares/history/timers", () => {
    const blob = JSON.stringify(D04_ACTIVITIES).toLowerCase();
    for (const forbidden of [
      "rightsrequest",
      "datasubject",
      "requestevent",
      "consentrecord",
      "ticket",
      "workflow individual",
      "dueat",
    ]) {
      expect(blob, forbidden).not.toContain(forbidden);
    }
  });

  it("13. 4 pending refs anteriores intactas; D4 no resuelve ninguna", () => {
    expect(getUnresolvedReferences()).toEqual([
      "financial.titleIII_scope",
      "mpi.diffusion",
      "risk.mpi_sync",
      "sensitive.lawfulness_assess",
    ]);
    expect(getDomainPendingReferences(D04_ACTIVITIES)).toEqual([]);
  });

  it("14. D1/D2/D3 canon unchanged; dominio d4 registrado", () => {
    expect(getDomain("d4")?.activity_keys).toEqual(EXPECTED_KEYS);
    expect(getDomain("d4")?.activity_keys).toHaveLength(9);
    expect(getDomainForActivity("rights.access_enable")).toEqual({
      domainKey: "d4",
      domainCode: "D4",
    });
    expect(getDomainForActivity("automated_decision.scope_assess")).toEqual({
      domainKey: "d4",
      domainCode: "D4",
    });
    for (const key of ["d5","d6","d7","d8","d9","d10","d11","d12"]) {
      expect(getDomain(key)?.activity_keys, key).toEqual([]);
    }
  });

  it("15. protocols D4 = 0", () => {
    for (const k of EXPECTED_KEYS) {
      expect(getProtocolForActivity(k), k).toBeUndefined();
    }
  });

  it("16. applicability y dependencies separados", () => {
    for (const a of D04_ACTIVITIES) {
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

  it("17. D04.md sincronizado y determinístico", () => {
    const root = process.cwd();
    const render = () =>
      renderD04(
        D04_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D04_ACTIVITIES),
        D04_PROVENANCE_NOTES,
      );
    expect(readFileSync(join(root, "docs/domains/D04.md"), "utf-8")).toBe(render());
    expect(render()).toBe(render());
  });

  it("18. no existe segunda copia de D04 dentro de src", () => {
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
      for (const k of EXPECTED_KEYS) {
        expect(content, `${file} no debe duplicar ${k}`).not.toContain(k);
      }
    }
    expect(existsSync(join(root, "src/data/d04.ts"))).toBe(false);
  });
});
