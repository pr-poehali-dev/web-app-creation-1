import { useState, useEffect } from 'react';

export type UserRole = 'user' | 'moderator' | 'admin';

export function useUserRole() {
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const userRole = localStorage.getItem('userRole');
      if (userRole && ['user', 'moderator', 'admin'].includes(userRole)) {
        setRole(userRole as UserRole);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const isModerator = role === 'moderator' || role === 'admin';
  const isAdmin = role === 'admin';

  return { role, loading, isModerator, isAdmin };
}
