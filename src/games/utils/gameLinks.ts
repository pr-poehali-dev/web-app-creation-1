import func2url from '../../../backend/func2url.json';

const CANONICAL_ORIGIN = 'https://erttp.ru';

export const getGamesOrigin = (): string => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  return isLocal ? window.location.origin : CANONICAL_ORIGIN;
};

export const buildInviteUrl = (inviteCode: string): string => `${getGamesOrigin()}/games/invite/${inviteCode}`;
export const buildClubUrl = (): string => `${getGamesOrigin()}/games`;


export const makeShareUrl = async (rawUrl: string, senderNickname?: string): Promise<string> => {
  const url = senderNickname ? `${rawUrl}?from=${encodeURIComponent(senderNickname)}` : rawUrl;
  const base = (func2url as Record<string, string>)['short-url'];
  if (!base || !url.startsWith(CANONICAL_ORIGIN)) return url;
  try {
    const response = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) return url;
    const data = await response.json();
    return data.code ? `${base}?code=${data.code}` : url;
  } catch {
    return url;
  }
};
