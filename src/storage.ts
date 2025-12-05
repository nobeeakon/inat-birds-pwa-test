import { useState } from "react";

export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error);
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage:`, error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  },
};

export const useStorageState = <
  T extends
    | string
    | number
    | boolean
    | null
    | Array<unknown>
    | Record<string, unknown>,
>(
  key: string,
  defaultValue: T,
  config: { maxKeysSize?: number } = {}
) => {
  const [state, setState] = useState<T>(() => {
    const storedValue = storage.get<T>(key);
    return storedValue !== null ? storedValue : defaultValue;
  });

  const setStorageState = (value: T) => {
    let newValue: T = value;

    if (
      typeof value === "object" &&
      value !== null &&
      config.maxKeysSize !== undefined
    ) {
      if (Array.isArray(value)) {
        if (value.length > config.maxKeysSize) {
          newValue = value.slice(value.length - config.maxKeysSize) as T;
        }
      } else {
        const entries = Object.entries(value);

        if (entries.length > config.maxKeysSize) {
          const slicedEntries = entries.slice(
            entries.length - config.maxKeysSize
          );
          newValue = Object.fromEntries(slicedEntries) as T;
        }
      }
    }

    setState(newValue);
    storage.set(key, newValue);
  };

  return [state, setStorageState] as const;
};
