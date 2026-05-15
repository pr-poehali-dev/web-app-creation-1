import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
}

const SITE_NAME = 'ЕРТТП';
const DEFAULT_IMAGE = 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/og-image-1769423236981.png';

export default function SEO({ title, description, keywords, canonical, image }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Единая Региональная Товарно-Торговая Площадка`;
  const url = canonical ? `https://erttp.ru${canonical}` : 'https://erttp.ru';
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ru_RU" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@erttp" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
}