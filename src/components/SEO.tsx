import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const SITE_URL = 'https://erttp.ru';
const SITE_NAME = 'ЕРТТП';
const DEFAULT_IMAGE = 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/og-image-1769423236981.png';

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`;
}

export default function SEO({ title, description, keywords, canonical, image, type = 'website', noindex, jsonLd }: SEOProps) {
  const fullTitle = title ? `${clip(title, 60)} | ${SITE_NAME}` : `${SITE_NAME} — Единая Региональная Товарно-Торговая Площадка`;
  const desc = description ? clip(description, 160) : undefined;
  const url = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {desc && <meta name="description" content={desc} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {desc && <meta property="og:description" content={desc} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ru_RU" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@erttp" />
      <meta name="twitter:title" content={fullTitle} />
      {desc && <meta name="twitter:description" content={desc} />}
      <meta name="twitter:image" content={ogImage} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
