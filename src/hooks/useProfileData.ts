import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';

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
}

export const useProfileData = (isAuthenticated: boolean, viewingUserId: string | null) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const sessionUser = getSession();
  const isViewingOwnProfile = !viewingUserId || viewingUserId === String(sessionUser?.id);
  
  const [currentUser, setCurrentUser] = useState<User | null>(sessionUser);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    setIsLoadingProfile(true);
    setCurrentUser(null);
    
    try {
      const url = `https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f?id=${userId}`;
      const response = await fetch(url, {
        headers: {
          'X-User-Id': String(sessionUser?.id || 'anonymous'),
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      
      setCurrentUser({
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
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить профиль пользователя',
        variant: 'destructive',
      });
      navigate(-1);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (viewingUserId && viewingUserId !== String(sessionUser?.id)) {
      fetchUserProfile(viewingUserId);
    } else {
      setCurrentUser(sessionUser);
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
