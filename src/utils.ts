export const notNull = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const getRandomIndex = (length: number) =>
  Math.floor(Math.random() * length);
