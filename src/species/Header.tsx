import { useTranslation } from "react-i18next";

import AppHeader from "@/components/AppHeader";
import type { Taxa } from "@/taxa";

const Header = ({
  currentLocationId,
  updateLocation,
  currentTaxa,
  updateTaxa,
}: {
  currentLocationId: string;
  updateLocation: (locationId: string) => void;
  currentTaxa: Taxa;
  updateTaxa: (newTaxa: Taxa) => void;
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
    />
  );
};

export default Header;
