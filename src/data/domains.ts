import type { DomainDefinition } from "../types";
import { D1_ACTIVITY_KEYS } from "../../content/domains/d01";
import { D2_ACTIVITY_KEYS } from "../../content/domains/d02";
import { D3_ACTIVITY_KEYS } from "../../content/domains/d03";
import { D4_ACTIVITY_KEYS } from "../../content/domains/d04";
import { normalizeText } from "../../content/text";

/** Normalización textual única de la capa canónica (reexportada). */
export { normalizeText };

/**
 * Registro de aplicación D1-D12 (navegación, búsqueda, rutas).
 * Consume definiciones canónicas de /content; no duplica contenido.
 * Códigos, claves y nombres exactos según la iteración vigente.
 * D5-D12 permanecen sin actividades hasta su importación controlada.
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
    activity_keys: [...D1_ACTIVITY_KEYS],
    related_domain_keys: [],
  },
  {
    domain_key: "d2",
    human_code: "D2",
    name: "Inventario, licitud y ciclo de vida",
    objective:
      "Mantener trazabilidad de las operaciones de tratamiento y asegurar que sus roles, finalidades, fuentes, bases de licitud, datos tratados, plazos de conservación y condiciones de calidad permanezcan definidos, justificables y actualizados durante todo su ciclo de vida.",
    description:
      "Este dominio estructura el conocimiento básico de cada tratamiento y controla su legitimidad durante el tiempo. La licitud se determina por finalidad, no de manera global para toda una base de datos. El inventario interno utilizado por la agencia es un estándar metodológico de trazabilidad y no debe presentarse como un registro universal expresamente exigido por la ley.",
    activity_keys: [...D2_ACTIVITY_KEYS],
    related_domain_keys: [],
  },
  {
    domain_key: "d3",
    human_code: "D3",
    name: "Transparencia, políticas y consentimiento",
    objective:
      "Asegurar que la información pública de tratamiento cumpla los contenidos y condiciones del artículo 14 ter y que los mecanismos de consentimiento por finalidad sean libres, informados, específicos, previos, inequívocos, demostrables y retirables.",
    description:
      "Este dominio verifica la política pública de tratamiento y su publicación efectiva, y diseña el mecanismo de consentimiento por finalidad: obtención válida, libertad, capacidad de prueba y retiro. Stage 1 evalúa el diseño del mecanismo y su evidencia; no registra consentimientos individuales por titular.",
    activity_keys: [...D3_ACTIVITY_KEYS],
    related_domain_keys: [],
  },
  {
    domain_key: "d4",
    human_code: "D4",
    name: "Derechos de titulares y decisiones automatizadas",
    objective:
      "Diseñar y validar la capacidad del responsable para facilitar el ejercicio de los derechos de los titulares, atender correctamente cada tipo de derecho y evaluar los usos de decisiones automatizadas y sus salvaguardas, sin administrar solicitudes individuales en Stage 1.",
    description:
      "Este dominio diseña el mecanismo general de ejercicio de derechos y habilita la atención de acceso, rectificación, supresión, oposición, bloqueo temporal y portabilidad como capacidad organizacional, y evalúa por treatment los usos de decisiones automatizadas y sus salvaguardas. Stage 1 no administra solicitudes individuales de titulares.",
    activity_keys: [...D4_ACTIVITY_KEYS],
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
