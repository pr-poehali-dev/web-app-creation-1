import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { CATEGORIES } from '@/data/categories';

interface OfferBasicInfoSectionProps {
  formData: {
    title: string;
    description: string;
    category: string;
    subcategory: string;
    transportServiceType?: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export default function OfferBasicInfoSection({ formData, onInputChange }: OfferBasicInfoSectionProps) {
  const isTransport = formData.category === 'transport';
  const selectedCategory = CATEGORIES.find(c => c.id === formData.category);
  const subcategories = selectedCategory?.subcategories || [];
  
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [subcategorySearch, setSubcategorySearch] = useState('');
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);

  const filteredCategories = CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredSubcategories = subcategories.filter(sub => 
    sub.name.toLowerCase().includes(subcategorySearch.toLowerCase())
  );

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
        <div className="grid md:grid-cols-2 gap-4">
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

          {subcategories.length > 0 && (
            <div className="relative">
              <Label htmlFor="subcategory">Подкатегория (необязательно)</Label>
              <div className="relative">
                <Input
                  id="subcategory"
                  value={isSubcategoryOpen ? subcategorySearch : (subcategories.find(s => s.id === formData.subcategory)?.name || '')}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                  onFocus={() => setIsSubcategoryOpen(true)}
                  placeholder="Начните вводить название подкатегории..."
                  className="pr-8"
                  disabled={!formData.category}
                />
                <button
                  type="button"
                  onClick={() => setIsSubcategoryOpen(!isSubcategoryOpen)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  disabled={!formData.category}
                >
                  <Icon name={isSubcategoryOpen ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              {isSubcategoryOpen && formData.category && (
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

        {!isTransport && (
          <>
            <div>
              <Label htmlFor="title">Название предложения *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => onInputChange('title', e.target.value)}
                placeholder="Например: Цемент М500, мешок 50 кг"
                required
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title.length}/100 символов
              </p>
            </div>

            <div>
              <Label htmlFor="description">Описание *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onInputChange('description', e.target.value)}
                placeholder="Подробное описание товара или услуги..."
                required
                rows={6}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/1000 символов
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}