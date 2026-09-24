import { describe, expect, it } from "vitest";
import {
  DEFAULT_ADVISORS,
  findAdvisorByUsername,
  isAdvisorProfileId,
  verifyAdvisor,
} from "../src/data/advisors";
import {
  defaultAdvisorProfiles,
  emptyWorkspace,
  newCompany,
} from "../src/workspace/types";
import {
  ensureAdvisorProfiles,
  migrateWorkspaceData,
  validateCompanyState,
} from "../src/workspace/store";

describe("acceso de asesor (nómina fija local)", () => {
  it("expone exactamente pablo, carlos y mario", () => {
    expect(DEFAULT_ADVISORS.map((a) => a.username)).toEqual([
      "pablo",
      "carlos",
      "mario",
    ]);
  });

  it("verifica usuario insensible a mayúsculas y espacios, clave exacta", () => {
    expect(verifyAdvisor("Pablo", "admin123")?.id).toBe("asesor-pablo");
    expect(verifyAdvisor("  carlos ", "admin123")?.id).toBe("asesor-carlos");
    expect(verifyAdvisor("mario", "admin123")?.id).toBe("asesor-mario");
    expect(verifyAdvisor("pablo", "Admin123")).toBeNull();
    expect(verifyAdvisor("pablo", "")).toBeNull();
    expect(verifyAdvisor("desconocido", "admin123")).toBeNull();
    expect(verifyAdvisor("", "admin123")).toBeNull();
  });

  it("findAdvisorByUsername no inventa asesores", () => {
    expect(findAdvisorByUsername(" Pablo ")?.id).toBe("asesor-pablo");
    expect(findAdvisorByUsername("otro")).toBeUndefined();
  });

  it("isAdvisorProfileId distingue asesores de otros perfiles", () => {
    expect(isAdvisorProfileId("asesor-pablo")).toBe(true);
    expect(isAdvisorProfileId("perfil-xyz")).toBe(false);
  });
});

describe("workspace con asesores fijos", () => {
  it("emptyWorkspace siembra los tres asesores sin sesión activa", () => {
    const ws = emptyWorkspace();
    expect(ws.profiles.map((p) => p.id).sort()).toEqual([
      "asesor-carlos",
      "asesor-mario",
      "asesor-pablo",
    ]);
    expect(ws.activeProfileId).toBeUndefined();
    expect(defaultAdvisorProfiles()).toHaveLength(3);
  });

  it("newCompany acepta dueño y lo conserva", () => {
    const c = newCompany("Alfa SpA", "asesor-pablo");
    expect(c.ownerId).toBe("asesor-pablo");
    expect(validateCompanyState(JSON.parse(JSON.stringify(c))).ok).toBe(true);
    const legacy = newCompany("Vieja SpA");
    expect(legacy.ownerId).toBeUndefined();
    expect(validateCompanyState(JSON.parse(JSON.stringify(legacy))).ok).toBe(true);
  });

  it("validateCompanyState rechaza ownerId inválido", () => {
    const c = { ...newCompany("Alfa SpA"), ownerId: "  " };
    expect(validateCompanyState(c).ok).toBe(false);
  });

  it("ensure agrega asesores ausentes y conserva sus empresas", () => {
    const at = new Date().toISOString();
    const ensured = ensureAdvisorProfiles(
      migrateWorkspaceData({
        version: 1,
        profiles: [
          {
            id: "asesor-pablo",
            name: "Pablo",
            createdAt: at,
            companyIds: ["emp-1"],
            activeCompanyId: "emp-1",
          },
        ],
        activeProfileId: "asesor-pablo",
        companies: {
          "emp-1": {
            id: "emp-1",
            name: "Alfa SpA",
            ownerId: "asesor-pablo",
            createdAt: at,
            updatedAt: at,
            activityStates: {},
          },
        },
      }),
    );
    const ids = ensured.profiles.map((p) => p.id).sort();
    expect(ids).toEqual(["asesor-carlos", "asesor-mario", "asesor-pablo"]);
    const pablo = ensured.profiles.find((p) => p.id === "asesor-pablo")!;
    expect(pablo.username).toBe("pablo");
    expect(pablo.companyIds).toEqual(["emp-1"]);
    expect(ensured.companies["emp-1"].ownerId).toBe("asesor-pablo");
    expect(ensured.activeProfileId).toBe("asesor-pablo");
  });

  it("ensure cierra sesiones heredadas que no son de asesor", () => {
    const at = new Date().toISOString();
    const ensured = ensureAdvisorProfiles(
      migrateWorkspaceData({
        version: 1,
        profiles: [
          { id: "p1", name: "Viejo", createdAt: at, companyIds: [] },
        ],
        activeProfileId: "p1",
        companies: {},
      }),
    );
    expect(ensured.activeProfileId).toBeUndefined();
    // El perfil heredado se conserva; solo se cierra su sesión.
    expect(ensured.profiles.some((p) => p.id === "p1")).toBe(true);
    expect(ensured.profiles.map((p) => p.id)).toContain("asesor-mario");
  });
});
