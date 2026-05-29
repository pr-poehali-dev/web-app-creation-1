import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ContractPreviewModalProps {
  html: string;
  onClose: () => void;
}

export default function ContractPreviewModal({ html, onClose }: ContractPreviewModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
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

  // Извлекаем только содержимое <body> из html для вставки в div
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  // Извлекаем стили из <style> тега
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const styles = styleMatch ? styleMatch[1] : '';

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
      {/* Шапка с кнопками */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Шаблон договора</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: 'none',
              background: '#16a34a', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ⬇ Скачать договор
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              border: '1px solid #d1d5db', background: '#fff', color: '#111',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            🖨 Печать / PDF
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              border: '1px solid #d1d5db', background: '#fff', color: '#111',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            ✕ Закрыть
          </button>
        </div>
      </div>

      {/* Содержимое договора — обычный div, не iframe */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: '#f9f9f9',
          padding: '24px',
        }}
      >
        {styles && (
          <style dangerouslySetInnerHTML={{ __html: styles }} />
        )}
        <div
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: bodyContent }}
          style={{
            maxWidth: 820,
            margin: '0 auto',
            background: '#fff',
            padding: '40px 48px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            borderRadius: 4,
          }}
        />
      </div>
    </div>,
    document.body
  );
}
