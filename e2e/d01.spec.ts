import { expect, test } from "@playwright/test";

test("/trabajo/d1 muestra 20 actividades", async ({ page }) => {
  await page.goto("/trabajo/d1");
  await expect(page.getByText("20 actividades importadas")).toBeVisible();
  for (const code of ["D1.01", "D1.10", "D1.20"]) {
    await expect(page.locator("span.domain-code", { hasText: code }).first()).toBeVisible();
  }
});

test("D1.01 abre por deep link", async ({ page }) => {
  await page.goto("/actividad/governance.preventive_framework");
  await expect(
    page.getByRole("heading", { name: "Establecer marco general de prevención" }),
  ).toBeVisible();
  await expect(page.locator("span.human-code")).toContainText("D1.01");
});

test("dpo.designate abre por deep link", async ({ page }) => {
  await page.goto("/actividad/dpo.designate");
  await expect(page.getByRole("heading", { name: "Designar DPO" })).toBeVisible();
});

test("mpi.assemble_program abre por deep link y reload conserva actividad", async ({
  page,
}) => {
  await page.goto("/actividad/mpi.assemble_program");
  await expect(
    page.getByRole("heading", {
      name: "Consolidar e implementar el programa de cumplimiento MPI",
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Consolidar e implementar el programa de cumplimiento MPI",
    }),
  ).toBeVisible();
});

test("breadcrumb identifica D1 en actividad canónica", async ({ page }) => {
  await page.goto("/actividad/dpo.designate");
  const crumb = page.getByLabel("Ubicación actual");
  await expect(crumb).toContainText("dpo.designate");
  await expect(
    page.locator(".breadcrumb").getByRole("link", { name: "D1" }),
  ).toBeVisible();
});

test("buscar DPO devuelve actividades reales", async ({ page }) => {
  await page.goto("/buscar");
  await page.getByLabel("Buscar").fill("DPO");
  await expect(page.getByText("Designar DPO")).toBeVisible();
  await expect(page.getByText("D1.08")).toBeVisible();
});

test("buscar mpi.assemble_program encuentra la actividad correcta", async ({
  page,
}) => {
  await page.goto("/buscar");
  await page.getByLabel("Buscar").fill("mpi.assemble_program");
  await expect(
    page.getByText("Consolidar e implementar el programa de cumplimiento MPI"),
  ).toBeVisible();
  await page
    .locator(".domain-row", { hasText: "Consolidar e implementar el programa de cumplimiento MPI" })
    .first()
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Consolidar e implementar el programa de cumplimiento MPI",
    }),
  ).toBeVisible();
  expect(page.url()).toContain("/actividad/mpi.assemble_program");
});

test("DEMO sigue fuera de búsqueda", async ({ page }) => {
  await page.goto("/buscar");
  await page.getByLabel("Buscar").fill("demostraci");
  await expect(page.getByText("No encontramos coincidencias.")).toHaveCount(2);
  await expect(
    page.getByText("DEMOSTRACIÓN DE INTERFAZ · CONTENIDO NO CANÓNICO"),
  ).toHaveCount(0);
});

test("/referencias muestra exactamente las dos fuentes importadas", async ({
  page,
}) => {
  await page.goto("/referencias");
  await expect(
    page.getByText("Ley N° 19.628 sobre Protección de la Vida Privada", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Decreto N° 662 — Reglamento de los modelos", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByText("Artículo 48")).toBeVisible();
  await expect(page.getByText("Artículo 20", { exact: true })).toBeVisible();
});

test("vigencia se informa globalmente una vez, no por actividad", async ({ page }) => {
  await page.goto("/actividad/governance.preventive_framework");
  await expect(
    page.getByText("Nuevo régimen de protección de datos: vigencia desde 01-12-2026"),
  ).toBeVisible();
  await expect(page.getByText("Vigencia diferida")).toHaveCount(0);
});

test("una actividad con agency standard usa lenguaje humano único", async ({
  page,
}) => {
  await page.goto("/actividad/mpi.formalize_adoption");
  await expect(page.getByText("Criterio interno recomendado").first()).toBeVisible();
  await expect(page.getByText("Artículo 49").first()).toBeVisible();
  await expect(page.getByText("Estándar metodológico")).toHaveCount(0);
});

test("una dependencia intra-D1 es navegable", async ({ page }) => {
  await page.goto("/actividad/dpo.initial_governance_validation");
  await page.getByRole("region", { name: "Se relaciona con" }).getByRole("link", { name: "Designar DPO" }).click();
  await expect(page.getByRole("heading", { name: "Designar DPO" })).toBeVisible();
  expect(page.url()).toContain("/actividad/dpo.designate");
});

test("D1.18 conserva pendientes sin enlaces rotos", async ({ page }) => {
  await page.goto("/actividad/mpi.assemble_program");
  await expect(
    page.getByText("Más referencias canónicas pendientes de importar").first(),
  ).toBeVisible();
  await expect(page.locator('a[href*="risk.mpi_sync"]')).toHaveCount(0);
  await expect(page.locator('a[href*="mpi.diffusion"]')).toHaveCount(0);
});

test("D1 sin overflow en desktop y tablet", async ({ page }) => {
  for (const path of ["/trabajo/d1", "/actividad/dpo.designate", "/referencias"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
  }
});
