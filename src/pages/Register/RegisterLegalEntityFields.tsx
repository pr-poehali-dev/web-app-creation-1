import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { FormData, FormErrors } from './types';

interface RegisterLegalEntityFieldsProps {
  formData: FormData;
  errors: FormErrors;
  isSubmitting: boolean;
  onInputChange: (field: keyof FormData, value: string) => void;
  onFetchCompanyData?: (inn: string) => void;
  isFetchingCompany?: boolean;
}

export default function RegisterLegalEntityFields({
  formData,
  errors,
  isSubmitting,
  onInputChange,
  onFetchCompanyData,
  isFetchingCompany = false,
}: RegisterLegalEntityFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="companyName">Полное наименование организации <span className="text-destructive">*</span></Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => onInputChange('companyName', e.target.value)}
          className={errors.companyName ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="inn">ИНН (10 цифр) <span className="text-destructive">*</span></Label>
        <div className="flex gap-2">
          <Input
            id="inn"
            value={formData.inn}
            onChange={(e) => onInputChange('inn', e.target.value)}
            maxLength={10}
            placeholder="Введите ИНН организации"
            className={errors.inn ? 'border-destructive' : ''}
            disabled={isSubmitting || isFetchingCompany}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onFetchCompanyData?.(formData.inn)}
            disabled={isSubmitting || isFetchingCompany || formData.inn.length !== 10}
            title="Загрузить данные организации по ИНН"
          >
            {isFetchingCompany ? (
              <Icon name="Loader2" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon name="Search" className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.inn && <p className="text-sm text-destructive">{errors.inn}</p>}
        {!errors.inn && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Icon name="Info" className="h-3 w-3" />
            Введите ИНН и нажмите на кнопку поиска — данные организации заполнятся автоматически
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ogrnLegal">ОГРН (13 цифр) <span className="text-destructive">*</span></Label>
        <Input
          id="ogrnLegal"
          value={formData.ogrnLegal}
          onChange={(e) => onInputChange('ogrnLegal', e.target.value)}
          maxLength={13}
          className={errors.ogrnLegal ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.ogrnLegal && <p className="text-sm text-destructive">{errors.ogrnLegal}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="directorName">ФИО руководителя <span className="text-destructive">*</span></Label>
        <Input
          id="directorName"
          value={formData.directorName}
          onChange={(e) => onInputChange('directorName', e.target.value)}
          className={errors.directorName ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.directorName && <p className="text-sm text-destructive">{errors.directorName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="legalAddress">Юридический адрес <span className="text-destructive">*</span></Label>
        <Input
          id="legalAddress"
          value={formData.legalAddress}
          onChange={(e) => onInputChange('legalAddress', e.target.value)}
          className={errors.legalAddress ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.legalAddress && <p className="text-sm text-destructive">{errors.legalAddress}</p>}
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="text-sm font-medium mb-4">Контактное лицо</h3>

        <div className="space-y-2">
          <Label htmlFor="lastName">Фамилия <span className="text-destructive">*</span></Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            placeholder="Фамилия контактного лица"
            className={errors.lastName ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">Имя <span className="text-destructive">*</span></Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            placeholder="Имя контактного лица"
            className={errors.firstName ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName">Отчество</Label>
          <Input
            id="middleName"
            value={formData.middleName}
            onChange={(e) => onInputChange('middleName', e.target.value)}
            placeholder="Отчество контактного лица"
            className={errors.middleName ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.middleName && <p className="text-sm text-destructive">{errors.middleName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Должность</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => onInputChange('position', e.target.value)}
            placeholder="Должность контактного лица"
            className={errors.position ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
        </div>
      </div>
    </>
  );
}
