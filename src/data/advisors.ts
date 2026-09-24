/**
 * Nómina fija de asesores (Stage 1, control de acceso local).
 *
 * NO es autenticación real ni Stage 2: es una puerta local
 * demostrativa para ordenar el hilo de trabajo (asesor → empresa).
 * Las credenciales viven en este módulo por instrucción explícita;
 * nunca se presentan como seguridad y nunca salen del navegador.
 */

export interface AdvisorSeed {
  /** Id estable de perfil asesor. */
  id: string;
  /** Nombre de usuario para el login (minúsculas, sin espacios). */
  username: string;
  /** Nombre visible. */
  name: string;
  /** Clave local demostrativa. */
  password: string;
}

export const DEFAULT_ADVISORS: AdvisorSeed[] = [
  { id: "asesor-pablo", username: "pablo", name: "Pablo", password: "admin123" },
  { id: "asesor-carlos", username: "carlos", name: "Carlos", password: "admin123" },
  { id: "asesor-mario", username: "mario", name: "Mario", password: "admin123" },
];

export function findAdvisorByUsername(username: string): AdvisorSeed | undefined {
  const q = username.trim().toLowerCase();
  if (q === "") return undefined;
  return DEFAULT_ADVISORS.find((a) => a.username === q);
}

/** Verifica usuario + clave contra la nómina fija. Puro, testeable. */
export function verifyAdvisor(username: string, password: string): AdvisorSeed | null {
  const found = findAdvisorByUsername(username);
  if (!found || password !== found.password) return null;
  return found;
}

export function isAdvisorProfileId(id: string): boolean {
  return DEFAULT_ADVISORS.some((a) => a.id === id);
}
