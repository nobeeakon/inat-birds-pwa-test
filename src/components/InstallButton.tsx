import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";

import InstallInstructionsDialog from "@/components/InstallInstructionsDialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// A long cycle with a short ripple at the start: noticeable on arrival, easy to
// ignore while reading
const RING_CYCLE_MS = 5200;
const RING_TRAIL_DELAY_MS = 700;
const RING_VISIBLE_FRACTION = 0.2;
const RING_SPREAD_PX = 11;

const isRunningStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as { standalone?: boolean }).standalone === true;

const InstallButton = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isRunningStandalone);
  const [areInstructionsOpen, setAreInstructionsOpen] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      return;
    }

    // Only Chromium browsers fire this; elsewhere the button falls back to the
    // instructions dialog
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      setIsInstalled(event.matches);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    standaloneQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      standaloneQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setAreInstructionsOpen(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } catch (error) {
      // A prompt can only be used once; if the browser rejects it, fall back to
      // the manual instructions rather than leaving the tap with no effect
      console.warn("Install prompt failed", error);
      setDeferredPrompt(null);
      setAreInstructionsOpen(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleInstallClick}
        startIcon={<InstallMobileIcon />}
        sx={(theme) => ({
          position: "fixed",
          // Clear of the rating buttons at the foot of the observations screen
          bottom: 80,
          right: 16,
          zIndex: 1000,
          boxShadow: 3,
          // The ring grows past the button's edge, which ButtonBase clips by
          // default; the touch ripple does its own clipping, so it stays inside
          overflow: "visible",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            // Growing a shadow's spread keeps the ring's rounded corners exact,
            // and leaves the button itself perfectly still
            animation: `install-ring ${RING_CYCLE_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1) infinite`,
          },
          // A second ring trailing the first reads as one soft ripple
          "&::after": {
            animationDelay: `${RING_TRAIL_DELAY_MS}ms`,
          },
          "@keyframes install-ring": {
            "0%": {
              opacity: 0.5,
              boxShadow: `0 0 0 0 ${theme.palette.primary.light}`,
            },
            // The ripple takes a fifth of the cycle; the rest is a long rest,
            // so the button asks for attention rather than demanding it
            [`${RING_VISIBLE_FRACTION * 100}%, 100%`]: {
              opacity: 0,
              boxShadow: `0 0 0 ${RING_SPREAD_PX}px ${theme.palette.primary.light}`,
            },
          },
          "@media (prefers-reduced-motion: reduce)": {
            "&::before, &::after": {
              animation: "none",
            },
          },
        })}
      >
        {t("installApp")}
      </Button>
      <InstallInstructionsDialog
        isOpen={areInstructionsOpen}
        onClose={() => setAreInstructionsOpen(false)}
      />
    </>
  );
};

export default InstallButton;
