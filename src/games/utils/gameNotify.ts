// Отправка push-уведомления сопернику по игровой комнате.
// Использует общий backend push-send, но с префиксом game_ для ID —
// игровые пользователи (game_users) хранятся в push_subscriptions отдельно от users.
import func2url from '../../../backend/func2url.json';

const PUSH_SEND_API = (func2url as Record<string, string>)['push-send'] || '';

const gamePushId = (gameUserId: number) => `game_${gameUserId}`;

// Не даём слать чаще одного уведомления в течение COOLDOWN_MS на комнату —
// защита от спама и случайных повторных нажатий.
const COOLDOWN_MS = 30_000;
const cooldownKey = (roomId: number) => `game_notify_cooldown_${roomId}`;

export const getNotifyCooldownRemaining = (roomId: number): number => {
  const raw = localStorage.getItem(cooldownKey(roomId));
  if (!raw) return 0;
  const elapsed = Date.now() - Number(raw);
  return elapsed >= COOLDOWN_MS ? 0 : Math.ceil((COOLDOWN_MS - elapsed) / 1000);
};

interface NotifyOpponentParams {
  opponentUserId: number;
  roomId: number;
  senderNickname: string;
  gameTitle: string;
}

export const notifyOpponent = async ({
  opponentUserId,
  roomId,
  senderNickname,
  gameTitle,
}: NotifyOpponentParams): Promise<{ success: boolean; error?: string }> => {
  if (!PUSH_SEND_API) {
    return { success: false, error: 'Push-уведомления временно недоступны' };
  }
  if (getNotifyCooldownRemaining(roomId) > 0) {
    return { success: false, error: 'Подождите немного перед повторной отправкой' };
  }

  try {
    const response = await fetch(PUSH_SEND_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: gamePushId(opponentUserId),
        title: `${gameTitle}: ${senderNickname} ждёт вас`,
        message: 'Соперник напоминает, что сейчас ваш ход',
        url: `/games/room/${roomId}`,
        type: 'game_reminder',
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      return { success: false, error: data.error || 'Не удалось отправить уведомление' };
    }
    if (data.sent === 0 && data.total === 0) {
      return { success: false, error: 'У соперника не включены уведомления' };
    }

    localStorage.setItem(cooldownKey(roomId), String(Date.now()));
    return { success: true };
  } catch {
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
};
