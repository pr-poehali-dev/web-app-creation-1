import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';

interface AuctionSearchBlockProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  placeholder?: string;
  label?: string;
}

export default function AuctionSearchBlock({ 
  filters, 
  onFiltersChange, 
  onSearch,
  placeholder = "Введите минимум 2 символа для поиска...",
  label = "Поиск"
}: AuctionSearchBlockProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (query: string) => {
    onFiltersChange({ ...filters, query });
  };

  const handleClearQuery = () => {
    onFiltersChange({ ...filters, query: '' });
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-3">
        <div className="relative">
          <Label htmlFor="search-query" className="mb-1.5 block text-xs font-medium">
            {label}
          </Label>
          <div className="relative">
            <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              id="search-query"
              placeholder={placeholder}
              value={filters.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-9 h-9 text-sm"
            />
            {filters.query && (
              <button
                type="button"
                onClick={handleClearQuery}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {filters.query.length > 0 && filters.query.length < 2 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Введите минимум 2 символа
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}