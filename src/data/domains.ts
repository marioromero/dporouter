import type { DomainDefinition } from "../types";

/**
 * Registro canónico de dominios D1-D12.
 * Códigos, claves y nombres exactos según la iteración vigente.
 * D1 importado (D01); D2-D12 permanecen sin actividades hasta su
 * importación controlada.
 */
export const DOMAINS: DomainDefinition[] = [
  {
    domain_key: "d1",
    human_code: "D1",
    name: "Gobernanza, accountability, DPO y MPI",
    objective:
      "Establecer y mantener el marco de gobernanza, prevención, DPO y Modelo de Prevención de Infracciones del responsable, asegurando que las decisiones, designaciones, facultades, recursos, estados y mecanismos de supervisión permanezcan formalizados, trazables y operativos.",
    description:
      "Este dominio gobierna la prevención general de infracciones, la evaluación y ciclo de vida del DPO, la decisión de adoptar un Modelo de Prevención de Infracciones, sus componentes organizativos y su eventual certificación. Coordina actividades especializadas de otros dominios sin duplicarlas.",
    activity_keys: [
      "governance.preventive_framework",
      "dpo.need_assessment",
      "mpi.need_assessment",
      "mpi.formalize_adoption",
      "mpi.internal_reporting_and_whistleblowing",
      "mpi.internal_disciplinary_framework",
      "mpi.internal_regulation_integrate",
      "dpo.designate",
      "dpo.initial_governance_validation",
      "dpo.contact_and_agency_notification",
      "dpo.operating_model",
      "dpo.confidentiality_duty",
      "dpo.annual_plan",
      "dpo.annual_report",
      "dpo.infringement_escalation",
      "dpo.governance_revalidation",
      "dpo.terminate_or_replace",
      "mpi.assemble_program",
      "mpi.certification_lifecycle",
      "mpi.lifecycle_review",
    ],
    related_domain_keys: [],
  },
  {
    domain_key: "d2",
    human_code: "D2",
    name: "Inventario, licitud y ciclo de vida",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
  {
    domain_key: "d3",
    human_code: "D3",
    name: "Transparencia, políticas y consentimiento",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
  {
    domain_key: "d4",
    human_code: "D4",
    name: "Derechos de titulares y decisiones automatizadas",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
  {
    domain_key: "d5",
    human_code: "D5",
    name: "Tratamientos especiales",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
  {
    domain_key: "d6",
    human_code: "D6",
    name: "Cesiones, encargados y subencargados",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
  {
    domain_key: "d7",
    human_code: "D7",
    name: "Transferencias internacionales",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
  {
    domain_key: "d8",
    human_code: "D8",
    name: "Privacy by design, riesgo y EIPD",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
  {
    domain_key: "d9",
    human_code: "D9",
    name: "Seguridad y brechas",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
  {
    domain_key: "d10",
    human_code: "D10",
    name: "Agencia y gestión regulatoria",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
  {
    domain_key: "d11",
    human_code: "D11",
    name: "Capacitación y cultura",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
  {
    domain_key: "d12",
    human_code: "D12",
    name: "Monitoreo, auditoría y mejora continua",
    objective: "",
    description: "",
    activity_keys: [],
    related_domain_keys: [],
  },
];

export function getDomain(domainKey: string): DomainDefinition | undefined {
  return DOMAINS.find((d) => d.domain_key === domainKey);
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Búsqueda real sobre D1-D12 por código, nombre o clave semántica. */
export function searchDomains(term: string): DomainDefinition[] {
  const q = normalizeText(term.trim());
  if (q === "") return [];
  return DOMAINS.filter((d) =>
    [d.human_code, d.name, d.domain_key].some((field) =>
      normalizeText(field).includes(q),
    ),
  );
}
