import func2url from '../../backend/func2url.json';

async function fetchWithRetry(url: string, options?: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = 1000 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch after retries');
}

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
  reviews?: Array<{
    id: string;
    reviewerId: string;
    reviewerName: string;
    rating: number;
    comment: string;
    createdAt: Date | string;
    offerTitle?: string;
  }>;
  averageRating?: number;
  reviewsCount?: number;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  locked_until?: string;
}

const SESSION_STORAGE_KEY = 'currentUser';
const JWT_TOKEN_KEY = 'jwt_token';
const AUTH_API = func2url.auth;

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
    reviews: backendUser.reviews,
    averageRating: backendUser.average_rating || backendUser.averageRating,
    reviewsCount: backendUser.reviews_count || backendUser.reviewsCount,
  };
  
  if (backendUser.role) {
    localStorage.setItem('userRole', backendUser.role);
  }
  
  if (backendUser.is_root_admin !== undefined) {
    localStorage.setItem('isRootAdmin', backendUser.is_root_admin ? 'true' : 'false');
  }
  
  return user;
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
    const response = await fetchWithRetry(AUTH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        middle_name: userData.middleName,
        user_type: userData.userType,
        phone: userData.phone,
        company_name: userData.companyName,
        inn: userData.inn,
        ogrnip: userData.ogrnip,
        ogrn: userData.ogrnLegal,
        position: userData.position,
        director_name: userData.directorName,
        legal_address: userData.legalAddress,
      }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Ошибка регистрации',
      };
    }

    const user = convertUserFromBackend(data.user);
    const token = data.token;
    return {
      success: true,
      user,
      token,
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
  login: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await fetchWithRetry(AUTH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        login,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Неверный email или пароль',
        locked_until: data.locked_until,
      };
    }

    const user = convertUserFromBackend(data.user);
    const token = data.token;
    saveSession(user, token);

    return {
      success: true,
      user,
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Ошибка соединения с сервером',
    };
  }
};

export const saveSession = (user: User, token?: string): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    if (user.id) {
      localStorage.setItem('userId', user.id.toString());
    }
    if (token) {
      localStorage.setItem(JWT_TOKEN_KEY, token);
    }
    window.dispatchEvent(new Event('userSessionChanged'));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const getJwtToken = (): string | null => {
  try {
    return localStorage.getItem(JWT_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting JWT token:', error);
    return null;
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
    localStorage.removeItem('isRootAdmin');
    localStorage.removeItem(JWT_TOKEN_KEY);
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

    saveSession(updatedUser);
    
    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    console.error('Update user error:', error);
    return {
      success: false,
      error: 'Ошибка обновления данных',
    };
  }
};