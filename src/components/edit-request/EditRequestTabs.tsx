import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RequestInfoTab from './RequestInfoTab';
import RequestResponsesTab from './RequestResponsesTab';
import type { Request } from '@/types/offer';

interface ResponseOrder {
  id: string;
  sellerName?: string;
  buyerName?: string;
  status: string;
  totalAmount?: number;
  counterTotalAmount?: number;
  transportPrice?: number;
}

interface EditRequestTabsProps {
  request: Request;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDelete: () => void;
  onUpdate?: (updated: Request) => void;
  orders?: ResponseOrder[];
}

export default function EditRequestTabs({
  request,
  activeTab,
  onTabChange,
  onDelete,
  onUpdate,
  orders = [],
}: EditRequestTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} defaultValue="info">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="info">Информация</TabsTrigger>
        <TabsTrigger value="responses">
          Отклики {orders.length > 0 && `(${orders.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <RequestInfoTab
          request={request}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      </TabsContent>

      <TabsContent value="responses">
        <RequestResponsesTab orders={orders} />
      </TabsContent>
    </Tabs>
  );
}
