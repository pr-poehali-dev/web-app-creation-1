import { useEffect, useState } from 'react';

const SplashScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="flex flex-col items-center space-y-6 px-4">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-2xl flex items-center justify-center animate-pulse">
            <span className="text-3xl font-bold text-white">B2B</span>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-3xl blur-xl animate-pulse"></div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">ЕРТТП</h1>
          <p className="text-sm text-muted-foreground">Загрузка платформы...</p>
        </div>

        <div className="w-64 bg-muted rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
