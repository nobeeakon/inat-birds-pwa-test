import { openDB, type DBSchema, type IDBPDatabase } from "idb";

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
    dbInstance = await openDB<BirdsDB>("BirdsInatDB", 2, {
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
