import type { ConservationStatus } from "@/conservation";

export type ObservationStatus =
  | "identified"
  | "unidentified"
  | "sortOfIdentified";

export type ObservationPhoto = {
  id: number;
  url: string;
  /** Ready to display, e.g. "(c) someone, some rights reserved (CC BY-NC)". */
  attribution?: string;
  /** Null on the photos whose owner reserved every right. */
  license_code?: string | null;
};

/**
 * A photo of another sighting, carrying which one it came from: the credit under it
 * links to the sighting it belongs to, not to the card it is being shown on.
 */
export type SpeciesPhoto = ObservationPhoto & { observationId: number };

export type ObservationType = {
  uuid: string;
  id: number;
  /**
   * Scientific family name, e.g. "Icteridae".
   *
   * Not part of the API response: the observations endpoint only returns ancestor
   * ids, so this is copied from the species list entry this observation was fetched
   * for. Absent on observations cached before the field existed.
   */
  family?: string | null;
  /**
   * Other local sightings of the same species, shown once the answer is revealed.
   *
   * Not part of the API response either, and not stored either: it is derived from the
   * whole page of sightings kept for the species (see @/observations/deck) each time a
   * round is assembled, which is why the deck keeps every sighting it fetched rather
   * than only the few that became cards.
   */
  speciesPhotos?: SpeciesPhoto[];
  photos: ObservationPhoto[];
  taxon: {
    id: number;
    name: string;
    preferred_common_name: string;
    conservation_status?: ConservationStatus;
    establishment_means?: {
      establishment_means: string;
    };
  };
};
