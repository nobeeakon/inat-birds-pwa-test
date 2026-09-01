import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Snackbar } from "@mui/material";
import { useRegisterSW } from "virtual:pwa-register/react";

// An installed PWA can stay open for days without a navigation, and the browser
// only looks for a new service worker when a navigation or a registration
// happens. Without this poll a released build can go unnoticed indefinitely.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

const UpdatePrompt = () => {
  const { t } = useTranslation();
  const [serviceWorkerRegistration, setServiceWorkerRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [hasPendingUpdate, setHasPendingUpdate],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_serviceWorkerUrl, registration) => {
      setServiceWorkerRegistration(registration ?? null);
    },
    onRegisterError: (error) => {
      console.error("Service worker registration failed", error);
    },
  });

  useEffect(() => {
    if (!serviceWorkerRegistration) {
      return;
    }

    const checkForNewBuild = () => {
      // Skip while hidden or offline: the request would either be wasted or
      // fail, and returning to the foreground triggers a check anyway.
      if (document.visibilityState !== "visible" || !navigator.onLine) {
        return;
      }

      serviceWorkerRegistration.update().catch((error: unknown) => {
        console.warn("Service worker update check failed", error);
      });
    };

    const intervalId = window.setInterval(
      checkForNewBuild,
      UPDATE_CHECK_INTERVAL_MS
    );
    document.addEventListener("visibilitychange", checkForNewBuild);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", checkForNewBuild);
    };
  }, [serviceWorkerRegistration]);

  if (!hasPendingUpdate) {
    return null;
  }

  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      // Sits above the nav bar toggle, which occupies the bottom corner
      sx={{ bottom: 72 }}
    >
      <Alert
        severity="info"
        variant="filled"
        action={
          <>
            <Button
              color="inherit"
              size="small"
              onClick={() => updateServiceWorker(true)}
            >
              {t("reload")}
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={() => setHasPendingUpdate(false)}
            >
              {t("later")}
            </Button>
          </>
        }
      >
        {t("newVersionAvailable")}
      </Alert>
    </Snackbar>
  );
};

export default UpdatePrompt;
