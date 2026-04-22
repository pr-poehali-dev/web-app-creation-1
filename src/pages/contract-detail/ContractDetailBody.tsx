import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import ContractDetailInfo from '@/components/contract-detail/ContractDetailInfo';
import ContractDetailResponses from '@/components/contract-detail/ContractDetailResponses';
import { Contract, ResponseItem } from './useContractDetail';

interface ContractDetailBodyProps {
  contract: Contract;
  isBarter: boolean;
  isSeller: boolean;
  isAuthenticated: boolean;
  alreadyResponded: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  responses: ResponseItem[];
  onRefreshResponses: () => void;
  formatDate: (d: string) => string;
  formatPrice: (p: number) => string;
  onGuestRespond: () => void;
  onRespond: () => void;
  onNegotiate: () => void;
}

export default function ContractDetailBody({
  contract,
  isBarter,
  isSeller,
  isAuthenticated,
  alreadyResponded,
  activeTab,
  onTabChange,
  responses,
  onRefreshResponses,
  formatDate,
  formatPrice,
  onGuestRespond,
  onRespond,
  onNegotiate,
}: ContractDetailBodyProps) {
  if (isSeller) {
    return (
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="details" className="flex-1">
            <Icon name="FileText" size={14} className="mr-1.5" />
            Детали
          </TabsTrigger>
          <TabsTrigger value="responses" className="flex-1">
            <Icon name="Users" size={14} className="mr-1.5" />
            Отклики
            {responses.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold min-w-[18px] h-[18px] px-1">
                {responses.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 space-y-6">
          <ContractDetailInfo
            contract={contract}
            isBarter={isBarter}
            formatDate={formatDate}
            formatPrice={formatPrice}
          />
        </TabsContent>

        <TabsContent value="responses" className="mt-4">
          <ContractDetailResponses
            responses={responses}
            isSeller={isSeller}
            contractStatus={contract.status}
            contractTitle={contract.title}
            onRefresh={onRefreshResponses}
          />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <>
      <ContractDetailInfo
        contract={contract}
        isBarter={isBarter}
        formatDate={formatDate}
        formatPrice={formatPrice}
      />

      {contract.status === 'open' && (
        !isAuthenticated ? (
          <Button onClick={onGuestRespond} className="w-full" size="lg">
            <Icon name="Send" className="mr-2 h-4 w-4" />
            Откликнуться на контракт
          </Button>
        ) : alreadyResponded ? (
          <Button className="w-full" size="lg" onClick={onNegotiate}>
            <Icon name="MessageSquare" className="mr-2 h-4 w-4" />
            Перейти на переговоры
          </Button>
        ) : (
          <Button onClick={onRespond} className="w-full" size="lg">
            <Icon name="Send" className="mr-2 h-4 w-4" />
            Откликнуться на контракт
          </Button>
        )
      )}
    </>
  );
}
