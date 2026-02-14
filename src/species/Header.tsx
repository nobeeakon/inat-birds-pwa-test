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

const Header = ({
  currentLocationId,
  updateLocation,
  onEditCategories,
}: {
  currentLocationId: string;
  updateLocation: (locationId: string) => void;
  onEditCategories: () => void;
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
            <Button
              variant="outlined"
              color="inherit"
              component={Link}
              to="/observations"
            >
              {t("observations")}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
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
          <Button onClick={onEditCategories}>{t("editCategories")}</Button>
        </Box>
      )}
    </Box>
  );
};

export default Header;
