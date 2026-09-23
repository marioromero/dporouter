import { expect, test } from "@playwright/test";

const D201 = "/actividad/treatment.inventory_create";
const D202 = "/actividad/treatment.actor_roles";
const D203 = "/actividad/treatment.purpose_define";
const D204 = "/actividad/treatment.source_traceability";
const D207 = "/actividad/data.minimization_review";
const D208 = "/actividad/retention.schedule";
const D209 = "/actividad/data.quality_control";

async function crearTratamientoCompleto(page: import("@playwright/test").Page, nombre: string) {
  await page.goto("/empresa");
  await page.getByLabel("Nombre del tratamiento").fill(nombre);
  await page.getByLabel("Identificador canónico (opcional)").fill("trat-01");
  await page.getByRole("button", { name: "Agregar tratamiento" }).click();
  await page.getByLabel("Descripción de la finalidad").fill("Facturación");
  await page.getByRole("button", { name: "Agregar finalidad" }).click();
  await page.getByLabel("Nombre o denominación").fill("Empresa");
  await page.getByRole("button", { name: "Agregar actor" }).click();
  await page.getByLabel("Etiqueta del dato").fill("RUT");
  await page.getByRole("button", { name: "Agregar dato" }).click();
  await page.getByLabel("Tipo de fuente").selectOption("data_subject");
  await page.getByLabel("Descripción", { exact: true }).fill("Formulario");
  await page.getByRole("button", { name: "Agregar fuente" }).click();
}

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

async function crearTratamiento(page: import("@playwright/test").Page, nombre: string, canonico?: string) {
  await page.goto("/empresa");
  await page.getByLabel("Nombre del tratamiento").fill(nombre);
  if (canonico !== undefined) {
    await page.getByLabel("Identificador canónico (opcional)").fill(canonico);
  }
  await page.getByRole("button", { name: "Agregar tratamiento" }).click();
  await expect(page.getByTestId("workspace-treatments")).toContainText(nombre);
}

test("workspace D2: crear tratamiento no completa D2.01 y aisla estructuras", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamiento(page, "Gestión de clientes");
  // Crear no completa: al responder lo verificable, la guía exige estructura.
  await page.goto(`${D201}/guia/identify-processes`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Estructura por completar");
  // Estructuras del tratamiento activo.
  await page.goto("/empresa");
  await page.getByLabel("Descripción de la finalidad").fill("Facturación");
  await page.getByRole("button", { name: "Agregar finalidad" }).click();
  await page.getByLabel("Nombre o denominación").fill("Empresa");
  await page.getByRole("button", { name: "Agregar actor" }).click();
  await page.getByLabel("Etiqueta del dato").fill("RUT");
  await page.getByRole("button", { name: "Agregar dato" }).click();
  await page.getByLabel("Descripción", { exact: true }).fill("Formulario web");
  await page.getByRole("button", { name: "Agregar fuente" }).click();
  await expect(page.getByTestId("workspace-sources")).toContainText("Formulario web");
});

test("D2.01 completa con estructura y verificación", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamiento(page, "Gestión de clientes", "trat-clientes-01");
  await page.getByLabel("Descripción de la finalidad").fill("Facturación");
  await page.getByRole("button", { name: "Agregar finalidad" }).click();
  await page.getByLabel("Nombre o denominación").fill("Empresa");
  await page.getByRole("button", { name: "Agregar actor" }).click();
  await page.getByLabel("Etiqueta del dato").fill("RUT");
  await page.getByRole("button", { name: "Agregar dato" }).click();
  await page.getByLabel("Tipo de fuente").selectOption("data_subject");
  await page.getByLabel("Descripción", { exact: true }).fill("Formulario web");
  await page.getByRole("button", { name: "Agregar fuente" }).click();
  await page.goto(`${D201}/guia/identify-processes`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Tratamiento levantado y verificado",
  );
  await expect(page.getByTestId("guia-finalize")).toHaveCount(0);
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Identificar actores y roles en D2.02" })
    .click();
  await expect(page.getByRole("heading", { name: "Identificar actores y roles por tratamiento" })).toBeVisible();
});

