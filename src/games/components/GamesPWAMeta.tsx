import { useGamesPWAMeta } from '../hooks/useGamesPWAMeta';

// Подключается во все страницы раздела /games — подменяет манифест, favicon,
// apple-touch-icon и заголовок вкладки, чтобы «Добавить на экран» создавало
// отдельный ярлык игрового клуба со своим значком, а не значком сайта ЕРТТП.
export default function GamesPWAMeta() {
  useGamesPWAMeta();
  return null;
}
