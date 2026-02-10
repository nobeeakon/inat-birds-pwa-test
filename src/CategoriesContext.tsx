import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

import { categoriesStore, type Category } from "@/storage/db";

type CategoriesState =
  | { status: 'loading' }
  | { status: 'error', error: Error }
  | { status: 'success', data: Map<string, Category> };

type CategoriesContextType = {
  state: CategoriesState;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategory: (categoryId: string) => Category | undefined;
};

const CategoriesContext = createContext<CategoriesContextType>({
  state: { status: 'loading' },
  addCategory: async () => {
    throw new Error("addCategory not implemented");
  },
  updateCategory: async () => {
    throw new Error("updateCategory not implemented");
  },
  deleteCategory: async () => {
    throw new Error("deleteCategory not implemented");
  },
  getCategory: () => {
    throw new Error("getCategory not implemented");
  },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useCategoriesContext = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error(
      "useCategoriesContext must be used within a CategoriesContextProvider"
    );
  }
  return context;
};

const CategoriesContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CategoriesState>({ status: 'loading' });
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Load categories on mount and when refreshCounter changes
  useEffect(() => {
    const loadCategories = async () => {
      setState({ status: 'loading' });
      try {
        const storedCategories = await categoriesStore.getAll();
        const categoriesMap = new Map<string, Category>();
        if (storedCategories) {
          storedCategories.forEach(category => {
            categoriesMap.set(category.id, category);
          });
        }
        setState({ status: 'success', data: categoriesMap });
      } catch (error) {
        console.error("Failed to load categories from IndexedDB:", error);
        setState({
          status: 'error',
          error: error instanceof Error ? error : new Error('Unknown error loading categories')
        });
      }
    };
    loadCategories();
  }, [refreshCounter]);

  const addCategory = useCallback(async (category: Category) => {
    try {
      await categoriesStore.set(category);
      setRefreshCounter((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to add category:", error);
      throw error;
    }
  }, []);

  const updateCategory = useCallback(async (category: Category) => {
    try {
      await categoriesStore.set(category);
      setRefreshCounter((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to update category:", error);
      throw error;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      await categoriesStore.delete(categoryId);
      setRefreshCounter((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete category:", error);
      throw error;
    }
  }, []);

  const getCategory = useCallback((categoryId: string): Category | undefined => {
    if (state.status === 'success') {
      return state.data.get(categoryId);
    }
    return undefined;
  }, [state]);

  const value = {
    state,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategory,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};

export default CategoriesContextProvider;