test("D2.02 exige roles y documenta juicio sin deducirlo", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamiento(page, "Gestión de clientes");
  // Sin actores: deriva a workspace sin juzgar.
  await page.goto(`${D202}/guia/resultado`);
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Actores por completar");
  // Con actor sin rol: sigue incompleto.
  await page.goto("/empresa");
  await page.getByLabel("Nombre o denominación").fill("Empresa");
  await page.getByRole("button", { name: "Agregar actor" }).click();
  await expect(page.getByTestId("actors-summary")).toContainText("falta definir el rol de 1");
  await page.goto(`${D202}/guia/resultado`);
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Actores por completar");
  // Con rol: habilita conclusión documentada.
  await page.goto("/empresa");
  await page.getByRole("button", { name: "Cambiar rol de Empresa" }).click();
  await expect(page.getByTestId("actors-summary")).toContainText("todos con rol definido");
  await page.goto(`${D202}/guia/adopt-conclusion`);
  await expect(page.getByTestId("juicio-conclusion")).toBeVisible();
  await page.getByTestId("juicio-opcion-classification_sound").click();
  await page.getByLabel("Referencias de evidencia (una por línea)").fill("Contrato marco");
  await page.getByLabel("Razonamiento").fill("La empresa decide fines y medios según contrato.");
  await page.getByLabel("Quien adopta la conclusión").fill("Abogada");
  await page.getByRole("button", { name: "Adoptar conclusión profesional" }).click();
  await expect(page.getByTestId("juicio-conclusion-label")).toContainText("Clasificación correcta");
});

test("D2.03 distingue existencia de validez jurídica", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamiento(page, "Gestión de clientes");
  await page.goto(`${D203}/guia/verify-specificity`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Finalidades por registrar");
  await page.goto("/empresa");
  await page.getByLabel("Descripción de la finalidad").fill("Facturación");
  await page.getByRole("button", { name: "Agregar finalidad" }).click();
  await page.goto(`${D203}/guia/verify-specificity`);
  await answerAndContinue(page, "no");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Definición en curso");
  await page.goto(`${D203}/guia/verify-specificity`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Finalidades definidas y fundadas",
  );
});

test("D2.04 documenta trazabilidad sin universalidad inventada", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamientoCompleto(page, "Gestión de clientes");
  // Vincular dato con fuente en workspace.
  await page.goto("/empresa");
  await page.getByTestId("workspace-data").getByRole("button", { name: "Formulario" }).click();
  await page.goto(`${D204}/guia/identify-sources`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Origen trazado y acreditado",
  );
  await expect(page.getByTestId("guia-finalize")).toHaveCount(0);
});

test("D2.07 conforma solo con checks profesionales, no por links", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamientoCompleto(page, "Gestión de clientes");
  // Con links pero sin checks: no conforma.
  await page.goto("/empresa");
  await page.getByRole("button", { name: "RUT para Facturación" }).click();
  await page.goto(`${D207}/guia/check-mapping`);
  await answerAndContinue(page, "unknown");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Información insuficiente",
  );
  // Con checks satisfactorios: conforma.
  await page.goto(`${D207}/guia/check-mapping`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Minimización conforme",
  );
});

test("D2.07 brecha exige remediación", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamientoCompleto(page, "Gestión de clientes");
  await page.goto("/empresa");
  await page.getByRole("button", { name: "RUT para Facturación" }).click();
  await page.goto(`${D207}/guia/check-mapping`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "no");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Requiere acciones correctivas",
  );
});

test("D2.08 define conservación sin fechas", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamientoCompleto(page, "Gestión de clientes");
  await page.goto("/empresa");
  await page.getByTestId("workspace-retention").getByRole("button", { name: "RUT" }).click();
  await page.getByLabel("Período o criterio de término").fill("2 años tras término");
  await page.getByLabel("Responsable operacional").fill("TI");
  await page.getByRole("button", { name: "Agregar regla" }).click();
  await expect(page.getByTestId("workspace-retention")).toContainText("2 años tras término");
  await page.goto(`${D208}/guia/relate-purpose`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "na");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Conservación definida y fundada",
  );
  const body = (await page.textContent("body")) ?? "";
  expect(body).not.toContain("vencimiento");
});

