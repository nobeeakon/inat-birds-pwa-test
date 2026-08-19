import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";

import AppHeader from "@/components/AppHeader";
import type { Taxa } from "@/taxa";

const Header = ({
  currentLocationId,
  updateLocation,
  currentTaxa,
  updateTaxa,
  onEditCategories,
}: {
  currentLocationId: string;
  updateLocation: (locationId: string) => void;
  currentTaxa: Taxa;
  updateTaxa: (newTaxa: Taxa) => void;
  onEditCategories: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <AppHeader
      navigateToLabel={t("observations")}
      navigateToPath="/observations"
      currentLocationId={currentLocationId}
      updateLocation={updateLocation}
      currentTaxa={currentTaxa}
      updateTaxa={updateTaxa}
      extraActions={
        <Button onClick={onEditCategories}>{t("editCategories")}</Button>
      }
    />
  );
};

export default Header;
