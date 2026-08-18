/**
 * Helpers for reading ranks out of an iNaturalist taxon ancestry.
 *
 * Ancestors come back as a flat list ordered from kingdom down to genus, so a rank
 * is found by name rather than by position.
 */

export type TaxonAncestor = {
  name: string;
  rank: string;
};

export const getFamilyName = (
  ancestors: TaxonAncestor[] | undefined
): string | null =>
  ancestors?.find((ancestor) => ancestor.rank === "family")?.name ?? null;
