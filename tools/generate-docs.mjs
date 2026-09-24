/**
 * Generador documental de contenido canónico (`npm run content:docs`).
 * Bundeliza la entrada TS con esbuild a un módulo temporal, lo ejecuta
 *   y escribe docs/domains/D01.md + D02.md + D03.md + D04.md + D05.md + D06.md. Determinista: mismo contenido,
 * mismo archivo. Con `--check` solo compara sin escribir (exit 1 si drift).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const check = process.argv.includes("--check");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dporouter-docs-"));

try {
  execSync(
    `npx esbuild tools/gen-entry.ts --bundle --format=cjs --platform=node --outfile="${path.join(tmp, "gen.cjs")}" --log-level=error`,
    { cwd: root, stdio: "inherit" },
  );
  execSync(`node "${path.join(tmp, "gen.cjs")}"`, {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      DPOROUTER_ROOT: root,
      DPOROUTER_OUTDIR: check ? tmp : path.join(root, "docs", "domains"),
    },
  });
  if (check) {
    const diffs = ["D01.md", "D02.md", "D03.md", "D04.md", "D05.md", "D06.md"].filter((f) => {
      const fresh = fs.readFileSync(path.join(tmp, f), "utf-8");
      const current = fs.readFileSync(
        path.join(root, "docs", "domains", f),
        "utf-8",
      );
      return fresh !== current;
    });
    if (diffs.length > 0) {
      console.error(`Documentación desactualizada: ${diffs.join(", ")}`);
      console.error("Ejecuta `npm run content:docs` para regenerar.");
      process.exitCode = 1;
    } else {
      console.log("Documentación sincronizada (D01, D02, D03, D04, D05, D06).");
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
