const SplashScreen = () => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#5b21b6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
    }}>
      <span style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 'clamp(28px, 8vw, 52px)',
        fontWeight: 900,
        color: 'rgba(255,255,255,0.95)',
        letterSpacing: '0.12em',
        textAlign: 'center',
        lineHeight: 1.2,
        padding: '0 24px',
      }}>
        С НАМИ УСПЕХ
      </span>
    </div>
  );
};

export default SplashScreen;
