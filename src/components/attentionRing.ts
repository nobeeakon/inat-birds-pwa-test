import type { CSSObject } from "@mui/material/styles";

type AttentionRingOptions = {
  /**
   * Emotion emits the keyframes under this literal name, so two call sites sharing
   * one name would overwrite each other's timings.
   */
  animationName: string;
  color: string;
  cycleMs: number;
  /** Share of the cycle the ripple takes; the rest of it is a rest. */
  visibleFraction: number;
  spreadPx: number;
};

/**
 * One ring that grows out of a control's edge and fades, on a cycle that is mostly
 * rest: the control asks for attention rather than demanding it.
 *
 * Growing a shadow's spread keeps the ring's rounded corners exact, and leaves the
 * control itself perfectly still.
 */
export const attentionRingStyles = ({
  animationName,
  color,
  cycleMs,
  visibleFraction,
  spreadPx,
}: AttentionRingOptions): CSSObject => ({
  // The ring grows past the control's edge, which ButtonBase clips by default; the
  // touch ripple does its own clipping, so it stays inside
  overflow: "visible",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    animation: `${animationName} ${cycleMs}ms cubic-bezier(0.22, 0.61, 0.36, 1) infinite`,
  },
  [`@keyframes ${animationName}`]: {
    "0%": {
      opacity: 0.5,
      boxShadow: `0 0 0 0 ${color}`,
    },
    [`${visibleFraction * 100}%, 100%`]: {
      opacity: 0,
      boxShadow: `0 0 0 ${spreadPx}px ${color}`,
    },
  },
  "@media (prefers-reduced-motion: reduce)": {
    "&::before": {
      animation: "none",
    },
  },
});
