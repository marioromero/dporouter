import { statusOfCandidates } from "./facts";
import type {
  CompanyState,
  ExecutionContext,
  ExecutionScope,
  FactRecord,
  PurposeScopedState,
  TreatmentScopedState,
} from "./types";
import { newId, nowIso } from "./types";
import type { FactMap } from "../../content/protocols/types";

/**
 * Identidad + scope Stage 1 (Company → TreatmentContext → TreatmentPurpose).
 *
 * Reglas contractuales:
 * - La identidad semántica de un fact es (scope, ancestry, factKey).
 *   `protocolKey` es provenance/source, NUNCA parte de la identidad.
 * - La dirección de purpose embebe `treatmentId`: la ancestry viaja en
 *   la propia dirección y es verificable sin lookups globales.
 * - `protocolAnswers` conserva su nombre y forma en cada scope
 *   (`Record<protocolKey, Record<factKey, FactRecord>>`); no existe un
 *   store genérico de facts.
 * - Precedencia en vista: el valor propio del execution scope es el
 *   efectivo; los ancestors rellenan claves ausentes. Nunca hay
 *   conflicto cross-scope.
 */

export type ScopedFactAddress =
  | { scope: "company"; companyId: string; factKey: string }
  | {
      scope: "treatment";
      companyId: string;
      treatmentId: string;
      factKey: string;
    }
  | {
      scope: "purpose";
      companyId: string;
      treatmentId: string;
      purposeId: string;
      factKey: string;
    };

/** Clave serializada determinista de una dirección (mapas internos). */
export function addressKey(address: ScopedFactAddress): string {
  switch (address.scope) {
    case "company":
      return JSON.stringify(["c", address.companyId, address.factKey]);
    case "treatment":
      return JSON.stringify([
        "t",
        address.companyId,
        address.treatmentId,
        address.factKey,
      ]);
    case "purpose":
      return JSON.stringify([
        "p",
        address.companyId,
        address.treatmentId,
        address.purposeId,
        address.factKey,
      ]);
  }
}

export function addressOf(
  ctx: ExecutionContext,
  factKey: string,
): ScopedFactAddress {
  switch (ctx.scope) {
    case "company":
      return { scope: "company", companyId: ctx.companyId, factKey };
    case "treatment":
      return {
        scope: "treatment",
        companyId: ctx.companyId,
        treatmentId: ctx.treatmentId,
        factKey,
      };
    case "purpose":
      return {
        scope: "purpose",
        companyId: ctx.companyId,
        treatmentId: ctx.treatmentId,
        purposeId: ctx.purposeId,
        factKey,
      };
  }
}

// ---------------------------------------------------------------------------
// Resolución estructural (nunca por unicidad de IDs)
// ---------------------------------------------------------------------------

export function getTreatment(
  company: CompanyState | null,
  treatmentId: string,
): TreatmentScopedState | undefined {
  if (!company) return undefined;
  const t = company.treatments?.[treatmentId];
  if (!t || t.context.companyId !== company.id) return undefined;
  return t;
}

export function getPurpose(
  company: CompanyState | null,
  treatmentId: string,
  purposeId: string,
): PurposeScopedState | undefined {
  const t = getTreatment(company, treatmentId);
  const p = t?.purposes[purposeId];
  if (!p || p.purpose.treatmentId !== treatmentId) return undefined;
  return p;
}

/**
 * Valida un execution context por recorrido estructural. Un parentage
 * incorrecto (treatment de otra company, purpose de otro treatment)
 * se rechaza devolviendo null.
 */
export function resolveExecutionContext(
  company: CompanyState | null,
  ctx: ExecutionContext,
): boolean {
  if (!company || company.id !== ctx.companyId) return false;
  if (ctx.scope === "company") return true;
  if (!getTreatment(company, ctx.treatmentId)) return false;
  if (ctx.scope === "treatment") return true;
  return getPurpose(company, ctx.treatmentId, ctx.purposeId) !== undefined;
}

