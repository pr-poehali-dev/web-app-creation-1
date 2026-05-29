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
      className="fixed inset-0 flex flex-col bg-white"
      style={{ zIndex: 99999 }}
    >
      {/* Шапка — единственная, без дублирования */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm flex-shrink-0">
        <span className="font-semibold text-sm text-foreground">Шаблон договора</span>
        <div className="flex items-center gap-2">
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

      {/* Содержимое договора */}
      <iframe
        ref={iframeRef}
        srcDoc={html}
        className="flex-1 w-full border-0"
        title="Шаблон договора"
      />
    </div>,
    document.body
  );
}
