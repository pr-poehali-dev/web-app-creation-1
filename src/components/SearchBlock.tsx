import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { SearchFilters, ContentType, Offer } from '@/types/offer';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSearchSuggestions } from '@/utils/searchUtils';

interface SearchBlockProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  allOffers: Offer[];
}

export default function SearchBlock({ filters, onFiltersChange, onSearch, allOffers }: SearchBlockProps) {
  const { setSelectedDistricts } = useDistrict();
  const [selectedCategory, setSelectedCategory] = useState(filters.category);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);
  const subcategories = currentCategory?.subcategories || [];

  useEffect(() => {
    if (selectedCategory !== filters.category) {
      onFiltersChange({ ...filters, category: selectedCategory, subcategory: '' });
    }
  }, [selectedCategory]);

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

    if (query.length >= 2) {
      const newSuggestions = getSearchSuggestions(allOffers, query, 5);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setActiveSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleClearQuery = () => {
    onFiltersChange({ ...filters, query: '' });
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    onFiltersChange({ ...filters, query: suggestion });
    setShowSuggestions(false);
    setSuggestions([]);
    onSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[activeSuggestionIndex]);
        } else {
          onSearch();
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  const handleContentTypeChange = (contentType: ContentType) => {
    onFiltersChange({ ...filters, contentType });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSubcategoryChange = (subcategory: string) => {
    onFiltersChange({ ...filters, subcategory });
  };

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedDistricts([]);
    onFiltersChange({
      query: '',
      contentType: 'offers',
      category: '',
      subcategory: '',
      district: 'all',
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Label htmlFor="search-query" className="mb-2 block">
                Поиск
              </Label>
              <div className="relative">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  id="search-query"
                  placeholder="Введите минимум 2 символа для поиска..."
                  value={filters.query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (filters.query.length >= 2 && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="pl-10 pr-10"
                />
                {filters.query && (
                  <button
                    type="button"
                    onClick={handleClearQuery}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon name="X" className="h-4 w-4" />
                  </button>
                )}
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-2 ${
                        index === activeSuggestionIndex ? 'bg-muted' : ''
                      }`}
                    >
                      <Icon name="Search" className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}

              {filters.query.length > 0 && filters.query.length < 2 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Введите минимум 2 символа для поиска
                </p>
              )}
            </div>

            <div className="w-full md:w-auto">
              <Label className="mb-2 block opacity-0 pointer-events-none">
                &nbsp;
              </Label>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="w-full md:w-auto whitespace-nowrap"
              >
                <Icon name={showAdvancedSearch ? "ChevronUp" : "ChevronDown"} className="mr-2 h-4 w-4" />
                {showAdvancedSearch ? 'Скрыть' : 'Расширенный'}
              </Button>
            </div>

            <div className="w-full md:w-48">
              <Label htmlFor="content-type" className="mb-2 block font-semibold text-primary">
                Тип контента
              </Label>
              <Select value={filters.contentType} onValueChange={handleContentTypeChange}>
                <SelectTrigger id="content-type" className="bg-primary text-primary-foreground border-primary hover:bg-primary/90 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offers">
                    <div className="flex items-center gap-2">
                      <Icon name="Package" className="h-4 w-4" />
                      <span>Предложения</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="requests">
                    <div className="flex items-center gap-2">
                      <Icon name="FileText" className="h-4 w-4" />
                      <span>Запросы</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden transition-all duration-300 ease-in-out ${
              showAdvancedSearch ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div>
              <Label htmlFor="category" className="mb-2 block">
                Категория
              </Label>
              <Select value={selectedCategory || 'not-selected'} onValueChange={(value) => handleCategoryChange(value === 'not-selected' ? '' : value === 'uncategorized' ? 'uncategorized' : value)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Не выбрана" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-selected">Не выбрана</SelectItem>
                  <SelectItem value="uncategorized">Без категории</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subcategory" className="mb-2 block">
                Подкатегория
              </Label>
              <Select
                value={filters.subcategory || 'not-selected'}
                onValueChange={(value) => handleSubcategoryChange(value === 'not-selected' ? '' : value)}
                disabled={!selectedCategory}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Не выбрана" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-selected">Не выбрана</SelectItem>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={onSearch} className="flex-1 md:flex-none">
              <Icon name="Search" className="mr-2 h-4 w-4" />
              Искать
            </Button>
            <Button onClick={handleReset} variant="outline">
              <Icon name="X" className="mr-2 h-4 w-4" />
              Сбросить
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}