import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { CATEGORIES } from '@/data/categories';

interface AuctionBasicInfoSectionProps {
  formData: {
    title: string;
    description: string;
    category: string;
    subcategory: string;
    quantity: string;
    unit: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export default function AuctionBasicInfoSection({ formData, onInputChange }: AuctionBasicInfoSectionProps) {
  const selectedCategory = CATEGORIES.find(cat => cat.id === formData.category);
  
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [subcategorySearch, setSubcategorySearch] = useState('');
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);

  const filteredCategories = CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredSubcategories = selectedCategory?.subcategories.filter(sub => 
    sub.name.toLowerCase().includes(subcategorySearch.toLowerCase())
  ) || [];

  const handleSelectCategory = (categoryId: string) => {
    onInputChange('category', categoryId);
    const cat = CATEGORIES.find(c => c.id === categoryId);
    if (cat && cat.subcategories.length === 0) {
      onInputChange('subcategory', '');
    }
    setIsCategoryOpen(false);
    setCategorySearch('');
  };

  const handleSelectSubcategory = (subcategoryId: string) => {
    onInputChange('subcategory', subcategoryId);
    setIsSubcategoryOpen(false);
    setSubcategorySearch('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Основная информация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Label htmlFor="category">Категория *</Label>
            <div className="relative">
              <Input
                id="category"
                value={isCategoryOpen ? categorySearch : (selectedCategory?.name || '')}
                onChange={(e) => setCategorySearch(e.target.value)}
                onFocus={() => setIsCategoryOpen(true)}
                placeholder="Начните вводить название категории..."
                className="pr-8"
                required
              />
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Icon name={isCategoryOpen ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            
            {isCategoryOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsCategoryOpen(false)}
                />
                <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-background border border-input rounded-md shadow-lg">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                          formData.category === cat.id ? 'bg-accent font-medium' : ''
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Категории не найдены
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <div className="relative">
              <Label htmlFor="subcategory">Подкатегория</Label>
              <div className="relative">
                <Input
                  id="subcategory"
                  value={isSubcategoryOpen ? subcategorySearch : (selectedCategory.subcategories.find(s => s.id === formData.subcategory)?.name || '')}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                  onFocus={() => setIsSubcategoryOpen(true)}
                  placeholder="Начните вводить название подкатегории..."
                  className="pr-8"
                />
                <button
                  type="button"
                  onClick={() => setIsSubcategoryOpen(!isSubcategoryOpen)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <Icon name={isSubcategoryOpen ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              {isSubcategoryOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsSubcategoryOpen(false)}
                  />
                  <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-background border border-input rounded-md shadow-lg">
                    {filteredSubcategories.length > 0 ? (
                      filteredSubcategories.map(sub => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSelectSubcategory(sub.id)}
                          className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                            formData.subcategory === sub.id ? 'bg-accent font-medium' : ''
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Подкатегории не найдены
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="title">Название аукциона *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="Краткое название лота"
            maxLength={100}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Описание *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Подробное описание лота, его характеристики и условия"
            rows={5}
            maxLength={2000}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Количество</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => onInputChange('quantity', e.target.value)}
              placeholder="1"
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="unit">Единица измерения</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => onInputChange('unit', e.target.value)}
              placeholder="шт"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}