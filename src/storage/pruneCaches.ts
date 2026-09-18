import { getSavedLocationIds } from "@/locations";
import { decksStore, speciesListsStore } from "@/storage/db";

/**
 * Trims the fetched data the app keeps, once per start.
 *
 * Two things are dropped: entries belonging to locations the user has deleted, which
 * nothing can ever read again, and the least recently used of what is left.
 *
 * It runs here rather than on the read path it used to sit on. Dropping deleted
 * locations meant reading every stored species list — hundreds of species each,
 * deserialized — on every single read of one, to compare a handful of ids.
 *
 * Only fetched data is touched. The species info (notes, tags, exclusions, similar
 * species), the categories and the per species review record are the user's own and
 * are never pruned, however old.
 */

/**
 * Location and taxa combinations kept, of each of the species lists and the decks.
 *
 * Both are keyed by location *and* taxa, which is what makes four the right number
 * rather than two: someone with two locations who switches between birds and plants is
 * already on four combinations, and a limit of two would have every switch throw away
 * what the switch back is about to ask for. Four is a couple of megabytes.
 */
const MAX_KEPT_PER_STORE = 4;

type PrunableEntry = {
  id: string;
  locationId: string;
  lastUsedAt?: number;
};

/**
 * The ids to delete: the ones belonging to deleted locations, then the least recently
 * used of what remains. Entries stored before `lastUsedAt` existed sort oldest, which
 * makes them the first to go — they are also the ones least likely to still match.
 */
const getIdsToDelete = (
  entries: PrunableEntry[],
  savedLocationIds: Set<string>,
  currentId: string | null
): string[] => {
  const orphanedIds = entries
    .filter((entry) => !savedLocationIds.has(entry.locationId))
    .map((entry) => entry.id);

  const keptEntries = entries.filter((entry) =>
    savedLocationIds.has(entry.locationId)
  );

  // Trimmed first and only then spared, so that the limit counts the entries actually
  // kept. Whatever the user is on now stays wherever its timestamp puts it: evicting it
  // would mean refetching it before the page has finished rendering.
  const evictableIds = [...keptEntries]
    .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
    .slice(MAX_KEPT_PER_STORE)
    .filter((entry) => entry.id !== currentId)
    .map((entry) => entry.id);

  return [...orphanedIds, ...evictableIds];
};

export const pruneCaches = async (
  /** What the app opened on, which is kept whether or not it is among the most recent. */
  currentCacheId: string | null = null
): Promise<void> => {
  try {
    const savedLocationIds = getSavedLocationIds();

    const [speciesLists, decks] = await Promise.all([
      speciesListsStore.getAll(),
      decksStore.getAll(),
    ]);

    await Promise.all([
      ...getIdsToDelete(speciesLists, savedLocationIds, currentCacheId).map(
        (id) => speciesListsStore.delete(id)
      ),
      ...getIdsToDelete(decks, savedLocationIds, currentCacheId).map((id) =>
        decksStore.delete(id)
      ),
    ]);
  } catch (error) {
    // Nothing the user does depends on this; the worst of it is that the device keeps
    // a few megabytes it did not need to
    console.warn("Failed to prune the caches:", error);
  }
};
