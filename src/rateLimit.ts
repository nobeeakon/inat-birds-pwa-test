/**
 * The pacing and the cooldown that every iNaturalist request goes through.
 *
 * iNaturalist asks for about one request a second per IP
 * (https://www.inaturalist.org/pages/api+recommended+practices). Several request
 * streams run at once — the species pager, the observations draw, a place lookup — so
 * no stream can keep to that on its own: three of them sleeping a second between their
 * own requests still put three requests in the same second. The gate below is shared
 * by all of them, which is what makes the limit hold.
 *
 * The cooldown is the other half: once the API has refused one stream the others are
 * about to be refused too, so the first 429 stops all of them rather than letting each
 * spend its own requests discovering the same thing.
 *
 * Module state rather than React state: the streams that have to honour it are plain
 * async functions, and nothing on screen changes when a request waits its turn.
 *
 * Keep this file free of imports, it sits at the bottom of the request stack.
 */

/** What iNaturalist asks for: about one request a second. */
const MIN_REQUEST_INTERVAL_MS = 1000;

// Long enough for the limit to clear, short enough that someone waiting on the retry
// button is not watching a whole minute count down. Only used when the API does not
// say how long to wait.
const DEFAULT_COOLDOWN_MS = 30_000;

let cooldownEndsAt = 0;

/** When the next request may be sent. In the past when nothing is queued. */
let nextRequestAllowedAt = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Waits for this request's turn, one request per second across the whole app.
 *
 * The slot is claimed before the wait rather than after it, so requests arriving while
 * others wait queue up behind them instead of all waking into the same second. The
 * claim is one synchronous read and write, which is what keeps two callers from taking
 * the same slot.
 */
export const acquireRequestSlot = async (): Promise<void> => {
  const now = Date.now();
  const slotStartsAt = Math.max(now, nextRequestAllowedAt);

  nextRequestAllowedAt = slotStartsAt + MIN_REQUEST_INTERVAL_MS;

  const waitMs = slotStartsAt - now;
  if (waitMs > 0) {
    await sleep(waitMs);
  }
};

/**
 * Stops every stream until the limit has had time to clear.
 *
 * `retryAfterMs` is what the API itself asked for when it sent one: iNaturalist knows
 * how long its own limit needs better than a guess here does.
 */
export const startRateLimitCooldown = (retryAfterMs?: number): void => {
  cooldownEndsAt = Date.now() + (retryAfterMs ?? DEFAULT_COOLDOWN_MS);

  // Whatever is already queued must not slip out during the cooldown either
  nextRequestAllowedAt = Math.max(nextRequestAllowedAt, cooldownEndsAt);
};

export const isRateLimitCooldownActive = (): boolean =>
  Date.now() < cooldownEndsAt;

/** Rounded up, so waiting this many seconds is always enough to outlast the cooldown. */
export const getRateLimitCooldownSeconds = (): number =>
  Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));

/**
 * How long the API asked us to wait, from its `Retry-After` header, or null when it
 * sent none or sent something unreadable.
 *
 * The header is either a number of seconds or an HTTP date, and both forms turn up
 * depending on which proxy answered.
 */
export const parseRetryAfterMs = (retryAfter: string | null): number | null => {
  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const retryAt = Date.parse(retryAfter);
  if (Number.isNaN(retryAt)) {
    return null;
  }

  return Math.max(0, retryAt - Date.now());
};
