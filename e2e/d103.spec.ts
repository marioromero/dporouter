import { expect, test } from "@playwright/test";

const ACTIVITY = "/actividad/mpi.need_assessment";
const GUIA = `${ACTIVITY}/guia`;

async function crearEmpresa(page: import("@playwright/test").Page, perfil: string, empresa: string) {
  await page.goto("/empresa");
  await page.getByLabel("Nombre del perfil local").fill(perfil);
  await page.getByRole("button", { name: "Crear perfil" }).click();
  await page.getByLabel("Nombre de la empresa").fill(empresa);
  await page.getByRole("button", { name: "Crear empresa" }).click();
  await expect(page.getByRole("heading", { name: empresa })).toBeVisible();
}

async function answerAndContinue(page: import("@playwright/test").Page, value: string) {
  await page.getByTestId(`guia-option-${value}`).click();
  await page.getByTestId("guia-continue").click();
}

/** Responde los 4 factores canónicos con "yes". */
async function answerFactors(page: import("@playwright/test").Page) {
  for (const node of [
    "factor-voluntariness",
    "factor-exposure",
    "factor-capacity",
    "factor-convenience",
  ]) {
    await expect(page).toHaveURL(new RegExp(`/guia/${node}$`));
    await answerAndContinue(page, "yes");
  }
}

async function adoptConclusion(
  page: import("@playwright/test").Page,
  value: "recommended" | "worth_considering" | "not_priority",
) {
  await expect(page).toHaveURL(new RegExp("/guia/adopt-conclusion$"));
  await expect(page.getByTestId("juicio-conclusion")).toBeVisible();
  await page.getByTestId(`juicio-opcion-${value}`).click();
  await page.getByLabel("Referencias de evidencia (una por línea)").fill("Acta 2026-09-01");
  await page.getByLabel("Razonamiento").fill("Exposición alta y capacidad suficiente justifican el programa.");
  await page.getByLabel("Quien adopta la conclusión").fill("Jefa de Compliance");
  await page.getByRole("button", { name: "Adoptar conclusión profesional" }).click();
}

test("D1.03 ofrece guía de juicio sin calcular la conclusión", async ({ page }) => {
  await page.goto(ACTIVITY);
  await expect(page.getByRole("heading", { name: "Evaluar conveniencia de adoptar MPI" })).toBeVisible();
  await page.getByRole("link", { name: "Iniciar evaluación" }).click();
  await expect(page).toHaveURL(new RegExp("/guia$"));
  await expect(page.getByTestId("guia-entry")).toBeVisible();
  const body = (await page.textContent("body")) ?? "";
  expect(body).not.toContain("mpi.recommendation_outcome");
});

test("factores incompletos impiden concluir sin escribir estado canónico", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto(`${GUIA}/factor-voluntariness`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "unknown");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  // La compuerta deriva a evaluación incompleta en su propio deep link.
  await expect(page).toHaveURL(new RegExp("/guia/sufficiency-gate$"));
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Evaluación incompleta");
  await expect(page.getByTestId("guia-outcome")).toBeVisible();
  await expect(page.getByTestId("juicio-registrado")).toHaveCount(0);
});

test("flujo completo: considerar, concluir, documentar y continuar a D1.04", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto(`${GUIA}/factor-voluntariness`);
  await answerFactors(page);
  // Base suficiente: la guía continúa al nodo de adopción, no a un resultado calculado.
  await expect(page).toHaveURL(new RegExp("/guia/adopt-conclusion$"));
  await expect(page.getByText("Lo que sabemos")).toBeVisible();
  await expect(page.getByText("Lo que falta resolver")).toBeVisible();
  await expect(page.getByText("Evaluación profesional")).toBeVisible();
  await expect(page.getByText("Conclusión documentada")).toBeVisible();
  await adoptConclusion(page, "recommended");
  await expect(page.getByTestId("juicio-conclusion-label")).toContainText("Recomendado");
  await expect(page.getByText("Esta conclusión fue adoptada por el profesional y documentada con su razonamiento. El sistema no la dedujo.")).toBeVisible();
  await page
    .getByTestId("juicio-next-actions")
    .getByRole("link", { name: "Continuar con formalización en D1.04" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Formalizar adopción del MPI" }),
  ).toBeVisible();
});

