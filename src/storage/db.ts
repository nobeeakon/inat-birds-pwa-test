import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { Language } from "@/language";
import type { ObservationType } from "@/observations/types";
import type { SpeciesData } from "@/species/useFetchSpecies";
import type { Taxa } from "@/taxa";

export type Category = {
  id: string;
  name: string;
};

export type SpecieInfo = {
  taxonId: string;
  speciesName?: string;
  /** Location and taxa combinations the species is hidden from, see @/exclusions */
  excludedFromScopes?: string[];
  personalNotes?: string[];
  categoryIds?: string[];
  preferredSpeciesImage?: string;
  similarSpeciesIds?: string[];
};

// Database interfaces
export type CachedSpeciesInfo = {
  id: string; // Primary key
  data: SpecieInfo; // The full species information
  timestamp: number;
};

// The species list of a location, kept to fill the species page while it reloads and,
// while it is still current, to stand in for reloading it at all (see
// @/species/speciesListCache). Too big for localStorage: a location can have hundreds
// of species.
export type CachedSpeciesList = {
  id: string; // Primary key, location and taxa the list belongs to
  locationId: string;
  taxa: Taxa;
  species: SpeciesData[];
  // How many species the location has in total, which can be more than were
  // fetched. Absent on entries written before it was stored.
  totalResults?: number;
  // The rest of what the request was made of. A location keeps its id when it is moved
  // or its radius edited, so without these an entry could be served for a request it
  // never answered. Absent, like the language below, on entries written before them.
  lat?: number;
  lng?: number;
  radius?: number;
  // The language the common names in the list came back in
  language?: Language;
  timestamp: number; // When the species were fetched
  // When the species total was last found to still match, which is what allows a list
  // to outlive its freshness window without being fetched again
  verifiedAt?: number;
  // When the list was last read for a location the user was actually on, which is what
  // decides whether it survives the prune (see @/storage/pruneCaches). Absent on
  // entries written before it existed, which makes them the first to go.
  lastUsedAt?: number;
};

// The sightings kept for one species, so a later round can show it again without
// fetching it a second time (see @/observations/deck).
export type DeckEntry = {
  taxonId: number;
  // Copied from the species list entry the species was drawn from: the observations
  // endpoint only returns ancestor ids, so it cannot be read back off a sighting
  family?: string | null;
  // Every sighting the request brought back, not only the few that became cards. The
  // rest are what the reveal deck is built from, and what lets a reused species show a
  // different set of cards each round.
  observations: ObservationType[];
  fetchedAt: number;
};

// A location's deck: the species it has already fetched sightings for. Keyed by
// location and taxa like the species list is, with the rest of the request kept as
// fields so that moving or resizing a location overwrites its deck rather than
// leaving one behind that nothing will read again.
export type CachedDeck = {
  id: string; // Primary key, location and taxa the deck belongs to
  locationId: string;
  taxa: Taxa;
  lat: number;
  lng: number;
  radius: number;
  // The language the common names on the sightings came back in
  language: Language;
  entries: DeckEntry[];
  // When a round last drew from this deck, which is what decides whether it survives
  // the prune (see @/storage/pruneCaches)
  lastUsedAt: number;
};

/**
 * How a species has gone for the user, across every session and every location.
 *
 * Kept apart from the decks because it is the user's own record rather than fetched
 * data: it is what the reinforcement half of a round is chosen from, and it is never
 * pruned. One small row per species ever seen.
 */
export type SpeciesReview = {
  taxonId: number; // Primary key
  seen: number;
  unidentified: number;
  sortOfIdentified: number;
  lastSeenAt: number;
};

// Database schema
interface BirdsDB extends DBSchema {
  speciesInfo: {
    key: string; // id
    value: CachedSpeciesInfo;
    indexes: { timestamp: number };
  };
  categories: {
    key: string; // id
    value: Category;
  };

  speciesLists: {
    key: string; // id
    value: CachedSpeciesList;
  };

  decks: {
    key: string; // id
    value: CachedDeck;
  };

  speciesReviews: {
    key: number; // taxonId
    value: SpeciesReview;
  };

  speciesNotes: {
    // Old store name for migration
    key: string; // id
    value: CachedSpeciesInfo;
    indexes: { timestamp: number };
  };
}

// Database instance
let dbInstance: IDBPDatabase<BirdsDB> | null = null;

