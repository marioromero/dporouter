import { expect, test } from "@playwright/test";

test("/trabajo/d2 muestra 12 actividades", async ({ page }) => {
  await page.goto("/trabajo/d2");
  await expect(page.getByText("12 actividades importadas")).toBeVisible();
  for (const code of ["D2.01", "D2.06", "D2.12"]) {
    await expect(page.locator("span.domain-code", { hasText: code })).toBeVisible();
  }
});

test("/actividad/treatment.inventory_create abre directamente", async ({ page }) => {
  await page.goto("/actividad/treatment.inventory_create");
  await expect(
    page.getByRole("heading", { name: "Crear inventario maestro de tratamientos" }),
  ).toBeVisible();
});

test("/actividad/lawful_basis.assign abre directamente", async ({ page }) => {
  await page.goto("/actividad/lawful_basis.assign");
  await expect(
    page.getByRole("heading", { name: "Asignar base de licitud por finalidad" }),
  ).toBeVisible();
});

test("/actividad/legitimate_interest.assessment abre directamente", async ({
  page,
}) => {
  await page.goto("/actividad/legitimate_interest.assessment");
  await expect(
    page.getByRole("heading", { name: "Evaluar interés legítimo" }),
  ).toBeVisible();
});

test("/actividad/precontractual_data.cleanup abre directamente", async ({ page }) => {
  await page.goto("/actividad/precontractual_data.cleanup");
  await expect(
    page.getByRole("heading", {
      name: "Depurar datos obtenidos para medidas precontractuales",
    }),
  ).toBeVisible();
});

test("reload conserva deep link D2", async ({ page }) => {
  await page.goto("/actividad/lawful_basis.assign");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Asignar base de licitud por finalidad" }),
  ).toBeVisible();
});

test("D2 breadcrumb correcto", async ({ page }) => {
  await page.goto("/actividad/lawful_basis.assign");
  await expect(page.getByLabel("Ubicación actual")).toContainText(
    "lawful_basis.assign",
  );
  await expect(
    page.locator(".breadcrumb").getByRole("link", { name: "D2" }),
  ).toBeVisible();
});

test("buscar licitud devuelve contenido D2", async ({ page }) => {
  await page.goto("/buscar");
  await page.getByLabel("Buscar").fill("licitud");
  await expect(page.getByText("Asignar base de licitud por finalidad")).toBeVisible();
});

test("buscar legitimate_interest.assessment encuentra D2.06", async ({ page }) => {
  await page.goto("/buscar");
  await page.getByLabel("Buscar").fill("legitimate_interest.assessment");
  await expect(page.getByText("Evaluar interés legítimo")).toBeVisible();
  await expect(page.getByText("D2.06")).toBeVisible();
});

test("buscar D2.10 encuentra la actividad correcta", async ({ page }) => {
  await page.goto("/buscar");
  await page.getByLabel("Buscar").fill("D2.10");
  await expect(
    page.getByText("Depurar datos obtenidos para medidas precontractuales"),
  ).toBeVisible();
});

test("mpi.assemble_program muestra treatment.inventory_create como link válido", async ({
  page,
}) => {
  await page.goto("/actividad/mpi.assemble_program");
  const link = page
    .getByRole("region", { name: "Se relaciona con" })
    .getByRole("link", { name: "Crear inventario maestro de tratamientos" });
  await expect(link).toBeVisible();
  await expect(
    page.getByText("Más referencias canónicas pendientes de importar"),
  ).toBeVisible();
});

test("ese link abre D2.01", async ({ page }) => {
  await page.goto("/actividad/mpi.assemble_program");
  await page
    .getByRole("region", { name: "Se relaciona con" })
    .getByRole("link", { name: "Crear inventario maestro de tratamientos" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Crear inventario maestro de tratamientos" }),
  ).toBeVisible();
  expect(page.url()).toContain("/actividad/treatment.inventory_create");
});

test("D2.05 distingue aplicabilidad humana de dependencias", async ({ page }) => {
  await page.goto("/actividad/lawful_basis.assign");
  const region = page.getByRole("region", { name: "Qué se busca resolver" });
  await expect(
    region.getByText("Aplica cuando el tratamiento tiene finalidades definidas."),
  ).toBeVisible();
  await expect(region.getByText("treatment.purposes defined")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Se relaciona con" }).getByRole("link", { name: "Definir finalidades del tratamiento" }),
  ).toBeVisible();
});

test("D2.06 conserva evidencia de reasoning y auditoría colapsada", async ({ page }) => {
  await page.goto("/actividad/legitimate_interest.assessment");
  await expect(page.getByText("Reasoning Record de interés legítimo")).toBeVisible();
  const audit = page.getByTestId("auditoria-detalle");
  await expect(audit.getByText("Requerido", { exact: true })).toHaveCount(0);
  await audit.getByText("Datos técnicos (auditoría interna)").click();
  await expect(audit.getByText("Requerido", { exact: true })).toBeVisible();
});

test("D2.08 usa lenguaje humano para evidencia interna", async ({ page }) => {
  await page.goto("/actividad/retention.schedule");
  await expect(page.getByText("Criterio interno recomendado").first()).toBeVisible();
  await expect(page.getByText("Artículo 3 letra c)").first()).toBeVisible();
  await expect(page.getByText("Estándar metodológico")).toHaveCount(0);
});

test("D2.10 renderiza correctamente el flujo precontractual", async ({ page }) => {
  await page.goto("/actividad/precontractual_data.cleanup");
  await expect(
    page.getByRole("heading", {
      name: "Depurar datos obtenidos para medidas precontractuales",
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Qué se busca resolver" })
      .getByText("Aplica cuando se obtuvieron datos para medidas precontractuales solicitadas."),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Se relaciona con" }).getByRole("link", { name: "Asignar base de licitud por finalidad" }),
  ).toBeVisible();
});

test("/referencias continúa con las dos fuentes y provisiones actualizadas", async ({
  page,
}) => {
  await page.goto("/referencias");
  await expect(
    page.getByText("Ley N° 19.628 sobre Protección de la Vida Privada", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Decreto N° 662 — Reglamento de los modelos", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("Artículo 2", { exact: true })).toBeVisible();
  await expect(page.getByText("Artículo 14 ter", { exact: true })).toBeVisible();
  await expect(page.getByText("Artículo 48")).toBeVisible();
});

test("D2 sin overflow en desktop y tablet", async ({ page }) => {
  for (const path of [
    "/trabajo/d2",
    "/actividad/lawful_basis.assign",
    "/actividad/legitimate_interest.assessment",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
  }
});

test("DEMO continúa aislado tras D2", async ({ page }) => {
  await page.goto("/buscar");
  await page.getByLabel("Buscar").fill("demostraci");
  await expect(page.getByText("No encontramos coincidencias.")).toHaveCount(2);
  await page.goto("/actividad/demo.activity_view");
  await expect(
    page.getByText("DEMOSTRACIÓN DE INTERFAZ · CONTENIDO NO CANÓNICO"),
  ).toBeVisible();
});
