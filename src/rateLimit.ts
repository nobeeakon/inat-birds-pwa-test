/**
 * A cooldown shared by every iNaturalist request stream.
 *
 * Several of them run at once — the observations fetch, the species pager, the photos
 * of whichever card is open — and they all draw on one rate limit. Once the API has
 * refused one of them the others are about to be refused too, so the first 429 stops
 * all of them rather than letting each spend its own requests discovering the same
 * thing.
 *
 * Module state rather than React state: the streams that have to honour it are plain
 * async functions, and nothing on screen changes when it starts or ends.
 */

// Long enough for the limit to clear, short enough that someone waiting on the retry
// button is not watching a whole minute count down
const COOLDOWN_MS = 30_000;

let cooldownEndsAt = 0;

export const startRateLimitCooldown = (): void => {
  cooldownEndsAt = Date.now() + COOLDOWN_MS;
};

export const isRateLimitCooldownActive = (): boolean =>
  Date.now() < cooldownEndsAt;

/** Rounded up, so waiting this many seconds is always enough to outlast the cooldown. */
export const getRateLimitCooldownSeconds = (): number =>
  Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
