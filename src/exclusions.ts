import type { SpecieInfo } from "@/storage/db";
import type { Taxa } from "@/taxa";

/**
 * Exclusions are scoped: a species hidden while browsing one location and taxa stays
 * visible everywhere else. The scope is stored as a string so it fits a plain array
 * in IndexedDB and can be compared with includes().
 */
export const getExclusionScope = (locationId: string, taxa: Taxa): string =>
  `${locationId}:${taxa}`;

export const isSpeciesExcluded = (
  speciesInfo: SpecieInfo | undefined,
  locationId: string,
  taxa: Taxa
): boolean =>
  !!speciesInfo?.excludedFromScopes?.includes(
    getExclusionScope(locationId, taxa)
  );

export const addExclusionScope = (
  speciesInfo: SpecieInfo,
  locationId: string,
  taxa: Taxa
): SpecieInfo => {
  const scope = getExclusionScope(locationId, taxa);
  const existingScopes = speciesInfo.excludedFromScopes ?? [];

  if (existingScopes.includes(scope)) return speciesInfo;

  return { ...speciesInfo, excludedFromScopes: [...existingScopes, scope] };
};

export const removeExclusionScope = (
  speciesInfo: SpecieInfo,
  locationId: string,
  taxa: Taxa
): SpecieInfo => {
  const scope = getExclusionScope(locationId, taxa);

  return {
    ...speciesInfo,
    excludedFromScopes: (speciesInfo.excludedFromScopes ?? []).filter(
      (existingScope) => existingScope !== scope
    ),
  };
};
