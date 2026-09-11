import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import Tutorial from "@/components/Tutorial";

// The name in the manifest and the page title, so the landing screen says the same thing
// as the icon the user tapped
const APP_NAME = "iNat memorama";

const CONTENT_MAX_WIDTH = 560;

/**
 * The landing screen for a user with no saved location, which is the only thing the app
 * cannot work without: what the app is, one link to the locations page, and the tutorial
 * below it for a first-time user who wants more than the one line.
 *
 * Left aligned and unframed: the screen is a page of text and one button, and centring it
 * inside a panel only puts furniture between the two things worth reading.
 */
const HomePage = () => {
  const { t } = useTranslation();

  return (
    <Box
      component="main"
      sx={{ px: 2, py: 3, maxWidth: CONTENT_MAX_WIDTH, mx: "auto" }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        {APP_NAME}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {t("aboutDescription")}
      </Typography>

      <Stack spacing={0.75} sx={{ mt: 3 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          style={{ textAlign: "center" }}
        >
          {t("homeAddLocationHint")}
        </Typography>
        <Button
          component={Link}
          to="/locations"
          variant="contained"
          size="large"
          fullWidth
          startIcon={<AddIcon />}
        >
          {t("addLocation")}
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Tutorial showDescription={false} />
    </Box>
  );
};

export default HomePage;
