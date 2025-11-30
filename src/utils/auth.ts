interface RegisteredUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  userType: string;
  phone: string;
  registeredAt: string;
}

const USERS_STORAGE_KEY = 'registeredUsers';
const DEMO_USER = {
  email: 'demo@example.com',
  password: 'demo123',
  firstName: 'Демо',
  lastName: 'Пользователь',
  userType: 'individual',
  phone: '+7 (999) 999-99-99',
  registeredAt: new Date().toISOString(),
};

export const getRegisteredUsers = (): RegisteredUser[] => {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    const users = stored ? JSON.parse(stored) : [];
    
    const hasDemoUser = users.some((user: RegisteredUser) => user.email === DEMO_USER.email);
    if (!hasDemoUser) {
      users.push(DEMO_USER);
    }
    
    return users;
  } catch (error) {
    console.error('Error reading users from localStorage:', error);
    return [DEMO_USER];
  }
};

export const saveUser = (user: RegisteredUser): boolean => {
  try {
    const users = getRegisteredUsers();
    
    const existingUser = users.find((u) => u.email === user.email);
    if (existingUser) {
      return false;
    }
    
    users.push(user);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
    return false;
  }
};

export const authenticateUser = (email: string, password: string): RegisteredUser | null => {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  return user || null;
};

export const isEmailRegistered = (email: string): boolean => {
  const users = getRegisteredUsers();
  return users.some((u) => u.email === email);
};

const SESSION_STORAGE_KEY = 'currentUser';

export const saveSession = (user: RegisteredUser): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const getSession = (): RegisteredUser | null => {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};