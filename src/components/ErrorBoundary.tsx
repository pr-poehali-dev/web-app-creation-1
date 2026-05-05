import React, { Component, ErrorInfo, ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isReloading?: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    // Сбрасываем флаг перезагрузки при успешном монтировании
    sessionStorage.removeItem('eb_reloaded');
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    const msg = error?.message || '';
    
    // Пустой объект {} — Radix UI / сторонние библиотеки бросают не-Error
    const isEmptyError = !msg && (!error || Object.keys(error).length === 0);
    
    const isChunkError = msg && (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Unable to preload CSS') ||
      msg.includes('Loading chunk') ||
      msg.includes('ChunkLoadError')
    );
    
    const isHookError = msg && (
      msg.includes('Cannot read properties of null') ||
      msg.includes('Invalid hook call') ||
      msg.includes('Hooks can only be called')
    );
    
    if (isHookError || isEmptyError || isChunkError) {
      const hasAlreadyReloaded = sessionStorage.getItem('eb_reloaded') === '1';
      if (!hasAlreadyReloaded) {
        sessionStorage.setItem('eb_reloaded', '1');
        this.setState({ isReloading: true });
        setTimeout(() => {
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            }).finally(() => window.location.reload());
          } else {
            window.location.reload();
          }
        }, 800);
      }
    }
  }

  handleReset = () => {
    if ('caches' in window) {
      caches.keys().then(names => { names.forEach(name => caches.delete(name)); });
    }
    sessionStorage.removeItem('eb_reloaded');
    window.location.href = '/predlozheniya';
  };

  handleReload = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).finally(() => {
        sessionStorage.removeItem('eb_reloaded');
        window.location.replace(window.location.origin + window.location.pathname + '?_r=' + Date.now());
      });
    } else {
      sessionStorage.removeItem('eb_reloaded');
      window.location.replace(window.location.origin + window.location.pathname + '?_r=' + Date.now());
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const btnBase: React.CSSProperties = {
        display: 'block', width: '100%', padding: '14px 20px',
        borderRadius: '12px', fontSize: '16px', fontWeight: '600',
        cursor: 'pointer', border: 'none', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
        marginBottom: '10px',
      };

      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f1f4f8', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: '360px', width: '100%' }}>
            {this.state.isReloading ? (
              <div>
                <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Перезагрузка...</p>
                <p style={{ color: '#64748b', marginTop: '8px' }}>Очищаем кэш и исправляем проблему</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>😔</div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Что-то пошло не так</h2>
                <p style={{ color: '#64748b', marginBottom: '28px', lineHeight: '1.5' }}>
                  Страница не загрузилась. Нажмите кнопку ниже чтобы вернуться на сайт.
                </p>
                <button
                  onClick={this.handleReset}
                  style={{ ...btnBase, background: '#3b82f6', color: '#fff' }}
                >
                  ← Вернуться на главную
                </button>
                <button
                  onClick={this.handleReload}
                  style={{ ...btnBase, background: '#fff', color: '#1e293b', border: '1.5px solid #e2e8f0' }}
                >
                  Перезагрузить страницу
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ErrorBoundaryWrapper({ children, fallback }: Props) {
  const location = useLocation();
  const boundaryRef = useRef<ErrorBoundary>(null);

  useEffect(() => {
    if (boundaryRef.current?.state.hasError) {
      boundaryRef.current.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  }, [location.pathname]);

  return (
    <ErrorBoundary ref={boundaryRef} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundaryWrapper;