import { withoutStaleEntries } from "@/observations/deck";
import {
  getSpeciesDifficulty,
  type SpeciesReviewsByTaxonId,
} from "@/observations/speciesReviews";
import type { DeckEntry } from "@/storage/db";
import { notNullish, pickRandom } from "@/utils";

/** Species drawn per round. */
export const ROUND_SIZE = 15;

/**
 * Species of a round brought back because the user has trouble with them, rather than
 * drawn at random. They are chosen from the deck and only from the deck, so they never
 * cost a request: what is left of the round is what decides how much a round is worth.
 */
export const REINFORCEMENT_COUNT = 5;

/** A species a round can show, and what is already known about it. */
export type SpeciesCandidate = {
  taxonId: number;
  family?: string | null;
};

export type RoundPlan = {
  /** Taken from the deck whatever the age of the copy held. */
  reinforced: DeckEntry[];
  /** Drawn at random and found in the deck, still fresh enough to stand in for a fetch. */
  reused: DeckEntry[];
  /** Drawn at random and not held, or held too old. The only part that costs requests. */
  toFetch: SpeciesCandidate[];
  /**
   * What is left of the deck once the stale entries are swept, which the newly fetched
   * ones are added to. Reinforcement picks that were already stale are not in here:
   * they get this one last showing and then go.
   */
  keptEntries: DeckEntry[];
};

/**
 * Works out what a round is made of, and so what it has to ask iNaturalist for.
 *
 * The order matters and is the whole design:
 *
 *  1. The reinforcement picks are taken first, before anything is swept, which is what
 *     lets them ignore the deck's expiry. A species the user keeps failing to name is
 *     worth showing again whatever the age of the sightings in hand.
 *  2. Then the deck is swept of everything past its expiry.
 *  3. Then the rest of the round is drawn at random and answered from what survived,
 *     falling back to a request per species that did not.
 *
 * A first ever round has neither reviews nor a deck, so nothing is reinforced, all
 * fifteen are drawn at random and all fifteen are fetched — exactly what a round used
 * to cost. From the second round on the reinforcement half is free and the random half
 * is answered from the deck more and more often as it fills.
 */
export const planRound = ({
  candidates,
  deckEntries,
  reviews,
}: {
  /** The species the round may draw from: the pool, or the tagged species of a category. */
  candidates: SpeciesCandidate[];
  deckEntries: DeckEntry[];
  reviews: SpeciesReviewsByTaxonId;
}): RoundPlan => {
  const entryByTaxonId = new Map(
    deckEntries.map((entry) => [entry.taxonId, entry])
  );

  // Only species that are both in the deck and in the pool the user is on: a
  // reinforcement pick from outside the pool would show a bird they have just narrowed
  // the round away from
  const reinforcementCandidates = candidates
    .map((candidate) => {
      const entry = entryByTaxonId.get(candidate.taxonId);
      const review = reviews.get(candidate.taxonId);

      return entry && review && review.seen > 0
        ? { entry, difficulty: getSpeciesDifficulty(review) }
        : null;
    })
    .filter(notNullish);

  // The harder half, then a few at random out of that — rather than the worst five,
  // which would be the same five rounds in a row
  const harderHalf = [...reinforcementCandidates]
    .sort((a, b) => b.difficulty - a.difficulty)
    .slice(0, Math.ceil(reinforcementCandidates.length / 2));

  const reinforced = pickRandom(harderHalf, REINFORCEMENT_COUNT).map(
    (item) => item.entry
  );

  // Everything the reinforcement half needed has been read out of the deck by now, so
  // the stale entries can go. One of the picks above may be among them, which is the
  // point: it is shown this round and fetched again the next time it comes up.
  const keptEntries = withoutStaleEntries(deckEntries);
  const freshEntryByTaxonId = new Map(
    keptEntries.map((entry) => [entry.taxonId, entry])
  );

  const reinforcedTaxonIds = new Set(reinforced.map((entry) => entry.taxonId));
  const randomPicks = pickRandom(
    candidates.filter(
      (candidate) => !reinforcedTaxonIds.has(candidate.taxonId)
    ),
    ROUND_SIZE - reinforced.length
  );

  const reused: DeckEntry[] = [];
  const toFetch: SpeciesCandidate[] = [];

  for (const candidate of randomPicks) {
    const freshEntry = freshEntryByTaxonId.get(candidate.taxonId);

    if (freshEntry) {
      reused.push(freshEntry);
    } else {
      toFetch.push(candidate);
    }
  }

  return { reinforced, reused, toFetch, keptEntries };
};