/** Contexto efectivo desde la selección activa (null si inválida). */
export function activeExecutionContext(
  company: CompanyState | null,
  scope: ExecutionScope,
): ExecutionContext | null {
  if (!company) return null;
  if (scope === "company") return { scope: "company", companyId: company.id };
  const treatmentId = company.activeTreatmentId;
  if (!treatmentId || !getTreatment(company, treatmentId)) return null;
  if (scope === "treatment") {
    return { scope: "treatment", companyId: company.id, treatmentId };
  }
  const purposeId = company.activePurposeId;
  if (!purposeId || !getPurpose(company, treatmentId, purposeId)) return null;
  return {
    scope: "purpose",
    companyId: company.id,
    treatmentId,
    purposeId,
  };
}

// ---------------------------------------------------------------------------
// Operaciones workspace (objetos jurídicos; nunca progreso ni outcomes)
// ---------------------------------------------------------------------------

function touchCompany(company: CompanyState): CompanyState {
  return { ...company, updatedAt: nowIso() };
}

/** Refresca el sello temporal en operaciones de subárbol (locals.ts). */
export function touchCompanyState(company: CompanyState): CompanyState {
  return touchCompany(company);
}

export function createTreatment(
  company: CompanyState,
  input: { name: string; description?: string; canonicalTreatmentId?: string },
): { company: CompanyState; treatmentId: string } | null {
  const name = input.name.trim();
  if (name === "") return null;
  const id = newId("trat");
  const treatments = { ...(company.treatments ?? {}) };
  treatments[id] = {
    context: {
      id,
      companyId: company.id,
      ...(input.canonicalTreatmentId !== undefined
        ? { canonicalTreatmentId: input.canonicalTreatmentId }
        : {}),
      name,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    },
    protocolAnswers: {},
    reasoningRecords: {},
    purposes: {},
  };
  return {
    company: touchCompany({ ...company, treatments }),
    treatmentId: id,
  };
}

export function renameTreatment(
  company: CompanyState,
  treatmentId: string,
  input: { name?: string; description?: string; canonicalTreatmentId?: string },
): CompanyState | null {
  const t = getTreatment(company, treatmentId);
  if (!t) return null;
  const name = input.name !== undefined ? input.name.trim() : t.context.name;
  if (name === "") return null;
  return touchCompany({
    ...company,
    treatments: {
      ...(company.treatments ?? {}),
      [treatmentId]: {
        ...t,
        context: {
          ...t.context,
          name,
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.canonicalTreatmentId !== undefined
            ? { canonicalTreatmentId: input.canonicalTreatmentId }
            : {}),
        },
      },
    },
  });
}

/**
 * Hard-delete con cascada: treatment, purposes hijos, protocol state y
 * reasoning del subárbol, más navegación afectada. Sin soft-delete ni
 * historial (Stage 1).
 */
export function deleteTreatment(
  company: CompanyState,
  treatmentId: string,
): CompanyState | null {
  if (!getTreatment(company, treatmentId)) return null;
  const treatments = { ...(company.treatments ?? {}) };
  delete treatments[treatmentId];
  const next: CompanyState = touchCompany({ ...company, treatments });
  if (next.activeTreatmentId === treatmentId) {
    delete next.activeTreatmentId;
    delete next.activePurposeId;
  }
  return next;
}

export function selectTreatment(
  company: CompanyState,
  treatmentId: string | null,
): CompanyState | null {
  if (treatmentId === null) {
    if (
      company.activeTreatmentId === undefined &&
      company.activePurposeId === undefined
    ) {
      return company;
    }
    const next = touchCompany({ ...company });
    delete next.activeTreatmentId;
    delete next.activePurposeId;
    return next;
  }
  if (!getTreatment(company, treatmentId)) return null;
  if (
    company.activeTreatmentId === treatmentId &&
    (company.activePurposeId === undefined ||
      getPurpose(company, treatmentId, company.activePurposeId))
  ) {
    return company;
  }
  // Cambiar de treatment invalida un purpose incompatible.
  const next = touchCompany({ ...company, activeTreatmentId: treatmentId });
  if (
    next.activePurposeId === undefined ||
    !getPurpose(next, treatmentId, next.activePurposeId)
  ) {
    delete next.activePurposeId;
  }
  return next;
}

