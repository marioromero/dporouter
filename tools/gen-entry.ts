import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderD01 } from "./domain-doc";
import { D01_ACTIVITIES, PENDING_CROSS_DOMAIN } from "../content/domains/d01";
import { SOURCES } from "../content/sources";

/**
 * Punto de entrada de `npm run content:docs`.
 * Se ejecuta bundelizado (ver tools/generate-docs.mjs).
 */
const root = process.env.DPOROUTER_ROOT ?? join(__dirname, "..");
const out = join(root, "docs", "domains", "D01.md");
writeFileSync(out, renderD01(D01_ACTIVITIES, SOURCES, PENDING_CROSS_DOMAIN), "utf-8");
console.log(`D01.md regenerado (${D01_ACTIVITIES.length} actividades)`);
