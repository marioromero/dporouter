import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDomain } from "../src/data/domains";
import {
  D06_ACTIVITIES,
  D6_ACTIVITY_KEYS,
  D06_PROVENANCE_NOTES,
} from "../content/domains/d06";
import { D01_ACTIVITIES } from "../content/domains/d01";
import { D02_ACTIVITIES } from "../content/domains/d02";
import { D03_ACTIVITIES } from "../content/domains/d03";
import { D04_ACTIVITIES } from "../content/domains/d04";
import { D05_ACTIVITIES } from "../content/domains/d05";
import { SOURCES } from "../content/sources";
import { renderD06 } from "../tools/domain-doc";
import {
  ALL_ACTIVITIES,
  getCanonicalActivity,
  getDomainForActivity,
  getDomainPendingReferences,
  getUnresolvedReferences,
} from "../content/registry";
import { getProtocolForActivity, listProtocols } from "../content/protocols/registry";

const EXPECTED_KEYS = [
  "third_party.relationship_map",
  "cession.lawfulness_assess",
  "cession.instrument_validate",
  "processor.contract_validate",
  "processor.instruction_controls_validate",
  "subprocessor.authorization_validate",
  "processor.security_exit_validate",
];

const EXPECTED_CODES = [
  "D6.01", "D6.02", "D6.03", "D6.04", "D6.05", "D6.06", "D6.07",
];

const EXPECTED_NAMES = [
  "Identificar y clasificar relaciones de tratamiento con terceros",
  "Evaluar la licitud de la cesión de datos personales",
  "Validar la formalización e instrumento de cesión",
  "Validar el contrato responsable–encargado",
  "Validar instrucciones y límites operacionales del encargado",
  "Validar autorización y control de subencargados",
  "Validar obligaciones operacionales, seguridad y cierre del encargado",
];

const EXPECTED_REASONING: Record<string, boolean> = {
  "third_party.relationship_map": true,
  "cession.lawfulness_assess": true,
  "cession.instrument_validate": false,
  "processor.contract_validate": false,
  "processor.instruction_controls_validate": false,
  "subprocessor.authorization_validate": false,
  "processor.security_exit_validate": false,
};

const EXPECTED_TYPES: Record<string, string> = {
  "third_party.relationship_map": "assessment",
  "cession.lawfulness_assess": "assessment",
  "cession.instrument_validate": "implementation",
  "processor.contract_validate": "implementation",
  "processor.instruction_controls_validate": "implementation",
  "subprocessor.authorization_validate": "implementation",
  "processor.security_exit_validate": "implementation",
};

const EXPECTED_PROVISIONS: Record<string, string[]> = {
  "third_party.relationship_map": [
    "Artículo 2 letra c)",
    "Artículo 2 letra v)",
    "Artículo 2 letra x)",
    "Artículo 15",
    "Artículo 15 bis",
  ],
  "cession.lawfulness_assess": ["Artículo 13 letra d)", "Artículo 15"],
  "cession.instrument_validate": ["Artículo 3 letra d)", "Artículo 15"],
  "processor.contract_validate": ["Artículo 15 bis"],
  "processor.instruction_controls_validate": ["Artículo 15 bis"],
  "subprocessor.authorization_validate": ["Artículo 15 bis"],
  "processor.security_exit_validate": [
    "Artículo 14 bis",
    "Artículo 14 quinquies",
    "Artículo 14 septies",
    "Artículo 15 bis",
  ],
};

const EXPECTED_EFFECTS: Record<string, string[]> = {
  "third_party.relationship_map": ["third_party.relationship_map_status = complete"],
  "cession.lawfulness_assess": [
    "cession.lawfulness_status = supported",
    "cession.lawfulness_status = not_supported",
  ],
  "cession.instrument_validate": [
    "cession.instrument_status = validated",
    "cession.instrument_status = remediation_required",
  ],
  "processor.contract_validate": [
    "processor.contract_status = validated",
    "processor.contract_status = remediation_required",
  ],
  "processor.instruction_controls_validate": [
    "processor.instructions_status = controlled",
    "processor.instructions_status = remediation_required",
  ],
  "subprocessor.authorization_validate": [
    "subprocessor.authorization_status = controlled",
    "subprocessor.authorization_status = remediation_required",
  ],
  "processor.security_exit_validate": [
    "processor.operational_status = controlled",
    "processor.operational_status = remediation_required",
  ],
};

