import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Stack,
  Button,
  FormControl,
  Select,
  MenuItem,
  Box,
  InputLabel,
} from "@mui/material";

import { useLocationsContext } from "@/LocationsContext";

const Header = ({
  currentLocationId,
  updateLocation,
  onShowObservations,
  onEditCategories,
}: {
  currentLocationId: string;
  updateLocation: (locationId: string) => void;
  onShowObservations: () => void;
  onEditCategories: () => void;
}) => {
  const { t } = useTranslation();
  const [showConfig, setShowConfig] = useState(false);
  const locations = useLocationsContext().locationsInfo;

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={onShowObservations}>
          {t("observations")}
        </Button>
        <Button variant="outlined" onClick={() => setShowConfig(!showConfig)}>
          {t("config")}
        </Button>
      </Stack>
      {showConfig && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            mt: 2,
            border: 1,
            borderColor: "grey.300",
            p: 1,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="url-selector-label">{t("data")}</InputLabel>
            <Select
              labelId="url-selector-label"
              id="url-selector"
              value={currentLocationId}
              label={t("data")}
              onChange={(e) => updateLocation(e.target.value)}
            >
              <MenuItem value="">{t("selectLocation")}</MenuItem>
              {locations.map((locationItem) => (
                <MenuItem key={locationItem.id} value={locationItem.id}>
                  {locationItem.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button component={Link} to="/locations">
            {t("editLocations")}
          </Button>
          <Button onClick={onEditCategories}>{t("editCategories")}</Button>
        </Box>
      )}
    </Box>
  );
};

export default Header;
