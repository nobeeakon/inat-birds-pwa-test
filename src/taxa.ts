import { useTranslation } from "react-i18next";

/**
 * Taxa the app can browse, sent as the iNaturalist `iconic_taxa[]` query param.
 *
 * To add one: append its iNaturalist iconic taxon name here, then add the matching
 * label in useTaxaLabels below. TypeScript will flag the missing label until you do.
 */
export const TAXA = ["Aves", "Plantae"] as const;

export type Taxa = (typeof TAXA)[number];

export const DEFAULT_TAXA: Taxa = "Aves";

export const isTaxa = (value: unknown): value is Taxa =>
  typeof value === "string" && (TAXA as readonly string[]).includes(value);

/**
 * Display labels for each taxa. The t() calls are written out literally because
 * i18next-parser only extracts static keys and runs with keepRemoved: false, so
 * dynamically built keys would be stripped from the locale files.
 */
export const useTaxaLabels = (): Record<Taxa, string> => {
  const { t } = useTranslation();

  return {
    Aves: t("taxaAves"),
    Plantae: t("taxaPlantae"),
  };
};
