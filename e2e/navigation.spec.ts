import { expect, test } from "@playwright/test";

const NAV_LABELS = [
  "Inicio",
  "Diagnóstico / Caracterización",
  "Mapa de cumplimiento",
  "Dominios",
  "Buscar",
  "Fuentes y estado normativo",
];

test("inicio carga y expone las seis áreas de navegación", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Protección de datos, llevada a ejecución" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Áreas principales" });
  for (const label of NAV_LABELS) {
    await expect(nav.getByRole("link", { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
  }
});

test("dominios contiene D1-D12 en orden", async ({ page }) => {
  await page.goto("/dominios");
  for (const code of ["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12"]) {
    await expect(page.getByText(code, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText("Privacy by design, riesgo y EIPD")).toBeVisible();
});

test("D8 puede abrirse mediante deep link y recargar conserva destino", async ({ page }) => {
  await page.goto("/dominios/d8");
  await expect(page.getByRole("heading", { name: "Privacy by design, riesgo y EIPD" })).toBeVisible();
  await expect(page.getByText("0 actividades importadas")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Privacy by design, riesgo y EIPD" })).toBeVisible();
});

test("dominio inválido produce not-found", async ({ page }) => {
  await page.goto("/dominios/dx");
  await expect(page.getByRole("heading", { name: "No encontramos este contenido" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir al inicio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar dominios" })).toBeVisible();
});

test("actividad DEMO abre directa, recarga conserva destino y muestra banner", async ({ page }) => {
  await page.goto("/actividad/demo.activity_view");
  await expect(page.getByText("DEMOSTRACIÓN DE INTERFAZ · CONTENIDO NO CANÓNICO")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Actividad de demostración" })).toBeVisible();
  await expect(page.getByText("DEMO-01")).toBeVisible();
  await page.reload();
  await expect(page.getByText("DEMOSTRACIÓN DE INTERFAZ · CONTENIDO NO CANÓNICO")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Actividad de demostración" })).toBeVisible();
});

test("mapa abre Map Mode y guiado abre Diagnóstico", async ({ page }) => {
  await page.goto("/mapa");
  await expect(page.getByText("MODO MAPA")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mapa de cumplimiento" })).toBeVisible();
  await page.goto("/diagnostico");
  await expect(page.getByText("MODO GUIADO")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Diagnóstico / Caracterización" })).toBeVisible();
});

test("buscar encuentra dominios y maneja estados vacíos", async ({ page }) => {
  await page.goto("/buscar");
  await expect(page.getByText("Escribe un término para comenzar.")).toBeVisible();
  await page.getByLabel("Buscar").fill("riesgo");
  await expect(page.getByText("Privacy by design, riesgo y EIPD")).toBeVisible();
  await expect(page.getByText("La búsqueda de actividades se habilitará al importar las definiciones canónicas D1–D12.")).toBeVisible();
  await page.getByLabel("Buscar").fill("zzz-sin-coincidencia");
  await expect(page.getByText("No encontramos coincidencias.")).toBeVisible();
});

test("sin overflow horizontal accidental en vistas principales", async ({ page }) => {
  for (const path of ["/", "/diagnostico", "/mapa", "/dominios", "/dominios/d8", "/actividad/demo.activity_view", "/buscar", "/fuentes"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
  }
});
