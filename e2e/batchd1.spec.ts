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

const D101 = "/actividad/governance.preventive_framework";
const D108 = "/actividad/dpo.designate";
const D111 = "/actividad/dpo.operating_model";

test("D1.01 completo establece marco y lo distingue de MPI", async ({ page }) => {
  await page.goto(`${D101}/guia/role-gate`);
  await answerAndContinue(page, "yes");
  for (const node of [
    "identify-actions",
    "determine-gaps",
    "define-framework",
    "followup-mechanism",
  ]) {
    await expect(page).toHaveURL(new RegExp(`/guia/${node}$`));
    await answerAndContinue(page, "yes");
  }
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Marco preventivo establecido y evidenciado",
  );
  await expect(page.getByTestId("guia-next-actions")).toContainText(
    "independiente de la adopción de un MPI",
  );
});

test("D1.01 sin rol deriva a roles D2", async ({ page }) => {
  await page.goto(`${D101}/guia/role-gate`);
  await answerAndContinue(page, "no");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "No aplica: sin rol de responsable",
  );
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Revisar roles por actor y tratamiento" })
    .click();
  await expect(page).toHaveURL(/\/actividad\/treatment\.actor_roles$/);
});

test("D1.08 sin antecedente deriva a D1.02 sin re-resolver", async ({ page }) => {
  await page.goto(`${D108}/guia/trigger-gate`);
  await answerAndContinue(page, "undecided");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Antecedente aún sin definir",
  );
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Definir la necesidad en D1.02" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Evaluar necesidad y recomendación de DPO" }),
  ).toBeVisible();
});

test("D1.08 interna completa enlaza validación D1.09", async ({ page }) => {
  await page.goto(`${D108}/guia/trigger-gate`);
  await answerAndContinue(page, "voluntary");
  await expect(page).toHaveURL(new RegExp("/guia/confirm-authority$"));
  await answerAndContinue(page, "yes");
  await expect(page).toHaveURL(new RegExp("/guia/modality$"));
  await answerAndContinue(page, "internal");
  await expect(page).toHaveURL(new RegExp("/guia/natural-person$"));
  await answerAndContinue(page, "na");
  await expect(page).toHaveURL(new RegExp("/guia/group-conditions$"));
  await answerAndContinue(page, "na");
  await expect(page).toHaveURL(new RegExp("/guia/suitability$"));
  await answerAndContinue(page, "yes");
  await expect(page).toHaveURL(new RegExp("/guia/formalization$"));
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Designación formalizada y trazable",
  );
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Validar la gobernanza inicial del DPO en D1.09" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Validar gobernanza inicial del DPO" }),
  ).toBeVisible();
});

test("D1.11 completo enlaza plan anual D1.13", async ({ page }) => {
  await page.goto(`${D111}/guia/designation-gate`);
  await answerAndContinue(page, "yes");
  for (const node of [
    "organize-reporting",
    "organize-involvement",
    "organize-info-access",
    "organize-functions",
    "organize-cadence",
  ]) {
    await expect(page).toHaveURL(new RegExp(`/guia/${node}$`));
    await answerAndContinue(page, "yes");
  }
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Modelo operativo activo",
  );
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Planificar el trabajo anual con el modelo como insumo" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Desarrollar plan anual del DPO" }),
  ).toBeVisible();
});

async function crearEmpresaFin(page: import("@playwright/test").Page) {
  await page.goto("/empresa");
  await page.getByLabel("Nombre del perfil local").fill("Perfil Fin");
  await page.getByRole("button", { name: "Crear perfil" }).click();
  await page.getByLabel("Nombre de la empresa").fill("Empresa Fin");
  await page.getByRole("button", { name: "Crear empresa" }).click();
}

test("D1.01 finaliza explícito, idempotente y sin mutar al render", async ({ page }) => {
  await crearEmpresaFin(page);
  await page.goto(`${D101}/guia/role-gate`);
  await answerAndContinue(page, "yes");
  for (const node of [
    "identify-actions",
    "determine-gaps",
    "define-framework",
    "followup-mechanism",
  ]) {
    await answerAndContinue(page, "yes");
  }
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Marco preventivo establecido y evidenciado",
  );
  // Sin acción no hay registro, ni siquiera recargando.
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado aún no registrado",
  );
  await page.reload();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado aún no registrado",
  );
  // Acción explícita registra; repetir es no-op; recargar conserva.
  await page.getByTestId("guia-finalize-apply").click();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
  await page.getByTestId("guia-finalize-apply").click();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
  await page.reload();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
  // El estado materializado llega a Diagnóstico como hecho de la empresa.
  await page.goto("/diagnostico");
  await expect(page.getByTestId("diagnostico-facts")).toContainText(
    "Antecedente registrado",
  );
});

