import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  userType: string;
  isVerified: boolean;
  companyName?: string;
  directorName?: string;
  getInitials: () => string;
  getUserTypeLabel: (type: string) => string;
}

const shortenCompanyName = (fullName: string): string => {
  if (!fullName) return fullName;
  
  const replacements: Array<[RegExp, string]> = [
    [/Общество\s+с\s+ограниченной\s+ответственностью\s*/gi, 'ООО '],
    [/ОБЩЕСТВО\s+С\s+ОГРАНИЧЕННОЙ\s+ОТВЕТСТВЕННОСТЬЮ\s*/g, 'ООО '],
    [/Закрытое\s+акционерное\s+общество\s*/gi, 'ЗАО '],
    [/Открытое\s+акционерное\s+общество\s*/gi, 'ОАО '],
    [/Публичное\s+акционерное\s+общество\s*/gi, 'ПАО '],
    [/Акционерное\s+общество\s*/gi, 'АО '],
    [/Индивидуальный\s+предприниматель\s*/gi, 'ИП '],
  ];

  let shortened = fullName.trim();
  for (const [pattern, short] of replacements) {
    shortened = shortened.replace(pattern, short);
  }
  return shortened.trim();
};

export default function ProfileHeader({ 
  firstName, 
  lastName, 
  userType, 
  isVerified, 
  companyName,
  directorName,
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
              <span className="text-xs uppercase tracking-wide">Руководитель:</span> {directorName || 'Не указан'}
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