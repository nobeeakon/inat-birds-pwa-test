/**
 * The contract between the runtime photo prefetch and the service worker cache the
 * photos land in.
 *
 * Imported by both [vite.config.ts](../vite.config.ts), which configures the Workbox
 * route, and the prefetch that fills it, so the two cannot drift apart: the prefetch
 * has to know which urls the service worker keeps, and how many.
 *
 * Keep this file free of imports and of browser APIs, it is also loaded while the
 * Vite config is evaluated in Node.
 */

export const PHOTO_CACHE_NAME = "inat-photos-cache";

/**
 * Photos kept, past which Workbox evicts the oldest entries. A medium photo is
 * roughly 60 kB, so this is a cache of about 55 MB.
 */
export const PHOTO_CACHE_MAX_ENTRIES = 900;

/**
 * A photo URL names one immutable photo — `/photos/<id>/medium.jpg` is that photo and
 * will never be another — so an entry only expires to make room, never because it
 * might be out of date. Two days meant every offline user downloading the same 55 MB
 * again twice a week for nothing, against the media limits iNaturalist asks callers to
 * respect (https://www.inaturalist.org/pages/api+recommended+practices).
 */
export const PHOTO_CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * The photos the service worker caches: iNaturalist medium photos, marked with the
 * `cache=true` that `getCachedPhotoUrl` adds. The marker is what keeps thumbnails and
 * one-off photos out of a cache meant for the species list.
 *
 * Both photo hosts are matched: iNaturalist serves the older photos from
 * static.inaturalist.org and the rest from its open data bucket, and a species list
 * comes back with a mix of the two.
 */
export const PHOTO_URL_PATTERN =
  /^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/photos\/\d+\/medium\.\w+\?cache=true/i;
