import { subscribePush, type AssistantTask } from './assistantApi';
import { PUBLIC_VAPID_KEY, urlBase64ToUint8Array } from './pushKey';

const PUSH_FLAG = 'assistant_push_on';

const timers = new Map<number, ReturnType<typeof setTimeout>>();
const MAX_DELAY_MS = 24 * 60 * 60 * 1000;

// Включает уведомления и push-подписку: напоминания придут, даже если приложение закрыто
export const ensureReminderPermission = async (): Promise<void> => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'));
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
    }
    await subscribePush(sub.toJSON());
    localStorage.setItem(PUSH_FLAG, '1');
  } catch {
    localStorage.removeItem(PUSH_FLAG);
  }
};

const showReminder = async (title: string): Promise<void> => {
  const body = 'Пора заняться этим делом';
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && Notification.permission === 'granted') {
        await reg.showNotification(`Ассистент: ${title}`, { body, icon: '/favicon.png', tag: `task-${title}` });
        return;
      }
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Ассистент: ${title}`, { body, icon: '/favicon.png' });
    }
  } catch {
    // уведомление не показалось — ничего страшного, дело остаётся в списке
  }
};

export const scheduleReminders = (tasks: AssistantTask[]): void => {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  // если включён push, напоминание придёт с сервера — локальные таймеры не нужны, чтобы не дублировать
  if (localStorage.getItem(PUSH_FLAG) === '1' && 'Notification' in window && Notification.permission === 'granted') return;
  const now = Date.now();
  tasks.forEach((task) => {
    if (task.done || !task.due_at) return;
    const due = new Date(task.due_at.replace(' ', 'T')).getTime();
    if (isNaN(due)) return;
    const delay = due - now;
    if (delay <= 0 || delay > MAX_DELAY_MS) return;
    timers.set(task.id, setTimeout(() => showReminder(task.title), delay));
  });
};
