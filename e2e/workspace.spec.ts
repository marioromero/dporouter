import { expect, test } from "@playwright/test";
import { STORAGE_KEY } from "../src/workspace/store";

async function crearEmpresa(page: import("@playwright/test").Page, perfil: string, empresa: string) {
  await page.goto("/empresa");
  await page.getByLabel("Nombre del perfil local").fill(perfil);
  await page.getByRole("button", { name: "Crear perfil" }).click();
  await page.getByLabel("Nombre de la empresa").fill(empresa);
  await page.getByRole("button", { name: "Crear empresa" }).click();
  await expect(page.getByRole("heading", { name: empresa })).toBeVisible();
}

test("vista normal sin máquina, sin trazabilidad y con vigencia única", async ({ page }) => {
  await page.goto("/actividad/dpo.need_assessment");
  await expect(page.getByText("client.roles_present")).toHaveCount(0);
  await expect(page.getByText("Trazabilidad técnica")).toHaveCount(0);
  await expect(page.getByText("Vigencia diferida")).toHaveCount(0);
  await expect(page.getByText("agency_standard")).toHaveCount(0);
  await expect(page.getByText("transitional")).toHaveCount(0);
  await expect(
    page.getByText("Nuevo régimen de protección de datos: vigencia desde 01-12-2026"),
  ).toHaveCount(1);
  await expect(page.getByText("Qué se busca resolver")).toBeVisible();
  await expect(page.getByText("Guía operativa pendiente de incorporar")).toHaveCount(0);
});

test("actividad sin protocolo declara guía pendiente sin fingir", async ({ page }) => {
  await page.goto("/actividad/governance.preventive_framework");
  await expect(page.getByText("Guía operativa pendiente de incorporar")).toBeVisible();
  await expect(page.getByTestId("actividad-guia")).toHaveCount(0);
});

test("sticky context nav con dominios, actividades y anterior/siguiente", async ({ page }) => {
  await page.goto("/trabajo/d1");
  const nav = page.getByTestId("contextnav-domains");
  await expect(nav.getByRole("link", { name: "D1", exact: true })).toHaveAttribute("aria-current", "page");
  const position = await nav.evaluate((el) => getComputedStyle(el.parentElement as Element).position);
  expect(position).toBe("sticky");
  await expect(page.getByTestId("contextnav-activities").getByRole("link", { name: "D1.02" })).toBeVisible();
  await page.goto("/actividad/governance.preventive_framework");
  await page.getByRole("link", { name: "Siguiente →" }).click();
  await expect(page).toHaveURL(/\/actividad\/dpo\.need_assessment$/);
  await page.getByRole("link", { name: "← Anterior" }).click();
  await expect(page).toHaveURL(/\/actividad\/governance\.preventive_framework$/);
});

test("guía muestra nodos con estado y permite revisitar", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto("/actividad/dpo.need_assessment/guia/mpi-status");
  await expect(page.getByTestId("contextnav-nodes")).toBeVisible();
  await page.getByTestId("guia-option-not_adopted").click();
  await page.getByTestId("guia-continue").click();
  const strip = page.getByTestId("contextnav-nodes");
  await expect(strip.getByRole("link", { name: /Estado actual del MPI/ })).toContainText("●");
  await strip.getByRole("link", { name: /Estado actual del MPI/ }).click();
  await expect(page).toHaveURL(/\/guia\/mpi-status$/);
});

test("cambio de empresa cambia progreso y guía; reload conserva", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto("/actividad/governance.preventive_framework");
  await page.getByTestId("estado-reviewed").click();
  await expect(page.getByTestId("actividad-estado")).toContainText("Revisado");
  await expect(page.getByText("Cumple")).toHaveCount(0);
  await page.goto("/empresa");
  await page.getByLabel("Asociar otra empresa").fill("Empresa Beta");
  await page.getByRole("button", { name: "Agregar empresa" }).click();
  await expect(page.getByRole("heading", { name: "Empresa Beta" })).toBeVisible();
  await expect(page.getByTestId("empresa-conteo")).toContainText("0 de 38 actividades revisadas");
  await page.goto("/actividad/governance.preventive_framework");
  await expect(page.getByTestId("actividad-estado")).toContainText("No iniciado");
  await page.goto("/empresa");
  await page.getByLabel("Empresa activa").selectOption({ label: "Empresa Alfa" });
  await expect(page.getByTestId("empresa-conteo")).toContainText("1 de 38 actividades revisadas");
  await page.reload();
  await expect(page.getByTestId("empresa-conteo")).toContainText("1 de 38 actividades revisadas");
});

