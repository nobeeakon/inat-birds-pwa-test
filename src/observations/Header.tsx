import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";

import AppHeader from "@/components/AppHeader";
import SpeciesPoolSelector from "@/components/SpeciesPoolSelector";
import { useSpeciesData } from "@/INaturalistDataContext";
import type { Taxa } from "@/taxa";
import type { SpeciesPool } from "@/speciesPool";

export type StoredUrlType = {
  name: string;
  url: string;
};

const Header = ({
  currentLocationId,
  updateLocation,
  currentTaxa,
  updateTaxa,
  currentSpeciesPool,
  updateSpeciesPool,
  hasExcludedSpecies,
  toggleEditExcludedTaxa,
}: {
  currentLocationId: string;
  updateLocation: (newLocationId: string) => void;
  currentTaxa: Taxa;
  updateTaxa: (newTaxa: Taxa) => void;
  currentSpeciesPool: SpeciesPool;
  updateSpeciesPool: (newSpeciesPool: SpeciesPool) => void;
  hasExcludedSpecies: boolean;
  toggleEditExcludedTaxa: () => void;
}) => {
  const { t } = useTranslation();
  const locationSpecies = useSpeciesData().species;

  // How many species the link leads to, which is the list the species page shows. It
  // is null while the fetch is deferred behind the observations one, so until it lands
  // the link is its bare label rather than a count of zero.
  const speciesLinkLabel = locationSpecies
    ? t("speciesWithCount", { count: locationSpecies.length })
    : t("species");

  return (
    <AppHeader
      navigateToLabel={speciesLinkLabel}
      navigateToPath="/species"
      currentLocationId={currentLocationId}
      updateLocation={updateLocation}
      currentTaxa={currentTaxa}
      updateTaxa={updateTaxa}
      extraControls={
        <SpeciesPoolSelector
          currentLocationId={currentLocationId}
          currentTaxa={currentTaxa}
          currentSpeciesPool={currentSpeciesPool}
          updateSpeciesPool={updateSpeciesPool}
        />
      }
      extraActions={
        hasExcludedSpecies ? (
          <Button onClick={toggleEditExcludedTaxa}>
            {t("excludeSpecies")}
          </Button>
        ) : undefined
      }
    />
  );
};

export default Header;
