import type { AssistantTask } from './assistantApi';

const timers = new Map<number, ReturnType<typeof setTimeout>>();
const MAX_DELAY_MS = 24 * 60 * 60 * 1000;

export const ensureReminderPermission = async (): Promise<void> => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

const showReminder = async (title: string): Promise<void> => {
  const body = 'Пора заняться этим делом';
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && Notification.permission === 'granted') {
        await reg.showNotification(`Напоминание: ${title}`, { body, icon: '/favicon.png', tag: `task-${title}` });
        return;
      }
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Напоминание: ${title}`, { body, icon: '/favicon.png' });
    }
  } catch {
    // уведомление не показалось — ничего страшного, дело остаётся в списке
  }
};

export const scheduleReminders = (tasks: AssistantTask[]): void => {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
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
