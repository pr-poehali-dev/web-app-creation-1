const CANONICAL_ORIGIN = 'https://erttp.ru';

export const getGamesOrigin = (): string => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  return isLocal ? window.location.origin : CANONICAL_ORIGIN;
};

export const buildInviteUrl = (inviteCode: string): string => `${getGamesOrigin()}/games/invite/${inviteCode}`;
export const buildClubUrl = (): string => `${getGamesOrigin()}/games`;
