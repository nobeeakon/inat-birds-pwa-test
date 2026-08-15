import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { storage } from "@/storage/storage";

type UsePersistedOptionArgs<T extends string> = {
  searchParamName: string;
  storageKey: string;
  defaultValue: T;
  isValidValue: (value: unknown) => value is T;
};

/**
 * Keeps a single string setting in sync across the URL and localStorage.
 *
 * Priority when reading: valid URL param > valid localStorage > default. Values that
 * fail isValidValue are ignored, so a stale stored value or a hand-edited link falls
 * back to the default instead of reaching the API.
 */
export const usePersistedOption = <T extends string>({
  searchParamName,
  storageKey,
  defaultValue,
  isValidValue,
}: UsePersistedOptionArgs<T>): [T, (value: T) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlValue = searchParams.get(searchParamName);

  const currentValue = useMemo(() => {
    if (isValidValue(urlValue)) {
      return urlValue;
    }

    const storedValue = storage.get<string>(storageKey);
    if (isValidValue(storedValue)) {
      return storedValue;
    }

    return defaultValue;
  }, [urlValue, storageKey, defaultValue, isValidValue]);

  // Merge into the existing params rather than replacing them, so the other
  // persisted options in the URL survive.
  const writeToUrl = useCallback(
    (value: T, options?: { replace?: boolean }) => {
      setSearchParams((previousParams) => {
        const nextParams = new URLSearchParams(previousParams);
        nextParams.set(searchParamName, value);
        return nextParams;
      }, options);
    },
    [searchParamName, setSearchParams]
  );

  useEffect(() => {
    if (urlValue !== currentValue) {
      writeToUrl(currentValue, { replace: true });
    }
  }, [currentValue, urlValue, writeToUrl]);

  useEffect(() => {
    storage.set(storageKey, currentValue);
  }, [currentValue, storageKey]);

  const setValue = (value: T) => {
    storage.set(storageKey, value);
    writeToUrl(value);
  };

  return [currentValue, setValue];
};
