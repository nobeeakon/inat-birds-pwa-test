import { useTranslation } from "react-i18next";

/**
 * How wide a net to cast when picking which species to show observations for.
 *
 * The iNaturalist species_counts endpoint returns species ordered by observation
 * count descending, so capping how deep we page into that list is what restricts
 * the draw to the most commonly observed species.
 *
 * To add a preset: append it here, then add its limit and label below. TypeScript
 * will flag the missing entries until you do.
 */
export const SPECIES_POOLS = ["all", "top20", "top50", "top100"] as const;

export type SpeciesPool = (typeof SPECIES_POOLS)[number];

export const DEFAULT_SPECIES_POOL: SpeciesPool = "all";

/**
 * Number of species each pool draws from; null means the whole species list.
 * Keep these multiples of the observation fetch page size so a pool maps onto a
 * whole number of pages and the label matches what is actually fetched.
 */
export const SPECIES_POOL_LIMITS: Record<SpeciesPool, number | null> = {
  all: null,
  top20: 20,
  top50: 50,
  top100: 100,
};

export const isSpeciesPool = (value: unknown): value is SpeciesPool =>
  typeof value === "string" &&
  (SPECIES_POOLS as readonly string[]).includes(value);

/**
 * Display labels for each pool. The t() calls are written out literally because
 * i18next-parser only extracts static keys and runs with keepRemoved: false, so
 * dynamically built keys would be stripped from the locale files.
 */
export const useSpeciesPoolLabels = (): Record<SpeciesPool, string> => {
  const { t } = useTranslation();

  return {
    all: t("speciesPoolAll"),
    top20: t("speciesPoolTop20"),
    top50: t("speciesPoolTop50"),
    top100: t("speciesPoolTop100"),
  };
};
