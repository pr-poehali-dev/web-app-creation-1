import { useEffect } from 'react';

const GAMES_MANIFEST = '/manifest-games.json';
const GAMES_APPLE_ICON = '/icons/games-icon-180.png';
const GAMES_FAVICON = '/icons/games-icon-192.png';
const GAMES_TITLE = 'Игровой клуб — Шахматы, Шашки, Покер | ЕРТТП';
const GAMES_APPLE_TITLE = 'Игровой клуб';
const GAMES_THEME_COLOR = '#1a0a2e';

/**
 * Подменяет манифест, favicon, apple-touch-icon, заголовок и apple-mobile-web-app-title
 * пока пользователь находится в разделе /games — чтобы при «Добавить на экран» с телефона
 * игровой клуб получил свой отдельный значок и название, а не общий значок сайта ЕРТТП.
 * При уходе из раздела все теги возвращаются к исходным значениям (используются главным сайтом).
 */
export function useGamesPWAMeta() {
  useEffect(() => {
    const manifestTag = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const appleIconTag = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    const faviconTag = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const appleTitleTag = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    const themeColorTag = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

    const prev = {
      manifest: manifestTag?.getAttribute('href') ?? null,
      appleIcon: appleIconTag?.getAttribute('href') ?? null,
      favicon: faviconTag?.getAttribute('href') ?? null,
      appleTitle: appleTitleTag?.getAttribute('content') ?? null,
      themeColor: themeColorTag?.getAttribute('content') ?? null,
      title: document.title,
    };

    manifestTag?.setAttribute('href', GAMES_MANIFEST);
    appleIconTag?.setAttribute('href', GAMES_APPLE_ICON);
    faviconTag?.setAttribute('href', GAMES_FAVICON);
    appleTitleTag?.setAttribute('content', GAMES_APPLE_TITLE);
    themeColorTag?.setAttribute('content', GAMES_THEME_COLOR);
    document.title = GAMES_TITLE;

    return () => {
      if (prev.manifest !== null) manifestTag?.setAttribute('href', prev.manifest);
      if (prev.appleIcon !== null) appleIconTag?.setAttribute('href', prev.appleIcon);
      if (prev.favicon !== null) faviconTag?.setAttribute('href', prev.favicon);
      if (prev.appleTitle !== null) appleTitleTag?.setAttribute('content', prev.appleTitle);
      if (prev.themeColor !== null) themeColorTag?.setAttribute('content', prev.themeColor);
      document.title = prev.title;
    };
  }, []);
}
