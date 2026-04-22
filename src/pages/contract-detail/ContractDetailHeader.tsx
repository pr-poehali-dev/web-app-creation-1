import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Contract } from './useContractDetail';

interface ContractDetailHeaderProps {
  contract: Contract;
  isSeller: boolean;
  isBarter: boolean;
  canDelete: boolean;
  isAuthenticated: boolean;
  alreadyResponded: boolean;
  onDelete: () => void;
  onRespond: () => void;
  onNegotiate: () => void;
  onGuestRespond: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Открыт',
  draft: 'Черновик',
  in_progress: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  open: 'default',
  draft: 'secondary',
  in_progress: 'secondary',
  completed: 'outline',
  cancelled: 'outline',
};

export default function ContractDetailHeader({
  contract,
  isSeller,
  isBarter,
  canDelete,
  isAuthenticated,
  alreadyResponded,
  onDelete,
  onRespond,
  onNegotiate,
  onGuestRespond,
}: ContractDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">{isBarter ? 'Бартер' : 'Форвард'}</Badge>
          <Badge variant={STATUS_VARIANTS[contract.status] || 'default'}>
            {STATUS_LABELS[contract.status] || contract.status}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold">{contract.title}</h1>
        {contract.description && (
          <p className="text-muted-foreground mt-1">{contract.description}</p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        {canDelete && (
          <Button variant="outline" onClick={() => navigate(`/edit-contract/${contract.id}`)}>
            <Icon name="Pencil" className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
        )}
        {canDelete && (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Icon name="Trash2" className="h-4 w-4" />
          </Button>
        )}
        {!isSeller && contract.status === 'open' && (
          !isAuthenticated ? (
            <Button onClick={onGuestRespond}>
              <Icon name="Send" className="mr-2 h-4 w-4" />
              Откликнуться
            </Button>
          ) : alreadyResponded ? (
            <Button variant="default" onClick={onNegotiate}>
              <Icon name="MessageSquare" className="mr-2 h-4 w-4" />
              Переговоры
            </Button>
          ) : (
            <Button onClick={onRespond}>
              <Icon name="Send" className="mr-2 h-4 w-4" />
              Откликнуться
            </Button>
          )
        )}
      </div>
    </div>
  );
}
