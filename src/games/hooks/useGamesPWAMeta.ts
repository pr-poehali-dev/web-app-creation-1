import { useEffect } from 'react';

const GAMES_MANIFEST = '/manifest-games.json';
const GAMES_APPLE_ICON = '/icons/games-icon-180.png';
const GAMES_FAVICON = '/icons/games-icon-192.png';
const GAMES_TITLE = 'Игровой клуб — Шахматы, Шашки, Покер | ЕРТТП';
const GAMES_APPLE_TITLE = 'Игры';
const GAMES_THEME_COLOR = '#1a0a2e';

// Исходные (дефолтные) значения тегов главного сайта ЕРТТП — берутся из index.html.
// Захардкожены намеренно: при прямом заходе на /games инлайн-скрипт в index.html
// подменяет теги ЕЩЁ ДО монтирования React, поэтому на момент монтирования этого хука
// в DOM уже могут быть игровые значения — читать "предыдущее" состояние из DOM нельзя.
const DEFAULT_MANIFEST = '/manifest.json';
const DEFAULT_APPLE_ICON = 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/ac1dbacf-5483-41dc-8ccd-fcd52e894f1b.png';
const DEFAULT_FAVICON = 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/ac1dbacf-5483-41dc-8ccd-fcd52e894f1b.png';
const DEFAULT_APPLE_TITLE = 'ЕРТТП';
const DEFAULT_THEME_COLOR = '#f1f4f8';
const DEFAULT_TITLE = 'ЕРТТП — Единая Региональная Товарно-Торговая Площадка';

/**
 * Подменяет манифест, favicon, apple-touch-icon, заголовок и apple-mobile-web-app-title
 * пока пользователь находится в разделе /games — чтобы при «Добавить на экран» с телефона
 * игровой клуб получил свой отдельный значок и название, а не общий значок сайта ЕРТТП.
 * При уходе из раздела все теги возвращаются к исходным значениям главного сайта.
 */
export function useGamesPWAMeta() {
  useEffect(() => {
    const manifestTag = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const appleIconTag = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    const faviconTag = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const appleTitleTag = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    const themeColorTag = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

    manifestTag?.setAttribute('href', GAMES_MANIFEST);
    appleIconTag?.setAttribute('href', GAMES_APPLE_ICON);
    faviconTag?.setAttribute('href', GAMES_FAVICON);
    appleTitleTag?.setAttribute('content', GAMES_APPLE_TITLE);
    themeColorTag?.setAttribute('content', GAMES_THEME_COLOR);
    document.title = GAMES_TITLE;

    return () => {
      manifestTag?.setAttribute('href', DEFAULT_MANIFEST);
      appleIconTag?.setAttribute('href', DEFAULT_APPLE_ICON);
      faviconTag?.setAttribute('href', DEFAULT_FAVICON);
      appleTitleTag?.setAttribute('content', DEFAULT_APPLE_TITLE);
      themeColorTag?.setAttribute('content', DEFAULT_THEME_COLOR);
      document.title = DEFAULT_TITLE;
    };
  }, []);
}