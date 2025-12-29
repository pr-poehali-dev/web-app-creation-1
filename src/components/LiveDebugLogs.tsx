import { useState, useEffect, useRef } from 'react';
import { Terminal, X, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'success';
  message: string;
}

export default function LiveDebugLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (level: LogEntry['level'], message: string) => {
    const timestamp = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    });
    setLogs(prev => [...prev, { timestamp, level, message }]);
  };

  useEffect(() => {
    const originalFetch = window.fetch;
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;

    window.fetch = async function(...args) {
      const url = args[0] as string;
      const options = args[1];
      const method = options?.method || 'GET';
      
      addLog('info', `🌐 ${method} ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
      
      try {
        const response = await originalFetch(...args);
        
        if (response.ok) {
          addLog('success', `✅ ${method} ${response.status} - Success`);
        } else {
          addLog('error', `❌ ${method} ${response.status} - ${response.statusText}`);
        }
        
        return response;
      } catch (error: any) {
        addLog('error', `💥 Network Error: ${error.message || 'Failed to fetch'}`);
        throw error;
      }
    };

    console.error = function(...args) {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      if (message.includes('Fetch') || message.includes('fetch') || 
          message.includes('Failed') || message.includes('Error')) {
        addLog('error', `🐛 ${message.substring(0, 200)}`);
      }
      
      originalConsoleError.apply(console, args);
    };

    console.log = function(...args) {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      if (message.includes('Retrying') || message.includes('attempt')) {
        addLog('warn', `⏳ ${message}`);
      }
      
      originalConsoleLog.apply(console, args);
    };

    addLog('info', '🚀 Debug Logger Started');

    return () => {
      window.fetch = originalFetch;
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    };
  }, []);

  useEffect(() => {
    if (!isMinimized) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isMinimized]);

  const clearLogs = () => {
    setLogs([]);
    addLog('info', '🧹 Logs cleared');
  };

  const copyLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    addLog('success', '📋 Logs copied to clipboard');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Open Debug Logs"
      >
        <Terminal className="w-5 h-5" />
      </button>
    );
  }

  const levelColors = {
    info: 'text-blue-400',
    error: 'text-red-400',
    warn: 'text-yellow-400',
    success: 'text-green-400',
  };

  return (
    <div className="fixed bottom-4 right-4 w-[600px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col max-h-[70vh]">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold text-white">Live Debug Logs</span>
          <span className="text-xs text-gray-400">({logs.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 px-2 text-gray-400 hover:text-white"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyLogs}
            className="h-7 px-2 text-gray-400 hover:text-white"
            title="Copy logs"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            className="h-7 px-2 text-gray-400 hover:text-white"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-7 px-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="overflow-y-auto p-3 space-y-1 font-mono text-xs flex-1">
          {logs.map((log, index) => (
            <div key={index} className={`${levelColors[log.level]} flex gap-2`}>
              <span className="text-gray-500 select-none">{log.timestamp}</span>
              <span className="break-all">{log.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}

      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700 rounded-b-lg">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Recording</span>
          </div>
          <span>•</span>
          <span>Monitoring: fetch, console.error, console.log</span>
        </div>
      </div>
    </div>
  );
}
