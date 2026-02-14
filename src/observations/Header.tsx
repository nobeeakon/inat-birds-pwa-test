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
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import { useLocationsContext } from "@/LocationsContext";

export type StoredUrlType = {
  name: string;
  url: string;
};

const Header = ({
  currentLocationId,
  updateLocation,
  onExcludeTaxa,
  toggleEditExcludedTaxa,
}: {
  currentLocationId: string;
  updateLocation: (newLocationId: string) => void;
  onExcludeTaxa: () => void;
  toggleEditExcludedTaxa: () => void;
}) => {
  const { t } = useTranslation();
  const [showConfig, setShowConfig] = useState(false);
  const locations = useLocationsContext().locationsInfo;

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            <Button variant="contained" component={Link} to="/species">
              {t("species")}
            </Button>
            <Button variant="outlined" onClick={onExcludeTaxa}>
              {t("exclude")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowConfig(!showConfig)}
            >
              {t("config")}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
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
          <Button onClick={toggleEditExcludedTaxa}>
            {t("excludeSpecies")}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Header;
