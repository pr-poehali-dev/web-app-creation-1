interface User {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  userType: string;
  phone: string;
  companyName?: string;
  inn?: string;
  ogrnip?: string;
  ogrn?: string;
  position?: string;
  directorName?: string;
  legalAddress?: string;
  createdAt?: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  locked_until?: string;
}

const API_URL = 'https://functions.poehali.dev/fbbc018c-3522-4d56-bbb3-1ba113a4d213';
const SESSION_STORAGE_KEY = 'currentUser';

export const registerUser = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  userType: string;
  phone: string;
  companyName?: string;
  inn?: string;
  ogrnip?: string;
  ogrnLegal?: string;
  position?: string;
  directorName?: string;
  legalAddress?: string;
}): Promise<AuthResponse> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        ...userData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Ошибка регистрации',
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Ошибка соединения с сервером',
    };
  }
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 423) {
        return {
          success: false,
          error: data.error,
          locked_until: data.locked_until,
        };
      }
      return {
        success: false,
        error: data.error || 'Ошибка входа',
      };
    }

    if (data.success && data.user) {
      saveSession(data.user);
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Ошибка соединения с сервером',
    };
  }
};

export const saveSession = (user: User): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const getSession = (): User | null => {
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
    localStorage.removeItem('rememberMeCredentials');
    localStorage.removeItem('lastLoginEmail');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const isEmailRegistered = async (email: string): Promise<boolean> => {
  return false;
};

export const updateUser = (updatedUser: User): boolean => {
  try {
    const currentUser = getSession();
    if (!currentUser) {
      return false;
    }
    
    const mergedUser = { ...currentUser, ...updatedUser };
    saveSession(mergedUser);
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};