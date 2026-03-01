import React, { Component, ErrorInfo, ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
    
    // Автоматическая перезагрузка при ошибках хуков React — только один раз
    const isHookError = error.message && (
      error.message.includes('Cannot read properties of null') ||
      error.message.includes('Invalid hook call') ||
      error.message.includes('Hooks can only be called')
    );
    
    if (isHookError) {
      // Защита от бесконечного цикла перезагрузок
      const hasAlreadyReloaded = sessionStorage.getItem('eb_reloaded') === '1';
      if (!hasAlreadyReloaded) {
        console.log('Обнаружена ошибка React хуков, выполняется однократная перезагрузка...');
        sessionStorage.setItem('eb_reloaded', '1');
        this.setState({ isReloading: true });
        setTimeout(() => {
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          window.location.reload();
        }, 1000);
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = '/predlozheniya';
  };

  handleReload = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
          <div className="text-center max-w-md space-y-6">
            {this.state.isReloading ? (
              <div className="space-y-4">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <h2 className="text-xl font-semibold">Перезагрузка...</h2>
                <p className="text-muted-foreground">Исправляем проблему</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold">😔</h1>
                  <h2 className="text-2xl font-bold">Что-то пошло не так</h2>
                  <p className="text-muted-foreground">
                    Произошла ошибка при загрузке страницы
                  </p>
                </div>

            {this.state.error && (
              <details className="text-left bg-muted p-4 rounded-lg text-sm">
                <summary className="cursor-pointer font-semibold mb-2">
                  Детали ошибки
                </summary>
                <pre className="overflow-auto text-xs">
                  {this.state.error.message}
                </pre>
              </details>
            )}

                <div className="flex flex-col gap-2">
                  <Button onClick={this.handleReset} className="w-full">
                    Вернуться на главную
                  </Button>
                  <Button onClick={this.handleReload} variant="outline" className="w-full">
                    Перезагрузить страницу
                  </Button>
                </div>
              </>
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