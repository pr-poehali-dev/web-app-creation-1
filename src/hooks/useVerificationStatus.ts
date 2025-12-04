import { useState, useEffect } from 'react';
import type { VerificationStatus } from '@/types/verification';

export const useVerificationStatus = () => {
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_verified');

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await fetch('https://functions.poehali.dev/1c97f222-fdea-4b59-b941-223ee8bb077b', {
        headers: {
          'X-User-Id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data.verificationStatus);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { verificationStatus, loading, checkVerificationStatus };
};
