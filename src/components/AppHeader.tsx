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
  useMediaQuery,
  Link as MuiLink,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
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
 * On phones the bar is hidden by default and toggled by a floating button, which keeps the
 * scarce vertical space for the page itself; showing it moves the toggle into the bar so
 * nothing floats over the content. Wider screens have room to spare, so there the bar is
 * always shown and there is nothing to toggle.
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
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("sm")
  );
  const [isNavBarVisible, setIsNavBarVisible] = useStorageState<boolean>(
    NAV_BAR_VISIBLE_STORAGE_KEY,
    false
  );
  const [showConfig, setShowConfig] = useState(false);
  const locations = useLocationsContext().locationsInfo;

  const isNavBarShown = !isMobile || isNavBarVisible;

  return (
    <Box component="header">
      <Collapse in={isNavBarShown} unmountOnExit>
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
              {isMobile && (
                <IconButton
                  size="large"
                  edge="end"
                  color="inherit"
                  aria-label={t("hideMenu")}
                  aria-expanded
                  aria-controls={NAV_BAR_REGION_ID}
                  onClick={() => setIsNavBarVisible(false)}
                >
                  <KeyboardArrowUpIcon />
                </IconButton>
              )}
            </Toolbar>
          </AppBar>
          {showConfig && (
            <Box sx={{ mt: 2 }}>
              <Box>
                <Button component={Link} to="/locations">
                  {t("editLocations")}
                </Button>
              </Box>
              <Box
                sx={{
                  mt: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
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
                <TaxaSelector
                  currentTaxa={currentTaxa}
                  updateTaxa={updateTaxa}
                />
                {extraControls}

                {extraActions}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>

      {isMobile && !isNavBarShown && (
        <Fab
          size="small"
          color="primary"
          aria-label={t("showMenu")}
          aria-expanded={false}
          aria-controls={NAV_BAR_REGION_ID}
          onClick={() => setIsNavBarVisible(true)}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: (theme) => theme.zIndex.appBar + 1,
          }}
        >
          <KeyboardArrowDownIcon />
        </Fab>
      )}
    </Box>
  );
};

export default AppHeader;
