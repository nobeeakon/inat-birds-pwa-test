import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Collapse,
  Fab,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Link as MuiLink,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MenuIcon from "@mui/icons-material/Menu";

import { useLocationsContext } from "@/LocationsContext";
import TaxaSelector from "@/components/TaxaSelector";
import { useStorageState } from "@/storage/storage";
import type { Taxa } from "@/taxa";

// Persisted rather than page state so the bar does not spring back open, or shut, every
// time the user moves between the observations and species pages
const NAV_BAR_VISIBLE_STORAGE_KEY = "navBarVisible";

const NAV_BAR_REGION_ID = "app-header-nav-bar";

/**
 * The bar is hidden by default and toggled by a floating button, which keeps the top of a
 * phone screen for the page itself. Showing it restores the full nav bar: hamburger for
 * the config controls plus the link to the other page.
 */
const AppHeader = ({
  navigateToLabel,
  navigateToPath,
  currentLocationId,
  updateLocation,
  currentTaxa,
  updateTaxa,
  extraControls,
  extraActions,
}: {
  navigateToLabel: string;
  navigateToPath: string;
  currentLocationId: string;
  updateLocation: (newLocationId: string) => void;
  currentTaxa: Taxa;
  updateTaxa: (newTaxa: Taxa) => void;
  extraControls?: ReactNode;
  extraActions?: ReactNode;
}) => {
  const { t } = useTranslation();
  const [isNavBarVisible, setIsNavBarVisible] = useStorageState<boolean>(
    NAV_BAR_VISIBLE_STORAGE_KEY,
    false
  );
  const [showConfig, setShowConfig] = useState(false);
  const locations = useLocationsContext().locationsInfo;

  return (
    <Box component="header">
      <Collapse in={isNavBarVisible} unmountOnExit>
        <Box id={NAV_BAR_REGION_ID}>
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
                  to={navigateToPath}
                  color="inherit"
                  underline="always"
                  sx={{ "&:hover": { opacity: 0.8 } }}
                >
                  {navigateToLabel}
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
                <InputLabel id="location-selector-label">
                  {t("data")}
                </InputLabel>
                <Select
                  labelId="location-selector-label"
                  id="location-selector"
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
              {extraControls}
              <Button component={Link} to="/locations">
                {t("editLocations")}
              </Button>
              {extraActions}
            </Box>
          )}
        </Box>
      </Collapse>

      <Fab
        size="small"
        color="primary"
        aria-label={isNavBarVisible ? t("hideMenu") : t("showMenu")}
        aria-expanded={isNavBarVisible}
        aria-controls={NAV_BAR_REGION_ID}
        onClick={() => setIsNavBarVisible(!isNavBarVisible)}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          // Above the app bar so the button stays reachable while the bar is open
          zIndex: (theme) => theme.zIndex.appBar + 1,
        }}
      >
        {isNavBarVisible ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      </Fab>
    </Box>
  );
};

export default AppHeader;
