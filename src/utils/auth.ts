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

const convertUserFromBackend = (backendUser: any): User => {
  return {
    id: backendUser.id,
    email: backendUser.email,
    firstName: backendUser.first_name || backendUser.firstName,
    lastName: backendUser.last_name || backendUser.lastName,
    middleName: backendUser.middle_name || backendUser.middleName,
    userType: backendUser.user_type || backendUser.userType,
    phone: backendUser.phone,
    companyName: backendUser.company_name || backendUser.companyName,
    inn: backendUser.inn,
    ogrnip: backendUser.ogrnip,
    ogrn: backendUser.ogrn,
    position: backendUser.position,
    directorName: backendUser.director_name || backendUser.directorName,
    legalAddress: backendUser.legal_address || backendUser.legalAddress,
    createdAt: backendUser.created_at || backendUser.createdAt,
  };
};

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
      user: data.user ? convertUserFromBackend(data.user) : undefined,
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
      console.log('Auth - Raw user data from backend:', data.user);
      const convertedUser = convertUserFromBackend(data.user);
      console.log('Auth - Converted user data:', convertedUser);
      console.log('Auth - Company name:', convertedUser.companyName);
      saveSession(convertedUser);
      return {
        success: true,
        user: convertedUser,
      };
    }

    return {
      success: true,
      user: data.user ? convertUserFromBackend(data.user) : undefined,
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
    window.dispatchEvent(new Event('userSessionChanged'));
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
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const saveRememberMe = (email: string, password: string): void => {
  try {
    localStorage.setItem('rememberMeCredentials', JSON.stringify({ email, password }));
  } catch (error) {
    console.error('Error saving remember me:', error);
  }
};

export const getRememberMe = (): { email: string; password: string } | null => {
  try {
    const stored = localStorage.getItem('rememberMeCredentials');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading remember me:', error);
    return null;
  }
};

export const clearRememberMe = (): void => {
  try {
    localStorage.removeItem('rememberMeCredentials');
  } catch (error) {
    console.error('Error clearing remember me:', error);
  }
};

export const isEmailRegistered = async (email: string): Promise<boolean> => {
  return false;
};

export const updateUser = async (updatedUser: User): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const currentUser = getSession();
    if (!currentUser) {
      return { success: false, error: 'Пользователь не авторизован' };
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_profile',
        email: currentUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        middleName: updatedUser.middleName,
        phone: updatedUser.phone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Ошибка обновления профиля',
      };
    }

    if (data.success && data.user) {
      const convertedUser = convertUserFromBackend(data.user);
      saveSession(convertedUser);
      return {
        success: true,
        user: convertedUser,
      };
    }

    return { success: false, error: 'Не удалось обновить профиль' };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Ошибка соединения с сервером' };
  }
};