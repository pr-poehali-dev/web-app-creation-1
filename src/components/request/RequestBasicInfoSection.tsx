import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES } from '@/data/categories';

interface RequestBasicInfoSectionProps {
  formData: {
    title: string;
    description: string;
    category: string;
    subcategory: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export default function RequestBasicInfoSection({
  formData,
  onInputChange,
}: RequestBasicInfoSectionProps) {
  const selectedCategory = CATEGORIES.find(c => c.id === formData.category);
  const subcategories = selectedCategory?.subcategories || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Основная информация</CardTitle>
        <CardDescription>
          Название и описание того, что вам нужно
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Название запроса *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="Например: Требуется песок строительный 50 тонн"
            required
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.title.length}/100 символов
          </p>
        </div>

        <div>
          <Label htmlFor="description">Описание запроса *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Подробно опишите ваши требования к товару или услуге..."
            required
            rows={6}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.description.length}/1000 символов
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Категория *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => onInputChange('category', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Выберите категорию</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="subcategory">Подкатегория *</Label>
            <select
              id="subcategory"
              value={formData.subcategory}
              onChange={(e) => onInputChange('subcategory', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
              disabled={!formData.category}
            >
              <option value="">Выберите подкатегорию</option>
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
