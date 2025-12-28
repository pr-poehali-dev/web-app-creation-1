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
  verificationStatus?: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  locked_until?: string;
}

const SESSION_STORAGE_KEY = 'currentUser';
const USERS_STORAGE_KEY = 'registeredUsers';
const USE_OFFLINE_MODE = true;

const convertUserFromBackend = (backendUser: any): User => {
  const user = {
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
    verificationStatus: backendUser.verification_status || backendUser.verificationStatus,
  };
  
  if (backendUser.role) {
    localStorage.setItem('userRole', backendUser.role);
  }
  
  return user;
};

const initDefaultUsers = () => {
  const defaultUsers = [
    {
      id: 1,
      email: 'doydum-invest@mail.ru',
      password: '123',
      firstName: 'Тест',
      lastName: 'Пользователь',
      middleName: '',
      userType: 'individual',
      phone: '+79999999999',
      createdAt: new Date().toISOString(),
      verificationStatus: 'approved',
      role: 'user'
    }
  ];
  
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
};

const getStoredUsers = (): any[] => {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      return initDefaultUsers();
    }
    return JSON.parse(stored);
  } catch {
    return initDefaultUsers();
  }
};

const saveUserToStorage = (userData: any) => {
  const users = getStoredUsers();
  users.push(userData);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
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
  if (USE_OFFLINE_MODE) {
    const users = getStoredUsers();
    const existingUser = users.find((u: any) => u.email === userData.email);
    
    if (existingUser) {
      return {
        success: false,
        error: 'Пользователь с таким email уже существует',
      };
    }

    const newUser: User = {
      id: users.length + 1,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      middleName: userData.middleName,
      userType: userData.userType,
      phone: userData.phone,
      companyName: userData.companyName,
      inn: userData.inn,
      ogrnip: userData.ogrnip,
      ogrn: userData.ogrnLegal,
      position: userData.position,
      directorName: userData.directorName,
      legalAddress: userData.legalAddress,
      createdAt: new Date().toISOString(),
      verificationStatus: 'pending',
    };

    saveUserToStorage({ ...newUser, password: userData.password });

    return {
      success: true,
      user: newUser,
    };
  }

  return {
    success: false,
    error: 'Сервер временно недоступен',
  };
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  if (USE_OFFLINE_MODE) {
    const users = getStoredUsers();
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      return {
        success: false,
        error: 'Неверный email или пароль',
      };
    }

    const userData: User = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      userType: user.userType,
      phone: user.phone,
      companyName: user.companyName,
      inn: user.inn,
      ogrnip: user.ogrnip,
      ogrn: user.ogrn,
      position: user.position,
      directorName: user.directorName,
      legalAddress: user.legalAddress,
      createdAt: user.createdAt,
      verificationStatus: user.verificationStatus,
    };

    saveSession(userData);
    if (user.role) {
      localStorage.setItem('userRole', user.role);
    }

    return {
      success: true,
      user: userData,
    };
  }

  return {
    success: false,
    error: 'Сервер временно недоступен',
  };
};

export const saveSession = (user: User): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    if (user.id) {
      localStorage.setItem('userId', user.id.toString());
    }
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
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const saveRememberMe = (email: string, password: string): void => {
  try {
    localStorage.setItem('rememberMeEmail', email);
  } catch (error) {
    console.error('Error saving remember me:', error);
  }
};

export const getRememberMe = (): { email: string; password: string } | null => {
  try {
    const email = localStorage.getItem('rememberMeEmail');
    return email ? { email, password: '' } : null;
  } catch (error) {
    console.error('Error reading remember me:', error);
    return null;
  }
};

export const clearRememberMe = (): void => {
  try {
    localStorage.removeItem('rememberMeEmail');
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