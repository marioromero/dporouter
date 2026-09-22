import { expect, test } from "@playwright/test";

const ACTIVITY = "/actividad/dpo.need_assessment";
const GUIA = `${ACTIVITY}/guia`;

async function answerAndContinue(page: import("@playwright/test").Page, value: string) {
  await page.getByTestId(`guia-option-${value}`).click();
  await page.getByTestId("guia-continue").click();
}

/** Responde las 7 preguntas profesionales con "no" salvo overrides. */
async function answerProfessional(
  page: import("@playwright/test").Page,
  overrides: Record<string, "yes" | "no" | "unknown"> = {},
) {
  const nodes: Array<[string, "yes" | "no" | "unknown"]> = [
    ["high-impact-data", overrides["high-impact-data"] ?? "no"],
    ["large-scale", overrides["large-scale"] ?? "no"],
    ["automated-significant-effects", overrides["automated-significant-effects"] ?? "no"],
    ["systematic-public-monitoring", overrides["systematic-public-monitoring"] ?? "no"],
    ["international-transfers", overrides["international-transfers"] ?? "no"],
    ["processor-complexity", overrides["processor-complexity"] ?? "no"],
    ["privacy-maturity", overrides["privacy-maturity"] ?? "no"],
  ];
  for (const [node, value] of nodes) {
    await expect(page).toHaveURL(new RegExp(`/guia/${node}$`));
    await answerAndContinue(page, value);
  }
}

test("D1.02 muestra Evaluación guiada con Iniciar evaluación", async ({ page }) => {
  await page.goto(ACTIVITY);
  await expect(page.getByTestId("actividad-guia")).toBeVisible();
  await expect(page.getByText("Evaluación guiada").first()).toBeVisible();
  await expect(
    page.getByText(
      "Responde los factores relevantes y el sistema determinará si existe obligación derivada del MPI o el nivel de recomendación profesional aplicable.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Iniciar evaluación" })).toBeVisible();
});

test("otras actividades no muestran Evaluación guiada", async ({ page }) => {
  await page.goto("/actividad/governance.preventive_framework");
  await expect(page.getByTestId("actividad-guia")).toHaveCount(0);
});

test("botón inicia protocolo y cada nodo es navegable", async ({ page }) => {
  await page.goto(ACTIVITY);
  await page.getByRole("link", { name: "Iniciar evaluación" }).click();
  await expect(page).toHaveURL(new RegExp("/guia$"));
  await expect(page.getByTestId("guia-entry")).toBeVisible();
  await page.getByRole("link", { name: "Iniciar evaluación" }).click();
  await expect(page).toHaveURL(new RegExp("/guia/mpi-status$"));
  await expect(page.getByText("¿Cuál es el estado actual del Modelo de Prevención de Infracciones?")).toBeVisible();
  await expect(page.getByText("8 antecedentes resueltos").first()).toBeVisible();
});

test("caso MPI activo termina en DPO requerido", async ({ page }) => {
  await page.goto(`${GUIA}/mpi-status`);
  await page.getByTestId("guia-option-implementing").click();
  await page.getByTestId("guia-continue").click();
  await expect(page).toHaveURL(new RegExp("/guia/resultado$"));
  await expect(page.getByTestId("guia-outcome-label")).toContainText("DPO requerido por MPI");
  await expect(page.getByText("Obligación legal").first()).toBeVisible();
  await expect(page.getByTestId("guia-outcome-rule")).toContainText("mpi-active");
});

test("caso strongly recommended funciona y explica reglas y factores", async ({ page }) => {
  await page.goto(`${GUIA}/mpi-status`);
  await answerAndContinue(page, "not_adopted");
  await answerProfessional(page, { "high-impact-data": "yes", "large-scale": "yes" });
  // La última continuación aterriza en el nodo decisión, que rendea el resultado.
  await expect(page).toHaveURL(new RegExp("/guia/final-decision$"));
  await expect(page.getByTestId("guia-outcome-label")).toContainText("DPO fuertemente recomendado");
  await expect(page.getByText("Estándar metodológico").first()).toBeVisible();
  await expect(page.getByTestId("guia-outcome-rule")).toContainText("strong-A");
  const factors = page.getByTestId("guia-factors");
  await expect(factors.getByText("Datos de impacto especial")).toBeVisible();
  await expect(factors.getByText("Factor positivo").first()).toBeVisible();
});

test("caso recommended funciona", async ({ page }) => {
  await page.goto(`${GUIA}/mpi-status`);
  await answerAndContinue(page, "not_adopted");
  await answerProfessional(page, {
    "high-impact-data": "yes",
    "international-transfers": "yes",
  });
  await expect(page.getByTestId("guia-outcome-label")).toContainText("DPO recomendado");
  await expect(page.getByTestId("guia-outcome-rule")).toContainText("recommended-two");
});

test("caso not priority funciona sin decir DPO no necesario", async ({ page }) => {
  await page.goto(`${GUIA}/mpi-status`);
  await answerAndContinue(page, "not_adopted");
  await answerProfessional(page);
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "DPO no prioritario según metodología actual",
  );
  await expect(page.getByTestId("guia-outcome")).not.toContainText("DPO no necesario");
});

