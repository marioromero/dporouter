import { expect, test } from "@playwright/test";

const GUIA = "/actividad/dpo.need_assessment/guia";

async function crearEmpresa(page: import("@playwright/test").Page, perfil: string, empresa: string) {
  await page.goto("/empresa");
  await page.getByLabel("Nombre del perfil local").fill(perfil);
  await page.getByRole("button", { name: "Crear perfil" }).click();
  await page.getByLabel("Nombre de la empresa").fill(empresa);
  await page.getByRole("button", { name: "Crear empresa" }).click();
  await expect(page.getByRole("heading", { name: empresa })).toBeVisible();
}

test("conflicto bloquea conclusión y se resuelve explícitamente", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto("/diagnostico");
  await page.getByLabel("Estado del MPI (caracterización)").selectOption("not_adopted");
  await page.getByRole("button", { name: "Registrar hecho" }).click();

  await page.goto(`${GUIA}/mpi-status`);
  await expect(page.getByTestId("guia-provided")).toBeVisible();
  await page.getByTestId("guia-option-implementing").click();
  await page.getByTestId("guia-continue").click();

  // Aunque la regla MPI calzaría, el conflicto bloquea el resultado.
  await expect(page).toHaveURL(/\/guia\/resultado$/);
  await expect(page.getByTestId("guia-conflict-block")).toBeVisible();
  await expect(page.getByText("Debes resolver un dato en conflicto antes de obtener una conclusión definitiva.")).toBeVisible();
  await expect(page.getByText("Existen antecedentes distintos para este dato. Revisa cuál refleja actualmente la situación de la empresa antes de continuar.")).toBeVisible();
  await expect(page.getByRole("button", { name: "No adoptado · Diagnóstico" })).toBeVisible();
  await expect(page.getByRole("button", { name: "En implementación · Evaluación guiada" })).toBeVisible();
  await expect(page.getByTestId("guia-outcome")).toHaveCount(0);

  // El nodo también señala el conflicto sin IDs técnicos.
  await page.goto(`${GUIA}/mpi-status`);
  await expect(page.getByTestId("guia-conflict")).toContainText("Dato en conflicto");
  const body = await page.textContent("body") ?? "";
  expect(body).not.toContain("mpi.lifecycle_status");
  expect(body).not.toContain("fact_key");

  // Resolución explícita: elegir Evaluación guiada permite continuar.
  await page.goto(`${GUIA}/resultado`);
  await page.getByRole("button", { name: "En implementación · Evaluación guiada" }).click();
  await page.getByRole("button", { name: "Resolver conflicto", exact: true }).click();
  await expect(page.getByTestId("guia-outcome-label")).toContainText("DPO requerido por MPI");
});

test("nueva contradicción posterior reabre el conflicto", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto("/diagnostico");
  await page.getByLabel("Estado del MPI (caracterización)").selectOption("not_adopted");
  await page.getByRole("button", { name: "Registrar hecho" }).click();
  await page.goto(`${GUIA}/mpi-status`);
  await page.getByTestId("guia-option-implementing").click();
  await page.getByTestId("guia-continue").click();
  await page.getByRole("button", { name: "En implementación · Evaluación guiada" }).click();
  await page.getByRole("button", { name: "Resolver conflicto", exact: true }).click();
  await expect(page.getByTestId("guia-outcome-label")).toContainText("DPO requerido por MPI");

  // Nuevo registro contradictorio en Diagnóstico reabre el conflicto.
  await page.goto("/diagnostico");
  await page.getByLabel("Estado del MPI (caracterización)").selectOption("not_adopted");
  await page.getByRole("button", { name: "Registrar hecho" }).click();
  await expect(page.getByText("valores distintos según origen")).toBeVisible();
  await page.goto(`${GUIA}/resultado`);
  await expect(page.getByTestId("guia-conflict-block")).toBeVisible();
  await expect(page.getByTestId("guia-outcome")).toHaveCount(0);
});

test("otra empresa no ve el conflicto ni la resolución", async ({ page }) => {
  await crearEmpresa(page, "Perfil Uno", "Empresa Alfa");
  await page.goto("/diagnostico");
  await page.getByLabel("Estado del MPI (caracterización)").selectOption("not_adopted");
  await page.getByRole("button", { name: "Registrar hecho" }).click();
  await page.goto("/empresa");
  await page.getByLabel("Asociar otra empresa").fill("Empresa Beta");
  await page.getByRole("button", { name: "Agregar empresa" }).click();
  await expect(page.getByRole("heading", { name: "Empresa Beta" })).toBeVisible();
  await page.goto(`${GUIA}/resultado`);
  await expect(page.getByTestId("guia-conflict-block")).toHaveCount(0);
  await expect(page.getByTestId("guia-pending")).toBeVisible();
});

test("resultado sin rule_id visible pero con explicación humana", async ({ page }) => {
  await page.goto(`${GUIA}/mpi-status`);
  await page.getByTestId("guia-option-implementing").click();
  await page.getByTestId("guia-continue").click();
  await expect(page.getByText("Por qué obtuvimos este resultado")).toBeVisible();
  await expect(page.getByTestId("guia-outcome-rule")).toContainText("formalmente adoptado");
  const body = await page.textContent("body") ?? "";
  expect(body).not.toContain("mpi-active");
  expect(body).not.toContain("rule_id");
});
