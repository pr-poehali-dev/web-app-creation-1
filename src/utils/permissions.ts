export const checkAccessPermission = (
  isAuthenticated: boolean,
  section: 'offers' | 'requests' | 'auctions' | 'contracts'
): { allowed: boolean; message?: string } => {
  if (!isAuthenticated) {
    return {
      allowed: false,
      message: 'Для доступа к этому разделу необходимо войти в систему',
    };
  }

  if (section === 'auctions') {
    return {
      allowed: false,
      message: 'Раздел "Аукцион" временно недоступен',
    };
  }

  if (section === 'contracts') {
    return {
      allowed: false,
      message: 'Раздел "Контракты" временно недоступен',
    };
  }

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
