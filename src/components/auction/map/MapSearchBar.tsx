import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface MapSearchBarProps {
  onSelectLocation: (lat: number, lng: number, displayName: string) => void;
  initialValue?: string;
}

export default function MapSearchBar({ onSelectLocation, initialValue = '' }: MapSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setSearchQuery(initialValue);
    }
  }, [initialValue]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=ru&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onSelectLocation(lat, lng, result.display_name);
    setSearchQuery(result.display_name);
    setSearchResults([]);
  };

  return (
    <div className="relative mb-4">
      <Label htmlFor="search-address" className="mb-2 block">
        Поиск адреса
      </Label>
      <div className="relative">
        <Input
          id="search-address"
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Введите адрес для поиска..."
          className="pr-10 text-xs"
        />
        {isSearching ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icon name="Loader2" className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="X" className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-start gap-2 border-b last:border-b-0"
              onClick={() => handleSelectResult(result)}
            >
              <Icon name="MapPin" className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}