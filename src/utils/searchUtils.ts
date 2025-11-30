import type { Offer } from '@/types/offer';

export function normalizeSearchString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\wа-яё\s]/gi, '')
    .trim();
}

export function searchOffers(offers: Offer[], query: string): Offer[] {
  if (!query || query.length < 2) {
    return offers;
  }

  const normalizedQuery = normalizeSearchString(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length >= 2);

  if (queryWords.length === 0) {
    return offers;
  }

  return offers.filter(offer => {
    const searchableText = normalizeSearchString(
      `${offer.title} ${offer.description} ${offer.seller.name}`
    );

    return queryWords.every(word => searchableText.includes(word));
  });
}

export function getSearchSuggestions(offers: Offer[], query: string, limit: number = 5): string[] {
  if (!query || query.length < 2) {
    return [];
  }

  const normalizedQuery = normalizeSearchString(query);
  const suggestions = new Set<string>();

  offers.forEach(offer => {
    const title = offer.title.toLowerCase();
    const words = title.split(/\s+/);

    words.forEach(word => {
      if (word.startsWith(normalizedQuery) && word.length > normalizedQuery.length) {
        suggestions.add(offer.title);
      }
    });

    if (title.includes(normalizedQuery)) {
      suggestions.add(offer.title);
    }
  });

  return Array.from(suggestions).slice(0, limit);
}

export function highlightMatch(text: string, query: string): { text: string; isMatch: boolean }[] {
  if (!query || query.length < 2) {
    return [{ text, isMatch: false }];
  }

  const normalizedQuery = normalizeSearchString(query);
  const normalizedText = normalizeSearchString(text);
  
  const index = normalizedText.indexOf(normalizedQuery);
  
  if (index === -1) {
    return [{ text, isMatch: false }];
  }

  const result: { text: string; isMatch: boolean }[] = [];
  let currentIndex = 0;

  let searchIndex = 0;
  while (searchIndex !== -1) {
    searchIndex = normalizedText.indexOf(normalizedQuery, currentIndex);
    
    if (searchIndex !== -1) {
      if (searchIndex > currentIndex) {
        result.push({ text: text.slice(currentIndex, searchIndex), isMatch: false });
      }
      
      result.push({ 
        text: text.slice(searchIndex, searchIndex + normalizedQuery.length), 
        isMatch: true 
      });
      
      currentIndex = searchIndex + normalizedQuery.length;
    }
  }

  if (currentIndex < text.length) {
    result.push({ text: text.slice(currentIndex), isMatch: false });
  }

  return result;
}
