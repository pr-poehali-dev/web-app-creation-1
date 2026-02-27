import { useEffect } from "react";

interface PageSeoProps {
  title: string;
  description?: string;
}

const PageSeo = ({ title, description }: PageSeoProps) => {
  useEffect(() => {
    const fullTitle = `${title} — ЕРТТП`;
    document.title = fullTitle;

    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", fullTitle);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", description);
    }

    return () => {
      document.title = "ЕРТТП — Единая Региональная Товарно-Торговая Площадка";
    };
  }, [title, description]);

  return null;
};

export default PageSeo;
