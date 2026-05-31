import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ResponseStatus } from './NegotiationTypes';

interface NegotiationHeaderProps {
  contractTitle?: string;
  status: ResponseStatus | null;
  isSeller: boolean;
  isConfirmed: boolean;
  isCancelled: boolean;
  myConfirmed: boolean | undefined;
  otherConfirmed: boolean | undefined;
  otherName: string;
  activeTab: 'chat' | 'preview';
  onTabChange: (tab: 'chat' | 'preview') => void;
}

export default function NegotiationHeader({
  contractTitle,
  status,
  isConfirmed,
  isCancelled,
  myConfirmed,
  otherConfirmed,
  otherName,
  activeTab,
  onTabChange,
}: NegotiationHeaderProps) {
  return (
    <>
      <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b">
        <DialogTitle className="flex items-center gap-2 text-base">
          <Icon name="FileSignature" className="h-4 w-4 text-primary" />
          <span className="truncate">{contractTitle || status?.contract?.title || 'Переговоры по контракту'}</span>
        </DialogTitle>
        {status && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {isConfirmed && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Icon name="CheckCircle" size={12} className="mr-1" />
                Контракт заключён
              </Badge>
            )}
            {isCancelled && <Badge variant="destructive">Отменён</Badge>}
            {!isConfirmed && !isCancelled && (
              <Badge variant="outline">На переговорах</Badge>
            )}
            {!isConfirmed && !isCancelled && (
              <span className="text-xs text-muted-foreground">
                {myConfirmed ? '✓ Вы подтвердили' : '○ Вы не подтвердили'}
                {' · '}
                {otherConfirmed ? `✓ ${otherName} подтвердил(а)` : `○ ${otherName} не подтвердил(а)`}
              </span>
            )}
          </div>
        )}
      </DialogHeader>

      <div className="flex border-b flex-shrink-0">
        <button
          onClick={() => onTabChange('chat')}
          className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'chat' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Icon name="MessageSquare" size={14} />
          Чат
        </button>
        <button
          onClick={() => onTabChange('preview')}
          className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'preview' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Icon name="FileText" size={14} />
          Договор
        </button>
      </div>
    </>
  );
}
