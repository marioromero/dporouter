import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDomain } from "../src/data/domains";
import {
  D05_ACTIVITIES,
  D5_ACTIVITY_KEYS,
  D05_PROVENANCE_NOTES,
} from "../content/domains/d05";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { D02_ACTIVITIES } from "../content/domains/d02";
import { D03_ACTIVITIES } from "../content/domains/d03";
import { D04_ACTIVITIES } from "../content/domains/d04";
import { SOURCES } from "../content/sources";
import { renderD05 } from "../tools/domain-doc";
import {
  ALL_ACTIVITIES,
  getCanonicalActivity,
  getDomainForActivity,
  getDomainPendingReferences,
  getUnresolvedReferences,
} from "../content/registry";
import { getProtocolForActivity } from "../content/protocols/registry";

const EXPECTED_KEYS = [
  "sensitive.lawfulness_assess",
  "sensitive.health_biological_assess",
  "sensitive.biometric_assess",
  "minors.processing_assess",
  "research.public_interest_assess",
  "geolocation.requirements_assess",
  "financial.titleIII_scope",
];

const EXPECTED_CODES = [
  "D5.01", "D5.02", "D5.03", "D5.04", "D5.05", "D5.06", "D5.07",
];

const EXPECTED_NAMES = [
  "Evaluar la licitud del tratamiento de datos personales sensibles",
  "Evaluar el tratamiento de datos de salud y perfil biológico",
  "Evaluar el tratamiento de datos biométricos",
  "Evaluar el tratamiento de datos de niños, niñas y adolescentes",
  "Evaluar tratamientos históricos, estadísticos, científicos y de investigación de interés público",
  "Evaluar requisitos del tratamiento de datos de geolocalización",
  "Evaluar el ámbito y requisitos del Título III",
];

const EXPECTED_REASONING: Record<string, boolean> = {
  "sensitive.lawfulness_assess": true,
  "sensitive.health_biological_assess": true,
  "sensitive.biometric_assess": true,
  "minors.processing_assess": true,
  "research.public_interest_assess": true,
  "geolocation.requirements_assess": false,
  "financial.titleIII_scope": true,
};

const EXPECTED_PROVISIONS: Record<string, string[]> = {
  "sensitive.lawfulness_assess": ["Artículo 2 letra g)", "Artículo 16"],
  "sensitive.health_biological_assess": ["Artículo 16", "Artículo 16 bis"],
  "sensitive.biometric_assess": ["Artículo 16", "Artículo 16 bis", "Artículo 16 ter"],
  "minors.processing_assess": ["Artículo 16 quáter"],
  "research.public_interest_assess": ["Artículo 16 quinquies"],
  "geolocation.requirements_assess": ["Artículo 12", "Artículo 13", "Artículo 16 sexies"],
  "financial.titleIII_scope": ["Artículo 13 letra a)", "Artículo 17", "Artículo 18", "Artículo 19"],
};

