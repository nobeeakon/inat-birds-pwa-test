import { INATURALIST_SITE_URL } from "@/constants";
import { isOffline } from "@/onlineStatus";
import { isRateLimitCooldownActive, startRateLimitCooldown } from "@/rateLimit";

/** What went wrong, at the granularity the error screen words its message at. */
export type FetchErrorKind = "rateLimit" | "generic";

/** Nothing was sent: the browser reports no connection. */
export class OfflineError extends Error {
  constructor() {
    super("The device is offline");
    this.name = "OfflineError";
  }
}

/** An iNaturalist response that came back with a status outside 2xx. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, statusText: string) {
    super(`iNaturalist responded ${status} ${statusText}`);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * 429 is the documented rate limit; 503 is what the API answers when it sheds load
 * under one. Both clear on their own, so both are worth telling the user to wait out.
 */
const RATE_LIMIT_STATUSES = [429, 503];

const TOO_MANY_REQUESTS = 429;

const isRateLimitStatus = (status: number) =>
  RATE_LIMIT_STATUSES.includes(status);

export const getFetchErrorKind = (error: unknown): FetchErrorKind =>
  error instanceof ApiError && isRateLimitStatus(error.status)
    ? "rateLimit"
    : "generic";

export const fetchData = async <T>(
  URL: string,
  abortSignal?: AbortSignal
): Promise<T> => {
  // The single gate every iNaturalist request passes through, so no stream has to
  // check the connection for itself. It matters most to the loops: a connection that
  // drops mid-fetch stops the run on its next request instead of letting it walk the
  // rest of its species, a second of sleep at a time, failing at each one.
  if (isOffline()) {
    throw new OfflineError();
  }

  // Refused here rather than sent: the API has just turned another stream away, and
  // one more request would only make the limit take longer to clear
  if (isRateLimitCooldownActive()) {
    throw new ApiError(TOO_MANY_REQUESTS, "Too Many Requests (cooling down)");
  }

  const response = await fetch(URL, {
    credentials: "omit",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.5",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
    },
    referrer: `${INATURALIST_SITE_URL}/`,
    method: "GET",
    mode: "cors",
    signal: abortSignal,
  });

  // Without this a rate limited response falls through as a body with no `results` in
  // it, and surfaces much later as a type error that says nothing about the cause
  if (!response.ok) {
    if (isRateLimitStatus(response.status)) {
      startRateLimitCooldown();
    }

    throw new ApiError(response.status, response.statusText);
  }

  return response.json() as Promise<T>;
};
