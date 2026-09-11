import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Toolbar,
  Link as MuiLink,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MenuIcon from "@mui/icons-material/Menu";
import TranslateIcon from "@mui/icons-material/Translate";

import { useLanguageContext } from "@/LanguageContext";
import LocationSelector from "@/components/LocationSelector";
import TaxaSelector from "@/components/TaxaSelector";
import type { Taxa } from "@/taxa";

/**
 * A dense bar that is always on screen: the menu button opens the selectors below it, so
 * the bar itself is the one fixed landmark on every page.
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
  const [showConfig, setShowConfig] = useState(false);
  const hasExtraRow = !!extraControls || !!extraActions;
  const { openLanguageSelector } = useLanguageContext();

  return (
    <Box component="header">
      <AppBar position="static">
        <Toolbar variant="dense" sx={{ gap: 1, px: 1 }}>
          <IconButton
            size="small"
            color="inherit"
            aria-label={t("config")}
            aria-expanded={showConfig}
            onClick={() => setShowConfig(!showConfig)}
          >
            <MenuIcon />
          </IconButton>
          {/* The only navigation in the bar, so it gets a target of its own rather
              than sitting in the toolbar as bare underlined text. Sized to its
              label: stretching it across the bar made the whole gap clickable
              without anything showing that it was. */}
          <MuiLink
            component={Link}
            to={navigateToPath}
            color="inherit"
            underline="none"
            sx={{
              flexShrink: 0,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 600,
              fontSize: "0.9375rem",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.16)" },
            }}
          >
            {navigateToLabel}
          </MuiLink>
          {/* Spacers on both sides rather than one: the two selectors are what the
              pages read from, so they sit together in the middle of the bar */}
          <Box sx={{ flexGrow: 1 }} />
          <LocationSelector
            currentLocationId={currentLocationId}
            updateLocation={updateLocation}
          />
          <Box sx={{ flexGrow: 1 }} />
          <TaxaSelector currentTaxa={currentTaxa} updateTaxa={updateTaxa} />
        </Toolbar>
      </AppBar>
      {/* A band across the page rather than a floating panel: the links and the
          selectors are the same menu, opened by the same button, and a framed box
          inside a phone-width column is a frame around the whole page */}
      <Collapse in={showConfig} unmountOnExit>
        <Box
          sx={{
            px: 1,
            py: 1,
            backgroundColor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            useFlexGap
            sx={{ flexWrap: "wrap", mb: hasExtraRow ? 1 : 0 }}
          >
            <Button
              component={Link}
              to="/locations"
              size="small"
              startIcon={<EditIcon />}
            >
              {t("editLocations")}
            </Button>
            <Button
              onClick={openLanguageSelector}
              size="small"
              startIcon={<TranslateIcon />}
            >
              {t("changeLanguage")}
            </Button>
            <Button
              component={Link}
              to="/about"
              size="small"
              startIcon={<HelpOutlineIcon />}
            >
              {t("about")}
            </Button>
          </Stack>

          {/* Only the observations page has anything to put here; on the species
              page the band is the three links and nothing else */}
          {hasExtraRow && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {extraControls}

              {extraActions}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default AppHeader;
