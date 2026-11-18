export function toggleMultiSelection(
  selected: readonly string[],
  optionId: string,
  exclusiveIds: readonly string[],
): string[] {
  const alreadySelected = selected.includes(optionId);
  if (exclusiveIds.includes(optionId)) {
    return alreadySelected ? [] : [optionId];
  }
  if (alreadySelected) return selected.filter((id) => id !== optionId);
  return [...selected.filter((id) => !exclusiveIds.includes(id)), optionId];
}
