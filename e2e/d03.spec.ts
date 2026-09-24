import { expect, test } from "@playwright/test";

async function answerAndContinue(page: import("@playwright/test").Page, value: string) {
  await page.getByTestId(`guia-option-${value}`).click();
  await page.getByTestId("guia-continue").click();
}

test("/trabajo/d3 muestra 6 actividades importadas", async ({ page }) => {
  await page.goto("/trabajo/d3");
  await expect(page.getByText("6 actividades importadas")).toBeVisible();
  await expect(page.getByText("Estructurar y verificar la política pública de tratamiento")).toBeVisible();
});

async function crearEmpresa(page: import("@playwright/test").Page, perfil: string, empresa: string) {
  await page.goto("/empresa");
  await page.getByLabel("Nombre del perfil local").fill(perfil);
  await page.getByRole("button", { name: "Crear perfil" }).click();
  await page.getByLabel("Nombre de la empresa").fill(empresa);
  await page.getByRole("button", { name: "Crear empresa" }).click();
  await expect(page.getByRole("heading", { name: empresa })).toBeVisible();
}

async function crearTratamientoYFinalidad(page: import("@playwright/test").Page) {
  await page.goto("/empresa");
  await page.getByLabel("Nombre del tratamiento").fill("Newsletter");
  await page.getByRole("button", { name: "Agregar tratamiento" }).click();
  await page.getByLabel("Descripción de la finalidad").fill("Envío de boletín");
  await page.getByRole("button", { name: "Agregar finalidad" }).click();
  await page.getByRole("button", { name: "Envío de boletín", exact: true }).click();
}

test("D3.01–D3.03 ofrecen guía según modo", async ({ page }) => {
  await page.goto("/actividad/transparency.policy_assemble");
  await expect(page.getByRole("link", { name: "Iniciar procedimiento" })).toBeVisible();
  await page.goto("/actividad/transparency.publication_validate");
  await expect(page.getByRole("link", { name: "Iniciar revisión" })).toBeVisible();
  await crearEmpresa(page, "Perfil D3", "Empresa D3");
  await crearTratamientoYFinalidad(page);
  await page.goto("/actividad/consent.mechanism_design");
  // Con sesión vacía la compuerta deriva a resultado (sin ruta);
  // en ambos casos hay enlace real a la guía, nunca pendiente.
  await expect(page.getByTestId("actividad-accion").getByRole("link").first()).toBeVisible();
  await expect(page.getByText("Guía operativa pendiente de incorporar")).toHaveCount(0);
});

test("D3.01 completa termina en Política estructurada", async ({ page }) => {
  await page.goto("/actividad/transparency.policy_assemble/guia/check-adoption");
  for (let i = 0; i < 10; i++) {
    await answerAndContinue(page, "yes");
  }
  await expect(page).toHaveURL(new RegExp("/guia/synthesis$"));
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Política estructurada");
});

test("D3.03 sin ruta de consentimiento queda sin prerrequisito", async ({ page }) => {
  await crearEmpresa(page, "Perfil D3b", "Empresa D3b");
  await crearTratamientoYFinalidad(page);
  await page.goto("/actividad/consent.mechanism_design/guia/check-purpose");
  for (let i = 0; i < 9; i++) {
    await answerAndContinue(page, "yes");
  }
  await expect(page).toHaveURL(new RegExp("/guia/synthesis$"));
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Sin ruta de consentimiento");
});

test("D3.02 sin D3.01 queda en política pendiente", async ({ page }) => {
  await page.goto("/actividad/transparency.publication_validate/guia/check-medium");
  for (let i = 0; i < 7; i++) {
    await answerAndContinue(page, "yes");
  }
  await expect(page).toHaveURL(new RegExp("/guia/synthesis$"));
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Política pendiente de estructurar",
  );
});
