import type { ObservationStatus } from "@/observations/types";
import type { ObservationType } from "@/observations/useFetchObservations";

export type ReviewInfo = {
  status: ObservationStatus;
  reviewCount: number;
};

// Calculate weight for spaced repetition based on status
const getRepetitionWeight = (reviewInfo: ReviewInfo | undefined): number => {
  if (!reviewInfo) return 0; // Not yet reviewed

  const statusWeights = {
    unidentified: 4, // Highest priority for repetition
    sortOfIdentified: 2, // Medium priority
    identified: 1, // Lowest priority
  };

  return statusWeights[reviewInfo.status] * reviewInfo.reviewCount;
};

// Select next observation with spaced repetition logic
export const selectNextIndex = (
  currentIndex: number,
  filteredData: ObservationType[],
  reviewMap: Map<string, ReviewInfo>
): number => {
  const dataLength = filteredData.length;
  if (dataLength === 0) return 0;

  const totalReviews = reviewMap.size;

  // If less than 10 reviews or 70% chance, just go to next unreviewed item
  if (totalReviews < 10 || Math.random() < 0.7) {
    // Find next unreviewed item
    const startNextIndex = currentIndex + 1;

    // Search for unreviewed items forward
    for (let i = startNextIndex; i < dataLength; i++) {
      const uuid = filteredData[i]?.uuid.toString();
      if (uuid && !reviewMap.has(uuid)) {
        return i;
      }
    }

    // If none found forward, wrap around and search from beginning
    for (let i = 0; i < currentIndex; i++) {
      const uuid = filteredData[i]?.uuid.toString();
      if (uuid && !reviewMap.has(uuid)) {
        return i;
      }
    }

    // All items reviewed, go to next sequential
    return startNextIndex >= dataLength ? 0 : startNextIndex;
  }

  // 30% chance after 10 reviews: select a reviewed item based on weights
  const reviewedItems = Array.from(reviewMap.entries())
    .map(([uuid, info]) => {
      const index = filteredData.findIndex(
        (item) => item.uuid.toString() === uuid
      );
      return { uuid, info, index, weight: getRepetitionWeight(info) };
    })
    .filter((item) => item.index !== -1 && item.index !== currentIndex); // Exclude current and removed items

  if (reviewedItems.length === 0) {
    // Fallback to sequential
    const nextIndex = currentIndex + 1;
    return nextIndex >= dataLength ? 0 : nextIndex;
  }

  // Weighted random selection
  const totalWeight = reviewedItems.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of reviewedItems) {
    random -= item.weight;
    if (random <= 0) {
      return item.index;
    }
  }

  // Fallback (shouldn't reach here)
  return reviewedItems[0].index;
};
