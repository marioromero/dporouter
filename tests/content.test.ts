import { describe, expect, it } from "vitest";
import { DOMAINS, getDomain, searchDomains } from "../src/data/domains";
import { DEMO_ACTIVITY, DEMO_ACTIVITY_KEY, getDemoActivity } from "../src/data/demoActivity";

const EXPECTED_NAMES: [string, string][] = [
  ["d1", "Gobernanza, accountability, DPO y MPI"],
  ["d2", "Inventario, licitud y ciclo de vida"],
  ["d3", "Transparencia, políticas y consentimiento"],
  ["d4", "Derechos de titulares y decisiones automatizadas"],
  ["d5", "Tratamientos especiales"],
  ["d6", "Cesiones, encargados y subencargados"],
  ["d7", "Transferencias internacionales"],
  ["d8", "Privacy by design, riesgo y EIPD"],
  ["d9", "Seguridad y brechas"],
  ["d10", "Agencia y gestión regulatoria"],
  ["d11", "Capacitación y cultura"],
  ["d12", "Monitoreo, auditoría y mejora continua"],
];

describe("integridad del registro canónico D1-D12", () => {
  it("existen exactamente 12 dominios", () => {
    expect(DOMAINS).toHaveLength(12);
  });

  it("las domain keys son únicas", () => {
    const keys = DOMAINS.map((d) => d.domain_key);
    expect(new Set(keys).size).toBe(12);
  });

  it("los códigos visibles son únicos", () => {
    const codes = DOMAINS.map((d) => d.human_code);
    expect(new Set(codes).size).toBe(12);
  });

  it("están D1-D12 en orden con los nombres exactos suministrados", () => {
    expect(DOMAINS.map((d) => [d.domain_key, d.name])).toEqual(EXPECTED_NAMES);
    expect(DOMAINS.map((d) => d.human_code)).toEqual([
      "D1", "D2", "D3", "D4", "D5", "D6",
      "D7", "D8", "D9", "D10", "D11", "D12",
    ]);
  });

  it("buscar un domain key inexistente no devuelve un dominio válido", () => {
    expect(getDomain("d13")).toBeUndefined();
    expect(getDomain("dx")).toBeUndefined();
    expect(getDomain("")).toBeUndefined();
    expect(searchDomains("d13")).toEqual([]);
  });

  it("el fixture DEMO no pertenece al contenido canónico", () => {
    expect(DEMO_ACTIVITY_KEY).toBe("demo.activity_view");
    expect(DEMO_ACTIVITY.isCanonical).toBe(false);
    // No aparece en el registro canónico ni en búsquedas normales.
    expect(DOMAINS.some((d) => d.domain_key === DEMO_ACTIVITY_KEY)).toBe(false);
    expect(DOMAINS.flatMap((d) => d.activity_keys)).not.toContain(DEMO_ACTIVITY_KEY);
    expect(searchDomains("demo")).toEqual([]);
    expect(searchDomains("DEMO-01")).toEqual([]);
    // Solo resuelve por su ruta directa.
    expect(getDemoActivity(DEMO_ACTIVITY_KEY)).toBe(DEMO_ACTIVITY);
    expect(getDemoActivity("otra.clave")).toBeUndefined();
  });
});
