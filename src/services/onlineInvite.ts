const INVITE_URL = 'https://functions.poehali.dev/a2c4ab26-756f-4a09-af41-a5589a8ff2c2';

export interface Invitation {
  id: number;
  orderId: string;
  senderId: number;
  senderName: string;
  offerTitle: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export async function sendInvitation(
  senderId: number,
  recipientId: number,
  orderId: string
): Promise<number | null> {
  try {
    const res = await fetch(INVITE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', senderId, recipientId, orderId }),
    });
    if (!res.ok) {
      console.error('[INVITE] send failed:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    console.log('[INVITE] sent, invitationId=', data.invitationId);
    return data.invitationId ?? null;
  } catch (e) {
    console.error('[INVITE] send error:', e);
    return null;
  }
}

export async function respondToInvitation(
  invitationId: number,
  recipientId: number,
  response: 'accepted' | 'declined'
): Promise<{ orderId: string } | null> {
  try {
    const res = await fetch(INVITE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'respond', invitationId, recipientId, response }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('[INVITE] respond error:', e);
    return null;
  }
}

export async function pollIncoming(userId: number): Promise<Invitation | null> {
  try {
    const res = await fetch(`${INVITE_URL}?action=poll&userId=${userId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.invitation ?? null;
  } catch (e) {
    return null;
  }
}

export async function checkOnline(userId: number): Promise<boolean> {
  try {
    const res = await fetch(`${INVITE_URL}?action=check-online&userId=${userId}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.online === true;
  } catch (_e) {
    return false;
  }
}

export async function pollSentStatus(
  invitationId: number,
  senderId: number
): Promise<{ status: string; recipientName: string; orderId: string } | null> {
  try {
    const res = await fetch(`${INVITE_URL}?action=status&invitationId=${invitationId}&senderId=${senderId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}