export function createPurpose(
  company: CompanyState,
  treatmentId: string,
  description: string,
): { company: CompanyState; purposeId: string } | null {
  const t = getTreatment(company, treatmentId);
  if (!t || description.trim() === "") return null;
  const id = newId("fin");
  return {
    company: touchCompany({
      ...company,
      treatments: {
        ...(company.treatments ?? {}),
        [treatmentId]: {
          ...t,
          purposes: {
            ...t.purposes,
            [id]: {
              purpose: { id, treatmentId, description: description.trim() },
              protocolAnswers: {},
              reasoningRecords: {},
            },
          },
        },
      },
    }),
    purposeId: id,
  };
}

export function renamePurpose(
  company: CompanyState,
  treatmentId: string,
  purposeId: string,
  description: string,
): CompanyState | null {
  const p = getPurpose(company, treatmentId, purposeId);
  const t = getTreatment(company, treatmentId);
  if (!p || !t || description.trim() === "") return null;
  return touchCompany({
    ...company,
    treatments: {
      ...(company.treatments ?? {}),
      [treatmentId]: {
        ...t,
        purposes: {
          ...t.purposes,
          [purposeId]: {
            ...p,
            purpose: { ...p.purpose, description: description.trim() },
          },
        },
      },
    },
  });
}

/** Hard-delete con purga del protocol state propio + links + navegación. */
export function deletePurpose(
  company: CompanyState,
  treatmentId: string,
  purposeId: string,
): CompanyState | null {
  const t = getTreatment(company, treatmentId);
  if (!t || !t.purposes[purposeId]) return null;
  const purposes = { ...t.purposes };
  delete purposes[purposeId];
  const next = touchCompany({
    ...company,
    treatments: {
      ...(company.treatments ?? {}),
      [treatmentId]: {
        ...t,
        purposes,
        dataPurposeLinks: (t.dataPurposeLinks ?? []).filter(
          (l) => l.purposeId !== purposeId,
        ),
      },
    },
  });
  if (
    next.activeTreatmentId === treatmentId &&
    next.activePurposeId === purposeId
  ) {
    delete next.activePurposeId;
  }
  return next;
}

export function selectPurpose(
  company: CompanyState,
  treatmentId: string,
  purposeId: string | null,
): CompanyState | null {
  if (!getTreatment(company, treatmentId)) return null;
  if (purposeId === null) {
    if (
      company.activeTreatmentId === treatmentId &&
      company.activePurposeId === undefined
    ) {
      return company;
    }
    const next = touchCompany({
      ...company,
      activeTreatmentId: treatmentId,
    });
    delete next.activePurposeId;
    return next;
  }
  // Nunca resolver un purpose solo por purposeId: exige su treatment.
  if (!getPurpose(company, treatmentId, purposeId)) return null;
  if (
    company.activeTreatmentId === treatmentId &&
    company.activePurposeId === purposeId
  ) {
    return company;
  }
  return touchCompany({
    ...company,
    activeTreatmentId: treatmentId,
    activePurposeId: purposeId,
  });
}

// ---------------------------------------------------------------------------
// Protocol state scopeado (protocolAnswers conserva nombre y forma)
// ---------------------------------------------------------------------------

function scopedAnswerMaps(
  company: CompanyState | null,
  ctx: ExecutionContext,
): Record<string, Record<string, FactRecord>> | null {
  if (!company || company.id !== ctx.companyId) return null;
  switch (ctx.scope) {
    case "company":
      return company.protocolAnswers;
    case "treatment":
      return getTreatment(company, ctx.treatmentId)?.protocolAnswers ?? null;
    case "purpose":
      return (
        getPurpose(company, ctx.treatmentId, ctx.purposeId)?.protocolAnswers ??
        null
      );
  }
}

