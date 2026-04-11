import { useEffect, useRef } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        <span className="font-semibold text-sm text-foreground">Шаблон договора</span>
        <div className="flex items-center gap-2">
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
      <iframe
        ref={iframeRef}
        srcDoc={html}
        className="flex-1 w-full border-0"
        title="Шаблон договора"
      />
    </div>
  );
}
