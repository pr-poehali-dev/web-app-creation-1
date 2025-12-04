export const checkAccessPermission = (
  isAuthenticated: boolean,
  section: 'offers' | 'requests' | 'auctions' | 'contracts'
): { allowed: boolean; message?: string } => {
  return { allowed: true };
};

export const canCreateListing = (isAuthenticated: boolean): { allowed: boolean; message?: string } => {
  if (!isAuthenticated) {
    return {
      allowed: false,
      message: 'Для создания объявлений необходимо войти в систему',
    };
  }

  return { allowed: true };
};