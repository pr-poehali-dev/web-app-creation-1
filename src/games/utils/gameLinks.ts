const CANONICAL_ORIGIN = 'https://erttp.ru';

export const getGamesOrigin = (): string => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  return isLocal ? window.location.origin : CANONICAL_ORIGIN;
};

export const buildInviteUrl = (inviteCode: string): string => `${getGamesOrigin()}/games/invite/${inviteCode}`;
export const buildClubUrl = (): string => `${getGamesOrigin()}/games`;

const SHORT_PAGES: Record<string, string> = {
  chess: 'ch',
  checkers: 'sh',
  poker: 'p',
  durak: 'd',
  baarys: 'b',
};

export const makeShareUrl = async (rawUrl: string, _senderNickname?: string, gameType?: string): Promise<string> => {
  const origin = getGamesOrigin();
  const invite = rawUrl.match(/\/games\/invite\/([A-Za-z0-9]+)/);
  if (invite && gameType && SHORT_PAGES[gameType]) {
    return `${origin}/${SHORT_PAGES[gameType]}.html?c=${invite[1]}`;
  }
  if (rawUrl === buildClubUrl()) return `${origin}/g.html`;
  return rawUrl;
};
