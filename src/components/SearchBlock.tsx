import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { SearchFilters, ContentType } from '@/types/offer';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';

interface SearchBlockProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
}

export default function SearchBlock({ filters, onFiltersChange, onSearch }: SearchBlockProps) {
  const { districts } = useDistrict();
  const [selectedCategory, setSelectedCategory] = useState(filters.category);

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);
  const subcategories = currentCategory?.subcategories || [];

  useEffect(() => {
    if (selectedCategory !== filters.category) {
      onFiltersChange({ ...filters, category: selectedCategory, subcategory: '' });
    }
  }, [selectedCategory]);

  const handleQueryChange = (query: string) => {
    onFiltersChange({ ...filters, query });
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

  const handleDistrictChange = (district: string) => {
    onFiltersChange({ ...filters, district });
  };

  const handleReset = () => {
    setSelectedCategory('');
    onFiltersChange({
      query: '',
      contentType: 'offers',
      category: '',
      subcategory: '',
      district: 'all',
    });
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search-query" className="mb-2 block">
                Поиск
              </Label>
              <div className="relative">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-query"
                  placeholder="Введите название товара или услуги..."
                  value={filters.query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                />
              </div>
            </div>

            <div className="w-full md:w-48">
              <Label htmlFor="content-type" className="mb-2 block">
                Тип контента
              </Label>
              <Select value={filters.contentType} onValueChange={handleContentTypeChange}>
                <SelectTrigger id="content-type">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category" className="mb-2 block">
                Категория
              </Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все категории</SelectItem>
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
                value={filters.subcategory}
                onValueChange={handleSubcategoryChange}
                disabled={!selectedCategory}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Все подкатегории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все подкатегории</SelectItem>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="district-search" className="mb-2 block">
                Район
              </Label>
              <Select value={filters.district} onValueChange={handleDistrictChange}>
                <SelectTrigger id="district-search">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      <div className="flex items-center gap-2">
                        {district.id === 'all' ? (
                          <Icon name="Globe" className="h-4 w-4" />
                        ) : (
                          <Icon name="MapPin" className="h-4 w-4" />
                        )}
                        <span>{district.name}</span>
                      </div>
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
