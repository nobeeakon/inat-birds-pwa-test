import { useTranslation } from "react-i18next";
import { Box, Stack, Typography } from "@mui/material";

import { FALLBACK_LANGUAGE, isLanguage, type Language } from "@/language";

import screenshotEnHidden from "@/assets/screenshot_en.jpg";
import screenshotEnRevealed from "@/assets/screenshot_en_show.jpg";
import screenshotEsHidden from "@/assets/screenshot_es.jpg";
import screenshotEsRevealed from "@/assets/screenshot_es_show.jpg";

// Screenshots of the app itself, so they only teach anything in the language the user
// is reading the steps in
const SCREENSHOTS: Record<Language, { hidden: string; revealed: string }> = {
  en: { hidden: screenshotEnHidden, revealed: screenshotEnRevealed },
  es: { hidden: screenshotEsHidden, revealed: screenshotEsRevealed },
};

const SCREENSHOT_MAX_WIDTH = 260;

/**
 * Imposed on every screenshot so the pair lines up side by side: they were captured at
 * whatever height their content happened to need, and the interesting part of each one
 * is at the top, so the odd one out gives up some of its photo at the bottom.
 */
const SCREENSHOT_ASPECT_RATIO = "640 / 910";

const Screenshot = ({
  imageUrl,
  caption,
}: {
  imageUrl: string;
  caption: string;
}) => (
  <Stack
    component="figure"
    spacing={0.5}
    sx={{ m: 0, alignItems: "center", maxWidth: SCREENSHOT_MAX_WIDTH }}
  >
    <Box
      component="img"
      src={imageUrl}
      alt={caption}
      loading="lazy"
      sx={{
        width: "100%",
        aspectRatio: SCREENSHOT_ASPECT_RATIO,
        objectFit: "cover",
        objectPosition: "top",
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
      }}
    />
    <Typography
      component="figcaption"
      variant="caption"
      color="text.secondary"
      sx={{ textAlign: "center" }}
    >
      {caption}
    </Typography>
  </Stack>
);

/**
 * What the app is and how a round goes, in three steps and a before/after pair of the
 * same card. Shown on the about page and on the home screen, which already says what the
 * app is above its call to action and so leaves out the description.
 */
const Tutorial = ({
  showDescription = true,
}: {
  showDescription?: boolean;
}) => {
  const { t, i18n } = useTranslation();

  const language = isLanguage(i18n.language)
    ? i18n.language
    : FALLBACK_LANGUAGE;
  const screenshots = SCREENSHOTS[language];

  return (
    <Stack component="section" spacing={2} sx={{ maxWidth: 560 }}>
      {showDescription && (
        <Typography variant="body2" color="text.secondary">
          {t("aboutDescription")}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {t("aboutDataSource")}
      </Typography>
      <Box>
        <Typography variant="h5" component="h2">
          {t("tutorial.title")}
        </Typography>
        <Stack component="ol" spacing={0.5} sx={{ pl: 3, my: 1 }}>
          <Typography component="li" variant="body2">
            {t("tutorial.stepAddLocation")}
          </Typography>
          <Typography component="li" variant="body2">
            {t("tutorial.stepGuess")}
          </Typography>
          <Typography component="li" variant="body2">
            {t("tutorial.stepRate")}
          </Typography>
        </Stack>
      </Box>

      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{ justifyContent: "center", flexWrap: "wrap" }}
      >
        <Screenshot
          imageUrl={screenshots.hidden}
          caption={t("tutorial.captionHidden")}
        />
        <Screenshot
          imageUrl={screenshots.revealed}
          caption={t("tutorial.captionRevealed")}
        />
      </Stack>
    </Stack>
  );
};

export default Tutorial;