/** Scopes conceptuales aprobados (sin campo scope en ActivityDefinition). */
const EXPECTED_SCOPES: Record<string, string> = {
  "third_party.relationship_map": "treatment",
  "cession.lawfulness_assess": "purpose",
  "cession.instrument_validate": "purpose",
  "processor.contract_validate": "treatment",
  "processor.instruction_controls_validate": "treatment",
  "subprocessor.authorization_validate": "treatment",
  "processor.security_exit_validate": "treatment",
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

function steps(key: string): string {
  return getCanonicalActivity(key)?.steps_operational.join("\n") ?? "";
}

describe("contenido canónico D6", () => {
  it("1. D6 importa exactamente 7 actividades", () => {
    expect(D06_ACTIVITIES).toHaveLength(7);
  });

  it("2. 7 keys exactas en orden canónico", () => {
    expect(D06_ACTIVITIES.map((a) => a.activity_key)).toEqual(EXPECTED_KEYS);
    expect(D6_ACTIVITY_KEYS).toEqual(EXPECTED_KEYS);
    expect(new Set(D06_ACTIVITIES.map((a) => a.activity_key)).size).toBe(7);
  });

  it("3. scopes conceptuales exactos (documentados en provenance)", () => {
    for (const [key, scope] of Object.entries(EXPECTED_SCOPES)) {
      expect(D06_PROVENANCE_NOTES[key], key).toContain(scope);
    }
  });

  it("4. applicable_role responsible ×7", () => {
    for (const a of D06_ACTIVITIES) {
      expect(a.applicable_role, a.activity_key).toEqual(["responsible"]);
    }
  });

  it("5. reasoning: D6.01 y D6.02 true, resto false; tipos assessment/implementation", () => {
    for (const a of D06_ACTIVITIES) {
      expect(a.reasoning_record_required, a.activity_key).toBe(
        EXPECTED_REASONING[a.activity_key],
      );
      expect(a.activity_type, a.activity_key).toBe(EXPECTED_TYPES[a.activity_key]);
    }
  });

  it("6. evidence_basis agency_standard ×7", () => {
    for (const a of D06_ACTIVITIES) {
      expect(a.evidence_basis, a.activity_key).toBe("agency_standard");
    }
  });

  it("7. relationship_effect [] ×7", () => {
    for (const a of D06_ACTIVITIES) {
      expect(a.relationship_effect, a.activity_key).toEqual([]);
    }
  });

  it("8. legal_basis resolubles y provisiones exactas", () => {
    const sourceIds = new Set(SOURCES.map((s) => s.source_id));
    const used = SOURCES.find((s) => s.source_id === "cl_ley_19628_2026")?.provisions_used ?? [];
    for (const p of [
      "Artículo 2 letra c)", "Artículo 2 letra v)", "Artículo 2 letra x)",
      "Artículo 3 letra d)", "Artículo 13 letra d)", "Artículo 14 bis",
      "Artículo 14 quinquies", "Artículo 14 septies", "Artículo 15", "Artículo 15 bis",
    ]) {
      expect(used, p).toContain(p);
    }
    for (const a of D06_ACTIVITIES) {
      for (const b of a.legal_basis) {
        expect(sourceIds.has(b.source_id), a.activity_key).toBe(true);
        expect(b.source_id, a.activity_key).toBe("cl_ley_19628_2026");
        expect(used, `${a.activity_key} ${b.article_or_provision}`).toContain(
          b.article_or_provision,
        );
      }
      expect(
        a.legal_basis.map((b) => b.article_or_provision),
        a.activity_key,
      ).toEqual(EXPECTED_PROVISIONS[a.activity_key]);
    }
  });

  it("9. D6.01 preserva communication/cession/processor/subprocessor/international distinction", () => {
    const s = steps("third_party.relationship_map");
    expect(s).toContain("sin llegar a cederlos");
    expect(s).toContain("responsable→responsable");
    expect(s).toContain("por cuenta del responsable");
    expect(s).toContain("pretende delegar parte o totalidad del encargo");
    expect(s).toContain("dimensión internacional");
    expect(s).toContain("sin concluir licitud internacional");
  });

  it("10. D6.01 no crea dependency D2", () => {
    expect(getCanonicalActivity("third_party.relationship_map")?.activity_dependencies).toEqual([]);
    expect(steps("third_party.relationship_map")).toContain("sin modificarlo ni duplicar D2.02");
  });

  it("11. D6.02 preserva las cuatro rutas art. 15", () => {
    const s = steps("cession.lawfulness_assess");
    expect(s).toContain("consentimiento");
    expect(s).toContain("contrato en que el titular es parte");
    expect(s).toContain("artículo 13 letra d)");
    expect(s).toContain("habilitación legal");
    expect(s).toContain("no exigirlas cumulativamente");
  });

  it("12. D6.02 preserva consentimiento posterior/nueva operación", () => {
    expect(steps("cession.lawfulness_assess")).toContain("nueva operación de tratamiento");
  });

  it("13. D6.02 preserva nulidad/supresión sin enforcement workflow", () => {
    const s = steps("cession.lawfulness_assess");
    expect(s).toContain("nula");
    expect(s).toContain("debe suprimir los datos recibidos");
    expect(s).toContain("No crear enforcement workflow");
  });

  it("14. D6.03 formalización escrita/electrónica", () => {
    expect(steps("cession.instrument_validate")).toContain("por escrito o mediante medio electrónico idóneo");
  });

  it("15. D6.03 partes/datos/finalidades", () => {
    const s = steps("cession.instrument_validate");
    expect(s).toContain("individualización de cedente");
    expect(s).toContain("individualización de cesionario");
    expect(s).toContain("datos objeto de cesión");
    expect(s).toContain("finalidades previstas");
    expect(s).toContain("adquiere calidad de responsable");
  });

  it("16. D6.03 no crea quality canonical fact", () => {
    const a = getCanonicalActivity("cession.instrument_validate");
    expect(a?.state_effect).toEqual(EXPECTED_EFFECTS["cession.instrument_validate"]);
    expect(JSON.stringify(a?.state_effect)).not.toContain("quality");
    expect(steps("cession.instrument_validate")).toContain("source-of-truth de calidad");
  });

  it("17. D6.03 completion dependency a D6.02", () => {
    expect(getCanonicalActivity("cession.instrument_validate")?.activity_dependencies).toEqual([
      {
        target_activity_key: "cession.lawfulness_assess",
        scope: "same_domain",
        type: "completion_dependency",
        condition: "lawfulness supported",
        rationale:
          "El instrumento puede ser revisado antes, pero no declararse correctamente cerrado ignorando que la cesión carece de fundamento jurídico.",
      },
    ]);
  });

  it("18. D6.04 contiene 7 contenidos contractuales mínimos", () => {
    const s = steps("processor.contract_validate");
    for (const c of [
      "objeto del encargo",
      "duración",
      "finalidad del tratamiento",
      "tipo de datos personales tratados",
      "categorías de titulares",
      "derechos de las partes",
      "obligaciones de las partes",
    ]) {
      expect(s, c).toContain(c);
    }
  });

  it("19. D6.05 preserva instrucciones + objeto + autorización expresa/específica", () => {
    const s = steps("processor.instruction_controls_validate");
    expect(s).toContain("instrucciones identificables");
    expect(s).toContain("objeto del encargo");
    expect(s).toContain("autorización expresa");
    expect(s).toContain("específica");
  });

  it("20. D6.05 preserva consecuencia sin auto-role-write", () => {
    const s = steps("processor.instruction_controls_validate");
    expect(s).toContain("responsable para todos los efectos legales");
    expect(s).toContain("No crear cambio automático de ActorRecord");
  });

  it("21. D6.06 autorización específica + escrita", () => {
    const s = steps("subprocessor.authorization_validate");
    expect(s).toContain("sea específica");
    expect(s).toContain("por escrito");
  });

  it("22. D6.06 responsabilidad original preservada", () => {
    expect(steps("subprocessor.authorization_validate")).toContain("solidariamente responsable");
  });

  it("23. D6.06 not_applicable conceptual sin conjunción vacía", () => {
    const s = steps("subprocessor.authorization_validate");
    expect(s).toContain("not_applicable");
    expect(s).toContain("no cumplimiento por conjunción vacía");
    expect(
      getCanonicalActivity("subprocessor.authorization_validate")?.state_effect,
      "sin effect para not applicable",
    ).toEqual(EXPECTED_EFFECTS["subprocessor.authorization_validate"]);
  });

  it("24. D6.07 confidentiality/security/report/return-delete", () => {
    const s = steps("processor.security_exit_validate");
    expect(s).toContain("confidencialidad");
    expect(s).toContain("seguridad");
    expect(s).toContain("reportar al responsable vulneraciones");
    expect(s).toContain("devolución");
    expect(s).toContain("supresión");
  });

  it("25. D6.07 no sustituye D9", () => {
    const s = steps("processor.security_exit_validate");
    expect(s).toContain("no escribe facts D9");
    expect(s).toContain("no reemplaza controles D9");
  });

  it("26. D6 no contiene estructuras repetibles nuevas", () => {
    const blob = JSON.stringify(D06_ACTIVITIES);
    for (const forbidden of [
      "ThirdPartyRecord",
      "ThirdPartyRelationshipRecord",
      "ProcessorRecord",
      "CessionRecord",
      "SubprocessorRecord",
      "ThirdPartyContext",
      "ThirdPartyScope",
      "DisclosureEvent",
      "CessionEvent",
      "TransferEvent",
      "ProcessorEvent",
      "IncidentEvent",
      "ClientActivityInstance",
    ]) {
      expect(blob, forbidden).not.toContain(forbidden);
    }
  });

  it("27. D6 no contiene transfer legality D7", () => {
    const blob = JSON.stringify(D06_ACTIVITIES);
    expect(blob).not.toContain("Artículo 27");
    expect(steps("third_party.relationship_map")).toContain("sin concluir licitud internacional");
  });

  it("28. D1–D5 intactos", () => {
    expect(D01_ACTIVITIES).toHaveLength(20);
    expect(D02_ACTIVITIES).toHaveLength(12);
    expect(D03_ACTIVITIES).toHaveLength(6);
    expect(D04_ACTIVITIES).toHaveLength(9);
    expect(D05_ACTIVITIES).toHaveLength(7);
  });

  it("29. pending refs siguen 2", () => {
    expect(getUnresolvedReferences()).toEqual(["mpi.diffusion", "risk.mpi_sync"]);
    expect(getDomainPendingReferences(D06_ACTIVITIES)).toEqual([]);
  });

  it("30. canonical total = 61", () => {
    expect(ALL_ACTIVITIES).toHaveLength(61);
    expect(new Set(ALL_ACTIVITIES.map((a) => a.activity_key)).size).toBe(61);
  });

  it("31. protocols total = 54; D6 sin protocolos", () => {
    expect(listProtocols()).toHaveLength(54);
    for (const k of EXPECTED_KEYS) {
      expect(getProtocolForActivity(k), k).toBeUndefined();
    }
  });

  it("32. contrato ActivityDefinition completo, state effects y revisión", () => {
    for (const a of D06_ACTIVITIES) {
      for (const f of CANONICAL_FIELDS) {
        expect(a, `${a.activity_key}.${f}`).toHaveProperty(f);
      }
      expect(a.state_effect, a.activity_key).toEqual(EXPECTED_EFFECTS[a.activity_key]);
      expect(a.regulatory_status, a.activity_key).toBe("transitional");
      expect(a.last_legal_review, a.activity_key).toBe("2026-12-01");
      expect(a.conditions_applicability, a.activity_key).toEqual([]);
    }
    expect(D06_ACTIVITIES.map((a) => a.human_code)).toEqual(EXPECTED_CODES);
    expect(D06_ACTIVITIES.map((a) => a.name)).toEqual(EXPECTED_NAMES);
  });

  it("33. dominio d6 registrado con objetivo y 7 claves", () => {
    expect(getDomain("d6")?.activity_keys).toEqual(EXPECTED_KEYS);
    expect(getDomain("d6")?.name).toBe("Cesiones, encargados y subencargados");
    expect(getDomain("d6")?.objective).toContain("transferencias internacionales");
    expect(getDomainForActivity("third_party.relationship_map")).toEqual({
      domainKey: "d6",
      domainCode: "D6",
    });
    expect(getDomainForActivity("processor.security_exit_validate")).toEqual({
      domainKey: "d6",
      domainCode: "D6",
    });
  });

  it("34. D06.md sincronizado y determinístico", () => {
    const root = process.cwd();
    const render = () =>
      renderD06(
        D06_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D06_ACTIVITIES),
        D06_PROVENANCE_NOTES,
      );
    expect(readFileSync(join(root, "docs/domains/D06.md"), "utf-8")).toBe(render());
    expect(render()).toBe(render());
  });
});
