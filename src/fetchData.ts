import { API_CLIENT_NAME, API_CLIENT_QUERY_PARAM } from "@/constants";
import { isOffline } from "@/onlineStatus";
import {
  acquireRequestSlot,
  isRateLimitCooldownActive,
  parseRetryAfterMs,
  startRateLimitCooldown,
} from "@/rateLimit";

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

/** Every URL carries the app identifier, wherever in the app it was built. */
const withClientIdentifier = (url: string): string => url
  // url.includes(API_CLIENT_QUERY_PARAM)
  //   ? url
  //   : `${url}${url.includes("?") ? "&" : "?"}${API_CLIENT_QUERY_PARAM}`;

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

  // Holds this request to the one a second iNaturalist asks for, counted across every
  // stream rather than within each. Waiting here rather than in the callers is what
  // lets them be written as plain loops.
  await acquireRequestSlot();

  // The wait above can be long enough for another stream to be refused, and for the
  // cooldown that follows to start. Checked again rather than spent on a request the
  // API has just said it does not want.
  if (isRateLimitCooldownActive()) {
    throw new ApiError(TOO_MANY_REQUESTS, "Too Many Requests (cooling down)");
  }

  const response = await fetch(withClientIdentifier(URL), {
    // Unauthenticated on purpose: iNaturalist does not cache responses to
    // authenticated requests, and nothing here needs anyone's private data
    credentials: "omit",
    headers: {
      Accept: "application/json",
      // Dropped by the browser, which sends its own; see API_CLIENT_NAME
      "User-Agent": API_CLIENT_NAME,
    },
    method: "GET",
    mode: "cors",
    signal: abortSignal,
  });

  // Without this a rate limited response falls through as a body with no `results` in
  // it, and surfaces much later as a type error that says nothing about the cause
  if (!response.ok) {
    if (isRateLimitStatus(response.status)) {
      // What iNaturalist asked for when it said, rather than this app's own guess
      startRateLimitCooldown(
        parseRetryAfterMs(response.headers.get("Retry-After")) ?? undefined
      );
    }

    throw new ApiError(response.status, response.statusText);
  }

  return response.json() as Promise<T>;
};
