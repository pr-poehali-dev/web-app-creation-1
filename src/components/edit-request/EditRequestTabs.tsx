import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RequestInfoTab from './RequestInfoTab';
import type { Request } from '@/types/offer';

interface EditRequestTabsProps {
  request: Request;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDelete: () => void;
  onUpdate?: (updated: Request) => void;
}

export default function EditRequestTabs({
  request,
  activeTab,
  onTabChange,
  onDelete,
  onUpdate,
}: EditRequestTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} defaultValue="info">
      <TabsList className="grid w-full grid-cols-1 mb-6">
        <TabsTrigger value="info">Информация</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <RequestInfoTab 
          request={request} 
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      </TabsContent>
    </Tabs>
  );
}