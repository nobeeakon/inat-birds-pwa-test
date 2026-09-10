/**
 * A conservation status as the list endpoints return it. They only ever hand back the
 * one status the API picked for the preferred place, not the full set a species can
 * carry: the plural `conservation_statuses` field is not available on species_counts or
 * observations, only on the taxa endpoint.
 */
export type ConservationStatus = {
  status?: string;
  /** Who listed it: "IUCN Red List", "Norma Oficial 059", "NatureServe"... */
  authority?: string;
};

/**
 * Reads as "amenazada (Norma Oficial 059)".
 *
 * The authority earns its space: the status alone is ambiguous across the bodies that
 * issue them, which each use their own vocabulary — IUCN's terse "EN" against NOM-059's
 * "en peligro de extinción" against NatureServe's "G5". Knowing a species is listed
 * nationally rather than globally is most of the point of asking about a place at all.
 *
 * Authorities come back with stray leading whitespace often enough to trim both.
 */
export const formatConservationStatus = (
  conservationStatus: ConservationStatus | undefined
): string | undefined => {
  const status = conservationStatus?.status?.trim();
  if (!status) {
    return undefined;
  }

  const authority = conservationStatus?.authority?.trim();
  return authority ? `${status} (${authority})` : status;
};
