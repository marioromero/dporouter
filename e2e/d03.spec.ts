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

test("D3.01 ofrece guía y D3.03 declara pendiente honesto", async ({ page }) => {
  await page.goto("/actividad/transparency.policy_assemble");
  await expect(page.getByRole("link", { name: "Iniciar procedimiento" })).toBeVisible();
  await page.goto("/actividad/transparency.publication_validate");
  await expect(page.getByRole("link", { name: "Iniciar revisión" })).toBeVisible();
  await page.goto("/actividad/consent.mechanism_design");
  await expect(page.getByText("Guía operativa pendiente de incorporar")).toBeVisible();
  await expect(page.getByTestId("actividad-guia")).toHaveCount(0);
});

test("D3.01 completa termina en Política estructurada", async ({ page }) => {
  await page.goto("/actividad/transparency.policy_assemble/guia/check-adoption");
  for (let i = 0; i < 10; i++) {
    await answerAndContinue(page, "yes");
  }
  await expect(page).toHaveURL(new RegExp("/guia/synthesis$"));
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Política estructurada");
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
