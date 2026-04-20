import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getSession, saveSession } from '@/utils/auth';

export interface User {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  userType?: string;
  companyName?: string;
  inn?: string;
  ogrnip?: string;
  ogrn?: string;
  createdAt?: string;
  isVerified?: boolean;
  password?: string;
  role?: string;
  notificationEmail?: string;
}

const profileCache = new Map<string, { data: User; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

export const clearProfileCache = (userId?: string | number) => {
  if (userId) {
    profileCache.delete(String(userId));
  } else {
    profileCache.clear();
  }
};

export const useProfileData = (isAuthenticated: boolean, viewingUserId: string | null) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const sessionUser = getSession();
  const isViewingOwnProfile = !viewingUserId || viewingUserId === String(sessionUser?.id);
  
  const [currentUser, setCurrentUser] = useState<User | null>(sessionUser);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setCurrentUser(cached.data);
      setIsLoadingProfile(false);
      return;
    }

    setIsLoadingProfile(true);
    if (!cached) {
      setCurrentUser(null);
    }
    
    // Читаем сессию свежо в момент запроса
    const freshSession = getSession();
    console.log('[PROFILE] fetchUserProfile userId=', userId, 'freshSession.id=', freshSession?.id);
    
    try {
      const url = `https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f?id=${userId}`;
      const response = await fetch(url, {
        headers: {
          'X-User-Id': String(freshSession?.id || 'anonymous'),
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PROFILE] Backend error:', response.status, errorText);
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
      
      const data = await response.json();
      
      const userData = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        middleName: data.middle_name,
        companyName: data.company_name,
        userType: data.user_type,
        phone: data.phone,
        inn: data.inn,
        ogrnip: data.ogrnip,
        ogrn: data.ogrn,
        createdAt: data.created_at,
        isVerified: false,
        notificationEmail: data.notification_email || '',
      };
      
      profileCache.set(userId, { data: userData, timestamp: Date.now() });
      setCurrentUser(userData);
      
      // Если это собственный профиль, обновляем localStorage
      if (userId === String(freshSession?.id)) {
        saveSession(userData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Ошибка загрузки профиля',
        description: error instanceof Error ? error.message : 'Не удалось загрузить данные',
        variant: 'destructive',
      });
      // Не делаем navigate(-1) — показываем данные из сессии если они есть
      const fallback = getSession();
      if (fallback) {
        setCurrentUser(fallback);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Читаем сессию свежо в момент эффекта
    const session = getSession();
    console.log('[PROFILE] useEffect session=', session?.id, 'viewingUserId=', viewingUserId, 'isAuthenticated=', isAuthenticated);
    
    if (viewingUserId && viewingUserId !== String(session?.id)) {
      fetchUserProfile(viewingUserId);
    } else if (session?.id) {
      fetchUserProfile(String(session.id));
    } else {
      console.log('[PROFILE] No session.id — showing session data directly');
      setCurrentUser(session);
      setIsLoadingProfile(false);
    }
  }, [viewingUserId, isAuthenticated]);

  return {
    currentUser,
    setCurrentUser,
    isLoadingProfile,
    isViewingOwnProfile,
  };
};