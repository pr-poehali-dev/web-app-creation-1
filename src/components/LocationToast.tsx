import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ToastData {
  type: 'detected' | 'vpn';
  city?: string;
  district?: string;
  region?: string;
  country?: string;
}

export default function LocationToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastData;
      setToast(detail);
      setVisible(true);
      // VPN-уведомление держим дольше — 8 сек, обычное — 5 сек
      const timeout = detail.type === 'vpn' ? 8000 : 5000;
      setTimeout(() => setVisible(false), timeout);
      setTimeout(() => setToast(null), timeout + 400);
    };
    window.addEventListener('locationNotify', handler);
    return () => window.removeEventListener('locationNotify', handler);
  }, []);

  if (!toast) return null;

  const isVpn = toast.type === 'vpn';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        zIndex: 99998,
        width: 'calc(100% - 2rem)',
        maxWidth: '420px',
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      <div
        style={{
          background: isVpn ? '#7f1d1d' : 'var(--card)',
          border: `2px solid ${isVpn ? '#ef4444' : 'hsl(var(--primary) / 0.4)'}`,
          borderRadius: '1rem',
          padding: '0.875rem 1rem',
          boxShadow: '0 20px 40px -8px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <div style={{
          fontSize: '22px',
          lineHeight: 1,
          flexShrink: 0,
          marginTop: '1px',
        }}>
          {isVpn ? '🔒' : '📍'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {isVpn ? (
            <>
              <p style={{
                fontWeight: 700,
                fontSize: '14px',
                color: '#fca5a5',
                margin: 0,
              }}>
                Обнаружен VPN
              </p>
              <p style={{
                fontSize: '13px',
                color: '#fecaca',
                margin: '3px 0 0',
                lineHeight: 1.4,
              }}>
                Для корректного определения региона и районов отключите VPN и обновите страницу
              </p>
            </>
          ) : (
            <>
              <p style={{
                fontWeight: 700,
                fontSize: '14px',
                color: 'var(--foreground)',
                margin: 0,
              }}>
                Регион определён автоматически
              </p>
              <p style={{
                fontSize: '13px',
                color: 'var(--muted-foreground)',
                margin: '3px 0 0',
                lineHeight: 1.4,
              }}>
                {toast.region && <><strong style={{ color: 'var(--foreground)' }}>{toast.region}</strong> · </>}
                {toast.district}
                {toast.city && toast.city !== toast.district && ` · ${toast.city}`}
              </p>
            </>
          )}
        </div>

        <button
          onClick={() => { setVisible(false); setTimeout(() => setToast(null), 400); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: isVpn ? '#fca5a5' : 'var(--muted-foreground)',
            fontSize: '16px',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  );
}