test("D1.11 finaliza su estado canónico", async ({ page }) => {
  await crearEmpresaFin(page);
  await page.goto(`${D111}/guia/designation-gate`);
  await answerAndContinue(page, "yes");
  for (const node of [
    "organize-reporting",
    "organize-involvement",
    "organize-info-access",
    "organize-functions",
    "organize-cadence",
  ]) {
    await answerAndContinue(page, "yes");
  }
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Modelo operativo activo",
  );
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado aún no registrado",
  );
  await page.getByTestId("guia-finalize-apply").click();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
});

test("D1.08 completo no ofrece registro canónico", async ({ page }) => {
  await page.goto(`${D108}/guia/trigger-gate`);
  await answerAndContinue(page, "voluntary");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "internal");
  await answerAndContinue(page, "na");
  await answerAndContinue(page, "na");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Designación formalizada y trazable",
  );
  await expect(page.getByTestId("guia-finalize")).toHaveCount(0);
});

const D115 = "/actividad/dpo.infringement_escalation";
const D117 = "/actividad/dpo.terminate_or_replace";
const D118 = "/actividad/mpi.assemble_program";
const D105 = "/actividad/mpi.internal_reporting_and_whistleblowing";
const D106 = "/actividad/mpi.internal_disciplinary_framework";
const D107 = "/actividad/mpi.internal_regulation_integrate";
const D112 = "/actividad/dpo.confidentiality_duty";

async function registrarMpiDiagnostico(
  page: import("@playwright/test").Page,
  estado: string,
) {
  await page.goto("/diagnostico");
  await page.getByLabel("Estado del MPI (caracterización)").selectOption(estado);
  await page.getByRole("button", { name: "Registrar hecho" }).click();
}

test("D1.15 completo sin registro canónico", async ({ page }) => {
  await page.goto(`${D115}/guia/designation-gate`);
  await answerAndContinue(page, "yes");
  await expect(page).toHaveURL(new RegExp("/guia/case-gate$"));
  await answerAndContinue(page, "known");
  for (const node of [
    "register-case",
    "determine-facts",
    "communicate-authority",
    "record-measures",
  ]) {
    await expect(page).toHaveURL(new RegExp(`/guia/${node}$`));
    await answerAndContinue(page, "yes");
  }
  await expect(page).toHaveURL(new RegExp("/guia/derive-findings$"));
  await answerAndContinue(page, "na");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Infracción escalada y registrada",
  );
  // Sin lifecycle effects: execution-ready pero sin bloque de registro.
  await expect(page.getByTestId("guia-finalize")).toHaveCount(0);
});

test("D1.17 sin lifecycle queda incompleto y deriva a ciclo de vida", async ({ page }) => {
  await page.goto(`${D117}/guia/designation-gate`);
  await answerAndContinue(page, "yes");
  await expect(page).toHaveURL(new RegExp("/guia/event-confirmation$"));
  await answerAndContinue(page, "occurred");
  await expect(page).toHaveURL(new RegExp("/guia/other-source$"));
  await answerAndContinue(page, "no");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Evaluación incompleta",
  );
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Revisar el ciclo de vida del MPI" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Revisar ciclo de vida del MPI" }),
  ).toBeVisible();
});

test("D1.17 con MPI activo exige reemplazo y enlaza D1.08", async ({ page }) => {
  await crearEmpresaFin(page);
  await registrarMpiDiagnostico(page, "implemented");
  await page.goto(`${D117}/guia/designation-gate`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "occurred");
  await answerAndContinue(page, "no");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Vacancia con reemplazo requerido",
  );
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Designar al reemplazante en D1.08" })
    .click();
  await expect(page.getByRole("heading", { name: "Designar DPO" })).toBeVisible();
});

