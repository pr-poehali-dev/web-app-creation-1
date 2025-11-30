export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  filters: {
    category?: string;
    subcategory?: string;
    district?: string;
    contentType: 'offers' | 'requests';
  };
}

const STORAGE_KEY = 'searchHistory';
const MAX_HISTORY_ITEMS = 10;

export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  } catch (error) {
    console.error('Error reading search history:', error);
    return [];
  }
};

export const addToSearchHistory = (
  query: string,
  filters: {
    category?: string;
    subcategory?: string;
    district?: string;
    contentType: 'offers' | 'requests';
  }
): void => {
  if (!query || query.trim().length < 2) return;

  try {
    const history = getSearchHistory();
    
    const existingIndex = history.findIndex(
      (item) => item.query.toLowerCase() === query.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }
    
    const newItem: SearchHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      query: query.trim(),
      timestamp: new Date(),
      filters
    };
    
    history.unshift(newItem);
    
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
};

export const clearSearchHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};

export const removeFromSearchHistory = (id: string): void => {
  try {
    const history = getSearchHistory();
    const filtered = history.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from search history:', error);
  }
};

export const getRecentSearches = (limit: number = 5): string[] => {
  const history = getSearchHistory();
  return history.slice(0, limit).map((item) => item.query);
};
