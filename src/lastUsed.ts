import { LOCAL_STORAGE_KEY } from "@/constants";
import { storage } from "@/storage/storage";

/**
 * How long the app can go unopened before the next visit counts as a fresh one.
 *
 * The same fortnight the deck keeps its entries for (`DECK_ENTRY_TTL_MS`), and for the
 * same reason: past it nothing held locally can stand in for a request, so a visit
 * after the gap pays for everything it shows exactly like a first one does.
 */
export const RETURNING_VISIT_GAP_MS = 14 * 24 * 60 * 60 * 1000;

// Decided once and kept for the rest of the session, so that recording the visit does
// not change the answer half way through it
let isFirstOrReturningVisitThisSession: boolean | null = null;

const readIsFirstOrReturningVisit = (): boolean => {
  const lastUsedAt = storage.get<number>(LOCAL_STORAGE_KEY.lastUsedAt);

  return (
    typeof lastUsedAt !== "number" ||
    Date.now() - lastUsedAt > RETURNING_VISIT_GAP_MS
  );
};

/**
 * Whether this is the app's first visit, or the first one after a fortnight away.
 *
 * Most people open this app once or twice and never come back, so the visit that has
 * to be cheap is the very one that has nothing cached to be cheap with. What it buys
 * is spent on a smaller round.
 */
export const getIsFirstOrReturningVisit = (): boolean =>
  (isFirstOrReturningVisitThisSession ??= readIsFirstOrReturningVisit());

/**
 * Marks the app as used now, which is what the next visit is measured against.
 *
 * The decision above is taken first, before the timestamp it is made from is
 * overwritten, so that it survives whatever order the callers run in.
 */
export const recordAppUsed = (): void => {
  getIsFirstOrReturningVisit();
  storage.set(LOCAL_STORAGE_KEY.lastUsedAt, Date.now());
};