test("unknown genera evaluación incompleta con siguiente antecedente", async ({ page }) => {
  await page.goto(`${GUIA}/mpi-status`);
  await answerAndContinue(page, "not_adopted");
  await answerProfessional(page, { "large-scale": "unknown" });
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Evaluación incompleta");
  await expect(page.getByTestId("guia-outcome-rule")).toContainText("incomplete");
  await expect(page.getByText("Antecedentes pendientes (1)")).toBeVisible();
  await page.getByRole("link", { name: "Resolver siguiente antecedente" }).click();
  await expect(page).toHaveURL(new RegExp("/guia/large-scale$"));
});

test("back y revisión de respuestas funciona", async ({ page }) => {
  await page.goto(`${GUIA}/mpi-status`);
  await answerAndContinue(page, "not_adopted");
  await expect(page).toHaveURL(new RegExp("/guia/high-impact-data$"));
  await page.getByTestId("guia-option-yes").click();
  // Revisar: cambiar la respuesta antes de continuar.
  await page.getByTestId("guia-option-no").click();
  await page.getByTestId("guia-continue").click();
  await expect(page).toHaveURL(new RegExp("/guia/large-scale$"));
  // Volver mediante antecedentes ya respondidos y verificar valor.
  await page.getByRole("link", { name: "Datos de impacto especial" }).first().click();
  await expect(page.getByTestId("guia-option-no")).toHaveAttribute("aria-pressed", "true");
});

test("siguiente paso D1.08 navega correctamente", async ({ page }) => {
  await page.goto(`${GUIA}/mpi-status`);
  await answerAndContinue(page, "not_adopted");
  await answerProfessional(page);
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "no prioritario",
  );
  await page.goto(`${GUIA}/mpi-status`);
  await answerAndContinue(page, "implementing");
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Continuar con designación de DPO" })
    .click();
  await expect(page.getByRole("heading", { name: "Designar DPO" })).toBeVisible();
  expect(page.url()).toContain("/actividad/dpo.designate");
});

test("nodo posterior abre directo sin exigir nodos previos no dependientes", async ({ page }) => {
  await page.goto(`${GUIA}/large-scale`);
  await expect(page.getByText("¿Existe tratamiento masivo o a gran escala?")).toBeVisible();
  // Sin dependencias semánticas: accesible, sin aviso de prerrequisitos.
  await expect(page.getByTestId("guia-prerequisites")).toHaveCount(0);
  // Responder crea sesión transitoria y permite continuar.
  await page.getByTestId("guia-option-no").click();
  await page.getByTestId("guia-continue").click();
  await expect(page).toHaveURL(new RegExp("/guia/automated-significant-effects$"));
});

test("final-decision directo sin sesión no inventa conclusión", async ({ page }) => {
  await page.goto(`${GUIA}/final-decision`);
  await expect(page.getByTestId("guia-pending")).toContainText("Evaluación en curso");
  await expect(page.getByTestId("guia-outcome")).toHaveCount(0);
  await page.getByRole("link", { name: /Continuar/ }).click();
  await expect(page).toHaveURL(new RegExp("/guia/mpi-status$"));
});

test("reload de nodo funciona y resultado sin sesión no inventa conclusión", async ({ page }) => {
  await page.goto(`${GUIA}/large-scale`);
  await page.reload();
  await expect(page.getByText("¿Existe tratamiento masivo o a gran escala?")).toBeVisible();
  await page.goto(`${GUIA}/resultado`);
  await expect(page.getByTestId("guia-pending")).toContainText("Evaluación en curso");
  await expect(page.getByTestId("guia-outcome")).toHaveCount(0);
});

test("copiar link funciona", async ({ page }) => {
  await page.goto(`${GUIA}/mpi-status`);
  await page.getByRole("button", { name: "Copiar enlace" }).click();
  await expect(page.getByText("Enlace copiado")).toBeVisible();
});

test("reiniciar limpia sesión del protocolo y continuar aparece en actividad", async ({
  page,
}) => {
  await page.goto(`${GUIA}/mpi-status`);
  await answerAndContinue(page, "not_adopted");
  // Navegación SPA (sin reload) para conservar la sesión transitoria.
  await page.getByRole("link", { name: /Volver a actividad/ }).click();
  await expect(page).toHaveURL(new RegExp("/actividad/dpo.need_assessment$"));
  await expect(
    page.getByRole("link", { name: "Continuar evaluación" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continuar evaluación" }).click();
  await expect(page.getByTestId("guia-entry")).toBeVisible();
  await expect(page.getByTestId("guia-progress")).toContainText("1 de 8");
  await page.getByRole("button", { name: "Reiniciar evaluación" }).click();
  await expect(page.getByTestId("guia-progress")).toContainText("0 de 8");
  await page.getByRole("link", { name: /Volver a actividad/ }).click();
  await expect(page.getByRole("link", { name: "Iniciar evaluación" })).toBeVisible();
});

test("guía sin overflow en desktop y tablet", async ({ page }) => {
  for (const path of [
    ACTIVITY,
    GUIA,
    `${GUIA}/mpi-status`,
    `${GUIA}/large-scale`,
    `${GUIA}/resultado`,
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
  }
});
