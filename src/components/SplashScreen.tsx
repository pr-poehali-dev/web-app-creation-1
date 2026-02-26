const SplashScreen = () => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#5b21b6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      gap: '28px',
    }}>
      <div style={{
        width: 96,
        height: 96,
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        <img
          src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/e1c0f181-5b6f-416b-ae31-451c7283fb5a.png"
          alt="ЕРТТП"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <span style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 'clamp(24px, 7vw, 42px)',
        fontWeight: 900,
        color: 'rgba(255,255,255,0.95)',
        letterSpacing: '0.12em',
        textAlign: 'center',
        padding: '0 24px',
      }}>
        С НАМИ УСПЕХ
      </span>
    </div>
  );
};

export default SplashScreen;