async function getDB(): Promise<IDBPDatabase<BirdsDB>> {
  if (!dbInstance) {
    dbInstance = await openDB<BirdsDB>("BirdsInatDB", 5, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        // Version 1: Create initial speciesNotes store
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains("speciesNotes")) {
            const speciesStore = db.createObjectStore("speciesNotes", {
              keyPath: "id",
            });
            speciesStore.createIndex("timestamp", "timestamp");
          }
        }

        // Version 2: Migrate from speciesNotes to speciesInfo and add categories
        if (oldVersion < 2) {
          // Create new speciesInfo store
          if (!db.objectStoreNames.contains("speciesInfo")) {
            const speciesInfoStore = db.createObjectStore("speciesInfo", {
              keyPath: "id",
            });
            speciesInfoStore.createIndex("timestamp", "timestamp");
          }

          // Migrate data from old store to new store
          if (db.objectStoreNames.contains("speciesNotes")) {
            const oldStore = transaction.objectStore("speciesNotes");
            const newStore = transaction.objectStore("speciesInfo");

            // Get all records from old store and copy to new store
            let cursor = await oldStore.openCursor();
            while (cursor) {
              await newStore.put(cursor.value);
              cursor = await cursor.continue();
            }

            // Delete old store after migration
            db.deleteObjectStore("speciesNotes");
          }

          // Create categories store
          if (!db.objectStoreNames.contains("categories")) {
            db.createObjectStore("categories", {
              keyPath: "id",
            });
          }
        }

        // Version 3: Add the cached species lists store
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains("speciesLists")) {
            db.createObjectStore("speciesLists", {
              keyPath: "id",
            });
          }
        }

        // Version 4: Exclusions became per location and taxa. The old global flag
        // is dropped rather than mapped onto a location, as there is no way to tell
        // which one it was made from.
        if (oldVersion < 4) {
          const speciesInfoStore = transaction.objectStore("speciesInfo");

          let cursor = await speciesInfoStore.openCursor();
          while (cursor) {
            if ("exclude" in cursor.value.data) {
              const data: SpecieInfo & { exclude?: unknown } = {
                ...cursor.value.data,
              };
              delete data.exclude;
              await cursor.update({ ...cursor.value, data });
            }
            cursor = await cursor.continue();
          }
        }

        // Version 5: the decks a round is assembled from, and the per species record
        // its reinforcement half is chosen out of
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains("decks")) {
            db.createObjectStore("decks", { keyPath: "id" });
          }

          if (!db.objectStoreNames.contains("speciesReviews")) {
            db.createObjectStore("speciesReviews", { keyPath: "taxonId" });
          }
        }
      },
    });
  }
  return dbInstance;
}

export const speciesInfoStore = {
  set: async (uuid: string, data: SpecieInfo): Promise<void> => {
    const db = await getDB();

    await db.put("speciesInfo", {
      id: uuid,
      data,
      timestamp: Date.now(),
    });
  },
  get: async (id: string): Promise<CachedSpeciesInfo | undefined> => {
    const db = await getDB();
    return await db.get("speciesInfo", id);
  },
  getAll: async (): Promise<CachedSpeciesInfo[]> => {
    const db = await getDB();
    return await db.getAll("speciesInfo");
  },
};

export const speciesListsStore = {
  set: async (speciesList: CachedSpeciesList): Promise<void> => {
    const db = await getDB();
    await db.put("speciesLists", speciesList);
  },
  get: async (id: string): Promise<CachedSpeciesList | undefined> => {
    const db = await getDB();
    return await db.get("speciesLists", id);
  },
  getAll: async (): Promise<CachedSpeciesList[]> => {
    const db = await getDB();
    return await db.getAll("speciesLists");
  },
  delete: async (id: string): Promise<void> => {
    const db = await getDB();
    await db.delete("speciesLists", id);
  },
};

export const decksStore = {
  set: async (deck: CachedDeck): Promise<void> => {
    const db = await getDB();
    await db.put("decks", deck);
  },
  get: async (id: string): Promise<CachedDeck | undefined> => {
    const db = await getDB();
    return await db.get("decks", id);
  },
  getAll: async (): Promise<CachedDeck[]> => {
    const db = await getDB();
    return await db.getAll("decks");
  },
  delete: async (id: string): Promise<void> => {
    const db = await getDB();
    await db.delete("decks", id);
  },
};

export const speciesReviewsStore = {
  set: async (review: SpeciesReview): Promise<void> => {
    const db = await getDB();
    await db.put("speciesReviews", review);
  },
  get: async (taxonId: number): Promise<SpeciesReview | undefined> => {
    const db = await getDB();
    return await db.get("speciesReviews", taxonId);
  },
  getAll: async (): Promise<SpeciesReview[]> => {
    const db = await getDB();
    return await db.getAll("speciesReviews");
  },
};

export const categoriesStore = {
  set: async (category: Category): Promise<void> => {
    const db = await getDB();
    await db.put("categories", category);
  },
  get: async (id: string): Promise<Category | undefined> => {
    const db = await getDB();
    return await db.get("categories", id);
  },
  getAll: async (): Promise<Category[]> => {
    const db = await getDB();
    return await db.getAll("categories");
  },
  delete: async (id: string): Promise<void> => {
    const db = await getDB();
    await db.delete("categories", id);
  },
};
