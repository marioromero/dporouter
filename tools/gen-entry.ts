import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderD01, renderD02, renderD03, renderD04 } from "./domain-doc";
import { D01_ACTIVITIES } from "../content/domains/d01";
import {
  D02_ACTIVITIES,
  D02_PROVENANCE_NOTES,
} from "../content/domains/d02";
import {
  D03_ACTIVITIES,
  D03_PROVENANCE_NOTES,
} from "../content/domains/d03";
import {
  D04_ACTIVITIES,
  D04_PROVENANCE_NOTES,
} from "../content/domains/d04";
import { SOURCES } from "../content/sources";
import { getDomainPendingReferences } from "../content/registry";

/**
 * Punto de entrada de `npm run content:docs`.
 * Se ejecuta bundelizado (ver tools/generate-docs.mjs).
 * Genera todas las proyecciones humanas de dominios importados.
 */
const root = process.env.DPOROUTER_ROOT ?? join(__dirname, "..");
const outDir = process.env.DPOROUTER_OUTDIR ?? join(root, "docs", "domains");

const d01 = renderD01(
  D01_ACTIVITIES,
  SOURCES,
  getDomainPendingReferences(D01_ACTIVITIES),
);
writeFileSync(join(outDir, "D01.md"), d01, "utf-8");

const d02 = renderD02(
  D02_ACTIVITIES,
  SOURCES,
  getDomainPendingReferences(D02_ACTIVITIES),
  D02_PROVENANCE_NOTES,
);
writeFileSync(join(outDir, "D02.md"), d02, "utf-8");

const d03 = renderD03(
  D03_ACTIVITIES,
  SOURCES,
  getDomainPendingReferences(D03_ACTIVITIES),
  D03_PROVENANCE_NOTES,
);
writeFileSync(join(outDir, "D03.md"), d03, "utf-8");

const d04 = renderD04(
  D04_ACTIVITIES,
  SOURCES,
  getDomainPendingReferences(D04_ACTIVITIES),
  D04_PROVENANCE_NOTES,
);
writeFileSync(join(outDir, "D04.md"), d04, "utf-8");

console.log(
  `Documentación regenerada: D01 (${D01_ACTIVITIES.length} actividades), D02 (${D02_ACTIVITIES.length} actividades), D03 (${D03_ACTIVITIES.length} actividades), D04 (${D04_ACTIVITIES.length} actividades)`,
);