export function getScopedProtocolAnswers(
  company: CompanyState | null,
  ctx: ExecutionContext,
  protocolKey: string,
): Record<string, FactRecord> {
  return scopedAnswerMaps(company, ctx)?.[protocolKey] ?? {};
}

function setInMaps(
  company: CompanyState,
  ctx: ExecutionContext,
  protocolKey: string,
  answers: Record<string, FactRecord>,
): CompanyState | null {
  if (company.id !== ctx.companyId) return null;
  if (ctx.scope === "company") {
    return touchCompany({
      ...company,
      protocolAnswers: { ...company.protocolAnswers, [protocolKey]: answers },
    });
  }
  const t = getTreatment(company, ctx.treatmentId);
  if (!t) return null;
  if (ctx.scope === "treatment") {
    return touchCompany({
      ...company,
      treatments: {
        ...(company.treatments ?? {}),
        [ctx.treatmentId]: {
          ...t,
          protocolAnswers: { ...t.protocolAnswers, [protocolKey]: answers },
        },
      },
    });
  }
  const p = t.purposes[ctx.purposeId];
  if (!p) return null;
  return touchCompany({
    ...company,
    treatments: {
      ...(company.treatments ?? {}),
      [ctx.treatmentId]: {
        ...t,
        purposes: {
          ...t.purposes,
          [ctx.purposeId]: {
            ...p,
            protocolAnswers: { ...p.protocolAnswers, [protocolKey]: answers },
          },
        },
      },
    },
  });
}

export function saveScopedProtocolAnswer(
  company: CompanyState,
  ctx: ExecutionContext,
  protocolKey: string,
  factKey: string,
  value: string,
  source: string,
): CompanyState | null {
  if (!resolveExecutionContext(company, ctx)) return null;
  const current = getScopedProtocolAnswers(company, ctx, protocolKey);
  return setInMaps(company, ctx, protocolKey, {
    ...current,
    [factKey]: { value, source, updatedAt: nowIso() },
  });
}

