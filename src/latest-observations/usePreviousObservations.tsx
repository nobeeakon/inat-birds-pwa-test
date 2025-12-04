import { useStorageState } from "@/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";
import type { ObservationStatus } from "@/latest-observations/types";
import { getRandomIndex } from "@/utils";

const PREVIOUS_OBSERVATIONS_MAX_LENGTH = 700;

const usePreviousObservations = () => {
  const [previousObservations, setPreviousObservations] = useStorageState<
    Record<string, string[]>
  >(LOCAL_STORAGE_KEY.observations.PREVIOUS_OBSERVATIONS_KEY, {});

  const addPreviousObservation = (
    observationUuid: string,
    category: ObservationStatus
  ) => {
    const newObservations = { ...previousObservations };
    if (!newObservations[category]) {
      newObservations[category] = [];
    }

    for (const category of Object.keys(newObservations)) {
      newObservations[category] = newObservations[category].filter(
        (uuid) => uuid !== observationUuid
      );

      newObservations[category] = newObservations[category].slice(
        -PREVIOUS_OBSERVATIONS_MAX_LENGTH
      ); // keep only last observations
    }

    newObservations[category].push(observationUuid);

    setPreviousObservations(newObservations);
  };

  const getRandomPreviousUuid = (
    currentObservationsUuids: string[]
  ): { uuid: string | undefined; totalObservationsCount: number } => {
    const currentPreviousObservations: Record<string, string[]> = {}; // previous may contain observations not present in current

    const currentObservationsUuidsSet = new Set(currentObservationsUuids);

    Object.entries(previousObservations).forEach(
      ([categoryItem, uuidsItem]) => {
        currentPreviousObservations[categoryItem] = uuidsItem.filter((uuid) =>
          currentObservationsUuidsSet.has(uuid)
        );
      }
    );

    const randomNumber = Math.random();

    const randomIndexes: Record<string, number> = {};
    Object.entries(currentPreviousObservations).forEach(([status, uuids]) => {
      if (uuids.length > 0) {
        randomIndexes[status] = getRandomIndex(uuids.length);
      }
    });

    const randomIdentifiedUuid =
      currentPreviousObservations?.["identified"]?.[
        randomIndexes?.["identified"]
      ];
    const randomUnidentifiedUuid =
      currentPreviousObservations?.["unidentified"]?.[
        randomIndexes?.["unidentified"]
      ];
    const randomSortOfIdentifiedUuid =
      currentPreviousObservations?.["sortOfIdentified"]?.[
        randomIndexes?.["sortOfIdentified"]
      ];

    const totalObservationsCount = Object.values(
      currentPreviousObservations
    ).reduce((acc, uuids) => acc + uuids.length, 0);

    const randomIndex = {
      uuid:
        randomSortOfIdentifiedUuid ??
        randomUnidentifiedUuid ??
        randomIdentifiedUuid,
      totalObservationsCount,
    };
    if (randomNumber < 0.1 && randomIdentifiedUuid) {
      randomIndex["uuid"] = randomIdentifiedUuid;
    } else if (randomNumber < 0.45 && randomUnidentifiedUuid) {
      randomIndex["uuid"] = randomUnidentifiedUuid;
    } else if (randomUnidentifiedUuid) {
      randomIndex["uuid"] = randomSortOfIdentifiedUuid;
    }

    return randomIndex;
  };

  return {
    previousObservations,
    addPreviousObservation,
    getRandomPreviousUuid,
  };
};

export default usePreviousObservations;
