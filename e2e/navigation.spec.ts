import { expect, test } from "@playwright/test";

const NAV_LABELS = [
  "Empresa",
  "Trabajo",
  "Diagnóstico",
  "Buscar",
  "Referencias",
];

test("inicio carga y expone las cinco áreas de navegación", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Protección de datos, llevada a ejecución" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Áreas principales" });
  for (const label of NAV_LABELS) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "Mapa de cumplimiento" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Dominios" })).toHaveCount(0);
});

test("trabajo contiene D1-D12 en orden sin duplicar mapa/dominios", async ({ page }) => {
  await page.goto("/trabajo");
  for (const code of ["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12"]) {
    await expect(page.getByText(code, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText("Privacy by design, riesgo y EIPD")).toBeVisible();
});

test("rutas antiguas redirigen sin romper deep links", async ({ page }) => {
  await page.goto("/mapa");
  await expect(page).toHaveURL(/\/trabajo$/);
  await page.goto("/dominios");
  await expect(page).toHaveURL(/\/trabajo$/);
  await page.goto("/dominios/d1");
  await expect(page).toHaveURL(/\/trabajo\/d1$/);
  await expect(page.getByText("20 actividades importadas")).toBeVisible();
  await page.goto("/fuentes");
  await expect(page).toHaveURL(/\/referencias$/);
  await expect(page.getByRole("heading", { name: "Referencias" })).toBeVisible();
});

test("D8 puede abrirse mediante deep link y recargar conserva destino", async ({ page }) => {
  await page.goto("/trabajo/d8");
  await expect(page.getByRole("heading", { name: "Privacy by design, riesgo y EIPD" })).toBeVisible();
  await expect(page.getByText("0 actividades importadas")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Privacy by design, riesgo y EIPD" })).toBeVisible();
});

test("dominio inválido produce not-found", async ({ page }) => {
  await page.goto("/trabajo/dx");
  await expect(page.getByRole("heading", { name: "No encontramos este contenido" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir al inicio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar trabajo" })).toBeVisible();
});

test("actividad DEMO abre directa, recarga conserva destino y muestra banner", async ({ page }) => {
  await page.goto("/actividad/demo.activity_view");
  await expect(page.getByText("DEMOSTRACIÓN DE INTERFAZ · CONTENIDO NO CANÓNICO")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Actividad de demostración" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("DEMOSTRACIÓN DE INTERFAZ · CONTENIDO NO CANÓNICO")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Actividad de demostración" })).toBeVisible();
});

test("trabajo abre Trabajo y diagnostico abre Diagnóstico", async ({ page }) => {
  await page.goto("/trabajo");
  await expect(page.getByText("TRABAJO").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trabajo" })).toBeVisible();
  await page.goto("/diagnostico");
  await expect(page.getByText("GUIADO").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Diagnóstico" })).toBeVisible();
});

test("buscar encuentra dominios y maneja estados vacíos", async ({ page }) => {
  await page.goto("/buscar");
  await expect(page.getByText("Escribe un término para comenzar.").first()).toBeVisible();
  await page.getByLabel("Buscar").fill("riesgo");
  await expect(page.getByText("Privacy by design, riesgo y EIPD")).toBeVisible();
  await page.getByLabel("Buscar").fill("DPO");
  await expect(page.getByText("Designar DPO")).toBeVisible();
  await page.getByLabel("Buscar").fill("zzz-sin-coincidencia");
  await expect(page.getByText("No encontramos coincidencias.")).toHaveCount(2);
});

test("sin overflow horizontal accidental en vistas principales", async ({ page }) => {
  for (const path of ["/", "/empresa", "/trabajo", "/trabajo/d8", "/diagnostico", "/actividad/demo.activity_view", "/buscar", "/referencias"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
  }
});
