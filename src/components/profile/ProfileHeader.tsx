import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  userType: string;
  isVerified: boolean;
  companyName?: string;
  getInitials: () => string;
  getUserTypeLabel: (type: string) => string;
}

const shortenCompanyName = (fullName: string): string => {
  const replacements: Record<string, string> = {
    'Общество с ограниченной ответственностью': 'ООО',
    'Общество С Ограниченной Ответственностью': 'ООО',
    'Закрытое акционерное общество': 'ЗАО',
    'Закрытое Акционерное Общество': 'ЗАО',
    'Открытое акционерное общество': 'ОАО',
    'Открытое Акционерное Общество': 'ОАО',
    'Публичное акционерное общество': 'ПАО',
    'Публичное Акционерное Общество': 'ПАО',
    'Акционерное общество': 'АО',
    'Акционерное Общество': 'АО',
    'Индивидуальный предприниматель': 'ИП',
    'Индивидуальный Предприниматель': 'ИП',
  };

  let shortened = fullName;
  for (const [full, short] of Object.entries(replacements)) {
    shortened = shortened.replace(full, short);
  }
  return shortened;
};

export default function ProfileHeader({ 
  firstName, 
  lastName, 
  userType, 
  isVerified, 
  companyName,
  getInitials,
  getUserTypeLabel 
}: ProfileHeaderProps) {
  const isLegalEntity = userType === 'legal-entity';
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
        {getInitials()}
      </div>
      <div>
        {isLegalEntity && companyName ? (
          <>
            <h2 className="text-2xl font-bold">
              {shortenCompanyName(companyName)}
            </h2>
            <p className="text-muted-foreground mt-1">
              {firstName} {lastName}
            </p>
          </>
        ) : (
          <h2 className="text-2xl font-bold">
            {firstName} {lastName}
          </h2>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary">{getUserTypeLabel(userType)}</Badge>
          {isVerified && (
            <Badge variant="default" className="bg-green-500">
              Верифицирован
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}