const EXPECTED_EFFECTS: Record<string, string[]> = {
  "sensitive.lawfulness_assess": ["sensitive.lawfulness_status = supported | not_supported"],
  "sensitive.health_biological_assess": [
    "sensitive.health_biological_status = supported | not_supported",
  ],
  "sensitive.biometric_assess": ["sensitive.biometric_status = supported | not_supported"],
  "minors.processing_assess": ["minors.processing_status = supported | not_supported"],
  "research.public_interest_assess": [
    "research.public_interest_status = supported | not_supported",
  ],
  "geolocation.requirements_assess": [
    "geolocation.requirements_status = satisfied | remediation_required",
  ],
  "financial.titleIII_scope": [
    "financial.titleIII_scope_status = in_scope | out_of_scope",
    "financial.titleIII_requirements_status = satisfied | remediation_required",
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

describe("contenido canónico D5", () => {
  it("1. D5 importa exactamente 7 actividades", () => {
    expect(D05_ACTIVITIES).toHaveLength(7);
  });

  it("2. 7 keys exactas en orden canónico", () => {
    expect(D05_ACTIVITIES.map((a) => a.activity_key)).toEqual(EXPECTED_KEYS);
    expect(D5_ACTIVITY_KEYS).toEqual(EXPECTED_KEYS);
    expect(new Set(D05_ACTIVITIES.map((a) => a.activity_key)).size).toBe(7);
  });

  it("3. human codes, nombres y tipos assessment", () => {
    expect(D05_ACTIVITIES.map((a) => a.human_code)).toEqual(EXPECTED_CODES);
    expect(D05_ACTIVITIES.map((a) => a.name)).toEqual(EXPECTED_NAMES);
    for (const a of D05_ACTIVITIES) {
      expect(a.activity_type, a.activity_key).toBe("assessment");
      expect(a.evidence_basis, a.activity_key).toBe("agency_standard");
      expect(a.reasoning_record_required, a.activity_key).toBe(
        EXPECTED_REASONING[a.activity_key],
      );
      expect(a.applicable_role, a.activity_key).toEqual(["responsible"]);
      expect(a.relationship_effect, a.activity_key).toEqual([]);
      expect(a.conditions_applicability, a.activity_key).toEqual([]);
      expect(a.activity_dependencies, a.activity_key).toEqual([]);
    }
  });

  it("4. contrato ActivityDefinition completo y state effects", () => {
    for (const a of D05_ACTIVITIES) {
      for (const f of CANONICAL_FIELDS) {
        expect(a, `${a.activity_key}.${f}`).toHaveProperty(f);
      }
      expect(a.state_effect, a.activity_key).toEqual(EXPECTED_EFFECTS[a.activity_key]);
      expect(a.regulatory_status, a.activity_key).toBe("transitional");
      expect(a.last_legal_review, a.activity_key).toBe("2026-09-21");
    }
  });

  it("5. source refs legales válidos y provisiones 16–19", () => {
    const sourceIds = new Set(SOURCES.map((s) => s.source_id));
    const used = SOURCES.find((s) => s.source_id === "cl_ley_19628_2026")?.provisions_used ?? [];
    for (const p of [
      "Artículo 2 letra g)", "Artículo 13 letra a)", "Artículo 16", "Artículo 16 bis",
      "Artículo 16 ter", "Artículo 16 quáter", "Artículo 16 quinquies",
      "Artículo 16 sexies", "Artículo 17", "Artículo 18", "Artículo 19",
    ]) {
      expect(used, p).toContain(p);
    }
    for (const a of D05_ACTIVITIES) {
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
    }
  });

  it("6. total canónico = 61; D1–D4 intactos", () => {
    expect(ALL_ACTIVITIES).toHaveLength(61);
    expect(new Set(ALL_ACTIVITIES.map((a) => a.activity_key)).size).toBe(61);
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(D02_ACTIVITIES).toHaveLength(12);
    expect(D03_ACTIVITIES).toHaveLength(6);
    expect(D04_ACTIVITIES).toHaveLength(9);
  });

  it("7. D5.01 resuelve la pending D2.05 sin modificar D2", () => {
    expect(getCanonicalActivity("sensitive.lawfulness_assess")?.human_code).toBe("D5.01");
    expect(getUnresolvedReferences()).not.toContain("sensitive.lawfulness_assess");
    expect(getDomainPendingReferences(D02_ACTIVITIES)).not.toContain(
      "sensitive.lawfulness_assess",
    );
    const d205 = getCanonicalActivity("lawful_basis.assign");
    expect(
      d205?.activity_dependencies.find(
        (d) => d.target_activity_key === "sensitive.lawfulness_assess",
      ),
    ).toMatchObject({
      scope: "cross_domain",
      type: "completion_dependency",
      condition: "processing includes data requiring special-category legality assessment",
    });
  });

  it("8. D5.07 resuelve la pending D2.05 sin dependencia inversa", () => {
    expect(getCanonicalActivity("financial.titleIII_scope")?.human_code).toBe("D5.07");
    expect(getUnresolvedReferences()).not.toContain("financial.titleIII_scope");
    expect(getDomainPendingReferences(D02_ACTIVITIES)).not.toContain(
      "financial.titleIII_scope",
    );
    const d205 = getCanonicalActivity("lawful_basis.assign");
    expect(
      d205?.activity_dependencies.find(
        (d) => d.target_activity_key === "financial.titleIII_scope",
      ),
    ).toMatchObject({
      scope: "cross_domain",
      type: "completion_dependency",
      condition: "candidate lawful basis relies on Article 13(a) / Title III",
    });
    expect(getCanonicalActivity("financial.titleIII_scope")?.activity_dependencies).toEqual([]);
  });

  it("9. unresolved 4 → 2; sin nuevas pending references", () => {
    expect(getUnresolvedReferences()).toEqual(["mpi.diffusion", "risk.mpi_sync"]);
    expect(getDomainPendingReferences(D05_ACTIVITIES)).toEqual([]);
  });

  it("10. D5.02 preserva regla de consentimiento + finalidad de ley sanitaria", () => {
    const steps = getCanonicalActivity("sensitive.health_biological_assess")?.steps_operational.join("\n") ?? "";
    expect(steps).toContain("sólo pueden tratarse para los fines previstos por leyes especiales en materia sanitaria");
    expect(steps).toContain("No inventar catálogo de leyes sanitarias");
    expect(steps).toContain("verificar la anonimización previa");
  });

  it("11. D5.02 preserva prohibición especial sin suavizar", () => {
    const steps = getCanonicalActivity("sensitive.health_biological_assess")?.steps_operational.join("\n") ?? "";
    expect(steps).toContain("No suavizar esta regla");
    expect(steps).toContain("una ley autorice expresamente el tratamiento en casos calificados");
  });

  it("12. D5.04 preserva categorías legales sin taxonomía técnica", () => {
    const steps = getCanonicalActivity("minors.processing_assess")?.steps_operational.join("\n") ?? "";
    expect(steps).toContain("preservando las categorías y umbrales conforme al texto legal sin reformularlos en una taxonomía técnica");
    expect(steps).toContain("menores de dieciséis años");
    expect(steps).toContain("sin almacenar edades o identidades reales");
  });

  it("13. D5.05 preserva exclusividad + interés público + mitigación + anonimización", () => {
    const steps = getCanonicalActivity("research.public_interest_assess")?.steps_operational.join("\n") ?? "";
    expect(steps).toContain("exclusivamente con alguno de dichos fines");
    expect(steps).toContain("atienda fines de interés público");
    expect(steps).toContain("verificar las medidas de reducción o mitigación");
    expect(steps).toContain("verificar la anonimización previa de los datos publicados");
    expect(steps).toContain("Evitar que una finalidad mixta sea presentada");
  });

  it("14. D5.06 no redefine licitud D2; reasoning false", () => {
    const a = getCanonicalActivity("geolocation.requirements_assess");
    expect(a?.reasoning_record_required).toBe(false);
    const steps = a?.steps_operational.join("\n") ?? "";
    expect(steps).toContain("No duplicar ni modificar el fact de licitud de D2");
    expect(a?.activity_dependencies).toEqual([]);
  });

  it("15. D5.07 preserva ámbito material Título III y reglas 17–19", () => {
    const steps = getCanonicalActivity("financial.titleIII_scope")?.steps_operational.join("\n") ?? "";
    expect(steps).toContain("No convertir esta lista en taxonomía persistente");
    expect(steps).toContain("sin requerir solicitud del titular, orden judicial o instrucción de la autoridad");
    expect(steps).toContain("después de transcurridos cinco años desde que la obligación se hizo exigible");
    expect(steps).toContain("después de haber sido pagada o extinguida por otro modo legal");
    expect(steps).toContain("tribunales en juicios pendientes");
    expect(steps).toContain("bloqueo temporal de los datos cuando la actualización no pueda realizarse oportunamente");
    expect(steps).toContain("No asumir que un dato financiero o económico conduce automáticamente");
  });

  it("16. frontera Stage 1: sin datos especiales reales ni registros por titular", () => {
    const blob = JSON.stringify(D05_ACTIVITIES);
    for (const forbidden of [
      "DataSubject",
      "SensitiveDataRecord",
      "MinorRecord",
      "BiometricRecord",
      "HealthRecord",
      "FinancialObligationRecord",
      "isSensitive",
      "isBiometric",
      "isMinor",
      "isHealth",
      "isFinancial",
      "specialCategories",
      "ClientActivityInstance",
      "dueAt",
      "timeline",
    ]) {
      expect(blob, forbidden).not.toContain(forbidden);
    }
    const lower = blob.toLowerCase();
    for (const forbidden of ["consentrecord", "ticket", "casos individuales"]) {
      expect(lower, forbidden).not.toContain(forbidden);
    }
  });

  it("17. sin taxonomía ni flags nuevos; captura diferida documentada", () => {
    const blob = JSON.stringify(D05_ACTIVITIES);
    for (const forbidden of ["specialcategories", "issensitive", "isenum", "\"enum\""]) {
      expect(blob.toLowerCase(), forbidden).not.toContain(forbidden);
    }
    expect(D05_PROVENANCE_NOTES["sensitive.lawfulness_assess"]).toContain("GATE DE CAPTURA");
  });

  it("18. dominio d5 registrado con objetivo y 7 claves", () => {
    expect(getDomain("d5")?.activity_keys).toEqual(EXPECTED_KEYS);
    expect(getDomain("d5")?.name).toBe("Tratamientos especiales");
    expect(getDomain("d5")?.objective).toContain("Título III");
    expect(getDomainForActivity("sensitive.lawfulness_assess")).toEqual({
      domainKey: "d5",
      domainCode: "D5",
    });
    expect(getDomainForActivity("financial.titleIII_scope")).toEqual({
      domainKey: "d5",
      domainCode: "D5",
    });
    for (const key of ["d7", "d8", "d9", "d10", "d11", "d12"]) {
      expect(getDomain(key)?.activity_keys, key).toEqual([]);
    }
  });

  it("19. D5.01–D5.07 con protocolos (7/7, D5 CLOSED)", () => {
    for (const k of EXPECTED_KEYS) {
      expect(getProtocolForActivity(k), k).toBeTruthy();
    }
    expect(ALL_ACTIVITIES).toHaveLength(61);
  });

  it("20. D05.md sincronizado y determinístico", () => {
    const root = process.cwd();
    const render = () =>
      renderD05(
        D05_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D05_ACTIVITIES),
        D05_PROVENANCE_NOTES,
      );
    expect(readFileSync(join(root, "docs/domains/D05.md"), "utf-8")).toBe(render());
    expect(render()).toBe(render());
  });

  it("21. aplicabilidad y dependencias separados", () => {
    for (const a of D05_ACTIVITIES) {
      expect(a.conditions_applicability).toEqual([]);
      expect(a.activity_dependencies).toEqual([]);
    }
  });
});
