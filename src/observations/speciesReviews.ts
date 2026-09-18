import { speciesReviewsStore, type SpeciesReview } from "@/storage/db";
import type { ObservationStatus } from "@/observations/types";

/**
 * How each species has gone for the user, kept across sessions.
 *
 * The browsing state already counts reviews, but per observation and only for as long
 * as the page is open (see the reviewMap in @/INaturalistDataContext). That is the
 * right shape for choosing which card to show next within a round and the wrong one for
 * choosing which species a round should be made of: the user is learning species, not
 * photographs, and what they found hard last month is what a round should bring back.
 *
 * Small enough to keep forever — one row of four numbers per species ever seen — and
 * never pruned, being the user's own record rather than fetched data.
 */

export type SpeciesReviewsByTaxonId = Map<number, SpeciesReview>;

export const readSpeciesReviews =
  async (): Promise<SpeciesReviewsByTaxonId> => {
    try {
      const reviews = await speciesReviewsStore.getAll();
      return new Map(reviews.map((review) => [review.taxonId, review]));
    } catch (error) {
      // A round without this simply has nothing to reinforce and draws at random
      console.warn("Failed to read the species reviews:", error);
      return new Map();
    }
  };

/** Counts one answer against the species it was given for. */
export const recordSpeciesReview = async (
  taxonId: number,
  status: ObservationStatus
): Promise<void> => {
  try {
    const existingReview = await speciesReviewsStore.get(taxonId);

    await speciesReviewsStore.set({
      taxonId,
      seen: (existingReview?.seen ?? 0) + 1,
      unidentified:
        (existingReview?.unidentified ?? 0) +
        (status === "unidentified" ? 1 : 0),
      sortOfIdentified:
        (existingReview?.sortOfIdentified ?? 0) +
        (status === "sortOfIdentified" ? 1 : 0),
      lastSeenAt: Date.now(),
    });
  } catch (error) {
    // The answer still counts towards the round the user is in; only the long term
    // record misses it, which costs them one slightly worse reinforcement pick
    console.warn(`Failed to record the review of species ${taxonId}:`, error);
  }
};

/**
 * A half credit rather than none: a species named down to the right family is not
 * learned, but it is not the blank that a miss is either.
 */
const SORT_OF_IDENTIFIED_WEIGHT = 0.5;

/**
 * Laplace smoothing, which is what keeps a single unlucky answer from outranking real
 * evidence. Without it every species missed on its first showing scores a perfect 1 and
 * fills the reinforcement slots ahead of ones genuinely missed six times out of ten.
 * With it that first miss scores 0.67 against the repeat offender's 0.63 — close, and
 * only the well sampled one keeps climbing as the answers accumulate.
 */
const SMOOTHING_MISSES = 1;
const SMOOTHING_SHOWINGS = 2;

/** How badly the species goes for the user, from 0 (always named) to 1 (never named). */
export const getSpeciesDifficulty = (review: SpeciesReview): number =>
  (review.unidentified +
    SORT_OF_IDENTIFIED_WEIGHT * review.sortOfIdentified +
    SMOOTHING_MISSES) /
  (review.seen + SMOOTHING_SHOWINGS);
