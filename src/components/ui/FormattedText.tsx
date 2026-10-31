import { Fragment, type ReactNode } from 'react';

const COLOR_OPEN = /^\{(#[0-9a-fA-F]{6})\|/;

export function stripFormatting(text: string): string {
  return (text || '')
    .replace(/\{#[0-9a-fA-F]{6}\|/g, '')
    .replace(/\}/g, '')
    .replace(/\*\*/g, '')
    .replace(/\+\+/g, '');
}

function parseInline(s: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buf = '';
  let i = 0;
  let n = 0;

  const flush = () => {
    if (buf) {
      nodes.push(<Fragment key={`${keyPrefix}t${n++}`}>{buf}</Fragment>);
      buf = '';
    }
  };

  while (i < s.length) {
    if (s.startsWith('**', i)) {
      const end = s.indexOf('**', i + 2);
      if (end > i + 2) {
        flush();
        nodes.push(
          <strong key={`${keyPrefix}b${n++}`} className="font-bold">
            {parseInline(s.slice(i + 2, end), `${keyPrefix}b${n}-`)}
          </strong>
        );
        i = end + 2;
        continue;
      }
    }
    if (s.startsWith('++', i)) {
      const end = s.indexOf('++', i + 2);
      if (end > i + 2) {
        flush();
        nodes.push(
          <span key={`${keyPrefix}l${n++}`} className="text-[1.25em] font-semibold leading-snug">
            {parseInline(s.slice(i + 2, end), `${keyPrefix}l${n}-`)}
          </span>
        );
        i = end + 2;
        continue;
      }
    }
    if (s[i] === '{') {
      const m = COLOR_OPEN.exec(s.slice(i, i + 12));
      if (m) {
        const end = s.indexOf('}', i + m[0].length);
        if (end > i + m[0].length) {
          flush();
          nodes.push(
            <span key={`${keyPrefix}c${n++}`} style={{ color: m[1] }}>
              {parseInline(s.slice(i + m[0].length, end), `${keyPrefix}c${n}-`)}
            </span>
          );
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

interface FormattedTextProps {
  text: string;
  className?: string;
}

export default function FormattedText({ text, className }: FormattedTextProps) {
  return <span className={className}>{parseInline(text || '', 'f')}</span>;
}