test("D2.09 controla calidad sin score ni frecuencia", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamientoCompleto(page, "Gestión de clientes");
  await page.goto(`${D209}/guia/check-reviewed`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "na");
  await answerAndContinue(page, "na");
  await answerAndContinue(page, "yes");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Calidad conforme",
  );
  await expect(page.getByTestId("guia-finalize")).toHaveCount(0);
});

const D205 = "/actividad/lawful_basis.assign";
const D210 = "/actividad/precontractual_data.cleanup";

async function crearTratamientoConPurposes(page: import("@playwright/test").Page) {
  await page.goto("/empresa");
  await page.getByLabel("Nombre del tratamiento").fill("Gestión de clientes");
  await page.getByRole("button", { name: "Agregar tratamiento" }).click();
  await page.getByLabel("Descripción de la finalidad").fill("Facturación");
  await page.getByRole("button", { name: "Agregar finalidad" }).click();
  await page.getByLabel("Descripción de la finalidad").fill("Marketing");
  await page.getByRole("button", { name: "Agregar finalidad" }).click();
}

async function seleccionarPurpose(page: import("@playwright/test").Page, desc: string) {
  await page.goto("/empresa");
  await page.getByRole("button", { name: desc, exact: true }).click();
}

test("D2.05 muestra contexto purpose y determina por finalidad", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamientoConPurposes(page);
  await seleccionarPurpose(page, "Facturación");
  await page.goto(`${D205}/guia/consent-basis`);
  await expect(page.getByTestId("guia-scope")).toContainText("Finalidad: Facturación");
  await answerAndContinue(page, "consent_no");
  await answerAndContinue(page, "contract_precontractual");
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Base: contrato o precontrato");
  // A2 independiente: sin respuestas heredadas de A1.
  await seleccionarPurpose(page, "Marketing");
  await page.goto(`${D205}/guia/consent-basis`);
  await expect(page.getByTestId("guia-scope")).toContainText("Finalidad: Marketing");
  await answerAndContinue(page, "consent_no");
  await answerAndContinue(page, "legitimate_interest");
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Candidata: interés legítimo");
  await page
    .getByTestId("guia-next-actions")
    .getByRole("link", { name: "Evaluar el interés legítimo de esta finalidad en D2.06" })
    .click();
  // D2.06 con protocolo: la derivación llega a guía real.
  await expect(page.getByRole("heading", { name: "Evaluar interés legítimo" })).toBeVisible();
  await expect(page.getByText("Guía operativa pendiente de incorporar")).toHaveCount(0);
});

test("D2.06 evalúa solo la purpose candidata con juicio documentado", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamientoConPurposes(page);
  // A1 sin candidatura: prerrequisito honesto, sin finalización.
  await seleccionarPurpose(page, "Facturación");
  await page.goto("/actividad/legitimate_interest.assessment/guia/resultado");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Sin candidatura vigente",
  );
  // A2 con candidatura LI vía D2.05: factores + conclusión + registro.
  await seleccionarPurpose(page, "Marketing");
  await page.goto(`${D205}/guia/consent-basis`);
  await answerAndContinue(page, "consent_no");
  await answerAndContinue(page, "legitimate_interest");
  await expect(page.getByTestId("guia-outcome-label")).toContainText(
    "Candidata: interés legítimo",
  );
  await page.goto("/actividad/legitimate_interest.assessment/guia/factor-interest");
  for (const value of ["yes", "yes", "yes", "yes", "yes"]) {
    await answerAndContinue(page, value);
  }
  await expect(page).toHaveURL(new RegExp("/guia/adopt-conclusion$"));
  await expect(page.getByTestId("juicio-conclusion")).toBeVisible();
  await page.getByTestId("juicio-opcion-supports_basis").click();
  await page.getByLabel("Referencias de evidencia (una por línea)").fill("Análisis LI v1");
  await page.getByLabel("Razonamiento").fill("Necesario y proporcionado con salvaguardas.");
  await page.getByLabel("Quien adopta la conclusión").fill("Abogada");
  await page.getByRole("button", { name: "Adoptar conclusión profesional" }).click();
  await expect(page.getByTestId("juicio-conclusion-label")).toContainText("Sostiene la base");
  // Recarga: el record persiste en la purpose.
  await page.reload();
  await expect(page.getByTestId("juicio-conclusion-label")).toContainText("Sostiene la base");
});

