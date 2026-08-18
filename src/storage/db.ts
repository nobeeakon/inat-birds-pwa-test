import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { SpeciesData } from "@/species/useFetchSpecies";
import type { Taxa } from "@/taxa";

export type Category = {
  id: string;
  name: string;
};

export type SpecieInfo = {
  taxonId: string;
  speciesName?: string;
  exclude?: boolean;
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

// The species list of a location, kept to fill the species page while it reloads.
// Too big for localStorage: a location can have hundreds of species.
export type CachedSpeciesList = {
  id: string; // Primary key, location and taxa the list belongs to
  locationId: string;
  taxa: Taxa;
  species: SpeciesData[];
  timestamp: number;
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
    dbInstance = await openDB<BirdsDB>("BirdsInatDB", 3, {
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
