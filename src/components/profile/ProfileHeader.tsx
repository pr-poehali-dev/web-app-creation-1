import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  userType: string;
  isVerified: boolean;
  getInitials: () => string;
  getUserTypeLabel: (type: string) => string;
}

export default function ProfileHeader({ 
  firstName, 
  lastName, 
  userType, 
  isVerified, 
  getInitials,
  getUserTypeLabel 
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
        {getInitials()}
      </div>
      <div>
        <h2 className="text-2xl font-bold">
          {firstName} {lastName}
        </h2>
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
