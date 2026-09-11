import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import Tutorial from "@/components/Tutorial";

// The name in the manifest and the page title, so the landing screen says the same thing
// as the icon the user tapped
const APP_NAME = "iNat memorama";

/**
 * The landing screen for a user with no saved location, which is the only thing the app
 * cannot work without: what the app is, one link to the locations page, and the tutorial
 * below it for a first-time user who wants more than the one line.
 */
const HomePage = () => {
  const { t } = useTranslation();

  return (
    <Box
      component="main"
      sx={{ display: "flex", justifyContent: "center", px: 3, py: 6 }}
    >
      <Stack spacing={4} sx={{ alignItems: "center", maxWidth: 560 }}>
        <Stack spacing={1.5} sx={{ alignItems: "center" }}>
          <Typography variant="h5" component="h1">
            {APP_NAME}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            {t("aboutDescription")}
          </Typography>
        </Stack>

        <Stack spacing={1} sx={{ alignItems: "center" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            {t("homeAddLocationHint")}
          </Typography>
          <Button
            component={Link}
            to="/locations"
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
          >
            {t("addLocation")}
          </Button>
        </Stack>

        <Tutorial showDescription={false} />
      </Stack>
    </Box>
  );
};

export default HomePage;