test("not_priority no prohíbe ni descarta: reevaluar ante cambios", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto(`${GUIA}/factor-voluntariness`);
  await answerFactors(page);
  await adoptConclusion(page, "not_priority");
  await expect(page.getByTestId("juicio-conclusion-label")).toContainText("No prioritario");
  await expect(page.getByTestId("juicio-conclusion").getByText("No significa prohibición ni descarte definitivo")).toBeVisible();
  const body = (await page.textContent("body")) ?? "";
  expect(body).not.toContain("mpi.recommendation_outcome");
  expect(body).not.toContain("rule_id");
  expect(body).not.toContain("fact_key");
});

test("sin ReasoningRecord válido no hay conclusión definitiva", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto(`${GUIA}/factor-voluntariness`);
  await answerFactors(page);
  await expect(page).toHaveURL(new RegExp("/guia/adopt-conclusion$"));
  await page.getByTestId("juicio-opcion-recommended").click();
  // Sin razonamiento completo, adoptar expone lo que falta sin registrar.
  await page.getByRole("button", { name: "Adoptar conclusión profesional" }).click();
  await expect(page.getByText("Falta para adoptar la conclusión")).toBeVisible();
  await expect(page.getByTestId("juicio-registrado")).toHaveCount(0);
});

test("vista de actividad muestra la conclusión y su desactualización", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto(`${GUIA}/factor-voluntariness`);
  await answerFactors(page);
  await adoptConclusion(page, "worth_considering");
  await page.goto(ACTIVITY);
  await expect(page.getByTestId("actividad-juicio")).toContainText("Vale la pena considerarlo");
  await expect(page.getByTestId("actividad-juicio")).toContainText("Juicio profesional documentado");
  // Cambiar un fact material desactualiza la conclusión registrada.
  await page.goto(`${GUIA}/factor-capacity`);
  await answerAndContinue(page, "no");
  await page.goto(ACTIVITY);
  await expect(page.getByText("Conclusión desactualizada")).toBeVisible();
  await expect(page.getByTestId("actividad-juicio")).toHaveCount(0);
});

test("conflicto material bloquea la conclusión (maquinaria genérica)", async ({ page }) => {
  // Diagnóstico solo ofrece hechos canónicos importados (hoy: estado MPI),
  // ninguno colisiona con los factores de D1.03; el bloqueo por conflicto
  // está cubierto a nivel unitario y E2E en conflictos.spec.ts con la
  // misma vista genérica. Aquí se verifica que la ruta de resultado de
  // D1.03 no inventa conclusión sin base.
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto(`${GUIA}/resultado`);
  await expect(page.getByTestId("guia-pending")).toBeVisible();
  await expect(page.getByTestId("juicio-conclusion-label")).toHaveCount(0);
});

test("deep link, recarga y reinicio del protocolo D1.03", async ({ page }) => {
  await page.goto(`${GUIA}/factor-exposure`);
  await expect(page.getByText("¿Se evaluaron tamaño, complejidad, exposición, categorías de datos, riesgos y madurez?")).toBeVisible();
  await page.reload();
  await expect(page.getByText("¿Se evaluaron tamaño, complejidad, exposición, categorías de datos, riesgos y madurez?")).toBeVisible();
  await page.getByRole("button", { name: "Copiar enlace" }).click();
  await expect(page.getByText("Enlace copiado")).toBeVisible();
  await page.getByTestId("guia-option-yes").click();
  await page.getByRole("button", { name: "Reiniciar evaluación" }).click();
  await expect(page.getByTestId("guia-progress")).toContainText("0 de 5");
});

test("D1.03 por empresa: progreso y conclusión independientes", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto(`${GUIA}/factor-voluntariness`);
  await answerFactors(page);
  await adoptConclusion(page, "recommended");
  await page.goto("/empresa");
  await page.getByLabel("Asociar otra empresa").fill("Empresa Beta");
  await page.getByRole("button", { name: "Agregar empresa" }).click();
  await expect(page.getByRole("heading", { name: "Empresa Beta" })).toBeVisible();
  await page.goto(`${GUIA}/factor-voluntariness`);
  await expect(page.getByTestId("guia-progress")).toContainText("0 de 5");
  await page.goto(ACTIVITY);
  await expect(page.getByTestId("actividad-juicio")).toHaveCount(0);
});

test("D1.03 sin overflow en desktop y tablet", async ({ page }) => {
  for (const path of [
    ACTIVITY,
    GUIA,
    `${GUIA}/factor-exposure`,
    `${GUIA}/adopt-conclusion`,
    `${GUIA}/resultado`,
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
  }
});
