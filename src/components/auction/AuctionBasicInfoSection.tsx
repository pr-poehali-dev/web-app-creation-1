import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Основная информация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Label htmlFor="category">Категория *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => onInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
              required
            >
              <option value="">Выберите категорию</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <div>
              <Label htmlFor="subcategory">Подкатегория</Label>
              <select
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => onInputChange('subcategory', e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="">Выберите подкатегорию</option>
                {selectedCategory.subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}
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
