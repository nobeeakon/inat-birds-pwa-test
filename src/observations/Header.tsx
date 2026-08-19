import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";

import AppHeader from "@/components/AppHeader";
import SpeciesPoolSelector from "@/components/SpeciesPoolSelector";
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
  toggleEditExcludedTaxa,
}: {
  currentLocationId: string;
  updateLocation: (newLocationId: string) => void;
  currentTaxa: Taxa;
  updateTaxa: (newTaxa: Taxa) => void;
  currentSpeciesPool: SpeciesPool;
  updateSpeciesPool: (newSpeciesPool: SpeciesPool) => void;
  toggleEditExcludedTaxa: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <AppHeader
      navigateToLabel={t("species")}
      navigateToPath="/species"
      currentLocationId={currentLocationId}
      updateLocation={updateLocation}
      currentTaxa={currentTaxa}
      updateTaxa={updateTaxa}
      extraControls={
        <SpeciesPoolSelector
          currentSpeciesPool={currentSpeciesPool}
          updateSpeciesPool={updateSpeciesPool}
        />
      }
      extraActions={
        <Button onClick={toggleEditExcludedTaxa}>{t("excludeSpecies")}</Button>
      }
    />
  );
};

export default Header;
