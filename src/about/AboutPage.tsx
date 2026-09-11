import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import Tutorial from "@/components/Tutorial";

/**
 * The tutorial on a page of its own rather than in a dialog, so the screenshots have
 * room and the page can be linked to and scrolled.
 */
const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <AppBar position="static">
        <Toolbar variant="dense" sx={{ gap: 1, px: 1 }}>
          <IconButton
            component={Link}
            to="/"
            size="small"
            color="inherit"
            aria-label={t("back")}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="h1"
            sx={{ fontSize: "1.0625rem" }}
          >
            {t("about")}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Centred on wide screens: the tutorial is a column of prose and two phone-sized
          screenshots, and neither gains anything from the extra width */}
      <Box
        component="main"
        sx={{ px: 2, py: 2, pb: 4, maxWidth: 640, mx: "auto" }}
      >
        <Tutorial />
      </Box>
    </Box>
  );
};

export default AboutPage;
