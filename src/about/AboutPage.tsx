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
        <Toolbar>
          <IconButton
            component={Link}
            to="/"
            size="large"
            edge="start"
            color="inherit"
            aria-label={t("back")}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="h1">
            {t("about")}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ mt: 2, px: 4, pb: 4 }}>
        <Tutorial />
      </Box>
    </Box>
  );
};

export default AboutPage;
