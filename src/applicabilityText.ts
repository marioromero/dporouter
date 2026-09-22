/**
 * Traducciones humanas explícitas de condiciones de aplicabilidad.
 *
 * Solo contiene las condiciones observadas en el contenido canónico
 * importado (D1-D2). Si una condición no tiene traducción fiable, se
 * OMITE de la vista normal antes que mostrar lenguaje de máquina. No se
 * inventan interpretaciones jurídicas: son lecturas operacionales de
 * estados factuales.
 */

const HUMAN_APPLICABILITY: Record<string, string> = {
  "client.roles_present incluye responsible":
    "Aplica cuando la empresa actúa como responsable en al menos un tratamiento.",
  "actor.role_current = responsible":
    "Aplica cuando la empresa actúa como responsable en al menos un tratamiento.",
  "client has at least one personal_data_processing_operation":
    "Aplica cuando la empresa realiza al menos una operación de tratamiento de datos personales.",
  "treatment exists": "Aplica cuando existe al menos un tratamiento registrado.",
  "treatment inventory exists":
    "Aplica cuando ya existe un inventario de tratamientos.",
  "treatment.purposes defined":
    "Aplica cuando el tratamiento tiene finalidades definidas.",
  "candidate lawful basis = legitimate_interest":
    "Aplica cuando la base de licitud candidata es el interés legítimo.",
  "material treatment change detected":
    "Aplica cuando se detecta un cambio material en el tratamiento.",
  "personal data obtained for requested precontractual measures = yes":
    "Aplica cuando se obtuvieron datos para medidas precontractuales solicitadas.",
  "mpi decision = adopt": "Aplica cuando se decide adoptar un MPI.",
  "mpi.lifecycle_status = adoption_formalized | implementing | implemented":
    "Aplica cuando el MPI está formalmente adoptado, en implementación o implementado.",
  "mpi.lifecycle_status = adoption_formalized | implementing":
    "Aplica cuando la adopción del MPI está formalizada o en implementación.",
  "mpi.lifecycle_status = implemented AND certification decision exists":
    "Aplica cuando el MPI está implementado y existe decisión sobre certificación.",
  "mpi.lifecycle_status != not_assessed OR mpi recommendation evaluated":
    "Aplica cuando ya existe una evaluación del estado del MPI.",
  "dpo.status = designated": "Aplica cuando existe un DPO designado.",
  "dpo.status = designated AND termination_or_change_event = true":
    "Aplica cuando existe un DPO designado y ocurre un evento de término o cambio.",
  "dpo conoce posible infracción":
    "Aplica cuando el DPO conoce una posible infracción.",
  "dpo.requirement.active = true OR dpo voluntary designation decision = yes":
    "Aplica cuando el requerimiento de DPO está activo o se decidió una designación voluntaria.",
};

/** Devuelve solo las condiciones con traducción humana fiable. */
export function humanApplicability(conditions: string[]): string[] {
  const out: string[] = [];
  for (const c of conditions) {
    const h = HUMAN_APPLICABILITY[c.trim()];
    if (h) out.push(h);
  }
  return out;
}
