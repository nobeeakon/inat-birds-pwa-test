import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * iNaturalist returns establishment means in English whatever locale is asked for
 * ("native", "introduced", "endemic"), so the cards translate them here.
 *
 * The t() calls are written out literally because i18next-parser only extracts static
 * keys and runs with keepRemoved: false, so dynamically built keys would be stripped
 * from the locale files. A value with no label falls through unchanged rather than
 * disappearing: the list of means is the API's to extend, not ours.
 *
 * The returned function is memoized on the translator: the species page's filter walks
 * every species and depends on its identity.
 */
export const useEstablishmentMeansLabel = () => {
  const { t } = useTranslation();

  return useMemo(() => {
    const labelsByValue: Record<string, string> = {
      native: t("establishmentNative"),
      endemic: t("establishmentEndemic"),
      introduced: t("establishmentIntroduced"),
    };

    return (establishmentMeans: string | null | undefined) => {
      if (!establishmentMeans) {
        return undefined;
      }

      const normalizedValue = establishmentMeans.trim().toLowerCase();
      return labelsByValue[normalizedValue] ?? establishmentMeans;
    };
  }, [t]);
};