export function clearScopedProtocolAnswers(
  company: CompanyState,
  ctx: ExecutionContext,
  protocolKey: string,
): CompanyState | null {
  if (!resolveExecutionContext(company, ctx)) return null;
  if (!(protocolKey in (scopedAnswerMaps(company, ctx) ?? {}))) return company;
  const maps = scopedAnswerMaps(company, ctx);
  if (!maps) return null;
  const pruned = { ...maps };
  delete pruned[protocolKey];
  // Se escribe el contenedor podado en su scope.
  if (ctx.scope === "company") {
    return touchCompany({ ...company, protocolAnswers: pruned });
  }
  const t = getTreatment(company, ctx.treatmentId);
  if (!t) return null;
  if (ctx.scope === "treatment") {
    return touchCompany({
      ...company,
      treatments: {
        ...(company.treatments ?? {}),
        [ctx.treatmentId]: { ...t, protocolAnswers: pruned },
      },
    });
  }
  const p = t.purposes[ctx.purposeId];
  if (!p) return null;
  return touchCompany({
    ...company,
    treatments: {
      ...(company.treatments ?? {}),
      [ctx.treatmentId]: {
        ...t,
        purposes: {
          ...t.purposes,
          [ctx.purposeId]: { ...p, protocolAnswers: pruned },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Vista de facts por execution context (merge con precedencia, sin
// conflicto cross-scope). El valor propio del scope es el efectivo;
// los ancestors rellenan claves ausentes.
// ---------------------------------------------------------------------------

function recordsAtAddress(
  company: CompanyState,
  address: ScopedFactAddress,
): FactRecord[] {
  const out: FactRecord[] = [];
  if (address.scope === "company") {
    const diag = company.diagnosticFacts[address.factKey];
    if (diag) out.push(diag);
    for (const answers of Object.values(company.protocolAnswers)) {
      const r = answers[address.factKey];
      if (r) out.push(r);
    }
    return out;
  }
  if (address.scope === "treatment") {
    const t = getTreatment(company, address.treatmentId);
    if (!t) return out;
    for (const answers of Object.values(t.protocolAnswers)) {
      const r = answers[address.factKey];
      if (r) out.push(r);
    }
    return out;
  }
  const p = getPurpose(company, address.treatmentId, address.purposeId);
  if (!p) return out;
  for (const answers of Object.values(p.protocolAnswers)) {
    const r = answers[address.factKey];
    if (r) out.push(r);
  }
  return out;
}

function addressesForKey(
  ctx: ExecutionContext,
  factKey: string,
): ScopedFactAddress[] {
  const company: ScopedFactAddress = {
    scope: "company",
    companyId: ctx.companyId,
    factKey,
  };
  if (ctx.scope === "company") return [company];
  const treatment: ScopedFactAddress = {
    scope: "treatment",
    companyId: ctx.companyId,
    treatmentId: ctx.treatmentId,
    factKey,
  };
  if (ctx.scope === "treatment") return [treatment, company];
  return [
    {
      scope: "purpose",
      companyId: ctx.companyId,
      treatmentId: ctx.treatmentId,
      purposeId: ctx.purposeId,
      factKey,
    },
    treatment,
    company,
  ];
}

/** Claves conocidas en la cadena de scopes (propio → ancestors). */
export function scopedFactKeys(
  company: CompanyState | null,
  ctx: ExecutionContext,
): string[] {
  if (!company || company.id !== ctx.companyId) return [];
  const keys = new Set<string>([
    ...Object.keys(company.diagnosticFacts),
    ...Object.values(company.protocolAnswers).flatMap((a) => Object.keys(a)),
  ]);
  if (ctx.scope !== "company") {
    const t = getTreatment(company, ctx.treatmentId);
    if (t) {
      for (const a of Object.values(t.protocolAnswers)) {
        for (const k of Object.keys(a)) keys.add(k);
      }
      if (ctx.scope === "purpose") {
        const p = t.purposes[ctx.purposeId];
        if (p) {
          for (const a of Object.values(p.protocolAnswers)) {
            for (const k of Object.keys(a)) keys.add(k);
          }
        }
      }
    }
  }
  return [...keys];
}

export type ScopedFactState = "absent" | "unknown" | "resolved" | "conflict";

/** ¿Rige esta resolución en la dirección indicada? Ausente = company. */
export function resolutionAppliesTo(
  resolution: CompanyState["factResolutions"][string] | undefined,
  address: ScopedFactAddress,
): boolean {
  if (!resolution) return false;
  const scope = resolution.scope ?? "company";
  if (scope !== address.scope) return false;
  if (address.scope === "treatment") {
    return resolution.treatmentId === address.treatmentId;
  }
  if (address.scope === "purpose") {
    return (
      resolution.treatmentId === address.treatmentId &&
      resolution.purposeId === address.purposeId
    );
  }
  return true;
}

/**
 * Estado efectivo de un fact en la vista: primera dirección (propio →
 * ancestors) con observaciones decide. Conflicto solo intra-dirección.
 */
export function getScopedFactState(
  company: CompanyState | null,
  ctx: ExecutionContext,
  factKey: string,
): { state: ScopedFactState; value?: string } {
  if (!company || company.id !== ctx.companyId) {
    return { state: "absent" };
  }
  for (const address of addressesForKey(ctx, factKey)) {
    const records = recordsAtAddress(company, address);
    if (records.length === 0) continue;
    const resolution = company.factResolutions[factKey];
    const status = statusOfCandidates(
      records,
      resolutionAppliesTo(resolution, address) ? resolution : undefined,
    );
    if (status.state === "conflict") return { state: "conflict" };
    if (status.state === "resolved") {
      return { state: "resolved", value: status.value };
    }
    return { state: "unknown" };
  }
  return { state: "absent" };
}

/** Vista FactMap para motor/progreso/outcomes (solo valores efectivos). */
export function buildScopedFactMap(
  company: CompanyState | null,
  ctx: ExecutionContext,
): FactMap {
  const out: FactMap = {};
  for (const k of scopedFactKeys(company, ctx)) {
    const st = getScopedFactState(company, ctx, k);
    if (st.state === "resolved" && st.value !== undefined) {
      out[k] = st.value;
    } else if (st.state === "unknown" || st.state === "conflict") {
      // Preserva la semántica unknown/conflict del motor: unknown queda
      // registrado sin resolver; conflict viaja como última observación
      // (la conclusión definitiva se bloquea por separado).
      const address = addressesForKey(ctx, k).find(
        (a) => recordsAtAddress(company as CompanyState, a).length > 0,
      );
      const recs = address
        ? recordsAtAddress(company as CompanyState, address)
        : [];
      const latest = [...recs].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      )[0];
      if (latest) out[k] = latest.value;
    }
  }
  return out;
}

/**
 * Última observación por fuente en la dirección propia del contexto.
 * Base para resoluciones explícitas scopeadas.
 */
export function scopedAddressAlternatives(
  company: CompanyState | null,
  ctx: ExecutionContext,
  factKey: string,
): FactRecord[] {
  if (!company || company.id !== ctx.companyId) return [];
  const address = addressOf(ctx, factKey);
  const bySource = new Map<string, FactRecord>();
  for (const r of recordsAtAddress(company, address)) {
    const prev = bySource.get(r.source);
    if (!prev || r.updatedAt >= prev.updatedAt) bySource.set(r.source, r);
  }
  return [...bySource.values()];
}
/**
 * Facts necesarios en conflicto dentro de la vista: bloquean conclusión
 * definitiva. Solo intra-dirección efectiva, nunca cross-scope.
 */
export function blockingScopedConflicts(
  neededFactKeys: string[],
  company: CompanyState | null,
  ctx: ExecutionContext,
): string[] {
  if (!company) return [];
  return neededFactKeys.filter(
    (k) => getScopedFactState(company, ctx, k).state === "conflict",
  );
}

/**
 * Clon transitorio sin las respuestas propias de un protocolo en la
 * dirección del contexto. Solo para computar hechos inyectados
 * ("Dato ya disponible"); nunca se persiste.
 */
export function excludeScopedProtocol(
  company: CompanyState,
  ctx: ExecutionContext,
  protocolKey: string,
): CompanyState {
  if (ctx.scope === "company") {
    if (!(protocolKey in company.protocolAnswers)) return company;
    const protocolAnswers = { ...company.protocolAnswers };
    delete protocolAnswers[protocolKey];
    return { ...company, protocolAnswers };
  }
  const t = getTreatment(company, ctx.treatmentId);
  if (!t) return company;
  if (ctx.scope === "treatment") {
    if (!(protocolKey in t.protocolAnswers)) return company;
    const protocolAnswers = { ...t.protocolAnswers };
    delete protocolAnswers[protocolKey];
    return {
      ...company,
      treatments: {
        ...(company.treatments ?? {}),
        [ctx.treatmentId]: { ...t, protocolAnswers },
      },
    };
  }
  const p = t.purposes[ctx.purposeId];
  if (!p || !(protocolKey in p.protocolAnswers)) return company;
  const protocolAnswers = { ...p.protocolAnswers };
  delete protocolAnswers[protocolKey];
  return {
    ...company,
    treatments: {
      ...(company.treatments ?? {}),
      [ctx.treatmentId]: {
        ...t,
        purposes: {
          ...t.purposes,
          [ctx.purposeId]: { ...p, protocolAnswers },
        },
      },
    },
  };
}

/**
 * Última observación inyectada de un fact (propio → ancestors, sin las
 * respuestas propias del protocolo). Solo display de origen.
 */
export function scopedInjectedRecord(
  company: CompanyState | null,
  ctx: ExecutionContext,
  excludeProtocolKey: string,
  factKey: string,
): FactRecord | undefined {
  if (!company || company.id !== ctx.companyId) return undefined;
  const stripped = excludeScopedProtocol(company, ctx, excludeProtocolKey);
  for (const address of addressesForKey(ctx, factKey)) {
    const recs = recordsAtAddress(stripped, address);
    if (recs.length === 0) continue;
    return [...recs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }
  return undefined;
}
