import { expect, test } from "@playwright/test";

test("/dominios/d1 muestra 20 actividades", async ({ page }) => {
  await page.goto("/dominios/d1");
  await expect(page.getByText("20 actividades importadas")).toBeVisible();
  for (const code of ["D1.01", "D1.10", "D1.20"]) {
    await expect(page.getByText(code, { exact: true })).toBeVisible();
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
    .locator(".domain-row", { hasText: "mpi.assemble_program" })
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

test("/fuentes muestra exactamente las dos fuentes importadas", async ({
  page,
}) => {
  await page.goto("/fuentes");
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

test("una actividad muestra Vigencia diferida", async ({ page }) => {
  await page.goto("/actividad/governance.preventive_framework");
  await expect(page.getByText("Vigencia diferida").first()).toBeVisible();
  await expect(
    page.getByText("Nuevo régimen con vigencia desde 01-12-2026").first(),
  ).toBeVisible();
});

test("una actividad con agency standard lo distingue de legal requirement", async ({
  page,
}) => {
  await page.goto("/actividad/mpi.formalize_adoption");
  await expect(page.getByText("Estándar metodológico").first()).toBeVisible();
  await expect(page.getByText("Artículo 49").first()).toBeVisible();
});

test("una dependencia intra-D1 es navegable", async ({ page }) => {
  await page.goto("/actividad/dpo.initial_governance_validation");
  await page.locator(".dep-item").getByRole("link", { name: /dpo\.designate/ }).click();
  await expect(page.getByRole("heading", { name: "Designar DPO" })).toBeVisible();
  expect(page.url()).toContain("/actividad/dpo.designate");
});

test("una dependencia cross-domain pendiente no produce enlace roto", async ({
  page,
}) => {
  await page.goto("/actividad/mpi.assemble_program");
  await expect(
    page.getByText("Referencia canónica pendiente de importar").first(),
  ).toBeVisible();
  const broken = page.locator('a[href*="treatment.inventory_create"]');
  await expect(broken).toHaveCount(0);
});

test("D1 sin overflow en desktop y tablet", async ({ page }) => {
  for (const path of ["/dominios/d1", "/actividad/dpo.designate", "/fuentes"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
  }
});
