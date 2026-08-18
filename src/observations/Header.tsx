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
  Link as MuiLink,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import { useLocationsContext } from "@/LocationsContext";
import TaxaSelector from "@/components/TaxaSelector";
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
            aria-label={t("config")}
            aria-expanded={showConfig}
            onClick={() => setShowConfig(!showConfig)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ flexGrow: 1 }}
          >
            <MuiLink
              component={Link}
              to="/species"
              color="inherit"
              underline="always"
              sx={{ "&:hover": { opacity: 0.8 } }}
            >
              {t("species")}
            </MuiLink>
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
          <TaxaSelector currentTaxa={currentTaxa} updateTaxa={updateTaxa} />
          <SpeciesPoolSelector
            currentSpeciesPool={currentSpeciesPool}
            updateSpeciesPool={updateSpeciesPool}
          />
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
