export function validateINN(inn: string): { isValid: boolean; error?: string } {
  const cleaned = inn.replace(/\D/g, '');
  
  if (cleaned.length === 0) {
    return { isValid: false };
  }
  
  if (cleaned.length === 10) {
    const checksum = (
      2 * Number(cleaned[0]) + 
      4 * Number(cleaned[1]) + 
      10 * Number(cleaned[2]) + 
      3 * Number(cleaned[3]) + 
      5 * Number(cleaned[4]) + 
      9 * Number(cleaned[5]) + 
      4 * Number(cleaned[6]) + 
      6 * Number(cleaned[7]) + 
      8 * Number(cleaned[8])
    ) % 11 % 10;
    
    if (checksum !== Number(cleaned[9])) {
      return { isValid: false, error: 'Неверная контрольная сумма ИНН' };
    }
    return { isValid: true };
  }
  
  if (cleaned.length === 12) {
    const checksum1 = (
      7 * Number(cleaned[0]) + 
      2 * Number(cleaned[1]) + 
      4 * Number(cleaned[2]) + 
      10 * Number(cleaned[3]) + 
      3 * Number(cleaned[4]) + 
      5 * Number(cleaned[5]) + 
      9 * Number(cleaned[6]) + 
      4 * Number(cleaned[7]) + 
      6 * Number(cleaned[8]) + 
      8 * Number(cleaned[9])
    ) % 11 % 10;
    
    const checksum2 = (
      3 * Number(cleaned[0]) + 
      7 * Number(cleaned[1]) + 
      2 * Number(cleaned[2]) + 
      4 * Number(cleaned[3]) + 
      10 * Number(cleaned[4]) + 
      3 * Number(cleaned[5]) + 
      5 * Number(cleaned[6]) + 
      9 * Number(cleaned[7]) + 
      4 * Number(cleaned[8]) + 
      6 * Number(cleaned[9]) + 
      8 * Number(cleaned[10])
    ) % 11 % 10;
    
    if (checksum1 !== Number(cleaned[10]) || checksum2 !== Number(cleaned[11])) {
      return { isValid: false, error: 'Неверная контрольная сумма ИНН' };
    }
    return { isValid: true };
  }
  
  return { 
    isValid: false, 
    error: cleaned.length < 10 
      ? `ИНН должен содержать 10 или 12 цифр (введено ${cleaned.length})` 
      : 'ИНН должен содержать 10 или 12 цифр'
  };
}

export function formatINN(value: string): string {
  return value.replace(/\D/g, '').slice(0, 12);
}
