import func2url from '../../../backend/func2url.json';

const API = (func2url as Record<string, string>)['ai-assist'] || '';
const TOKEN_KEY = 'assistant_token';
const USER_KEY = 'assistant_user';

export type AssistantMode = 'home' | 'work' | 'study' | 'life';

export interface AssistantUser {
  id: number;
  name: string;
  modes: AssistantMode[];
  about: string;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
}

export interface MemoryFact {
  id: number;
  fact: string;
}

export interface AssistantTask {
  id: number;
  title: string;
  due_at: string | null;
  done: boolean;
}

export const getAssistantToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const getAssistantUser = (): AssistantUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveAssistantSession = (user: AssistantUser, token?: string): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event('assistantSessionChanged'));
};

export const clearAssistantSession = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event('assistantSessionChanged'));
};

export class AssistantApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const call = async <T,>(action: string, payload: Record<string, unknown> = {}): Promise<T> => {
  if (!API) throw new AssistantApiError('Помощник временно недоступен', 0);
  const token = getAssistantToken();
  let response: Response;
  try {
    response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Assistant-Token': token } : {}) },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new AssistantApiError('Нет соединения. Проверьте интернет и попробуйте снова', 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    if (response.status === 401 && token) clearAssistantSession();
    throw new AssistantApiError(data.error || 'Что-то пошло не так', response.status);
  }
  return data as T;
};

export const register = async (name: string, pin: string) => {
  const data = await call<{ user: AssistantUser; token: string }>('register', { name, pin });
  saveAssistantSession(data.user, data.token);
  return data.user;
};

export const login = async (name: string, pin: string) => {
  const data = await call<{ user: AssistantUser; token: string }>('login', { name, pin });
  saveAssistantSession(data.user, data.token);
  return data.user;
};

export const saveProfile = async (modes: AssistantMode[], about: string) => {
  const data = await call<{ user: AssistantUser }>('save_profile', { modes, about });
  saveAssistantSession(data.user);
  return data.user;
};

export const sendMessage = (message: string) =>
  call<{ answer: string; remembered: string | null }>('chat', { message });

export const loadHistory = async () => (await call<{ messages: ChatMessage[] }>('history')).messages;
export const clearHistory = () => call('clear_history');

export const loadMemory = async () => (await call<{ facts: MemoryFact[] }>('memory_list')).facts;
export const addMemory = async (fact: string) => (await call<{ fact: MemoryFact }>('memory_add', { fact })).fact;
export const deleteMemory = (id: number) => call('memory_delete', { id });

export const loadTasks = async () => (await call<{ tasks: AssistantTask[] }>('tasks_list')).tasks;
export const addTask = async (title: string, dueAt?: string) =>
  (await call<{ task: AssistantTask }>('task_add', { title, due_at: dueAt || null })).task;
export const toggleTask = async (id: number) => (await call<{ task: AssistantTask }>('task_toggle', { id })).task;
export const deleteTask = (id: number) => call('task_delete', { id });

export const deleteAccount = async () => {
  await call('delete_account');
  clearAssistantSession();
};

export const MODE_INFO: Record<AssistantMode, { title: string; hint: string; icon: string }> = {
  home: { title: 'Дом и кухня', hint: 'Рецепты, меню, список покупок', icon: 'ChefHat' },
  work: { title: 'Работа', hint: 'Письма, планы, выступления', icon: 'Briefcase' },
  study: { title: 'Учёба', hint: 'Курсовые, конспекты, презентации', icon: 'GraduationCap' },
  life: { title: 'Личное', hint: 'Дела, привычки, распорядок дня', icon: 'Sun' },
};

export const SCENARIOS: Record<AssistantMode, { label: string; prompt: string }[]> = {
  home: [
    { label: 'Что приготовить?', prompt: 'Подскажи, что приготовить на ужин. Спроси, какие продукты у меня есть.' },
    { label: 'Меню на неделю', prompt: 'Составь простое меню на неделю и список покупок.' },
  ],
  work: [
    { label: 'Написать письмо', prompt: 'Помоги написать деловое письмо. Спроси, кому и о чём оно.' },
    { label: 'Текст выступления', prompt: 'Помоги подготовить короткое выступление. Спроси тему и сколько минут.' },
  ],
  study: [
    { label: 'План курсовой', prompt: 'Помоги составить план курсовой работы. Спроси тему и предмет.' },
    { label: 'Конспект темы', prompt: 'Сделай краткий конспект темы. Спроси, какая тема.' },
  ],
  life: [
    { label: 'План на день', prompt: 'Помоги составить план на сегодня. Спроси, какие у меня дела.' },
    { label: 'Как выработать привычку', prompt: 'Подскажи, как выработать полезную привычку. Спроси, какую именно.' },
  ],
};
