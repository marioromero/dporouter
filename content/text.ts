/**
 * Utilidad textual mínima de la capa canónica.
 * Vive en /content para que las definiciones estructuradas no dependan
 * de la implementación de aplicación en /src.
 */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