test("D1.18 completo finaliza implemented", async ({ page }) => {
  await crearEmpresaFin(page);
  await registrarMpiDiagnostico(page, "implementing");
  await page.goto(`${D118}/guia/verify-responsible`);
  for (const node of [
    "verify-responsible",
    "verify-dpo",
    "characterize-treatments",
    "identify-risks",
    "verify-protocols",
    "verify-obligations",
    "verify-integration",
    "verify-diffusion",
    "consolidate-evidence",
  ]) {
    await expect(page).toHaveURL(new RegExp(`/guia/${node}$`));
    await answerAndContinue(page, "yes");
  }
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Programa MPI implementado",
  );
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado aún no registrado",
  );
  await page.getByTestId("guia-finalize-apply").click();
  // El dato previo de Diagnóstico (implementación en curso) discrepa del
  // estado finalizado: conflicto explícito, nunca mezcla silenciosa.
  await expect(page.getByTestId("guia-conflict-block")).toBeVisible();
  await page
    .getByTestId("resolver-mpi.lifecycle_status")
    .getByRole("button", { name: /Implementado · Evaluación guiada/ })
    .click();
  await page
    .getByTestId("resolver-mpi.lifecycle_status")
    .getByRole("button", { name: "Resolver conflicto" })
    .click();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
  await page.reload();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
});

test("D1.05 completo finaliza mecanismo y persiste", async ({ page }) => {
  await crearEmpresaFin(page);
  await registrarMpiDiagnostico(page, "implementing");
  await page.goto(`${D105}/guia/define-channel`);
  for (const node of [
    "define-channel",
    "identity-reserve",
    "non-retaliation",
    "handling-flow",
    "test-channel",
  ]) {
    await expect(page).toHaveURL(new RegExp(`/guia/${node}$`));
    await answerAndContinue(page, "yes");
  }
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Mecanismo implementado y operativo",
  );
  await page.getByTestId("guia-finalize-apply").click();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
  await page.reload();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
});

test("D1.06 completo finaliza régimen", async ({ page }) => {
  await crearEmpresaFin(page);
  await registrarMpiDiagnostico(page, "adoption_formalized");
  await page.goto(`${D106}/guia/map-existing`);
  for (const node of [
    "map-existing",
    "integrate-breaches",
    "define-procedure",
    "verify-coherence",
    "formalize-approved",
  ]) {
    await expect(page).toHaveURL(new RegExp(`/guia/${node}$`));
    await answerAndContinue(page, "yes");
  }
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Régimen disciplinario establecido y aprobado",
  );
  await page.getByTestId("guia-finalize-apply").click();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
});

test("D1.07 con condicionales descartados finaliza integración", async ({ page }) => {
  await crearEmpresaFin(page);
  await registrarMpiDiagnostico(page, "implementing");
  await page.goto(`${D107}/guia/identify-subjects`);
  await answerAndContinue(page, "yes");
  await expect(page).toHaveURL(new RegExp("/guia/identify-instruments$"));
  await answerAndContinue(page, "yes");
  await expect(page).toHaveURL(new RegExp("/guia/incorporate-obligations$"));
  await answerAndContinue(page, "yes");
  await expect(page).toHaveURL(new RegExp("/guia/bylaws-applicability$"));
  await answerAndContinue(page, "not_applies");
  await expect(page).toHaveURL(new RegExp("/guia/update-bylaws$"));
  await answerAndContinue(page, "na");
  await expect(page).toHaveURL(new RegExp("/guia/verify-publicity$"));
  await answerAndContinue(page, "na");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Integración incorporada y evidenciada",
  );
  await page.getByTestId("guia-finalize-apply").click();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
});

test("D1.12 completo finaliza deber sin declarar cumplimiento", async ({ page }) => {
  await crearEmpresaFin(page);
  await page.goto(`${D112}/guia/designation-gate`);
  await answerAndContinue(page, "yes");
  await expect(page).toHaveURL(new RegExp("/guia/verify-obligation$"));
  await answerAndContinue(page, "yes");
  await expect(page).toHaveURL(new RegExp("/guia/formalize-instrument$"));
  await answerAndContinue(page, "na");
  await expect(page).toHaveURL(new RegExp("/guia/verify-scope$"));
  await answerAndContinue(page, "yes");
  await expect(page).toHaveURL(new RegExp("/guia/verify-measures$"));
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Deber formalizado y respaldado",
  );
  const body = (await page.textContent("body")) ?? "";
  expect(body).not.toContain("Cumple");
  await page.getByTestId("guia-finalize-apply").click();
  await expect(page.getByTestId("guia-finalize-status")).toContainText(
    "Estado registrado para esta empresa",
  );
});

test("batch sin overflow en desktop y tablet", async ({ page }) => {
  for (const path of [
    D104,
    D109,
    D103,
    D105,
    D106,
    D107,
    D112,
    `${D104}/guia/adoption-evidence`,
    `${D109}/guia/check-conflicts`,
    `${D109}/guia/resultado`,
    `${D105}/guia/test-channel`,
    `${D112}/guia/verify-measures`,
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
  }
});
