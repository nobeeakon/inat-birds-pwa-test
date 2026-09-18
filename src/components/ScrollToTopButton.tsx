import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Fab, Zoom } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

/**
 * How far the page has to have scrolled before the button appears. Roughly a phone
 * screen: above that the top of the list is a flick away and the button would only
 * cover a card.
 */
const VISIBLE_AFTER_SCROLL_PX = 600;

const subscribeToScrollChanges = (onChange: () => void): (() => void) => {
  // Passive: this listener never blocks the scroll it is watching
  window.addEventListener("scroll", onChange, { passive: true });

  return () => window.removeEventListener("scroll", onChange);
};

const isScrolledPastThreshold = (): boolean =>
  window.scrollY > VISIBLE_AFTER_SCROLL_PX;

/**
 * A floating button back to the top of the page, for a species list hundreds of cards
 * long.
 *
 * The scroll position is read through an external store rather than mirrored into state
 * by an effect: it is browser state, and a subscription means no render sees a stale
 * copy of it. The snapshot is the threshold test, not the offset, so a render is only
 * requested when the button's visibility actually changes.
 *
 * Bottom left, where every other floating control in the app is on the right: the
 * install button is pinned there, and this one has to stay clear of it.
 */
const ScrollToTopButton = () => {
  const { t } = useTranslation();
  const isVisible = useSyncExternalStore(
    subscribeToScrollChanges,
    isScrolledPastThreshold
  );

  const onScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Zoom in={isVisible}>
      <Fab
        color="primary"
        size="medium"
        aria-label={t("scrollToTop")}
        onClick={onScrollToTop}
        sx={{
          position: "fixed",
          // Fixed children position against the viewport, so they owe themselves the
          // room the system chrome takes (see the body padding in src/index.css)
          bottom: "calc(16px + env(safe-area-inset-bottom))",
          left: "calc(16px + env(safe-area-inset-left))",
          zIndex: 1000,
          boxShadow: 3,
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
};

export default ScrollToTopButton;
