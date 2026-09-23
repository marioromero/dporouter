import { expect, test } from "@playwright/test";

const D104 = "/actividad/mpi.formalize_adoption";
const D109 = "/actividad/dpo.initial_governance_validation";
const D103 = "/actividad/mpi.need_assessment";

async function answerAndContinue(page: import("@playwright/test").Page, value: string) {
  await page.getByTestId(`guia-option-${value}`).click();
  await page.getByTestId("guia-continue").click();
}

test("V2 muestra CTA correcto según mode y D1.03 pendiente honesto", async ({ page }) => {
  await page.goto(D104);
  await expect(page.getByRole("link", { name: "Iniciar procedimiento" })).toBeVisible();
  await page.goto(D109);
  await expect(page.getByRole("link", { name: "Iniciar revisión" })).toBeVisible();
  await page.goto(D104);
  await page.getByRole("link", { name: "Iniciar procedimiento" }).click();
  await expect(page).toHaveURL(/\/guia$/);
  await expect(
    page.getByTestId("guia-entry").getByRole("link", { name: "Iniciar procedimiento" }),
  ).toBeVisible();
  await page.goto(D103);
  await expect(page.getByRole("link", { name: "Iniciar evaluación" })).toBeVisible();
  await expect(page.getByText("Guía operativa pendiente de incorporar")).toHaveCount(0);
});

test("D1.04 completo deriva a designación sin reformular DPO", async ({ page }) => {
  await page.goto(`${D104}/guia/adoption-decision`);
  await answerAndContinue(page, "yes");
  for (const node of ["adoption-evidence", "lifecycle-update", "dpo-requirement"]) {
    await expect(page).toHaveURL(new RegExp(`/guia/${node}$`));
    await answerAndContinue(page, "yes");
  }
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Adopción formalizada y evidenciada",
  );
  await expect(page.getByTestId("guia-outcome-rule")).toContainText(
    "Todas las verificaciones",
  );
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Con el requerimiento activo, continuar con designación de DPO" })
    .click();
  await expect(page.getByRole("heading", { name: "Designar DPO" })).toBeVisible();
});

test("D1.04 sin decisión deriva a D1.03 sin recrearlo", async ({ page }) => {
  await page.goto(`${D104}/guia/adoption-decision`);
  await answerAndContinue(page, "no");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Aún sin decisión de adoptar",
  );
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Evaluar conveniencia de adoptar en D1.03" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Evaluar conveniencia de adoptar MPI" }),
  ).toBeVisible();
});

test("D1.04 pendiente no completa y muestra qué falta", async ({ page }) => {
  await page.goto(`${D104}/guia/adoption-decision`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "no");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Formalización en curso");
  await expect(page.getByTestId("guia-factors")).toContainText("Pendiente");
});

test("D1.09 validado enlaza modelo operativo", async ({ page }) => {
  await page.goto(`${D109}/guia/designation-gate`);
  await answerAndContinue(page, "yes");
  for (const node of [
    "check-reporting-line",
    "check-autonomy",
    "check-conflicts",
    "check-resources",
    "check-suitability",
    "check-access",
  ]) {
    await expect(page).toHaveURL(new RegExp(`/guia/${node}$`));
    await answerAndContinue(page, "yes");
  }
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Gobernanza inicial validada",
  );
  await expect(page.getByTestId("guia-outcome-rule")).toContainText(
    "revisados y satisfactorios",
  );
  const body = (await page.textContent("body")) ?? "";
  expect(body).not.toContain("score");
  expect(body).not.toContain("Cumple");
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Utilizar la validación en el modelo operativo (D1.11)" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Establecer modelo operativo del DPO" }),
  ).toBeVisible();
});

test("D1.09 sin designación deriva a D1.08", async ({ page }) => {
  await page.goto(`${D109}/guia/designation-gate`);
  await answerAndContinue(page, "no");
  await expect(page.getByTestId("guia-outcome-label")).toContainText("DPO aún no designado");
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Designar DPO en D1.08" })
    .click();
  await expect(page.getByRole("heading", { name: "Designar DPO" })).toBeVisible();
});

test("D1.09 brecha produce remediación con factores", async ({ page }) => {
  await page.goto(`${D109}/guia/designation-gate`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "no");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Requiere acciones correctivas",
  );
  await expect(page.getByTestId("guia-factors")).toContainText("Requiere acción o corrección");
  await expect(page.getByText("Registra cada brecha detectada")).toBeVisible();
});

test("D1.09 unknown produce información insuficiente con resolver", async ({ page }) => {
  await page.goto(`${D109}/guia/designation-gate`);
  await answerAndContinue(page, "yes");
  for (let i = 0; i < 5; i++) {
    await answerAndContinue(page, "yes");
  }
  await answerAndContinue(page, "unknown");
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Información insuficiente");
  await page.getByRole("link", { name: "Resolver siguiente antecedente" }).click();
  await expect(page).toHaveURL(new RegExp("/guia/check-access$"));
});

test("checks resolvibles en cualquier orden sin aviso posicional", async ({ page }) => {
  await page.goto(`${D109}/guia/check-access`);
  await expect(page.getByTestId("guia-prerequisites")).toHaveCount(0);
  await expect(page.getByText("¿El DPO puede acceder a la información y operaciones relevantes?")).toBeVisible();
});

test("deep links, reload, copiar y reinicio del batch", async ({ page }) => {
  await page.goto(`${D104}/guia/lifecycle-update`);
  await page.reload();
  await expect(page.getByText("¿Quedó registrado el ciclo de vida del MPI como adopción formalizada?")).toBeVisible();
  await page.getByRole("button", { name: "Copiar enlace" }).click();
  await expect(page.getByText("Enlace copiado")).toBeVisible();
  await page.getByTestId("guia-option-yes").click();
  await page.getByTestId("guia-continue").click();
  await page.getByRole("button", { name: "Reiniciar evaluación" }).click();
  await expect(page.getByTestId("guia-progress")).toContainText("0 de 4");
});

test("D1.04 por empresa: progreso independiente", async ({ page }) => {
  await page.goto("/empresa");
  await page.getByLabel("Nombre del perfil local").fill("Perfil Batch");
  await page.getByRole("button", { name: "Crear perfil" }).click();
  await page.getByLabel("Nombre de la empresa").fill("Empresa Uno");
  await page.getByRole("button", { name: "Crear empresa" }).click();
  await page.goto(`${D104}/guia/adoption-decision`);
  await answerAndContinue(page, "yes");
  await page.goto(`${D104}/guia`);
  await expect(page.getByTestId("guia-progress")).toContainText("1 de 4");
  await page.goto("/empresa");
  await page.getByLabel("Asociar otra empresa").fill("Empresa Dos");
  await page.getByRole("button", { name: "Agregar empresa" }).click();
  await page.goto(`${D104}/guia`);
  await expect(page.getByTestId("guia-progress")).toContainText("0 de 4");
});

test("batch sin overflow en desktop y tablet", async ({ page }) => {
  for (const path of [
    D104,
    D109,
    D103,
    `${D104}/guia/adoption-evidence`,
    `${D109}/guia/check-conflicts`,
    `${D109}/guia/resultado`,
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
  }
});
