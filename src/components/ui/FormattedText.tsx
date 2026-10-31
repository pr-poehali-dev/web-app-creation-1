import type { ReactNode } from 'react';

const COLOR_OPEN = /^\{(#[0-9a-fA-F]{6})\|/;

export type FormatNode =
  | { type: 'text'; text: string }
  | { type: 'bold' | 'large'; children: FormatNode[] }
  | { type: 'color'; color: string; children: FormatNode[] };

export function stripFormatting(text: string): string {
  return (text || '')
    .replace(/\{#[0-9a-fA-F]{6}\|/g, '')
    .replace(/\}/g, '')
    .replace(/\*\*/g, '')
    .replace(/\+\+/g, '');
}

export function parseFormatting(s: string): FormatNode[] {
  const nodes: FormatNode[] = [];
  let buf = '';
  let i = 0;

  const flush = () => {
    if (buf) {
      nodes.push({ type: 'text', text: buf });
      buf = '';
    }
  };

  while (i < s.length) {
    if (s.startsWith('**', i)) {
      const end = s.indexOf('**', i + 2);
      if (end > i + 2) {
        flush();
        nodes.push({ type: 'bold', children: parseFormatting(s.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (s.startsWith('++', i)) {
      const end = s.indexOf('++', i + 2);
      if (end > i + 2) {
        flush();
        nodes.push({ type: 'large', children: parseFormatting(s.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (s[i] === '{') {
      const m = COLOR_OPEN.exec(s.slice(i, i + 9));
      if (m) {
        const end = s.indexOf('}', i + m[0].length);
        if (end > i + m[0].length) {
          flush();
          nodes.push({ type: 'color', color: m[1], children: parseFormatting(s.slice(i + m[0].length, end)) });
          i = end + 1;
          continue;
        }
      }
    }
    buf += s[i];
    i += 1;
  }
  flush();
  return nodes;
}

function renderNodes(nodes: FormatNode[], key: string): ReactNode[] {
  return nodes.map((n, idx) => {
    const k = `${key}-${idx}`;
    if (n.type === 'text') return <span key={k}>{n.text}</span>;
    if (n.type === 'bold') return <strong key={k} className="font-bold">{renderNodes(n.children, k)}</strong>;
    if (n.type === 'large') {
      return <span key={k} className="text-[1.25em] font-semibold leading-snug">{renderNodes(n.children, k)}</span>;
    }
    return <span key={k} style={{ color: n.type === 'color' ? n.color : undefined }}>{renderNodes(n.children, k)}</span>;
  });
}

interface FormattedTextProps {
  text: string;
  className?: string;
}

export default function FormattedText({ text, className }: FormattedTextProps) {
  return <span className={className}>{renderNodes(parseFormatting(text || ''), 'f')}</span>;
}