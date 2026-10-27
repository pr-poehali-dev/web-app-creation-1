import func2url from '../../../backend/func2url.json';

const CANONICAL_ORIGIN = 'https://erttp.ru';
const ogProxy = (): string | undefined => (func2url as Record<string, string>)['og-proxy'];

export const getGamesOrigin = (): string => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  return isLocal ? window.location.origin : CANONICAL_ORIGIN;
};

export const buildInviteUrl = (inviteCode: string): string => `${getGamesOrigin()}/games/invite/${inviteCode}`;
export const buildClubUrl = (): string => `${getGamesOrigin()}/games`;

const SHORT_LETTERS: Record<string, string> = {
  chess: 'c',
  checkers: 's',
  poker: 'p',
  durak: 'd',
  baarys: 'b',
  nardy: 'n',
};

const SHORT_PAGES: Record<string, string> = {
  chess: 'ch',
  checkers: 'sh',
  poker: 'p',
  durak: 'd',
  baarys: 'b',
  nardy: 'n',
};

export const makeShareUrl = (rawUrl: string, _senderNickname?: string, gameType?: string): string => {
  const origin = getGamesOrigin();
  const proxy = ogProxy();
  const invite = rawUrl.match(/\/games\/invite\/([A-Za-z0-9]+)/);
  if (invite && gameType && SHORT_PAGES[gameType]) {
    if (proxy) return `${proxy}?g=${SHORT_LETTERS[gameType] || 'c'}${invite[1]}`;
    return `${origin}/${SHORT_PAGES[gameType]}.html?c=${invite[1]}`;
  }
  if (rawUrl === buildClubUrl()) return proxy ? `${proxy}?g=club` : `${origin}/g.html`;
  return rawUrl;
};

export const shareLink = async (url: string, text: string): Promise<'shared' | 'copied' | 'failed'> => {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Игровой клуб ЕРТТП', text: `${text} ${url}` });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'shared';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
};