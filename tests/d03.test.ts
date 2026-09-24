import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDomain } from "../src/data/domains";
import {
  D03_ACTIVITIES,
  D3_ACTIVITY_KEYS,
  D03_PROVENANCE_NOTES,
} from "../content/domains/d03";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { D02_ACTIVITIES } from "../content/domains/d02";
import { SOURCES } from "../content/sources";
import { renderD03 } from "../tools/domain-doc";
import {
  ALL_ACTIVITIES,
  getCanonicalActivity,
  getDomainForActivity,
  getDomainPendingReferences,
  getUnresolvedReferences,
} from "../content/registry";
import { DEMO_ACTIVITY_KEY } from "../src/data/demoActivity";
import { fromActivityDefinition } from "../src/activityViewModel";
import { getProtocolForActivity } from "../content/protocols/registry";

const EXPECTED_KEYS = [
  "transparency.policy_assemble",
  "transparency.publication_validate",
  "consent.mechanism_design",
  "consent.freedom_assess",
  "consent.proof_design",
  "consent.withdrawal_enable",
];

const EXPECTED_CODES = [
  "D3.01", "D3.02", "D3.03", "D3.04", "D3.05", "D3.06",
];

const EXPECTED_NAMES = [
  "Estructurar y verificar la política pública de tratamiento",
  "Validar disponibilidad y condiciones de publicación",
  "Diseñar el mecanismo de consentimiento",
  "Evaluar libertad del consentimiento",
  "Verificar capacidad de prueba del consentimiento",
  "Diseñar y habilitar el retiro del consentimiento",
];

const EXPECTED_BASIS: Record<string, "agency_standard" | "legal_requirement"> = {
  "transparency.policy_assemble": "legal_requirement",
  "transparency.publication_validate": "agency_standard",
  "consent.mechanism_design": "agency_standard",
  "consent.freedom_assess": "agency_standard",
  "consent.proof_design": "agency_standard",
  "consent.withdrawal_enable": "agency_standard",
};

const EXPECTED_TRIGGERS: Record<string, string> = {
  "transparency.policy_assemble":
    "¿La empresa cuenta con una política o información pública de tratamiento vigente, completa y actualizada conforme a los requisitos aplicables de transparencia?",
  "transparency.publication_validate":
    "¿La política o información de transparencia vigente se encuentra efectivamente publicada y disponible al público bajo las condiciones legales aplicables?",
  "consent.mechanism_design":
    "¿La finalidad activa utiliza consentimiento como base de licitud y requiere diseñar o verificar su mecanismo de obtención?",
  "consent.freedom_assess":
    "¿El consentimiento previsto para esta finalidad puede considerarse libre en el contexto concreto en que será solicitado?",
  "consent.proof_design":
    "¿El mecanismo tiene capacidad real de producir y conservar evidencia suficiente cuando ocurra un consentimiento?",
  "consent.withdrawal_enable":
    "¿La finalidad dispone de un mecanismo que permita retirar el consentimiento bajo las condiciones legales aplicables?",
};

