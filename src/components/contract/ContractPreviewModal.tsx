import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ContractPreviewModalProps {
  html: string;
  onClose: () => void;
}

export default function ContractPreviewModal({ html, onClose }: ContractPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `Договор_${date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
      }}
    >
      {/* Шапка — z-index выше iframe, pointer-events включены */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>Шаблон договора</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button size="sm" variant="default" onClick={handleDownload} className="gap-1.5">
            <Icon name="Download" size={14} />
            Скачать договор
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
            <Icon name="Printer" size={14} />
            Печать / PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="gap-1.5">
            <Icon name="X" size={16} />
            Закрыть
          </Button>
        </div>
      </div>

      {/* iframe строго под шапкой, не перекрывает её */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          title="Шаблон договора"
        />
      </div>
    </div>,
    document.body
  );
}