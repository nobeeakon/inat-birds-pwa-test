import { useCallback, useState } from "react";
import { storage } from "@/storage/storage";

type UsePersistedOptionArgs<T extends string> = {
  storageKey: string;
  defaultValue: T;
  isValidValue: (value: unknown) => value is T;
};

/**
 * Keeps a single string setting in localStorage.
 *
 * The stored value is validated on read, so one left behind by an older version of the
 * app falls back to the default instead of reaching the API.
 */
export const usePersistedOption = <T extends string>({
  storageKey,
  defaultValue,
  isValidValue,
}: UsePersistedOptionArgs<T>): [T, (value: T) => void] => {
  const [currentValue, setCurrentValue] = useState<T>(() => {
    const storedValue = storage.get<string>(storageKey);
    return isValidValue(storedValue) ? storedValue : defaultValue;
  });

  // Stable so callers can use it as an effect dependency
  const setValue = useCallback(
    (value: T) => {
      storage.set(storageKey, value);
      setCurrentValue(value);
    },
    [storageKey]
  );

  return [currentValue, setValue];
};
