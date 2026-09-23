import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderD01, renderD02, renderD03 } from "../tools/domain-doc";
import {
  D01_ACTIVITIES,
  D1_ACTIVITY_KEYS,
} from "../content/domains/d01";
import {
  D02_ACTIVITIES,
  D02_PROVENANCE_NOTES,
} from "../content/domains/d02";
import {
  D03_ACTIVITIES,
  D03_PROVENANCE_NOTES,
} from "../content/domains/d03";
import { SOURCES } from "../content/sources";
import {
  ALL_ACTIVITIES,
  getDomainPendingReferences,
  getUnresolvedReferences,
} from "../content/registry";
import { getDomain } from "../src/data/domains";
import { DEMO_ACTIVITY_KEY } from "../src/data/demoActivity";

const root = process.cwd();

function readSrcFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...readSrcFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("single source of truth del contenido canónico", () => {
  it("D01.md está sincronizado con content/domains/d01.ts", () => {
    const actual = readFileSync(join(root, "docs/domains/D01.md"), "utf-8");
    expect(actual).toBe(
      renderD01(D01_ACTIVITIES, SOURCES, getDomainPendingReferences(D01_ACTIVITIES)),
    );
  });

  it("D02.md está sincronizado con content/domains/d02.ts", () => {
    const actual = readFileSync(join(root, "docs/domains/D02.md"), "utf-8");
    expect(actual).toBe(
      renderD02(
        D02_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D02_ACTIVITIES),
        D02_PROVENANCE_NOTES,
      ),
    );
  });

  it("D03.md está sincronizado con content/domains/d03.ts", () => {
    const actual = readFileSync(join(root, "docs/domains/D03.md"), "utf-8");
    expect(actual).toBe(
      renderD03(
        D03_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D03_ACTIVITIES),
        D03_PROVENANCE_NOTES,
      ),
    );
  });

  it("la generación documental es determinística", () => {
    expect(
      renderD01(D01_ACTIVITIES, SOURCES, getDomainPendingReferences(D01_ACTIVITIES)),
    ).toBe(
      renderD01(D01_ACTIVITIES, SOURCES, getDomainPendingReferences(D01_ACTIVITIES)),
    );
    expect(
      renderD02(
        D02_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D02_ACTIVITIES),
        D02_PROVENANCE_NOTES,
      ),
    ).toBe(
      renderD02(
        D02_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D02_ACTIVITIES),
        D02_PROVENANCE_NOTES,
      ),
    );
    expect(
      renderD03(
        D03_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D03_ACTIVITIES),
        D03_PROVENANCE_NOTES,
      ),
    ).toBe(
      renderD03(
        D03_ACTIVITIES,
        SOURCES,
        getDomainPendingReferences(D03_ACTIVITIES),
        D03_PROVENANCE_NOTES,
      ),
    );
  });

  it("no existe una segunda copia independiente de D1 dentro de src", () => {
    expect(existsSync(join(root, "src/data/d01.ts"))).toBe(false);
    expect(existsSync(join(root, "src/data/sources.ts"))).toBe(false);
    const keys = ALL_ACTIVITIES.map((a) => a.activity_key);
    for (const file of readSrcFiles(join(root, "src"))) {
      const content = readFileSync(file, "utf-8");
      // Los adapters acceden a campos del contrato (def.steps_operational…);
      // la duplicación prohibida son los literales de identidad/contenido.
      for (const k of keys) {
        expect(content, `${file} no debe duplicar ${k}`).not.toContain(k);
      }
    }
  });

  it("el registry de aplicación consume la definición canónica", () => {
    expect(getDomain("d1")?.activity_keys).toEqual(D1_ACTIVITY_KEYS);
    expect(getDomain("d1")?.activity_keys).toHaveLength(20);
    expect(getDomain("d3")?.activity_keys).toHaveLength(6);
  });

  it("las dos fuentes canónicas provienen de content/sources.ts", () => {
    expect(SOURCES.map((s) => s.source_id).sort()).toEqual(
      ["cl_decreto_662_2026", "cl_ley_19628_2026"].sort(),
    );
  });

  it("el fixture DEMO permanece fuera de /content/domains", () => {
    expect(readdirSync(join(root, "content/domains"))).toEqual(["d01.ts", "d02.ts", "d03.ts"]);
    expect(
      D01_ACTIVITIES.some((a) => a.activity_key === DEMO_ACTIVITY_KEY),
    ).toBe(false);
  });

  it("sin cambio semántico tras los traslados", () => {
    expect(D01_ACTIVITIES.map((a) => a.activity_key)).toEqual(D1_ACTIVITY_KEYS);
    expect(D02_ACTIVITIES).toHaveLength(12);
    expect(D03_ACTIVITIES).toHaveLength(6);
    for (const a of ALL_ACTIVITIES) {
      expect(a.regulatory_status).toBe("transitional");
      expect(a.last_legal_review).toBe("2026-09-21");
      expect(a.legal_basis.length).toBeGreaterThanOrEqual(1);
    }
    expect(getUnresolvedReferences()).toEqual([
      "financial.titleIII_scope",
      "mpi.diffusion",
      "risk.mpi_sync",
      "sensitive.lawfulness_assess",
    ]);
  });
});
