// Kept out of the components so the impure timestamp is not read during render
export const createCategoryId = (): string => `category-${Date.now()}`;
