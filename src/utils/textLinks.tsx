import { Link } from 'react-router-dom';

/**
 * Парсит текст и заменяет [[текст|/url]] на ссылки React.
 * Внутренние ссылки (начинающиеся с /) используют Link, внешние — <a target="_blank">.
 */
export function renderTextWithLinks(text: string): React.ReactNode {
  if (!text) return text;

  const LINK_REGEX = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = LINK_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const label = match[1].trim();
    const href = match[2].trim();
    const isInternal = href.startsWith('/');

    parts.push(
      isInternal ? (
        <Link
          key={match.index}
          to={href}
          className="underline underline-offset-2 hover:opacity-70 transition-opacity"
        >
          {label}
        </Link>
      ) : (
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-70 transition-opacity"
        >
          {label}
        </a>
      )
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : parts;
}
