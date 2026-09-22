import { LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY } from "@/constants";
import { storage } from "@/storage/storage";

/**
 * What a recorded event says happened.
 *
 * Kept in step with firestore.rules, which rejects any other value: the write endpoint
 * is open to anyone, so the rule is the only thing standing between the collection and
 * arbitrary documents.
 */
export type TrackedAction = "install" | "open";

type TrackedEventDocument = {
  fields: {
    id: { stringValue: string };
    date: { timestampValue: string };
    action: { stringValue: TrackedAction };
  };
};

const FIRESTORE_COLLECTION = "inatMemoEvents";

// import.meta.env is typed with an index signature, so the value arrives untyped and
// is narrowed here rather than asserted
const readEnvironmentVariable = (name: string): string => {
  const value: unknown = import.meta.env[name];

  return typeof value === "string" ? value : "";
};

/**
 * Where events are posted, or null when the project is not configured.
 *
 * The Firebase web API key is not a secret — it identifies the project and travels in
 * every request any Firebase client makes, with the security rules rather than the key
 * deciding what is allowed — but it is read from the environment all the same so that
 * a fork builds against its own project, or against none.
 */
const buildEventsEndpoint = (): string | null => {
  const projectId = readEnvironmentVariable("VITE_FIREBASE_PROJECT_ID");
  const apiKey = readEnvironmentVariable("VITE_FIREBASE_API_KEY");


  if (!projectId || !apiKey) {
    return null;
  }

  return (
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/${FIRESTORE_COLLECTION}` +
    `?key=${encodeURIComponent(apiKey)}`
  );
};

const EVENTS_ENDPOINT = buildEventsEndpoint();

const createVisitorId = (): string =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/**
 * A random id for this browser, minted on the first event and kept from then on.
 *
 * Nothing in it comes from the user or the device: it exists only so that two events
 * can be told to have come from the same place, and clearing site data ends it.
 */
const getVisitorId = (): string => {
  const storedVisitorId = storage.get<string>(LOCAL_STORAGE_KEY.visitorId);

  if (typeof storedVisitorId === "string" && storedVisitorId.length > 0) {
    return storedVisitorId;
  }

  const newVisitorId = createVisitorId();
  storage.set(LOCAL_STORAGE_KEY.visitorId, newVisitorId);

  return newVisitorId;
};

/**
 * Records one event, without making the caller wait for it or handle it failing.
 *
 * A dropped event is worth less than the tap that produced it, so every failure ends
 * at a warning: an offline install tap must still open the prompt, and a blocked
 * request must still leave the app running.
 */
export const trackEvent = (action: TrackedAction): void => {
  if (EVENTS_ENDPOINT === null) {
    return;
  }

  // Development runs would otherwise be indistinguishable from real ones in a
  // collection whose whole purpose is counting real ones
  if (import.meta.env.DEV) {
    console.info(`Tracking event not sent in development: ${action}`);
    return;
  }

  const event: TrackedEventDocument = {
    fields: {
      id: { stringValue: getVisitorId() },
      date: { timestampValue: new Date().toISOString() },
      action: { stringValue: action },
    },
  };

  void fetch(EVENTS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    // Lets the request outlive the page, for the tap that ends with the app being
    // installed and this tab going away
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok) {
        console.warn(
          `Tracking event "${action}" was rejected: ${response.status}`
        );
      }
    })
    .catch((error: unknown) => {
      console.warn(`Tracking event "${action}" could not be sent`, error);
    });
};

const hasCountedThisSession = (): boolean => {
  try {
    return (
      sessionStorage.getItem(SESSION_STORAGE_KEY.trackingSessionCounted) !==
      null
    );
  } catch (error) {
    // Private modes and blocked storage throw on access rather than returning null.
    // Claiming the session was already counted is the quieter way to be wrong: at
    // worst an open goes unrecorded, where the other way round sends one per reload.
    console.warn("Could not read the tracking session marker", error);
    return true;
  }
};

const markSessionCounted = (): void => {
  try {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY.trackingSessionCounted,
      String(Date.now())
    );
  } catch (error) {
    console.warn("Could not write the tracking session marker", error);
  }
};

/**
 * Counts this launch of the app, once.
 *
 * The marker lives in sessionStorage, which is what makes this "times the app was
 * opened" rather than "times a page was loaded": it survives a reload of this tab and
 * dies when the tab or the installed app is closed. A reload is worth guarding against
 * because the app does it to itself — the service worker reloads the page whenever a
 * new build lands (registerType "autoUpdate" in vite.config.ts).
 */
export const trackAppOpened = (): void => {
  if (hasCountedThisSession()) {
    return;
  }

  markSessionCounted();
  trackEvent("open");
};
