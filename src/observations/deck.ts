import { FALLBACK_LANGUAGE, getStoredLanguage } from "@/language";
import type { ObservationType, SpeciesPhoto } from "@/observations/types";
import { decksStore, type DeckEntry } from "@/storage/db";
import type { Taxa } from "@/taxa";
import { pickRandom } from "@/utils";

/**
 * The sightings a location has already been shown, kept so that a round can be put
 * together out of species it has met before instead of fetching all fifteen again.
 *
 * One request per species is what a round used to cost, every round, against a rate
 * limit shared with everything else the app asks for. The deck turns that into a cost
 * paid once per species: a round takes its reinforcement half straight from here, and
 * only spends requests on the species of its random half that the deck does not hold
 * or holds too old a copy of.
 *
 * It is also what the observations page shows while a round is being assembled, which
 * is the job the old cached-observations entry in localStorage used to do.
 */

export type DeckCacheKey = {
  locationId: string;
  taxa: Taxa;
  lat: number;
  lng: number;
  radius: number;
};

/**
 * Species the deck holds, past which the ones fetched longest ago are dropped.
 *
 * Fifty covers the default pool outright, so a returning user's round eventually costs
 * nothing at all. A wider pool is only partly covered and keeps paying for the misses,
 * which is the trade for not letting a deck grow without limit.
 */
export const DECK_MAX_SPECIES = 50;

/**
 * How long a species' sightings are reused before being fetched again.
 *
 * Applies to the random half of a round only. The reinforcement half is chosen before
 * anything is swept and deliberately ignores this: a species the user keeps failing to
 * name is worth showing again whatever the age of the copy in hand, and the photographs
 * of a bird do not go out of date the way a species list does.
 */
export const DECK_ENTRY_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/** Cards made per species, out of the sightings the deck holds for it. */
const CARDS_PER_SPECIES = 5;

/** Photos kept per species for the reveal, beyond the card's own. */
const MAX_SPECIES_PHOTOS = 12;

// A deck belongs to a location and a taxa. The coordinates and radius are deliberately
// left out and kept as fields instead, so an edited location overwrites its own deck
// rather than leaving one behind that nothing will read again.
const getCacheKey = ({ locationId, taxa }: DeckCacheKey) =>
  `${locationId}-${taxa}`;

const getCurrentLanguage = () => getStoredLanguage() ?? FALLBACK_LANGUAGE;

/**
 * The species this location has sightings for, or none when the deck was built for a
 * request this one is not: a location that has since been moved or resized, or a
 * different language, in which every common name on every card would be the wrong one.
 */
export const readDeckEntries = async (
  cacheKey: DeckCacheKey
): Promise<DeckEntry[]> => {
  try {
    const deck = await decksStore.get(getCacheKey(cacheKey));

    if (
      !deck ||
      deck.lat !== cacheKey.lat ||
      deck.lng !== cacheKey.lng ||
      deck.radius !== cacheKey.radius ||
      deck.language !== getCurrentLanguage()
    ) {
      return [];
    }

    return deck.entries;
  } catch (error) {
    // Without a deck a round simply fetches every species it drew, as it always did
    console.warn("Failed to read the deck:", error);
    return [];
  }
};

/**
 * Stores the deck a round left behind, trimmed to the species fetched most recently.
 *
 * The entries a round just fetched carry the newest timestamps, so they are never the
 * ones dropped here: what goes is whatever has sat longest without being drawn again.
 */
export const writeDeck = async (
  cacheKey: DeckCacheKey,
  entries: DeckEntry[]
): Promise<void> => {
  if (entries.length === 0) {
    return;
  }

  try {
    const keptEntries = [...entries]
      // A species with no sightings to show is not worth a slot. Kept, it would be
      // reused for a fortnight as a species that contributes no cards at all, quietly
      // shortening every round that drew it — species that are on a location's list
      // without having been photographed in range do turn up.
      .filter((entry) => entry.observations.length > 0)
      .sort((a, b) => b.fetchedAt - a.fetchedAt)
      .slice(0, DECK_MAX_SPECIES);

    await decksStore.set({
      id: getCacheKey(cacheKey),
      ...cacheKey,
      language: getCurrentLanguage(),
      entries: keptEntries,
      lastUsedAt: Date.now(),
    });
  } catch (error) {
    // The round the user is in is unaffected; only the next one pays for it
    console.warn("Failed to store the deck:", error);
  }
};

/** Drops the entries too old to stand in for a fetch, see DECK_ENTRY_TTL_MS. */
export const withoutStaleEntries = (entries: DeckEntry[]): DeckEntry[] => {
  const now = Date.now();

  return entries.filter((entry) => now - entry.fetchedAt < DECK_ENTRY_TTL_MS);
};

/**
 * The cards one species contributes to a round, drawn fresh from the sightings held
 * for it — so a species the deck has shown before comes back with a different set of
 * cards rather than the same five again.
 *
 * Every sighting contributes its photos to the reveal, the cards among them included:
 * a card's own photos are filtered out of its deck where it is rendered, and leaving
 * them in here means the other cards of this species can still show them.
 */
export const buildCards = (entry: DeckEntry): ObservationType[] => {
  const speciesPhotos: SpeciesPhoto[] = entry.observations
    .flatMap((observation) =>
      (observation.photos ?? []).map((photo) => ({
        ...photo,
        observationId: observation.id,
      }))
    )
    .slice(0, MAX_SPECIES_PHOTOS);

  return pickRandom(entry.observations, CARDS_PER_SPECIES).map(
    (observation) => ({
      ...observation,
      family: entry.family,
      speciesPhotos,
    })
  );
};
