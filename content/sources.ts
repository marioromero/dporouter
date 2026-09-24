import type { LegalBasis, RegulatoryStatus } from "../src/types";

/**
 * CANONICAL SOURCE OF TRUTH — registro jurídico estructurado.
 * Este archivo es la única fuente canónica del registro de fuentes.
 * `docs/domains/Dxx.md` son proyecciones humanas generadas.
 * No duplicar este contenido en archivos de implementación.
 */

/**
 * Registro estructurado de fuentes jurídicas canónicas para D1.
 * Metadata de importación progresiva; vive fuera de `ActivityDefinition`.
 * Solo las fuentes suministradas por la iteración vigente. No investigar.
 */
export interface CanonicalSource {
  source_id: string;
  name: string;
  kind: "law" | "regulation";
  regulatory_status: RegulatoryStatus;
  published_at: string;
  last_review: string;
  note: string;
  provisions_used: string[];
}

export const SOURCES: CanonicalSource[] = [
  {
    source_id: "cl_ley_19628_2026",
    name: "Ley N° 19.628 sobre Protección de la Vida Privada, texto modificado por Ley N° 21.719",
    kind: "law",
    regulatory_status: "transitional",
    published_at: "",
    last_review: "2026-09-21",
    note: "Texto legal promulgado con vigencia del nuevo régimen desde el 1 de diciembre de 2026.",
    provisions_used: [
      "Artículo 2",
      "Artículo 3",
      "Artículo 4",
      "Artículo 5",
      "Artículo 6",
      "Artículo 7",
      "Artículo 8",
      "Artículo 8 bis",
      "Artículo 8 ter",
      "Artículo 9",
      "Artículo 10",
      "Artículo 11",
      "Artículo 12",
      "Artículo 13",
      "Artículo 14",
      "Artículo 14 ter",
      "Artículo 2 letra g)",
      "Artículo 2 letra c)",
      "Artículo 2 letra v)",
      "Artículo 2 letra x)",
      "Artículo 3 letra d)",
      "Artículo 13 letra d)",
      "Artículo 14 bis",
      "Artículo 14 quinquies",
      "Artículo 14 septies",
      "Artículo 15",
      "Artículo 15 bis",
      "Artículo 13 letra a)",
      "Artículo 16",
      "Artículo 16 bis",
      "Artículo 16 ter",
      "Artículo 16 quáter",
      "Artículo 16 quinquies",
      "Artículo 16 sexies",
      "Artículo 17",
      "Artículo 18",
      "Artículo 19",
      "Artículo 48",
      "Artículo 49",
      "Artículo 50",
      "Artículo 51",
      "Artículo 52",
      "Artículo 53",
    ],
  },
  {
    source_id: "cl_decreto_662_2026",
    name: "Decreto N° 662 — Reglamento de los modelos de prevención de infracciones",
    kind: "regulation",
    regulatory_status: "transitional",
    published_at: "2026-09-09",
    last_review: "2026-09-21",
    note: "Reglamento publicado para la implementación, certificación, registro y supervisión de los modelos de prevención de infracciones vinculados al nuevo régimen de protección de datos.",
    provisions_used: [
      "Artículo 1",
      "Artículo 3",
      "Artículo 4",
      "Artículo 5",
      "Artículo 6",
      "Artículo 7",
      "Artículo 8",
      "Artículo 9",
      "Artículo 10",
      "Artículo 11",
      "Artículo 12",
      "Artículo 13",
      "Artículo 14",
      "Artículo 15",
      "Artículo 16",
      "Artículo 17",
      "Artículo 18",
      "Artículo 19",
      "Artículo 20",
    ],
  },
];

export function getSource(sourceId: string): CanonicalSource {
  const found = SOURCES.find((s) => s.source_id === sourceId);
  if (!found) {
    throw new Error(`Fuente canónica desconocida: ${sourceId}`);
  }
  return found;
}

/**
 * Construye una referencia `LegalBasis` desde el registro controlado.
 * `reference_text` y `source_url` se conservan vacíos: no existe URL
 * canónica controlada y no se inventan citas ni enlaces.
 */
export function basis(sourceId: string, provision: string): LegalBasis {
  const s = getSource(sourceId);
  return {
    source_id: s.source_id,
    source_name: s.name,
    article_or_provision: provision,
    reference_text: "",
    source_url: "",
    basis_type: s.kind,
    regulatory_status: s.regulatory_status,
    last_verified_at: s.last_review,
  };
}
