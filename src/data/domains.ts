import type { DomainDefinition } from "../types";

/**
 * Registro canónico de dominios D1-D12.
 * Códigos, claves y nombres exactos según la iteración vigente.
 * Sin actividades inventadas: `activity_keys` permanece vacío hasta
 * la importación controlada de D01-D12.
 */
export const DOMAINS: DomainDefinition[] = [
  {
    domain_key: "d1",
    human_code: "D1",
    name: "Gobernanza, accountability, DPO y MPI",
    objective: "",
    description: "",
    activity_keys: [],
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
