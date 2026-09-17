import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";

import InstallInstructionsDialog from "@/components/InstallInstructionsDialog";
import { attentionRingStyles } from "@/components/attentionRing";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// A long cycle with a short ripple at the start: noticeable on arrival, easy to
// ignore while reading
const RING_CYCLE_MS = 8000;
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
          ...attentionRingStyles({
            animationName: "install-ring",
            color: theme.palette.primary.light,
            cycleMs: RING_CYCLE_MS,
            visibleFraction: RING_VISIBLE_FRACTION,
            spreadPx: RING_SPREAD_PX,
          }),
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
