import { expect, test } from "@playwright/test";

test("/dominios/d2 muestra 12 actividades", async ({ page }) => {
  await page.goto("/dominios/d2");
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
    .locator(".dep-item")
    .getByRole("link", { name: /treatment\.inventory_create/ });
  await expect(link).toBeVisible();
  await expect(
    page.getByText("Referencia canónica pendiente de importar"),
  ).toHaveCount(2);
});

test("ese link abre D2.01", async ({ page }) => {
  await page.goto("/actividad/mpi.assemble_program");
  await page
    .locator(".dep-item")
    .getByRole("link", { name: /treatment\.inventory_create/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Crear inventario maestro de tratamientos" }),
  ).toBeVisible();
  expect(page.url()).toContain("/actividad/treatment.inventory_create");
});

test("D2.05 distingue applicability de dependencies", async ({ page }) => {
  await page.goto("/actividad/lawful_basis.assign");
  await expect(
    page
      .getByRole("region", { name: "Cuándo aplica" })
      .getByText("treatment.purposes defined"),
  ).toBeVisible();
  await expect(
    page.locator(".dep-item").getByRole("link", { name: /treatment\.purpose_define/ }),
  ).toBeVisible();
});

test("D2.06 muestra reasoning-record requirement", async ({ page }) => {
  await page.goto("/actividad/legitimate_interest.assessment");
  const trace = page.locator(".trace-table");
  await expect(trace.getByText("Requerido", { exact: true })).toBeVisible();
  await expect(page.getByText("Reasoning Record de interés legítimo")).toBeVisible();
});

test("D2.08 distingue legal basis de agency-standard evidence", async ({ page }) => {
  await page.goto("/actividad/retention.schedule");
  await expect(page.getByText("Estándar metodológico").first()).toBeVisible();
  await expect(page.getByText("Artículo 3 letra c)").first()).toBeVisible();
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
      .getByRole("region", { name: "Cuándo aplica" })
      .getByText("personal data obtained for requested precontractual measures = yes"),
  ).toBeVisible();
  await expect(
    page.locator(".dep-item").getByRole("link", { name: /lawful_basis\.assign/ }),
  ).toBeVisible();
});

test("/fuentes continúa con las dos fuentes y provisiones actualizadas", async ({
  page,
}) => {
  await page.goto("/fuentes");
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
    "/dominios/d2",
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