test("exportar e importar JSON recupera estado", async ({ page }) => {
  page.on("dialog", (d) => void d.accept());
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto("/actividad/governance.preventive_framework");
  await page.getByTestId("estado-reviewed").click();
  await page.goto("/empresa");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar respaldo JSON" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.goto("/actividad/governance.preventive_framework");
  await page.getByTestId("estado-not_started").click();
  await page.goto("/empresa");
  await expect(page.getByTestId("empresa-conteo")).toContainText("0 de 38 actividades revisadas");
  await page.locator('input[aria-label="Archivo de respaldo JSON"]').setInputFiles(path as string);
  await expect(page.getByTestId("empresa-conteo")).toContainText("1 de 38 actividades revisadas");
  await expect(page.getByText("No se pudo importar")).toHaveCount(0);
});

test("importar JSON inválido se rechaza con mensaje", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto("/empresa");
  await page.locator('input[aria-label="Archivo de respaldo JSON"]').setInputFiles({
    name: "mal.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"id": 1}'),
  });
  await expect(page.getByText("No se pudo importar")).toBeVisible();
});

test("diagnóstico alimenta la guía como dato ya disponible por empresa", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto("/diagnostico");
  await page.getByLabel("Estado del MPI (caracterización)").selectOption("not_adopted");
  await page.getByRole("button", { name: "Registrar hecho" }).click();
  await expect(page.getByTestId("diagnostico-facts")).toContainText("No adoptado");
  await page.goto("/actividad/dpo.need_assessment/guia/mpi-status");
  await expect(page.getByTestId("guia-option-not_adopted")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("guia-provided")).toBeVisible();
});

test("empresa muestra continuar, sugerencia y conteo factual", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto("/actividad/treatment.inventory_create");
  await page.getByTestId("estado-in_review").click();
  await page.goto("/empresa");
  await expect(page.getByTestId("empresa-continuar").getByRole("link", { name: "D2.01 · Crear inventario maestro de tratamientos" }).first()).toBeVisible();
  await expect(page.getByText("Siguiente revisión sugerida")).toBeVisible();
  await expect(page.getByTestId("empresa-conteo")).toContainText("0 de 38 actividades revisadas");
  await expect(page.getByText("Crear inventario maestro de tratamientos").first()).toBeVisible();
});

test("workspace sin overflow en desktop y tablet", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  for (const path of ["/empresa", "/trabajo", "/trabajo/d1", "/actividad/dpo.need_assessment", "/actividad/dpo.need_assessment/guia/mpi-status", "/diagnostico"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
  }
});

test("empresa heredada sin campos nuevos abre Empresa sin romper", async ({ page }) => {
  const at = new Date().toISOString();
  // Siembra única (addInitScript re-ejecutaría en cada recarga y pisaría
  // el estado guardado por la app).
  await page.goto("/");
  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    {
      key: STORAGE_KEY,
      value: JSON.stringify({
        version: 1,
        profiles: [
          {
            id: "p1",
            name: "P",
            createdAt: at,
            companyIds: ["emp-vieja"],
            activeCompanyId: "emp-vieja",
          },
        ],
        activeProfileId: "p1",
        companies: {
          "emp-vieja": {
            id: "emp-vieja",
            name: "Vieja SpA",
            createdAt: at,
            updatedAt: at,
            activityStates: {},
          },
        },
      }),
    },
  );
  await page.goto("/empresa");
  await expect(page.getByRole("heading", { name: "Vieja SpA" })).toBeVisible();
  await expect(page.getByTestId("empresa-conteo")).toContainText("0 de 38 actividades revisadas");
  // Y la empresa migrada sigue operable: marcar revisión persiste.
  await page.goto("/actividad/governance.preventive_framework");
  await page.getByTestId("estado-reviewed").click();
  await expect(page.getByTestId("actividad-estado")).toContainText("Revisado");
  await page.reload();
  await expect(page.getByTestId("actividad-estado")).toContainText("Revisado");
});
