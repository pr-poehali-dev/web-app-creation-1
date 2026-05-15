import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
}

const SITE_NAME = 'ЕРТТП';
const DEFAULT_IMAGE = 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/og-image-1769423236981.png';

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

export default function SEO({ title, description, keywords, canonical, image }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Единая Региональная Товарно-Торговая Площадка`;
  const url = canonical ? `https://erttp.ru${canonical}` : 'https://erttp.ru';
  const ogImage = image || DEFAULT_IMAGE;

  useEffect(() => {
    document.title = fullTitle;
    if (description) setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    setMeta('og:site_name', SITE_NAME, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:title', fullTitle, 'property');
    if (description) setMeta('og:description', description, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:locale', 'ru_RU', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    if (description) setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [fullTitle, description, keywords, url, ogImage]);

  return null;
}