const EXPECTED_TYPES: Record<string, "assessment" | "implementation" | "monitoring"> = {
  "transparency.policy_assemble": "implementation",
  "transparency.publication_validate": "assessment",
  "consent.mechanism_design": "implementation",
  "consent.freedom_assess": "assessment",
  "consent.proof_design": "assessment",
  "consent.withdrawal_enable": "implementation",
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

describe("contenido canónico D3", () => {
  it("1. D3 contiene exactamente 6 actividades", () => {
    expect(D03_ACTIVITIES).toHaveLength(6);
  });

  it("2. keys únicas", () => {
    expect(new Set(D03_ACTIVITIES.map((a) => a.activity_key)).size).toBe(6);
  });

  it("3. human codes exactamente D3.01-D3.06", () => {
    expect(D03_ACTIVITIES.map((a) => a.human_code)).toEqual(EXPECTED_CODES);
  });

  it("4. orden correcto", () => {
    expect(D03_ACTIVITIES.map((a) => a.activity_key)).toEqual(EXPECTED_KEYS);
    expect(D3_ACTIVITY_KEYS).toEqual(EXPECTED_KEYS);
    expect(getDomain("d3")?.activity_keys).toEqual(EXPECTED_KEYS);
  });

  it("5. nombres exactos", () => {
    expect(D03_ACTIVITIES.map((a) => a.name)).toEqual(EXPECTED_NAMES);
  });

  it("6. todas cumplen ActivityDefinition", () => {
    for (const a of D03_ACTIVITIES) {
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
    for (const a of D03_ACTIVITIES) {
      expect(a.last_legal_review).toBe("2026-09-21");
    }
  });

  it("8. todas son transitional", () => {
    for (const a of D03_ACTIVITIES) {
      expect(a.regulatory_status).toBe("transitional");
    }
  });

  it("9. todas tienen legal basis en cl_ley_19628_2026", () => {
    for (const a of D03_ACTIVITIES) {
      expect(a.legal_basis.length).toBeGreaterThanOrEqual(1);
      for (const b of a.legal_basis) {
        expect(b.source_id).toBe("cl_ley_19628_2026");
        expect(b.regulatory_status).toBe("transitional");
        expect(b.last_verified_at).toBe("2026-09-21");
        expect(b.source_url).toBe("");
      }
    }
  });

  it("10. artículos exactos por actividad", () => {
    const provisions = (k: string) =>
      getCanonicalActivity(k)?.legal_basis.map((b) => b.article_or_provision) ?? [];
    expect(provisions("transparency.policy_assemble")).toEqual([
      "Artículo 14 ter",
      "Artículo 3 letra g)",
    ]);
    expect(provisions("transparency.publication_validate")).toEqual([
      "Artículo 3 letra g)",
      "Artículo 14 ter",
    ]);
    expect(provisions("consent.mechanism_design")).toEqual([
      "Artículo 2 letra p)",
      "Artículo 12",
    ]);
    expect(provisions("consent.freedom_assess")).toEqual(["Artículo 12"]);
    expect(provisions("consent.proof_design")).toEqual([
      "Artículo 12",
      "Artículo 3 letra a)",
    ]);
    expect(provisions("consent.withdrawal_enable")).toEqual(["Artículo 12"]);
  });

  it("11. evidence basis y activity type exactos", () => {
    for (const a of D03_ACTIVITIES) {
      expect(a.evidence_basis, a.activity_key).toBe(EXPECTED_BASIS[a.activity_key]);
      expect(a.activity_type, a.activity_key).toBe(EXPECTED_TYPES[a.activity_key]);
    }
  });

  it("12. todas aplican a responsible y solo a responsible", () => {
    for (const a of D03_ACTIVITIES) {
      expect(getCanonicalActivity(a.activity_key)?.applicable_role).toEqual([
        "responsible",
      ]);
    }
  });

  it("13. solo D3.04 requiere reasoning_record", () => {
    for (const a of D03_ACTIVITIES) {
      expect(
        getCanonicalActivity(a.activity_key)?.reasoning_record_required,
        a.activity_key,
      ).toBe(a.activity_key === "consent.freedom_assess");
    }
  });

  it("14. rama consentimiento es purpose-scoped en aplicabilidad", () => {
    for (const k of [
      "consent.mechanism_design",
      "consent.freedom_assess",
      "consent.proof_design",
      "consent.withdrawal_enable",
    ]) {
      expect(getCanonicalActivity(k)?.conditions_applicability, k).toContain(
        "purpose.lawful_basis = consent",
      );
    }
    // Nunca consentimiento global por treatment.
    for (const a of D03_ACTIVITIES) {
      for (const c of a.conditions_applicability) {
        expect(c).not.toContain("treatment-wide");
      }
      for (const e of a.state_effect) {
        expect(e).not.toContain("treatment.consent");
      }
    }
  });

  it("15. state effects estructurados por actividad", () => {
    expect(getCanonicalActivity("transparency.policy_assemble")?.state_effect).toEqual(
      ["transparency.policy_status = assembled"],
    );
    expect(
      getCanonicalActivity("transparency.publication_validate")?.state_effect,
    ).toEqual(["transparency.publication_status = validated"]);
    expect(getCanonicalActivity("consent.mechanism_design")?.state_effect).toEqual([
      "consent.mechanism_status = designed",
    ]);
    expect(getCanonicalActivity("consent.freedom_assess")?.state_effect).toEqual([
      "consent.freedom_status = supported | not_supported",
    ]);
    expect(getCanonicalActivity("consent.proof_design")?.state_effect).toEqual([
      "consent.proof_capability_status = designed | remediation_required",
    ]);
    expect(getCanonicalActivity("consent.withdrawal_enable")?.state_effect).toEqual([
      "consent.withdrawal_status = enabled | remediation_required",
    ]);
  });

  it("16. Stage 1: sin consent records, eventos, timestamps ni historial", () => {
    const blob = JSON.stringify(D03_ACTIVITIES).toLowerCase();
    for (const forbidden of [
      "consentrecord",
      "datasubjectconsent",
      "withdrawalevent",
      "consent instance",
    ]) {
      expect(blob).not.toContain(forbidden);
    }
    for (const a of D03_ACTIVITIES) {
      for (const e of [...a.state_effect, ...a.relationship_effect]) {
        expect(e.toLowerCase()).not.toContain("history");
        expect(e.toLowerCase()).not.toContain("append");
      }
      expect(a.relationship_effect).toEqual([]);
    }
  });

  it("17. applicability y dependencies están separados", () => {
    for (const a of D03_ACTIVITIES) {
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

  it("18. todas las dependencias intra-D3 resuelven sin ciclo", () => {
    const keys = new Set(D03_ACTIVITIES.map((a) => a.activity_key));
    for (const a of D03_ACTIVITIES) {
      for (const d of a.activity_dependencies) {
        expect(d.scope).toBe("same_domain");
        expect(keys.has(d.target_activity_key)).toBe(true);
      }
    }
    // D3.04–D3.06 no dependen de D3.03: pueden revisar el mecanismo
    // propuesto sin exigirlo completado (sin ciclo de inicio).
    for (const k of [
      "consent.freedom_assess",
      "consent.proof_design",
      "consent.withdrawal_enable",
    ]) {
      expect(getCanonicalActivity(k)?.activity_dependencies).toEqual([]);
    }
    // D3.03 completitud integral vía completion_dependency (puede iniciar,
    // completar depende de los tres), sin prerrequisito D2.05 (sin ciclo D2↔D3).
    const d303 = getCanonicalActivity("consent.mechanism_design");
    expect(d303?.activity_dependencies.map((d) => d.target_activity_key).sort()).toEqual(
      ["consent.freedom_assess", "consent.proof_design", "consent.withdrawal_enable"],
    );
    for (const d of d303?.activity_dependencies ?? []) {
      expect(d.type).toBe("completion_dependency");
    }
    expect(
      (d303?.activity_dependencies ?? []).some(
        (d) => d.target_activity_key === "lawful_basis.assign",
      ),
    ).toBe(false);
  });

  it("19. D3.02 depende por completitud de D3.01", () => {
    const a = getCanonicalActivity("transparency.publication_validate");
    expect(a?.activity_dependencies).toHaveLength(1);
    expect(a?.activity_dependencies[0]).toMatchObject({
      target_activity_key: "transparency.policy_assemble",
      scope: "same_domain",
      type: "completion_dependency",
    });
  });

  it("20. D2.05 → consent.mechanism_design ahora resuelve (D3.03)", () => {
    const target = getCanonicalActivity("consent.mechanism_design");
    expect(target?.human_code).toBe("D3.03");
    expect(getDomainForActivity("consent.mechanism_design")).toEqual({
      domainKey: "d3",
      domainCode: "D3",
    });
    expect(getUnresolvedReferences()).not.toContain("consent.mechanism_design");
    expect(getDomainPendingReferences(D02_ACTIVITIES)).not.toContain(
      "consent.mechanism_design",
    );
    // Condición y tipo D2.05 intactos.
    const d205 = getCanonicalActivity("lawful_basis.assign");
    expect(
      d205?.activity_dependencies.find(
        (d) => d.target_activity_key === "consent.mechanism_design",
      ),
    ).toMatchObject({
      scope: "cross_domain",
      type: "completion_dependency",
      condition: "lawful basis = consent",
    });
  });

  it("21. restantes pending refs siguen pendientes (D5/D8)", () => {
    expect(getUnresolvedReferences()).toEqual([
      "financial.titleIII_scope",
      "mpi.diffusion",
      "risk.mpi_sync",
      "sensitive.lawfulness_assess",
    ]);
  });

  it("22. DEMO no forma parte del contenido canónico", () => {
    expect(
      ALL_ACTIVITIES.some((a) => a.activity_key === DEMO_ACTIVITY_KEY),
    ).toBe(false);
    expect(getCanonicalActivity(DEMO_ACTIVITY_KEY)).toBeUndefined();
  });

  it("23. D1/D2/D3 intactos; registro global en 47 (D4 importado)", () => {
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(D02_ACTIVITIES).toHaveLength(12);
    expect(ALL_ACTIVITIES).toHaveLength(47);
    expect(new Set(ALL_ACTIVITIES.map((a) => a.activity_key)).size).toBe(47);
  });

  it("24. D4 tiene 9 actividades; D5-D12 contienen cero actividades", () => {
    expect(getDomain("d4")?.activity_keys).toHaveLength(9);
    for (const key of ["d5","d6","d7","d8","d9","d10","d11","d12"]) {
      expect(getDomain(key)?.activity_keys, key).toEqual([]);
    }
  });

  it("25. D03.md sincronizado con su fuente", () => {
    const root = process.cwd();
    expect(readFileSync(join(root, "docs/domains/D03.md"), "utf-8")).toBe(
      renderD03(
        D03_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D03_ACTIVITIES),
        D03_PROVENANCE_NOTES,
      ),
    );
  });

  it("26. generación documental determinística", () => {
    const render = () =>
      renderD03(
        D03_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D03_ACTIVITIES),
        D03_PROVENANCE_NOTES,
      );
    expect(render()).toBe(render());
  });

  it("27. no existe segunda copia de D03 dentro de src", () => {
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
      for (const k of D03_ACTIVITIES.map((a) => a.activity_key)) {
        expect(content, `${file} no debe duplicar ${k}`).not.toContain(k);
      }
    }
    expect(existsSync(join(root, "src/data/d03.ts"))).toBe(false);
  });

  it("28. D3.01–D3.06 con guía (modos y scopes canónicos)", () => {
    expect(getProtocolForActivity("transparency.policy_assemble")).toBeTruthy();
    expect(getProtocolForActivity("transparency.publication_validate")).toBeTruthy();
    expect(getProtocolForActivity("consent.mechanism_design")?.mode).toBe("procedure");
    expect(getProtocolForActivity("consent.freedom_assess")?.mode).toBe("decision");
    expect(getProtocolForActivity("consent.proof_design")?.mode).toBe("checklist");
    expect(getProtocolForActivity("consent.withdrawal_enable")?.mode).toBe("procedure");
    for (const k of [
      "consent.mechanism_design",
      "consent.freedom_assess",
      "consent.proof_design",
      "consent.withdrawal_enable",
    ]) {
      expect(getProtocolForActivity(k)?.execution_scope ?? "company", k).toBe("purpose");
    }
  });

  it("29. triggers canónicos verbatim (fidelity patch)", () => {
    for (const a of D03_ACTIVITIES) {
      expect(a.trigger_question, a.activity_key).toBe(
        EXPECTED_TRIGGERS[a.activity_key],
      );
    }
  });

  it("30. aplicabilidad final: D3.01/D3.02 vacías, rama consentimiento purpose-scoped", () => {
    expect(
      getCanonicalActivity("transparency.policy_assemble")?.conditions_applicability,
    ).toEqual([]);
    expect(
      getCanonicalActivity("transparency.publication_validate")?.conditions_applicability,
    ).toEqual([]);
    for (const k of [
      "consent.mechanism_design",
      "consent.freedom_assess",
      "consent.proof_design",
      "consent.withdrawal_enable",
    ]) {
      expect(getCanonicalActivity(k)?.conditions_applicability, k).toEqual([
        "purpose.lawful_basis = consent",
      ]);
    }
  });
});
