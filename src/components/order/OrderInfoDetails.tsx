import Icon from '@/components/ui/icon';
import type { Order } from '@/types/order';
import { getOrderRoles } from '@/utils/orderRoles';

interface OrderInfoDetailsProps {
  order: Order;
  isBuyer: boolean;
}

export default function OrderInfoDetails({ order, isBuyer }: OrderInfoDetailsProps) {
  const roles = getOrderRoles(order);
  return (
    <>
      <div className="flex items-start gap-3 mb-3">
        {order.offerImageUrl ? (
          <img src={order.offerImageUrl} alt={order.offerTitle} className="w-20 h-20 object-cover rounded" />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded flex items-center justify-center flex-shrink-0">
            <Icon name="Package" className="w-10 h-10 text-primary/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground text-xs">{order.isRequest ? 'Услуга' : 'Товар'}</p>
          <p className="font-medium">{order.offerTitle}</p>
          {isBuyer && order.status === 'new' && (
            <div className="flex items-center gap-1.5 mt-1.5 text-amber-600">
              <Icon name="Clock" className="h-3.5 w-3.5" />
              <p className="text-xs font-medium">Ожидается отклик {roles.counterSeller}</p>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        {order.isRequest && order.buyerComment?.match(/Срок (?:поставки|выполнения): (\d+) дней/) ? (
        <div>
          <p className="text-muted-foreground">Срок выполнения</p>
          <p className="font-medium">{order.buyerComment.match(/Срок (?:поставки|выполнения): (\d+) дней/)?.[1]} дней</p>
        </div>
        ) : (
        <div>
          <p className="text-muted-foreground">Количество</p>
          <div className="flex items-center gap-2">
            <p className="font-medium">{order.quantity} {order.unit}</p>
            {order.originalQuantity && order.originalQuantity !== order.quantity && (
              <span className="text-xs text-muted-foreground line-through">
                {order.originalQuantity} {order.unit}
              </span>
            )}
          </div>
        </div>
        )}
        <div>
          <p className="text-muted-foreground">Сумма</p>
          <p className="font-bold text-primary">
            {(order.counterTotalAmount !== undefined && order.counterTotalAmount !== null 
              ? order.counterTotalAmount 
              : order.totalAmount)?.toLocaleString('ru-RU') || '0'} ₽
          </p>
        </div>
        {order.offerPricePerUnit && order.offerPricePerUnit > 0 && (
          <div>
            <p className="text-muted-foreground">Начальная цена</p>
            <p className="font-medium">{order.offerPricePerUnit?.toLocaleString('ru-RU')} ₽/{order.unit}</p>
          </div>
        )}
        {(order.pricePerUnit ?? 0) > 0 && (
          <div>
            <p className="text-muted-foreground">Конечная цена будет</p>
            <p className="font-medium text-primary">
              {(order.counterPricePerUnit !== undefined && order.counterPricePerUnit !== null 
                ? order.counterPricePerUnit 
                : order.pricePerUnit)?.toLocaleString('ru-RU')} ₽/{order.unit}
            </p>
          </div>
        )}
        {!order.isRequest && order.status !== 'accepted' && order.status !== 'completed' && order.offerAvailableQuantity !== undefined && (
          <div>
            <p className="text-muted-foreground">Доступно</p>
            <p className="font-medium">{order.offerAvailableQuantity} {order.unit}</p>
          </div>
        )}
        {!order.isRequest && (
        <div>
          {order.offerCategory === 'transport' ? (
            <>
              <p className="text-muted-foreground">Маршрут</p>
              <p className="font-medium">
                {order.buyerComment?.match(/Маршрут:\s*([^\n]*)/)?.[1]?.trim() || order.offerTransportRoute || '—'}
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">Способ получения</p>
              <p className="font-medium">
                {order.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}
              </p>
            </>
          )}
        </div>
        )}
        {!order.isRequest && order.offerCategory === 'transport' && order.passengerPickupAddress && (
          <div className="col-span-2">
            <p className="text-muted-foreground">Адрес посадки</p>
            <p className="font-medium flex items-start gap-1.5">
              <Icon name="MapPin" className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              {order.passengerPickupAddress}
            </p>
          </div>
        )}
      </div>

      {order.buyerComment && (() => {
        const educationMatch = order.buyerComment.match(/Образование: ([^\n]*)/);
        const education = educationMatch ? educationMatch[1].trim() : '';
        const cleanComment = order.buyerComment
          .replace(/\n?\n?Прикрепленные файлы:[\s\S]*$/, '')
          .replace(/Срок (?:поставки|выполнения): \d+ дней\.\s*/, '')
          .replace(/Образование: [^\n]*\n?/, '')
          .trim();
        
        const parsedFiles: { url: string; name: string }[] = [];
        if ((!order.attachments || order.attachments.length === 0) && order.buyerComment.includes('Прикрепленные файлы:')) {
          const urlMatches = order.buyerComment.match(/https?:\/\/[^\s]+/g);
          if (urlMatches) {
            urlMatches.forEach(url => {
              const fileName = url.split('/').pop() || 'Файл';
              parsedFiles.push({ url, name: fileName });
            });
          }
        }
        
        const allFiles = (order.attachments && order.attachments.length > 0) ? order.attachments : parsedFiles;
        
        return (
          <>
            {education && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Образование</p>
                <p className="font-medium">{education}</p>
              </div>
            )}
            {cleanComment && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">{order.isRequest ? 'Комментарий к отклику' : 'Комментарий покупателя'}</p>
                <p className="font-medium whitespace-pre-line">{cleanComment}</p>
              </div>
            )}
            {allFiles.length > 0 && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-2">Прикрепленные файлы</p>
                <div className="space-y-2">
                  {allFiles.map((file, index) => {
                    const isImage = file.url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
                    return (
                      <div key={index}>
                        {isImage ? (
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="block group">
                            <img src={file.url} alt={file.name} className="w-full max-w-[200px] rounded border object-cover group-hover:opacity-90 transition-opacity" />
                            <span className="text-xs text-primary hover:underline mt-0.5 inline-flex items-center gap-1">
                              <Icon name="ExternalLink" className="h-3 w-3" />
                              {file.name}
                            </span>
                          </a>
                        ) : (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline bg-muted px-3 py-2 rounded hover:bg-muted/80 transition-colors"
                          >
                            <Icon name="FileText" className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate flex-1">{file.name}</span>
                            <Icon name="ExternalLink" className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </>
  );
}