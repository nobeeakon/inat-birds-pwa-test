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
export const PRESET_SPECIES_POOLS = [
  "top20",
  "top50",
  "top100",
  "all",
] as const;

export type PresetSpeciesPool = (typeof PRESET_SPECIES_POOLS)[number];

/**
 * A category is a pool too: instead of drawing from the species list of the
 * location, the draw is limited to the species tagged with that category.
 */
export type CategorySpeciesPool = `${typeof CATEGORY_POOL_PREFIX}${string}`;

export type SpeciesPool = PresetSpeciesPool | CategorySpeciesPool;

export const CATEGORY_POOL_PREFIX = "category:";

export const DEFAULT_SPECIES_POOL: SpeciesPool = "top50";

/** Used when the selected category pool no longer has species to draw from. */
export const FALLBACK_SPECIES_POOL: SpeciesPool = "top50";

/**
 * Number of species each pool draws from; null means the whole species list.
 * Keep these multiples of the observation fetch page size so a pool maps onto a
 * whole number of pages and the label matches what is actually fetched.
 */
export const SPECIES_POOL_LIMITS: Record<PresetSpeciesPool, number | null> = {
  top20: 20,
  top50: 50,
  top100: 100,
  all: null,
};

/** How many species the pool draws from; null for the whole list of the location. */
export const getSpeciesPoolLimit = (speciesPool: SpeciesPool): number | null =>
  speciesPool in SPECIES_POOL_LIMITS
    ? SPECIES_POOL_LIMITS[speciesPool as PresetSpeciesPool]
    : null;

export const getCategorySpeciesPool = (categoryId: string): SpeciesPool =>
  `${CATEGORY_POOL_PREFIX}${categoryId}`;

/** The category a pool draws from, or null for the presets. */
export const getSpeciesPoolCategoryId = (
  speciesPool: SpeciesPool
): string | null =>
  speciesPool.startsWith(CATEGORY_POOL_PREFIX)
    ? speciesPool.slice(CATEGORY_POOL_PREFIX.length)
    : null;

export const isSpeciesPool = (value: unknown): value is SpeciesPool => {
  if (typeof value !== "string") return false;

  // The category may since have been deleted; that is handled where it is used,
  // as the categories are not loaded yet when the stored value is read
  if (value.startsWith(CATEGORY_POOL_PREFIX)) {
    return value.length > CATEGORY_POOL_PREFIX.length;
  }

  return (PRESET_SPECIES_POOLS as readonly string[]).includes(value);
};

/**
 * Display labels for each preset. The t() calls are written out literally because
 * i18next-parser only extracts static keys and runs with keepRemoved: false, so
 * dynamically built keys would be stripped from the locale files.
 */
export const usePresetSpeciesPoolLabels = (): Record<
  PresetSpeciesPool,
  string
> => {
  const { t } = useTranslation();

  return {
    all: t("speciesPoolAll"),
    top20: t("speciesPoolTop20"),
    top50: t("speciesPoolTop50"),
    top100: t("speciesPoolTop100"),
  };
};
