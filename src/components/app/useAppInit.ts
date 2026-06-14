import { useEffect } from "react";
import { getSession } from "@/utils/auth";

export function useAppInit() {
  useEffect(() => {
    const session = getSession();
    if (session) {
      if (session.id) {
        setTimeout(async () => {
          try {
            const response = await fetch(`https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f?id=${session.id}`, {
              headers: { 'X-User-Id': String(session.id) },
            });
            if (response.ok) {
              const data = await response.json();
              const updatedUser = {
                ...session,
                firstName: data.first_name,
                lastName: data.last_name,
                middleName: data.middle_name,
                phone: data.phone,
                companyName: data.company_name,
                inn: data.inn,
                ogrnip: data.ogrnip,
                ogrn: data.ogrn,
                notificationEmail: data.notification_email || session.notificationEmail || '',
                userType: data.user_type || session.userType,
              };
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              window.dispatchEvent(new Event('userSessionChanged'));
            }
          } catch (error) {
            console.log('Background profile sync failed:', error);
          }
        }, 3000);
      }
    }

    if ('serviceWorker' in navigator) {
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }, 4000);

      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data.type === 'SW_UPDATED') {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          } catch { /* ignore */ }
          window.location.reload();
          return;
        }
        if (event.data.type === 'NOTIFICATION_CLICK') {
          const url: string = event.data.url || '/';
          const parsed = new URL(url, window.location.origin);
          const orderId = parsed.searchParams.get('orderId');
          const targetPath = parsed.pathname;
          if (targetPath === '/my-orders' && orderId) {
            if (window.location.pathname === '/my-orders') {
              window.dispatchEvent(new CustomEvent('openOrderChatById', { detail: { orderId } }));
            } else {
              window.location.href = `/my-orders?orderId=${orderId}`;
            }
          } else {
            window.location.href = url;
          }
        }
        if (event.data.type === 'PLAY_NOTIFICATION_SOUND') {
          try {
            const ctx = new AudioContext();
            const now = ctx.currentTime;
            [880, 1100].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain); gain.connect(ctx.destination);
              osc.type = 'sine'; osc.frequency.value = freq;
              gain.gain.setValueAtTime(0, now + i * 0.18);
              gain.gain.linearRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.22);
              osc.start(now + i * 0.18); osc.stop(now + i * 0.18 + 0.25);
            });
            setTimeout(() => ctx.close(), 1000);
          } catch (_e) { /* ignore */ }
        }
        if (event.data.type === 'PLAY_INVITE_RING') {
          try {
            const ctx = new AudioContext();
            if (ctx.state === 'suspended') await ctx.resume();
            const now = ctx.currentTime;
            const pulses = [
              { freq: 880, time: 0 }, { freq: 1100, time: 0.15 },
              { freq: 880, time: 0.45 }, { freq: 1100, time: 0.60 },
              { freq: 880, time: 0.90 }, { freq: 1100, time: 1.05 },
            ];
            pulses.forEach(({ freq, time }) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain); gain.connect(ctx.destination);
              osc.type = 'sine'; osc.frequency.value = freq;
              gain.gain.setValueAtTime(0, now + time);
              gain.gain.linearRampToValueAtTime(0.4, now + time + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.18);
              osc.start(now + time); osc.stop(now + time + 0.22);
            });
            setTimeout(() => ctx.close(), 2000);
          } catch (_e) { /* ignore */ }
        }
      });
    }

    setTimeout(() => {
      try {
        let sid = sessionStorage.getItem('_vsid');
        if (!sid) {
          sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
          sessionStorage.setItem('_vsid', sid);
        }
        const s = getSession() as { id?: number } | null;
        fetch('https://functions.poehali.dev/d6fc7d3f-1215-492d-943f-d1cbf3a44bcf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(s?.id ? { 'X-User-Id': String(s.id) } : {}) },
          body: JSON.stringify({ sessionId: sid, page: window.location.pathname, referrer: document.referrer || undefined }),
        }).catch(() => {});
      } catch { /* ignore */ }
    }, 2000);

    return () => {};
  }, []);
}
