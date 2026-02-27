import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';
import { DISTRICTS } from '@/data/districts';
import type { Request as RequestType } from '@/pages/RequestDetail/useRequestData';

interface TransportRequestDetailProps {
  request: RequestType;
  onResponseClick: () => void;
  onShare: () => void;
  existingResponse?: { orderId: string; status: string } | null;
}

export default function TransportRequestDetail({
  request,
  onResponseClick,
  onShare,
  existingResponse,
}: TransportRequestDetailProps) {
  const navigate = useNavigate();
  const currentUser = getSession();
  const isOwner = currentUser && String(currentUser.id) === String(request.author?.id);

  const isCargo =
    request.transportServiceType === 'cargo' ||
    request.transportServiceType === 'Грузоперевозки';
  const isPassenger =
    request.transportServiceType === 'passenger' ||
    request.transportServiceType === 'Пассажирские перевозки';

  const title = isCargo ? 'Грузоперевозки' : isPassenger ? 'Пассажирские перевозки' : request.title;

  const districtName = DISTRICTS.find(d => d.id === request.district)?.name || request.district;

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Заголовок с иконкой */}
        <div>
          <h1 className="text-xl font-bold mb-1">{title}</h1>
          {(request.description || request.transportComment) && (
            <p className="text-sm text-muted-foreground">
              {request.transportComment || request.description}
            </p>
          )}
        </div>

        <Separator />

        {/* Основные параметры */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {request.transportServiceType && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Тип услуги</p>
              <p className="font-semibold">{request.transportServiceType}</p>
            </div>
          )}
          {request.transportType && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Транспорт</p>
              <p className="font-semibold">{request.transportType}</p>
            </div>
          )}
          {request.transportRoute && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-0.5">Маршрут</p>
              <p className="font-semibold">{request.transportRoute}</p>
            </div>
          )}
          {request.transportCapacity && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">
                {isPassenger ? 'Количество пассажиров' : 'Вместимость'}
              </p>
              <p className="font-semibold">{request.transportCapacity}</p>
            </div>
          )}
          {request.transportDepartureDateTime && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-0.5">Желаемая дата и время выезда</p>
              <p className="font-semibold">
                {new Date(request.transportDepartureDateTime).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
          {request.transportDateTime && !request.transportDepartureDateTime && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-0.5">Дата и время</p>
              <p className="font-semibold">
                {new Date(request.transportDateTime).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>

        {/* Цена */}
        <div className="bg-primary/5 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Стоимость</p>
          {request.transportNegotiable ? (
            <Badge variant="secondary" className="text-sm px-3 py-1">Ваша цена (Торг)</Badge>
          ) : request.transportPrice ? (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {Number(request.transportPrice).toLocaleString('ru-RU')} ₽
              </span>
              {request.transportPriceType && (
                <span className="text-xs text-muted-foreground">{request.transportPriceType}</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Не указана</p>
          )}
        </div>

        {/* Район */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Район</p>
            <div className="flex items-center gap-1">
              <Icon name="MapPin" className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="font-semibold">{districtName}</p>
            </div>
          </div>
          {request.responsesCount !== undefined && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Откликов</p>
              <p className="font-semibold">{request.responsesCount}</p>
            </div>
          )}
        </div>

        {!isPassenger && request.availableDistricts?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Принимаются отклики из районов</p>
            <div className="flex flex-wrap gap-1">
              {request.availableDistricts.map((districtId) => {
                const name = DISTRICTS.find(d => d.id === districtId)?.name || districtId;
                return (
                  <Badge key={districtId} variant="outline" className="text-xs px-2 py-0.5">
                    {name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Дата создания */}
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div>
            <p>Дата создания</p>
            <p className="font-medium text-foreground">
              {new Date(request.createdAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
          {request.expiryDate && (
            <div>
              <p>Срок актуальности</p>
              <p className="font-medium text-foreground">
                {new Date(request.expiryDate).toLocaleDateString('ru-RU')}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Кнопки действий */}
        <div className="space-y-2">
          {isOwner ? (
            <Button
              className="w-full"
              size="lg"
              onClick={() => navigate(`/edit-request/${request.id}`)}
            >
              <Icon name="Edit" className="mr-2 h-4 w-4" />
              Редактировать запрос
            </Button>
          ) : existingResponse ? (
            <Button className="w-full" size="lg" variant="outline" onClick={onResponseClick}>
              <Icon name="Pencil" className="mr-2 h-4 w-4" />
              Редактировать отклик
            </Button>
          ) : (
            <Button className="w-full" size="lg" onClick={onResponseClick}>
              <Icon name="Send" className="mr-2 h-4 w-4" />
              Откликнуться
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={onShare}>
            <Icon name="Share2" className="mr-2 h-4 w-4" />
            Поделиться
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}