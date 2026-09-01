import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

// Browsers that expose no install prompt each hide the "add to home screen"
// action somewhere different, so the instructions have to be per platform.
type InstallPlatform =
  | "iosSafari"
  | "iosOtherBrowser"
  | "androidChromium"
  | "androidFirefox"
  | "desktopChromium"
  | "desktopSafari"
  | "desktopFirefox"
  | "unknown";

type InstallGuide = {
  steps: string[];
  note?: string;
};

const detectInstallPlatform = (): InstallPlatform => {
  const userAgent = navigator.userAgent;

  // iPadOS reports itself as Macintosh, so touch points are the giveaway
  const isIos =
    /iPhone|iPad|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(userAgent);
  const isFirefox = /Firefox|FxiOS/.test(userAgent);
  const isChromium = /Chrome|CriOS|Edg\//.test(userAgent);

  if (isIos) {
    // Every iOS browser uses the same WebKit engine, but only Safari's share
    // sheet reliably offers "Add to Home Screen"
    return isChromium || isFirefox ? "iosOtherBrowser" : "iosSafari";
  }

  if (isAndroid) {
    if (isFirefox) {
      return "androidFirefox";
    }
    return isChromium ? "androidChromium" : "unknown";
  }

  if (isChromium) {
    return "desktopChromium";
  }

  if (isFirefox) {
    return "desktopFirefox";
  }

  if (/Safari/.test(userAgent)) {
    return "desktopSafari";
  }

  return "unknown";
};

// Keys are spelled out per branch instead of built dynamically so that
// i18next-parser can find them
const useInstallGuide = (platform: InstallPlatform): InstallGuide => {
  const { t } = useTranslation();

  switch (platform) {
    case "iosSafari":
      return {
        steps: [
          t("installHelp.iosSafariStep1"),
          t("installHelp.iosSafariStep2"),
          t("installHelp.iosSafariStep3"),
        ],
      };
    case "iosOtherBrowser":
      return {
        steps: [
          t("installHelp.iosOtherBrowserStep1"),
          t("installHelp.iosOtherBrowserStep2"),
        ],
        note: t("installHelp.iosOtherBrowserNote"),
      };
    case "androidChromium":
      return {
        steps: [
          t("installHelp.androidChromiumStep1"),
          t("installHelp.androidChromiumStep2"),
          t("installHelp.androidChromiumStep3"),
        ],
      };
    case "androidFirefox":
      return {
        steps: [
          t("installHelp.androidFirefoxStep1"),
          t("installHelp.androidFirefoxStep2"),
        ],
      };
    case "desktopChromium":
      return {
        steps: [
          t("installHelp.desktopChromiumStep1"),
          t("installHelp.desktopChromiumStep2"),
        ],
      };
    case "desktopSafari":
      return {
        steps: [
          t("installHelp.desktopSafariStep1"),
          t("installHelp.desktopSafariStep2"),
        ],
        note: t("installHelp.desktopSafariNote"),
      };
    case "desktopFirefox":
      return {
        steps: [
          t("installHelp.desktopFirefoxStep1"),
          t("installHelp.desktopFirefoxStep2"),
        ],
        note: t("installHelp.desktopFirefoxNote"),
      };
    case "unknown":
      return {
        steps: [t("installHelp.unknownStep1"), t("installHelp.unknownStep2")],
      };
  }
};

const InstallInstructionsDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { steps, note } = useInstallGuide(detectInstallPlatform());

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="install-help-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="install-help-title">
        {t("installHelp.title")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{t("installHelp.intro")}</DialogContentText>
        <Box component="ol" sx={{ pl: 3, mt: 2, mb: 0 }}>
          {steps.map((step) => (
            <Box component="li" key={step} sx={{ mb: 1 }}>
              <DialogContentText component="span">{step}</DialogContentText>
            </Box>
          ))}
        </Box>
        {note && (
          <DialogContentText variant="body2" sx={{ mt: 2 }}>
            {note}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InstallInstructionsDialog;
