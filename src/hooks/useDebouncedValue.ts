import { useEffect, useState } from "react";

/**
 * The value as it was `delayMs` after it last changed.
 *
 * Each change restarts the wait, so a value that keeps changing — a search field being
 * typed into — only reaches the caller once it settles, and the work behind it runs
 * once instead of per keystroke.
 */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
};
