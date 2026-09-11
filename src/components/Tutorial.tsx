import { Trans, useTranslation } from "react-i18next";
import { Box, Link, Stack, Typography } from "@mui/material";

import { INATURALIST_SITE_URL } from "@/constants";
import { FALLBACK_LANGUAGE, isLanguage, type Language } from "@/language";

import screenshotEnHidden from "@/assets/screenshot_en.webp";
import screenshotEnRevealed from "@/assets/screenshot_en_show.webp";
import screenshotEsHidden from "@/assets/screenshot_es.webp";
import screenshotEsRevealed from "@/assets/screenshot_es_show.webp";

// Screenshots of the app itself, so they only teach anything in the language the user
// is reading the steps in
const SCREENSHOTS: Record<Language, { hidden: string; revealed: string }> = {
  en: { hidden: screenshotEnHidden, revealed: screenshotEnRevealed },
  es: { hidden: screenshotEsHidden, revealed: screenshotEsRevealed },
};

const SCREENSHOT_MAX_WIDTH = 260;

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
      // No cropping: every step of the round is somewhere in the card, and the pair keeps
      // lining up side by side because both screenshots share their capture size
      sx={{
        width: "100%",
        height: "auto",
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
      {/* The sentence names iNaturalist mid-phrase, and word order differs by language,
          so the link is a placeholder inside the translated string rather than appended */}
      <Typography variant="body1" color="text.secondary">
        <Trans
          i18nKey="aboutDataSource"
          components={{
            inaturalistLink: (
              <Link
                href={INATURALIST_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
          }}
        />
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