async function seleccionarTratamiento(page: import("@playwright/test").Page, nombre: string) {
  await page.goto("/empresa");
  await page.getByTestId("workspace-treatments").getByRole("button", { name: nombre, exact: true }).click();
}

async function adoptarConclusion(page: import("@playwright/test").Page, opcion: string) {
  await expect(page.getByTestId("juicio-conclusion")).toBeVisible();
  await page.getByTestId(`juicio-opcion-${opcion}`).click();
  await page.getByLabel("Referencias de evidencia (una por línea)").fill("Registro de depuración v1");
  await page.getByLabel("Razonamiento").fill("Revisión con respaldo y vínculo documentado.");
  await page.getByLabel("Quien adopta la conclusión").fill("DPO");
  await page.getByRole("button", { name: "Adoptar conclusión profesional" }).click();
}

test("D2.10 sin datos no requiere depuración", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamiento(page, "Captación");
  await page.goto(`${D210}/guia/trigger`);
  await expect(page.getByTestId("guia-scope")).toContainText("Tratamiento: Captación");
  await answerAndContinue(page, "no");
  await expect(page.getByTestId("guia-outcome-label")).toContainText("Sin depuración requerida");
});

test("D2.10 vincula tratamiento posterior con juicio documentado", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamiento(page, "Captación");
  await crearTratamiento(page, "Contratos");
  await seleccionarTratamiento(page, "Captación");
  await page.goto(`${D210}/guia/trigger`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  // Selector: el propio tratamiento no puede elegirse como posterior.
  await expect(page.getByTestId("guia-reference-select")).toBeVisible();
  await expect(page.getByTestId("guia-reference-self")).toBeVisible();
  await page.getByTestId("guia-reference-select").getByRole("button", { name: "Contratos" }).click();
  await page.getByTestId("guia-continue").click();
  await expect(page).toHaveURL(new RegExp("/guia/adopt-conclusion$"));
  await adoptarConclusion(page, "linked_posterior");
  await expect(page.getByTestId("juicio-conclusion-label")).toContainText("Vinculado a tratamiento posterior");
  // Recarga: el record persiste en el tratamiento.
  await page.reload();
  await expect(page.getByTestId("juicio-conclusion-label")).toContainText("Vinculado a tratamiento posterior");
  // El otro tratamiento no hereda la conclusión.
  await seleccionarTratamiento(page, "Contratos");
  await page.goto(`${D210}/guia/adopt-conclusion`);
  await expect(page.getByRole("button", { name: "Adoptar conclusión profesional" })).toBeVisible();
});

test("D2.10 depuración completa sin posterior", async ({ page }) => {
  await crearEmpresa(page, "Perfil D2", "Empresa D2");
  await crearTratamiento(page, "Captación");
  await page.goto(`${D210}/guia/trigger`);
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  await answerAndContinue(page, "yes");
  // Sin otro tratamiento solo cabe declarar la ausencia.
  await expect(page.getByTestId("guia-reference-empty")).toBeVisible();
  await answerAndContinue(page, "no_posterior");
  await expect(page).toHaveURL(new RegExp("/guia/adopt-conclusion$"));
  await adoptarConclusion(page, "cleanup_completed");
  await expect(page.getByTestId("juicio-conclusion-label")).toContainText("Depuración completada");
});
